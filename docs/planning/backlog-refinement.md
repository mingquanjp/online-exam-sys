# Chia nhỏ ticket và tăng độ rõ của description

Ngày: 17/11/2026. Bản mới thay bộ43 ticket ban đầu bằng **65 ticket/4 Epic**,
gồm44 candidate S1 và21 candidate S2; chưa tạo issue hoặc cập nhật Jira.

## Căn cứ và cách kế thừa

Đã đọc lại file tham khảo của người dùng:
`ai-staffing/docs/proposals/backend-organization-accounts-profile-tickets.md`,
đặc biệt cấu trúc description, bảng tình huống, dependency và bàn giao ở các
task contract/repository/API/UI. Kế thừa cách viết, không sao chép nghiệp vụ
Go/HTTP/Postgres/Gmail, quyền solo, commands, thời hạn hoặc Jira site của dự án đó.

Description hiện có: mục tiêu; đầu vào và điều kiện bắt đầu; nguồn; phạm vi;
các bước thực hiện; vùng mã dự kiến; bảng tình huống/kết quả; checklist nghiệm
thu; cách kiểm/evidence; provider/consumer; bàn giao/ngoài phạm vi; checkpoint
bảo vệ; source ID. Các commands có sẵn được phân biệt với test mới cần viết.

## Quy tắc kích thước task

- Khoảng người dùng yêu cầu: **2–8 giờ/Task**. Bộ hiện tại chọn **2–4 giờ**;
  không dùng8h như mặc định vì mỗi bạn chỉ có4–5h/ngày.
- Một task có một đầu ra có thể bàn giao/test, một owner và reviewer còn lại.
  Không tách thành task một hàm/file hoặc tạo review ticket cho từng tầng.
- Estimate gồm code, tự test và đọc hiểu phần mình. Peer review/sync/update được
  tính riêng trong capacity; không giả mọi task4h chắc chắn xong trong ngày4h.
- Khi nhận việc, nếu thấy vượt8h, tách theo đầu ra/interface trước triển khai;
  không đổi estimate thành8h để che việc lớn. Nếu bug độc lập vượt timebox thì
  tạo Bug liên kết, không bỏ AC hoặc báo Done khi lỗi chặn còn tồn tại.
- T25/T26/T42/T43 là **gói evidence/demo/forecast + review**,2h/người gồm45phút
  chuẩn bị gói bàn giao và75phút tham gia cùng một buổi review/retro. Buổi họp
  vẫn75phút, không nâng thành2h chỉ để vừa khoảng estimate, không tính hai lần.

## Mapping thay đổi

Mã T01–T43 giữ lại cho phần còn lại đã thu hẹp/định rõ; phần tách dùng T44–T65.
Chưa có Jira key thực, không sửa/đóng/tạo lại issue bên ngoài. Số mã không phải
thứ tự code nối tiếp; consumer đã được nối tới provider mới khi cần.

