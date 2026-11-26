# Common C

`exam_common` có build-info helper để kiểm chứng link cJSON và module TX dùng
chung cho client/server C.

## SCRUM-13 — Gửi frame

`tx_encode` đóng gói JSON UTF-8 đã được kiểm tra thành 4 byte độ dài big-endian
và payload. `tx_enqueue` chuyển buffer vào FIFO khi trả `TX_ACCEPTED`. Nếu queue
đầy hoặc enqueue lỗi, caller vẫn sở hữu buffer.

Mỗi descriptor nonblocking có một queue và một writer. Với NET, dùng tối đa 64
frame và 128 KiB, trong đó 8 KiB dự phòng cho control. Control vẫn theo FIFO và
chịu giới hạn tổng. Frame gửi dở vẫn tính toàn bộ số byte vì queue còn giữ buffer.

Tiến trình gọi `tx_ignore_sigpipe` một lần trước khi sử dụng `tx_drain` để xử lý
được `EPIPE` trên cả socket và pipe. Vòng `poll` bật `POLLOUT` khi `tx_pending`
đúng. `tx_drain` gửi theo ngân sách byte và giữ offset khi gửi dở. Khi gặp
`TX_WOULD_BLOCK`, đợi lần báo writable tiếp theo. Khi gặp `TX_PEER_ERROR`, caller
đóng descriptor và gọi `tx_clear`. Chính sách timeout và xử lý peer nằm ở reactor.
