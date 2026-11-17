<!-- Title tiếng Anh: type(scope): imperative subject [SCRUM-key]. Dùng key Jira thật; chưa có ticket phù hợp thì bỏ key. Description tiếng Việt. Quy tắc: docs/development/git-workflow.md. Xóa How/Limits nếu không cần. -->
<!-- Agent review: đọc AGENTS.md và git-workflow.md §1.2. Review theo ticket/AC/nguồn hiện hành; findings có bằng chứng, gợi ý tùy chọn không chặn merge. Không tự sửa code hoặc mở rộng scope trong lượt review. -->

## What — Thay đổi gì?

<!-- Nêu hành vi/đầu ra cuối. Jira: https://ltm-project.atlassian.net/browse/SCRUM-KEY (thay bằng key thật, hoặc bỏ nếu chưa có ticket). -->

## Why — Vì sao cần thay đổi?

<!-- Vấn đề cụ thể và tác động. -->

## How — Cách thực hiện

<!-- Tùy chọn: quyết định kỹ thuật, ownership, giao diện giữa module hoặc PR phụ thuộc cần review. -->

## Configuration — Cấu hình / biến môi trường

Không thay đổi.
<!-- Nếu có, thay dòng trên: tên, mục đích, required/default không nhạy cảm và tài liệu chạy. Không ghi secret. -->

<!-- Mức review: review chéo (mạng/dữ liệu/nghiệp vụ/contract) hoặc tự review (chỉ trình bày rủi ro thấp). Nêu mức và lý do ngắn; không dùng số dependency làm tiêu chí. Theo workflow §1.1; giữ required checks/reviews nếu repo đã bật. -->

## Developer Test — Kiểm tra thực tế

- Đã chạy và kết quả:
- Môi trường / bằng chứng:
- Chưa kiểm / giới hạn kiểm chứng:

<!-- Chạy lệnh đúng phạm vi. Phân biệt build, fixture/fake, tích hợp thật và tải thực. Ca network/DB cần lỗi/biên theo AC; ảnh UI khi hữu ích. Tác giả cần giải thích được code để bảo vệ. -->

## Limits — Giới hạn và bàn giao

<!-- Tùy chọn: phần còn lại, consumer nhận đầu ra hoặc rủi ro liên quan. Không coi PR là cho phép tự chạy migration hoặc ghi dữ liệu thật. -->
