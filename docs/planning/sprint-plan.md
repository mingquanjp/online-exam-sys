# Kế hoạch thực hiện hai sprint và demo

Ngày cập nhật: 18/11/2026. **S1 đã nhập Jira; lịch thực tế do nhóm điền trên Jira.**
Nhóm chọn mốc review S1 sau 7–8 ngày. Bảng ngày 1–7/8–14 bên dưới là kế hoạch
ban đầu theo ngày tương đối; cần cập nhật dự báo theo tiến độ thật.
A: Nguyễn Minh Quân. B: Đặng Hoàng Quân. Core và UI theo chức năng giữ nguyên
[phân công](../05-implementation-plan-and-task-allocation.md).
Đã bổ sung review mức sẵn sàng triển khai, ưu tiên Sprint 1 tại §2.4–2.7;
điều chỉnh bàn giao Sprint 2 tại §3.4. Chưa có chức năng sản phẩm được nghiệm thu.

**Cập nhật backlog:** [65 ticket nguồn](backlog.md) đã phân rã theo goal bên dưới,
estimate hiện tại2–4h/Task;44 candidate S1 và21 candidate S2.
Estimate cộng peer review/sync cho thấy S1 vượt capacity 28–35h/người; goal/lịch
ở đây là mục tiêu, chưa phải cam kết đủ toàn bộ candidate S1. Dùng bảng capacity
backlog và số thực ngày2/4 để chốt khối lượng, không giảm AC hoặc giờ ước lượng giả.

## 1. Khung thời gian và nguyên tắc

- Sprint 1: ngày 1–7. Sprint 2: ngày 8–14. Ngày 15–16 chỉ dự phòng sửa lỗi,
  kiểm lại và bàn giao khi cần; không mặc định đưa tính năng mới vào đó.
- Chưa ấn định ngày bắt đầu. “Ngày” là ngày nhóm làm dự án; bảng này giả định
  hai bạn đều làm khoảng 4–5 giờ mỗi ngày. Nếu nghỉ thì cập nhật lịch thực tế.
- 14 ngày có 56–70 giờ/người; thêm hai ngày tối đa thành 64–80 giờ/người.
  Planning/review/demo/đọc hiểu đều nằm trong ngân sách này.
- AI hỗ trợ code, phân tích lỗi và review; tác giả phải chạy, kiểm tra và giải
  thích được code. Không chuyển thời gian AI tạo code thành số giờ đã nghiệm thu.
- Giữ FR-01..13, C networking, Node nghiệp vụ, SQLite, hai pipe riêng và mục tiêu
  50 thí sinh. Không thêm kiến trúc/tính năng ngoài phạm vi trong hai sprint.

[Review FR/sprint](fr-sprint-review.md) là căn cứ coverage và rủi ro. W01..W26 là
gói việc để truy vết, chưa phải 26 ticket. Tài liệu này bổ sung cách điều hành,
sprint goal và demo; không thay đổi AC/PT/LT hoặc hạ tiêu chí để khớp lịch.
Tiến độ được kiểm soát bằng sản phẩm chạy thật và dự báo còn lại, không thể bảo
đảm chỉ bằng lịch hoặc việc dùng AI. Các mốc dưới là mục tiêu thực hiện.

## 2. Sprint 1 — hoàn thành một lượt thi phòng qua LAN

**Sprint goal:** Hoàn thành một lượt thi trắc nghiệm trên mạng LAN với ít nhất
hai người dùng đồng thời, từ vào phòng đến nhận kết quả; chứng minh đáp án được
lưu và bài thi được chấm đúng bằng demo và đối soát dữ liệu.

Phạm vi: W01–W16, cộng đầu ra nhỏ của W23/W24: driver gọi NET, bot hành vi và
oracle mẫu. Khi soạn ticket, tách phần harness nhỏ này thành ticket S1 riêng;
phần hoàn thiện harness nằm S2, không để một issue thuộc hai sprint.

### 2.1. Điều kiện kết thúc sprint

1. Từ config hợp lệ, server C lấy lock, Node kiểm DB/migrate rồi ready mới listen;
   client C được Electron khởi chạy. Có đường build/run tái lập trên Linux.
2. Hai UI đăng nhập thật, tạo/join/roster; chủ phòng tự là thí sinh. Người mới
   không được join sau start. Rời/cancel/expiry và giới hạn một hoạt động đúng.
3. Start gán snapshot riêng theo counts; đủ câu, không lặp trong đề, không key
   trong payload, lỗi tạo đề rollback cả start. Sửa bank không đổi snapshot cũ.
4. Save/đổi có revision, receipt, commit trước ACK; UI phân biệt đang lưu/đã lưu.
   Nộp đợi save, không chấm hai lần, deadline do server quyết định.
5. Nộp sớm chưa lộ điểm. Host end hoặc hết giờ chốt các bài, mở kết quả cá nhân
   và bảng kết quả chủ phòng đúng quyền. Không đợi S2 mới chặn đọc điểm sớm.
6. RX split/gộp, TX partial/EAGAIN, timeout/caps, quyền và các nhánh lỗi chính có
   kiểm chứng theo task. Test receipt replay/submit lặp không cần chờ reconnect UI.
7. Có chạy đồng thời nhỏ, mục tiêu 5 bot hợp lệ, đối chiếu dữ liệu mẫu. Đây chưa
   phải nghiệm thu 50 người. Có ghi lỗi/chưa kiểm và phần còn lại của FR.

