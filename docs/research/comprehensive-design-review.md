# Comprehensive design review — nghiệp vụ, kiến trúc và triển khai

Ngày: 01/11/2026. Baseline được đọc: tài liệu 01 v1.2, 02 v1.0, 03 v0.2,
04 v0.1, 05 v0.1; đối chiếu scaffold/config, research/probe và ghi chú tài liệu lớp.
Đây là review thiết kế, không phải biên bản test ứng dụng đã chạy.

**Kết luận:** hướng C client/server + TCP + poll + SQLite + Electron vẫn có cơ
sở khả thi cho 50 thí sinh. Không cần đổi stack. Tuy nhiên, bộ tài liệu chưa đủ
chặt để coi mọi hợp đồng đã sẵn sàng cho hai người code độc lập: có 2 vấn đề ưu
tiên P1, 9 vấn đề P2 và 2 điểm chỉnh lý P3 bên dưới. Những điểm này là hậu quả
thiết kế hoặc khoảng trống hợp đồng, không phải lỗi runtime đã tái hiện trong
ứng dụng chưa được viết.

Chưa sửa D01–D07, schema hoặc giao thức trong lượt review. Các cách sửa là đề
xuất; riêng thay quyền hủy phòng/giữ chỗ cần nhóm quyết định trước đồng bộ tài liệu.
Không nhận định thầy đã duyệt các thông số mới hoặc bảo đảm điểm số cá nhân.

**Cập nhật 02/11/2026:** báo cáo bên dưới giữ nguyên mô tả baseline được review.
Nhóm đã chốt C01–C03 và tài liệu 01–05 đã đồng bộ: R01 được xử lý ở mức thiết kế
bằng chủ hủy + expiry chờ 30 phút; R12 được sửa câu chữ theo D03. C03 xác nhận
phạm vi dữ liệu server, **chưa giải quyết R04** về API pending sau reload. Các
finding nhóm 2–3 khác còn mở, không coi số P1/P2 lịch sử là trạng thái đã đóng.
Xem [sổ quyết định](review-decisions.md); chưa có test runtime cho những thay đổi này.

**Cập nhật tiếp 02/11/2026:** C04–C06 tối thiểu đã được duyệt và đồng bộ tài liệu.
R02/R04/R05 đã có phương án thiết kế chốt, còn chờ code/test; tên event trong R07
được sửa riêng, chưa đóng các vấn đề schema khác. C07–C10 và nhóm 3 còn mở.
[Sổ quyết định](review-decisions.md) là trạng thái mới nhất, các finding bên dưới
vẫn mô tả baseline lịch sử, không bị xóa hoặc coi là lỗi runtime đã tái hiện.

Cập nhật 03/11/2026: C07/C10 đã duyệt và đồng bộ vào tài liệu hiện hành; R06/R08
được xử lý ở mức hợp đồng tối thiểu, chưa nghiệm thu runtime. C08/C09/C11/C12 còn
mở; xem [sổ quyết định](review-decisions.md). Báo cáo bên dưới giữ nguyên baseline lịch sử.

Cập nhật C08/C09 ngày 03/11/2026: ma trận admission và hợp đồng validator/schema
đã đồng bộ vào tài liệu hiện hành, R03/R07/R09 chờ kiểm chứng triển khai. Chỉ
C11/C12 của các nhóm quyết định còn chưa chốt; baseline findings dưới đây là lịch sử.

**Cập nhật mới nhất 03/11/2026:** C11/C12 đã được nhóm duyệt, với sửa C12 là cả
hai cùng làm UI theo chức năng và chia component chung. R10/R11 có phương án lịch
đo/đếm mẫu và phân công được chốt ở tài liệu hiện hành; chưa có nghiệm thu runtime.
C01–C12 đều đã được xác nhận, các thông báo “còn mở” phía trên là lịch sử từng lượt.
R13/chỉnh lý khác vẫn cần rà riêng; không coi bản review này là báo cáo triển khai.

**M01 ngày 15/11/2026** chuyển nghiệp vụ/SQLite sang Node TypeScript và thêm BP
server C–Node. Baseline review bên dưới là trước M01. Nơi sở hữu session/deadline,
auth crypto, migration và các rủi ro bridge đã cập nhật tại tài liệu 02 v2.0 và
03 §18. R03/R06/R08/R09 được triển khai theo hợp đồng mới, kết quả runtime còn
phải kiểm chứng. Sổ quyết định chứa trạng thái hiện hành.

## 1. Phạm vi và cách review

- Đối chiếu từng FR/UC/invariant với object/API/state/transaction và AC/PT/LT.
- Walkthrough các tình huống mất phản hồi, thay phiên, reload, restart, nộp sát
  hạn, chủ phòng vắng mặt và dung lượng gần ngưỡng.
- Tính lại lưu lượng, số operations, credit queue và nhóm mẫu latency.
- Kiểm tra lựa chọn công nghệ bằng nguồn chính thức về SQLite, Node, cJSON,
  libsodium và clock. Không suy hiệu năng LAN từ echo loopback.
