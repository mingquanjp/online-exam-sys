# Review trước triển khai — phạm vi, barem và tính nhất quán

Ngày: 17/11/2026. Nhóm 4 — Nguyễn Minh Quân, Đặng Hoàng Quân.

## 1. Kết luận và mức bằng chứng

Hướng C client/server TCP + poll, Node TypeScript nghiệp vụ, SQLite và Electron
phù hợp với mục tiêu nhóm đang theo đuổi. Không phát hiện chức năng trong barem
bị bỏ khỏi phạm vi thiết kế. Không cần thêm UDP, media, AI chấm bài, PostgreSQL,
đa server hoặc 500–1.000 người chỉ để bám môn học hoặc tìm thêm điểm.

**V01 đã được nhóm chốt sau phân tích ngày 17/11/2026:** không thêm CRC32 vào
bản đầu, giữ length + JSON. Còn V03 về bound cấu hình trước loader. Đã sửa các
mô tả sai lệch rõ ràng; không đổi frame/caps hoặc core A/B.

Đây là review thiết kế và đối chiếu nguồn. Không có nghiệm thu ứng dụng 50 người,
không dùng build pass/probe cũ làm bằng chứng ổn định. Không stage/commit/push.

## 2. Nguồn đã đối chiếu và thứ tự áp dụng

| Nguồn | Đã kiểm tra trong lượt này | Cách dùng |
| --- | --- | --- |
| DS_BTL_20261_KhanhNQ.xlsx | Đọc XML trong file gốc, sheet1 hàng 3, B3–F3 | Đề thi trắc nghiệm, từng chức năng/điểm, ô tổng và số thành viên gợi ý. |
| Transcript nguyên bản nhóm gửi trong chat | Quy mô 50 người cho nhóm hai người, ba mục reliability, giao thức, stdin/stdout, điểm đã đủ | Căn cứ trực tiếp mới hơn cho nhóm. Không tự áp ví dụ của nhóm khác. |
| Note tay trong chat | 50/500 người, đề 1 MB, RAM/database/băng thông, bot kiểm chứng | Ví dụ để tính toán, không tự nhận đề phải 1 MB hoặc phải đạt 500 người. |
| Phan_tich_gop_y_thay_LTM.html | Đọc lại toàn bộ nội dung gốc; ngày 28/10/2026 | Tài liệu phân tích từ transcript, có lời dẫn và đề xuất. Nội dung toàn vẹn/“code chay” phải phân biệt với transcript nguyên bản nhóm đã gửi sau đó. |
| OneDrive_1_11-1-2026.zip | Trích và rà text cả bảy PDF Lec01–Lec07; đối chiếu các phần liên quan | Nền tảng môn: C socket, TCP byte stream, protocol, concurrency, poll, nonblocking và lỗi I/O. Hai sách tham khảo trong ZIP không đọc lại toàn bộ. |
| Repo hiện hành | 01–05; config; README module; sổ quyết định, báo cáo kickoff/nghiên cứu/setup/verification; source/manifest/build scaffold | Đối chiếu thiết kế M01 và trạng thái thực có. Kết quả nghiên cứu lịch sử giữ baseline gốc. |

File gốc được đọc tại Downloads của người dùng, không chép nguyên tài liệu giảng
dạy/ghi âm vào repo. Trích xuất PDF tạm ở /private/tmp, không là artifact nộp bài.
Không sửa slide kickoff/sheet đã trình bày vì nhóm đã yêu cầu tập trung tài liệu build.

Quyết định nhóm mới nhất và transcript trực tiếp ưu tiên hơn phân tích cũ. Tài liệu
hiện hành 01–05 ưu tiên cho triển khai; changelog/probe là lịch sử. Không biến mọi
ví dụ hoặc đề xuất trong tài liệu tham khảo thành yêu cầu của thầy.

## 3. Findings cần xử lý hoặc theo dõi

P1: chốt trước hợp đồng bị ảnh hưởng. P2: xử lý trước mốc triển khai liên quan.
Đây là ưu tiên review tài liệu, không phải xếp hạng lỗ hổng đã khai thác.

