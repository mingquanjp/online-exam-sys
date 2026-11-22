# 05. Kế hoạch triển khai và phân công

Nhóm 4 — Nguyễn Minh Quân (20235816), Đặng Hoàng Quân (20235813).

**Trạng thái: v0.7 — kế hoạch triển khai; phần scaffold nền tảng đã được tạo riêng.**
Căn cứ [nghiệp vụ](01-requirements-and-business-flows.md), [kiến trúc](02-architecture-and-data.md),
[giao thức](03-protocol-specification.md), [quy mô/kiểm chứng](04-capacity-and-validation.md).
M01 ngày 15/11/2026 chuyển nghiệp vụ/SQLite sang apps/business bằng TypeScript.
A quản lý Node lifecycle/BP request-control, B BP response-event/TX integration.
Mỗi người triển khai nghiệp vụ và UI thuộc chức năng được giao. Mốc theo sản phẩm;
ngày 17/11 nhóm xác nhận khoảng 4–5 giờ/người/ngày và mục tiêu hai tuần, chưa chốt
ngày bắt đầu/ngày nghỉ hoặc lịch bảo vệ để gán ngày hoàn thành cụ thể.

Tiến độ nền tảng: đã tạo cấu trúc thư mục, CMake/native entry points kiểm tra
phiên bản, React/Electron shell, npm lockfile, config mẫu và
[hướng dẫn setup](development/setup.md). Chưa có socket, protocol handlers,
spawn client C từ Electron hoặc nghiệp vụ. Đây là một phần M0, không đánh dấu
M1/M2 đã đạt chỉ vì build thành công.

## 1. Nguyên tắc làm việc

Review 17/11/2026 ở [review trước triển khai](research/pre-implementation-review.md):
V01 đã chốt không thêm CRC32 bản đầu; còn V03 bound config trước loader.
Review chi tiết tiếp theo tại [báo cáo 5 tài liệu](research/five-document-consistency-review.md)
ghi đánh giá con số, các chỉnh lý và đầu ra cần khóa trước module tương ứng.
A RX/framing, B encode/TX, cùng vectors/test theo wire format hiện hành; giữ
nguyên core A/B. Nhóm chọn mục tiêu hai tuần và dự phòng thêm 1–2 ngày cho phát
sinh. [Kế hoạch sprint](planning/sprint-plan.md) ghi goal, lịch theo ngày,
checkpoint và review/demo cuối ngày 7/14; không coi tài liệu là bảo đảm tiến độ.

[Review FR/sprint ngày 17/11](planning/fr-sprint-review.md) phân rã các gói việc
và coverage để chuẩn bị ticket. Nhóm xác nhận khoảng 4–5 giờ/người/ngày; mục tiêu
hai sprint một tuần còn rủi ro capacity, chưa là cam kết đủ toàn bộ phạm vi.

- Mỗi người triển khai phần mình qua UI → IPC/client C → TCP/server C → BP/Node TypeScript → SQLite,
  log và kiểm chứng. Không một người chỉ làm frontend, người kia toàn bộ mạng.
- Chia receive/connect và send/queue trong một transport tích hợp, không hai vòng
  đọc socket cạnh tranh; A điều phối event loop, B cung cấp send state machine.
- Dùng một server, một DB, một codec/envelope; chia ownership module chứ không
  tách thành hai sản phẩm rồi chờ cuối kỳ ghép lại.
- Tích hợp ngay từ vertical slice đầu, mỗi mốc có đường chạy tái lập và lỗi đã biết.
- Không suy điểm cá nhân từ số dòng code hoặc tự chia đôi điểm phần chung.
  Báo cáo ai làm gì, chỉ rõ bằng chứng; điểm do thầy đánh giá.

## 2. Ma trận sở hữu module

