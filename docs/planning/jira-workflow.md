# Từ yêu cầu đến ticket và hai sprint

Ngày soạn: 17/11/2026. Cập nhật trạng thái ngày 18/11/2026: nhóm xác nhận đã
nhập 4 Epic/44 task S1, kiểm import, sắp Rank và đổi tên xong. S2 chưa nhập.
Assignee gán theo nhãn owner A/B; xem mục 8–10 cho thao tác hiện hành.
Những đoạn mô tả chuẩn bị bên dưới ghi lại kế hoạch trước lúc nhập, không phải
kết quả kiểm tra trực tiếp trạng thái Jira trong lượt review này.

Đã soạn [backlog 65 ticket/4 Epic](backlog.md) và kiểm offline bằng
`tools/jira/prepare_backlog.py`. Importer Sprint 1 có offline/plan/apply/check.
Theo yêu cầu nhóm, mỗi Task 2–8h. Bộ hiện tại 2–4h. Xem
[mapping chia nhỏ](backlog-refinement.md) và mục 8 để chạy importer.

Đích do người dùng cung cấp:
[SCRUM / board 1](https://ltm-project.atlassian.net/jira/software/projects/SCRUM/boards/1).
Site https://ltm-project.atlassian.net, project key SCRUM, board ID 1. Đây là
thông tin từ URL, chưa xác minh qua API loại board, tính năng Sprint, quyền,
accountId của hai thành viên hoặc issue metadata. Không suy trạng thái board
từ tên project SCRUM; không dùng site DATN của repo tham khảo.

## 1. Nguồn và cách kế thừa

Đã tham khảo repo ai-staffing: docs/ai/workflow.md, docs/ai/task-template.md,
docs/proposals/backend-organization-accounts-profile-tickets.md và các script
scripts/jira/{auth_import,oap_import,jira_batch}.py cùng README-oap.md.

Kế thừa cách chia theo đầu ra, description có thể nghiệm thu, nguồn Markdown,
mapping mã nội bộ → Jira key, phụ thuộc Blocks và đối soát import. Không kế thừa
nghiệp vụ Go/PostgreSQL/Gmail, quy tắc solo, accountId, key DATN, board/site hoặc
checkpoint tự viết Go của dự án khác. Không chạy importer DATN cho repo này.

Nguồn triển khai vẫn là [yêu cầu FR/UC/AC](../01-requirements-and-business-flows.md),
[kiến trúc](../02-architecture-and-data.md), [giao thức](../03-protocol-specification.md),
[kiểm chứng](../04-capacity-and-validation.md), [phân công](../05-implementation-plan-and-task-allocation.md).
Ticket không là nơi tự đổi quyết định nghiệp vụ; không chép lại toàn bộ đặc tả.

## 2. Cách break yêu cầu

Chuỗi truy vết: FR/UC + hợp đồng kỹ thuật → đầu ra cần bàn giao → task → AC/test
và bằng chứng. FR không bắt buộc tương ứng một ticket hoặc một Epic. Một FR có
thể cần nhiều task; một task nền có thể hỗ trợ nhiều FR. Một nhóm AC đầy đủ được
phủ bởi tập task, không tự nói một task nhỏ hoàn thành cả FR.

- Task chức năng ưu tiên đầu ra người dùng chạy được, gồm C/TS/DB/UI liên quan.
- Task nền như codec RX/TX, launcher/BP, DB bootstrap được tách khi có consumer
  và ranh giới A/B thật. Phần tích hợp nằm trong AC/handoff, không chờ cuối mới ghép.
- Không tạo một ticket cho từng hàm/file hoặc ticket review lặp cho mọi tầng.
  Không gom cả FR-13 “Vận hành” thành một task khổng lồ.
- Mỗi task một người chịu trách nhiệm chính, người kia review hoặc bàn giao một
  interface cụ thể. “Cả hai” không thay assignee rõ ràng.
- Giữ A RX/connect/lifecycle/auth/room/timer; B TX/bank/attempt/practice/results.
  UI chia theo chức năng; theme/component dùng chung chia thành đầu ra cụ thể.
- Không lập task làm lại scaffold/tài liệu đã có như công việc mới còn lại.
  Dẫn bằng chứng đầu vào, chỉ ghi phần thiếu thực tế; không tự chuyển Done.
- Estimate là dự báo còn lại sau khi đọc đầu vào, không chia đều giờ theo số task
  hoặc suy khả năng hoàn thành từ việc sử dụng AI. Không giả số giờ đã làm.

Mỗi task dùng [mẫu description](task-template.md), có ít nhất một tình huống lỗi
quan trọng và checkpoint kiến thức mạng nếu chạm C/protocol/lifecycle.

## 3. Khung hai sprint

Hai sprint một tuần là mục tiêu dự kiến; chưa tạo sprint, chưa gán ngày cụ thể.
Lập backlog đầy đủ trước, tính capacity từng người và dependency rồi mới commit
khối lượng. Mốc M0–M7 của tài liệu 05 là đầu ra kỹ thuật, không phải bảy sprint.

Nhóm giữ mục tiêu 14 ngày + 1–2 ngày dự phòng phát sinh. Theo
[kế hoạch hai sprint](sprint-plan.md): mỗi sprint có goal, điều kiện kết thúc,
lịch A/B, review/demo 60 phút và retrospective 15 phút vào ngày 7/14. Timebox
nằm trong capacity 4–5 giờ/người/ngày, không cộng ngoài giờ. Ngày 15/16 chỉ dùng
khi cần, không tự tăng thời lượng sprint S2 hoặc thêm sprint thứ ba.

[Review FR và hai sprint](fr-sprint-review.md) bổ sung coverage FR/AC/PT/LT,
gói việc A/B, checkpoint và rủi ro capacity. Người dùng xác nhận khoảng
4–5 giờ/người/ngày; chưa chốt ngày bắt đầu. W01..W26 ở bản review là gói việc,
không phải 26 Jira ticket đã quyết định; phải chốt description/estimate trước.
Đặc biệt S1 dùng bảng bàn giao và ca nghiệm thu tại kế hoạch sprint §2.4–2.7:
tách đầu ra clock/activity/receipt/BP khỏi tích hợp cuối, không tạo Blocks vòng.
Retry đúng op trên kết nối còn sống nằm S1; reconnect/reload/instance recovery
nghiệm thu S2, không dùng nhãn recovery để dời toàn bộ tính đúng đắn sang tuần sau.

| Sprint dự kiến | Sprint goal | Cách đối chiếu mốc |
| --- | --- | --- |
| S1 | Hai UI trên LAN đi được login → tạo/join → start → đề riêng → save/đổi → submit → công bố kết quả | M0 còn thiếu, M1/M2/M3/M4, kèm result tối thiểu cần cho demo. Khóa schema/revision/receipt/caps ngay khi dùng, không để đến S2 mới thiết kế. |
| S2 | Hoàn thiện phạm vi còn lại, recovery/lỗi, kiểm chứng 50 người và bảo vệ | M5/M6/M7; admin form, luyện tập, history/chart theo thứ tự phụ thuộc; hoàn thiện UI. Giữ ngày 13–14 chủ yếu cho sửa lỗi và luyện bảo vệ. |

S1 là mục tiêu khá dày, không coi bảng này là chứng minh capacity đủ. Tải nhỏ và
test lỗi module chạy từ S1; S2 là nghiệm thu tích hợp, không lần đầu thử đồng thời.
Các chức năng barem đã nhận vẫn nằm backlog; không tự cắt nếu estimate vượt lịch.

## 4. Cấu trúc backlog và description

Backlog hoàn chỉnh cần có:

1. Bảng coverage FR-01..13 → ticket → UC/AC/PT/LT, không chỉ một cột Summary.
2. Epic theo mục tiêu chức năng/nhóm việc; task dưới Epic theo đầu ra review được.
3. Mã nội bộ ổn định dạng EXAM-Tnn, Summary, assignee A/B, reviewer, sprint dự kiến,
   dependency trực tiếp, estimate dự kiến và trạng thái đầu vào.
4. Description đầy đủ, tham chiếu mục nguồn, ngoài phạm vi, tình huống/AC, cách
   kiểm chứng và câu hỏi cần tự giải thích khi bảo vệ.
5. Một danh sách cạnh provider blocks consumer; chiều ngược là cách Jira hiển thị
   cùng liên kết, không tạo lại hai lần. Rank chỉ là thứ tự ưu tiên, không tự là
   dependency; không biến hai người thành một chuỗi chặn nối tiếp toàn bộ.

EXAM-Tnn là mã nguồn ticket, chưa là project key thật. Khi Jira trả key thật mới
dùng trong branch/commit/PR; không dự đoán key hoặc mượn DATN của dự án tham khảo.
Nếu task thuộc nhiều FR hoặc hỗ trợ toàn bộ giao thức thì ghi đủ quan hệ, không
nhân bản cùng công việc để làm bảng coverage đẹp.

## 5. Flow import API dự kiến

Nguồn ticket Markdown → manifest/description ADF → kiểm offline → đọc metadata
site/project/board/users/sprints → plan diff → apply phần đã được giao → đọc lại
và đối chiếu nội dung/parent/assignee/Blocks/Rank/sprint trong phạm vi đã chốt.

Các đặc điểm cần thích nghi từ importer tham khảo:

| Importer ai-staffing đã đọc | Yêu cầu cho online-exam-sys |
| --- | --- |
| Hard-code site DATN/project DATN/board 1 và verify issue của DATN | Xác minh đích riêng; không dùng key hoặc ID của site khác. |
| Assignee duy nhất là tài khoản đang xác thực | Mapping hai thành viên theo accountId thật đã xác minh assignable. |
| Không gửi sprint; nhánh team-managed hiện từ chối Sprint ENABLED | Không tái dùng nguyên nhánh kiểm tra này; cần đọc đúng loại board/tính năng Sprint và metadata trước tích hợp. |
| Bộ nguồn → manifest → ADF, không description viết tay trong script | Giữ một nguồn ticket; xác minh bảng/checklist/code/link nguồn render đúng. |
| plan/apply/check, source labels và journal xử lý kết quả chưa rõ | Giữ nguyên nguyên tắc không tạo trùng, đọc lại trước retry create/link/rank; journal riêng không dính DATN. |

Tạo sprint, đặt ngày, gán issue vào sprint hoặc chuyển trạng thái là mutation
riêng cần có đích và phạm vi rõ; không mặc định importer cũ đã hỗ trợ chúng.
Không tự start/close sprint hoặc đổi workflow/quyền để né lỗi metadata.

Chưa cần token khi soạn backlog. Không đọc .env của ai-staffing, không đưa token
vào chat/argv/Git hoặc dùng credential dự án kia. Chưa chọn cách cung cấp credential
cho công cụ mới; phần đó được thiết lập khi thực sự chuẩn bị API. Link nguồn Jira
phải là remote/revision thật nếu đã có, không tạo URL commit giả từ file local.

## 6. Trong lúc triển khai

Quy tắc branch, commit, PR title/description và liên kết Development nằm tại
[workflow Jira–GitHub](../development/git-workflow.md). Khi nhận task, agent đọc
[AGENTS.md](../../AGENTS.md) và dùng [PR template](../../.github/pull_request_template.md).

Luồng dự kiến: To Do → In Progress → In Review → Done, ánh xạ theo workflow thật
của board. Bắt đầu khi đủ đầu vào; bị block ghi rõ nguyên nhân. Tác giả tự hiểu
code; chọn review chéo/tự review theo mức ảnh hưởng tại workflow Git §1.1,
không dựa vào dependency. AI hỗ trợ review không được
mô tả là một thành viên độc lập đã phê duyệt.

Done khi AC và kiểm tra đúng phạm vi đạt, bàn giao cho consumer, mức review áp dụng đã hoàn thành
và thay đổi đã được tích hợp theo quy trình nhóm. Task tài liệu/nền tảng dùng
bằng chứng đúng loại, không giả đã có runtime. Commit/push/PR/Jira mutations chỉ
thực hiện khi người dùng giao; backlog không tự cấp quyền thực hiện các việc đó.

## 7. Đầu vào còn cần trước nhập Jira

Đã nhận link SCRUM / board 1 và dự kiến 4–5 giờ/người/ngày; còn xác minh
metadata/quyền qua API, hai tài khoản thành viên, ngày bắt đầu/ngày nghỉ và
khối lượng theo estimate ticket. V03 bound config đã được hai thành viên duyệt
ngày 26/11/2026 tại [bảng cấu hình](../../config/README.md#v03--bảng-cấu-hình-đề-xuất-scrum-9);
không thêm CRC32 hoặc thay đổi nghiệp vụ khi chia ticket.

Tài liệu này mô tả flow; [backlog](backlog.md) chứa description/coverage/estimate
đã soạn. Bước tiếp theo là chạy plan trên Jira thật để xác minh metadata của project.


## 8. Nhập ticket Sprint 1 vào Product Backlog

Importer lấy nguồn trực tiếp từ Markdown đã review. Phạm vi gồm 44 task S1,
4 Epic được tham chiếu và 54 liên kết Blocks. Giờ dự kiến nằm trong phần mô tả.
Task mang nhãn `exam-s1-candidate`. Ngày review 7–8 là mốc nhóm dự kiến.
Thao tác gán ticket vào một sprint Jira dùng board sau khi nhóm chốt lịch.

Chạy trong terminal từ thư mục repo. Dùng email và API token của người chạy importer.

```sh
python3 tools/jira/import_sprint1.py offline
python3 tools/jira/import_sprint1.py plan
python3 tools/jira/import_sprint1.py apply
python3 tools/jira/import_sprint1.py check
```

Terminal hỏi email và API token. Token được nhập ẩn. Nếu dùng token có scope,
truyền thêm `--cloud-id` của site. Plan kiểm site và project SCRUM,
issue type/field và quyền tạo issue/link. Xem danh sách NEW và liên kết
trước khi dùng apply. Nếu Jira yêu cầu trường tạo issue bổ sung,
điều chỉnh mapping trường theo metadata thật trước khi chạy lại.

Chạy apply từ một máy. Journal tại `.local/jira-sprint1/state.json` giữ mapping
và thao tác chưa xác nhận. Nếu máy mất phản hồi, chạy plan để tìm lại issue
theo nhãn mã nguồn hoặc kiểm liên kết. Nếu plan vẫn báo chưa rõ kết quả,
kiểm tra Jira và quyền hiển thị trước khi tiếp tục. Giữ journal để đối soát.
Apply kiểm kết quả sau mỗi thao tác và đọc lại cả lô. Check chỉ đọc Jira.


Trường Assignee do Jira xử lý theo mặc định của project lúc tạo. Sau khi mời
Hoàng Quân vào project, lọc từng nhóm bằng JQL và dùng Bulk change → Assignee.

```jql
project = SCRUM AND labels = "exam-s1-candidate" AND labels = "exam-owner-a"
```

```jql
project = SCRUM AND labels = "exam-s1-candidate" AND labels = "exam-owner-b"
```

Nhóm A thuộc Minh Quân. Nhóm B thuộc Hoàng Quân. Plan, apply và check đối soát
các nhãn này. Việc thay Assignee trên Jira được giữ khi chạy lại importer.

Ngày 18/11/2026, bỏ điều kiện board phải có type scrum khỏi importer.
Lệnh tạo issue và Blocks dùng API của project SCRUM. Việc xếp issue vào sprint
cần xác minh board ở bước thao tác sprint sau đó.

## 9. Sắp thứ tự ưu tiên cho Sprint 1 trên Jira

Dùng công cụ Rank sau khi đã nhập đủ ticket. Thứ tự được định nghĩa tại
`tools/jira/rank_sprint1.py`, kiểm đủ 44 task và mọi provider đứng trước consumer.
Ưu tiên đầu tiên là T01 của Minh Quân và T05 của Hoàng Quân, tiếp theo DDL,
RX/validation, DB/config, reactor/bridges, auth, room và bài thi. Hai task review
nằm cuối danh sách.

```sh
python3 tools/jira/rank_sprint1.py plan
python3 tools/jira/rank_sprint1.py apply
python3 tools/jira/rank_sprint1.py check
```

Mỗi lệnh hỏi email/token như importer. Nếu dùng token có scope, thêm
`--cloud-id` như lúc nhập. Lệnh plan hiển thị thứ tự dự kiến với key SCRUM thật.
Apply thay Rank của 44 task trên board 1 và đọc lại thứ tự. Kết quả thành công
là `RANK CHECK đạt: 44 task đúng thứ tự ưu tiên.`

Importer dùng trường Rank do cấu hình board cung cấp. Sau khi chạy, tải lại
Backlog hoặc Board. Nếu xem qua All work search, chọn `ORDER BY Rank ASC` trong
JQL để giữ thứ tự khi lọc theo người.

```jql
project = SCRUM AND labels = "exam-s1-candidate" AND labels = "exam-owner-a" ORDER BY Rank ASC
```

Đổi nhãn thành `exam-owner-b` cho Hoàng Quân. Mỗi bạn chọn task To Do cao nhất
của mình có đầu vào sẵn sàng. Nếu task đầu đang chờ người kia bàn giao, chọn
task kế tiếp đủ đầu vào, rồi cập nhật blocker. Hai bạn có thể code song song
trên interface/fixture và ghép kiểm khi provider bàn giao.

Journal Rank nằm tại `.local/jira-sprint1/rank-state.json`. Nếu mất phản hồi,
chạy plan để đọc thứ tự hiện tại rồi apply để hoàn thiện phần còn thiếu.
Công cụ chỉ gọi API Rank cho các task S1, giữ nội dung và assignee do nhóm đã gán.

## 10. Đồng bộ tên Task đã nhập

Áp dụng [quy tắc đặt tên](ticket-naming.md): `[Module] Động từ + kết quả cần làm`.
Nguồn cả 65 Task đã được đổi tên; 44 Task S1 trên Jira cần cập nhật riêng:

```sh
python3 tools/jira/rename_sprint1.py plan
python3 tools/jira/rename_sprint1.py apply
python3 tools/jira/rename_sprint1.py check
```

Chạy tại repo có journal `.local/jira-sprint1/state.json` từ lượt import.
Mỗi lệnh hỏi email/token; thêm `--cloud-id` nếu trước đó dùng token có scope.
Plan in tên cũ → tên mới theo key thật và không ghi Jira. Apply kiểm đủ 44 Task,
nhãn nguồn/owner, project và tên trước khi ghi. Chỉ gửi trường `summary` qua
[API Edit issue](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put).
Không sửa description, Rank, assignee, trạng thái, sprint, Epic hoặc dependency.
Không tạo issue mới. Kết quả cuối:

`RENAME CHECK đạt: 44 task đúng quy tắc đặt tên.`

Nếu tên đã được sửa thủ công ngoài bảng old/new, công cụ dừng để đối chiếu.
Nếu mất phản hồi, chạy plan đọc lại rồi apply; các tên đã đổi đúng được bỏ qua.
Không sửa hoặc xóa journal import. Sau khi check đạt, tải lại Jira; thứ tự Rank
vẫn giữ nguyên. Lệnh check của importer sau đó sử dụng tên mới từ tài liệu.

Kiểm offline và regression test:

```sh
python3 tools/jira/rename_sprint1.py offline
python3 -m unittest discover -s tools/jira -p 'test_*sprint1.py' -v
```

## 11. Cập nhật mô tả, tên thành viên và cách review

Nguồn 65 Task dùng tên **Nguyễn Minh Quân** và **Đặng Hoàng Quân** trong metadata
và mô tả. Alias A/B và label `exam-owner-a`/`exam-owner-b` chỉ giữ bên trong tooling
để mapping không đổi. Đây không phải đổi accountId hoặc gán lại assignee Jira.

61 task tạo đầu ra kỹ thuật/contract/bằng chứng cần review chéo; bốn task
T25/T26/T42/T43 là buổi review/demo chung, không cần PR rỗng để duyệt cuộc họp.
Sửa thuần trình bày rủi ro thấp vẫn được tự review theo workflow Git §1.1.
Không tự phân một task kỹ thuật thành self-review chỉ vì không có dependency.
Mỗi mô tả có mục “Cách review”; AC/estimate/provider/consumer giữ phạm vi đã chốt.

Sau khi đã chạy đổi tên lần trước, đồng bộ 44 task S1 hiện có:

```sh
python3 tools/jira/update_sprint1.py plan
python3 tools/jira/update_sprint1.py apply
python3 tools/jira/update_sprint1.py check
```

Mỗi lệnh hỏi email/token, hỗ trợ `--cloud-id` như importer. Chạy ở repo có
`.local/jira-sprint1/state.json`. Plan không ghi Jira; apply chỉ PUT `summary`
và `description`. Bốn title sprint review trong nguồn được đổi “phần A/B”
thành tên thành viên, trong S1 có hai title tương ứng được cập nhật cùng mô tả.
Không sửa assignee đã gán, Rank, sprint, trạng thái, Epic, label hoặc Blocks;
không tạo task mới. S2 dùng nguồn mới khi nhập sau này.

`tools/jira/ticket_description_update.json` ghi tên cũ/mới và SHA-256 của ADF
đã chuẩn hóa trước/sau lần sửa này. Hash chỉ dùng đối chiếu tài liệu, không là
CRC hay thay đổi protocol ứng dụng. Apply đối chiếu đủ 44 task trước khi ghi;
kiểm tra lại từng task ngay trước PUT và đọc lại sau ghi. Nếu ai sửa description
trên Jira ngoài hai bản cũ/mới, công cụ dừng thay vì ghi đè. Giữ description
không đổi trong thời gian chạy batch; Jira không cung cấp transaction chung
cho 44 issue trong công cụ này.

Nếu mất phản hồi giữa chừng: chạy plan rồi apply để tiếp tục, nội dung đã cập
nhật được bỏ qua. Nếu có xung đột mô tả, đối chiếu thay đổi thủ công trước;
không bỏ guard/hash để ép ghi. Lệnh check thành công báo:

`UPDATE CHECK đạt: 44 task đúng tên thành viên và mô tả review.`

Sau đó tải lại Jira. Importer check dùng nguồn mới, nên cần update xong trước
khi dùng lại `import_sprint1.py check`. Không cần chạy lại rename hoặc Rank apply.

Kiểm offline: `python3 tools/jira/update_sprint1.py offline`. Bộ regression:
`python3 -m unittest discover -s tools/jira -p 'test_*sprint1.py' -v`.