Form admin đầy đủ, practice, history/chart và recovery xuyên tầng hoàn tất S2.
S1 đã có admin offline, bank API/catalog/seed và các nền tảng bắt buộc cho S2:
session/generation/epoch, instance context, pending RAM, receipt/revision/caps.
Không coi FR-03/10/11/12 hoàn tất chỉ vì một phần nền đã có.

### 2.2. Nhịp làm việc ngày 1–7

Mỗi hàng chỉ trọng tâm; mã và test đã đạt được tích hợp dần, không chờ hết hàng.
A/B có thể dùng fixture/mock theo contract để làm song song, nhưng nghiệm thu
phải đi qua phần tích hợp thật. Không đẩy toàn bộ DDL/repository A cho B.

| Ngày | Minh Quân — A | Hoàng Quân — B | Đầu ra ghép cần kiểm |
| --- | --- | --- | --- |
| 1 | Chốt interface/config bound V03 để nhóm duyệt, RX; chuẩn bị DDL A và clock/activity contract. | TX/ownership/offset, schema B/runner, vectors và contract receipt/generator/finalizer. | Build hiện có giữ chạy; hai người dùng cùng framing/caps/contract, không CRC. |
| 2 | Poll/socket lifecycle, BP launcher/input/dispatcher skeleton; kiểm Linux/địa chỉ LAN sớm. | BP output/credit/TX, SQLite wrapper/receipt; tích hợp DDL A/B. | RX/TX ca nhỏ, BP init/ready với DB thật, lock/EOF/cleanup; phần chưa ghép ghi blocker. |
| 3 | Client C/Electron pipe, config; auth/hash/binding đi qua bridge. | Bank repositories/catalog/seed và CLI admin dùng lock/hash A; chuẩn bị generator/finalizer pure helpers. | Một request UI qua hai cầu nối tới DB; auth/admin tiếp tục tích hợp ngày 4. |
| 4 | Hoàn tất auth UI và activity; room create/list/join/roster/cancel; timer helper; login từ máy LAN thứ hai. | Hoàn tất bank/catalog/admin offline, generator/snapshot/page; bot login/seed mẫu. | Hai tài khoản login thật, catalog đủ dữ liệu, tạo/join được; người kia tự chạy lại. |
| 5 | Ghép start/clock/timer/event; UI phòng/host, driver gọi NET nhỏ. | UI nhận đề, save/revision/receipt; hoàn thiện finalizer/submit dùng transaction caller. | Start hai người, snapshot đúng, save vào đúng bài; không còn stub ở đường này. |
| 6 | End/deadline, room expiry/race; chạy LAN, hỗ trợ kiểm thử và log/report. | Nộp đợi save, result tối thiểu, UI lưu/nộp; oracle dữ liệu mẫu. | Trọn luồng hai UI và tải nhỏ; kiểm quyền, retry lặp, rollback, không điểm sớm. |
| 7 | Cùng sửa lỗi chặn demo, chạy lại build tích hợp; demo phần A. | Cùng kiểm dữ liệu, sửa phần B; demo phần B. | Sprint review/demo 60 phút + retrospective 15 phút; chốt S2 theo thực tế. |

Đường găng: codec/poll + BP/DB → auth thật → room/catalog/generator →
start/save/submit/finalizer → công bố kết quả. B bank/DDL và A UI/room có thể làm
song song theo contract. Clock/activity phải bàn giao sớm, không chờ end-to-end
W15 hoàn tất mới để B viết save/finalizer. BP hai đầu là một đợt tích hợp, không
tạo Blocks vòng W05↔W06. Không có hai người cùng viết lại một helper.

### 2.3. Sprint review và demo ngày 7

Buổi review nội bộ hai thành viên; mời thầy nếu thầy có lịch, không mặc định đây
là lịch đã đặt với thầy. Demo bản tích hợp, ghi build/revision/config/seed thực.

| Thời lượng | Nội dung | Người trình bày |
| --- | --- | --- |
| 5 phút | Nhắc goal, phần Done/Not Done, môi trường và giới hạn S1. | A, B xác nhận. |
| 10 phút | Hai UI login; tạo cấu hình từ catalog; join/roster; start, khóa người mới. | A dẫn luồng, B dùng máy thí sinh. |
| 10 phút | Đề đúng counts; chọn/đổi, trạng thái ACK; nộp sớm không điểm; host end và kết quả. | B dẫn bài/kết quả, A điều khiển host. |
| 10 phút | Demo kỹ thuật RX split/gộp và TX partial/slow peer bằng test/harness; chỉ phần đã chạy thật. | A RX, B TX/receipt. |
| 10 phút | Evidence deadline/rollback/quyền/retry và oracle mẫu; nêu ca chưa đạt. | Cả hai theo module. |
| 15 phút | Đối chiếu goal/AC, ghi feedback/bug, dự báo lại việc còn lại và thứ tự S2. | Cả hai. |

Deadline có thể demo bằng ca ngắn hợp lệ, ví dụ 120 giây, chuẩn bị chạy song song;
không dùng nó thay kết quả LT deadline 15 phút. Expiry WAITING 30 phút kiểm riêng,
có thể trình evidence đã chạy trước review; không đổi timeout sản phẩm cho nhanh.
Không dành buổi review để chạy tất cả test hoặc chỉ lướt slide/task list.

Sau review có **retrospective 15 phút**: một điều giữ, một điều cần sửa, tối đa
hai hành động cụ thể có owner cho S2. Review xét sản phẩm; retro xét cách làm.
Issue chưa đạt AC giữ nguyên thực trạng, không chuyển Done chỉ vì demo happy path.

