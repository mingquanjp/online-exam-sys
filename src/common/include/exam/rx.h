/**
 * @file rx.h
 * @brief Tách frame nhận dùng chung cho TCP và pipe.
 */
#ifndef EXAM_RX_H
#define EXAM_RX_H

#include <stddef.h>
#include <stdint.h>

typedef enum { RX_NET_IPC, RX_BP } RxChannel;
typedef enum { RX_OK, RX_NEED_MORE, RX_YIELD, RX_LENGTH_ERROR, RX_NO_MEMORY } RxStatus;
typedef enum { RX_CLEAN_EOF, RX_TRUNCATED } RxFinishStatus;

/* Chỉ chứa payload, không có header hoặc NUL kết thúc. Caller sở hữu data. */
typedef struct {
    uint8_t *data;
    size_t len;
} RxFrame;

/* Một state cho mỗi luồng nhận; không sao chép khi đang sở hữu payload. */
typedef struct {
    uint8_t header[4];
    size_t header_used;
    uint8_t *payload;
    size_t payload_len;
    size_t payload_used;
    size_t max_payload;
    RxStatus error; /* Lỗi terminal được giữ đến khi cleanup. */
} RxState;

typedef struct {
    size_t consumed;
    size_t frame_count;
    RxStatus status;
} RxResult;

/* channel phải là RX_NET_IPC hoặc RX_BP. Chưa cấp phát bộ nhớ. */
RxState rx_init(RxChannel channel);

/* Input borrowed; output có frame_capacity slot trống, đồng thời là frame budget.
 * data được NULL chỉ khi len=0; frames được NULL chỉ khi frame_capacity=0.
 * Luôn xử lý frame_count output, kể cả khi status báo lỗi ở frame tiếp theo.
 * Sau LENGTH_ERROR/NO_MEMORY, caller đóng kênh và cleanup, không feed tiếp stream.
 * YIELD: caller giữ input từ consumed trở đi và cấp lại ở lượt sau.
 */
RxResult rx_feed(RxState *state, const void *data, size_t len,
                 RxFrame *frames, size_t frame_capacity);

/* Dọn frame dở, giữ cap của kênh. Không giải phóng payload đã giao caller. */
void rx_clear(RxState *state);

/* Chỉ gọi sau khi đã feed hết byte trước EOF; phân loại và dọn frame dở. */
RxFinishStatus rx_finish(RxState *state);

/* Giải phóng payload thuộc caller, đặt frame về rỗng. */
void rx_frame_free(RxFrame *frame);

#endif /* EXAM_RX_H */
