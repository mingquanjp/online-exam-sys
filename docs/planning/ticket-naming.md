# Quy tắc đặt tên ticket

Áp dụng ngày 18/11/2026 cho 65 Task trong hai sprint. Các Epic tiếp tục dùng tên
nhóm chức năng hiện có. Đây là chuẩn tên của nhóm, không phải yêu cầu bắt buộc của Jira.

## Cấu trúc

`[Module] Động từ + đối tượng/kết quả + ngữ cảnh cần phân biệt`

- Viết hành động bằng tiếng Việt; giữ tên công nghệ, API và thuật ngữ cần đối chiếu code.
- Dùng một tên module nhất quán cho cùng vùng trách nhiệm, ví dụ C Transport,
  C Server, C Client, Business Bridge, Electron Bridge, Auth, Room, Exam, Results.
  Hậu tố UI phân biệt việc giao diện; Load Test và Data Verification phân biệt
  chạy tải với đối soát dữ liệu.
- Ưu tiên một dòng dễ đọc, tối đa 120 ký tự trong bộ hiện tại. Mỗi tiêu đề có
  động từ cụ thể như Tạo, Triển khai, Kiểm tra, Hiển thị, Đối soát hoặc Đo.
- Chỉ giữ chi tiết giúp phân biệt đầu ra; bước triển khai, vector, ca lỗi và
  lệnh kiểm tra nằm trong description.
- Owner, sprint, estimate, priority và dependency dùng trường/nhãn đã có.
  Riêng review ghi Sprint 1/2 và tên Minh Quân/Hoàng Quân để phân biệt bốn đầu ra.
- Mã EXAM-Txx là định danh nguồn ổn định; SCRUM-xx là Jira key. Không đổi số mã
  và không đánh số thứ tự ưu tiên vào tên. Thứ tự pick dùng Rank đã chốt.

Ví dụ:

| Module | Tên |
| --- | --- |
| C Transport | [C Transport] Tách frame nhận và giữ phần dữ liệu dư |
| Room | [Room] Bắt đầu thi với roster cố định và tạo đề nguyên tử |
| Exam UI | [Exam UI] Hiển thị câu hỏi, thay đổi đáp án và trạng thái lưu |
| Data Verification | [Data Verification] Đối soát độc lập snapshot, ACK, revision và điểm Sprint 1 |

## Nguồn và đồng bộ

Tên hiện hành nằm ở heading của `sprint-1-tickets.md`, `sprint-2-tickets.md` và
bảng index trong `backlog.md`. Bảng chuyển đổi lần này là
`tools/jira/ticket_names.json` (old/new theo source ID).

Lần chuẩn hóa tên đầu tiên chỉ đổi heading/index. Lần cập nhật tiếp theo đổi
tên thành viên trong mô tả và bổ sung cách review, giữ phạm vi nghiệm thu.
S2 dùng nguồn mới khi nhập trong tương lai. S1 đã đổi tên lần đầu cần chạy
[update mô tả và tên thành viên](jira-workflow.md#11-cập-nhật-mô-tả-tên-thành-viên-và-cách-review).

Hướng dẫn Atlassian khuyến nghị summary là câu hành động rõ, ngắn, nêu được việc
cần làm; tiền tố module là lựa chọn của nhóm để đọc board thuận tiện:
[Ticket Writing Guide](https://github.com/atlassian/atlassian-mcp-server/blob/main/skills/spec-to-backlog/references/ticket-writing-guide.md).
