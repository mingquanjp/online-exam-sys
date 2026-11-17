# Review backlog trước khi nhập Jira

Ngày: 17/11/2026. Nhóm 4. Phạm vi: 65 Task, 4 Epic, kế hoạch hai sprint,
đối chiếu tài liệu 01–05, config, phân công và các báo cáo đối chiếu kickoff/barem/bài giảng.
Đây là review nội dung và kiểm offline, không là nghiệm thu code, đo tải hay kiểm API Jira.

## Kết luận

**Đủ rõ để nhập vào Product Backlog; chưa đủ cơ sở cam kết toàn bộ Sprint 1
trong một tuần.** Không thấy cần đổi kiến trúc, bổ sung FR hoặc thêm công nghệ.
Các lỗi bàn giao/diễn đạt tìm được dưới đây đã sửa. Hai quyết định kỹ thuật còn
mở đã có task/owner và phải được chốt trước module liên quan, không cần mở lại
thiết kế toàn hệ thống.

65 Task là các đầu ra công việc, không phải 65 chức năng người dùng hoặc căn cứ
tính điểm. Coverage theo mã chỉ giúp truy vết; kiểm nội dung và runtime sau này
mới xác nhận yêu cầu thực sự đạt.

## Phát hiện và xử lý

| Mã | Mức | Phát hiện | Xử lý |
| --- | --- | --- | --- |
| J01 | Cao — trước commit sprint | A S1 có 56h task, B có 49h, trong khi mỗi người chỉ có 28–35h/tuần, chưa trừ phối hợp. Các task 2–4h không khiến tổng khối lượng nhỏ đi. | Giữ estimate minh bạch; nhập backlog được nhưng không tự đưa đủ 44 task vào sprint active. Cần nhóm chốt lại lịch/khối lượng trước start; không âm thầm bỏ FR hoặc tăng giờ rảnh giả. |
| J02 | Vừa — đã sửa | T23 driver đòi ghép T24 và oracle T61 để nghiệm thu, nhưng T24 lại dùng driver T23 mà không ghi Depends on. Đồ thị không có vòng, song điều kiện Done trong mô tả tạo vòng chờ ngầm. | T23 nghiệm thu runner bằng 5 kết nối/auth TCP thật với behavior fixture tối thiểu; T24 nhận driver và nghiệm thu luồng thi, T61 nhận output để đối soát. Thêm T23 blocks T24. |
| J03 | Vừa — đã sửa | T47 loader C phải từ chối duplicate/JSON sai nhưng chưa ghi provider bộ kiểm JSON C; có nguy cơ viết thêm parser riêng hoặc nhận Done trước đầu vào. | Thêm T44 blocks T47; T04 vẫn cấp helpers TS. Không thay schema config hoặc mặc nhiên duyệt V03. |
| J04 | Vừa — đã sửa | T60 dùng cách viết `result_available/room.changed`, có thể bị hiểu `result_available` là event thứ tư. | Nêu đúng event `room.changed`/`attempt.changed`, trường `AttemptMeta.result_available`, điều kiện công bố và polling dự phòng theo 03 §8. |
| J05 | Nhẹ — đã sửa | T08 chưa nói rõ hạn hello 5s trong scope; T13 chỉ dẫn T27 cho toàn bộ logout fault trong khi main/context thuộc T62. | Bổ sung deadline hello; chỉ đúng T27 transport và T62 main/logout context. Sửa một số lỗi khoảng trắng trong ticket. |
| J06 | Vừa — giữ gate hiện có | V03 còn cần bound/default/quan hệ được nhóm xác nhận; F10 còn cần busy/error policy hiệu lực trong wrapper. | T01→T47 và T06 là owner/gate. Chưa đánh hai quyết định này CLOSED và không thêm task nghiên cứu mới. |

Sau sửa có **114 cạnh dependency**, không vòng và không S1 phụ thuộc S2.
Đã đồng bộ metadata, `Is blocked by`, `Blocks` và bảng index. Bổ sung kiểm tra
hai trường dependency trong description vào công cụ offline để phát hiện lệch về sau.

## Đối chiếu phạm vi và phân công

