# Review yêu cầu và phân bổ hai sprint trước khi soạn ticket

Ngày: 17/11/2026. **REVIEW-DRAFT — chưa phải backlog ticket, chưa nhập Jira.**
A = Nguyễn Minh Quân; B = Đặng Hoàng Quân. Người dùng xác nhận khoảng
4–5 giờ/người/ngày, gồm code, đọc hiểu, review và kiểm thử. Chưa chốt ngày bắt đầu.
Nhóm giữ mục tiêu 14 ngày, dự phòng thêm 1–2 ngày cho phát sinh. Lịch thực hiện,
sprint goal và review/demo ngày 7/14 theo [kế hoạch sprint](sprint-plan.md).
Review triển khai S1 bổ sung tại kế hoạch §2.4–2.7: provider/consumer, thời điểm
bàn giao, retry trên kết nối còn sống, test theo lát cắt và đầu ra chuyển S2.
Dependency thực thi S2 được làm rõ ở §3.4; gói W chưa là cạnh Blocks Jira cuối cùng.

**Sau khi soạn và chia nhỏ ticket:** [backlog mới](backlog.md) đã có65 ticket/4Epic với
description, coverage và DAG. Bản review này giữ nhận định trước phân rã; dùng
estimate/capacity ở backlog khi chốt sprint, không coi các gói W là issue thật.

## 1. Kết luận

FR-01..13 vẫn đúng đề tài, phân công core và góp ý kickoff: C xử lý mạng,
Node/TypeScript xử lý nghiệp vụ, UI desktop; thiết kế và kiểm chứng 50 thí sinh.
Không cần thêm tính năng để tìm điểm. Review này bổ sung coverage từng AC,
đầu vào A/B, ước lượng còn lại và checkpoint vốn còn thiếu ở khung sprint ban đầu.
Lịch thực hiện/review/demo được cụ thể hóa riêng trong kế hoạch sprint.

**Hai tuần là mục tiêu có rủi ro cao, chưa đủ căn cứ cam kết toàn bộ phạm vi.**
Nút thắt A là transport/bridge/auth/timer; B có nhiều luồng DB/thi/admin/kết quả.
Giữ core đã chốt, giảm việc làm lại và tích hợp sớm; không cân bằng bằng số ticket.
Các bảng dưới là đề xuất tổ chức việc, không đổi nghiệp vụ đã duyệt.

## 2. Căn cứ và mức bằng chứng

Đọc đối chiếu [01 FR/UC/AC](../01-requirements-and-business-flows.md),
[02 kiến trúc/dữ liệu](../02-architecture-and-data.md),
[03 lệnh/FSM/PT/BP](../03-protocol-specification.md),
[04 tải/LT](../04-capacity-and-validation.md),
[05 ownership/M0–M7](../05-implementation-plan-and-task-allocation.md),
[review trước triển khai](../research/pre-implementation-review.md),
[workflow Jira](jira-workflow.md), config và code entry hiện có.
Đối chiếu barem/kickoff/bài giảng qua review nguồn đã ghi trong tài liệu nghiên cứu;
lượt này không xác minh lại file thầy hoặc Jira qua mạng.

Scaffold build C, React/Electron và Node workspace đã có. Entry C/Node mới
`--version`; chưa có sản phẩm socket, BP, migration, handler hay load bot.
Probe nghiên cứu không thay nghiệm thu. Mọi đầu ra W bên dưới đều **chưa nghiệm thu**;
không lập lại task cài CMake/tạo workspace hoặc tự đánh dấu Done.

## 3. Các điều chỉnh cần đưa vào kế hoạch ticket

| Điểm phát hiện | Điều chỉnh đề xuất | Khi nào phải đạt |
| --- | --- | --- |
| S1 gộp nền C, hai cầu nối, auth/DB và trọn luồng thi | Chia checkpoint nền → login thật → phòng/đề → save/nộp/kết quả. Không chờ hết tuần mới thử LAN. | Mỗi checkpoint có đường chạy thật. |
| M5 có thể bị hiểu là đến S2 mới làm retry | Receipt/fingerprint/transaction có trước W đầu tiên; revision/ACK đi cùng save; submit dùng finalizer một lần từ S1. S2 hoàn thiện phục hồi xuyên tầng. | S1, không retrofit DB ở S2. |
| FR-02 và FR-13 dễ thành task khổng lồ hoặc bỏ sót | Validation/quyền/log/cleanup thuộc AC của từng task; có helper nền dùng chung. Test lỗi tích hợp có owner riêng. | Từ handler/socket đầu tiên. |
| B cần bank/admin để seed, A cần bank để tạo phòng | S1 có catalog, bank handlers, seed test và admin offline; form quản trị đầy đủ S2. Seed không thay FR-03 khi nghiệm thu cuối. | Trước room/start thật. |
| Start và chốt bài là giao diện A/B dễ ghép muộn | B generator/finalizer nhận transaction của caller; A start/timer/end sở hữu điều phối. Không helper commit lồng hoặc chờ socket trong transaction. | Tích hợp S1. |
| Chỉ ghi “kết quả” chưa phủ biểu đồ/quyền công bố | S1 kết quả cá nhân và bảng phòng tối thiểu sau ENDED; S2 chi tiết/lịch sử/biểu đồ. Trước ENDED mọi đường kết quả đều bị chặn ngay S1. | S1 + S2, coverage riêng. |
| Reconnect là phạm vi bắt buộc nhưng nằm muộn | S1 chuẩn bị generation/epoch, hello/instance, session binding, pending context; S2 mới nghiệm thu reconnect/reload/logout mất ACK đầy đủ. | Không coi FR-10 hoàn tất ở S1. |
| Harness và oracle nếu đợi S2 sẽ tạo nút thắt | Bàn giao seed/vector và bot nhỏ từ S1; driver/scorer phát triển dần, S2 chạy đủ 50 và lỗi. | Tải nhỏ S1, nghiệm thu S2. |
| V03 config chưa có min/max đầy đủ | W01 chốt bảng bound với nhóm trước loader. Không tự dùng đề xuất profile cố định như quyết định đã duyệt. | Chặn nghiệm thu loader W05/W08, không chặn nghiên cứu codec. |
| Một số đoạn tài liệu còn ngôn ngữ “sẽ chốt” của bản cũ | Phạm vi hiện hành theo 02/03 và quyết định V01: không CRC32; TTL/frame đã có. Đồng bộ câu hiện hành, giữ bảng lịch sử. | Trước trích nguồn vào ticket. |