- So trách nhiệm A/B, dependency giữa mốc và công sức phần chung. Chưa có lịch
  bảo vệ/capacity cá nhân nên không hứa số tuần hoặc khẳng định hai phần bằng điểm.

P1: nên giải quyết trước khi khóa thiết kế các module liên quan. P2: cần rõ trước
khi triển khai/tích hợp phần đó. P3: chỉnh lý để tránh diễn giải sai. Đây là ưu
tiên sửa tài liệu, không dùng để mô tả mức nghiêm trọng lỗ hổng bảo mật đã khai thác.

## 2. Các phát hiện

### R01 — P1: Phòng WAITING chưa có đường kết thúc, có thể giữ chỗ vô thời hạn

**Căn cứ:** [01 UC-04, D02/D03](../01-requirements-and-business-flows.md), đặc biệt
dòng 195–196 và bảng quyết định; [04 §5.1](../04-capacity-and-validation.md), cap
50 reservations gồm cả người chờ/offline.

**Tình huống:** chủ tạo phòng rồi muốn bỏ cấu hình đó hoặc không quay lại. Chủ
không được rời/hủy/chuyển chủ; phòng chờ không có deadline hoặc expiry; logout,
mất mạng và restart sạch không giải phóng membership bền. Chủ đó không thể tạo
phòng mới hoặc luyện tập. 50 chủ bỏ 50 phòng sẽ giữ toàn bộ ngân sách reservation,
dù không ai đang thi. Thành viên thường tự leave được nên không phải mọi thành
viên đều bị khóa vĩnh viễn; vấn đề tập trung ở chủ và sức chứa server.

Đây **không phải hai đoạn văn mâu thuẫn**, mà là hệ quả của quy tắc đã chốt chưa
được xử lý về vận hành. Không nên tự diễn giải mất mạng thành leave để chữa.

**Đề xuất ưu tiên:** cho chủ **hủy phòng khi WAITING**, transaction giải phóng
reservations của cả phòng, không tạo attempt/điểm giả. Phải bổ sung state CANCELLED
(hoặc mô hình hủy riêng rõ ràng), API, quyền, event và test; không gán ENDED một
phòng chưa thi rồi vô tình công bố kết quả rỗng. Chưa cần transfer owner/auto-expiry.

Nếu nhóm giữ D02 hiện tại thì cần runbook thao tác bảo trì offline có kiểm soát,
ghi rõ hạn chế này; đó là phương án demo được, trải nghiệm sử dụng hằng ngày yếu
hơn. Không mở một endpoint reset DB hoặc tự xóa lịch sử để giải phóng chỗ.

**Kiểm chứng sau sửa:** chủ bỏ phòng trước start; cancel đua với start/join;
thành viên offline; mọi reservation được giải phóng đúng một lần, không có bài
thi/điểm phát sinh từ cancel. 50 phòng bỏ không chặn ca mới sau cleanup hợp lệ.

### R02 — P1: Pending mutation chưa có ranh giới khi server instance thay đổi

**Căn cứ:** [03 §3, §9.2, §10.5](../03-protocol-specification.md): instance ID mới
mỗi startup, token chỉ RAM, pending main sống qua C/network restart; request W
không có quy tắc buộc tương quan với instance tạo ý định. [02 §11](../02-architecture-and-data.md)
cho phép operator chọn DB demo mới sau sự cố.

**Tình huống:** save của attempt "101" chưa rõ kết quả. Server đổi sang DB demo
mới, ID "101" có thể được dùng lại cho lượt khác. Main còn pending, người dùng
login lại và sync; nếu chỉ so ID/revision/writable thì old op chưa có trong ledger
DB mới, có thể bị xử lý như save mới trên tài nguyên khác. Random operation_id
không tự mang danh tính database hoặc lần chạy server.

Không phải mọi restart đều làm sai bài: cùng DB và cùng ledger vẫn tra được
receipt; K07 còn từ chối phục vụ ca OPEN cũ. Khoảng trống nằm ở trường hợp đổi
instance/dataset mà pending phía client còn sống.

**Đề xuất tối thiểu:** gắn server_instance_id vào pending context ở main/C. Khi
hello trả instance khác, dừng mọi tự replay mutation cũ; báo SERVER_CHANGED local,
login/sync và đối chiếu trước khi người dùng tạo ý định mới. Chỉ tra receipt cũ
khi có chính sách xác định dataset phù hợp, không coi trùng integer ID là bằng
chứng cùng bài. Chưa cần thêm database UUID hoặc cross-restart recovery đầy đủ.

**Kiểm chứng:** giữ main còn sống, thay server bằng dataset khác có ID trùng;
không có save/start/end cũ tự áp dụng vào tài nguyên mới. Restart cùng dataset
cũng không tự áp mutation không còn phù hợp; dữ liệu đã commit vẫn đọc được.

