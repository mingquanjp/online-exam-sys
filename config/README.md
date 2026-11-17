# Cấu hình phát triển và hợp đồng loader — C10

C10 được nhóm duyệt ngày 03/11/2026, bổ sung M01 ngày 15/11/2026.
Máy chủ gồm server C launcher/transport và Node business process. Các file `*.example.json` là mẫu cho parser ở
mốc sau, **chưa được binary foundation đọc**. Không chạy `exam-server --config ...`
hoặc lệnh tạo admin khi CLI tương ứng chưa được triển khai.

- `server.example.json`: địa chỉ bind, dữ liệu local server và giới hạn theo tài liệu 03–04.
- `client.example.json`: endpoint TCP trên LAN. `127.0.0.1` dành cho cùng máy;
  khi hai máy đổi thành IP LAN server, không dùng bind address `0.0.0.0` làm đích.
- Khi có parser, sao chép thành `server.local.json`/`client.local.json` (đã ignore).
  Không chứa mật khẩu, token hoặc key đề trong config.
- Đường dẫn DB/log tương đối được resolve từ **thư mục chứa file cấu hình**,
  không từ cwd hoặc một repo root suy đoán. Với file trong `config/`,
  `../var/data/exam.sqlite3` trỏ tới `var/data/exam.sqlite3` của repo. Đường dẫn
  tuyệt đối được giữ nguyên; không tự nội suy shell, biến môi trường hoặc `~`.

## Hợp đồng nạp cấu hình

1. Nạp đúng một file JSON được chọn rõ khi chạy; không tự fallback sang file khác
   nếu file được chọn thiếu/hỏng. Root phải là object; khóa trùng/không biết,
   sai kiểu, null không hợp lệ hoặc giá trị ngoài giới hạn đều là lỗi.
2. Server bắt buộc khai báo `bind_host`, `port`, `database_path`, `log_directory`;
   client bắt buộc `server_host`, `server_port`. Chuỗi không rỗng; port integer
   1..65535. Path DB/log không nhận từ request của người dùng.
3. Các trường còn lại có mặc định đúng giá trị trong mẫu hiện tại. Khi viết loader,
   định nghĩa schema/default trong hợp đồng này với vectors C/TS đối chiếu. C
   validate transport/launcher limits, Node validate domain/DB limits, cả hai biết
   tập khóa đầy đủ và từ chối khóa lạ. Mỗi runtime có một loader ở boundary, các
   handler nhận effective config đã validate. C dùng absolute config path khi spawn.
   Node ready chỉ sau kiểm tra schema/config đã được C chọn.
   Thiếu trường có mặc định khác với khai báo sai: không dùng default để che lỗi.
4. Các giá trị timeout/cap phải là integer dương, không tràn khi đổi đơn vị/cấp phát.
   Kiểm tra quan hệ: max unauthenticated <= max connections; peer idle timeout >
   heartbeat interval; TX queue phải chứa được frame tối đa (payload + 4 byte).
   Frame v1 cố định payload 65536; quy mô bản đầu max_active_users=50 và thời hạn
   phòng chờ=1800 giây. Nếu cung cấp các trường này thì phải khớp baseline v1.
   Những limit còn lại phải phù hợp trần/credit/budget tài liệu 03–04; trước triển
   khai validator cần bảng bound từng trường, không tự coi mọi số dương là hợp lệ.
5. Hằng số nội bộ chưa có trong mẫu (queue slots/control reserve, hash/ledger…)
   giữ trong module mã tương ứng; không cần biến toàn bộ thành tùy chọn JSON.
   C08/C09 đã duyệt ngày 03/11/2026: admission theo tài liệu 04 §5.3 và helper
   JSON theo tài liệu 03 §3.1. File config dùng schema riêng, không NET envelope;
   integer theo giá trị hữu hạn/nguyên/trong khoảng, không tự ép chuỗi thành số.
   Bảng bound chi tiết từng limit khi triển khai config vẫn phải đối chiếu tài liệu,
   không tự mở mọi hằng số thành tùy chọn.