Không đưa thêm HTTP/WebSocket/Express, Postgres, TLS, nhiều server, CSV import,
AI chấm, offline DB hoặc resume ca thi sau server crash. Không triển khai rwnd
hay congestion algorithm riêng: TCP/kernel làm phần đó; C làm partial I/O,
queue có cap, timeout và fairness. Đây là nội dung mạng trọng tâm để bảo vệ.

## 4. Gói việc dự kiến và ranh giới A/B

W01..W26 là mã **gói việc để review**, chưa là EXAM-Tnn hay Jira key. Khi soạn
description mới quyết định gói nào cần tách theo đầu ra và thời lượng; không tạo
26 ticket mặc định. Mỗi gói có owner, người kia review. Cột phụ thuộc là đầu ra
phải có để nghiệm thu tích hợp, không cấm bắt đầu song song trên contract/mock.
S1/S2 chỉ sprint dự kiến, khác profile tải S1/S2 của tài liệu 04.

### S1 — luồng thi phòng tối thiểu chạy thật, có tính đúng đắn từ đầu

| Gói | Owner | Đầu ra còn thiếu | Đầu vào trực tiếp để nghiệm thu |
| --- | --- | --- | --- |
| W01 | A | Khóa interface RX/TX/BP/DB/clock, vectors và bảng config bound V03; B review byte budget/DB. Chỉ xử lý khoảng trống, không viết lại 5 tài liệu. | Đặc tả hiện hành; bound mới cần nhóm chốt. |
| W02 | A | RX C dùng chung, kiểm stream/JSON/envelope theo phần C, length/EOF/split/gộp; helper validation TS chung. Không tự viết JSON parser mới. | W01: framing/schema, không cần chờ toàn bộ config. |
| W03 | B | Encode/TX C dùng chung: ownership, offset, partial send, POLLOUT, cap/control reserve; vectors C/TS/canonical. | W01: wire/caps, RX contract của W02. |
| W04 | A | Server poll/accept/nonblocking, generation, fair scheduling, hello/ping, frame/idle timeout và log baseline; ghép TX B. | W02, W03. |
| W05 | A | Config C, khóa DB kế thừa fd 3 và launcher offline, spawn Node không shell, BP input/request-control/init/ready/opened/closed, dispatcher skeleton A, shutdown/reap/SIGPIPE. Chỉ listen sau DB ready. | W01 bound đã chốt; W04, W07 và BP W06. |
| W06 | B | BP output Node, response/event/control decoding và routing phía C, byte/slot credit, stdout drain/caps; ghép input/dispatcher A và tái dùng codec. | W02/W03 và interface lifecycle W05; nghiệm thu cùng W05. |
| W07 | B | SQLite runner/transaction/operations/receipt, migration tích hợp, policy admission C08 tối thiểu từ đầu. A tự bàn giao DDL/repo users/rooms/members/activity, B bank/attempt/answer. | W01 contract DB; A/B cùng chuẩn bị DDL, không chờ W09/W11 mới có bảng. |
| W08 | A | Client C connect/hello và Electron spawn/preload/pipe, request mapping/pending RAM/instance context và local status. A layout/auth/room primitives; B exam/form primitives ở W13/W19, cùng thống nhất theme. | W02/W03/W04; local bridge kiểm độc lập, auth xuyên tầng ở W09. |
| W09 | A | Scrypt queue/helper dùng chung, register/login/session/logout cơ bản, authority/revoke và UI auth; state.get/activity helpers. B nối operation.get vào ledger W07, A bảo đảm quyền/routing. | W05/W06/W07/W08. |
| W10 | B | Topic/question handlers đúng quyền/version, catalog/counts/availability, seed tái lập và CLI admin offline dùng launcher lock A/hash A. Chưa yêu cầu form admin đầy đủ. | W07, W09; launcher offline chung từ W05. |
| W11 | A | UI và handlers list/create/configure/join/leave/roster/cancel, reservation, presence, expiry WAITING 30 phút/startup expiry. Log và lỗi từng luồng. | W09/W10; timer helper dùng chung phát triển cùng W15. |
| W12 | B | Generator/snapshot riêng và attempt.get/items theo trang; giữ key ở server, query đúng chủ, không lặp nội bộ/không đổi khi sửa kho. | W07/W10, contract start của W15. |
| W13 | B | answer.save/revision/receipt và UI nhận đề/chọn/đổi/pending/saved; không ACK trước commit, xử lý click nhanh và response cũ. | W08/W09/W12; clock admission interface A từ W15. |
| W14 | B | Finalizer/submit/chấm một lần, reason/state/lỗi và UI nộp đợi save; release activity đúng loại. Helper không commit lồng. | W07/W12 và clock/activity A; tích hợp save W13 trước nghiệm thu UI. |
| W15 | A | Start transaction gọi generator B; timer monotonic, t_admit và host end gọi finalizer B; event sau commit, UI host/countdown, rollback start và không điểm sớm. | W11/W12/W14; timer/clock interfaces phải bàn giao sớm cho W11/W13/W14. |
| W16 | B | result.get/room.results tối thiểu và UI sau ENDED; số đúng/điểm làm tròn, chủ phòng/owner đúng quyền, event tự lấy đề/kết quả. | W14/W15; event/transport W04/W06/W08. |

