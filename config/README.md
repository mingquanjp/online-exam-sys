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

## V03 — Bảng cấu hình đề xuất SCRUM-9

Ngày 22/11/2026. **DRAFT — chờ Nguyễn Minh Quân và Đặng Hoàng Quân xác nhận.**
Tự kiểm không thay review chéo; chưa cho consumer dùng bound mới như quyết định
đã duyệt. Quy tắc C10/M01 đã duyệt ở trên vẫn là nguồn hiện hành.

Đề xuất V03 giữ **một resource profile v1 cố định** cho các cap và timeout
transport trong bảng. Các giá trị mặc định lấy nguyên từ hai config mẫu;
không tăng giới hạn/timeout để che nghẽn. Endpoint/port/path và hai timeout
startup/shutdown có thể cấu hình như dưới. Nếu cần profile khác sau đo tải,
nhóm review lại config và budget 03/04 trước khi dùng.

Ký hiệu: R = bắt buộc, không có default; D = thiếu thì lấy default; `=N` là chỉ
nhận đúng giá trị N nếu cung cấp. Bound cố định là **đề xuất khóa profile**,
không có nghĩa mọi trường này đã được tài liệu cũ bắt buộc cố định.
Integer xét theo giá trị JSON theo C09; `5550.0`/`5.55e3` bằng 5550 hợp lệ,
chuỗi `"5550"`, boolean, null, số lẻ hoặc vô hạn không hợp lệ.

### Server — đủ 20 trường mẫu

| Trường | Kiểu / đơn vị | R/D và default | Bound / quan hệ | Owner |
| --- | --- | --- | --- | --- |
| bind_host | string UTF-8 | R | Host rule H dưới đây; địa chỉ bind, không URL | C |
| port | integer port | R | 1..65535 | C |
| database_path | string path | R | Path rule P; resolve từ config dir; một bộ dữ liệu local | C lock + Node DB |
| log_directory | string path | R | P; resolve từ config dir | C/Node logging |
| max_active_users | integer activity | D: 50 | =50, tính cả người offline/đã nộp sớm còn thuộc phòng | Node |
| max_connections | integer TCP | D: 128 | =128; không đồng nhất với activity | C |
| max_unauthenticated_connections | integer TCP | D: 64 | =64 và <=max_connections | C, binding từ Node |
| max_payload_bytes | integer byte payload | D: 65536 | =65536 NET/IPC, không gồm header | C |
| rx_frame_timeout_ms | integer ms | D: 10000 | =10000, từ byte đầu frame dở | C |
| heartbeat_interval_ms | integer ms | D: 10000 | =10000 | C |
| peer_idle_timeout_ms | integer ms | D: 35000 | =35000 và >heartbeat_interval_ms | C |
| tx_queue_max_bytes | integer byte | D: 131072 | =131072, gồm header/control reserve 8192; ordinary space>=65540 | C |
| command_queue_max_bytes | integer byte | D: 8388608 | =8388608, BP command tổng gồm reserve 524288 | C/Node BP |
| completion_queue_max_bytes | integer byte | D: 8388608 | =8388608, BP completion tổng gồm reserve 524288 | C/Node BP |
| waiting_room_timeout_seconds | integer s | D: 1800 | =1800 từ tạo phòng, không gia hạn | Node |
| node_executable | string executable | D: node | Rule E dưới đây; exec argv, không shell | C launcher |
| business_entry_path | string path | D: ../apps/business/dist/main.js | P; resolve từ config dir | C launcher |
| business_startup_timeout_ms | integer ms | D: 10000 | 1000..60000; timer chờ startup ready, chưa ready không listen | C launcher |
| business_shutdown_timeout_ms | integer ms | D: 10000 | 1000..60000; graceful phase, không cho child sống vô hạn sau timeout | C launcher |
| bridge_max_payload_bytes | integer byte payload | D: 69632 | =69632, BP frame tối đa 69636 gồm header | C/Node BP |

Launcher dùng startup/shutdown timeout đã validate; 10000 ms là mặc định,
không phải hằng số ghi đè config. Bound V03 vẫn chờ nhóm duyệt.
Startup timeout không là cam kết migration luôn hoàn tất trong khoảng chờ; nếu timeout
thì cleanup/fail, không listen sớm. Shutdown graceful timeout không bỏ bước
terminate/kill/reap có giới hạn tại 02 §11. Chi tiết cleanup thuộc T09.

### Client — đủ 6 trường mẫu

| Trường | Kiểu / đơn vị | R/D và default | Bound / quan hệ | Owner |
| --- | --- | --- | --- | --- |
| server_host | string UTF-8 | R | H; endpoint thật, không địa chỉ unspecified 0.0.0.0/:: | C client |
| server_port | integer port | R | 1..65535 | C client |
| connect_timeout_ms | integer ms | D: 5000 | =5000, riêng giai đoạn TCP connect | C client |
| request_timeout_ms | integer ms | D: 5000 | =5000, budget request thường; auth dùng 65000 ms nội bộ theo 03 §12 | C client |
| max_payload_bytes | integer byte payload | D: 65536 | =65536 NET/IPC | C client |
| ipc_tx_max_bytes | integer byte | D: 262144 | =262144, tổng gồm frame headers; giữ slot cap 32 nội bộ | C/main |

