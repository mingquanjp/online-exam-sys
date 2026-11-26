# Migrations

SQL migrations dùng bởi **một** TypeScript runner của T06 trong apps/business/storage.
Minh Quân viết users/rooms/members/activity, Hoàng Quân viết topics/questions/
attempts/items/answers và tích hợp operations/schema_migrations, theo tài liệu 02 §8.

## Migration khởi tạo

Version 1 gồm `user-room-storage.sql` của SCRUM-10 và `exam-storage.sql` của
SCRUM-14. Runner `apps/business/src/storage/database.ts` chạy theo thứ tự này
trong một transaction, kiểm FK và ghi `schema_migrations` trước commit. Các
file SQL chỉ định nghĩa bảng và chỉ mục. Runner sở hữu transaction và version.

- `rooms.topic_id` và `user_activity.practice_attempt_id` có thể trỏ tới bảng ở
  file chạy sau. Runner áp dụng đủ hai phần trước khi mở repository.
- `attempts` khớp cặp room/user trong roster. `answers` khớp cặp attempt/position
  đã lưu trong đề. `attempt_items` giữ nội dung và đáp án tại lúc gán đề.
- PK/UNIQUE ngăn username/member/activity trùng; CHECK kiểm một hàng, không bảo
  đảm host membership, capacity, chủ đề active hoặc activity đúng chủ/state.
  Các điều kiện nhiều bảng phải được domain kiểm trong transaction.
- FK giữ mặc định ON UPDATE NO ACTION, ON DELETE RESTRICT; không CASCADE xóa
  lịch sử. Timestamp là Unix ms nguyên an toàn với JS; version là 1..INT32_MAX.
  Kiểu STRICT và giới hạn byte giúp chặn lỗi ghi. Chuẩn hóa/UTF-8/trim/control,
  hash hợp lệ và quyền vẫn thuộc validator/auth/domain, không thay bằng SQL CHECK.

Chạy test repository và migration trên dữ liệu thử:

```sh
npm run test:storage --workspace @exam/business
```

Test SCRUM-14 dùng DB tạm trên đĩa để kiểm WAL, rollback migration và mở lại file.