W05↔W06 là **một đợt tích hợp hai đầu theo contract**, không tạo hai cạnh Jira
blocks nhau. Tương tự W15 bàn giao clock sớm, rồi nghiệm thu start/end sau W12/W14;
không tạo vòng dependency W13↔W15. Khi tách ticket, tách đầu ra interface/clock
khỏi tích hợp cuối nếu cần, mỗi đầu ra chỉ viết một lần. Các helper/DDL của A là
phần thực hiện A trong W07/W09/W11/W15, không được dồn toàn bộ sang B.

### S2 — khôi phục đầy đủ, phần chức năng còn lại, tải và bàn giao

| Gói | Owner | Đầu ra còn thiếu | Đầu vào trực tiếp để nghiệm thu |
| --- | --- | --- | --- |
| W17 | A | Reconnect/resume/replace binding; instance fence; main pending qua reload và logout mất ACK/offline/user mới. | W05/W08/W09; receipt/state interfaces W07/W12. |
| W18 | B | UI bài sync cùng pending/server state, reconcile/retry cùng op, không đè đáp án mới, tiếp tục/khóa bài đúng deadline. | W13/W14/W17; receipt đã có S1, không viết lại ledger. |
| W19 | B | Form admin chủ đề/câu hỏi, list/filter/paging/thêm/sửa/inactive/conflict; không CSV hoặc CRUD user. | W08/W09/W10. |
| W20 | B | Practice từ UI đến DB: dùng generator/save/finalizer cũ, deadline riêng A, admission/activity và công bố riêng. | W12/W13/W14/W15; tích hợp recovery W18. |
| W21 | B | Result details/history/paging/chart từ dữ liệu công bố, không correct key cho câu sai; kiểm mọi đường không điểm sớm. | W16/W20; dữ liệu history có thể viết song song practice. |
| W22 | B | Nghiệm thu policy gần đầy và lỗi DB/commit/receipt, crash/K07/BP saturation cùng A; sửa lỗi thuộc owner gốc. | W05/W06/W07 và handlers S1; policy cơ bản không đợi tới đây. |
| W23 | A | Driver/scheduler/barrier/jitter/metrics/report, script chạy nhỏ từ S1, S2 đủ workload và đo C+Node/Linux/LAN. | Contract NET từ W01, auth W09; full workload cần W24. |
| W24 | B | Bot exam/practice, seed F/S/M/E và oracle/scorer độc lập, ACK cuối/revision/reservation/FK; mẫu nhỏ từ S1. | W10/W12/W14; W20 cho practice, interface driver W23. |
| W25 | A | Điều phối chạy hai UI LAN, 50 bot/steady/burst/mixed/faults, thu evidence thật/latency/RAM/băng thông; B chạy và đối soát oracle. Fix do chủ module chịu trách nhiệm. | W17–W24 và S1; chạy tăng dần từ sớm, không đợi tất cả mới thử tải nhỏ. |
| W26 | A | Tích hợp clean checkout/Linux runbook, demo, báo cáo/giới hạn; A viết phần mình, B seed/demo/module B. Cả hai tự chạy và luyện giải thích C. | Evidence W25 và chức năng hoàn tất; khung runbook/ghi chú làm dần, không chờ cuối mới viết. |

W22/W25 không là nơi gom mọi test hoặc giao A sửa toàn bộ lỗi. Task chức năng
phải tự kiểm quyền/state/transaction/error trước; đây là các phép nghiệm thu xuyên tầng.
W23/W24 có phần đầu nhỏ S1 và phần hoàn thiện S2: ticket sau này phải tách rõ
hai đầu ra, không một issue thuộc hai sprint hoặc ghi bot đã xong chỉ vì có probe.

## 5. Coverage từng FR và barem

“Hỗ trợ” không là “đã hoàn tất”. Mỗi dòng chỉ hoàn tất khi các gói và AC liên
quan đã nghiệm thu; toàn bộ hiện là NOT_RUN. FR-02/13 xuyên suốt, không chỉ kiểm
một helper. AC-15/16 là điều kiện hệ thống bổ sung cho mọi luồng liên quan.

| FR | Gói triển khai/chủ trì | S1 thực hiện | S2 hoàn tất/bổ sung | AC chính |
| --- | --- | --- | --- | --- |
| FR-01 | W09/W17 A, nền W05–W08 | Register/login/logout/authority | Resume/logout lỗi/replacement | 01,25,27 |
| FR-02 | W09 A helper; mọi handler A/B | Quyền auth/room/bank/attempt/results ngay lần đầu | Quyền practice/history/admin UI, audit đường đọc | 02,14,19,30 |
| FR-03 | W10/W19 B | Bank/topic APIs, seed/admin offline | Form quản trị đầy đủ | 03,27 |
| FR-04 | W10 B availability + W11 A room/config | Catalog thật, counts từng mức, version, kiểm lại start | Test qua admin thay kho và paging UI | 04,30 |
| FR-05 | W11 A, W17 phục hồi | List/join/leave/roster/presence, khóa người mới sau start | Resume thành viên cũ; close cũ không làm offline mới | 05,19 |
| FR-06 | W11/W15 A gọi W12/W14 B | Cancel/expiry/start/end/deadline/giải phóng activity | Race/fault/load, startup chờ và K07 | 09,12,19,20,21,26 |
| FR-07 | W12 B + W15 A | Random từng người, snapshot/page, start atomic | Biên M và tải 50/sửa kho/recovery | 06,07 |
| FR-08 | W13 B, W02–W08 A/B | UI lưu/đổi, revision/ACK/receipt thật | Sync/reload/mất phản hồi với W17/W18 | 08,10,22,24,26 |
| FR-09 | W14 B + W15 A | Nộp đợi save/chốt/chấm một lần, reason/thời hạn | Retry/fault/timeout/burst | 09,10,26 |
| FR-10 | W17 A + W18 B | Chỉ nền session/instance/receipt/pending | Luồng khôi phục đầy đủ; không reset đề/giờ | 11,22,23,24,25 |
| FR-11 | W20 B dùng timer A | Engine dùng chung được chuẩn bị, chưa coi practice xong | UI/lượt cá nhân/recovery/activity/kết quả | 13,19 |
| FR-12 | W16/W21 B | Điểm cá nhân/bảng phòng sau ENDED | Chi tiết/history/chart, gồm practice | 14 |
| FR-13 | W02–W08/W11–W26 theo module | Capped RX/TX/BP, timeout/log/errors/cleanup | Tải 50, lỗi hệ thống, report/runbook | 15,16,17,18,28,29,30 |