| Yêu cầu/đầu ra | Ticket chính | Nhận xét |
| --- | --- | --- |
| Tài khoản, quyền, phiên | T12/13/27/51/62, schema A T02 | A giữ ownership; từng handler A/B vẫn tự kiểm quyền. Không đẩy mọi kiểm quyền sang một màn login. |
| Kho dùng chung do admin quản lý, danh mục/counts | T15/16/29/54/55 | B; APIs và seed S1, admin form S2. Không tự thêm CSV/Excel/reset user. |
| Phòng, roster/presence, cấu hình, cancel/expiry | T18/52/53 | A; chủ tự là thành viên, chỉ join mới khi WAITING, hạn chờ 30 phút cố định. |
| Start/end/deadline | T14/21/59 | A điều phối, dùng generator/finalizer của B trong transaction chung; mọi thành viên kể cả offline được gán đề. |
| Đề riêng và trang đề | T17/56 | B; random không lặp trong một đề, không cam kết đề các người luôn khác nhau. Snapshot không đổi khi sửa kho/reconnect. |
| Lưu/đổi/nộp/chấm | T07/19/20/45/57/58 | B; revision/receipt/commit trước ACK; early submit không mở điểm hoặc giải phóng activity phòng. |
| Khôi phục kết nối/bài | T27/62 A; T28 B | A nối lại/authority/main; B sync bài/receipt/UI. Không reset giờ/đề và không hứa nháp bền qua đóng app hoặc phục hồi bài sau server crash. |
| Practice/history/detail/chart | T30/31, reuse T22/60 | B; room result tối thiểu S1, phần còn lại S2. ADMIN không mặc nhiên đọc mọi bài, không lộ điểm qua history/chart trước công bố. |
| C networking và bridges | T03/04/08/09/11/44/46/47/48/50 A; T05/10/49 B | Hai người đều có phần C/network thật; UI cả hai làm theo chức năng, không giao toàn bộ FE cho một người. |
| SQLite/seed/backup | T02 A; T06/16/55/63 B | B tích hợp DB; A tự viết DDL/repository phần mình. Backup là thao tác offline trên DB test, không là dịch vụ backup mới. |
| Harness, run, oracle | T23/32/35/36/38/64/65 A; T24/33/34/37/39/61 B | Driver/số đo và behavior/oracle có đầu ra riêng; review chỉ kết luận khi cả số đo lẫn oracle đạt. |
| Review/demo/runbook/bảo vệ | T25/26/40/41/42/43 | Mỗi sprint một buổi chung 60 phút review/demo +15 phút retro, task mỗi người gồm thêm 45 phút chuẩn bị evidence. Không tính hai buổi hoặc gọi đây là chức năng có điểm. |

Phân công core khớp tài liệu 05, không chuyển module giữa hai người trong lượt
review này. A 84h và B 79h task là khá gần về tổng dự báo; điều đó không chứng minh
điểm cá nhân bằng nhau. Không có thêm ba gói nâng cao độc lập để tự cộng điểm.

Trọng tâm sau kickoff được giữ: C socket/partial I/O/framing/poll, giao thức rõ,
50 thí sinh thực hiện hành vi, tài nguyên/lưu lượng có dự toán và số đo. Node chỉ
nghiệp vụ/SQLite, không chuyển LAN socket sang Node; pipe riêng vẫn stdin/stdout.
Không thêm CRC32, HTTP/WebSocket, PostgreSQL, AI chấm hoặc quy mô 500/1000.

## Sprint 1 và tính khả thi

Goal S1 vẫn là luồng thi phòng qua hai UI trên LAN, có seed, auth, room, đề,
save/submit, công bố điểm và oracle nhỏ. APIs bank S1, form admin S2 là chia mốc
triển khai, không cắt FR. Cơ chế receipt, bounded retry trên kết nối còn sống,
queue/timeout và quyền phải có ngay S1; không dời mọi tính đúng đắn sang recovery S2.

Ước lượng vẫn thuận lợi và chưa có dữ liệu tốc độ nhóm. Những task cần theo sát
đầu tiên: T04/T44 strict validation, T08 reactor 4h, T09 lifecycle/lock 3h,
T12 auth/authority 3h, T18 room 4h, T49 routing/credit 3h và T28 reconcile 4h.
Chúng có nhiều đường lỗi; thời gian AI sinh code không thay thời gian hiểu/test.
Không tự tăng/giảm estimate trong review khi chưa có bằng chứng triển khai.

