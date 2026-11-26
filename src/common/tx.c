/**
 * @file tx.c
 * @brief Đóng gói frame và gửi FIFO có giới hạn qua socket hoặc pipe.
 */
#include "exam/tx.h"

#include <arpa/inet.h>
#include <errno.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

enum {
    HEADER_BYTES = 4,
    NET_IPC_MAX_PAYLOAD = 65536,
    BP_MAX_PAYLOAD = 69632,
    MAX_CONSECUTIVE_INTERRUPTS = 16
};

struct TxEntry {
    TxFrame frame;
    size_t offset;
    TxClass frame_class;
    struct TxEntry *next;
};

/**
 * @brief Đóng gói payload thành frame với header 4 byte theo thứ tự byte mạng.
 * @param[in,out] out Frame rỗng để nhận buffer mới. Giữ nguyên khi trả lỗi.
 * @param[in] channel Kênh dùng để chọn giới hạn payload.
 * @param[in] json Vùng byte UTF-8 của JSON đã được kiểm tra. Hàm chỉ đọc và sao chép.
 * @param[in] len Số byte của payload, không tính header.
 * @retval TX_ENCODED Caller sở hữu buffer mới trong out.
 * @retval TX_INVALID_INPUT Tham số hoặc độ dài payload không hợp lệ.
 * @retval TX_ENCODE_NO_MEMORY Không cấp phát được buffer.
 */
TxEncodeStatus tx_encode(TxFrame *out, TxChannel channel, const void *json, size_t len) {
    if (channel != TX_NET_IPC && channel != TX_BP) {
        return TX_INVALID_INPUT;
    }
    size_t max_payload = channel == TX_BP ? BP_MAX_PAYLOAD : NET_IPC_MAX_PAYLOAD;
    if (out == NULL || out->data != NULL || out->len != 0 || json == NULL ||
        len < 2 || len > max_payload) {
        return TX_INVALID_INPUT;
    }

    uint8_t *data = malloc(HEADER_BYTES + len);
    if (data == NULL) {
        return TX_ENCODE_NO_MEMORY;
    }
    uint32_t network_len = htonl((uint32_t)len);
    memcpy(data, &network_len, HEADER_BYTES);
    memcpy(data + HEADER_BYTES, json, len);
    *out = (TxFrame){.data = data, .len = HEADER_BYTES + len};
    return TX_ENCODED;
}

/**
 * @brief Giải phóng buffer caller đang sở hữu và đặt frame về rỗng.
 * @param[in,out] frame Frame thuộc caller, có thể đang rỗng.
 */
void tx_frame_free(TxFrame *frame) {
    free(frame->data);
    *frame = (TxFrame){0};
}

/**
 * @brief Tạo queue rỗng cho một descriptor có một writer.
 * @param[in] max_frames Tổng số frame tối đa, gồm cả frame đang gửi dở.
 * @param[in] max_bytes Tổng số byte buffer tối đa, gồm cả header.
 * @param[in] control_reserve_bytes Số byte dành cho control, không vượt quá max_bytes.
 * @return Queue rỗng. Hàm khởi tạo chưa cấp phát phần tử FIFO.
 */
TxQueue tx_queue_init(size_t max_frames, size_t max_bytes, size_t control_reserve_bytes) {
    return (TxQueue){
        .max_frames = max_frames,
        .max_bytes = max_bytes,
        .control_reserve_bytes = control_reserve_bytes
    };
}

/**
 * @brief Thêm frame vào cuối FIFO trong giới hạn số frame và số byte.
 * @param[in,out] queue Queue đã khởi tạo.
 * @param[in,out] frame Frame do tx_encode tạo và còn thuộc caller.
 * @param[in] frame_class Loại nội bộ do caller xác định sau khi validate.
 * @retval TX_ACCEPTED Queue nhận buffer và đặt frame của caller về rỗng.
 * @retval TX_FULL Đã chạm giới hạn queue hoặc dung lượng dành cho frame thường.
 * @retval TX_INVALID_FRAME Frame rỗng hoặc ngắn hơn mức tối thiểu, loại frame sai hoặc reserve vượt giới hạn.
 * @retval TX_QUEUE_NO_MEMORY Không cấp phát được phần tử FIFO.
 * @note Khi trả lỗi, queue và quyền sở hữu frame giữ nguyên.
 */
TxEnqueueStatus tx_enqueue(TxQueue *queue, TxFrame *frame, TxClass frame_class) {
    if (frame->data == NULL || frame->len < HEADER_BYTES + 2 ||
        queue->control_reserve_bytes > queue->max_bytes ||
        (frame_class != TX_NORMAL && frame_class != TX_CONTROL)) {
        return TX_INVALID_FRAME;
    }
    /* Chừa byte cho control. Cả hai loại vẫn dùng chung giới hạn tổng của FIFO. */
    size_t normal_limit = queue->max_bytes - queue->control_reserve_bytes;
    if (queue->frame_count >= queue->max_frames || frame->len > queue->max_bytes - queue->bytes ||
        (frame_class == TX_NORMAL && frame->len > normal_limit - queue->normal_bytes)) {
        return TX_FULL;
    }

    struct TxEntry *entry = malloc(sizeof *entry);
    if (entry == NULL) {
        return TX_QUEUE_NO_MEMORY;
    }
    *entry = (struct TxEntry){.frame = *frame, .frame_class = frame_class};
    if (queue->tail != NULL) {
        queue->tail->next = entry;
    } else {
        queue->head = entry;
    }
    queue->tail = entry;
    queue->frame_count++;
    queue->bytes += frame->len;
    if (frame_class == TX_NORMAL) {
        queue->normal_bytes += frame->len;
    }
    *frame = (TxFrame){0};
    return TX_ACCEPTED;
}