Không bỏ các dòng barem: stream/socket IO = W02–W06/W08; tài khoản/phiên = W09/W17;
quyền = mọi handler; phòng/list/join/start = W11/W15; đổi đáp án/nộp/chấm = W13/W14;
phân loại = W10/W12/W19; luyện tập = W20; kết quả/lưu bài/đồ thị = W07/W12/W16/W21;
log = từng module + W23/W25; GUI = UI theo chức năng A/B. Không tính W17/W18 hoặc
W03/06 là ba gói nâng cao cộng riêng. Không suy điểm cá nhân từ bảng coverage.

### 5.1. AC không được rơi khỏi ticket

| AC | Gói phải nhận đầu ra nghiệm thu |
| --- | --- |
| AC-01/02 | W09, từng handler W10–W21; W17 kiểm thu hồi/đổi user. |
| AC-03/04 | W10/W11/W12/W15/W19, gồm thiếu kho tại start. |
| AC-05/06/07 | W11/W12/W15/W17/W18, roster offline vẫn được gán. |
| AC-08/09/10 | W13/W14/W15/W18, ACK cũ và pending lúc nộp. |
| AC-11/12/13/14 | W15–W21, deadline độc lập client, công bố đúng loại. |
| AC-15/16/17/18 | W02–W08 + log từng module, W23/W24/W25; LAN thật/50 hành vi. |
| AC-19/20/21 | W09 activity, W11/W14/W15/W20; W25 ca 30 phút thật. |
| AC-22/23/24/25 | W08/W09/W17/W18, W22/W25 kiểm child chết/instance mới. |
| AC-26/27/28 | W13–W15 deadline; W05/W07/W09/W10 admin/config; W22 lỗi. |
| AC-29/30 | W01/W02/W03/W07 và schema từng handler; W22/W25 nghiệm thu lỗi/paging/admission. |

### 5.2. Truy vết PT/LT để kiểm khi soạn description

| Bộ ca | Gói chịu trách nhiệm chính/phối hợp |
| --- | --- |
| PT-01/02/13/24 | W02/W03 validation/vector, W08/schema handlers; JSON và framing khác tầng. |
| PT-03 | W03/W04, tích hợp W25. |
| PT-04/05/20 | W09/W17 cùng W04/W06 authority/terminal ACK. |
| PT-06/07/08/09 | W07/W13/W14/W15/W16, W18 recovery và W21 history. |
| PT-10/11 | W11/W12/W15/W17, W25 tải. |
| PT-12/17/18/19 | W08/W17/W18, W22 crash/instance. |
| PT-14/25 | W10/W11/W19/W21 paging; W08 local lifecycle. |
| PT-15/16/21/22 | W11/W13/W14/W15, W22 DB error. |
| PT-23 | W07 policy; W22 và owner từng handler. |
| PT-26/27/28 | W05/W06 và W07/W09/W17/W22, tái dùng RX/TX W02/W03. |
| LT-01/02/03/04 | W23/W24/W25, chức năng phòng/thi đã có từ S1. |
| LT-05/06/07/08 | W15/W17/W18/W20, W23/W24/W25. |
| LT-09/10/11 | W09 hash; W02/W03 caps; W12 bộ M; W23/W24/W25. |
| LT-12/13/14/15 | W11/W14/W15/W16/W21/W22/W25; cả startup/lock và chờ 30 phút. |

Khi viết ticket, gán từng phần test cho đúng task; không gắn nguyên PT-02 cho
framer rồi quên JSON/schema, hoặc nhận PT-28 đạt chỉ từ kill child trước commit.
Tất cả threshold, số mẫu 9000/8820, profile S/M và cách đo giữ theo tài liệu 04.

## 6. Dependency và checkpoint hai sprint

Cập nhật sau phân rã: [backlog 65 ticket](backlog.md) thay W01..W26 bằng đầu ra
cụ thể, metadata/description/dependency/estimate; không phải 26 Jira issue. Các
khoảng giờ trong §7 là nhận định trước khi soạn ticket, xem capacity mới ở backlog.

Lịch A/B chi tiết, goal và review/demo theo [kế hoạch sprint](sprint-plan.md).
Các checkpoint dưới đây là cùng các mốc đó, không là lịch hay thời gian cộng thêm.

Không dùng chuỗi cứng M0 → M1 → … → M7 để khóa toàn bộ công việc. Những đường
giao quan trọng cần giữ:

1. Wire/ownership → RX và TX → poll/bridge → auth thật. DB/seed/UI primitives có
   thể làm song song, không chờ transport hoàn tất mới viết repository.
2. Auth + activity + catalog → phòng chờ. Bank + transaction → generator và finalizer;
   start là chỗ ghép phòng với generator, end là chỗ ghép timer với finalizer.
