/**
 * @file tx_test.c
 * @brief Kiểm tra frame, giới hạn FIFO và các ca ghi qua socket hoặc pipe.
 */
#include "exam/tx.h"

#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define CHECK(condition) do { \
    if (!(condition)) { \
        fprintf(stderr, "line %d: %s\n", __LINE__, #condition); \
        exit(EXIT_FAILURE); \
    } \
} while (0)

/**
 * @brief Tạo frame NET nhỏ để dùng trong các ca kiểm tra queue.
 * @return Frame do bên gọi sở hữu.
 */
static TxFrame encode_object(void) {
    TxFrame frame = {0};
    CHECK(tx_encode(&frame, TX_NET_IPC, "{}", 2) == TX_ENCODED);
    return frame;
}

/** @brief Kiểm tra header đếm byte UTF-8 và độ dài biên của từng kênh. */
static void encoding(void) {
    static const uint8_t json[] = {'"', 0xc3, 0xa9, '"'};
    static const uint8_t expected[] = {0, 0, 0, 4, '"', 0xc3, 0xa9, '"'};
    static uint8_t large[69633];
    TxFrame frame = {0};

    CHECK(tx_encode(&frame, TX_NET_IPC, json, sizeof json) == TX_ENCODED);
    CHECK(frame.len == sizeof expected);
    CHECK(memcmp(frame.data, expected, sizeof expected) == 0);
    CHECK(memcmp(json, expected + 4, sizeof json) == 0);
    tx_frame_free(&frame);
    CHECK(frame.data == NULL && frame.len == 0);

    CHECK(tx_encode(&frame, TX_NET_IPC, large, 1) == TX_INVALID_INPUT);
    CHECK(tx_encode(&frame, TX_NET_IPC, large, 65536) == TX_ENCODED);
    CHECK(frame.len == 65540 && frame.data[1] == 1 && frame.data[2] == 0);
    tx_frame_free(&frame);
    CHECK(tx_encode(&frame, TX_NET_IPC, large, 65537) == TX_INVALID_INPUT);
    CHECK(tx_encode(&frame, TX_BP, large, 69632) == TX_ENCODED);
    CHECK(frame.len == 69636);
    tx_frame_free(&frame);
    CHECK(tx_encode(&frame, TX_BP, large, sizeof large) == TX_INVALID_INPUT);
}

/** @brief Kiểm tra giới hạn số frame, số byte và quyền sở hữu khi enqueue bị từ chối. */
static void queue_limits(void) {
    TxQueue queue = tx_queue_init(3, 18, 6);
    TxFrame control = encode_object();
    TxFrame first = encode_object();
    TxFrame second = encode_object();
    TxFrame excess = encode_object();
    uint8_t *excess_data = excess.data;

    CHECK(tx_enqueue(&queue, &control, TX_CONTROL) == TX_ACCEPTED);
    CHECK(tx_enqueue(&queue, &first, TX_NORMAL) == TX_ACCEPTED);
    CHECK(tx_enqueue(&queue, &second, TX_NORMAL) == TX_ACCEPTED);
    CHECK(first.data == NULL && first.len == 0);
    CHECK(tx_enqueue(&queue, &excess, TX_CONTROL) == TX_FULL);
    CHECK(excess.data == excess_data && excess.len == 6);
    tx_clear(&queue);
    tx_clear(&queue);
    CHECK(!tx_pending(&queue));

    queue = tx_queue_init(4, 18, 6);
    first = encode_object();
    second = encode_object();
    CHECK(tx_enqueue(&queue, &first, TX_NORMAL) == TX_ACCEPTED);
    CHECK(tx_enqueue(&queue, &second, TX_NORMAL) == TX_ACCEPTED);
    CHECK(tx_enqueue(&queue, &excess, TX_NORMAL) == TX_FULL);
    CHECK(tx_enqueue(&queue, &excess, TX_CONTROL) == TX_ACCEPTED);
    first = encode_object();
    CHECK(tx_enqueue(&queue, &first, TX_CONTROL) == TX_FULL);
    CHECK(tx_enqueue(&queue, &first, (TxClass)99) == TX_INVALID_FRAME);
    tx_frame_free(&first);
    tx_clear(&queue);

    queue = tx_queue_init(1, 32, 0);
    first = encode_object();
    second = encode_object();
    CHECK(tx_enqueue(&queue, &first, TX_NORMAL) == TX_ACCEPTED);
    CHECK(tx_enqueue(&queue, &second, TX_CONTROL) == TX_FULL);
    tx_frame_free(&second);
    tx_clear(&queue);
}

