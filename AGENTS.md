# Chỉ dẫn làm việc trong online-exam-sys

## Nguồn và phạm vi

- Đọc [README](README.md), rồi nguồn đúng phần việc trong năm tài liệu 01–05.
  Quyết định hiện hành có xác nhận ưu tiên bản nghiên cứu/lịch sử cũ; ticket
  không tự ghi đè nghiệp vụ/kiến trúc. Không tự thêm tầng, dependency hoặc scope.
- Khi nhận task và chuẩn bị Git, theo [workflow Jira–GitHub](docs/development/git-workflow.md).
  Jira nguồn tại [backlog](docs/planning/backlog.md); đọc AC/Blocks và đối chiếu key thật.
- Mỗi task ghi ngắn mục tiêu, nguồn, phạm vi và tiêu chí đạt; không tạo tài liệu
  lặp đặc tả. Còn quyết định chưa chốt thì làm phần độc lập và xác nhận trước code phụ thuộc.

## Kiến trúc và phối hợp

- C sở hữu TCP/socket/poll/nonblocking/framing/RX/TX và vòng đời transport.
  Node TypeScript sở hữu nghiệp vụ/SQLite; React/Electron làm UI/cầu nối theo 02/03.
- Giữ phân công A: RX/client/lifecycle/auth/room/timer; B: TX/bank/attempt/practice/results.
  UI theo chức năng. Review theo ảnh hưởng tại workflow §1.1: phần mạng/dữ liệu/
  nghiệp vụ cần người còn lại review; trình bày rủi ro thấp có thể tự review.
  Không suy “không dependency” là “không cần review”; AI không thay human review.
- Mục tiêu ứng dụng 50 người chờ test tích hợp thực. Build/probe/mock không thay
  nghiệm thu nghiệp vụ, LAN hoặc tải. Không thêm CRC/UDP/HTTP/Postgres ngoài quyết định đã chốt.

## Thiết kế, code và giải thích khi bảo vệ

- Theo note trên lớp do nhóm cung cấp: đúng đề, đúng chức năng đã chốt, thiết kế
  vừa đủ cho quy mô thực tế. Mỗi cơ chế thêm phải nêu vấn đề cụ thể và cân nhắc
  cách đơn giản hơn giữ cùng tính đúng đắn. Ưu tiên API/thư viện sẵn có trong
  stack và tái sử dụng code; không tự thêm dependency, tối ưu sớm hoặc viết lại.
- Đặt tên hàm/biến/hằng số có nghĩa, theo quy tắc hiện có. Viết các bước tường minh;
  tách hàm theo nhiệm vụ hoặc nhu cầu dùng lại, tránh chuỗi wrapper quá nhỏ.
  Gom hằng số ở nơi dễ tìm, không rải magic numbers hoặc tạo tầng config mới.
- Dùng comment tiếng Việt theo Doxygen trước định nghĩa hàm: `@brief`, `@param`
  với hướng in/out phù hợp, `@return` cho hàm có giá trị trả về, `@note` khi cần.
  Với TypeScript dùng dạng JSDoc tương đương, không thêm công cụ sinh tài liệu.
  Nêu ownership bộ nhớ/tài nguyên hoặc điều kiện khóa khi thực sự có; không tự
  thêm khóa để khớp ví dụ. Không lặp nguyên mô tả dài ở cả khai báo và định nghĩa.
- Trong hàm, comment ngắn tại bước quan trọng, giải thích lý do không hiển nhiên;
  có thể đánh số khi giúp theo dõi. Không kể lại từng phép gán; sửa comment cùng
  hành vi. Không tự thêm kiểm tra nguy cơ thấp hoặc abstraction chỉ để đủ checklist.
- Khi bàn giao phần code, giải thích vừa đủ: ai gọi/khi nào, input/output/trạng
  thái đổi, nơi kiểm tra/quyết định, lý do có buffer/state/khóa và khi lỗi hoặc
  mất kết nối. Với phần tích hợp, nối được luồng UI→client→protocol→server→DB.
  Giúp thành viên hiểu code, không chỉnh code để che giấu việc dùng AI.
- Đơn giản không bỏ quyền, deadline, nộp/chấm đúng hoặc truy cập đồng thời.
  Ví dụ MD5 của thầy chỉ minh họa tái sử dụng thư viện, không là yêu cầu thêm
  MD5/checksum, đổi cách lưu mật khẩu hoặc triển khai thuật toán mới.

## Git và bàn giao