### 2.4. Kết quả review trước triển khai Sprint 1

**Giữ goal và phạm vi S1. Điều chỉnh cách chia và thứ tự bàn giao, không thêm FR.**
Sprint 1 chưa thể được coi là backlog đã sẵn sàng nhập Jira: W01..W16 còn là
gói việc lớn, trong đó W05/W06 và W13/W15 có quan hệ tích hợp cần tách rõ. Các
điểm sau phải được phản ánh vào description/AC khi soạn ticket:

| Phát hiện | Cách xử lý trong S1 | Owner / thời điểm |
| --- | --- | --- |
| Clock/activity nằm ở gói start/end, nhưng save/finalizer cần dùng trước | Bàn giao interface ngay ngày 1–2; helper thực chạy trước tích hợp room/save. B finalizer/generator dùng transaction caller, không tự commit. | A clock/activity, B transaction wrapper; sẵn sàng trước ngày 4–5. |
| W05 đợi W06, W06 lại đợi W05 nếu coi cả gói là dependency | Tách contract/codec, C launcher/input, Node output/routing thành đầu ra riêng. Một ca tích hợp cuối nhận cả hai, không tạo hai cạnh Blocks đối nhau. | A/B chốt ngày 1, ghép từ ngày 2–3. |
| Auth có async hash và đặc lệ route terminal ACK | Bàn giao binding/generation/epoch trước handlers; kiểm login thay phiên và logout ACK sau revoke. Không chỉ test một tài khoản đăng nhập thành công. | A auth, B routing; ngày 3–4. |
| Ledger có thể bị hiểu chỉ dành answer.save | Tất cả W trong danh mục nghiệp vụ dùng helper receipt/fingerprint ngay khi thêm handler: room/bank/start/end/save/submit. Auth register/login/logout không tự đưa vào ledger. | B helper, A/B từng handler; từ W đầu tiên. |
| Retry đang bị gom hết cùng recovery S2 | S1 có timeout/effect, operation.get và retry có giới hạn theo 03 §10.5 trên kết nối còn sống. Bảo toàn op/body, NET request ID mới; UNKNOWN không tự chạy mutation nền. S2 thêm reconnect và reconcile xuyên reload/instance. | A C request/timer, B receipt/UI bài; trước nghiệm thu save/submit. |
| Seed hoặc sửa DB tay dễ thay admin/bootstrap thật | Seed tái lập dùng DB test offline, không chèn tài khoản bằng mật khẩu cứng. CLI admin dùng lock/hash thật, bank APIs đúng quyền; form admin S2. Seed không là đường reset DB khi đang chạy. | A hash/launcher, B seed/CLI/bank; ngày 3–4. |
| Demo start/end có thể thành thao tác refresh thủ công | room.changed/attempt.changed là tín hiệu; UI tự pull đúng phòng/bài/trang và kết quả khi hợp lệ, có throttle/poll fallback. Không cần một event chứa toàn bộ đề. | A event phòng/bridge, B trang đề/kết quả; ngày 5–6. |
| Config V03 chưa duyệt; code có thể tự mở mọi cap | Chốt bảng bound/default/quan hệ và vectors trong W01 trước loader. Chưa tự coi profile cố định là quyết định nhóm. Codec làm được từ cap hiện hành, không phải đợi mọi việc W01 xong. | A soạn, B review, nhóm chốt; trước nghiệm thu loader. |
| Linux/LAN còn bị dồn sát demo | Kiểm Node/C dependency và đường chạy Linux từ ngày 1–2; trước cuối ngày 4 login từ máy LAN thứ hai. Không dùng 0.0.0.0 làm đích client hoặc localhost làm bằng chứng LAN. | A setup/endpoint, B tái lập; không đợi ngày 7. |
| Dồn test và đọc code vào cuối sprint | Task tự có ca quyền/state/rollback/cleanup, ghi chú giải thích C ngay khi làm; ngày 6 chạy trọn luồng, ngày 7 chủ yếu fix/review. | Mỗi owner; không giao mọi test cho W25/S2. |

Không sửa baseline nghiệp vụ qua các điều chỉnh này. Ví dụ: nộp sớm vẫn giữ
reservation tới ENDED; không tự kết thúc khi tất cả đã nộp; thành viên offline
trước start vẫn có bài; không mặc định các đề phải khác nhau hoàn toàn.

### 2.5. Đầu vào ngày 1 và bảng bàn giao có consumer

Trước lúc viết module phụ thuộc, hai bạn xác nhận cùng bản code/tài liệu, build
scaffold hiện có chạy được và có máy Linux để kiểm. Phần đã có chỉ xác minh lại,
không tạo lại project hoặc thay dependency. Quy trình lưu baseline/branch do nhóm
thực hiện theo repo; tài liệu này không tự stage/commit/push.

Tài liệu 01 hiện chứa FR nhóm + UC/AC chi tiết. Khi soạn ticket nghiệp vụ, chuẩn
hóa mã FR con như đã thống nhất, tham chiếu UC/AC gốc; không tạo thêm bản yêu cầu
mâu thuẫn. Việc đánh mã này không chặn bắt đầu codec/transport theo đặc tả 03.