/** @brief Kiểm tra gửi tiếp từ offset cũ khi ngân sách cắt giữa header và control vẫn xếp sau. */
static void partial_send(void) {
    static const uint8_t expected[] = {0, 0, 0, 2, '{', '}', 0, 0, 0, 2, '[', ']'};
    uint8_t received[sizeof expected];
    size_t count = 0;
    int sockets[2];
    CHECK(socketpair(AF_UNIX, SOCK_STREAM, 0, sockets) == 0);
    CHECK(fcntl(sockets[0], F_SETFL, O_NONBLOCK) != -1);
    TxQueue queue = tx_queue_init(2, 12, 6);
    TxFrame first = encode_object();
    TxFrame control = {0};
    TxFrame another = encode_object();
    CHECK(tx_encode(&control, TX_NET_IPC, "[]", 2) == TX_ENCODED);
    CHECK(tx_enqueue(&queue, &first, TX_NORMAL) == TX_ACCEPTED);
    CHECK(tx_drain(&queue, sockets[0], 0).status == TX_YIELD);
    TxDrainResult result = tx_drain(&queue, sockets[0], 3);
    CHECK(result.status == TX_YIELD && result.sent == 3 && tx_pending(&queue));
    CHECK(tx_enqueue(&queue, &another, TX_NORMAL) == TX_FULL);
    CHECK(tx_enqueue(&queue, &control, TX_CONTROL) == TX_ACCEPTED);
    result = tx_drain(&queue, sockets[0], 9);
    CHECK(result.status == TX_DRAINED && result.sent == 9 && !tx_pending(&queue));
    close(sockets[0]);

    while (count < sizeof received) {
        ssize_t bytes = read(sockets[1], received + count, sizeof received - count);
        CHECK(bytes > 0);
        count += (size_t)bytes;
    }
    CHECK(memcmp(received, expected, sizeof expected) == 0);
    CHECK(read(sockets[1], received, 1) == 0);
    close(sockets[1]);
    tx_frame_free(&another);
}

/** @brief Dùng bộ đệm gửi nhỏ để tạo ghi thiếu và EAGAIN, rồi đối chiếu byte nhận được. */
static void short_write_on_busy_socket(void) {
    static uint8_t payload[65536];
    static uint8_t received[65540];
    static const uint8_t header[] = {0, 1, 0, 0};
    int sockets[2];
    int send_buffer = 4096;
    size_t count = 0;
    CHECK(socketpair(AF_UNIX, SOCK_STREAM, 0, sockets) == 0);
    CHECK(setsockopt(sockets[0], SOL_SOCKET, SO_SNDBUF, &send_buffer, sizeof send_buffer) == 0);
    CHECK(fcntl(sockets[0], F_SETFL, O_NONBLOCK) != -1);
    for (size_t i = 0; i < sizeof payload; i++) {
        payload[i] = (uint8_t)(i % 251);
    }

    TxQueue queue = tx_queue_init(1, sizeof received, 0);
    TxFrame frame = {0};
    CHECK(tx_encode(&frame, TX_NET_IPC, payload, sizeof payload) == TX_ENCODED);
    CHECK(tx_enqueue(&queue, &frame, TX_NORMAL) == TX_ACCEPTED);
    while (tx_pending(&queue)) {
        TxDrainResult result = tx_drain(&queue, sockets[0], sizeof received);
        CHECK(result.sent > 0 && result.sent <= sizeof received - count);
        if (count == 0) {
            CHECK(result.status == TX_WOULD_BLOCK && result.sent < sizeof received);
        }
        size_t end = count + result.sent;
        while (count < end) {
            ssize_t bytes = read(sockets[1], received + count, end - count);
            CHECK(bytes > 0);
            count += (size_t)bytes;
        }
    }
    CHECK(count == sizeof received);
    CHECK(memcmp(received, header, sizeof header) == 0);
    CHECK(memcmp(received + sizeof header, payload, sizeof payload) == 0);
    close(sockets[0]);
    close(sockets[1]);
}