### R03 — P2: Chưa thống nhất admission gần cap với các bài đang diễn ra

**Căn cứ:** [03 §10.2, §16.4](../03-protocol-specification.md) nói hết ledger thì
từ chối W mới, ưu tiên các W đã nhận/timer. [04 §5.3](../04-capacity-and-validation.md)
vừa nói dừng ghi mới vừa nói ngừng ca mới ở 900.000 rows/768 MiB và giữ headroom.

**Tình huống:** nhận ca khi ledger còn dưới 900.000, nhưng trong ca vượt ngưỡng.
answer.save kế tiếp là W mới, chưa phải W đã admission trước đó. Một cách đọc
sẽ tiếp tục cho thí sinh lưu bằng headroom, cách khác từ chối ngay. Auto-finalize
còn chạy không có nghĩa người thi còn lưu được các đáp án hợp lệ.

**Đề xuất:** bảng chính sách ít nhất ba nhóm: mở ca/ghi kho/đăng ký mới; lưu/nộp/
leave/end của activity đã nhận; đọc/replay/internal finalize. Tách soft admission
threshold khỏi disk-full/hard emergency. Dự toán headroom cho các ca đang mở và
cấm nhận thêm ca khi không đủ; không hứa mọi save sẽ thành công khi disk thực đầy.

100.000 rows dự phòng tương đương 10.000s ở 10 save/s, nhưng chỉ khoảng 100s nếu
lấy mức lý thuyết 50×20 command/s đều là save. Rate cap giao thức không phải tải
được SLA bảo đảm; cần ghi ranh giới ấy và giới hạn/giám sát ledger theo workload.

**Kiểm chứng:** seed gần soft threshold, bắt đầu ca, tiếp tục save/submit rồi chốt;
ca mới bị từ chối theo policy, ca cũ hành xử đúng policy, không ACK giả/khóa timer.

### R04 — P2: Main giữ pending nhưng renderer chưa có hợp đồng phục hồi pending

**Căn cứ:** [02 §6](../02-architecture-and-data.md), [03 §9.2–9.3, §10.3–10.5](../03-protocol-specification.md).
Đã nêu pending registry main và renderer reload, nhưng local.status chỉ có
transport/auth/user; state.get/attempt.get chỉ phản ánh server.

**Tình huống:** renderer gửi lựa chọn B, main còn request chưa rõ kết quả, renderer
reload. UI mới lấy answer A/revision cũ từ server, không biết B vẫn pending; có
thể hiển thị đã ổn định hoặc phát ý định khác khi request trước vẫn chạy. DB không
nhất thiết mất đáp án đã ACK; vấn đề là vòng đời draft/pending và tính đúng của UI.

**Đề xuất:** main sở hữu registry theo resource/position/operation và một API
preload cụ thể để lấy snapshot pending sau reload, cùng sự kiện settlement hoặc
request status được query lại. Phân biệt draft chưa gửi, sent/UNKNOWN, confirmed;
không xuất token hoặc generic ipcRenderer. Không cần biến registry main thành
message API NET; local.status hiện không đủ thay nó.

Khi đóng app hoàn toàn, tài liệu hiện chấp nhận mất draft/op RAM. Phải nói rõ UI
khôi phục **đáp án server đã lưu**, không hứa offline autosave qua lần mở app mới.

**Kiểm chứng:** reload trước gửi, sau gửi, sau commit trước response, sau response;
UI không nhầm ACK cũ thành xác nhận draft mới, không spawn C/TCP thứ hai.

### R05 — P2: Logout và auth completion cần ngoại lệ routing/lifecycle rõ

**Căn cứ:** [03 §6.2, §10.1, §16.1](../03-protocol-specification.md): logout revoke
rồi trả response, nhưng completion đều kiểm tra session epoch/authority. [02 §6](../02-architecture-and-data.md)
cho phép xóa token local khi logout không có mạng.

**Khoảng trống:** nếu dùng một bộ lọc response “phải còn session hợp lệ”, chính
response logout sẽ bị loại sau revoke. Tương tự login thay epoch không được bị
lọc theo epoch trước xác thực. Với logout mất ACK, C có được tự resume token cũ
hay phải giữ ý định logout và xóa token? Hai phía chưa có bảng xử lý cụ thể.

**Đề xuất:** tách kiểm tra authority lúc thực thi với routing completion: domain
response cũ không được sang binding/user mới, nhưng auth terminal response được
trả đúng connection generation/ticket đã nhận, theo state transition hợp lệ.
Chốt logout intent: dừng auto-resume khi người dùng logout; lọc/xóa token local,
phân biệt xác nhận revoke server và chỉ đăng xuất local. Đừng dùng logout như
submit/leave hoặc xóa dữ liệu bài.

**Kiểm chứng:** logout có/mất ACK, logout rồi login lại, hash hoàn thành muộn,
binding bị thay khi response cũ đang chờ; không mất xác nhận logout thường lệ
và không gửi dữ liệu cá nhân sang user/binding mới.