| Tổng giờ mỗi người | A | B |
| --- | --- | --- |
| Task S1 + S2 | 84 | 79 |
| Phối hợp 50 phút/ngày ×14 ngày | 11,67 | 11,67 |
| Tổng dự báo thuận lợi | 95,67 | 90,67 |
| Capacity 14 ngày ×4–5h | 56–70 | 56–70 |

Không thể gọi lịch này là đã bảo đảm hai tuần, kể cả thêm 1–2 ngày. S2 không là
capacity trống để chứa toàn bộ carry-over. Có thể bắt đầu các nền độc lập trên
contract hiện hành, nhưng phải chọn lịch/commit thực tế trước khi start sprint.
Mốc ngày 2/4/7/10/14 là checkpoint mục tiêu, không thay kế hoạch khả thi.

## Kiểm tra trước nhập và giới hạn

Đã chạy `python3 tools/jira/prepare_backlog.py`: 4 Epic, 65 Task, 86 mã
FR/AC/PT/LT được tham chiếu, đủ W01–26, estimate 2–4h, owner/reviewer A/B đối nhau,
114 dependency không vòng. Kiểm thêm index, link local/anchor, trường bàn giao
hai chiều và khả năng từ chối metadata sai. Không dùng build smoke làm bằng
chứng nghiệp vụ hoặc tải 50; sản phẩm và các ca load vẫn NOT_RUN.

Đủ điều kiện đưa **nội dung** lên backlog không đồng nghĩa importer đã sẵn sàng.
Trước API mutation còn phải đọc metadata project/board/issue type/Epic/Sprint,
xác minh accountId hai người, chuyển Markdown→ADF và kiểm render/bảng/checklist/
link, chuẩn bị mapping source ID→key thật để không tạo trùng. Manifest hiện tại
không phải payload POST Jira; mã EXAM-T/E không phải SCRUM key thật.

Nhập backlog và start sprint là hai bước riêng. Chưa có ngày bắt đầu hoặc quyết
định commit toàn bộ candidate; chưa tạo/sửa issue, sprint, assignee hoặc trạng
thái trên Jira trong lượt review này.

## Rà soát cuối theo điều kiện Sprint Goal

Bảng này đối chiếu từng điều kiện tại sprint-plan §2.1 và §3.1 với đầu ra
phải có để kết luận trong buổi review. Các mã T dẫn tới ticket EXAM tương ứng
trong [backlog](backlog.md). Trạng thái hiện tại của demo và phép đo là NOT_RUN.

| Điều kiện S1 | Ticket chính | Bằng chứng cần xem |
| --- | --- | --- |
| 1. Khởi động thật trên Linux | T02, T06, T09, T47–T50, T25 | Lệnh build/start từ checkout, config và seed, Node ready sau migrate rồi C listen, Electron mở client C. |
| 2. Hai người dùng LAN và luật phòng | T12–T14, T18, T21, T52–T53 | Hai máy login/create/join/roster thật. Kiểm host là thí sinh, join muộn bị từ chối, rời/hủy/hết chờ và activity. |
| 3. Đề riêng và start nguyên tử | T15, T17, T21, T54–T56 | Đúng số câu từng độ khó, không lặp trong một đề, không gửi key. Thiếu câu làm rollback, chỉnh kho không đổi snapshot. |
| 4. Lưu, đổi và nộp đúng | T07, T11, T14, T19–T20, T57–T58 | Đổi lựa chọn khi ACK cũ đến muộn, save xác nhận sau commit, nộp đợi save, replay không tăng revision hay chấm lần hai. Deadline theo server. |
| 5. Chốt và công bố đúng quyền | T20, T22, T59–T60 | Nộp sớm giữ activity và chưa hiện điểm. Host end và server hết giờ được kiểm, kết quả cá nhân/bảng chủ phòng chỉ mở theo quyền. |
| 6. Chất lượng tầng mạng | T03–T05, T08, T11, T44, T46, T48–T49 | Split/gộp, partial send, EAGAIN, giới hạn queue, timeout, quyền và các đường lỗi chính. Retry theo điều kiện và ngân sách giao thức. |
| 7. Tải nhỏ và đối soát | T23–T26, T55, T61 | Năm bot thực hiện thao tác qua TCP. Đối soát snapshot, revision, ACK và điểm bằng verifier độc lập. Biên bản ghi phần đã đạt và thiếu. |

