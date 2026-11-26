# SCRUM-10 — Migration và repository phần Minh Quân

Mục tiêu: bàn giao DDL và prepared queries users/rooms/room_members/user_activity
cho T06 và các consumer auth/phòng/activity. Nguồn: 02 §8.2–8.3/9.1, 03 §3/5,
05 §2.1/2.3/4 và hợp đồng SCRUM-9 §5. Không triển khai runner, handler hoặc UI.

## Đầu ra và cách kiểm

- SQL tại `db/migrations/user-room-storage.sql`; cách ghép/version/FK tại
  [hướng dẫn migrations](../../db/migrations/README.md).
- API, lỗi và ownership tại [storage](../../apps/business/src/storage/README.md).
- Chạy từ repo root: `npm run test:storage --workspace @exam/business`,
  `npm run typecheck:business`, `npm run check:business`, `git diff --check`.

Kiểm thử `:memory:` không chạm DB thật. Môi trường tự kiểm: macOS arm64,
Node 24.15.0, SQLite 3.51.3 từ node:sqlite. Tự kiểm ngày 26/11/2026:

- `npm run test:storage --workspace @exam/business`: PASS, 12/12 test.
- `npm run typecheck:business`: PASS.
- `npm run check:business`: PASS build và --version; không chứng minh startup DB.
- `git diff --check`: PASS cho diff tracked; file mới được kiểm whitespace riêng.

| Phần kiểm | Bằng chứng và giới hạn |
| --- | --- |
| DDL/constraints | SQLite thực thi SQL; default/auth_version, NOT NULL/STRICT, duplicate username/member/activity, FK sai, XOR, count/version/time/state và giữ lịch sử bằng RESTRICT. |
| Transaction tạo phòng | Repository thật tạo room + member chủ + activity, commit đồng thời; duplicate activity làm rollback room/member vừa thêm. |
| Hủy/rời | Cancel + release cùng transaction; fault sau release rollback cả state/activity. Hủy giữ roster; rời xóa đúng pair. Release sai user/kind/id không xóa ref khác. |
| Query/boundary | ID lớn hơn 2^53 qua create/read/update/list/member/activity, signed int64 boundary; SQL injection là dữ liệu bind; pagination giảm dần/state filter/has_more, version cũ/state sai không ghi. ID 9/99/100 kiểm thứ tự số của phòng/roster và duyệt từng trang không bỏ sót phòng. |
| Ownership | Mutation ngoài transaction bị từ chối; repository không tự BEGIN/COMMIT/close. |
| UTC bị chỉnh lùi | Start/cancel ghi được UTC nhỏ hơn created_at; end ghi được UTC nhỏ hơn started_at. Giá trị âm/vượt MAX_SAFE_INTEGER vẫn bị CHECK chặn; ràng buộc state/NULL và deadline cấu hình vẫn giữ. |

Regression UTC được chạy trước khi sửa DDL và FAIL tại CHECK cancelled_at >=
created_at, sau sửa PASS. Regression ID khác số chữ số cũng FAIL trước khi sửa
ORDER BY sang cột INTEGER gốc và PASS sau sửa. DDL chỉ kiểm miền UTC, không yêu cầu
UTC tăng theo trình tự; theo 02 §7.2, domain dùng monotonic cho xét hạn. Test
truyền mốc UTC giả lập trên SQLite bộ nhớ, không chỉnh đồng hồ máy và không
nghiệm thu clock/timer/finalizer của consumer.

Các bảng cha `topics`/`attempts` trong fixture là tối thiểu để kiểm FK, không là
schema thật của Hoàng Quân. Transaction fixture chỉ BEGIN/COMMIT/ROLLBACK trên
SQLite, không thay wrapper lỗi commit/IO của T06. Danh sách test và kết quả cuối
được báo khi bàn giao; không suy nguyên FR/AC đã đạt từ các ca repository.

## Chưa nghiệm thu

T06 runner/PRAGMA startup/version/K07/commit ambiguity; helpers cap 50/authority/
state đầy đủ của T12/T14/T18; receipt/generator/finalizer;
UI/TCP/LAN/tải 50 người. AC-01/19/20 mới có bằng chứng ở tầng lưu trữ, chưa là
PASS nghiệp vụ end-to-end. Version migration cuối và review chéo Hoàng Quân còn
chờ khi ghép; chưa đánh ticket Done.

## Checkpoint bảo vệ

CHECK chỉ thấy hàng hiện tại nên không bảo đảm room có member chủ, số thành viên
hay activity thuộc đúng người/state. Transaction gom các ghi liên quan: lỗi ở
bước giữ chỗ phải rollback cả room/member; không để phòng được báo tạo thành
công mà chủ chưa thực sự có chỗ. Repo chỉ ghi/đọc SQL, domain kiểm điều kiện,
T06 điều khiển commit và phân loại lỗi DB, dispatcher chỉ gửi response sau đó.