### R06 — P2: Cần một điểm xét hạn duy nhất và bảng ưu tiên lỗi

**Căn cứ:** [01 D05](../01-requirements-and-business-flows.md), [02 §7.2, §9.3](../02-architecture-and-data.md),
[03 §7.3, §10.4, §16.3](../03-protocol-specification.md).

Đã thống nhất không lấy thời điểm click/client gửi làm hạn. Tuy vậy “worker xử
lý trước deadline”, “trước transaction” và “ngay trước thay đổi” chưa chỉ một
điểm duy nhất sau các bước auth/lookup/validate có thể tốn thời gian. Đo worker
entry trước hạn rồi dùng nó cho cả handler có thể nhận mutation sau khi những
bước chuẩn bị đã kéo quá hạn.

Ngoài ra §7.3 vừa nêu DEADLINE_EXCEEDED khi đã chốt TIME_EXPIRED, vừa nêu
ATTEMPT_FINALIZED cho bài FINALIZED/TIME_EXPIRED. Có thể phân biệt trạng thái
trước timer, nhưng quy tắc hiện không ghi thứ tự đó, dẫn đến test/handler lệch.

**Đề xuất:** một t_admit monotonic được lấy sau validation/receipt lookup và
ngay trước mutation mới trong transaction; phải t_admit < deadline. Retry receipt
đã commit đi nhánh riêng. Có thể chọn boundary trước transaction nếu nhóm muốn,
nhưng phải thống nhất văn bản/mốc đo, không để hai cách cùng tồn tại.
Định nghĩa precedence: quyền → receipt replay → terminal/deadline → revision;
chốt một code cho từng tổ hợp state/reason/deadline và dùng chung save/submit.
Commit hoàn thành sau hạn của write đã admission hợp lệ không bị đổi thành lỗi giả.

**Kiểm chứng:** queue qua hạn; validation/BEGIN chậm qua hạn; commit qua hạn;
đã FINALIZED do nộp/hết giờ/host end; retry receipt cũ sau hạn. Không cần clock
client đồng bộ với server để xét quyền.

### R07 — P2: Schema IPC/NET còn vài quy ước không đủ quyết định implementation

**Căn cứ:** [03 §3–5, §9](../03-protocol-specification.md).

- §3 cho limit mặc định, nhưng bảng request không đánh dấu limit optional bằng
  dấu ? như quy ước §5. Hai validator có thể nhận/từ chối cùng request thiếu limit.
- Local commands chưa ghi rõ operation_id=null và effect thành công; local.shutdown
  là thay đổi lifecycle nhưng không phải W bền, không nên tự suy thành op ledger.
- Văn bản §9.2 gọi auth.changed, bảng event lại là local.auth_changed.
- Catalog dùng Page/after_id nhưng thứ tự sort/cursor chưa chỉ rõ như room/history/
  admin lists. Danh sách chủ đề thay đổi trong lúc paging cần quy tắc ổn định cơ bản.

**Đề xuất:** phụ lục schema tường minh bắt buộc/optional/default/null/type/range;
chốt object Config và local response/error cùng envelope. Catalog chọn ID tăng,
cursor lấy ID lớn hơn, hoặc quy ước khác duy nhất. Một tên event cho mỗi loại.
Không cần tạo một framework schema hoặc code generator phức tạp để làm điều này.

**Kiểm chứng:** golden request thiếu limit, limit=null/sai range, local.connect/
shutdown/status và catalog nhiều trang; main/C/server nhận cùng tập input hợp lệ.

### R08 — P2: Chưa có hợp đồng setup admin và config loader để dựng hệ thống thật

**Căn cứ:** [02 §11](../02-architecture-and-data.md), [05 M2/M3/M7](../05-implementation-plan-and-task-allocation.md),
[config mẫu](../../config/README.md). Tài liệu đã nói đúng là config chưa được đọc.

Admin không đăng ký qua public API; bank có UI nhưng chưa xác định ai/tiện ích nào
tạo admin đầu tiên. Mẫu config cũng chưa có đầy đủ knobs như deadline/hash queue,
control reserve/ledger; chưa có chính sách unknown key/default/path resolution và
config sai phải fail hay fallback. Đây là việc chưa triển khai có chủ đích, nhưng
cần phân công/hợp đồng trước M2 để cả hai dựng máy độc lập.

**Đề xuất:** B chủ trì schema/seed/setup data, A cung cấp hash/validation; chốt
một tiện ích offline hoặc luồng init đọc password tương tác, không hardcode/argv/
log. Config loader có defaults từ một nguồn, validate bounds/cross-fields trước
listen, in effective non-secret config. Đặt ở M0–M2, không đợi M7 viết runbook.

