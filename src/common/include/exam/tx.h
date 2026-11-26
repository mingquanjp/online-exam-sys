/**
 * @file tx.h
 * @brief Giao diện đóng gói frame và quản lý hàng đợi gửi nonblocking.
 */
#ifndef EXAM_TX_H
#define EXAM_TX_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

/* Kênh dùng để chọn trần byte của payload. */
typedef enum { TX_NET_IPC, TX_BP } TxChannel;

/* Phân loại nội bộ để áp dụng dung lượng dự phòng cho control. */
typedef enum { TX_NORMAL, TX_CONTROL } TxClass;

/* Buffer sở hữu cả header lẫn payload của một frame. */
typedef struct {
    uint8_t *data;
    size_t len;
} TxFrame;

typedef enum { TX_ENCODED, TX_INVALID_INPUT, TX_ENCODE_NO_MEMORY } TxEncodeStatus;
typedef enum { TX_ACCEPTED, TX_FULL, TX_INVALID_FRAME, TX_QUEUE_NO_MEMORY } TxEnqueueStatus;
typedef enum { TX_DRAINED, TX_WOULD_BLOCK, TX_YIELD, TX_PEER_ERROR } TxDrainStatus;

/* Tiến độ và trạng thái sau một lượt ghi. */
typedef struct {
    size_t sent; /* Số byte đã ghi trong lượt này. */
    TxDrainStatus status;
    int error_number; /* Mã lỗi hệ thống khi status là TX_PEER_ERROR, bằng 0 ở các trạng thái khác. */
} TxDrainResult;

struct TxEntry;

/* FIFO của một descriptor nonblocking. Không sao chép queue đang giữ frame. */
typedef struct {
    struct TxEntry *head;
    struct TxEntry *tail;
    size_t frame_count;
    size_t bytes;
    size_t normal_bytes;
    size_t max_frames;
    size_t max_bytes;
    size_t control_reserve_bytes;
} TxQueue;

/* ===== Đóng gói frame ===== */

/* Đóng gói JSON đã kiểm tra. Frame out phải rỗng. Caller sở hữu buffer khi thành công. */
TxEncodeStatus tx_encode(TxFrame *out, TxChannel channel, const void *json, size_t len);

/* Giải phóng buffer của caller và đặt frame về rỗng. */
void tx_frame_free(TxFrame *frame);

/* ===== Hàng đợi gửi ===== */

/* Tạo FIFO rỗng với giới hạn số frame, số byte và phần dành cho control. */
TxQueue tx_queue_init(size_t max_frames, size_t max_bytes, size_t control_reserve_bytes);

/* Thêm frame vào FIFO. Chỉ TX_ACCEPTED mới chuyển quyền sở hữu buffer. */
TxEnqueueStatus tx_enqueue(TxQueue *queue, TxFrame *frame, TxClass frame_class);

/* Trả true nếu queue còn dữ liệu chờ gửi. */
bool tx_pending(const TxQueue *queue);

/* Bỏ qua SIGPIPE lúc khởi động. Trả 0 khi thành công, -1 khi lỗi. */
int tx_ignore_sigpipe(void);

/* Gửi theo ngân sách byte và giữ offset khi gửi dở. Caller xử lý lỗi descriptor. */
TxDrainResult tx_drain(TxQueue *queue, int fd, size_t byte_budget);

/* Giải phóng các frame đang chờ và giữ nguyên giới hạn queue. */
void tx_clear(TxQueue *queue);

#endif /* EXAM_TX_H */