| Đầu ra bàn giao | Provider | Consumer | Khi cần có | Nội dung phải thống nhất |
| --- | --- | --- | --- | --- |
| RX/TX contract và golden vectors | A RX, B TX | C client/server/BP | Ngày 1 trước ghép | Buffer ownership/copy/free, feed/enqueue/drain, cap/offset/lỗi; NET/IPC 65536, BP 69632 payload. |
| Schema/envelope validation và canonical | A validator, B canonical/serializer | Mọi handler/ledger | Ngày 1–2, trước W đầu tiên | Từ chối duplicate key/unknown/null sai; ID lớn là string; fingerprint trên dữ liệu đã chuẩn hóa. |
| DDL/repository A và B | Mỗi người phần mình, B tích hợp runner | DB ready/auth/room/attempt | Ngày 1–2 | FK/index/state/ID, thứ tự migration; không yêu cầu B tự thiết kế lại schema A. |
| with-transaction và receipt helpers | B | A room/start/end, B bank/save/submit | Ngày 2–3 | Transaction owner, rollback, no nested commit, user+op+fingerprint, receipt cùng commit; chỉ response/event sau commit. |
| BP lifecycle/request và completion contracts | A request/lifecycle, B output/routing | C launcher, Node dispatcher | Ngày 1 contract, ngày 2–3 ghép | opened/request/closed FIFO, request ticket/credit, fd generation/epoch, terminal auth whitelist, EOF/fail-stop. |
| Auth/hash/binding helpers | A | B admin CLI/bank, mọi handler | Ngày 3–4 | Không nhận role/user_id từ body; hash queue có cap; C giữ token, renderer không nhận token. |
| Clock/deadline + activity helpers | A | A room, B save/finalizer/practice | Ngày 1–2 contract, trước ngày 4–5 tích hợp | t_admit bên trong transaction, strict nhỏ hơn deadline; reserve/release đúng user/resource cùng transaction caller. |
| Catalog/availability | B | A cấu hình/start | Ngày 3–4 | Counts active theo chủ đề/độ khó; kiểm lại trong start transaction; thiếu câu trả lỗi và rollback. |
| Generator/finalizer | B | A start/end/timer | Contract ngày 1–2, thực chạy ngày 4–5 | Không socket/commit lồng, start tất cả hoặc không ai, snapshot bất biến, finalize một lần và đúng reason. |
| Pending/ACK/UI event interface | A main/client bridge, B màn bài | UI A/B và S2 recovery | Contract ngày 2, dùng ngày 5–6 | Một ý định một op, ACK lựa chọn cũ không xác nhận lựa chọn mới; pending RAM có cap và đúng user/instance. |
| Bot driver / behavior / oracle mẫu | A driver, B behavior/oracle | Test tích hợp và S2 load | Contract ngày 4, chạy nhỏ ngày 6 | TCP thật, account/seed riêng, lưu ACK/revision, bộ chấm độc lập; không ghi bypass DB khi bot làm bài. |

Tên helper là mô tả trách nhiệm, không áp API/ABI mới thay tài liệu 05. Khi viết
ticket chốt signature/error/ownership thực tế trong code dùng chung, không tạo
thêm generic framework hoặc code generator để thực hiện các bảng này.

### 2.6. Các lát cắt nghiệm thu và ca lỗi bắt buộc S1

Đây là thứ tự ghép sản phẩm, không phải ép toàn bộ công việc A/B nối tiếp.
Mỗi lát cắt chỉ được ghi đạt khi chạy thật; mã task Jira sẽ truy về gói W và AC/PT.

| Lát cắt / mốc | Cần chứng minh | Ca lỗi tối thiểu ở mốc | Nguồn |
| --- | --- | --- | --- |
| Nền — ngày 2–3 | Framer/TX, DB ready/BP/lock, cleanup; kiểm bridge nhỏ có request/response thật. | Split/gộp/length sai, partial send, EAGAIN; Node lỗi startup không listen; stdout lẫn log/EOF dọn child. | PT-01/02/03/26; AC-28. |
| Auth + bank — ngày 4 | Register không tự login; login và catalog thật; admin offline và bank APIs đúng quyền. | Login sai/trùng user, người thường gọi admin, login thay binding cũ; logout ACK không rơi; config sai/cwd khác. | AC-01/02/27/28; PT-04/05/20. |
| Phòng + đề — ngày 5 | Roster, counts/availability, start atomic, từng người pull đúng đề theo trang. | Thiếu kho lúc start, config version cũ, join/start race, người mới sau start, snapshot không key và không đổi sau sửa kho. | AC-04/05/06/07/19; PT-10/11/14. |
| Lưu + nộp — ngày 5–6 | Save/revision/ACK, nộp đợi save, scoring snapshot và deadline. | Cùng op retry không tăng revision hai lần; cùng op khác body conflict; ACK cũ/click nhanh; submit lặp; transaction lỗi không ACK giả. | AC-08/09/10/26; PT-06/07/08/21/22. |
| Kết thúc + công bố — ngày 6 | Host end và timer, score đúng, quyền result/room table; activity release đúng. | Nộp sớm không điểm/không hoạt động mới; client chỉnh giờ; mọi người offline vẫn chốt; lỗi finalizer không công bố một phần. | AC-09/12/14/19/26; PT-09/21/22. |
| Vòng đời chờ + đồng thời — trước review ngày 7 | Cancel/expiry giải phóng đúng, hai UI LAN + bot nhỏ, dữ liệu không lẫn. | Chủ mất mạng không leave/cancel; cancel/start race; expiry 30 phút thật, không gia hạn; slow peer không giữ cả loop. | AC-15/17/18/20/21; PT-03/15/16. |

