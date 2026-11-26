/**
 * @file rx_test.c
 * @brief Kiểm tra chia/gộp frame, budget, cap và ownership của RX.
 */
#include "exam/rx.h"
#include "exam/tx.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(condition) do { \
    if (!(condition)) { \
        fprintf(stderr, "line %d: %s\n", __LINE__, #condition); \
        exit(EXIT_FAILURE); \
    } \
} while (0)

/** @brief Đối chiếu payload nguyên byte và giải phóng ownership của caller. */
static void expect_frame(RxFrame *frame, const void *bytes, size_t len) {
    CHECK(frame->len == len);
    CHECK(memcmp(frame->data, bytes, len) == 0);
    rx_frame_free(frame);
    CHECK(frame->data == NULL && frame->len == 0);
    rx_frame_free(frame);
}

/** @brief Ghép header 1+3 byte, payload nhiều chunk và input rỗng. */
static void split_frame(void) {
    const uint8_t wire[] = {0, 0, 0, 5, 'h', 'e', 'l', 'l', 'o'};
    RxState state = rx_init(RX_NET_IPC);
    RxFrame frame = {0};
    RxResult result = rx_feed(&state, NULL, 0, &frame, 1);
    CHECK(result.status == RX_OK && result.consumed == 0 && result.frame_count == 0);
    result = rx_feed(&state, wire, 1, &frame, 1);
    CHECK(result.status == RX_NEED_MORE && result.consumed == 1 && result.frame_count == 0);
    CHECK(state.header_used == 1 && state.payload == NULL);
    result = rx_feed(&state, wire + 1, 3, &frame, 1);
    CHECK(result.status == RX_NEED_MORE && result.consumed == 3 && result.frame_count == 0);
    CHECK(state.payload != NULL && state.payload_used == 0);
    result = rx_feed(&state, wire + 4, 2, &frame, 1);
    CHECK(result.status == RX_NEED_MORE && result.frame_count == 0);
    CHECK(state.payload_used == 2);
    result = rx_feed(&state, NULL, 0, &frame, 1);
    CHECK(result.status == RX_NEED_MORE && result.consumed == 0);
    result = rx_feed(&state, wire + 6, 3, &frame, 1);
    CHECK(result.status == RX_OK && result.consumed == 3 && result.frame_count == 1);
    CHECK(state.payload == NULL && state.header_used == 0);
    CHECK(rx_finish(&state) == RX_CLEAN_EOF);
    /* Cleanup state không giải phóng payload đã chuyển cho caller. */
    expect_frame(&frame, "hello", 5);
}

/** @brief Trả hai frame đúng thứ tự và giữ nửa header của frame kế tiếp. */
static void coalesced_frames(void) {
    const uint8_t wire[] = {0, 0, 0, 2, '{', '}', 0, 0, 0, 2, '[', ']', 0, 0};
    const uint8_t tail[] = {0, 2, 'o', 'k'};
    RxState state = rx_init(RX_NET_IPC);
    RxFrame frames[3] = {0};
    RxResult result = rx_feed(&state, wire, sizeof wire, frames, 3);
    CHECK(result.status == RX_NEED_MORE && result.consumed == sizeof wire && result.frame_count == 2);
    CHECK(state.header_used == 2 && state.payload == NULL);
    expect_frame(&frames[0], "{}", 2);
    expect_frame(&frames[1], "[]", 2);
    result = rx_feed(&state, tail, sizeof tail, frames, 3);
    CHECK(result.status == RX_OK && result.frame_count == 1);
    expect_frame(&frames[0], "ok", 2);
    CHECK(rx_finish(&state) == RX_CLEAN_EOF);
}