Không dùng request_timeout_ms để rút budget auth về 5s hoặc kéo mọi request lên
65s. Không mở JSON config cho scrypt/ledger/poll budget/slot cap/control reserve.

### Chuỗi, đường dẫn và quan hệ

Các quy tắc bổ sung dưới đây thuộc **đề xuất V03**, cần cùng duyệt với bảng.

- H (host): 1..255 byte UTF-8, không whitespace/control/NUL, không chứa scheme
  `://` hoặc slash; IPv4, IPv6 literal không bọc `[]`, hoặc hostname thuần.
  Kiểm cú pháp/resolve bằng API hệ thống ở startup/connect; không tự thêm scheme,
  port hoặc sửa hostname. `bind_host` có thể là 0.0.0.0/::; client không nhận hai
  unspecified addresses đó. IPv6 có `:` không bị nhầm với `host:port`; IPv4/hostname
  kèm `:port` bị từ chối, port chỉ ở trường riêng. Đây không là cam kết mọi địa
  chỉ resolve được hay máy có interface tương ứng.
- P (path): 1..4096 byte UTF-8, không NUL/control, không chỉ whitespace; cho phép
  khoảng trắng bên trong. Không expand `~`, `$VAR`, glob hoặc shell. Chuỗi không được diễn giải như shell. Tương đối ghép với thư mục config; absolute
  không ghép thêm config dir. Sau đó cả hai đều lexical normalize các thành phần
  `.`/`..` theo POSIX trước kiểm bound và sử dụng. Quy tắc này áp dụng cho
  database_path/log_directory/business_entry_path và node_executable absolute;
  `node` là tên PATH nên không normalize. Không coi lexical normalize là realpath
  hoặc bằng chứng hai đường dẫn cùng dataset; kiểm alias/lock thuộc startup T09.
  Sau resolve phải <=4096 byte, không tự truncate. Ngoài bound riêng, BP init
  vẫn phải vừa trần metadata encoded<=4096 của 03 §18.2, kể cả escaping/envelope.
  Path riêng lẻ đúng bound không tự chứng minh init encode sẽ vừa.
- E (node_executable): tên `node` được tìm qua PATH, hoặc absolute path theo P.
  Không nhận command line như `node --inspect`, relative path `./node`, shell
  expression hoặc command substitution. Absolute path có khoảng trắng hợp lệ
  nếu là một executable duy nhất; truyền bằng một argv element, không qua shell.
- Server relations: unauth<=connections; idle>heartbeat; TX ordinary bytes
  `tx_queue_max_bytes-8192 >= max_payload_bytes+4`; mỗi BP queue sau reserve
  phải chứa được một BP frame tối đa; response/event cùng pool như 03 §18.4.
- Client relation: `ipc_tx_max_bytes >= max_payload_bytes+4`.
- Kiểm bound từng trường và quan hệ đều phải có. Với profile cố định, override
  có thể sai cả hai; loader không bắt buộc thứ tự field báo đầu tiên. Vectors
  chỉ yêu cầu một trong các diagnostics hợp lệ khi nhiều lỗi cùng tồn tại.
- Config file cũng áp strict JSON/UTF-8/duplicate decoded keys/root object của
  C09; không NET envelope. C và Node biết toàn bộ key server, từng bên kiểm
  schema đầy đủ trước khi dùng; không coi key của bên kia là unknown.
- Resolve path là lexical normalization ở loader. Kiểm file/quyền, canonical
  dataset/alias lock và executable/entry tồn tại là bước startup T09/T47, trước
  ready/listen; không biến fixture path giả thành yêu cầu chạy migration.

### Vectors và gate sử dụng

[Fixture manifest và input nguyên văn](../tests/fixtures/config/README.md)
ghi accepted/rejected cùng expected effective config. Các rejection categories
`missing/type/bound/relation/unknown/duplicate/json/string` chỉ là nhãn fixture,
không thêm mã NET. Startup report tên field + lý do đã lọc, exit khác 0;
config sai không mở cổng. Chưa cố định câu chữ stderr hay thứ tự lỗi đầu tiên.

Trạng thái: tác giả đã soạn; **Hoàng Quân chưa review; nhóm chưa duyệt V03**.
Sau review, ghi người/ngày/bound được chấp nhận hoặc sửa, đồng bộ fixtures và
đánh dấu gate cho T47. Consumer có thể chuẩn bị phần độc lập nhưng chưa nhận
runtime default/bound mới là quyết định được duyệt.

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