PT-02/05/20 có thể còn nhánh cần S2 (nhất là resume/logout offline); record S1
ghi đúng nhánh đã chạy, không đánh toàn PT là PASS nếu chỉ kiểm một phần. Tương
tự slow-peer test nhỏ S1 không tự nhận LT-07 tải 49 người đã đạt. Có thể test
biên deadline bằng clock injection ở module và demo ca 120 giây hợp lệ; LT ca
thật ở S2 giữ nguyên. Không cần mỗi ca kiểm là một ticket riêng.

Đối với admission gần đầy: helper C08 và cách chặn nhận mới/cho ca hiện hữu đã
có từ S1, có test policy thuần và tích hợp lúc handler được thêm. Fault injection
disk/ledger/BP saturation đầy đủ nghiệm thu W22/S2, không dời policy sang S2.

### 2.7. Đầu ra cuối S1 để S2 bắt đầu không phải viết lại

- Một build tích hợp chạy lại được; config/seed/admin bootstrap/runbook bước đầu,
  không dùng DB test sửa tay làm điều kiện ngầm để app hoạt động.
- DDL/migrations, receipt/fingerprint, revision, authority/generation, clock,
  snapshot/page và event/pending contracts đã dùng thật trong luồng thi.
- Test/vectors của RX/TX/BP và các ca S1 ở §2.6, kèm dữ liệu mẫu/ACK/oracle đã lọc
  secret; lỗi/chưa kiểm có owner và giờ còn lại.
- API backend nền cho S2: auth/session/resume contract, state.get/operation.get,
  attempt.get/items/result, catalog/bank; phần chưa có phải nêu cụ thể, không gọi
  tên contract là đã implement. Resume xuyên kết nối có thể còn ở W17/S2.
- UI đã nhận trạng thái lưu/kết nối, không cần thay toàn bộ Electron bridge khi
  thêm recovery/practice/history. Mock còn lại phải chỉ rõ, không nằm trên luồng goal.
- Review ngày 7 xác nhận phần đạt và carry-over. Không reset baseline/test hoặc
  đổi payload/DB tùy tiện khi bắt đầu S2 để né lỗi tích hợp.

### 2.8. Checklist stack và vận hành từ audit phạm vi

Các điểm dưới lấy từ hợp đồng 02/03/04 hiện hành, không là tính năng mở rộng:

| Nội dung | Đặt vào gói / owner | Mốc và cách kiểm |
| --- | --- | --- |
| C11/POSIX, poll/nonblocking; React/TS/Electron; Node 24.15.0 riêng, node:sqlite/node:crypto; cJSON/libsodium đúng vai trò | W01/W04/W05 A, W07 B; build theo lockfile/setup hiện có | S1 xác minh Linux; giữ versions đã pin, không dùng Node bên trong Electron làm business runtime. |
| 50 activity gồm WAITING/RUNNING/offline/nộp sớm và practice OPEN; 128 TCP/64 unauth khác reservation | W04/W09/W11 A, W20 B dùng helper A | S1 kiểm global cap cả nhiều phòng, không chỉ room.capacity; S2 kiểm hỗn hợp 30/10/10. |
| Rate limit binding/ping/IP/username, inflight/caps, fair scheduling và auth queue | W04/W08/W09 A, W03/W06 B | S1 kiểm nhận/từ chối/backoff và client khác vẫn chạy; S2 benchmark login/tải. Dùng đúng 03 §12, không thêm dịch vụ quota. |
| Timeout theo loại: connect/hello/local.ready 5s; request thường 5s; auth tối đa 65s cho job 60s; startup/shutdown server 10s | W05/W08/W09 A, B routing/error UI | S1 không để default request_timeout_ms=5000 cắt mọi auth; hai loại child có deadline riêng, không gộp thành một timer 5s. |
| Retry tự động W chỉ BUSY/RATE_LIMITED + effect=NONE, cùng op/body và còn budget, tối đa 2 lần sau lần đầu | W08 A, W07/W13/W14 B | S1 kiểm retry trên kết nối còn sống; timeout mutation trả UNKNOWN, không tự gửi lại nền. Query/reconcile sau UNKNOWN không là retry tự động cũ. |
| Log có ID đã lọc, line/queue/rotation có cap, thu/drain stderr child | W04/W05 A định dạng/sink/drain; A/B log module mình | S1 có cơ chế giới hạn theo 04 §5.3: 5×10 MiB, line 1 KiB, queue 1 MiB, dropped_log; không block poll vì pipe log đầy. S2 lỗi/saturation kiểm lại. |
| SQLite WAL/FULL/FK, prepared statements/int64 string, migrations/check schema/K07 và lock kế thừa | W07 B và DDL A, W05 A lifecycle | S1 startup sai không listen/reset/downgrade; trước lần serve đầu phải chặn DB cũ RUNNING/OPEN. W22/S2 thử crash/khóa kế thừa đầy đủ. |
| IPC whitelist/sender validation, token ở C RAM, main pending 32, BP credit và stdout chỉ frame | W08/W09 A, W03/W06 B | S1 test API trái phép, frame/log lẫn, pending/TX có cap; S2 reload/instance/old callbacks đầy đủ. |
| Pagination và automatic refresh đúng owner | W11 A, W12/W16 B; W19/W21 S2 | UI/client flow tự gọi trang qua IPC/C; catalog/list theo cursor và byte budget, item tối đa 5/trang. Không thêm API chart riêng để lộ điểm sớm. |
| Cold backup và clean restore/runbook | W26 A điều phối, B DB/integrity oracle | S2 dùng server đã dừng sạch, giữ bộ dữ liệu đúng WAL; không thêm online backup service hay resume ca thi sau crash. |