| Module/chức năng | Chủ trì | Đầu ra có thể review | Người review |
| --- | --- | --- | --- |
| Reactor, socket lifecycle, connect/accept/close, RX/framer | Minh Quân | Descriptor/generation, nonblocking poll, parser luồng byte, fair scheduling, lỗi/timeout | Hoàng Quân |
| TX encoder/queue/partial send, slow-reader policy | Hoàng Quân | Offset, byte cap, writable interest, ownership, error/control reserve | Minh Quân |
| Auth/session/authorization và crypto async queue TypeScript | Minh Quân | Register/login/logout/resume, token RAM, ticket/version, revoked binding, auth UI | Hoàng Quân |
| Phòng và roster TypeScript | Minh Quân | List/create/config/join/leave, presence, reservation, UI phòng chờ/host | Hoàng Quân |
| Start/end/deadline TypeScript | Minh Quân | Dùng generator/finalizer B trong transaction chung, timer monotonic | Hoàng Quân |
| Bank/topics/catalog/admin | Hoàng Quân | Form thêm/sửa/inactive, thống kê nguồn, version, DB queries và permission | Minh Quân |
| Sinh/lưu/phát đề riêng | Hoàng Quân | Random không lặp, snapshot, item pages không key, đủ câu/config | Minh Quân |
| Answer/submit/finalizer | Hoàng Quân | CAS revision, receipt, chấm, state bài, UI lưu/nộp | Minh Quân |
| Practice/results/history/chart | Hoàng Quân | Reuse engine, deadline riêng qua timer A, projection đúng quyền/công bố | Minh Quân |
| Reconnect | Minh Quân: transport/auth; Hoàng Quân: bài/receipt | A nối lại và cấp authority; B sync snapshot/pending/revision; UI hợp tác | Cả hai |

### 2.1. Phần chung có người chủ trì cụ thể

| Đầu việc chung | Chủ trì tích hợp | Phần còn lại |
| --- | --- | --- |
| Shared codec/envelope/BP contracts | A parser C và validators TS, B serializer C/TS và golden vectors | B tính canonical fingerprint trong Node, mỗi người schema phần mình; cả hai review routing metadata. |
| Queue credit và completion routing | A C poll/BP lifecycle, B BP response/event/byte credit | Cả hai đối chiếu authority/terminal auth, saturation và FIFO qua pipe. |
| SQLite open/migration/transaction wrapper TypeScript | B chủ trì hạ tầng DB | A viết schema/repository users/rooms/members/activity; B viết topics/questions/attempt/items/answers; operations chung do B tích hợp. |
| Electron/preload/pipe integration | A chủ trì process/bridge skeleton | B quản lý output buffering/routing response và UI state bài; mỗi người thêm API phần mình. |
| Server C–Node BP integration | A spawn/exec, config/init/ready/open/closed/shutdown; B response/event/TX/credit | A tích hợp Node dispatcher, B DB and completion review; PT-26..28. |
| CMake/build/dependency pin/Linux setup | A chủ trì | B review dependency/migration và clean checkout build. |
| UI components/theme | Cả hai thống nhất màu/layout/component và chia đầu việc cụ thể theo mốc | A làm auth/phòng/host; B làm admin/thi/luyện tập/kết quả. Shared component có người làm và người review, không giao toàn bộ UI nền cho A hoặc B. |
| Bot harness/oracle/report template | A chủ trì driver/scheduler/barrier, thu số đo và mẫu report; B chủ trì behavior exam/practice, seed câu hỏi, DB oracle/scorer | A thêm auth/reconnect/timer/metrics; B kiểm snapshot/answer/score. Một harness, cả hai chạy Linux/LAN và tái lập được. |
| Runbook/demo/bảo vệ | A chủ trì runbook, B chủ trì dữ liệu/kịch bản demo | Mỗi người viết phần giải thích module mình; review chéo. |

“Chủ trì” chịu trách nhiệm đưa phần chung tới trạng thái tích hợp, không có nghĩa
người kia không code/hiểu. Không thêm module nâng cao chỉ để cân bằng danh sách;
hai phần đã có nhiệm vụ mạng và nghiệp vụ rõ ràng.