/**
 * @brief Kiểm tra còn dữ liệu chờ để vòng poll cập nhật POLLOUT.
 * @param[in] queue Queue đã khởi tạo.
 * @return true nếu còn frame hoặc phần frame đang chờ ghi.
 */
bool tx_pending(const TxQueue *queue) {
    return queue->head != NULL;
}

/**
 * @brief Giải phóng đầu FIFO và trả số byte, số frame mà phần tử này đang giữ.
 * @param[in,out] queue Queue đang có ít nhất một frame.
 */
static void remove_head(TxQueue *queue) {
    struct TxEntry *entry = queue->head;
    queue->head = entry->next;
    if (!tx_pending(queue)) {
        queue->tail = NULL;
    }
    queue->frame_count--;
    queue->bytes -= entry->frame.len;
    if (entry->frame_class == TX_NORMAL) {
        queue->normal_bytes -= entry->frame.len;
    }
    tx_frame_free(&entry->frame);
    free(entry);
}

/**
 * @brief Bỏ qua SIGPIPE để xử lý pipe hoặc socket đã gãy qua lỗi EPIPE.
 * @note Gọi một lần khi khởi động tiến trình, trước khi dùng tx_drain.
 * @return 0 nếu thành công, -1 nếu lỗi và errno được đặt.
 */
int tx_ignore_sigpipe(void) {
    struct sigaction action = {.sa_handler = SIG_IGN};
    if (sigemptyset(&action.sa_mask) == -1) {
        return -1;
    }
    return sigaction(SIGPIPE, &action, NULL);
}

/**
 * @brief Ghi từ đầu FIFO và giữ offset nếu chưa gửi hết frame.
 * @param[in,out] queue Queue đã khởi tạo và chỉ có một writer.
 * @param[in] fd Descriptor nonblocking của socket hoặc pipe.
 * @param[in] byte_budget Số byte tối đa được ghi trong lượt này.
 * @return Tiến độ ghi cùng trạng thái rỗng, chờ ghi, nhường lượt hoặc lỗi.
 * @note TX_WOULD_BLOCK: đợi POLLOUT. TX_YIELD: còn dữ liệu, quay lại ở lượt sau.
 *       TX_PEER_ERROR: bên gọi đóng descriptor và dùng tx_clear để dọn queue.
 */
TxDrainResult tx_drain(TxQueue *queue, int fd, size_t byte_budget) {
    size_t sent = 0;
    unsigned int interrupts = 0;
    while (tx_pending(queue) && sent < byte_budget) {
        struct TxEntry *entry = queue->head;
        size_t remaining = entry->frame.len - entry->offset;
        size_t available = byte_budget - sent;
        size_t to_write = remaining < available ? remaining : available;
        /* POSIX write dùng được cho cả socket đã kết nối và pipe. */
        ssize_t written = write(fd, entry->frame.data + entry->offset, to_write);
        if (written < 0) {
            int error_number = errno;
            if (error_number == EINTR) {
                /* Nhường lượt nếu bị ngắt liên tiếp để poll còn xử lý descriptor khác. */
                if (++interrupts == MAX_CONSECUTIVE_INTERRUPTS) {
                    return (TxDrainResult){sent, TX_YIELD, 0};
                }
                continue;
            }
            if (error_number == EAGAIN || error_number == EWOULDBLOCK) {
                return (TxDrainResult){sent, TX_WOULD_BLOCK, 0};
            }
            return (TxDrainResult){sent, TX_PEER_ERROR, error_number};
        }
        if (written == 0) {
            return (TxDrainResult){sent, TX_PEER_ERROR, EIO};
        }

        interrupts = 0;
        sent += (size_t)written;
        entry->offset += (size_t)written;
        /* Queue còn giữ cả buffer cho tới khi gửi xong byte cuối. */
        if (entry->offset == entry->frame.len) {
            remove_head(queue);
        }
    }
    return (TxDrainResult){sent, tx_pending(queue) ? TX_YIELD : TX_DRAINED, 0};
}

/**
 * @brief Giải phóng các frame còn chờ, gồm cả frame gửi dở, và giữ giới hạn queue.
 * @param[in,out] queue Queue đã khởi tạo, có thể đang rỗng.
 */
void tx_clear(TxQueue *queue) {
    while (tx_pending(queue)) {
        remove_head(queue);
    }
}