V03 bound config còn cần chốt trước loader như W01; bảng này không tự mở hoặc
đổi các ngưỡng đã dự toán. Chi tiết audit và inventory mọi lệnh ở
[review FR/sprint §9](fr-sprint-review.md#9-audit-phạm-vi-và-stack-với-sprint-plan).

## 3. Sprint 2 — hoàn thiện phạm vi và chứng minh 50 thí sinh

**Sprint goal:** Bản ứng dụng đầy đủ phạm vi đã chốt, phục hồi kết nối đúng dữ
liệu/giờ và có bằng chứng phục vụ 50 thí sinh làm bài đồng thời; cả hai tự dựng,
demo và giải thích được phần C networking mình sở hữu.

Phạm vi W17–W26 và các phần hoàn thiện FR-03/10/11/12. Ngày 8 bắt đầu bằng
kiểm đầu ra S1; việc S1 chưa xong phải ghi carry-over với giờ còn lại và tác động,
không giả toàn bộ S2 vẫn còn nguyên capacity.

### 3.1. Điều kiện kết thúc sprint

1. Admin quản lý chủ đề/câu qua form, đúng quyền/version/paging; không sửa đề cũ.
2. Recovery, reload renderer, logout offline/mất ACK, đổi binding/instance và
   retry/sync đúng; không reset đề/giờ hoặc replay W sang dataset mới.
3. Practice dùng engine chung và deadline riêng; activity khóa đúng. Kết quả,
   chi tiết/history/chart công bố đúng quyền và đúng thời điểm, không gửi key sai phạm vi.
4. AC/PT/LT áp dụng có kết quả/evidence; có 50 thí sinh thực hiện nhận đề, save,
   submit, kết quả; steady/burst/mixed/faults và oracle theo tài liệu 04. Không
   lấy hai UI hoặc 50 TCP nhàn rỗi làm bằng chứng đạt tải.
5. Báo cả C+Node RSS/CPU, BP/queue, latency/số mẫu/error và băng thông/DB thực tế;
   không bỏ các ca lỗi hoặc sửa threshold sau đo để báo pass.
6. Clean setup/Linux/LAN, migrate/admin/start/shutdown theo runbook tái lập; dữ
   liệu crash theo K07, không tuyên bố hỗ trợ resume ca thi sau restart server.
7. Không còn lỗi chặn luồng chính, mất/lẫn dữ liệu đã ACK, sai quyền/chấm/deadline
   hoặc crash dưới tải mục tiêu. Lỗi nhỏ còn lại ghi rõ và nhóm đánh giá bàn giao.
   Mỗi người tự giải thích và tái hiện được cơ chế mạng phần mình.

### 3.2. Nhịp làm việc ngày 8–14

| Ngày | Minh Quân — A | Hoàng Quân — B | Đầu ra ghép cần kiểm |
| --- | --- | --- | --- |
| 8 | Reconnect/resume/revoke, pending qua reload/logout; driver metrics. | Sync bài/retry cùng op, form admin dùng handlers S1. | Ngắt/nối lại trước/sau hạn; lưu không bị báo giả; admin form có luồng thật. |
| 9 | Hoàn tất recovery/instance/old callbacks, hỗ trợ timer practice và chạy kiểm A. | Practice reuse engine, result/history projection; hoàn thiện bot behavior/oracle. | Thi và practice không chiếm hai activity; dữ liệu/bài/giờ giữ đúng khi sync. |
| 10 | Chạy tăng dần 5→20→50, đo BP/queue/login/CPU/RAM. | History/detail/chart, paging; đối soát dữ liệu và sửa bottleneck B. | 50 thí sinh chạy luồng chuẩn lần đầu; chart và admin không chặn thử tải. |
| 11 | Steady/burst/slow peer/reconnect, metrics và sửa transport/auth/timer. | Mixed practice/phòng, oracle/scorer, admission/DB error và sửa domain B. | Có raw evidence cho các profile; lỗi gán đúng owner, không chỉ report biểu đồ đẹp. |
| 12 | Cùng hoàn tất LT còn thiếu, Linux/lock/crash/shutdown; chạy lại phần lỗi. | Cùng chạy oracle, race/commit/retry và kiểm quyền; chạy lại phần lỗi. | Coverage có PASS/FAIL/NOT_RUN, workload/số mẫu đúng; còn bug phải nêu mức độ. |
| 13 | Clean checkout/runbook, kiểm cài/chạy máy còn lại, giải thích C A. | Seed/demo/result evidence, UI phần B, giải thích C B. | Freeze tính năng mới; sửa lỗi và kiểm hồi quy phần bị ảnh hưởng. |
| 14 | Demo phần A, báo cáo tải/giới hạn, review sản phẩm. | Demo phần B, oracle/kết quả, review sản phẩm. | Sprint review/demo 60 phút + retro 15 phút; quyết định bàn giao hoặc dùng buffer. |

Tải chuẩn S chạy steady 15 phút trong ca 20 phút; LT deadline 15 phút và expiry
30 phút là ca riêng. Chuẩn bị máy/seed/script trước lúc chạy và ghi kết quả ngay,
có thể thực hiện các việc độc lập trong khi chờ ca thật. Không cắt ngắn phép đo
hoặc hạ hash/SQLite durability để tiết kiệm lịch.

### 3.3. Sprint review và demo ngày 14

| Thời lượng | Nội dung | Người trình bày |
| --- | --- | --- |
| 5 phút | Goal, coverage FR/AC và kết quả so với review S1. | A/B. |
| 15 phút | Thi hai UI: tạo/join/start/save; ngắt mạng rồi sync; nộp sớm, end, kết quả. | A phiên/phòng, B bài/nộp/kết quả. |
| 10 phút | Admin thêm/sửa/inactive, practice, lịch sử/chart và kiểm quyền. | B, A thao tác đối chiếu trên máy thứ hai. |
| 15 phút | Báo cáo 50 người: steady/burst/mixed/lỗi, số mẫu/latency, tài nguyên và oracle. | A trình số đo, B chứng minh tính đúng dữ liệu. |
| 10 phút | Hỏi đáp: mỗi người vẽ một request C qua các tầng, giải thích một error path và giới hạn. | Mỗi người khoảng 5 phút. |
| 5 phút | Feedback/bug còn lại, kết luận goal và điều kiện bàn giao/buffer. | Cả hai. |

Các ca tải dài chạy trước buổi review, trình raw report/seed/config/build tương
ứng. Có thể chạy thêm demo bot ngắn trực tiếp nếu thuận tiện, nhưng không thay
evidence workload đầy đủ. Kịch bản demo không làm lộ token/password/key đề vào log.
Retro 15 phút sau review, ghi điều cần cải thiện cho sửa lỗi/bảo vệ. Không mô tả
buổi nội bộ này là thầy đã nghiệm thu hoặc xác nhận điểm.

### 3.4. Review dependency Sprint 2

Giữ goal và ngày review 14. Điều chỉnh để B không phải hoàn thành mọi UI/recovery
rồi mới cho A đo tải:

| Luồng S2 | Đầu vào từ S1 | Cách làm song song / điều kiện nghiệm thu |
| --- | --- | --- |
| W17/W18 recovery | Binding/instance, receipt, pending, attempt snapshot và server clock | A triển khai transport/auth, B reconcile/UI theo interface. Không Block hai chiều; ca end-to-end nghiệm thu chung sau hai đầu. |
| W19 admin form | Bank API/version/catalog/permission S1 | B viết form từ API đã có, không phụ thuộc reconnect xong mới bắt đầu. A hỗ trợ test quyền/paging/seed theo kịch bản B. |
| W20 practice | Generator/save/finalizer/clock/activity đã dùng trong thi | B viết practice.start và UI dùng chung trước; thêm kiểm recovery khi W17/W18 sẵn sàng. Không coi phải đợi toàn recovery mới được viết practice. |
| W21 history/chart | Projection result/publication S1 | Làm trên bài thi đã có trước, thêm bài practice sau; không chặn mọi history bởi W20. |
| W23/W24/W25 load | Driver/bot/oracle nhỏ S1 | Ngày 10 chạy profile thi một phòng trước, không chờ chart/admin hoàn tất. Mixed cần practice, lỗi reconnect cần W17/W18; nghiệm thu toàn W25 vẫn cần đủ kịch bản. |
| W22 faults / W26 bàn giao | Cap/policy/lock/receipt và evidence từng module | Test theo module khi sẵn sàng, không chờ hết UI. A/B tự sửa phần mình; khung runbook cập nhật dần, không dồn tất cả ngày 13. |

Không chuyển sang Postgres/epoll hoặc tăng cap vì lượt 50 đầu trượt. Trước hết
đọc metrics queue/commit/hash/TX và dữ liệu oracle để xác định nguyên nhân. Nếu
S1 carry-over thì ghi rõ phần nào đang chặn ca tải nào và dự báo lại ngay ngày 8.

## 4. Điều hành hằng ngày để giữ tiến độ

Mỗi ngày dành tổng 4–5 giờ/người theo khung tham khảo:

| Hoạt động | Thời gian/người |
| --- | --- |
| Đồng bộ đầu ngày: đầu ra hôm qua, đầu ra hôm nay, blocker/interface cần bàn giao | 10 phút |
| Code và tự test theo task | 165–225 phút |
| Review chéo/tích hợp thay đổi nhỏ | 30 phút |
| Đọc hiểu phần vừa làm, giải thích một syscall/state/error path, ghi chú | 25 phút |
| Cập nhật kết quả/giờ còn lại và checkpoint cuối ngày | 10 phút |
| **Tổng** | **240–300 phút** |

Ngày 7/14, review+retro 75 phút **thay bớt thời gian code**, không cộng ngoài
4–5 giờ. Day 1 planning cũng nằm trong giờ làm; không tạo thêm một tuần chuẩn bị.

- Mỗi người một task chính đang làm; có thể review/hỗ trợ đầu ra người kia khi
  blocked. Tránh mở nhiều nhánh AI cùng sửa một module/contract.
- Không đợi xong mọi tầng mới ghép. Tích hợp một thay đổi có thể kiểm mỗi ngày;
  người kia chạy lại ít nhất luồng rủi ro cao trước nhận bàn giao.
- Nếu mất khoảng 45 phút không tiến triển vì thiếu đầu vào/lỗi interface, báo
  người kia và ghép kiểm ngay. Không im lặng tới cuối ngày hoặc viết workaround
  đổi protocol. Lỗi độc lập giao owner đúng module.
- Cuối ngày ghi đầu ra chạy được, bằng chứng, bug/blocker và giờ dự kiến còn lại
  của từng người. Đếm task Done không thay dự báo còn lại hoặc chứng minh FR xong.
- Có thể dùng AI giải thích code/review/test, nhưng không ghi AI là reviewer
  độc lập đã duyệt. Mỗi người phải giải thích được code mình nhận trước Done.

### 4.1. Checkpoint và phản ứng khi lệch

| Gate | Điều kiện | Cách xử lý nếu không đạt |
| --- | --- | --- |
| Cuối ngày 2 | RX/TX và BP/DB có kiểm tích hợp nhỏ; rõ blocker nền còn lại. | Ghép A/B sửa đường nền; dừng polish và abstraction chưa cần. |
| Cuối ngày 4 | Login UI thật qua C→BP→Node→DB và catalog/seed sẵn. | Cập nhật dự báo S1 ngay, thu hẹp việc song song về đường găng; không thay bằng mock để báo đạt. |
| Cuối ngày 7 | Sprint goal 1 demo được và các điều kiện S1 được kiểm. | Review ghi chưa đạt/phần đạt; đưa giờ còn lại vào đầu S2 và cập nhật mốc, không lặng lẽ chồng thêm việc. |
| Cuối ngày 10 | Chạy 50 luồng thi chuẩn đầu tiên và oracle có kết quả. | Tạm dừng polish, tập trung dữ liệu/transport/bottleneck; chart/admin phạm vi đã chốt vẫn phải hoàn tất. |
| Cuối ngày 12 | Các phép đo và lỗi trọng yếu đã có trạng thái, đủ dữ liệu tái hiện. | Chọn lỗi chặn bàn giao trước, giữ ngày 13/14 review; dự báo rõ buffer cần bao nhiêu, không hạ ngưỡng. |

Đây là cơ chế kiểm soát, không làm chức năng tự động xong đúng ngày. Ưu tiên giảm
animation/refactor tổng quát/đóng gói đa nền tảng chưa cam kết. Bất kỳ giảm phạm vi
FR đã chốt hoặc đổi core đều phải được nhóm quyết định rõ, không sửa qua Jira ngầm.

## 5. Review record và Definition of done

Đối chiếu [điều kiện goal với ticket và evidence](pre-jira-review.md#rà-soát-cuối-theo-điều-kiện-sprint-goal).
Buổi review giữ lịch ngay cả khi evidence chưa đủ. Ghi phần thiếu vào biên bản.

Mỗi sprint lưu một bản review ngắn trong `docs/planning/reviews/` khi thực sự
diễn ra; chưa tạo bản PASS giả trước buổi review. Record gồm:

1. Sprint goal; ngày thực/build/config/seed/môi trường và người tham gia.
2. Đã demo gì, nguồn evidence; FR/AC/PT/LT đạt/chưa đạt/chưa chạy và bug liên quan.
3. Kết luận goal đạt hay chưa, phần chưa xong và estimate còn lại A/B; không
   cộng phần unfinished thành điểm hoàn thành hoặc tự kéo dài sprint đã kết thúc.
4. Feedback, việc tiếp theo/owner và tối đa hai action từ retrospective.

Task Done theo tài liệu 05: đầu ra thật, AC/test liên quan đạt, dữ liệu/quyền/
cleanup đúng, review xử lý xong và tích hợp. Sprint goal và task Done là hai
đánh giá khác nhau: demo được goal không miễn AC còn thiếu của task; còn vài
task phụ chưa Done cũng không tự có nghĩa mọi đầu ra sprint bằng không.

## 6. Ngày 15–16 dự phòng

Chỉ dùng nếu review ngày 14 còn lỗi cần sửa hoặc kiểm chứng chưa hoàn tất.
Ưu tiên mất/lẫn ACK, sai quyền/chấm/deadline, crash/treo và lỗi chặn luồng demo;
tiếp theo lỗi có ảnh hưởng rõ. Không tăng thêm chức năng để tận dụng buffer.

Mỗi lỗi có owner, bước tái hiện, expected/actual và ca kiểm lại. Sau fix chạy
lại đúng phần bị ảnh hưởng; đổi wire/transaction/authority có thể cần đo tải lại.
Cuối buffer làm demo kiểm lại ngắn và cập nhật record/evidence, không gọi đây là
sprint thứ ba mặc định hoặc sửa lịch để giấu goal S2 chưa đạt.

Mục tiêu là 14 ngày, dự phòng 1–2 ngày theo mong muốn nhóm. Đây không là bảo đảm
mọi phát sinh đều gói trong hai ngày; nếu còn lỗi trọng yếu thì báo đúng thực
trạng thay vì bàn giao có lỗi để giữ số ngày.

## 7. Đầu vào khi chuyển sang ticket

Giữ [coverage](fr-sprint-review.md), [mẫu task](task-template.md) và
[flow Jira](jira-workflow.md). Mỗi ticket có một owner, sprint dự kiến, nguồn FR,
AC/evidence và dependency một chiều. Không tạo ticket “sprint review” cho từng
chức năng; hai buổi review/demo/retro là timebox đã trừ vào capacity. Có thể ghi
chúng thành hai mục theo dõi của sprint nếu cần, không đếm như tính năng có điểm.

Ngày bắt đầu và tài khoản Jira thật chưa được xác minh. Soạn nội dung không cần
token; tạo/gán/start/close sprint thực tế là bước API riêng. Không tự tạo Jira,
push code hoặc đặt lịch với thầy từ tài liệu này.