/** @brief Budget bằng 0/1 không bỏ input; caller feed lại chính xác phần dư. */
static void frame_budget(void) {
    const uint8_t wire[] = {0, 0, 0, 2, '{', '}', 0, 0, 0, 2, '[', ']', 0, 0};
    RxState state = rx_init(RX_NET_IPC);
    RxFrame frame = {0};
    RxResult result = rx_feed(&state, wire, sizeof wire, NULL, 0);
    CHECK(result.status == RX_YIELD && result.consumed == 0 && result.frame_count == 0);
    CHECK(state.header_used == 0 && state.payload == NULL);
    result = rx_feed(&state, wire, sizeof wire, &frame, 1);
    CHECK(result.status == RX_YIELD && result.consumed == 6 && result.frame_count == 1);
    expect_frame(&frame, "{}", 2);
    result = rx_feed(&state, wire + 6, sizeof wire - 6, &frame, 1);
    CHECK(result.status == RX_YIELD && result.consumed == 6 && result.frame_count == 1);
    expect_frame(&frame, "[]", 2);
    result = rx_feed(&state, wire + 12, 2, &frame, 1);
    CHECK(result.status == RX_NEED_MORE && result.consumed == 2 && result.frame_count == 0);
    CHECK(rx_finish(&state) == RX_TRUNCATED);
}

/** @brief Các length sai bị chặn ngay ở header, trước khi có buffer payload. */
static void invalid_lengths(void) {
    const uint32_t lengths[] = {0, 1, 65537, UINT32_MAX};
    for (size_t i = 0; i < sizeof lengths / sizeof lengths[0]; ++i) {
        uint32_t length = lengths[i];
        uint8_t wire[] = {(uint8_t)(length >> 24), (uint8_t)(length >> 16),
                          (uint8_t)(length >> 8), (uint8_t)length, '{', '}'};
        RxState state = rx_init(RX_NET_IPC);
        RxFrame frame = {0};
        RxResult result = rx_feed(&state, wire, sizeof wire, &frame, 1);
        CHECK(result.status == RX_LENGTH_ERROR && result.consumed == 4 && result.frame_count == 0);
        CHECK(state.payload == NULL && state.payload_len == 0 && frame.data == NULL);
        result = rx_feed(&state, wire + 4, 2, &frame, 1);
        CHECK(result.status == RX_LENGTH_ERROR && result.consumed == 0);
        rx_clear(&state);
        rx_clear(&state);
        CHECK(state.max_payload == 65536);
    }
    const uint8_t bp_over[] = {0, 1, 0x10, 1}; /* 69633 */
    RxState state = rx_init(RX_BP);
    RxFrame frame = {0};
    CHECK(rx_feed(&state, bp_over, sizeof bp_over, &frame, 1).status == RX_LENGTH_ERROR);
    CHECK(state.payload == NULL);
    rx_clear(&state);
}

/** @brief Length đúng cap được nhận, dùng header chuẩn độc lập với TX. */
static void boundary_lengths(void) {
    const RxChannel channels[] = {RX_NET_IPC, RX_BP};
    const size_t sizes[] = {65536, 69632};
    for (size_t i = 0; i < 2; ++i) {
        size_t len = sizes[i];
        uint8_t header[] = {0, 1, i == 0 ? 0 : 0x10, 0};
        uint8_t *payload = malloc(len);
        CHECK(payload != NULL);
        memset(payload, 'x', len);
        RxState state = rx_init(channels[i]);
        RxFrame frame = {0};
        RxResult result = rx_feed(&state, header, sizeof header, &frame, 1);
        CHECK(result.status == RX_NEED_MORE && state.payload_len == len);
        result = rx_feed(&state, payload, len, &frame, 1);
        CHECK(result.status == RX_OK && result.consumed == len && result.frame_count == 1);
        expect_frame(&frame, payload, len);
        free(payload);
        CHECK(rx_finish(&state) == RX_CLEAN_EOF);
    }
}

/** @brief EOF tại mọi vị trí thiếu byte không phát frame dở và luôn dọn buffer. */
static void eof_and_cleanup(void) {
    const uint8_t wire[] = {0, 0, 0, 2, '{', '}'};
    for (size_t len = 0; len <= sizeof wire; ++len) {
        RxState state = rx_init(RX_NET_IPC);
        RxFrame frame = {0};
        RxResult result = rx_feed(&state, wire, len, &frame, 1);
        CHECK(result.consumed == len);
        CHECK(result.frame_count == (len == sizeof wire ? 1u : 0u));
        RxFinishStatus expected = len == 0 || len == sizeof wire ? RX_CLEAN_EOF : RX_TRUNCATED;
        CHECK(rx_finish(&state) == expected);
        CHECK(state.payload == NULL && state.header_used == 0);
        CHECK(rx_finish(&state) == RX_CLEAN_EOF);
        if (result.frame_count == 1) {
            expect_frame(&frame, "{}", 2);
        }
    }
    /* Một frame đã giao vẫn còn nguyên khi cleanup frame kế tiếp bị dở. */
    const uint8_t mixed[] = {0, 0, 0, 2, '{', '}', 0, 0, 0, 3, 'a'};
    RxState state = rx_init(RX_NET_IPC);
    RxFrame frames[2] = {0};
    CHECK(rx_feed(&state, mixed, sizeof mixed, frames, 2).frame_count == 1);
    CHECK(rx_finish(&state) == RX_TRUNCATED);
    expect_frame(&frames[0], "{}", 2);
}

