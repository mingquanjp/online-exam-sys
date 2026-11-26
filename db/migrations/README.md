# Migrations

SQL migrations dùng bởi **một** TypeScript runner của T06 trong apps/business/storage.
Minh Quân viết users/rooms/members/activity, Hoàng Quân viết topics/questions/
attempts/items/answers và tích hợp operations/schema_migrations, theo tài liệu 02 §8.

## Bàn giao SCRUM-10 cho T06

`user-room-storage.sql` là phần DDL đầu tiên của Minh Quân, chưa là migration
được runner đánh phiên bản/chạy lúc startup. File không chứa BEGIN/COMMIT,
schema_migrations, seed hoặc IF NOT EXISTS che schema sai.

- Hoàng Quân ghép file này với DDL phần mình vào **cùng migration khởi tạo**.
  Số version/tên migration cuối được thống nhất khi ghép T06; SCRUM-10 chưa tự
  ghi một version toàn cục đã được hai người duyệt.
- Có FK `rooms.topic_id → topics.id`, `user_activity.practice_attempt_id → attempts.id`.
  SQLite cho phép khai báo FK tới bảng tạo sau: runner tạo đầy đủ cả hai phần
  trong transaction trước khi prepare repository/seed hay cho DB ready. Cách này
  cũng cho phép `attempts` tham chiếu `users` và cặp khóa của `room_members`.
- T06 phải bật foreign_keys trước transaction, kiểm toàn schema/FK sau ghép,
  quản lý version, commit/rollback và readiness. Không mở DB thật bằng script
  kiểm thử của ticket này, không tạo runner thứ hai.
- PK/UNIQUE ngăn username/member/activity trùng; CHECK kiểm một hàng, không bảo
  đảm host membership, capacity, chủ đề active hoặc activity đúng chủ/state.
  Các điều kiện nhiều bảng phải được domain kiểm trong transaction.
- FK giữ mặc định ON UPDATE NO ACTION, ON DELETE RESTRICT; không CASCADE xóa
  lịch sử. Timestamp là Unix ms nguyên an toàn với JS; version là 1..INT32_MAX.
  Kiểu STRICT và giới hạn byte giúp chặn lỗi ghi. Chuẩn hóa/UTF-8/trim/control,
  hash hợp lệ và quyền vẫn thuộc validator/auth/domain, không thay bằng SQL CHECK.

Kiểm DDL/repository bằng SQLite `:memory:`:

```sh
npm run test:storage --workspace @exam/business
```

Fixture chỉ tạo khóa cha tối thiểu `topics`/`attempts` để thực thi FK, không thay
schema bank/attempt thật. Tích hợp runner/schema của Hoàng Quân thuộc T06.