- Feature/docs/test/refactor: `feature/SCRUM-<id>-<slug>`; Bug riêng:
  `bug/SCRUM-<id>-<slug>`. Dùng key Jira thật; chưa có ticket phù hợp thì bỏ key.
- Commit/PR title tiếng Anh: `type(scope): imperative subject [SCRUM-key]`;
  PR description tiếng Việt theo [template](.github/pull_request_template.md).
- Kiểm working tree trước; giữ thay đổi sẵn có, không tự stash/reset/xóa hoặc
  gộp việc khác vào task. Không tự commit/push/mở PR/merge/cập nhật Jira khi chưa được giao.
- Bàn giao nêu thay đổi, kiểm tra thực/kết quả, giới hạn và bước kế tiếp. Done
  theo AC/review/tích hợp trong workflow, không từ việc AI đã sinh code.

## Mặc định khi được yêu cầu review PR

Áp dụng cả với prompt ngắn như “hãy review giúp tôi PR này”. Đọc
[quy tắc review](docs/development/git-workflow.md#12-agent-review-pr-theo-phạm-vi)
trước khi review; không cần người dùng nhắc lại toàn bộ quy tắc.

- Đây là lượt review: kiểm tra và báo cáo, không tự sửa code/tài liệu, commit,
  push, merge, đổi trạng thái Jira hoặc đăng nhận xét lên GitHub. Chỉ thực hiện
  các việc đó nếu người dùng đã giao rõ; link PR để đọc không tự là yêu cầu đăng bài.
- Xác định diff base/head, ticket và AC áp dụng; đọc nguồn hiện hành liên quan
  và code phụ thuộc trực tiếp khi cần. Không đánh giá PR nhỏ như phải hoàn thành
  toàn Epic, sprint hoặc phần việc đã giao ticket khác. Thiếu nguồn thì nêu giới
  hạn, không bịa yêu cầu hoặc kết luận đạt AC chưa đối chiếu được.
- Tìm lỗi có bằng chứng: sai hành vi/contract, hồi quy, lỗi an toàn dữ liệu hoặc
  thiếu kiểm chứng trọng yếu trong scope. Mỗi lỗi cần vị trí, điều kiện xảy ra,
  hệ quả và yêu cầu bị vi phạm hoặc hành vi sai cụ thể; gợi ý cách sửa nhỏ nhất.
- Không tự mở rộng scope, đổi kiến trúc/dependency hoặc thêm abstraction chỉ vì
  “best practice”. Gợi ý tùy chọn không chặn merge; không biến sở thích style,
  refactor hoặc ca tải ngoài phạm vi thành lỗi bắt buộc. Không hạ tiêu chí đúng
  đắn chỉ để giữ scope; lỗi nghiêm trọng ngoài diff được nêu riêng, không giấu đi.
- Kết quả tách lỗi cần sửa trước merge, giới hạn kiểm chứng và gợi ý tùy chọn
  nếu có. Không bịa finding để đủ số lượng; không có lỗi có bằng chứng thì nói rõ.
  Ghi đúng test đã chạy/chưa chạy; không gọi AI review là human approval.
- Đối chiếu cả quy tắc code/comment ở trên. Thiếu hoặc sai mô tả ownership/điều
  kiện dùng gây hiểu sai contract cần nêu cụ thể; góp ý câu chữ, chia hàm hoặc
  cách đánh số đơn thuần không tự thành lỗi chặn merge. Không bắt sửa hàng loạt
  code ngoài diff để áp quy tắc mới, hoặc yêu cầu chạy Doxygen/sinh tài liệu.

## Kiểm tra và dữ liệu

- Lệnh kiểm theo phạm vi ở workflow; scaffold hiện chỉ có C --version smoke,
  TS/build và test công cụ Jira. Khi triển khai thêm test cần cho AC của module.
- Chọn ca theo nghiệp vụ/rủi ro trong task: quyền, hết giờ, nộp lặp, input sai,
  mất mạng, thao tác đồng thời khi liên quan. Báo đúng kết quả/giới hạn; không
  thêm cơ chế xử lý ngoài scope chỉ để bao phủ mọi tình huống giả định.
- Không đọc/in `.env`, token, credentials hoặc key đáp án thật để chuẩn bị Git/PR.
  Không commit `.local/` (journal Jira), DB/runtime data hoặc build/dependencies.
- Không tự chạy migration/seed/reset lên DB thật từ task tài liệu/UI; dùng dữ
  liệu thử được phép. Không đổi quyền, bỏ sandbox/checksum hoặc audit fix --force để né lỗi.
