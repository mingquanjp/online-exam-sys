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

## SCRUM-11 — Nhận frame

`rx_init(RX_NET_IPC)` chọn payload 2..65536 byte; `rx_init(RX_BP)` chọn
2..69632 byte. Một state cho mỗi luồng đọc TCP/pipe. `rx_feed` chỉ tách frame,
không đọc descriptor, parse JSON hoặc kiểm quyền. Header dài 4 byte uint32 BE,
không tính vào độ dài payload; payload output không có NUL thêm vào.

State giữ header/payload đang ghép; mảng output do caller cấp, sức chứa cũng là
frame budget. Input chỉ được mượn trong lời gọi. Khi đủ frame, caller nhận
ownership payload và gọi `rx_frame_free` sau validate/dispatch hoặc khi loại bỏ.
Không dùng `TxFrame` thay `RxFrame`: TX giữ cả header, RX chỉ trả payload.

- `RX_OK`: đã dùng hết input, không có frame dở.
- `RX_NEED_MORE`: đã dùng hết input, state còn header hoặc payload dở.
- `RX_YIELD`: hết frame budget; giữ input từ `result.consumed` trở đi để feed
  lại ở lượt sau. Không gọi recv/read mới rồi ghi đè phần này. Budget 0 không
  consume input; khi input rỗng trả OK/NEED_MORE theo state.
- `RX_LENGTH_ERROR` / `RX_NO_MEMORY`: lỗi terminal, caller đóng kênh và cleanup.
  Không feed lại để dò header mới. Các output `[0, frame_count)` trước lỗi vẫn
  thuộc caller; caller phải xử lý hoặc giải phóng, không bỏ qua chỉ vì status lỗi.

Ví dụ caller có input buffer `bytes` dài `len` và budget còn lại là 16:

```c
RxFrame frames[16] = {0};
RxResult result = rx_feed(&rx, bytes, len, frames, 16);
/* Validate/dispatch từng frames[i] trong [0, result.frame_count),
 * hoặc giải phóng khi policy đóng kênh; không coi đây là JSON đã hợp lệ. */
/* YIELD: giữ bytes[result.consumed..len) và nhường lượt reactor.
 * Nếu validator/queue tiếp nhận ownership, không free lại ở caller. */
```

`rx_finish` chỉ gọi khi mọi byte nhận trước EOF đã được feed hết, kể cả phần
chưa consume do YIELD. Hàm trả CLEAN_EOF hoặc TRUNCATED và giải phóng frame dở.
`rx_clear` dùng cho close/lỗi/timeout, gọi lại khi rỗng được, giữ nguyên cap và
không free output đã bàn giao. Khởi tạo lại chỉ trên state mới hoặc đã cleanup.
Caller bảo đảm con trỏ và sức chứa hợp lệ theo header; không copy state đang
sở hữu payload hoặc ghi đè các slot output chưa giải phóng/chuyển ownership.

Reactor theo dõi mốc byte đầu frame và timeout, không reset mốc mỗi chunk;
framer không đọc đồng hồ. Caller áp byte budget 64 KiB và frame budget 16/lượt
của tài liệu 03, giữ frame đầu vào đang xử lý trong hạch toán owner tương ứng.
SCRUM-11 chưa triển khai reactor/timeout, validator T44 hoặc BP credit.

Chạy `ctest --preset dev -R transport.rx --output-on-failure` để kiểm RX;
`npm run check:native` chạy thêm TX và các version smoke test hiện có.
EOF trong test được mô phỏng bằng `rx_finish`, chưa là kiểm chứng TCP/LAN.
EOF không được dùng thay việc xử lý LENGTH_ERROR/NO_MEMORY trước đó.