6. Validate config và kiểm tra DB/schema/quyền file trước listen. Lỗi in tên trường
   và nguyên nhân rồi dừng với exit code khác 0; không log dữ liệu nhạy cảm, tự
   đổi path, tự reset DB hoặc lặng lẽ nâng giới hạn. Khi thành công ghi các tham số
   hiệu lực không bí mật để tái lập kiểm thử. Một file sai không được mở cổng dù
   các trường khác đúng.

Giới hạn tài nguyên vẫn cần kiểm chứng tải; hợp đồng loader không phải bằng chứng
đạt 50 người. Hợp đồng trên chưa phải parser đã chạy hoặc API CLI đã có.

## Khởi tạo admin offline

- Chạy khi server đã dừng; tiện ích lấy cùng khóa độc quyền bộ dữ liệu với server,
  dùng config/path/schema/migration chung. Nếu bộ dữ liệu đang được dùng thì lỗi.
- Nhập username và password tương tác, tắt echo password; khôi phục terminal kể
  cả khi lỗi. Không nhận password trong argv/config/log hoặc ghi plaintext.
- A cung cấp validation và scrypt async TypeScript; B chủ trì công cụ Node, migration và INSERT
  ADMIN trong transaction. Tên đã tồn tại thì lỗi, không UPDATE role/password.
- Chỉ báo tạo thành công sau commit. Không có admin/password mặc định, không có
  đường đăng ký mạng tự nhận ADMIN. Không thêm UI quản trị toàn bộ tài khoản.

Kiểm chứng dự kiến AC-27/28: DB trống → migration → admin offline → login → bank
UI; thử trùng tên, server đang chạy, thiếu/sai/khóa lạ, thiếu trường có mặc định,
đổi cwd, lỗi DB. Đây là tiêu chí cần chạy sau triển khai, chưa được đánh dấu đạt.

## Phần bổ sung M01

| Trường mẫu | Owner | Giá trị mặc định và hành vi |
| --- | --- | --- |
| node_executable | C launcher | node, được resolve trên PATH tại startup hoặc dùng absolute path đã cấu hình. Exec bằng argv tách, shell expansion bị từ chối. |
| business_entry_path | C launcher | ../apps/business/dist/main.js, resolve từ thư mục config. |
| business_startup_timeout_ms | C launcher | 10000, integer 1000..60000. |
| business_shutdown_timeout_ms | C launcher | 10000, integer 1000..60000. |
| bridge_max_payload_bytes | C và Node BP | 69632 cố định BP v1, gồm metadata và NET envelope. |
| bind_host/port/max_connections/unauth/heartbeat/RX/TX | C transport | Theo mẫu transport và protocol §12. |
| database_path/log_directory/max_active_users/waiting_room_timeout_seconds | Node domain/storage | Theo C02/C08/C10, Node sở hữu DB. C dùng DB path để lấy lock trước spawn. |
| command_queue_max_bytes/completion_queue_max_bytes | C và Node bridge | 8388608 mỗi chiều, credit/reserve theo protocol §18. |

C lấy flock(LOCK_EX | LOCK_NB) trên lock file cố định cạnh DB local trước khi spawn, child được cấp descriptor
lock qua fd 3 với lifetime gắn Node. fd 3 giúp khóa còn hiệu lực nếu C crash trong
lúc Node dọn DB. Node xác nhận startup fd và launcher pipe theo BP. Launcher chờ
child exit trước nhả lock khi shutdown bình thường. Offline admin dùng cùng cơ
chế khóa, stdin là terminal và stderr phục vụ prompt ẩn mật khẩu. C parser và
Node loader/lock lifecycle được triển khai M1/M2.

Không dùng fcntl record lock truyền thống thay flock cho yêu cầu kế thừa này;
không unlink/recreate lock file, không LOCK_UN khi child còn dùng DB. fd 3 của
child phải sống qua exec, đóng sau DB; parent wait/reap child trước cleanup cuối.
Server và launcher admin dùng cùng đường khóa đã resolve cho cùng bộ dữ liệu.
Ca kiểm chứng: giữ child còn sống sau khi kill parent, launcher thứ hai vẫn bị
từ chối cho tới khi child đóng DB/thoát. Chi tiết ở tài liệu 02 §11.