### 2.2. Nhóm 1 chốt ngày 02/11/2026

A sở hữu room.cancel, state CANCELLED, waiting_expires_at/cancel metadata,
transaction giải phóng activity và timer chờ/startup expiry; thêm UI Hủy phòng
của chủ và hiển thị hạn chờ. B review tính toàn vẹn không attempt/score cho phòng
hủy, điều kiện result/history và reuse DTO/codec theo protocol. C01/C02 nằm M3,
không mở rộng chuyển chủ/gia hạn. C03 giữ dữ liệu đã commit/sync, không thêm local
DB hoặc file offline draft. C04–C06 tối thiểu cũng đã chốt: A chủ trì instance/reconnect, pending registry/API
preload và logout; B tích hợp màn bài/saved state với pending, review không replay
nhầm bài. Các lượt C01–C06 không chuyển ownership core/phần chung; C12 dưới đây điều chỉnh riêng phần chung.

C07/C10 đã duyệt ngày 03/11/2026: A cung cấp timer/mốc xét hạn và config loader
startup; B dùng chung mốc trong save/submit/finalizer, chủ trì tiện ích admin offline
và migration. A cung cấp hash/validation cho tiện ích, B review path/default config.
C10 nằm M0–M2 (hợp đồng/config/tiện ích), xác minh bank UI ở M3; C07 nằm M4 và
dùng lại ở practice. Không thêm framework; điều chỉnh phần chung C12 xem bên dưới.

C08/C09 cũng duyệt ngày 03/11/2026. C08: B chủ trì chỉ số DB/ledger/disk và policy
thuần dùng chung, A tích hợp Node dispatcher scheduling/start/join/auth.register và timer;
B tích hợp save/submit/bank/practice. Một policy, không mỗi handler tự đặt ngưỡng.
C09: A parser/validation chung, B serializer/canonical/golden vectors; mỗi người
schema/DTO phần mình. Khóa helper/schema ở M0/M1 trước handlers, kiểm chứng policy
với DB giả lập gần đầy ở M4/M6. Không thêm dịch vụ quota, parser riêng hoặc đổi
core. Phân công phần chung C12 được ghi bên dưới. Đầu ra AC-29/30 và PT-23..25, không phải test đã đạt.

### 2.3. C11/C12 đã chốt ngày 03/11/2026

- C11: A viết driver/lịch slot cố định và report, B viết behavior/oracle; cùng
  review điều kiện 180 saves/bot, 49 người=8820, nhóm 30/10/10=5400/1800/1800.
  Steady 15 phút trong ca 20 phút; deadline 15 phút kiểm tra riêng. Tách retry,
  steady/burst/expected error và số mẫu thành công khỏi số mẫu dự kiến.
- C12 giữ ownership core. Giao diện cả hai làm xuyên suốt theo chức năng; màu sắc,
  layout/nút/form/component chung được thống nhất, chia từng task, có người review.
  Không chuyển toàn bộ giao diện nền sang Minh Quân. Không coi một người tích hợp
  là người làm hết hoặc tự chia điểm UI/phần chung.
- Hạ tầng SQLite B tích hợp; A tự viết migration/repository users/rooms/members/
  activity, B viết bank/attempt/answer và runner chung. Không để B làm toàn bộ DDL
  của A. Tool admin/hash giữ phân công C10.
- Mỗi mốc, cả hai ghi đầu việc/đầu ra/phụ thuộc và giờ dự kiến mình có thể dành;
  khi kết thúc ghi thời gian thực và blocker để điều chỉnh phần hỗ trợ ở mốc kế.
  Chưa có lịch rảnh/hạn bảo vệ nên không tự gán ngày hoặc hứa khối lượng bằng nhau.
  Mọi task dùng chung phải có người triển khai, người review và tiêu chí hoàn thành;
  không thêm tính năng để cân danh sách. Không suy điểm từ số task/API/dòng code.

