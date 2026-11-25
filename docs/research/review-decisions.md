# Quyết định sau review thiết kế

## V03 — Duyệt cấu hình ngày 26/11/2026

Nguyễn Minh Quân xác nhận đồng ý và thông báo Đặng Hoàng Quân cũng đồng ý
[bảng V03](../../config/README.md#v03--bảng-cấu-hình-đề-xuất-scrum-9).
Nhóm duyệt đủ 20 trường server/6 trường client, required/default/bound/quan hệ,
profile v1 cố định, quy tắc host/path/executable và bộ 44 input/11 expected.
Gate quyết định V03 trước loader đã đáp ứng; C10/M01, wire, phân công và phạm vi
50 người giữ nguyên. Loader/startup/runtime/tải vẫn phải triển khai và kiểm thử;
không dùng xác nhận này làm bằng chứng PR đã approve/merge hoặc ticket Done.
Các đoạn nghiên cứu có ngày trước đó giữ trạng thái lịch sử tại thời điểm soạn.

## Review bổ sung ngày 17/11/2026

[Review trước triển khai](pre-implementation-review.md) đối chiếu lại barem gốc,
HTML góp ý và bảy bài giảng. V01 đã được nhóm chốt sau phân tích: giữ length + JSON, không thêm CRC32
trong bản đầu. Lợi ích bổ sung chưa đủ để thay framing/test trong phạm vi TCP
LAN hiện tại; chưa có yêu cầu trực tiếp xác nhận thầy bắt buộc checksum ứng dụng.
Không coi schema/revision/fingerprint thay checksum hay bảo vệ chống giả mạo.
Nếu có yêu cầu trực tiếp mới, review riêng trước khi sửa hợp đồng.
V03 bound config vẫn cần khóa trước loader; frame/caps hiện hành không đổi.
V02 đã làm rõ flock kế thừa qua fd 3; SIGPIPE/child cleanup và đăng ký không tự
login đã đồng bộ theo M01. Không đổi core A/B, C01–C12 hoặc phạm vi 50 người.

## Baseline hiện hành ngày 15/11/2026 — M01

Người dùng xác nhận chuyển nghiệp vụ sang TypeScript/Node và yêu cầu thực hiện
bước 1 gồm tài liệu, phân công, giao thức và cấu trúc repo. M01 cập nhật nơi chạy
các chức năng của C01–C12 theo tài liệu 02 v2.0 và 03 §18.

| Phần | Baseline triển khai |
| --- | --- |
| TCP LAN | C client và C server, socket/poll/framing/partial I/O/heartbeat/reconnect/queue caps. |
| Máy chủ | C launcher/transport spawn một Node child qua pipe BP và giữ khóa DB xuyên vòng đời child. |
| Node TypeScript | Session/quyền, phòng/deadline, kho/đề/bài/chấm/practice/result, ledger và SQLite. |
| Dependency nghiệp vụ | node:sqlite trong Node 24.15.0, runtime hiện tại 3.51.3. node:crypto scrypt async thay hash libsodium/Argon2id cũ. |
| Dependency C | cJSON và libsodium random, CMake xây transport/client. SQLite CMake đã chuyển sang Node API. |
| Phân công | A C RX/lifecycle/BP request-control và TS auth/room/timer. B C TX/BP output-credit và TS bank/attempt/practice/results/storage. UI và tool load theo C12. |

Lựa chọn node:sqlite và scrypt là quyết định triển khai tối thiểu ở bước 1 để dùng
runtime đã có và giảm dependency của nghiệp vụ. Node 24.15.0 phân loại node:sqlite
release candidate, cần pin runtime và kiểm chứng Linux. Scrypt params ban đầu
N=65536,r=8,p=1,maxmem=96 MiB cần đo trước LT-09. Đây là thay đổi K01/K04/K06,
được ghi riêng để nhóm review cùng triển khai M1/M2.

Bộ tài liệu hiện hành 01 v1.8, 02 v2.0, 03 v0.8, 04 v0.7, 05 v0.7. Scaffold
business build/typecheck/--version, C và desktop được kiểm chứng lại. BP/socket/
handlers/migration/admin sẽ triển khai ở các mốc sau. Kết quả probe trước M01
được dùng như nghiên cứu thành phần theo ngày gốc, bài kiểm chứng tải phải chạy
lại trên cả C và Node. Startup/EOF/backpressure/authority có PT-26..28.

## Nhóm 1 — đã chốt ngày 02/11/2026

| Mã | Quy tắc được nhóm xác nhận | Ảnh hưởng |
| --- | --- | --- |
| C01 | Chủ được hủy phòng WAITING. CANCELLED giải phóng chỗ mọi thành viên, không tạo bài/điểm. Đã RUNNING dùng kết thúc sớm. | Thay phần “chủ không hủy” của D02, thêm API/state/transaction/test. |
| C02 | Phòng chờ tối đa 30 phút từ tạo, không gia hạn hoặc chuyển chủ. Chủ mất mạng vẫn giữ phòng trong hạn. Hết hạn tự hủy dù online/offline; start hợp lệ thì chỉ timer thi còn áp dụng. | Timer và mốc tạo/hết hạn, không reset qua reconnect/config/startup. |
| C03 | Khôi phục dữ liệu server đã lưu; chưa có ACK thì đối chiếu server. Đóng toàn app không bảo đảm giữ draft/op RAM. Không làm durable offline draft. | Làm rõ reconnect và UI trạng thái lưu, không thêm tính năng offline. |

Đã đồng bộ tài liệu 01 v1.3, 02 v1.1, 03 v0.3, 04 v0.2, 05 v0.2 và config
mẫu. Mới cập nhật thiết kế, chưa triển khai runtime hoặc đánh dấu test đã đạt.

## Nhóm 2, lượt C04–C06 — đã chốt ngày 02/11/2026

| Mã | Bản tối thiểu được duyệt | Giới hạn |
| --- | --- | --- |
| C04 | Gắn instance ID vào context W pending; khi server instance đổi thì dừng tự resume/replay cũ, login và sync trước thao tác mới. | Không giả định DB mất dữ liệu, không tự mang mutation sang dataset mới, không thêm recovery crash/database UUID. |
| C05 | Main giữ các request đã tiếp nhận còn PENDING/UNKNOWN trong RAM; API preload đọc lại và thông báo thay đổi để renderer reload sync trước sửa. | Không giữ mọi click/draft chưa gửi, không thêm durable offline queue hoặc generic IPC API. |
| C06 | Logout intent chặn thao tác mới/auto-resume cũ; online gửi logout trong timeout hiện có. Có ACK mới báo revoke server; offline/timeout xóa token local, về login và báo chưa xác nhận server. Đóng TCP cũ, lần login sau kết nối mới. | Không leave/submit/rollback W đã gửi, không queue logout nền. Callback/registry cũ không đi vào context user mới. |

Đồng bộ 01 v1.4, 02 v1.2, 03 v0.4, 04 v0.3, 05 v0.3. Chỉ sửa tài liệu,
chưa triển khai hoặc nghiệm thu runtime. Core A/B giữ nguyên.

## Trạng thái findings liên quan

- R01: xử lý ở mức thiết kế bằng C01+C02; chờ AC-20/21, PT-15/16, LT-15.
- R02: xử lý ở mức thiết kế bằng C04; chờ AC-23/PT-18, chưa có recovery khác-instance.
- R04: xử lý ở mức thiết kế bằng C05; chờ AC-24/PT-19, không durable draft.
- R05: xử lý ở mức thiết kế bằng C06 và auth terminal response routing; chờ AC-25/PT-20.
- R12: sửa câu điều kiện luyện tập theo D03, không thay quy tắc.
- R07/R09: C09 bổ sung hợp đồng schema/default/cursor và wrapper validation; chờ PT-24/25.
- R06/R08: đã bổ sung hợp đồng tối thiểu theo C07/C10 ngày 03/11/2026; chờ kiểm chứng.
- R03: C08 đã chốt ma trận admission/dự phòng ở mức thiết kế, chờ AC-29/PT-23.
- R10/R11: C11/C12 đã chốt lịch/số mẫu/latency và ownership chung; chờ triển khai,
  đo thực tế và đối chiếu khối lượng theo mốc. Không bảo đảm điểm hoặc chia đều giờ.
- R13: các chỉnh lý tình trạng scaffold/lịch sử còn cần rà ở đợt dọn tài liệu,
  không coi việc duyệt C01–C12 là đã triển khai hoặc đóng mọi finding runtime.

## Trạng thái quyết định hiện tại

C01–C12 đều đã được nhóm xác nhận; C12 có điều chỉnh rõ giao diện cả hai cùng làm,
không chuyển toàn bộ UI nền sang A. Các mục theo lượt bên dưới giữ lịch sử duyệt;
chưa có runtime/kiểm thử nghiệm thu tương ứng. Báo cáo lịch sử ở
[comprehensive design review](comprehensive-design-review.md).

## C07 và C10 — đã chốt ngày 03/11/2026

| Mã | Quy tắc được duyệt | Phạm vi |
| --- | --- | --- |
| C07 | Sau quyền/receipt/validation và BEGIN, lấy t_admit monotonic ngay trước mutation; chỉ nhận khi t_admit < deadline. Receipt cũ được replay; commit thành công sau hạn của write nhận trước hạn vẫn hợp lệ. | Chung EXAM/PRACTICE; một bảng lỗi theo finalize_reason ở protocol §10.4, PT-21/22 và AC-26. |
| C10 | Admin tạo offline khi server dừng, cùng khóa DB/schema/hash, nhập mật khẩu không hiển thị, trùng tên thì lỗi. Loader một file JSON, validate trước listen, sai thì dừng, default tường minh, path từ thư mục config. | A timer/config/hash-validation; B save-submit/finalizer/admin utility/migration. AC-27/28; không thêm UI account admin hoặc expose bootstrap qua NET. |

Đồng bộ 01 v1.5, 02 v1.3, 03 v0.5, 04 v0.4, 05 v0.4 và config mẫu/README.
Chỉ hoàn thiện thiết kế, chưa triển khai parser, CLI admin, timer/handler hoặc
nghiệm thu các tiêu chí. Không đổi stack/core A/B hoặc duyệt lại phân công C12.
R06 và R08 được xử lý ở mức hợp đồng thiết kế tối thiểu, chờ triển khai/kiểm chứng.
Tại lượt C07/C10, bound từng trường config còn cần cụ thể hóa khi viết validator;
C08/C09 được duyệt ở lượt tiếp theo bên dưới.

## C08 và C09 — đã chốt ngày 03/11/2026

| Mã | Quy tắc được duyệt | Giới hạn |
| --- | --- | --- |
| C08 | Gần đầy thì chặn nhận hoạt động mới/sửa bank; ưu tiên save/submit/chốt/rời-hủy ca hiện hữu khi DB còn ghi được. Một policy NORMAL/RESTRICTED theo tài liệu 04 §5.3, replay trước admission. | Không purge tự động/quota service; mốc cảnh báo không phải cap tuyệt đối của write ưu tiên; disk lỗi không ACK giả. AC-29/PT-23. |
| C09 | Optional có ?, default tường minh, nullable khác thiếu, sai kiểu/khóa lạ từ chối; local operation_id=null/effect=NONE, catalog ID tăng; wrapper cJSON và golden vectors chung. | Integer theo giá trị, chuẩn hóa trước canonical; không viết JSON framework. AC-30/PT-24/25; chưa có validator runtime. |

Đồng bộ 01 v1.6, 02 v1.4, 03 v0.6, 04 v0.5, 05 v0.5 và config README.
Core A/B giữ nguyên; chỉ cập nhật thiết kế/tiêu chí kiểm chứng, không đánh dấu đạt
50 thí sinh hoặc runtime. Tại lượt này C11/C12 còn chờ; đã được duyệt tiếp bên dưới.

## C11 và C12 — đã chốt ngày 03/11/2026

| Mã | Quy tắc được duyệt | Giới hạn |
| --- | --- | --- |
| C11 | 180 logical saves/bot theo slot 5s và phase từ seed; 50=9000, 49 khỏe=8820, nhóm 30/10/10=5400/1800/1800. Đo steady 15 phút trong ca 20 phút; deadline 15 phút chạy riêng. | Retry không tăng logical count; tách warmup/steady/burst/peer lỗi; báo scheduled/sent/ACK/error/UNKNOWN/missed, không giấu lỗi bằng percentile. |
| C12 | Core A/B giữ nguyên; cả hai làm UI theo chức năng và chia theme/component chung. A driver/scheduler/metrics/report; B behavior/seed/scorer/DB oracle; DDL theo phần mỗi người. | Không chuyển toàn bộ UI nền sang A; người tích hợp không phải làm hết, không suy điểm từ task hoặc hứa bằng giờ khi chưa biết capacity. |

Đồng bộ 01 v1.7, 02 v1.5, 03 v0.7, 04 v0.6, 05 v0.6, README và tools/load README.
Không thêm code bot/nghiệp vụ hoặc đánh dấu LT đã đạt. Ngưỡng tốc độ/khả năng
phục vụ 50 người vẫn cần đo trên ứng dụng thật. Sau mỗi mốc xem effort/blocker
thực tế rồi điều chỉnh hỗ trợ, không tự đổi ownership core.