3. Snapshot + clock + receipt → save; finalizer + pending UI → submit. Kết quả
   cần điều kiện ENDED; history/chart dùng cùng projection công bố.
4. Session/instance + receipt + pending → recovery. Driver và oracle nhận contract
   sớm; tải nghiệm thu cần chức năng, còn bot nhỏ chạy từ trước.

Checkpoint là timebox đề xuất, không là hẹn đã có runtime:

| Thời điểm tương đối | Đầu ra cần nhìn thấy | Nếu chưa đạt |
| --- | --- | --- |
| Cuối ngày 2 | C RX/TX kiểm chia/gộp/partial; BP init/ready và local pipe có ca tích hợp nhỏ. | Tập trung đường nền còn lỗi, bỏ polish sớm; đánh giá lại mốc S1. |
| Cuối ngày 4 | Một UI login thật qua C TCP→C BP→Node→DB, bank/catalog/seed sẵn; người kia tái lập được. | Không mở đồng thời nhiều màn hình chỉ mock; báo ngay rủi ro lịch hai tuần. |
| Cuối ngày 5–6 | Hai tài khoản create/join/start; đề riêng có snapshot, save/revision commit thật; chạy client nhỏ. | Bảo vệ luồng cốt lõi trước, không tự giảm quyền/receipt để kịp demo. |
| Cuối ngày 7 | Hai UI LAN nhận đề/save/submit, host end hoặc hết giờ, kết quả đúng quyền; start rollback và nộp lặp đã kiểm. | S1 chưa đạt goal; lập lại dự báo cùng nhóm trước khi commit toàn S2. |
| Ngày 8–10 | Admin form, recovery, practice và history tích hợp tăng dần; chạy 50 đầu tiên, chưa đợi chart/polish xong. | Ưu tiên lỗi tính đúng đắn; không gọi thử 50 socket là đạt 50 thí sinh. |
| Ngày 11–12 | Chạy đủ các kịch bản LT và đối soát; sửa/đo lại phần lỗi. | Báo rõ FAIL/NOT_RUN, dùng thời gian còn lại sửa; cần điều chỉnh lịch nếu không đủ. |
| Ngày 13–14 | Chủ yếu lỗi còn lại, clean setup, báo cáo/bảo vệ. Mỗi ngày trước đó cũng đọc hiểu phần vừa làm. | Không dồn toàn bộ học C và đo tải lần đầu vào hai ngày này. |

S1 goal vẫn khá dày; các checkpoint giúp phát hiện sớm, không là bằng chứng chắc
chắn đủ bảy ngày. Thứ tự S2 của B không thể tất cả nối tiếp tới ngày 10: cần seed,
bot skeleton và UI components sớm, tái dùng engine và review nhỏ hằng ngày.

## 7. Capacity và độ khả thi

Nếu làm cả 14 ngày: **56–70 giờ/người, 112–140 giờ nhóm**. Hai ngày cuối có
16–20 giờ nhóm, nằm trong tổng này, không là thời gian cộng thêm. Nếu chỉ làm
10 ngày thì chỉ 80–100 giờ nhóm. Chưa biết ngày nghỉ/hạn bảo vệ, không mặc định
có thể làm bù nhiều giờ hơn. AI không thay thời gian chạy LAN/đọc hiểu/debug.

Ước lượng bậc đầu dưới đây là **nhận định lập kế hoạch**, chưa phải estimate
ticket hoặc thời gian đo; phải thay bằng estimate sau description. Giả định
scaffold giữ nguyên, không đổi giao thức giữa chừng, có Linux và hai máy LAN,
UI dùng component tái sử dụng. Mã mới luôn gồm test module, log và UI của chức năng;
review chéo/đọc hiểu/buffer còn được tách ở dòng cuối để tránh coi là miễn phí.

| Nhóm việc còn lại | A, giờ dự kiến | B, giờ dự kiến |
| --- | --- | --- |
| Nền codec/transport/bridge/config/DB theo ownership | 22–30 | 12–17 |
| Auth/phòng/start/end/timer A; bank/catalog/generator B | 16–22 | 10–14 |
| Save/submit và result tối thiểu B | — | 14–19 |
| Admin form/practice/history/chart B | — | 10–14 |
| Recovery/kiểm lỗi tích hợp theo module | 6–9 | 7–10 |
| Driver hoặc behavior/oracle, chạy tải/report/runbook theo phần mình | 8–12 | 8–10 |
| Review chéo, đọc hiểu bổ sung và dự phòng lỗi ngoài ca đã tính | 8–12 | 8–12 |
| **Tổng sơ bộ** | **60–85** | **69–96** |

Tổng 129–181 giờ nhóm so với 112–140 giờ sẵn có: chỉ phía thuận lợi của dự báo
mới khớp ngân sách cao; B gần hết 70 giờ ngay cận dưới. Không lấy tổng nhóm để
che một người thiếu thời gian, không suy hai phần ngang nhau từ 8 gói S1 mỗi người.
Các số này cảnh báo rủi ro, không phải khẳng định chắc chắn phải mất 181 giờ.

Giữ ownership đã chốt nhưng giảm tải tích hợp cho B đúng cách: A tự làm DDL/repo
phần A, driver/thu số đo/runbook, phần UI A; B giữ DB runner và domain B. Theme
thống nhất cùng nhau, không để B gánh toàn bộ UI dùng chung. A có thể hỗ trợ
chạy/test theo hướng dẫn B khi A rảnh, không đổi chủ module âm thầm.

Chưa cắt FR/admin/practice/chart/reliability để làm lịch đẹp. Ưu tiên giảm
animation, dashboard trang trí, đóng gói đa nền tảng và refactor tổng quát chưa
cam kết. Nếu estimate ticket vẫn vượt capacity: nhóm chọn kéo dài lịch hoặc
đổi phạm vi rõ ràng; không tự nhận bản hai tuần chắc chắn hoàn thiện toàn bộ.