| Điều kiện S2 | Ticket chính | Bằng chứng cần xem |
| --- | --- | --- |
| 1. Admin dùng form | T29, reuse T15/T16/T54 | Tạo/sửa/ngừng dùng, quyền ADMIN, version conflict và phân trang. Đề đã gán giữ nguyên. |
| 2. Khôi phục phiên, bài và context | T27–T28, T62, T65 | Reconnect đúng bài/giờ/dữ liệu đã lưu. Kiểm reload, logout offline, mất ACK, binding cũ và instance đổi. |
| 3. Practice, chi tiết và lịch sử | T30–T31, T39 | Một activity/user, thời hạn riêng, chấm/công bố đúng. Kiểm kết quả, lịch sử, biểu đồ và phân quyền qua các đường đọc. |
| 4. Tải 50 có dữ liệu đúng | T32–T39, T64–T65 | 50 người nhận đề, lưu, nộp, có kết quả. Ghép số đo và oracle theo run ID. Có steady, burst, mixed, slow peer và các ca lỗi theo 04. |
| 5. Tài nguyên và số đo | T32, T36, T38, T64–T65 | Báo C+Node RSS/CPU, BP/queue, DB, NIC, latency, số mẫu và lỗi. Giữ workload và ngưỡng theo 04. |
| 6. Tái lập khi bàn giao | T35, T40–T41, T63 | Hai bạn dựng và chạy bằng runbook Linux/LAN, kiểm migrate/admin/shutdown, backup test và K07. |
| 7. Sẵn sàng demo và bảo vệ | T40–T43 | Cả hai tái hiện được phần C mình làm. Biên bản có lỗi còn lại và quyết định bàn giao dựa trên các ca đã chạy. |

### Sửa trong lần đối chiếu cuối

- T25/T26/T42/T43 là việc họp và ghi biên bản theo lịch. Đầu ra kỹ thuật là
  nguồn evidence, kể cả khi còn thiếu hoặc FAIL. Bỏ liên kết Blocks vào bốn
  ticket review để Jira phản ánh đúng cách nhóm làm việc. T25 ghi lệnh
  build/start/seed trên Linux ngay ở S1.
- T36 và T64 dùng cùng run ID cho burst save xen steady. T36 báo steady, T64
  báo burst. Burst submit dùng ca 50 bài OPEN riêng và deadline dùng ca
  15 phút riêng theo tài liệu 04.
- T37 nhận artefact của T36/T64, T39 nhận artefact của T38/T65. B chuẩn bị
  verifier từ trước. Hoàn thành đối soát cần artefact đúng run ID, còn A có
  thể hoàn thành việc thu số liệu trước khi oracle kết luận. T42 ghép hai
  nguồn để đánh giá sprint.
- Số dependency hiện hành là **101**. Mốc 114 ở phần trên là kết quả lần
  review trước. Giữ nguyên 65 task, hai sprint dự kiến, ownership và estimate.

### Quyết định trước khi bắt đầu sprint

Ở mức 5h/ngày, trừ 50 phút phối hợp, mỗi người còn khoảng 29,2h cho task trong
7 ngày. S1 vượt mức này khoảng **26,8h của A và 19,8h của B**. Nếu giữ nguyên
ước lượng và 50 phút phối hợp/ngày, S1 cần tối thiểu khoảng 14 ngày theo tải
của A. Toàn bộ backlog cần khoảng 21 ngày theo cùng phép tính, trước khi tính
thêm xung đột lịch, blocker hay bug lớn. Đây là phép tính cận dưới theo dự báo,
không phải ngày giao hàng cam kết.

Đưa 65 ticket vào backlog để cả hai cùng triển khai và giữ S1/S2 là nhóm dự kiến.
Nếu cần giữ mốc một tuần, Sprint 1 phải có goal nhỏ hơn với các ticket phù hợp,
và luồng thi trọn vẹn giữ làm mốc tiếp theo. Nếu giữ goal hiện hành, cần điều
chỉnh lịch theo giờ thực tế. Cả hai lựa chọn đều giữ phạm vi bài tập lớn.
