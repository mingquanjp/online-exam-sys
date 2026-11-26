# storage

SCRUM-14 cung cấp runner migration và transaction qua `node:sqlite`. Các
repository users/rooms/members/activity của SCRUM-10 dùng cùng kết nối. Dispatcher
sở hữu `DatabaseSync`, còn repository mượn kết nối trong phạm vi thao tác.

## API bàn giao

| Module | Đầu ra |
| --- | --- |
| `database.ts` | `openDatabase(databasePath)` trả kết nối sau khi kiểm WAL/FULL/FK, migration và K07. `withTransaction(db, work)` chạy callback đồng bộ trên cùng kết nối và chỉ trả thành công sau commit. |
| `users-repository.ts` | `create(NewUser) → DbId`, `findById` / `findByUsername → UserRow hoặc null`. Row chứa hash/auth_version chỉ dùng nội bộ auth, không là public User DTO. |
| `rooms-repository.ts` | `create → DbId`, `findById → RoomRow hoặc null`, `list(afterId,limit,state?) → {items,has_more}`. Phòng sort ID giảm dần; limit 1..20; domain dựng cursor từ hàng thực trả, áp byte budget của frame. |
| `rooms-repository.ts` | `configure(id,expectedVersion,name,config)`, `start(id,expectedVersion,startedAt,deadlineAt)`, `cancel(id,cancelledAt,reason)`, `end(id,endedAt) → boolean`. false = không có hàng đúng state/version, domain phải đọc/phân loại theo giao thức. |
| `room-members-repository.ts` | `add`, `find → MemberRow hoặc null`, `list`, `count`, `remove → boolean` theo đúng cặp room/user. Không có callback tự xóa khi TCP disconnect. |
| `user-activity-repository.ts` | `find → ActivityRef hoặc null`, `count`, `add`, `release → boolean`. Add không UPSERT/ghi đè; release theo user + kind + resource, không có thì false. |
| `storage-types.ts` | `DbId=string`, `DbReadContext/Tx=DatabaseSync`, `ActivityRef`, kiểu config/state và `bindId`. `Tx` mượn cùng kết nối khi transaction còn mở. |

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

## Mở DB, xử lý lỗi và nối vào consumer

Launcher của SCRUM-17 giữ khóa file dữ liệu trước khi gọi `openDatabase` với
đường dẫn đã resolve. Runner dùng `prepare` để phát hiện bảng/cột thiếu trước
khi bàn giao kết nối. Runner kiểm quyền ghi của file đã tồn tại trước khi mở
SQLite để tránh tạo WAL/SHM chỉ đọc. Với DB đã đúng version, runner thử ghi rồi
rollback để kiểm đường ghi qua SQLite. DB mới được kiểm trong transaction
migration trước commit. Nếu còn phòng RUNNING hoặc bài OPEN,
K07 dừng startup để operator kiểm tra dữ liệu. Phòng WAITING được giữ theo C02.

Chính sách F10 tại SCRUM-14 đặt `busy_timeout = 0 ms`. `BEGIN IMMEDIATE` lấy
quyền ghi trước khi gọi nghiệp vụ. Khi SQLite trả `SQLITE_BUSY` và chưa có thay
đổi, wrapper trả `BUSY`, `effect=NONE`, với `retry_after_ms=100` dành cho phản
hồi. Dispatcher không sleep hoặc retry SQLite trong transaction.

Nếu callback trả lỗi, rollback xong mới trả lỗi nghiệp vụ. Lỗi SQLite với
rollback đã xác nhận trả `DATABASE_ERROR/NONE` hoặc `BUSY/NONE`. Nếu không thể
xác nhận kết quả, wrapper trả `OUTCOME_UNKNOWN/UNKNOWN`, chặn tiếp tục ghi và
thử đóng kết nối. Consumer dừng dùng kết nối đó và đối chiếu receipt sau khi
mở lại theo quy trình vận hành. `diagnostics` nằm ngoài `error` và chỉ chứa bước
xảy ra lỗi cùng mã SQLite nếu có. Dispatcher dùng phần này cho log nội bộ và chỉ
đưa `error` vào phản hồi client.

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

`npm run test:storage --workspace @exam/business` chạy cả test repository
SCRUM-10 và test SCRUM-14 trên file SQLite tạm. Việc phát BP ready, nạp config,
khóa launcher, auth và admin CLI nằm ở các ticket consumer.
