# storage

Hoàng Quân chủ trì node:sqlite open/migration/transaction wrapper (T06).
Minh Quân cung cấp SQL và repository users/rooms/members/activity (SCRUM-10).
Một DatabaseSync thuộc dispatcher; repository mượn kết nối, không mở/đóng DB.

## API bàn giao

| Module | Đầu ra |
| --- | --- |
| `users-repository.ts` | `create(NewUser) → DbId`, `findById` / `findByUsername → UserRow hoặc null`. Row chứa hash/auth_version chỉ dùng nội bộ auth, không là public User DTO. |
| `rooms-repository.ts` | `create → DbId`, `findById → RoomRow hoặc null`, `list(afterId,limit,state?) → {items,has_more}`. Phòng sort ID giảm dần; limit 1..20; domain dựng cursor từ hàng thực trả, áp byte budget của frame. |
| `rooms-repository.ts` | `configure(id,expectedVersion,name,config)`, `start(id,expectedVersion,startedAt,deadlineAt)`, `cancel(id,cancelledAt,reason)`, `end(id,endedAt) → boolean`. false = không có hàng đúng state/version, domain phải đọc/phân loại theo giao thức. |
| `room-members-repository.ts` | `add`, `find → MemberRow hoặc null`, `list`, `count`, `remove → boolean` theo đúng cặp room/user. Không có callback tự xóa khi TCP disconnect. |
| `user-activity-repository.ts` | `find → ActivityRef hoặc null`, `count`, `add`, `release → boolean`. Add không UPSERT/ghi đè; release theo user + kind + resource, không có thì false. |
| `storage-types.ts` | `DbId=string`, `DbReadContext/Tx=DatabaseSync`, `ActivityRef`, kiểu config/state và `bindId`. Tx là tiền điều kiện runtime, không phải kết nối khác hoặc transaction runner thứ hai. |

Tất cả mutation yêu cầu `db.isTransaction=true`, thiếu thì ném lỗi lập trình trước
khi ghi. Caller/T06 sở hữu BEGIN/COMMIT/ROLLBACK; chỉ trả thành công cho client
sau commit. Repository không await, không chạy hash/socket và không tự rollback
lỗi của caller. Read dùng được ngoài transaction; read phục vụ quyết định mutation
phải dùng cùng transaction. Prepared statements sống theo kết nối đã migrate.

ID vào bind bằng BigInt dương trong signed int64; ID đọc CAST AS TEXT ngay trong
SQL. Lệnh ghi đọc rowid/changes bằng BigInt. Không có vòng qua JS Number cho ID.
Các trường số còn lại được schema giới hạn trong miền số nguyên JS an toàn.
Các ép kiểu row TypeScript dựa trên projection SQL + schema đã migrate, không
phải validator cho JSON do client gửi.

Không tìm thấy trả null, cập nhật/xóa không match trả false; unique/check/FK/IO
vẫn ném lỗi node:sqlite cho caller. T06/domain chịu trách nhiệm rollback và ánh
xạ DATABASE_ERROR, USERNAME_TAKEN, ACTIVE_ACTIVITY, version/state... theo ngữ
cảnh; không đưa exception/SQL thô vào response. Lớp repository này chưa phải
helper `Result<...,DomainError>` trong hợp đồng nghiệp vụ SCRUM-9.

## Transaction cần nối ở consumer

- Tạo phòng: kiểm authority/availability/cap → `rooms.create` → `members.add`
  cho chủ → helper reserve activity → receipt → commit. Hàm `rooms.create`
  không tự tạo membership; fixture kiểm cả chuỗi cùng một transaction.
- Rời WAITING: domain kiểm người thường/state → remove đúng pair + release đúng
  ref → receipt → commit. Disconnect không đi qua luồng này.
- Start: domain kiểm chủ/version/hạn + generator tạo đủ đề → start → receipt
  → commit. Cancel/end: đổi state, release đúng room cho roster, cùng transaction
  với receipt và finalizer khi cần. Cancel giữ roster, không tạo/chấm bài.
- `UserActivityRepository.add` chưa là `reserve_activity`: helper T14 còn phải
  kiểm đúng user/state, cùng ref thì no-op, khác ref thì ACTIVE_ACTIVITY, và cap
  50. PK/XOR không tự kiểm được những điều kiện nhiều bảng này.

Kiểm thử trong `apps/business/tests/storage.test.mjs` dùng node:test + SQLite
thật trong bộ nhớ. Chưa có runner T06, auth/room handler, UI, LAN hoặc tải 50 người.