/** @brief Frame hợp lệ trước length sai vẫn có ownership rõ và không phát frame lỗi. */
static void valid_before_error(void) {
    const uint8_t wire[] = {0, 0, 0, 2, '{', '}', 0, 0, 0, 1, 'x'};
    RxState state = rx_init(RX_NET_IPC);
    RxFrame frames[2] = {0};
    RxResult result = rx_feed(&state, wire, sizeof wire, frames, 2);
    CHECK(result.status == RX_LENGTH_ERROR && result.consumed == 10 && result.frame_count == 1);
    CHECK(frames[1].data == NULL && state.payload == NULL);
    rx_clear(&state);
    expect_frame(&frames[0], "{}", 2);
}

/** @brief Mọi cách cắt một frame Unicode đều giữ nguyên số byte và nội dung. */
static void unicode_splits(void) {
    const uint8_t payload[] = {'"', 0xe1, 0xbb, 0x87, '"'};
    const uint8_t wire[] = {0, 0, 0, 5, '"', 0xe1, 0xbb, 0x87, '"'};
    for (size_t split = 0; split <= sizeof wire; ++split) {
        RxState state = rx_init(RX_NET_IPC);
        RxFrame frames[2] = {0};
        RxResult first = rx_feed(&state, wire, split, frames, 2);
        RxResult second = rx_feed(&state, wire + split, sizeof wire - split,
                                  frames + first.frame_count, 2 - first.frame_count);
        CHECK(first.consumed == split && second.consumed == sizeof wire - split);
        CHECK(first.frame_count + second.frame_count == 1 && second.status == RX_OK);
        expect_frame(&frames[0], payload, sizeof payload);
        rx_clear(&state);
    }
}

/** @brief RX giữ nguyên byte, không thực hiện thay phần UTF-8/JSON của T44. */
static void raw_payload(void) {
    const uint8_t wire[] = {0, 0, 0, 2, 0xff, 0};
    RxState state = rx_init(RX_NET_IPC);
    RxFrame frame = {0};
    RxResult result = rx_feed(&state, wire, sizeof wire, &frame, 1);
    CHECK(result.status == RX_OK && result.frame_count == 1);
    expect_frame(&frame, wire + 4, 2);
    rx_clear(&state);
}

/** @brief Tương thích encoder TX thật, nhận từng byte qua nhiều lần feed. */
static void tx_round_trip(void) {
    const char payload[] = "{\"value\":123}";
    TxFrame encoded = {0};
    CHECK(tx_encode(&encoded, TX_BP, payload, sizeof payload - 1) == TX_ENCODED);
    RxState state = rx_init(RX_BP);
    RxFrame frame = {0};
    for (size_t i = 0; i < encoded.len; ++i) {
        RxResult result = rx_feed(&state, encoded.data + i, 1, &frame, 1);
        CHECK(result.consumed == 1);
        CHECK(result.frame_count == (i + 1 == encoded.len ? 1u : 0u));
        CHECK(result.status == (i + 1 == encoded.len ? RX_OK : RX_NEED_MORE));
    }
    expect_frame(&frame, payload, sizeof payload - 1);
    tx_frame_free(&encoded);
    CHECK(rx_finish(&state) == RX_CLEAN_EOF);
}

/** @brief Chạy các nhóm ca RX độc lập, dừng ngay khi có điều kiện sai. */
int main(void) {
    split_frame();
    coalesced_frames();
    frame_budget();
    invalid_lengths();
    boundary_lengths();
    eof_and_cleanup();
    valid_before_error();
    unicode_splits();
    raw_payload();
    tx_round_trip();
    puts("RX: 10 test groups passed");
    return EXIT_SUCCESS;
}