**Kiểm chứng:** DB trống → migration → admin init → USER register → bank UI;
không thể tự nhận ADMIN. Hai máy dùng cùng config mẫu, đường dẫn/missing key/sai
limit tạo kết quả nhất quán. Chưa cần thêm UI quản lý toàn bộ tài khoản.

### R09 — P2: Phải cụ thể hóa lớp validation/thread-safety cJSON

**Căn cứ:** [02 §5.4](../02-architecture-and-data.md), [03 §3 và §10.2](../03-protocol-specification.md).
Đã ghi đúng rằng thư viện không tự validate mọi thứ, nhưng module common chưa có
contract/parser strategy để thực hiện các yêu cầu nghiêm: depth=16, Unicode/NUL,
key trùng, case-sensitive, integer và canonical fingerprint.

cJSON có caveat về encoding, key trùng và thread safety; dùng API mặc định rồi
chỉ kiểm tra trường sau parse là chưa đủ cho toàn bộ hợp đồng. Đây là khoảng
trống implementation contract, không có bằng chứng scaffold hiện đã mắc race.
[Nguồn chính thức: cJSON caveats](https://github.com/DaveGamble/cJSON#caveats).

**Đề xuất:** A/B khóa wrapper common trước handlers: parse với length/end-pointer,
CaseSensitive accessors, chính sách depth/UTF-8/duplicate/NUL có test; không dùng
global error pointer để truyền lỗi qua luồng, không đổi allocator hooks/locale sau
startup. Canonical serialize theo các schema cố định, tránh tự xây JSON framework
tổng quát. Chốt numeric integer theo giá trị hay cấm lexical dạng 1.0/1e0, vì
parser number dạng double không tự giữ cách viết đầu vào.

**Kiểm chứng:** sai UTF-8, key sai hoa/thường/trùng, escape NUL, nested17, trailing
JSON, number sát biên; nhiều luồng parse/serialize theo contract; cùng body đổi
thứ tự key vẫn cùng fingerprint. Không đổi cJSON chỉ vì phải có wrapper.

### R10 — P2: Kịch bản tải cần chuẩn hóa số mẫu và nhóm latency

**Căn cứ:** [04 §3, LT-02/06/07, §8](../04-capacity-and-validation.md).

LT-02 có 9.000 save cho 50 bot, nhưng LT-07 yêu cầu 49 người khỏe “đạt LT-02”.
Nếu copy nguyên điều kiện count thì 49×180 chỉ có 8.820; LT-06 các nhóm 30/10/10
cũng cần phân biệt tổng ca với mỗi nhóm. Jitter cũng chưa rõ là random phase
trong slot cố định hay dời interval liên tiếp, vốn làm số thao tác thay đổi.

Ngưỡng save steady p95≤250ms và burst hoàn tất≤2s có thể cùng hợp lý, nhưng cần
ghi rõ percentile nào lấy trên steady, burst hay toàn mixed run; không gộp rồi
so một ngưỡng hoặc loại mẫu chậm để pass. Warmup/nhận đề không được làm bài hết
hạn trước khi hoàn thành cửa sổ đo mà vẫn đòi đúng 9.000 lần lưu hợp lệ.

**Đề xuất:** 180 logical saves/bot theo slots xác định/phase jitter; count kỳ vọng
N_healthy×180. Nhóm latency tách profile và loại thao tác, timeout tính rõ; mixed
test báo cả nhóm và tổng, so ngưỡng đã chọn trước. Có thể dùng ca dài hơn cửa sổ
15 phút cho steady và test deadline 15 phút riêng, nếu muốn tách hai phép đo.

**Kiểm chứng:** harness tự in scheduled/sent/ACK/UNKNOWN/expected rejected, số
logical operations không nhân do retry; nhóm 49 người không đòi 9.000 save.

### R11 — P2: Phần việc chung đang dồn thêm khối lượng về B

**Căn cứ:** [01 §11](../01-requirements-and-business-flows.md), [05 §2.1, M2–M7](../05-implementation-plan-and-task-allocation.md).

Core A/B không mâu thuẫn: A có reactor/auth/phòng/timer nặng về trạng thái;
B có bank/attempt/practice/results/TX nặng về dữ liệu/UI. Nhưng B còn chủ trì DB
wrapper/migration, canonical operations, theme UI, harness/oracle và seed/report.
Không đủ căn cứ nói B chắc chắn quá tải hoặc điểm hai người lệch, nhưng chỉ nhìn
số cụm core rồi kết luận khối lượng ngang nhau là thiếu phần chung.

**Đề xuất:** giữ core đã chốt; ghi estimate/capacity theo mốc và chia phần chung
cụ thể. A có thể chủ trì theme/layout nền và harness driver/scheduler/report;
B giữ behavior exam/DB oracle, seed nội dung và scorer. A viết migration phần
users/rooms/activity dưới wrapper B, không để B làm tất cả DDL thay A. Các chuyển
chủ trì này là đề xuất, chưa tự thay bảng phân công đã được nhóm đồng ý.

**Kiểm chứng kế hoạch:** mỗi mốc có đầu ra của cả hai, task phụ thuộc có owner,
người kia dựng/chạy được. Không dự đoán điểm từ số API hoặc định mức ngày khi
chưa biết hạn bảo vệ/capacity của nhóm.

### R12 — P3: Điều kiện bắt đầu luyện tập dùng câu “hoặc” dễ đảo nghĩa

**Căn cứ:** [01 UC-09 bước 1, dòng 293–294](../01-requirements-and-business-flows.md).
“Không ở phòng chưa kết thúc hoặc có lượt luyện tập đang làm” có thể được hiểu
là còn lượt luyện tập thì được bắt đầu thêm. D03/invariant14 đúng và rõ hơn,
nên đây là câu chữ mơ hồ, không phải nhóm đã duyệt hai quy tắc trái nhau.

**Đề xuất:** “Chỉ bắt đầu khi không thuộc phòng WAITING/RUNNING **và không có**
lượt luyện tập OPEN”; resume bài cũ là luồng khác. Giữ AC-19, không thay nghiệp vụ.

### R13 — P3: Thông tin trạng thái tài liệu có chỗ đã cũ

**Căn cứ:** [02 §14.1](../02-architecture-and-data.md), [05 §8](../05-implementation-plan-and-task-allocation.md),
[ghi chú lớp §4](course-material-reference.md). Có đoạn nói chưa tạo khung app/
chưa có CMake dù scaffold đã có; ghi chú lớp còn đề nghị thêm FSM dù 03 đã thêm.

**Đề xuất:** tách ngày/baseline review và trạng thái hiện tại; cập nhật vài câu
trong phần hướng dẫn đang có hiệu lực, giữ changelog/report cũ như lịch sử. Không
sửa số đo cũ hoặc đánh dấu nghiệp vụ đã chạy để làm nội dung nhìn mới hơn.

## 3. Các phần đã nhất quán, nên giữ

| Chủ đề | Kết quả đối chiếu |
| --- | --- |
| Quyền người dùng/chủ/admin | Tách đúng; host không mặc nhiên thấy key, ADMIN không mặc nhiên thấy mọi bài. |
| Join/resume | Người mới chỉ WAITING; thành viên cũ được resume RUNNING với deadline cũ, không gán lại đề. |
| Sinh đề | Mỗi người lấy mẫu riêng, không lặp nội bộ; không cam kết hai đề khác nhau tuyệt đối. |
| Kho và snapshot | Admin cập nhật không đổi đề/key chấm đã gán; catalog không lộ nội dung/key cho USER. |
| Thời gian | Server authoritative, monotonic khi chạy; UI clock không quyết định quyền. R06 làm rõ boundary, không đổi nguyên tắc. |
| Nộp/công bố | Chốt bài riêng không kết thúc phòng; nộp sớm không lộ điểm qua result/history/chart/receipt. |
| Một activity | Reservation gồm chờ/thi/practice; nộp sớm giữ tới ENDED; offline không tự giải phóng. R01 xử lý hệ quả phòng bị bỏ. |
| Practice | Reuse generator/answer/finalizer/timer, deadline riêng; không tạo room giả, kết quả công bố sau chốt. |
| Lưu và ACK | Commit trước ACK, uncertain không báo thành công, retry same op + CAS revision; không gọi đó là giao hàng exactly-once. |
| Thread/DB ownership | Reactor không DB/hash, một business worker/SQLite connection, hash worker riêng có giới hạn. |
| TCP và IPC | Một TCP/client, stdin/stdout pipe riêng không phải kho hoặc bảo đảm chống hook. |
| Mục tiêu 50 | AC/LT yêu cầu hành vi thi thật; hai máy UI và 50 protocol clients bổ sung nhau. |

## 4. Ma trận truy vết nghiệp vụ tới triển khai

| Yêu cầu | Contract/dữ liệu | Chủ trì | Điểm cần xử lý trước code liên quan |
| --- | --- | --- | --- |
| FR-01 tài khoản/phiên | Auth types, users/session RAM | A | R05, R08, R09. |
| FR-02 quyền | Binding/epoch, resource ownership, projections | A helper + từng handler A/B | R02, R05; kiểm tra quyền trước replay. |
| FR-03 bank/admin | admin.topic/question.*, topics/questions.version | B | R07–09, admin init. |
| FR-04 cấu hình | catalog.list/room.configure, Config/config_version | A gọi B availability | R07, R08; validate cả create và start. |
| FR-05 join/roster | room.join/leave/get, members/activity + presence | A | R01, R07. |
| FR-06 điều khiển | room.start/end + timer, room/attempt transaction | A điều phối, B generator/finalizer | R01–03, R06. |
| FR-07 đề riêng | attempt.items/snapshot | B | Paging/byte cap đã có; R02, R09. |
| FR-08 đáp án | answer.save, answers/revision/operations | B | R02–04, R06, R09. |
| FR-09 chốt/chấm | submit/end/timer, attempts kết quả cuối | B + A timer | R03, R06, error/rollback. |
| FR-10 reconnect | hello/resume/state/attempt + pending main | A transport/auth, B bài | R02, R04–05. |
| FR-11 luyện tập | practice.start/shared attempt engine | B dùng A activity/timer | R03, R12. |
| FR-12 lịch sử/biểu đồ | result/history projections | B | Chốt UI đồ thị theo trường thời gian đã chọn; không thêm đường score sớm. |
| FR-13 vận hành | Caps/logs/setup/errors/load harness | A/B theo module | R01, R03, R08, R10–11. |

Không có FR bị mất toàn bộ khỏi thiết kế. Nhiều FR có API nhưng cần hoàn thiện
hợp đồng ở các nhánh lỗi, khác với việc thiếu hẳn chức năng.

## 5. Đánh giá tính khả thi và quy mô

### 5.1. Lựa chọn công nghệ

- Giữ TCP cho luồng đề/lưu/nộp. Framing và ACK nghiệp vụ vẫn cần; không đổi sang
  UDP để tự viết reliable transport cho đề tài này.
- poll/nonblocking ở 50 người là lựa chọn hợp lý để triển khai và giải thích;
  không có số đo hiện tại buộc đổi epoll hay thread-per-user.
- SQLite phù hợp mô hình một business worker sở hữu một kết nối/local file.
  Cần transaction/constraints và đo commit/checkpoint, không phải 50 DB writers.
  SQLite chỉ cho một write transaction đồng thời; đây là điều kiện thiết kế,
  không phải bằng chứng mọi handler đạt latency. [Nguồn: SQLite transactions](https://www.sqlite.org/lang_transaction.html).
- Pipe parent/child là IPC được Node hỗ trợ; buffer hữu hạn và lifecycle phải
  được xử lý. Không có căn cứ kỹ thuật để gọi riêng stdio là dấu hiệu AI hay
  buộc thay bằng Unix socket. [Nguồn: Node child_process](https://nodejs.org/api/child_process.html#optionsstdio).
- React/Electron không phải tầng TCP backend. Nhóm cần hiểu thêm bridge/process
  lifecycle; chưa có lý do thay bằng backend Node/Go làm lệch yêu cầu C.

### 5.2. Các phép tính kiểm tra lại

| Phép tính | Kết quả/diễn giải |
| --- | --- |
| 50×30 KiB đề | 1.536.000 B, cần 6,144 Mbit/s payload nếu 2s; số tính hiện đúng. |
| 50×1 MB trong 2s | 200 Mbit/s payload; không thể đạt trên đường 100 Mbit/s. |
| S1: 50/5 saves/s ×900s | 9.000 saves; 49 người khỏe là 8.820 với 180 saves/bot. |
| 7,5 MiB completion credit /65.540 B | Chỉ khoảng 119 response cỡ tối đa, không phải 960 response tối đa. 50 page requests cùng lúc vẫn nằm trong ngân sách byte, nhưng mọi request chưa thể giữ full credit tùy ý. |
| 1.000.000 ledger rows /9.000 saves/ca | Tối đa khoảng 111 ca S chỉ tính save, thực tế ít hơn do operations khác/soft threshold/DB byte cap. Ví dụ 1.000 ca là phân tích tăng trưởng ngoài cap, không năng lực lưu 1.000 ca hiện tại. |
| Một hash worker, 50 jobs | Last login xấp xỉ 50×h + overhead; nếu h=200ms thì riêng hash khoảng10s, h=500ms khoảng25s. Đây là ví dụ, chưa đo h. |

Ngân sách 97,4/112 MiB là tổng thành phần minh họa, không bound RSS. Đề M có
5.000 item tối đa khoảng39,1 MiB text thô và nhiều overhead nếu materialize cùng
lúc. Sinh/serialize/SQLite có thể tăng peak; giữ streaming/page/credit và đo thật.
Hai ngưỡng RSS256/384 MiB là target cần xác minh, không kết luận máy4GiB đủ từ phép cộng.

Libsodium cho phép chọn CPU/memory cost; interactive dùng khoảng64MiB ở tài liệu
hiện tại. Cần benchmark bản/params trên Linux mục tiêu trước khóa login SLA.
[Nguồn: libsodium password hashing](https://libsodium.gitbook.io/doc/password_hashing/default_phf).

### 5.3. Điểm nghẽn thực tế cần thử sớm

Business worker tuần tự loại nhiều race dữ liệu nhưng không thể bị timer preempt
giữa một transaction dài. Start/snapshot/serialization/chấm/checkpoint kéo dài
sẽ làm lệnh save và deadline khác chờ. Đường control dự phòng giúp queue không
deadlock, không làm DB command đang chạy tự nhanh hơn.

Đo từng handler/start/finalize ở bộ S/M; ghi max thời gian chiếm worker. Nếu
không đạt, tối ưu query/batch/serialize và giảm materialization trước, chưa đổi
DB/kiến trúc theo cảm giác. WAL có checkpoint và vẫn một writer; không phải giải
pháp tự động cho head-of-line blocking. [Nguồn: SQLite WAL](https://www.sqlite.org/wal.html).

Tách hash worker là hợp lý. Đừng biến timer/presence/socket mỗi thí sinh thành
một thread mới hoặc cho mọi module tự mở SQLite để “chạy song song”.

### 5.4. Công sức hai người

Đề tài khả thi nếu giữ phạm vi, reuse attempt engine cho practice và tích hợp
từng mốc. Phần khó chính là state/transaction/retry và hai kênh I/O C, không phải
riêng con số50. Khoảng40 type lệnh/sự kiện cần kiểm tra nên không nên viết tất cả
UI trước hoặc hứa hoàn thành rất nhanh chỉ vì có AI hỗ trợ.

Không ước lượng lịch đáng tin khi chưa biết hạn bảo vệ, kinh nghiệm C/Electron,
số giờ làm/tuần và tiêu chí thư viện thầy cho phép. R11 giúp phân công thực tế
hơn mà không thay core. Bot/AI nên đánh giá bằng oracle và số đo, không thay
việc hai thành viên hiểu code phần mình.

## 6. Giới hạn chủ động chấp nhận, không coi là mâu thuẫn

| Giới hạn | Đánh giá |
| --- | --- |
| TCP thuần, chưa TLS | Đã ghi rõ. Chỉ demo LAN kiểm soát với credential test; chưa thể quảng bá cho kỳ thi thật trên mạng không tin cậy. Không tự thêm TLS trong lượt review. |
| Server crash không resume ca thi | Đã loại khỏi scope. K07 fail startup bảo toàn dữ liệu, nhưng một ca OPEN làm cả server chưa phục vụ tiếp; operator/runbook phải biết, không tự chấm0/reset. |
| Máy server suspend | Đã không cam kết; monotonic Linux không tính thời gian suspend. Tắt sleep trong demo và kiểm tra vận hành, không lấy deadline UTC để lén hứa recovery. [Nguồn: Linux clocks](https://man7.org/linux/man-pages/man2/clock_gettime.2.html). |
| Admin biết bank key | Hệ quả quyền admin đã công khai; không có cam kết chống gian lận nếu admin dự thi. |
| Không đảm bảo các đề khác nhau tuyệt đối | Đúng ngẫu nhiên riêng và cùng cấu hình; không phải lỗi generator. |
| Không cho bỏ chọn sau đã lưu | Đã giới hạn ở 02; UI không thêm nút clear khi chưa có protocol/revision semantics. |
| Không giữ draft qua đóng app | Đã giới hạn; server ACK là dữ liệu bảo đảm, chưa có offline durable queue. |
| Không tự lưu receipts mãi không cap | Đã có cap đề xuất, R03 cần quyết định admission. Không coi ví dụ tăng trưởng1.000ca là retention promise. |

## 7. Thứ tự sửa được đề xuất

1. Chốt R01 với nhóm vì chạm D02 và state phòng. Không âm thầm thêm cancel hoặc
   dùng mất mạng để giải phóng activity.
2. Sửa hợp đồng trước M1/M2: R02/R04/R05/R07/R09; đặc biệt boundary instance,
   pending registry, auth response lifecycle và schema/parser wrapper.
3. Trước M3/M4: R03/R06/R08; admission đối với ca đang làm, mốc deadline và admin
   setup/config phải có owner/test. Không đợi viết xong bài thi mới xử lý các nhánh này.
4. Chuẩn hóa harness/metrics R10 trước benchmark; chia việc chung R11 trước gán
   lịch cụ thể. R12/R13 có thể chỉnh câu chữ đồng thời khi cập nhật baseline.
5. Đồng bộ 01→05, config mẫu và AC/PT/LT; thêm các scenario ở mỗi finding. Sau
   đó đóng một baseline review mới, không ghi “đã giải quyết” nếu mới chỉ có đề xuất.

Không cần viết lại tất cả tài liệu hoặc đổi stack. Có thể đưa scaffold/docs lên
GitHub như WIP, nhưng không nên gọi baseline nghiệp vụ/giao thức là đã hết điểm
chưa rõ. Báo cáo review build trước đó chỉ xác nhận scaffold/hygiene, không phủ
định các phát hiện sâu trong báo cáo này.

## 8. Trạng thái sau review

Đã hoàn thành: đọc/đối chiếu năm tài liệu, kiểm tra nguồn kỹ thuật và phép tính,
walkthrough tình huống, lập findings và thứ tự sửa. Chưa thay hành vi/nghiệp vụ,
chưa chạy protocol/LAN/load test vì ứng dụng chưa có handlers. Những PASS build
trước đây vẫn chỉ là PASS nền tảng. Không stage/commit/push trong lượt review.