## 8. Điều kiện trước khi viết và nhập ticket

Đủ cơ sở để soạn ticket dự thảo từ coverage này. Các việc còn phải phân biệt:

- V03 cần nhóm chốt bound trong đầu ra W01 trước loader; các ticket không phụ
  thuộc có thể soạn/triển khai, không mở lại quyết định CRC hoặc nghiệp vụ.
- Khi soạn description, chốt header/types/transaction/clock bàn giao cụ thể;
  tách vòng tích hợp W05/W06 và interface W15 để đồ thị Blocks không có chu trình.
- Mỗi task chỉ một assignee, reviewer người còn lại; helper quyền/log/schema là
  AC theo task, không nhân bản một task cho từng FR.
- Tách seed/admin CLI khỏi form admin; result tối thiểu khỏi history/chart;
  bot nhỏ S1 khỏi nghiệm thu S2, không chia một Jira issue vào hai sprint.
- Tính estimate còn lại A/B sau khi có description. Đánh giá lại goal S1 trước
  commit khối lượng; không thay đổi scope đã duyệt qua field Jira.
- Link board đã có; ngày bắt đầu, accountId và API metadata chưa xác minh.
  Chúng không chặn soạn nội dung, nhưng chưa thể gán người/sprint thật qua API.

Review này không ghi có test runtime mới đạt, không đổi stack/core, không tạo
issue/sprint và không commit/push. Bước sau là description và backlog truy vết,
không cần tiếp tục vòng nghiên cứu kiến trúc nếu không có vấn đề mới cụ thể.

## 9. Audit phạm vi và stack với sprint plan

Ngày đối chiếu: 17/11/2026, sau review triển khai S1. Kiểm từ FR/UC/AC và quyết
định D01–D07/C01–C12/M01/V01 → dữ liệu/giao thức → gói W → sprint/demo. Đối chiếu
thêm config mẫu, package manifests/.nvmrc, CMake/dependency và setup hiện có.
Đây là kiểm tính nhất quán tài liệu/kế hoạch, không phải nghiệm thu runtime.

### 9.1. Kết luận audit và những chỗ đã sửa

Không phát hiện nhóm FR đã cam kết bị loại khỏi hai sprint hoặc một stack mới
được tự thêm vào. Tuy nhiên trước audit, một số chi tiết vận hành chỉ có ở đặc
tả, dễ bị bỏ qua khi soạn ticket. Đã đưa chúng vào sprint-plan §2.8, giữ owner
và giá trị theo tài liệu 02/03/04, không tạo dịch vụ/tính năng mới.

| Phát hiện thật | Xử lý sau audit | Trạng thái |
| --- | --- | --- |
| Plan chưa nói rõ cap 50 activity toàn hệ thống khác số socket và room capacity | Gắn W04/W09/W11/W20, kiểm cả reservation offline/nộp sớm/nhiều phòng. | Đã bổ sung kế hoạch; NOT_RUN. |
| Timeout config thường 5s dễ bị dùng luôn cho auth đang hash; hai loại child có timeout khác nhau | Ghi auth 65s/job 60s, desktop child ready 5s, server startup/shutdown 10s và owner A. | Đã làm rõ; NOT_RUN. |
| “Retry S1” chưa nêu đủ điều kiện | Chốt dẫn 03 §12: auto W chỉ BUSY/RATE_LIMITED + NONE + budget, tối đa 2 retry, không auto retry mutation timeout/UNKNOWN. | Làm rõ kế hoạch, không đổi đặc tả. |
| Rate limit và log rotation/drain chưa có đầu ra rõ trong gói việc | Bổ sung W04/W05/W08/W09 và AC từng module; giữ cap log, không để stderr pipe giữ child/poll. | Đã giao phần tích hợp; NOT_RUN. |
| 03 §12.2 viết “C tự lấy items”, dễ thành thêm một orchestrator cạnh UI | Sửa thành ứng dụng client điều phối trang qua IPC/TCP C; C truyền request/response, một item-page đang chờ/client. | Đồng bộ với 02 và plan; không đổi wire. |
| 02 §3 viết user_id từ NET body được đối chiếu, dễ hiểu là chấp nhận khóa schema cấm | Sửa rõ từ chối user_id/role ngoài schema; caller từ binding/session, C cấp metadata BP. | Đồng bộ với 03 §3/7. |
| 02 §5.2 mô tả output ownership ở lúc C đọc frame, chưa nhắc ticket còn sống | Ghi ownership output khác thời điểm trả credit: ticket tới TX enqueue/drop đúng generation theo 03 §18.4. | Làm rõ, không đổi cap/credit. |
| K07/schema check và cold backup chưa gắn đủ rõ vào thời điểm thực hiện | Chặn startup DB ca dở ngay từ S1; S2 kiểm crash/restore và runbook backup khi dừng sạch. | Đã bổ sung; NOT_RUN. |
| Một số câu hiện hành của 03/04 còn dùng từ worker của kiến trúc cũ | Đổi thành Node dispatcher/auth queue theo M01; giữ nguyên các bảng lịch sử đã ghi quyết định cũ. | Đồng bộ thuật ngữ, không thêm thread nghiệp vụ. |

Không kết luận “đã hoàn toàn đầy đủ và chắc chắn đúng tiến độ”: V03 còn là quyết
định config cần chốt; mã FR con/description/estimate/đồ thị Jira còn bước soạn
ticket. Các phần này có vị trí xử lý, không là lý do mở rộng kiến trúc hoặc trì
hoãn bắt đầu codec. Checklist giúp tránh viết thiếu rồi làm lại giữa sprint.

