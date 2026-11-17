# Backlog Jira — nhóm 4

Ngày cập nhật: 18/11/2026. **65 ticket nguồn, 4 Epic; 44 task S1 đã nhập Jira.**
Nguồn để đưa lên Jira là hai file Markdown bên dưới. Các mã EXAM-T/EXAM-E là mã
nội bộ ổn định, không phải key SCRUM thật. Chưa có ngày bắt đầu, sprint ID hay
accountId ghi trong tài liệu. Assignee được gán trên Jira theo nhãn owner A/B.
Nhóm xác nhận import, Rank và đổi tên S1 đã kiểm đạt. Không suy rằng toàn bộ
khối lượng đã được cam kết đủ capacity từ việc đã nhập Jira.

- [Sprint 1 — 44 ticket](sprint-1-tickets.md): nền tảng và một lượt thi phòng thật.
- [Sprint 2 — 21 ticket](sprint-2-tickets.md): phần còn lại, recovery, kiểm chứng và bàn giao.
- [Chia nhỏ task theo mẫu tham khảo](backlog-refinement.md): mapping cũ/mới, estimate và capacity sau phân rã.
- [Review trước nhập Jira](pre-jira-review.md): lỗi đã sửa, đối chiếu phạm vi/phân công và điều kiện còn thiếu trước commit sprint.
- [Sprint goal, nhịp ngày và review/demo](sprint-plan.md).
- [Flow nhập Jira](jira-workflow.md) và [mẫu description](task-template.md).

## Nguồn và quy tắc chung

Mọi ticket kế thừa hợp đồng từ [01 nghiệp vụ](../01-requirements-and-business-flows.md),
[02 kiến trúc/dữ liệu](../02-architecture-and-data.md),
[03 giao thức](../03-protocol-specification.md),
[04 quy mô/kiểm chứng](../04-capacity-and-validation.md),
[05 phân công](../05-implementation-plan-and-task-allocation.md),
[config loader](../../config/README.md) và
[review mới nhất F01–F10](../research/five-document-consistency-review.md).
Mục Nguồn trong từng ticket chỉ rõ mục tương ứng; không chép toàn bộ đặc tả lên issue.