/** @brief Kiểm tra chờ POLLOUT khi pipe đầy, tắt theo dõi khi queue rỗng và xử lý EPIPE. */
static void blocked_and_closed_pipe(void) {
    int ends[2];
    CHECK(pipe(ends) == 0);
    CHECK(fcntl(ends[1], F_SETFL, O_NONBLOCK) != -1);
    uint8_t filler[4096] = {0};
    while (write(ends[1], filler, sizeof filler) > 0) {
    }
    CHECK(errno == EAGAIN || errno == EWOULDBLOCK);
    while (write(ends[1], filler, 1) > 0) {
    }
    CHECK(errno == EAGAIN || errno == EWOULDBLOCK);

    TxQueue queue = tx_queue_init(1, 6, 0);
    TxFrame frame = encode_object();
    CHECK(tx_enqueue(&queue, &frame, TX_NORMAL) == TX_ACCEPTED);
    TxDrainResult result = tx_drain(&queue, ends[1], 64);
    CHECK(result.status == TX_WOULD_BLOCK && result.sent == 0 && tx_pending(&queue));

    /* Mô phỏng cách reactor cập nhật POLLOUT theo dữ liệu còn chờ trong queue. */
    struct pollfd writer = {.fd = ends[1], .events = tx_pending(&queue) ? POLLOUT : 0};
    CHECK(writer.events == POLLOUT && poll(&writer, 1, 0) == 0);
    CHECK(read(ends[0], filler, sizeof filler) > 0);
    CHECK(poll(&writer, 1, 0) == 1 && (writer.revents & POLLOUT));
    result = tx_drain(&queue, ends[1], 64);
    CHECK(result.status == TX_DRAINED && result.sent == 6 && !tx_pending(&queue));

    /* Giải phóng thêm chỗ để pipe vẫn ghi được khi kiểm tra việc bỏ POLLOUT. */
    CHECK(read(ends[0], filler, sizeof filler) > 0);
    CHECK(poll(&writer, 1, 0) == 1 && (writer.revents & POLLOUT));
    writer.events = tx_pending(&queue) ? POLLOUT : 0;
    CHECK(writer.events == 0 && poll(&writer, 1, 0) == 0);

    frame = encode_object();
    CHECK(tx_enqueue(&queue, &frame, TX_NORMAL) == TX_ACCEPTED);
    close(ends[0]);
    result = tx_drain(&queue, ends[1], 64);
    CHECK(result.status == TX_PEER_ERROR && result.error_number == EPIPE);
    CHECK(result.sent == 0 && tx_pending(&queue));
    tx_clear(&queue);
    CHECK(!tx_pending(&queue));
    close(ends[1]);
}

#ifdef EXAM_TEST_WRAP_WRITE
static int interrupted_fd = -1;
static unsigned int interruptions_left;

ssize_t __real_write(int fd, const void *data, size_t len);

/**
 * @brief Giả lập EINTR ở descriptor của ca kiểm, các lần ghi khác đi qua write thật.
 * @param[in] fd Descriptor cần ghi.
 * @param[in] data Vùng byte cần gửi.
 * @param[in] len Số byte cần ghi.
 * @return Kết quả write thật, hoặc -1 với errno là EINTR khi giả lập ngắt.
 */
ssize_t __wrap_write(int fd, const void *data, size_t len) {
    if (fd == interrupted_fd && interruptions_left > 0) {
        interruptions_left--;
        errno = EINTR;
        return -1;
    }
    return __real_write(fd, data, len);
}

/** @brief Kiểm tra nhường lượt khi bị ngắt liên tiếp và gửi tiếp từ offset cũ. */
static void interrupted_write(void) {
    static const uint8_t expected[] = {0, 0, 0, 2, '{', '}'};
    uint8_t received[sizeof expected];
    int ends[2];
    CHECK(pipe(ends) == 0);
    CHECK(fcntl(ends[1], F_SETFL, O_NONBLOCK) != -1);
    TxQueue queue = tx_queue_init(1, sizeof expected, 0);
    TxFrame frame = encode_object();
    CHECK(tx_enqueue(&queue, &frame, TX_NORMAL) == TX_ACCEPTED);
    TxDrainResult result = tx_drain(&queue, ends[1], 3);
    CHECK(result.status == TX_YIELD && result.sent == 3);

    interrupted_fd = ends[1];
    interruptions_left = 100;
    result = tx_drain(&queue, ends[1], sizeof expected);
    CHECK(result.status == TX_YIELD && result.sent == 0 && tx_pending(&queue));

    interruptions_left = 1;
    result = tx_drain(&queue, ends[1], sizeof expected);
    CHECK(result.status == TX_DRAINED && result.sent == 3 && !tx_pending(&queue));
    CHECK(interruptions_left == 0);
    interrupted_fd = -1;

    close(ends[1]);
    CHECK(read(ends[0], received, sizeof received) == (ssize_t)sizeof received);
    CHECK(memcmp(received, expected, sizeof expected) == 0);
    CHECK(read(ends[0], received, 1) == 0);
    close(ends[0]);
}
#endif

/**
 * @brief Chạy các ca kiểm thử của module TX.
 * @return EXIT_SUCCESS khi tất cả ca kiểm đạt.
 */
int main(void) {
    CHECK(signal(SIGPIPE, SIG_DFL) != SIG_ERR);
    CHECK(tx_ignore_sigpipe() == 0);
    encoding();
    queue_limits();
    partial_send();
    short_write_on_busy_socket();
    blocked_and_closed_pipe();
#ifdef EXAM_TEST_WRAP_WRITE
    interrupted_write();
#endif
    return EXIT_SUCCESS;
}