| Gói cũ | Phần giữ lại | Phần tách mới |
| --- | --- | --- |
| T03 RX+JSON | T03 RX header/payload/feed2h | T44 strict UTF-8/JSON/envelope2h |
| T05 TX+canonical | T05 TX queue/partial send3h | T45 canonical/fingerprint/vectors2h |
| T08 reactor+logger | T08 reactor/hello/ping/timers4h | T46 log sink/rotation/stderr drain2h |
| T09 config+launcher+dispatcher | T09 C launcher/lock/lifecycle3h | T47 config loaders2h; T48 Node BP input/dispatcher2h |
| T10 Node output+C route | T10 Node output/drain2h | T49 C routing/credit3h |
| T11 C client+Electron | T11 C client/mapping3h | T50 Electron main/preload/pending3h |
| T12 hash+auth APIs | T12 APIs/session/authority3h | T51 scrypt queue/helper2h |
| T15 topics/questions/seed | T15 topics/catalog2h | T54 question APIs3h; T55 seed tooling2h |
| T17 generator+read APIs | T17 generator/snapshot2h | T56 attempt.get/items/paging2h |
| T18 rooms/UI/expiry | T18 room core backend4h | T52 room/host UI3h; T53 cancel/expiry2h |
| T19 save+UI | T19 answer.save backend2h | T57 exam/navigation/autosave UI3h |
| T20 finalizer+submit UI | T20 engine/API3h | T58 UI flush/confirm/submit2h |
| T21 start+end+host | T21 start transaction2h | T59 end/deadline2h; host UI đã ở T52 |
| T22 result APIs+UI | T22 result projection/APIs2h | T60 result/host table UI2h |
| T24 bot+oracle | T24 small bot behavior2h | T61 independent oracle2h |
| T27 C/main recovery | T27 TCP resume3h | T62 main reload/logout/context3h |
| T34 DB faults+backup | T34 DB/ledger fault checks3h | T63 cold backup/restore2h |
| T36 mọi run chuẩn | T36 steady/auth/LAN3h | T64 burst/start/deadline3h |
| T38 mọi run lỗi/biên | T38 mixed/slowpeer3h | T65 reconnect/maxtext/expiry3h |

Các task không xuất hiện trong bảng vẫn được viết lại description đầy đủ và
rà dependency/estimate. Mỗi scope cũ được truy về task giữ lại và các task tách,
không cắt quyền/deadline/retry/admin/practice/chart để làm tổng giờ đẹp.
Lần chia nhỏ rút 286 cạnh còn 112 bằng cách bỏ cạnh bắc cầu dư. Các lần review
sau chỉnh cạnh bàn giao và lịch review. Xem [backlog](backlog.md) để lấy đồ thị
hiện hành và [review theo sprint goal](pre-jira-review.md) để biết lý do thay đổi.

## Capacity sau khi chia nhỏ

| Giờ owner, chưa gồm peer review/sync/update | A | B |
| --- | --- | --- |
| S1 —44 candidate | 56 | 49 |
| S2 —21 candidate | 28 | 30 |
| Tổng task | 84 | 79 |
| Phối hợp14ngày ×50phút/ngày | 11,67 | 11,67 |
| Tổng dự báo thuận lợi | 95,67 | 90,67 |
| Capacity14ngày ×4–5h | 56–70 | 56–70 |

So với bộ trước, A tăng22,5h và B tăng17,5h task. Đây là **ước lượng lại khi
làm rõ đầu ra/tích hợp/kiểm chứng**, không phải số task tự chứng minh phát sinh
tính năng mới. Mức này vẫn là dự báo thuận lợi với AI và reuse, chưa cộng bug lớn.

Với capacity hiện có, không thể dùng bảng này để cam kết toàn bộ phạm vi xong
hai tuần hoặc chỉ cần thêm1–2ngày. Giữ hai sprint như hai nhóm mục tiêu/candidate
đã thống nhất; trước khi start sprint phải chốt lượng việc theo giờ thật, hoặc
nhóm thay đổi lịch rõ ràng. Không tự đổi lịch/FR/ownership trong lần chia này.

Các ticket nền có thể bắt đầu ngay theo [backlog](backlog.md); không cần đợi
quyết định mọi ngày trong lịch mới làm RX/TX/interface độc lập. Sau ngày2/4 ghi
giờ còn lại và blocker thật để dự báo lại S1; không lấy S2 làm buffer miễn phí.

## Kiểm tra thực hiện

`python3 tools/jira/prepare_backlog.py` kiểm65 source IDs duy nhất,4 Epic,
estimate2–8h, các phần description/bảng tình huống không rỗng, owner/reviewer,
dependency không vòng và không có S1 chờ S2. Coverage reference giữ13 FR,
30 AC,28 PT,15 LT và W01–W26; mapping36 command và BP/events được rà trong backlog.

Kiểm offline chỉ chứng minh cấu trúc/truy vết, không chứng minh mọi estimate
chính xác hoặc mọi AC đã PASS. Các test runtime đều chưa chạy; chưa gọi Jira API.