### 9.2. Các quy tắc nghiệp vụ dễ bị bỏ sót

Bảng FR/AC tại §5 đã phủ 13 nhóm; bảng dưới rà lại các nhánh nhỏ có ảnh hưởng
trực tiếp tới cách code. Cột S2 chỉ phần hoàn thiện/kiểm lại, không trì hoãn
điều kiện bảo vệ dữ liệu cần có ngay lần đầu implement handler.

| Quy tắc hiện hành | Nơi thực hiện S1 | Hoàn thiện/kiểm lại S2 |
| --- | --- | --- |
| Chủ phòng tự thi, counts theo một/all topic; admin quản lý kho chung | W10/W11/W12; catalog chỉ counts, không key; kiểm lại kho lúc start | W19 form admin; W20 practice. |
| Một user một activity; nộp sớm vẫn giữ chỗ tới ENDED; global 50 | W09 helpers, W11/W14/W15; wait/offline không giải phóng | W17/W20/W25 kiểm qua login/reconnect và mixed. |
| User thường rời WAITING; chủ cancel; expiry 30 phút cố định, không chuyển chủ/gia hạn | W11/W15; C02 startup WAITING expiry, không attempt/score cho CANCELLED | W22/W25 race/offline/startup và LT-15 thật. |
| Start gán tất cả roster kể cả offline, atomic, không join mới sau start | W11/W12/W15, config_version; emit sau commit, từng người lấy đúng attempt | W17/W18 reconnect thành viên cũ; W25 50 người. |
| Random theo counts, không lặp nội bộ; snapshot cả key để chấm, không key trên NET đề | W12/W13/W14; không yêu cầu đề khác nhau tuyệt đối hoặc đảo options | W19 sửa kho, W24 oracle snapshot và bộ M. |
| Click trước giờ chưa đủ; t_admit sau validate/BEGIN, strict trước deadline, commit mới ACK | W13/W14/W15; UI server_saved khác draft, revision/receipt | W18/W22/W25 mất ACK/DB error/deadline dưới tải. |
| Submit khóa sửa, đợi save; một finalizer dùng cho early/deadline/host end | W13/W14/W15; giữ finalize_reason, FINALIZATION_PENDING không thành công giả | W18/W20/W22 reuse cho recovery/practice/fault. |
| Mọi người nộp không tự end; chỉ công bố khi ENDED; score half-up hai chữ số | W14/W15/W16; chặn query kết quả sớm và sai owner | W21 history/chart/detail không mở đường lộ điểm. |
| Chi tiết sau công bố chỉ selected/is_correct, không đáp án mẫu câu sai; chủ chỉ bảng tổng | W16 projection kết quả; dữ liệu chưa implement không được gửi row thô | W21 result.items/history/chart. |
| Logout/app close/disconnect không leave/submit; old callback không lộ qua user mới | W08/W09 lifecycle/logout cơ bản/token filter | W17/W18 offline/reload/replace/instance fence đầy đủ. |
| Recovery chỉ dữ liệu server đã commit, không offline durable draft hay server-crash resume | W07/W08/W09/W12 nền, startup K07 W05/W07 | W17/W18/W22, không regenerate đề hoặc reset giờ. |
| Practice không phòng chờ, deadline riêng, chấm xong công bố và giải phóng activity | S1 chuẩn bị engine/helper, chưa đánh FR-11 Done | W20 dùng helper A, W21 lịch sử; W24/W25 mixed tổng 50. |

### 9.3. Inventory lệnh — không chỉ đối chiếu tên FR

Inventory phủ toàn bộ lệnh sản phẩm ở 03 §6/7/9: 27 lệnh nghiệp vụ, 4 auth,
2 sys và 3 local. Đây là mapping phạm vi, không tạo 36 ticket. Owner chỉ người
chủ trì; các API đều đi qua C transport/BP chung và được schema/quyền kiểm tra.
Auth/local/sys không tự thêm vào W ledger vì có thay đổi trạng thái RAM.

| Lệnh | Gói | Chủ trì | Mốc chức năng |
| --- | --- | --- | --- |
| sys.hello | W04/W08 | A | S1, instance/version/handshake. |
| sys.ping | W04/W08 | A | S1, liveness ở C. |
| auth.register | W09 | A | S1, USER và không tự login. |
| auth.login | W09 | A | S1, binding/revoke/token filter. |
| auth.logout | W09/W17 | A | S1 cơ bản; S2 offline/mất ACK/reload. |
| auth.resume | W17 | A | Contract/session nền S1; luồng resume thật S2. |
| state.get | W09/W17 | A | S1, S2 dùng để sync. |
| operation.get | W07/W09/W18 | A, helper ledger B | S1; S2 reconcile xuyên reconnect. |
| room.list | W11 | A | S1, states và cursor. |
| room.create | W11 | A | S1, chủ tự tham gia/reservation. |
| room.configure | W11 | A | S1, expected_config_version và counts. |
| room.get | W11 | A | S1, roster/my_attempt_id và refresh. |
| room.join | W11 | A | S1, WAITING/cap/no-op đúng quyền. |
| room.leave | W11 | A | S1, thường/WAITING, không lách start. |
| room.cancel | W11 | A | S1, giải phóng atomic/không điểm. |
| room.start | W15/W12 | A, generator B | S1, snapshot tất cả hoặc rollback. |
| room.end | W15/W14 | A, finalizer B | S1, ENDED rồi công bố. |
| catalog.list | W10 | B | S1, available/all_available/cursor. |
| admin.topic.list | W10/W19 | B | S1 handler; S2 form. |
| admin.topic.create | W10/W19 | B | S1 handler/receipt; S2 form. |
| admin.topic.update | W10/W19 | B | S1 handler/version/inactive; S2 form. |
| admin.question.list | W10/W19 | B | S1 handler/ADMIN; S2 form. |
| admin.question.create | W10/W19 | B | S1 handler/receipt; S2 form. |
| admin.question.update | W10/W19 | B | S1 handler/version/inactive; S2 form. |
| practice.start | W20 | B | S2, engine/activity/deadline A. |
| attempt.get | W12/W18 | B | S1; S2 phục hồi bài/answers. |
| attempt.items | W12 | B | S1, snapshot page không key. |
| answer.save | W13/W18 | B | S1 revision/receipt/UI; S2 reconcile. |
| attempt.submit | W14/W18 | B | S1 finalizer/UI; S2 reconcile. |
| result.get | W16 | B | S1, chỉ published owner. |
| result.items | W21 | B | S2, selected/is_correct. |
| room.results | W16 | B | S1, owner phòng ENDED. |
| history.list | W21 | B | S2, nguồn dữ liệu chart chung. |
| local.connect | W08 | A | S1, IPv4/config hợp lệ/hello. |
| local.status | W08 | A | S1; S2 sync khi reload. |
| local.shutdown | W08 | A | S1, không ngầm logout/nộp/rời. |