## 3. Cấu trúc repo theo M01

```text
apps/desktop/               React, Electron main/preload/UI
apps/business/src/main.ts   Business process entry
apps/business/src/bridge/   BP codec, lifecycle, request/control/completion
apps/business/src/domain/   Auth/room/bank/attempt/practice/result modules A/B
apps/business/src/auth/     Bounded crypto async queue, session helpers
apps/business/src/storage/  node:sqlite, migrations, repositories, transactions
apps/business/src/config/   Business config/ready
apps/business/src/admin/    Offline admin entry, shared hash/DB helpers
src/common/                C framing/envelope/transport validation
src/client/                C TCP connect/RX/TX/reconnect/IPC
src/server/transport/       C poll/accept/RX/TX/heartbeat/limits
src/server/bridge/          C Node spawn/pipe/routing/credit
src/server/main.c           C transport launcher entry
config/                    One server config and client example
db/migrations/             SQL A/B, Node runner
db/seeds/                  Test data/generators
tests/                     C transport and Node integration checks
tools/load/                NET bots and DB oracle
```

Root npm workspace
chứa desktop và business, một package-lock. npm run check build/typecheck cả hai.
Business --version cho biết Node/SQLite runtime. M1 sẽ thêm startup BP, C TCP và
Electron spawn. Entry scaffold báo usage nếu gọi serve trước bước triển khai.

## 4. Hợp đồng giữa các module