A = **Nguyễn Minh Quân — 20235816**; B = **Đặng Hoàng Quân — 20235813**.
Một ticket có một assignee; Reviewer chỉ người liên hệ review khi cần.
Review chéo hay tự review theo [mức ảnh hưởng](../development/git-workflow.md#11-chọn-mức-review-theo-ảnh-hưởng),
không dựa vào số dependency. Chưa gán accountId bằng suy đoán.
FR trong metadata là nhóm FR hiện hành của 01; UC/tình huống và checklist trong
description cụ thể hóa phần công việc, không tự phát minh bộ FR nghiệp vụ khác.

Dependency là **đầu ra phải có khi nghiệm thu tích hợp**, không bắt người nhận
chờ mới được viết code trên contract/fixture. Khi provider xong, tạo một liên kết
Jira `provider blocks consumer`; không tạo cả hai chiều. Bàn giao đang làm có thể
review sớm, nhưng không chuyển Done nếu các điều kiện đã nhận còn thiếu.
Đã bỏ cạnh bắc cầu dư: hiện có 101 liên kết trực tiếp sau review Sprint Goal. Danh sách Đầu vào có thể nhắc cả provider bắc cầu để dễ hiểu; chỉ metadata
Depends on/Is blocked by được dùng tạo liên kết Jira, không biến mọi link tham khảo thành Blocks.

Đặc biệt: T09 launcher C → T48 Node input/dispatcher → T10 Node output → T49 C
routing/credit; không có cạnh quay ngược. T14 cung cấp clock/activity sớm;
T19/T20 không đợi UI hoặc T21 tích hợp start mới viết engine. Driver T23,
behavior T24 và oracle T61 có đầu ra riêng. T36/T64 phối hợp trên cùng run steady. T37 nhận evidence T36/T64, T39 nhận evidence
T38/T65. B có thể chuẩn bị oracle trước. Bốn ticket review diễn ra theo lịch,
phán định goal từ hiện trạng evidence và giờ còn lại.

Mọi ticket giữ C TCP/poll/nonblocking, Node TypeScript nghiệp vụ, SQLite và hai
pipe riêng. Không thêm CRC32/UDP/HTTP/WebSocket/Postgres/CSV/AI grading hoặc phục
hồi bài đang thi sau server crash. T01 chỉ soạn V03 để nhóm chốt trước loader;
T06 cụ thể DB busy/error policy F10, không tự tạo cơ chế retry DB dài.

**Done chung:** AC ticket đạt và có evidence đúng loại; không ACK giả, không lộ
secret/key, cleanup đúng; hoàn thành mức review áp dụng, tác giả giải thích được module.
Fixture giúp làm song song, không thay test tích hợp. Mã PT/LT trong metadata
nghĩa ticket hỗ trợ kiểm chứng, không có nghĩa một ticket làm toàn bộ mã đó PASS.
Các lệnh/test chưa có phải được bổ sung khi code; toàn bộ sản phẩm vẫn NOT_RUN.

## Epic dự kiến

| Mã nguồn | Summary | Kết quả và điều kiện hoàn tất |
| --- | --- | --- |
| EXAM-E01 | C transport và cầu nối tiến trình hoạt động ổn định | RX/TX/socket/poll/client/IPC/BP/config/lifecycle tích hợp; caps, authority/credit và error paths được kiểm. Không chuyển socket sang Node. |
| EXAM-E02 | Tài khoản, phòng và thời gian thi do server quản lý | Auth/permissions/roster/activity/start/end/deadline/reconnect đúng; UI phần A hoạt động qua C/Node/DB. Không chuyển chủ/gia hạn hoặc bỏ quy tắc nộp sớm. |
| EXAM-E03 | Ngân hàng, bài thi/luyện tập và kết quả đúng dữ liệu | Admin form/catalog/generator/snapshot/save/submit/practice/history/chart và DB/receipt đúng quyền/transaction; UI phần B chạy thật. Không CSV hoặc CRUD user ngoài phạm vi. |
| EXAM-E04 | Chứng minh 50 thí sinh và bàn giao có thể tái lập | Driver/behavior/oracle/report phối hợp, LT có status/evidence, clean Linux/LAN runbook và cả hai bảo vệ được phần C. Không coi socket rỗng/build pass là nghiệm thu. |

Epic không có giờ công riêng để cộng lại vào tổng Task. Bốn Epic đã được nhập
cùng S1. Mapping API nằm trong journal cục bộ, không commit journal.

## Ước lượng và quyết định commit sprint

Giờ trong ticket là **ước lượng thuận lợi cho owner** với AI, reuse scaffold và
contract ổn định: gồm code, tự test, ghi evidence và đọc hiểu phần vừa viết.
Mỗi Task nằm trong khoảng người dùng yêu cầu **2–8h**; bộ hiện tại chọn **2–4h**.
Task4h phù hợp một ngày5h hơn ngày4h vì còn review/sync; không hứa mọi task xong một ngày.
Không coi code AI sinh xong là Done. Không gồm giờ người kia peer review, đồng bộ
đầu ngày và cập nhật tiến độ. Gói T25/T26/T42/T43 mỗi người2h gồm45phút chuẩn bị
evidence/demo/forecast và75phút review/demo/retro chung, không phải hai buổi.

| Ngân sách | A S1 | B S1 | A S2 | B S2 |
| --- | --- | --- | --- | --- |
| Giờ owner từ ticket | 56 | 49 | 28 | 30 |
| Peer review/sync/update: 50 phút/ngày ×7 ngày | 5,83 | 5,83 | 5,83 | 5,83 |
| Tổng kế hoạch thuận lợi | 61,83 | 54,83 | 33,83 | 35,83 |
| Capacity 7 ngày ×4–5h | 28–35 | 28–35 | 28–35 | 28–35 |

Tổng hai sprint: **A84h task +11,67h phối hợp ≈95,67h; B79h +11,67h ≈90,67h**,
cao hơn56–70h/người sẵn có trong14ngày. Chưa cộng bug lớn, đổi contract hoặc phần
đọc hiểu vượt dự kiến. Ước lượng tăng khi làm rõ các đầu ra trước đây gộp quá rộng;
không có FR/stack mới và không suy điểm cá nhân từ tổng giờ hoặc số ticket.

**Kết luận capacity:** có thể đưa các ticket lên backlog và bắt đầu nền tảng,
nhưng **chưa đủ căn cứ commit toàn bộ44 ticket S1 vào7ngày với4–5h/ngày**.
Phía A S1 đang vượt mức35h khoảng26,83h; B vượt khoảng19,83h. Giữ goal và scope
đã chốt làm mục tiêu; không giảm estimate, bỏ FR hoặc tăng giờ rảnh giả để lịch đẹp.
Ngày2/4 phải dự báo lại trên số thực; nếu chưa khớp thì ghi carry-over/mốc mới
và nhóm chốt lịch, không lặng lẽ coi S1 đã đạt. S2 chưa là chỗ chứa carry-over miễn phí.

Hai ngày dự phòng chỉ đưa capacity lên64–80h/người, vẫn thấp hơn dự báo mới;
không coi thêm1–2ngày là chắc chắn đủ. Trước khi start sprint nhóm cần chốt khối
lượng/lịch thực tế, không tự cắt FR hoặc đổi ownership qua Jira. Thời gian chờ ca15/30phút thật có thể xen việc độc lập và tự động hóa,
nhưng không bỏ lượt thử hoặc giả duration ngắn thành bằng chứng đúng profile.

## Các ticket bắt đầu trước

| Thứ tự bàn giao | Nguyễn Minh Quân | Đặng Hoàng Quân | Đầu ra ghép |
| --- | --- | --- | --- |
| Bắt đầu | T01: interface/V03; T02 DDL A tiếp theo | T05: TX/encode/vectors, review contract A | Wire có sẵn nên RX/TX không cần chờ V03 duyệt mới viết; một task chính/người. |
| Nền tiếp theo | T03 RX, T04 TS validation | T06 nhận DDL A, ghép runner/DDL B | Test codec/DDL thật; helpers DB và clock T14 được bàn giao sớm. |
| Socket/BP | T08 reactor → T09 launcher → T48 input | T10 Node output → T49 C routing/credit | Làm trên contract trước, ghép theo provider thật; không Block ngược. |
| Auth/UI | T11 C client + T50 Electron; T51 hash → T12 auth → T13 UI | T45 canonical → T07 ledger; T15 topic/catalog + T54 question + T55 seed | Máy LAN thứ hai login thật, không chờ mọi màn hình. |
| Thi phòng | T18 core + T53 expiry; T21 start + T59 end; T52 UI | T17 snapshot + T56 read; T19 save + T57 UI; T20 finalizer + T58 submitUI; T22 APIs + T60 resultUI | T14 clock trước save; UI/handler có đầu ra riêng, không bàn giao một gói quá lớn. |
| Chứng minh S1 | T23 driver + T25 evidence/review | T24 behavior + T61 oracle + T26 evidence/review | Tải nhỏ từ S1, review theo evidence/phần còn lại; ngày7 vẫn là checkpoint mục tiêu. |

Thứ tự trên là ưu tiên, không lịch hứa mỗi hàng một ngày. Mã ticket chỉ giúp
truy vết; không phải làm tuần tự T01→T65. Task S2 theo metadata giữ goal hoàn thiện/kiểm chứng50;
ngày10 thử50 đầu tiên là checkpoint, không đợi admin/chart mới được chạy room load.

## Kiểm offline và chuẩn bị nhập Jira

```sh
python3 tools/jira/prepare_backlog.py
```

Script chỉ đọc Markdown, kiểm mã/metadata, owner/reviewer, coverage FR/AC/PT/LT,
W01..W26, estimate2–8h, description/bảng tình huống có nội dung, dependency tồn tại/
không chu trình, S1 không chờ S2 và cộng giờ owner.
Có thể xuất manifest tới **một đường dẫn mới** bằng `--manifest <path.json>`;
script không ghi đè, không có API/token/ADF/import/status transition.

Manifest là đầu vào kỹ thuật, không phải payload có thể POST thẳng lên Jira.
Chưa xác minh issue types/Epic-parent/Sprint field, assignee accountId, sprint
dates/statuses hoặc credentials của site
[SCRUM/board1](https://ltm-project.atlassian.net/jira/software/projects/SCRUM/boards/1).
Bước nhập kế tiếp phải đọc metadata → map users/epics/sprints → chuyển description
sang ADF → plan diff → apply phần được giao → readback. Không copy importer DATN
nguyên trạng; không tự start/close sprint hoặc đẩy đủ candidate vào sprint active.

## Danh sách ticket

<!-- GENERATED-INDEX -->

### S1

| Ticket | Summary | Owner | Hours | Dependencies |
| --- | --- | --- | --- | --- |
| [EXAM-T01](sprint-1-tickets.md#exam-t01) | [Contracts] Chốt interface dùng chung và bảng cấu hình V03 | Nguyễn Minh Quân | 2 | NONE |
| [EXAM-T02](sprint-1-tickets.md#exam-t02) | [Database] Tạo migration và repository tài khoản, phòng, thành viên, activity | Nguyễn Minh Quân | 3 | NONE |
| [EXAM-T03](sprint-1-tickets.md#exam-t03) | [C Transport] Tách frame nhận và giữ phần dữ liệu dư | Nguyễn Minh Quân | 2 | NONE |
| [EXAM-T04](sprint-1-tickets.md#exam-t04) | [Validation] Kiểm tra DTO trong TypeScript và Electron main | Nguyễn Minh Quân | 2 | NONE |
| [EXAM-T05](sprint-1-tickets.md#exam-t05) | [C Transport] Mã hóa frame và quản lý hàng đợi gửi có giới hạn | Đặng Hoàng Quân | 3 | NONE |
| [EXAM-T06](sprint-1-tickets.md#exam-t06) | [Database] Tích hợp migration và bộ quản lý transaction SQLite | Đặng Hoàng Quân | 3 | EXAM-T02 |
| [EXAM-T07](sprint-1-tickets.md#exam-t07) | [Operations] Lưu receipt, tra cứu thao tác và kiểm soát admission | Đặng Hoàng Quân | 3 | EXAM-T12, EXAM-T45 |
| [EXAM-T08](sprint-1-tickets.md#exam-t08) | [C Server] Xử lý nhiều socket, hello, ping và timeout bằng reactor | Nguyễn Minh Quân | 4 | EXAM-T05, EXAM-T44 |
| [EXAM-T09](sprint-1-tickets.md#exam-t09) | [C Server] Khởi chạy Node, kế thừa khóa DB và dừng tiến trình | Nguyễn Minh Quân | 3 | EXAM-T06, EXAM-T46, EXAM-T47 |
| [EXAM-T10](sprint-1-tickets.md#exam-t10) | [Business Bridge] Gửi response, event và kiểm soát backpressure stdout | Đặng Hoàng Quân | 2 | EXAM-T48 |
| [EXAM-T11](sprint-1-tickets.md#exam-t11) | [C Client] Kết nối TCP, gửi heartbeat và ánh xạ IPC–NET | Nguyễn Minh Quân | 3 | EXAM-T08, EXAM-T47 |
| [EXAM-T12](sprint-1-tickets.md#exam-t12) | [Auth] Triển khai đăng ký, đăng nhập, đăng xuất và quản lý phiên | Nguyễn Minh Quân | 3 | EXAM-T49, EXAM-T51 |
| [EXAM-T13](sprint-1-tickets.md#exam-t13) | [Auth UI] Tích hợp đăng ký, đăng nhập và đăng xuất qua bridge | Nguyễn Minh Quân | 2 | EXAM-T12, EXAM-T50 |
| [EXAM-T14](sprint-1-tickets.md#exam-t14) | [Room] Tạo helper thời gian, deadline và activity dùng chung | Nguyễn Minh Quân | 2 | EXAM-T06 |
| [EXAM-T15](sprint-1-tickets.md#exam-t15) | [Question Bank] Cung cấp danh sách chủ đề và số câu hỏi khả dụng | Đặng Hoàng Quân | 2 | EXAM-T07 |
| [EXAM-T16](sprint-1-tickets.md#exam-t16) | [Admin CLI] Tạo công cụ quản trị offline dùng chung khóa DB và hash | Đặng Hoàng Quân | 2 | EXAM-T12 |
| [EXAM-T17](sprint-1-tickets.md#exam-t17) | [Exam] Sinh và lưu đề riêng cho từng thí sinh trong transaction | Đặng Hoàng Quân | 2 | EXAM-T15 |
| [EXAM-T18](sprint-1-tickets.md#exam-t18) | [Room] Triển khai cấu hình, danh sách, tham gia, rời phòng và roster | Nguyễn Minh Quân | 4 | EXAM-T14, EXAM-T15 |
| [EXAM-T19](sprint-1-tickets.md#exam-t19) | [Exam] Lưu đáp án theo revision và xác nhận sau commit | Đặng Hoàng Quân | 2 | EXAM-T14, EXAM-T56 |
| [EXAM-T20](sprint-1-tickets.md#exam-t20) | [Exam] Nộp bài và chấm điểm với một kết quả cuối cùng | Đặng Hoàng Quân | 3 | EXAM-T19 |
| [EXAM-T21](sprint-1-tickets.md#exam-t21) | [Room] Bắt đầu thi với roster cố định và tạo đề nguyên tử | Nguyễn Minh Quân | 2 | EXAM-T20, EXAM-T53 |
| [EXAM-T22](sprint-1-tickets.md#exam-t22) | [Results] Cung cấp kết quả cá nhân và bảng điểm chủ phòng theo quyền | Đặng Hoàng Quân | 2 | EXAM-T59 |
| [EXAM-T23](sprint-1-tickets.md#exam-t23) | [Load Test] Tạo driver tải nhỏ và khung báo cáo Sprint 1 | Nguyễn Minh Quân | 2 | EXAM-T12 |
| [EXAM-T24](sprint-1-tickets.md#exam-t24) | [Load Test] Mô phỏng đăng nhập, vào phòng, làm và nộp bài qua TCP | Đặng Hoàng Quân | 2 | EXAM-T21, EXAM-T23, EXAM-T55 |
| [EXAM-T25](sprint-1-tickets.md#exam-t25) | [Sprint Review] Demo LAN, báo cáo bằng chứng và dự báo phần Minh Quân — Sprint 1 | Nguyễn Minh Quân | 2 | NONE |
| [EXAM-T26](sprint-1-tickets.md#exam-t26) | [Sprint Review] Demo bài thi, đối soát kết quả và dự báo phần Hoàng Quân — Sprint 1 | Đặng Hoàng Quân | 2 | NONE |
| [EXAM-T44](sprint-1-tickets.md#exam-t44) | [Validation] Kiểm tra UTF-8, JSON và envelope theo kênh trong C | Nguyễn Minh Quân | 2 | EXAM-T03 |
| [EXAM-T45](sprint-1-tickets.md#exam-t45) | [Operations] Chuẩn hóa DTO và tạo SHA-256 fingerprint theo vector chuẩn | Đặng Hoàng Quân | 2 | EXAM-T04 |
| [EXAM-T46](sprint-1-tickets.md#exam-t46) | [Logging] Giới hạn log và đọc stderr không chặn vòng I/O | Nguyễn Minh Quân | 2 | EXAM-T08 |
| [EXAM-T47](sprint-1-tickets.md#exam-t47) | [Config] Nạp và kiểm tra cấu hình, giá trị mặc định và đường dẫn trong C/TS | Nguyễn Minh Quân | 2 | EXAM-T01, EXAM-T04, EXAM-T44 |
| [EXAM-T48](sprint-1-tickets.md#exam-t48) | [Business Bridge] Nhận BP, điều phối tuần tự và phát tín hiệu sẵn sàng | Nguyễn Minh Quân | 2 | EXAM-T09 |
| [EXAM-T49](sprint-1-tickets.md#exam-t49) | [C Server] Định tuyến BP đến đúng TCP và hoàn trả credit một lần | Đặng Hoàng Quân | 3 | EXAM-T10 |
| [EXAM-T50](sprint-1-tickets.md#exam-t50) | [Electron Bridge] Khởi chạy client C, giới hạn API và quản lý pending | Nguyễn Minh Quân | 3 | EXAM-T11 |
| [EXAM-T51](sprint-1-tickets.md#exam-t51) | [Auth] Băm mật khẩu scrypt bất đồng bộ và giới hạn hàng đợi | Nguyễn Minh Quân | 2 | EXAM-T04 |
| [EXAM-T52](sprint-1-tickets.md#exam-t52) | [Room UI] Hiển thị cấu hình, phòng chờ, roster và điều khiển thi | Nguyễn Minh Quân | 3 | EXAM-T13, EXAM-T59 |
| [EXAM-T53](sprint-1-tickets.md#exam-t53) | [Room] Hủy và giải phóng phòng chờ hết hạn sau 30 phút | Nguyễn Minh Quân | 2 | EXAM-T18 |
| [EXAM-T54](sprint-1-tickets.md#exam-t54) | [Question Bank] Triển khai danh sách, thêm, sửa và ngừng dùng câu hỏi theo version | Đặng Hoàng Quân | 3 | EXAM-T15 |
| [EXAM-T55](sprint-1-tickets.md#exam-t55) | [Test Data] Tạo seed F/S/E có thể tái lập bằng công cụ offline | Đặng Hoàng Quân | 2 | EXAM-T54 |
| [EXAM-T56](sprint-1-tickets.md#exam-t56) | [Exam] Cung cấp trạng thái bài, đáp án đã lưu và phân trang đề riêng | Đặng Hoàng Quân | 2 | EXAM-T17 |
| [EXAM-T57](sprint-1-tickets.md#exam-t57) | [Exam UI] Hiển thị câu hỏi, thay đổi đáp án và trạng thái lưu | Đặng Hoàng Quân | 3 | EXAM-T21, EXAM-T50 |
| [EXAM-T58](sprint-1-tickets.md#exam-t58) | [Exam UI] Xác nhận nộp bài, đợi lưu và xử lý kết quả chưa rõ | Đặng Hoàng Quân | 2 | EXAM-T57 |
| [EXAM-T59](sprint-1-tickets.md#exam-t59) | [Room] Kết thúc thi theo lệnh hoặc deadline và công bố sau commit | Nguyễn Minh Quân | 2 | EXAM-T21 |
| [EXAM-T60](sprint-1-tickets.md#exam-t60) | [Results UI] Hiển thị kết quả cá nhân và bảng điểm chủ phòng sau công bố | Đặng Hoàng Quân | 2 | EXAM-T22, EXAM-T52 |
| [EXAM-T61](sprint-1-tickets.md#exam-t61) | [Data Verification] Đối soát độc lập snapshot, ACK, revision và điểm Sprint 1 | Đặng Hoàng Quân | 2 | EXAM-T24 |

### S2

| Ticket | Summary | Owner | Hours | Dependencies |
| --- | --- | --- | --- | --- |
| [EXAM-T27](sprint-2-tickets.md#exam-t27) | [C Client] Kết nối lại, khôi phục phiên và thay binding | Nguyễn Minh Quân | 3 | EXAM-T11, EXAM-T12 |
| [EXAM-T28](sprint-2-tickets.md#exam-t28) | [Exam Recovery] Đồng bộ bài và xử lý thao tác chưa rõ kết quả sau reconnect | Đặng Hoàng Quân | 4 | EXAM-T58, EXAM-T62 |
| [EXAM-T29](sprint-2-tickets.md#exam-t29) | [Admin UI] Quản lý chủ đề, câu hỏi và cập nhật ngân hàng | Đặng Hoàng Quân | 3 | EXAM-T13, EXAM-T16, EXAM-T54 |
| [EXAM-T30](sprint-2-tickets.md#exam-t30) | [Practice] Triển khai luyện tập dùng chung luồng tạo đề, lưu và nộp bài | Đặng Hoàng Quân | 3 | EXAM-T28 |
| [EXAM-T31](sprint-2-tickets.md#exam-t31) | [Results UI] Hiển thị chi tiết kết quả, lịch sử và biểu đồ | Đặng Hoàng Quân | 3 | EXAM-T30, EXAM-T60 |
| [EXAM-T32](sprint-2-tickets.md#exam-t32) | [Load Test] Bổ sung lịch tải, barrier, metrics và báo cáo theo profile | Nguyễn Minh Quân | 3 | EXAM-T23 |
| [EXAM-T33](sprint-2-tickets.md#exam-t33) | [Load Test] Hoàn thiện bot, seed F/S/M/E và bộ đối soát cho 50 người | Đặng Hoàng Quân | 3 | EXAM-T61 |
| [EXAM-T34](sprint-2-tickets.md#exam-t34) | [Database Test] Kiểm thử ledger, admission, rollback và lỗi commit/crash | Đặng Hoàng Quân | 3 | EXAM-T21 |
| [EXAM-T35](sprint-2-tickets.md#exam-t35) | [Bridge Test] Kiểm thử BP quá tải, authority, lỗi tiến trình và khóa DB trên Linux | Nguyễn Minh Quân | 3 | EXAM-T62 |
| [EXAM-T36](sprint-2-tickets.md#exam-t36) | [Load Test] Đo tải ổn định, đăng nhập và tài nguyên với 50 người trên LAN | Nguyễn Minh Quân | 3 | EXAM-T27, EXAM-T32, EXAM-T33, EXAM-T58, EXAM-T60 |
| [EXAM-T37](sprint-2-tickets.md#exam-t37) | [Data Verification] Đối soát các run 50 người và sửa lỗi nghiệp vụ | Đặng Hoàng Quân | 3 | EXAM-T22, EXAM-T36, EXAM-T64 |
| [EXAM-T38](sprint-2-tickets.md#exam-t38) | [Load Test] Chạy tải hỗn hợp 30/10/10 và kịch bản một client chậm | Nguyễn Minh Quân | 3 | EXAM-T30, EXAM-T32, EXAM-T33, EXAM-T35 |
| [EXAM-T39](sprint-2-tickets.md#exam-t39) | [Data Verification] Đối soát tải hỗn hợp, lỗi, công bố kết quả và phân quyền | Đặng Hoàng Quân | 2 | EXAM-T31, EXAM-T34, EXAM-T38, EXAM-T65 |
| [EXAM-T40](sprint-2-tickets.md#exam-t40) | [Documentation] Viết hướng dẫn Linux/LAN, cài mới và bảo vệ phần Minh Quân | Nguyễn Minh Quân | 2 | EXAM-T35, EXAM-T52, EXAM-T63 |
| [EXAM-T41](sprint-2-tickets.md#exam-t41) | [Documentation] Chuẩn bị seed demo, hướng dẫn đối soát và bảo vệ phần Hoàng Quân | Đặng Hoàng Quân | 2 | EXAM-T29, EXAM-T37, EXAM-T39, EXAM-T63 |
| [EXAM-T42](sprint-2-tickets.md#exam-t42) | [Sprint Review] Demo tích hợp, báo cáo tải và đánh giá bàn giao phần Minh Quân — Sprint 2 | Nguyễn Minh Quân | 2 | NONE |
| [EXAM-T43](sprint-2-tickets.md#exam-t43) | [Sprint Review] Demo nghiệp vụ, đối soát và chuẩn bị bảo vệ phần Hoàng Quân — Sprint 2 | Đặng Hoàng Quân | 2 | NONE |
| [EXAM-T62](sprint-2-tickets.md#exam-t62) | [Electron Bridge] Khôi phục pending khi reload, xử lý logout và chặn callback cũ | Nguyễn Minh Quân | 3 | EXAM-T27, EXAM-T50 |
| [EXAM-T63](sprint-2-tickets.md#exam-t63) | [Database] Sao lưu nguội, khôi phục và kiểm tra toàn vẹn DB thử nghiệm | Đặng Hoàng Quân | 2 | EXAM-T34 |
| [EXAM-T64](sprint-2-tickets.md#exam-t64) | [Load Test] Đo burst 50 người, thời gian nhận đủ đề và xử lý deadline | Nguyễn Minh Quân | 3 | EXAM-T32, EXAM-T33, EXAM-T59 |
| [EXAM-T65](sprint-2-tickets.md#exam-t65) | [Load Test] Kiểm thử reconnect, đề M tối đa và phòng chờ hết hạn 30 phút | Nguyễn Minh Quân | 3 | EXAM-T28, EXAM-T32, EXAM-T33, EXAM-T35 |

## Coverage FR

| FR | Tickets |
| --- | --- |
| FR-01 | [EXAM-T02](sprint-1-tickets.md#exam-t02), [EXAM-T06](sprint-1-tickets.md#exam-t06), [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T16](sprint-1-tickets.md#exam-t16), [EXAM-T25](sprint-1-tickets.md#exam-t25), [EXAM-T51](sprint-1-tickets.md#exam-t51), [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T62](sprint-2-tickets.md#exam-t62) |
| FR-02 | [EXAM-T02](sprint-1-tickets.md#exam-t02), [EXAM-T04](sprint-1-tickets.md#exam-t04), [EXAM-T07](sprint-1-tickets.md#exam-t07), [EXAM-T10](sprint-1-tickets.md#exam-t10), [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T15](sprint-1-tickets.md#exam-t15), [EXAM-T16](sprint-1-tickets.md#exam-t16), [EXAM-T49](sprint-1-tickets.md#exam-t49), [EXAM-T51](sprint-1-tickets.md#exam-t51), [EXAM-T54](sprint-1-tickets.md#exam-t54), [EXAM-T55](sprint-1-tickets.md#exam-t55), [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T29](sprint-2-tickets.md#exam-t29), [EXAM-T31](sprint-2-tickets.md#exam-t31), [EXAM-T35](sprint-2-tickets.md#exam-t35), [EXAM-T62](sprint-2-tickets.md#exam-t62) |
| FR-03 | [EXAM-T06](sprint-1-tickets.md#exam-t06), [EXAM-T15](sprint-1-tickets.md#exam-t15), [EXAM-T16](sprint-1-tickets.md#exam-t16), [EXAM-T54](sprint-1-tickets.md#exam-t54), [EXAM-T55](sprint-1-tickets.md#exam-t55), [EXAM-T29](sprint-2-tickets.md#exam-t29), [EXAM-T41](sprint-2-tickets.md#exam-t41), [EXAM-T43](sprint-2-tickets.md#exam-t43) |
| FR-04 | [EXAM-T15](sprint-1-tickets.md#exam-t15), [EXAM-T17](sprint-1-tickets.md#exam-t17), [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52), [EXAM-T53](sprint-1-tickets.md#exam-t53), [EXAM-T54](sprint-1-tickets.md#exam-t54), [EXAM-T55](sprint-1-tickets.md#exam-t55), [EXAM-T56](sprint-1-tickets.md#exam-t56), [EXAM-T29](sprint-2-tickets.md#exam-t29), [EXAM-T30](sprint-2-tickets.md#exam-t30) |
| FR-05 | [EXAM-T02](sprint-1-tickets.md#exam-t02), [EXAM-T14](sprint-1-tickets.md#exam-t14), [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T25](sprint-1-tickets.md#exam-t25), [EXAM-T52](sprint-1-tickets.md#exam-t52), [EXAM-T53](sprint-1-tickets.md#exam-t53) |
| FR-06 | [EXAM-T02](sprint-1-tickets.md#exam-t02), [EXAM-T14](sprint-1-tickets.md#exam-t14), [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T21](sprint-1-tickets.md#exam-t21), [EXAM-T25](sprint-1-tickets.md#exam-t25), [EXAM-T52](sprint-1-tickets.md#exam-t52), [EXAM-T53](sprint-1-tickets.md#exam-t53), [EXAM-T59](sprint-1-tickets.md#exam-t59) |
| FR-07 | [EXAM-T06](sprint-1-tickets.md#exam-t06), [EXAM-T17](sprint-1-tickets.md#exam-t17), [EXAM-T21](sprint-1-tickets.md#exam-t21), [EXAM-T24](sprint-1-tickets.md#exam-t24), [EXAM-T26](sprint-1-tickets.md#exam-t26), [EXAM-T56](sprint-1-tickets.md#exam-t56), [EXAM-T59](sprint-1-tickets.md#exam-t59), [EXAM-T61](sprint-1-tickets.md#exam-t61), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T37](sprint-2-tickets.md#exam-t37), [EXAM-T41](sprint-2-tickets.md#exam-t41), [EXAM-T43](sprint-2-tickets.md#exam-t43) |
| FR-08 | [EXAM-T03](sprint-1-tickets.md#exam-t03), [EXAM-T05](sprint-1-tickets.md#exam-t05), [EXAM-T07](sprint-1-tickets.md#exam-t07), [EXAM-T19](sprint-1-tickets.md#exam-t19), [EXAM-T24](sprint-1-tickets.md#exam-t24), [EXAM-T26](sprint-1-tickets.md#exam-t26), [EXAM-T44](sprint-1-tickets.md#exam-t44), [EXAM-T45](sprint-1-tickets.md#exam-t45), [EXAM-T57](sprint-1-tickets.md#exam-t57), [EXAM-T61](sprint-1-tickets.md#exam-t61), [EXAM-T28](sprint-2-tickets.md#exam-t28), [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T34](sprint-2-tickets.md#exam-t34), [EXAM-T37](sprint-2-tickets.md#exam-t37), [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T41](sprint-2-tickets.md#exam-t41), [EXAM-T43](sprint-2-tickets.md#exam-t43), [EXAM-T63](sprint-2-tickets.md#exam-t63) |
| FR-09 | [EXAM-T03](sprint-1-tickets.md#exam-t03), [EXAM-T05](sprint-1-tickets.md#exam-t05), [EXAM-T06](sprint-1-tickets.md#exam-t06), [EXAM-T07](sprint-1-tickets.md#exam-t07), [EXAM-T14](sprint-1-tickets.md#exam-t14), [EXAM-T19](sprint-1-tickets.md#exam-t19), [EXAM-T20](sprint-1-tickets.md#exam-t20), [EXAM-T21](sprint-1-tickets.md#exam-t21), [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T24](sprint-1-tickets.md#exam-t24), [EXAM-T26](sprint-1-tickets.md#exam-t26), [EXAM-T44](sprint-1-tickets.md#exam-t44), [EXAM-T45](sprint-1-tickets.md#exam-t45), [EXAM-T57](sprint-1-tickets.md#exam-t57), [EXAM-T58](sprint-1-tickets.md#exam-t58), [EXAM-T59](sprint-1-tickets.md#exam-t59), [EXAM-T60](sprint-1-tickets.md#exam-t60), [EXAM-T61](sprint-1-tickets.md#exam-t61), [EXAM-T28](sprint-2-tickets.md#exam-t28), [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T34](sprint-2-tickets.md#exam-t34), [EXAM-T37](sprint-2-tickets.md#exam-t37), [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T41](sprint-2-tickets.md#exam-t41), [EXAM-T43](sprint-2-tickets.md#exam-t43), [EXAM-T63](sprint-2-tickets.md#exam-t63) |
| FR-10 | [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T17](sprint-1-tickets.md#exam-t17), [EXAM-T50](sprint-1-tickets.md#exam-t50), [EXAM-T51](sprint-1-tickets.md#exam-t51), [EXAM-T56](sprint-1-tickets.md#exam-t56), [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T28](sprint-2-tickets.md#exam-t28), [EXAM-T35](sprint-2-tickets.md#exam-t35), [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T43](sprint-2-tickets.md#exam-t43), [EXAM-T62](sprint-2-tickets.md#exam-t62), [EXAM-T65](sprint-2-tickets.md#exam-t65) |
| FR-11 | [EXAM-T14](sprint-1-tickets.md#exam-t14), [EXAM-T20](sprint-1-tickets.md#exam-t20), [EXAM-T58](sprint-1-tickets.md#exam-t58), [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T41](sprint-2-tickets.md#exam-t41), [EXAM-T43](sprint-2-tickets.md#exam-t43), [EXAM-T65](sprint-2-tickets.md#exam-t65) |
| FR-12 | [EXAM-T20](sprint-1-tickets.md#exam-t20), [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T26](sprint-1-tickets.md#exam-t26), [EXAM-T58](sprint-1-tickets.md#exam-t58), [EXAM-T60](sprint-1-tickets.md#exam-t60), [EXAM-T30](sprint-2-tickets.md#exam-t30), [EXAM-T31](sprint-2-tickets.md#exam-t31), [EXAM-T33](sprint-2-tickets.md#exam-t33), [EXAM-T37](sprint-2-tickets.md#exam-t37), [EXAM-T39](sprint-2-tickets.md#exam-t39), [EXAM-T41](sprint-2-tickets.md#exam-t41), [EXAM-T43](sprint-2-tickets.md#exam-t43) |
| FR-13 | [EXAM-T01](sprint-1-tickets.md#exam-t01), [EXAM-T03](sprint-1-tickets.md#exam-t03), [EXAM-T04](sprint-1-tickets.md#exam-t04), [EXAM-T05](sprint-1-tickets.md#exam-t05), [EXAM-T06](sprint-1-tickets.md#exam-t06), [EXAM-T07](sprint-1-tickets.md#exam-t07), [EXAM-T08](sprint-1-tickets.md#exam-t08), [EXAM-T09](sprint-1-tickets.md#exam-t09), [EXAM-T10](sprint-1-tickets.md#exam-t10), [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T19](sprint-1-tickets.md#exam-t19), [EXAM-T23](sprint-1-tickets.md#exam-t23), [EXAM-T24](sprint-1-tickets.md#exam-t24), [EXAM-T25](sprint-1-tickets.md#exam-t25), [EXAM-T44](sprint-1-tickets.md#exam-t44), [EXAM-T45](sprint-1-tickets.md#exam-t45), [EXAM-T46](sprint-1-tickets.md#exam-t46), [EXAM-T47](sprint-1-tickets.md#exam-t47), [EXAM-T48](sprint-1-tickets.md#exam-t48), [EXAM-T49](sprint-1-tickets.md#exam-t49), [EXAM-T50](sprint-1-tickets.md#exam-t50), [EXAM-T57](sprint-1-tickets.md#exam-t57), [EXAM-T61](sprint-1-tickets.md#exam-t61), [EXAM-T27](sprint-2-tickets.md#exam-t27), [EXAM-T32](sprint-2-tickets.md#exam-t32), [EXAM-T34](sprint-2-tickets.md#exam-t34), [EXAM-T35](sprint-2-tickets.md#exam-t35), [EXAM-T36](sprint-2-tickets.md#exam-t36), [EXAM-T38](sprint-2-tickets.md#exam-t38), [EXAM-T40](sprint-2-tickets.md#exam-t40), [EXAM-T42](sprint-2-tickets.md#exam-t42), [EXAM-T62](sprint-2-tickets.md#exam-t62), [EXAM-T63](sprint-2-tickets.md#exam-t63), [EXAM-T64](sprint-2-tickets.md#exam-t64), [EXAM-T65](sprint-2-tickets.md#exam-t65) |

## Inventory API và ticket

| API | Tickets |
| --- | --- |
| `admin.question.create` | [EXAM-T54](sprint-1-tickets.md#exam-t54), [EXAM-T29](sprint-2-tickets.md#exam-t29) |
| `admin.question.list` | [EXAM-T54](sprint-1-tickets.md#exam-t54), [EXAM-T29](sprint-2-tickets.md#exam-t29) |
| `admin.question.update` | [EXAM-T54](sprint-1-tickets.md#exam-t54), [EXAM-T29](sprint-2-tickets.md#exam-t29) |
| `admin.topic.create` | [EXAM-T15](sprint-1-tickets.md#exam-t15), [EXAM-T29](sprint-2-tickets.md#exam-t29) |
| `admin.topic.list` | [EXAM-T15](sprint-1-tickets.md#exam-t15), [EXAM-T29](sprint-2-tickets.md#exam-t29) |
| `admin.topic.update` | [EXAM-T15](sprint-1-tickets.md#exam-t15), [EXAM-T29](sprint-2-tickets.md#exam-t29) |
| `answer.save` | [EXAM-T19](sprint-1-tickets.md#exam-t19), [EXAM-T57](sprint-1-tickets.md#exam-t57), [EXAM-T28](sprint-2-tickets.md#exam-t28) |
| `attempt.get` | [EXAM-T56](sprint-1-tickets.md#exam-t56), [EXAM-T28](sprint-2-tickets.md#exam-t28) |
| `attempt.items` | [EXAM-T56](sprint-1-tickets.md#exam-t56), [EXAM-T57](sprint-1-tickets.md#exam-t57) |
| `attempt.submit` | [EXAM-T20](sprint-1-tickets.md#exam-t20), [EXAM-T58](sprint-1-tickets.md#exam-t58), [EXAM-T28](sprint-2-tickets.md#exam-t28) |
| `auth.login` | [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T51](sprint-1-tickets.md#exam-t51) |
| `auth.logout` | [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T62](sprint-2-tickets.md#exam-t62) |
| `auth.register` | [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T13](sprint-1-tickets.md#exam-t13), [EXAM-T51](sprint-1-tickets.md#exam-t51) |
| `auth.resume` | [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T27](sprint-2-tickets.md#exam-t27) |
| `catalog.list` | [EXAM-T15](sprint-1-tickets.md#exam-t15) |
| `history.list` | [EXAM-T31](sprint-2-tickets.md#exam-t31) |
| `local.connect` | [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T50](sprint-1-tickets.md#exam-t50) |
| `local.shutdown` | [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T50](sprint-1-tickets.md#exam-t50) |
| `local.status` | [EXAM-T11](sprint-1-tickets.md#exam-t11), [EXAM-T50](sprint-1-tickets.md#exam-t50) |
| `operation.get` | [EXAM-T07](sprint-1-tickets.md#exam-t07), [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T28](sprint-2-tickets.md#exam-t28) |
| `practice.start` | [EXAM-T30](sprint-2-tickets.md#exam-t30) |
| `result.get` | [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T60](sprint-1-tickets.md#exam-t60) |
| `result.items` | [EXAM-T31](sprint-2-tickets.md#exam-t31) |
| `room.cancel` | [EXAM-T53](sprint-1-tickets.md#exam-t53), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.configure` | [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.create` | [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.end` | [EXAM-T59](sprint-1-tickets.md#exam-t59), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.get` | [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.join` | [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.leave` | [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.list` | [EXAM-T18](sprint-1-tickets.md#exam-t18), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `room.results` | [EXAM-T22](sprint-1-tickets.md#exam-t22), [EXAM-T60](sprint-1-tickets.md#exam-t60) |
| `room.start` | [EXAM-T21](sprint-1-tickets.md#exam-t21), [EXAM-T52](sprint-1-tickets.md#exam-t52) |
| `state.get` | [EXAM-T12](sprint-1-tickets.md#exam-t12), [EXAM-T27](sprint-2-tickets.md#exam-t27) |
| `sys.hello` | [EXAM-T08](sprint-1-tickets.md#exam-t08), [EXAM-T11](sprint-1-tickets.md#exam-t11) |
| `sys.ping` | [EXAM-T08](sprint-1-tickets.md#exam-t08), [EXAM-T11](sprint-1-tickets.md#exam-t11) |

NET events: `room.changed` T18/T21/T53/T59, `attempt.changed` T20/T59/T30,
`session.revoked` T12/T27; local events/pending T11/T50/T62/T28. Đủ12 BP kinds
thuộc T09/T48/T10/T49, kiểm đường lỗi T35. CLI admin T16 và seed T55; không tạo
API mạng mới.