NET events room.changed/attempt.changed/session.revoked do domain A/B phát sau
commit khi thích hợp, route qua W06/W08; local.ready/local.connection_changed/
local.auth_changed thuộc W08/W17. Pending API main/preload W08/W17 theo C05,
không là NET command mới. BP init/ready/event_credit/opened/request/closed/
binding/response/event/close/shutdown/stopped thuộc W05/W06, full lifecycle từ
S1 và fault verification W22. CLI admin/migration/seed không là endpoint mạng.

### 9.4. Stack và phần bị loại khỏi phạm vi

| Thành phần đã chốt | Đặt trong sprint/gói | Ranh giới phải giữ |
| --- | --- | --- |
| React/TypeScript trong Electron | W08/W09/W11/W13/W16 S1; W19/W20/W21 S2 | UI/preload không tự mở LAN socket, token không xuống renderer; theme A/B cùng làm. |
| Client C + server C, TCP/LAN, POSIX/poll | W02/W03/W04/W08 S1; W17 S2 reconnect | Mỗi app một TCP; không thay bằng net/http/Express/Socket.IO ở Node nghiệp vụ. |
| Hai IPC pipe stdin/stdout riêng | W05/W06/W08 S1 | stdout chỉ frame, stderr log có giới hạn; không terminal stream công khai/storage; không gọi pipe chống hook tuyệt đối. |
| Node TypeScript business child | W05/W06/W09/W10–W16 S1, W17–W21 S2 | Một dispatcher/DatabaseSync, một transaction owner; không mạng LAN Node, không C domain worker cũ. |
| SQLite local: WAL/FULL/FK/migration/prepared | W07 S1; W22/W26 S2 | Một business connection, int64 string ở wire; không Postgres/ORM/server DB mới. |
| node:crypto scrypt async; C libsodium random | W09/W10 S1; hash benchmark W25 S2 | Không Argon2 worker C cũ hoặc tự viết crypto; không giữ transaction trong lúc hash. |
| cJSON + validation C/TS, canonical SHA-256, frame length + JSON | W01/W02/W03/W07 S1 | Không CRC32 V1, không MAC/TLS trá hình; fingerprint dùng retry, không là bảo mật đường truyền. |
| CMake/C11 + npm workspace/lockfile; Node .nvmrc 24.15.0 | Giữ scaffold; W01/W05 Linux preflight S1, W26 bàn giao S2 | Không làm lại nền đã có; không nâng runtime/dependency trong lúc chia task thiếu lý do. |
| Harness ngoài sản phẩm, driver A/behavior-oracle B | W23/W24 nhỏ S1, đầy đủ W25 S2 | Bot không thay client C sản phẩm; 2 UI LAN và 50 bot là hai loại bằng chứng bổ sung. |

Không thấy sprint yêu cầu thêm feature đã loại ở 01 §2.2. Giữ ngoài backlog:
500/1000 người, đa server/failover, multimedia/AI chấm, CSV/Excel import, đảo
options chưa đặc tả, chuyển chủ/gia hạn, offline DB và server-crash resume.
UI polish/charts trong phạm vi không thành dashboard phân tích mới. Cold backup
thuộc runbook, không thêm backup scheduler/service. CRC/TLS/HTTP/Go/Postgres
không được tự quay lại qua ticket. AI dùng để hỗ trợ phát triển/kiểm chứng,
không thành một module sản phẩm hoặc tiêu chí điểm mới.

### 9.5. Tiến độ và trạng thái sẵn sàng

Sprint 1 có đủ nền và một luồng thi có dữ liệu thật; Sprint 2 reuse engine để
hoàn tất practice/admin/history/recovery rồi nghiệm thu. Các việc có thể song
song đã nêu trong sprint-plan §2.5/3.4, không yêu cầu B hoàn tất chart/admin mới
cho A chạy tải. Ngày 7/14 review/demo/retro đã trừ trong capacity; ngày 15/16
chỉ dự phòng, không tự lấy làm thời gian xây chức năng cam kết còn thiếu.

Vẫn cần estimate ticket/giờ còn lại A/B để kiểm từng ngày, vì đủ coverage không
chứng minh đủ capacity. Không chuyển nguyên W01–W16 thành 16 ticket lớn hoặc
gán toàn bộ công việc vào ngày 1. Chốt V03 trước loader, chuẩn hóa FR con khi
soạn ticket nghiệp vụ, tạo đồ thị Blocks không vòng và cắt đầu ra có consumer.
Đây là các đầu vào thực thi còn lại; không phát hiện lý do đổi stack/core hay
thêm FR để “đủ dự án”. Không có đo tải mới, Jira mutation hoặc commit/push trong audit.
