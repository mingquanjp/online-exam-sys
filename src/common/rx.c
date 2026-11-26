/**
 * @file rx.c
 * @brief Ghép header/payload theo từng đoạn byte, giữ tối đa một frame dở.
 */
#include "exam/rx.h"

#include <arpa/inet.h>
#include <stdlib.h>
#include <string.h>

enum { HEADER_BYTES = 4, NET_IPC_MAX_PAYLOAD = 65536, BP_MAX_PAYLOAD = 69632 };

/**
 * @brief Khởi tạo state cho một luồng nhận với cap cố định theo kênh.
 * @param[in] channel RX_NET_IPC hoặc RX_BP, do caller chọn theo descriptor.
 * @return State rỗng, chưa cấp phát payload.
 */
RxState rx_init(RxChannel channel) {
    return (RxState){.max_payload = channel == RX_BP ? BP_MAX_PAYLOAD : NET_IPC_MAX_PAYLOAD};
}

/**
 * @brief Ghép byte thành payload hoàn chỉnh, theo thứ tự và budget caller cấp.
 * @param[in,out] state State sở hữu header/payload dở; không dùng chung giữa các luồng.
 * @param[in] data Byte đầu vào chỉ được mượn trong lời gọi, NULL khi len bằng 0.
 * @param[in] len Số byte đầu vào.
 * @param[out] frames Mảng có frame_capacity slot trống; nhận ownership từng payload hoàn chỉnh.
 * @param[in] frame_capacity Sức chứa mảng, cũng là số frame tối đa trả trong lượt.
 * @return Số byte đã dùng, số payload đã giao và trạng thái. Output trước lỗi vẫn thuộc caller.
 * @note Khi YIELD, caller giữ phần input chưa dùng. Lỗi length/bộ nhớ là terminal;
 * caller đóng kênh và dọn state. Hàm không validate JSON hoặc xử lý timeout.
 */
RxResult rx_feed(RxState *state, const void *data, size_t len,
                 RxFrame *frames, size_t frame_capacity) {
    const uint8_t *bytes = data;
    RxResult result = {0};
    if (state->error != RX_OK) {
        result.status = state->error;
        return result;
    }

    while (result.consumed < len) {
        if (result.frame_count == frame_capacity) {
            result.status = RX_YIELD;
            return result;
        }

        if (state->header_used < HEADER_BYTES) {
            size_t count = HEADER_BYTES - state->header_used;
            if (count > len - result.consumed) {
                count = len - result.consumed;
            }
            memcpy(state->header + state->header_used, bytes + result.consumed, count);
            state->header_used += count;
            result.consumed += count;
            if (state->header_used < HEADER_BYTES) {
                break;
            }

            /* Sao chép header để không phụ thuộc căn chỉnh của buffer. */
            uint32_t network_length;
            memcpy(&network_length, state->header, sizeof network_length);
            uint32_t length = ntohl(network_length);
            if (length < 2 || length > state->max_payload) {
                state->error = RX_LENGTH_ERROR;
                result.status = state->error;
                return result;
            }
            /* Chỉ cấp phát sau khi length đã qua cap; không append cả recv vào state. */
            state->payload_len = length;
            state->payload = malloc(state->payload_len);
            if (state->payload == NULL) {
                state->error = RX_NO_MEMORY;
                result.status = state->error;
                return result;
            }
        }

        size_t count = state->payload_len - state->payload_used;
        if (count > len - result.consumed) {
            count = len - result.consumed;
        }
        if (count > 0) {
            memcpy(state->payload + state->payload_used, bytes + result.consumed, count);
            state->payload_used += count;
            result.consumed += count;
        }
        if (state->payload_used == state->payload_len) {
            frames[result.frame_count++] = (RxFrame){state->payload, state->payload_len};
            /* Chuyển ownership trước khi bắt đầu frame kế tiếp; không free buffer này. */
            state->payload = NULL;
            state->header_used = 0;
            state->payload_len = 0;
            state->payload_used = 0;
        }
    }
    result.status = state->header_used != 0 ? RX_NEED_MORE : RX_OK;
    return result;
}

/**
 * @brief Giải phóng frame đang ghép và đưa state về rỗng, giữ nguyên cap.
 * @param[in,out] state State đã khởi tạo; có thể gọi lại khi rỗng.
 * @note Payload đã giao caller không còn thuộc state, nên không bị giải phóng.
 */
void rx_clear(RxState *state) {
    size_t max_payload = state->max_payload;
    free(state->payload);
    *state = (RxState){.max_payload = max_payload};
}

/**
 * @brief Phân loại EOF và dọn frame dở khi đầu đọc đóng.
 * @param[in,out] state State sau khi đã xử lý hết input trước EOF.
 * @return RX_CLEAN_EOF khi không có frame dở, RX_TRUNCATED khi thiếu header/payload.
 * @note Lỗi terminal trước đó vẫn do caller xử lý theo kết quả rx_feed.
 */
RxFinishStatus rx_finish(RxState *state) {
    RxFinishStatus status = state->header_used == 0 ? RX_CLEAN_EOF : RX_TRUNCATED;
    rx_clear(state);
    return status;
}

/**
 * @brief Giải phóng payload caller đã nhận và đặt frame về rỗng.
 * @param[in,out] frame Frame thuộc caller; có thể gọi lại khi rỗng.
 */
void rx_frame_free(RxFrame *frame) {
    free(frame->data);
    *frame = (RxFrame){0};
}