SCRUM-9 bổ sung [signature/error/ownership nền](planning/shared-interface-contracts.md)
và [V03 config DRAFT](../config/README.md#v03--bảng-cấu-hình-đề-xuất-scrum-9).
Hai thành viên review contract và xác nhận V03 trước consumer phụ thuộc; chưa
coi tài liệu đề xuất là API/header đã triển khai hoặc quyết định đã được duyệt.

Tên hàm dưới đây mô tả trách nhiệm, chưa là ABI C buộc phải dùng y nguyên. Trước
code, chốt header/types/error/ownership một lần và cả hai dùng chung.

| Giao diện | Caller → callee | Điều kiện/ownership |
| --- | --- | --- |
| frame_feed(bytes) → frames | Reactor/client loop → common RX | Tích lũy/tách, cap trước allocate, lỗi frame không chạy domain; A chủ trì. |
| tx_enqueue(frame), tx_drain(fd) | Reactor → B TX | Chuyển ownership khi enqueue thành công, offset/credit trả khi gửi/dọn. |
| command_submit(command) | C reactor → BP → Node dispatcher | C giữ ticket/credit, Node parse/dispatch tuần tự, Node response chuyển lại C TX. |
| resolve_authority(conn,generation,epoch) | Domain handlers → A auth | Kiểm tra tại thời điểm xử lý; không tin user_id body. |
| reserve_activity/release_activity | Create/join/practice/finalize → A activity helpers | Cùng transaction của caller; release đúng resource/user; không commit lồng. |
| bank_availability(config) | A room/B practice → B bank | Kiểm tra active topic/câu, trả counts hoặc lỗi thiếu; start kiểm tra lại. |
| prepare_room_attempts(room,roster,config) | A start → B generator | Cùng SQLite transaction, không socket; chuẩn bị tất cả hoặc rollback. |
| deadline_register/cancel | A room/B practice TS → A Node timer | Gắn sau commit, trước lệnh tiếp; clock monotonic; không đăng ký bài chưa commit. |
| finalize_attempt/room | A timer/host end → B finalizer | Một kết quả, snapshot key, không phát điểm sớm, cùng transaction room.end. |
| operation_lookup/record | W handlers → B operations | Auth trước lookup, fingerprint chuẩn, receipt không key/điểm sớm; thay đổi+receipt atomic. |
| project_* | Domain → DTO serializer | Whitelist field/quyền công bố, không serialize row thô. |

Đường timer không phụ thuộc reactor nhận frame. Domain tuần tự là thứ tự nghiệp
vụ; queue transport không tự quyết định còn thời gian hay không. Crypto callback Node đưa completion về dispatcher, nơi auth kiểm tra lại ticket,
version và authority. Handler TS thực hiện transaction trước response BP.

## 5. Các mốc có sản phẩm chạy được

| Mốc | A làm | B làm | Bằng chứng/điều kiện ra mốc |
| --- | --- | --- | --- |
| M0 — nền tảng M01 | C transport build, business workspace/config contracts, BP lifecycle design; UI chung | BP response/event/credit, SQLite TS/API review, DTO/migration contracts và UI chung | Build/typecheck desktop + business và C --version, config/ownership/BP thống nhất. |
| M1 — transport và BP | C client/server poll RX/hello/ping; Electron spawn, C spawn Node/init/ready/dispatcher | Encode/TX/partial send, Node response/event encoder, DB bootstrap/readiness và BP routing/credit | UI→client C→TCP→server C→BP→Node→response về UI; PT-01..04/26..28 phần transport/lifecycle. |
| M2 — vertical slice có DB | TS config/auth/crypto/session + UI login, users repository; lock/ready C launcher | node:sqlite wrapper/migration, admin offline, catalog seed/read và errors | UI login→C→BP→Node/SQLite→UI; terminal auth/binding đúng, admin/config AC-27/28 và PT-28. |
| M3 — phòng chờ và ngân hàng | Create/list/config/join/leave/cancel/presence/reservation, timer chờ 30 phút, host UI | Admin forms/topics/questions/versions và availability | Admin offline tạo được và đăng nhập bank UI; hai máy thấy roster, chủ hủy/hết hạn 30 phút đúng, không tạo bài/điểm; đủ/thiếu kho; quyền/ID đúng; AC-01..05/19..21. |
| M4 — thi trọn luồng | Start/end/timer chung, orchestration transactions | Snapshot/item pages, answer/revision/submit/chấm/UI thi | Hai UI nhận đề riêng, ACK đúng, deadline tự chốt, rollback start lỗi; AC-06..10/12/26, PT-21..22; cùng mốc xét hạn C07. |
| M5 — luyện tập/kết quả/khôi phục | Reconnect/resume/replace binding, activity sync | Practice/result/history/chart, operation retry/bài sync | Ngắt mạng làm tiếp đúng đề/giờ, retry không chấm trùng, không điểm sớm; AC-11/13/14 và PT liên quan. |
| M6 — tải 50 và lỗi | Driver/scheduler/report, metrics/clock/Linux/auth/timer/load scenarios | Behavior bot/slow-reader, seed và DB oracle/scorer | LT-01..15 theo C11, đúng số mẫu/nhóm latency và dữ liệu; lỗi nào trượt sửa rồi chạy lại phần bị ảnh hưởng. |
| M7 — hoàn thiện/bảo vệ | Runbook/install/shutdown, khung report, UI phần A, demo và giải thích | Seed/oracle evidence, UI phần B, demo và giải thích; cùng hoàn thiện report | Clean checkout dựng được; cả hai tự chạy; báo cáo đủ chức năng, giới hạn và bằng chứng. |

Không đợi M5 mới nghĩ retry: operation/revision/schema được thiết kế từ M0 và có
test ngay khi W đầu tiên xuất hiện. M5 hoàn tất hành vi phục hồi, không viết lại
toàn DB. M1/M2 kiểm tra tải nhỏ sớm; M6 là nghiệm thu hệ thống, không lần đầu
thử nhiều client. UI đẹp làm dần qua mốc, giữ trạng thái lưu/kết nối rõ ràng.

Các mốc là thứ tự nghiệm thu tăng dần, không là chuỗi Blocks cứng buộc toàn bộ
M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 chạy nối tiếp. Dùng dependency theo đầu ra:
codec trước transport integration; auth/activity/catalog trước phòng; generator và
finalizer trước start/end tích hợp. DB/seed/UI primitives và bot nhỏ có thể làm
song song trên contract. M6 nghiệm thu tải, driver/oracle phát triển từ S1.
Lỗi nền tảng về codec/transaction phải sửa trước mở rộng chức năng dựa lên nó.

## 6. Definition of done cho một chức năng

1. Happy path từ UI đến DB/response thật và lỗi chính chạy được; không chỉ mock.
2. Server kiểm tra quyền, input, state/deadline; DTO không lộ dữ liệu ngoài quyền.
3. W có receipt/revision/version khi cần, commit trước ACK; NONE/UNKNOWN đúng.
4. Có kiểm chứng có ý nghĩa cho rủi ro của chức năng: retry sau commit, lỗi transaction,
   quyền hoặc deadline, không test chỉ lặp lại implementation.
5. Buffer/queue/tài nguyên được dọn cả error path; không log secret/stdout lẫn log.
6. Có cách chạy tái lập, cập nhật doc/trace IDs khi thay hợp đồng; người kia review.

Không coi compile pass là đủ cho network correctness. Cũng không viết nhiều test
hình thức để đủ số: ưu tiên PT/LT/AC đã chỉ ra nguy cơ thực của module.

## 7. Quản lý thay đổi và tích hợp

- Hai người dùng branch theo chức năng/mốc, diff nhỏ có thể review. Không chia
  branch dài hạn “toàn A/toàn B” rồi đến cuối mới merge. Quy trình remote/PR tùy
  repo nhóm; tài liệu này không tự cho phép push/merge/publish thay nhóm.
- Thay envelope/schema/enum/DDL phải cập nhật doc + cả sender/receiver + vector.
  Không âm thầm để UI/C/server nhận ba tên trường khác nhau.
- Thêm migration mới khi đã có dữ liệu dùng chung; không sửa migration đã chạy
  rồi yêu cầu người kia xóa DB cho nhanh. DB demo reset phải có chủ đích/backup.
- Chỉ một transaction owner điều phối mỗi use case, helpers không commit lồng.
- Bug report có request/operation/attempt/connection IDs đã lọc, expected/actual,
  bước tái hiện và config; không gửi dump password/token/bank key vào log chung.
- Mỗi mốc ghi checklist PASS/FAIL/NOT_RUN; người review chạy lại ít nhất luồng có
  rủi ro cao. Chạy lại toàn suite khi đổi contract; không mở rộng test vô hạn sau
  khi phần liên quan đã đạt và không có thay đổi mới.

## 8. Runbook và kịch bản bảo vệ cần chuẩn bị

Hướng dẫn nền tảng hiện có ở docs/development/setup.md. Runbook sản phẩm sau build phải chỉ rõ dependency versions, build/start server và app,
endpoint LAN, setup admin/user/seed, config limits, chạy bot/verifier, vị trí DB/
log, dừng sạch và cách giữ DB lỗi. Các lệnh build/--version ở setup được kiểm chứng theo foundation hiện tại.

Demo dự kiến: hai UI login → catalog/config → join/roster → start → đề riêng →
save/đổi → một người mất mạng rồi trở lại → nộp sớm chưa có điểm → host end →
kết quả/history; demo practice/admin riêng. Kịch bản tải 50 dùng report/bot theo
thời gian buổi bảo vệ, có raw evidence 15 phút; không giả 50 người từ 2 UI.

| Người | Cần tự giải thích sâu |
| --- | --- |
| Minh Quân | Socket/connect/accept, poll/readiness/nonblocking, RX/framing, generation, phiên/binding/heartbeat, crypto async queue Node, roster/reservation, room state, monotonic deadline. |
| Hoàng Quân | Partial send/TX/backpressure, page đề, snapshot/random, save ACK/revision/op fingerprint, submit/chấm/công bố, practice/history và oracle dữ liệu. |
| Cả hai | Vì sao TCP/poll/SQLite/pipe, TCP ACK khác DB ACK, rwnd khác queue ứng dụng, số kết nối/RAM/bandwidth cho 50, transaction/queue credit và giới hạn chưa hỗ trợ. |

Mỗi người phải vẽ được một request phần mình qua UI→client C→TCP→server C→BP→Node→DB và đường lỗi.
Không cần thuộc mọi dòng module bạn nhưng phải hiểu giao diện nối sang phần mình.
Không nhận ba cơ chế reliability là ba gói nâng cao riêng khi thầy đã xác định
thuộc chất lượng chức năng hiện tại.

## 9. Rủi ro và cách điều chỉnh trong phạm vi

| Dấu hiệu | Hướng xử lý trước |
| --- | --- |
| Codec/envelope hai bên lệch | Khóa vector/header và sửa contract chung, không vá tùy API. |
| Hash/login chậm | Đo scrypt async một job, auth queue/callback authority, event-loop lag và save latency. |
| BP/dispatcher queue hoặc save chậm | Profile truy vấn/serialize/commit/checkpoint, đo queue; không đổi Postgres/epoll theo cảm giác. |
| 50 start vượt send cap | Paging/credit/event nhỏ theo protocol; không tăng RAM vô hạn. |
| Lịch làm thiếu thời gian | Giảm phần chưa cam kết như hiệu ứng UI, không bỏ quyền/framing/deadline/retry/các chức năng barem đã nhận. |
| Gặp quy định dependency khác | Ghi thông tin thầy, điều chỉnh có căn cứ trước code phụ thuộc; không tự viết crypto để né thư viện. |

Mục tiêu hai tuần với 4–5 giờ/người/ngày cần đối chiếu estimate còn lại theo
[review FR/sprint](planning/fr-sprint-review.md), chưa là cam kết đủ toàn bộ phạm vi.
Khi chốt ngày bắt đầu/ngày nghỉ và lịch bảo vệ, ánh xạ M0–M7 thành ngày và capacity
từng người; không đổi ownership core chỉ để làm bảng tuần đẹp. Nếu phải cắt chức
năng đã chốt cần nhóm quyết định rõ.

## 10. Lịch sử thay đổi

| Phiên bản | Nội dung |
| --- | --- |
| v0.1 | Hoàn thiện module ownership, chủ trì phần chung, interface/transaction boundaries, M0–M7, done criteria, tích hợp, runbook/bảo vệ và rủi ro. Chưa khởi tạo app hoặc cam kết lịch thiếu căn cứ. |
| v0.2 | Ngày 02/11/2026 chốt nhóm 1, giao A room cancel/expiry ở M3, B review invariant/projection; giữ core và các phần chung, chưa áp dụng đề xuất nhóm 2–3. |
| v0.3 | Ngày 02/11/2026 đồng bộ C04–C06 tối thiểu vào phần A/B hiện hữu, không thêm dịch vụ/client DB hoặc đổi phân công chung; C07–C12 chưa chốt. |
| v0.4 | Duyệt C07/C10 ngày 03/11/2026: timer/config A, save-submit/admin offline B, dùng chung hash/validation; không đổi core hoặc cân phần chung C12. |
| v0.5 | C08/C09: B chỉ số/policy DB, A scheduling; A validation, B serializer/golden vectors; giữ core và phần chung C12 chưa duyệt. |
| v0.6 | C11/C12 đã duyệt với sửa UI: cả hai cùng làm, shared tasks chia rõ; A driver/scheduler/report, B behavior/seed/oracle, DDL theo core; không gán lịch/điểm khi chưa có căn cứ. |
| v0.7 | M01 cập nhật apps/business, C server bridge, A lifecycle/request/control và B response/event/TX, module TS/SQLite/auth và mốc M0–M2. |