### V01 — CLOSED-DESIGN: Giữ length + JSON, không thêm CRC32 bản đầu

**Căn cứ review ban đầu:** HTML §3 có đề xuất CRC32 để kiểm tra đề/đáp án;
03 §2.3 không có checksum ứng dụng. SHA-256 §10.2 là fingerprint chống thao tác
trùng, không là checksum giữa hai đầu truyền. Review từng đề xuất bổ sung CRC32
và coi đây là điểm cần chốt, chưa từng đổi wire format hoặc triển khai CRC.

**Quyết định nhóm duyệt sau phân tích:** chưa thêm CRC32. TCP đã có checksum và
retransmission; phần cần ưu tiên của ứng dụng là framing/partial I/O, schema,
quyền, deadline, commit ACK, receipt/revision và sync. CRC có thể bổ sung phát
hiện dữ liệu bị đổi giữa điểm tính/kiểm tra, nhưng không chữa chọn nhầm dữ liệu
trước khi tính CRC, không chứng minh đã commit và không chống sửa có chủ đích.
Lợi ích bổ sung chưa đủ để đổi giao thức/test trong phạm vi hai người và LAN.
[Nguồn TCP](https://www.rfc-editor.org/rfc/rfc9293.html),
[giới hạn CRC](https://www.rfc-editor.org/rfc/rfc3385.html).

Chưa có yêu cầu trực tiếp đã xác nhận của thầy bắt buộc checksum tầng ứng dụng;
không suy yêu cầu đó từ phương án trong HTML. Nếu nhận yêu cầu trực tiếp mới,
đánh giá riêng và đồng bộ đặc tả trước code. Không nói TCP bảo vệ tuyệt đối mọi
lỗi hoặc length/schema/revision tương đương checksum/kiểm tra chống giả mạo.

Header NET/desktop IPC vẫn 4 byte uint32 BE, payload tối đa 65536 byte, frame
65540 byte. BP vẫn theo §18; không đổi caps, vectors hoặc phân công. A làm RX/
framing, B encoder/TX; cùng kiểm split/coalesced/partial, validation và retry.
V01 không còn là blocker codec. Trạng thái CLOSED-DESIGN, chưa nghiệm thu runtime.

### V02 — P2: Khóa DB kế thừa chưa chỉ rõ đúng loại khóa

02 §11 và config yêu cầu fd 3 giữ khóa nếu C parent chết, nhưng trước review chỉ
ghi advisory lock POSIX. fcntl record lock truyền thống không kế thừa qua fork
theo cách yêu cầu; flock gắn open file description có ngữ nghĩa phù hợp.
[Nguồn: flock](https://man7.org/linux/man-pages/man2/flock.2.html),
[fcntl record locking](https://man7.org/linux/man-pages/man2/fcntl_locking.2.html).

Đã làm rõ flock(LOCK_EX | LOCK_NB), fd 3 sống qua exec, không LOCK_UN khi child
còn DB, không unlink/recreate file khóa, cùng resolved path, cleanup/reap child.
Không thêm một dịch vụ khóa hoặc cơ chế failover. Owner A launcher, B admin tích
hợp; test kill parent/child và launcher thứ hai ở M1/M2. CLOSED-DESIGN, NOT_RUN.

### V03 — P2: Config mới có default/quan hệ, chưa có bound đầy đủ

config/README vẫn yêu cầu viết bảng bound sau cho nhiều timeout/cap. Hai loader
C/TS có thể nhận khác nhau, hoặc cho giảm TX dưới ngân sách control/credit được
đặc tả. Không nên coi chỉ kiểm tra integer dương là đủ.

**Đề xuất tối thiểu:** bản đầu dùng một profile cố định cho các limit vận hành
đã dự toán; chỉ cho cấu hình endpoint/path và timeout nào đã có khoảng rõ. Nếu
muốn cho thay cap, cần bảng min/max và quan hệ trước khi viết loader. Một bộ
vectors accepted/rejected áp cho cả C/TS. Đây là đề xuất chưa tự thay config.
Owner A loader, B review DB/credit. OPEN trước config M1/M2; không cần quota service.

### V04 — P2: Kiến trúc M01 hợp lý nhưng thêm một boundary cần hiểu/test

Hai pipe boundary và việc tách C/Node là chi phí thật của lựa chọn chuyển nghiệp
vụ khỏi C. C code socket vẫn đủ nội dung học, Node không chỉ thay tên backend:
thêm framing/EOF/backpressure/authority routing và child lifecycle. Không hứa
hai tuần chắc chắn đủ chỉ vì dùng AI hoặc Node.

Giữ kiến trúc đã duyệt; M1 chứng minh một luồng thật trước handlers. Một child,
một dispatcher, một DB; dùng cấu trúc queue/counter cụ thể, không generic message
broker/plugin framework. DatabaseSync vẫn đồng bộ và có thể giữ Node event loop,
C riêng không làm nghiệp vụ hết chậm. Đo BP queue/commit/event-loop lag dưới tải.
[Nguồn API pin](https://github.com/nodejs/node/blob/v24.15.0/doc/api/sqlite.md).
TRACK ở M1/M2/LT, không tự yêu cầu đổi stack.

### V05 — P2: Một số error path cần ghi rõ để tránh chết tiến trình

Hợp đồng có EAGAIN/EINTR/EOF nhưng chưa nói rõ SIGPIPE khi ghi socket/pipe gãy,
signal shutdown và reap child. Đã thêm vào 03 §16.4 và 02 §11; áp PT-03/26/28.
Không mở rộng thành hệ thống supervisor hoặc tự restart ca thi. Owner A lifecycle,
B TX/error propagation; CLOSED-DESIGN, NOT_RUN.

### V06 — P2: Đủ chức năng theo barem không đồng nghĩa có điểm cá nhân chắc chắn

Đã đối chiếu đầy đủ ở §4 dưới. Không chia đôi điểm chung hoặc suy điểm từ số API.
Hoàng Quân có nhiều nghiệp vụ/UI; Minh Quân có RX/lifecycle/auth/room/timer và
orchestration. Khối lượng không chứng minh cân tuyệt đối bằng cách đếm dòng task.
Giữ phân công, ghi giờ/blocker qua từng mốc và hỗ trợ phần chung, không thêm tính
năng để cân danh sách. TRACK theo C12; không phát hiện đảo ownership core sau M01.

### V07 — P2: Nguồn cũ có câu “code chay”, chưa đủ để suy ra quy định cấm AI/Node

HTML phân tích có lưu ý này và chính nó nói cần làm rõ ngữ cảnh; bài giảng Lec01
trang 6 nói về cheating/plagiarism và bài tập, không định nghĩa mọi công cụ AI
hoặc thư viện đều bị cấm trong BTL. Người dùng đã chủ động chọn dùng Codex và
cho biết yêu cầu là phần lập trình mạng bằng C. Không tự dựng lệnh cấm hoặc chặn
công việc từ văn bản tham khảo; cũng không khẳng định thầy đã duyệt M01 trực tiếp.

Thực thi theo hướng nhóm đã duyệt: socket/I/O/framing C do nhóm triển khai và
hiểu, không thay bằng Node net/Express/WebSocket/framework server. cJSON,
libsodium và node:sqlite là thư viện hỗ trợ, không thay C socket. Nếu thầy cung
cấp quy định cụ thể mới thì đối chiếu trước phần chịu ảnh hưởng. TRACK thông tin,
không là lý do dừng phần đã được người dùng cho phép.

## 4. Đối chiếu từng mục barem gốc

| Mục trong D3 | Điểm ghi ở nguồn | Tài liệu/chức năng tương ứng | Chủ trì |
| --- | --- | --- | --- |
| Xử lý truyền dòng | 1 | 03 §2/10/15, split/coalesced/partial/retry | A RX, B TX/receipt |
| Cơ chế vào/ra socket server | 2 | 02 §5, 03 §12/18; poll/nonblocking/timeout/backpressure | A loop/lifecycle, B TX |
| Đăng ký và quản lý tài khoản | 2 | 01 FR-01, 03 auth.register và users persistent | A |
| Đăng nhập và quản lý phiên | 2 | 03 §6/10.5, token/binding/revoke/resume | A |
| Kiểm soát quyền truy cập | 1 | 01 FR-02; Node kiểm tra từng request/domain | A helpers, B dùng cho domain B |
| Chế độ luyện tập | 1 | 01 UC-09, 03 practice.start + engine thi | B, timer A |
| Tạo phòng | 2 | 01 UC-03, 03 room.create/configure | A |
| Danh sách phòng | 1 | 03 room.list/get, trạng thái phòng | A |
| Tham gia phòng | 2 | 01 UC-04, 03 room.join/roster | A |
| Bắt đầu bài thi | 1 | 01 UC-05, room.start và snapshot/pages | A điều phối, B sinh/phát đề |
| Thay đổi phương án | 1 | 01 UC-06, answer.save/revision/ACK | B |
| Nộp và chấm | 2 | 01 UC-07, attempt.submit/finalizer | B, A deadline/host end |
| Kết quả phòng thi | 1 | 03 result.get/room.results, quyền công bố | B |
| Log hoạt động | 1 | 01 FR-13, 02 §10, 05 done criteria | Mỗi người log module mình; định dạng chung |
| Phân loại khó/chủ đề | 1–3 | Config counts, catalog, bank/topic, generator | B bank/generator, A config UI |
| Lưu bài thi và đồ thị | 2 | 02 snapshot/answers/attempts, 03 history.list, UI chart | B |
| Giao diện đồ họa | 3 | React/Electron theo chức năng A/B | Cả hai |
| Nâng cao khác | 1–10 | Không tự ghi ba mục reliability thành ba gói cộng riêng | Thầy đánh giá mức hoàn thiện |

Cộng các dòng trước nâng cao: **26–28**; nếu cộng đúng khoảng 1–10 ở dòng nâng cao
thì số học là **27–38**. Ô E3 của workbook lại ghi **35–38**: đây là chênh lệch
ngay trong nguồn, không sửa file thầy hoặc lựa số có lợi để cam kết. Ô F3 ghi 3
thành viên; transcript trực tiếp sau đó đã trao đổi nhóm hai người, không tự kết
luận nhóm hai người sai đề. Không có công thức được xác nhận để đổi các số này
thành điểm hệ 10 hoặc điểm cá nhân. Nhận xét “26 điểm/đã đủ” của thầy là ngữ cảnh
buổi góp ý, không bảo đảm điểm cuối.

“Quản lý tài khoản” chưa có mô tả nguồn bắt buộc CRUD user/quên mật khẩu; không
tự thêm chúng. Server chủ động báo room/attempt changed và client lấy đề/kết quả
theo trang vẫn thực hiện luồng phát đề/thông báo kết quả; cần demo tự động cập
nhật sau sự kiện, không bắt người dùng tự tìm API hoặc thao tác refresh thủ công.

## 5. Phù hợp với bài giảng đến mức nào?

| Phần học đã rà | Trọng tâm hiện được triển khai theo thiết kế |
| --- | --- |
| Lec01 trang 3/5/6 | C socket chi tiết; BTL nhóm; Linux/GCC là môi trường kiểm tra trong slide. Không dùng 70/30 của homework thành barem BTL. |
| Lec02 và Lec03 | TCP byte stream, flow/congestion control, client/server, byte order, địa chỉ/port. Một TCP/thí sinh; IPC không là TCP thứ hai. |
| Lec04 trang 25–47, 52–64 | Socket lifecycle, gửi/nhận thiếu, format/order/semantics của application protocol và state machine. V01 đã chốt không CRC32, giữ giới hạn kiểm tra theo §3 ở báo cáo này. |
| Lec05 | So sánh concurrent server; hiểu fork/exec/signal/EINTR, process/thread/ownership. Không phải dùng cả fork-per-client và thread-per-client. |
| Lec06 trang 4–26 | pollfd/events/revents, chỉ bật writable interest khi cần, nhiều client có fairness. |
| Lec07 trang 3–8, 18–19 | O_NONBLOCK, xử lý syscall/timeout. Không bắt buộc SIGIO/readv/sendmsg nếu thiết kế không cần. |

Node nghiệp vụ và React không làm mất phần C socket nếu đường LAN thật vẫn đi
qua C ở cả hai đầu. Tuy nhiên, không nói TypeScript “hoàn toàn không liên quan
mạng”: nó xử lý giao thức nghiệp vụ, phiên, retry và IPC, còn syscall/byte-stream
LAN thuộc C. Phân biệt trách nhiệm như vậy chính xác hơn khi trình bày.

## 6. Phạm vi cần giữ và giới hạn độ phức tạp

**Giữ:** C TCP/poll/nonblocking/framing; phiên/quyền; bank/admin form; cấu hình
độ khó/chủ đề; đề riêng/snapshot; lưu/đổi/nộp/chấm; deadline; luyện tập; lịch sử/
biểu đồ; GUI/log; reconnect/retry/client chậm; kiểm chứng 50 người.

**Hỗ trợ phạm vi đã chốt, không tự nhận là thầy đòi từng chi tiết:** room cancel/
expiry 30 phút, một activity/user, operation ledger/revision, instance fence,
pending RAM qua renderer reload, lock/migration/config/admin bootstrap, C08
admission. Chúng giải quyết tình huống cụ thể đã được nhóm duyệt; không tự cắt
để rút lịch, cũng không mở rộng thành quota dashboard, recovery service hoặc
framework tổng quát. Chính sách dung lượng giữ ở một helper; validator chỉ cho
schema cần dùng, không viết JSON parser mới hoặc thư viện canonical tổng quát.

**Ngoài phạm vi và không nên thêm lúc này:** 500/1.000 người, nhiều server,
PostgreSQL theo cảm giác, UDP chỉ để có broadcast, ảnh/audio/code execution,
AI chấm bài, mọi đề khác tuyệt đối, chống hook tuyệt đối, durable offline draft,
transfer owner và tiếp tục ca thi sau server crash. CSV import là gợi ý, admin
form đã nằm trong phạm vi; chưa tự nhận cả hai.

Các ngưỡng latency/RAM/disk trong 04 là lựa chọn thiết kế của nhóm để đo, không
phải con số thầy chỉ định. Nếu trượt thì báo đúng và xử lý nguyên nhân; chỉ đổi
ngưỡng khi có căn cứ được ghi lại, không biến mọi mục tiêu thành tuyên bố đã đạt.

## 7. Đã chỉnh và thứ tự tiếp theo

Đã chỉnh: đồng bộ quyết định V01 không CRC32 trong 01–05, đính chính review kickoff cũ,
flock/fd 3 và lifecycle, SIGPIPE/EPIPE, đăng ký không tự login, các chữ worker còn
sót trong nội dung M01. Giữ các changelog ba luồng như lịch sử, không sửa số đo
probe hoặc báo cáo cũ thành số đo của Node. README/sổ quyết định dẫn review này.

Thứ tự thực tế: giữ framing theo V01 đã chốt → khóa config
V03 → M1 một đường request thật → M2 auth/DB/admin → phòng/bank → thi trọn luồng
→ practice/results/recovery → kiểm chứng 50/LAN → bảo vệ. Tải nhỏ nhiều client
và giải thích code thực hiện từ M1, không chờ cuối mới học hoặc tích hợp.

Mục tiêu hai tuần là dự kiến trao đổi của nhóm, chưa là lịch bảo đảm. Nên giữ
những ngày cuối để hiểu/đo/sửa và luyện bảo vệ, hạn chế hiệu ứng UI trước khi
luồng mạng ổn định. Phân công vẫn A RX/auth/room/timer, B TX/bank/attempt/results,
UI cùng làm; quyết định không thêm CRC32 không đổi core hoặc cách đánh giá cá nhân.
