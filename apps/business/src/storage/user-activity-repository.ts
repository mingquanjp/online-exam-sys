import {
  bindId, prepareWrite, requireTransaction, type ActivityRef, type DbId, type DbReadContext,
} from './storage-types.js';

export class UserActivityRepository {
  private readonly byUser;
  private readonly countAll;
  private readonly insert;
  private readonly removeRoom;
  private readonly removePractice;

  /**
   * @brief Query thô của reservation; helper nghiệp vụ T14 chịu trách nhiệm cap 50/idempotency/state.
   * @param db Kết nối mượn đã migrate, không thuộc quyền đóng của repository.
   */
  constructor(private readonly db: DbReadContext) {
    this.byUser = db.prepare(`SELECT CAST(room_id AS TEXT) AS room_id,
      CAST(practice_attempt_id AS TEXT) AS practice_attempt_id FROM user_activity WHERE user_id = ?`);
    this.countAll = db.prepare('SELECT count(*) AS total FROM user_activity');
    this.insert = prepareWrite(db, 'INSERT INTO user_activity (user_id, room_id, practice_attempt_id) VALUES (?, ?, ?)');
    this.removeRoom = prepareWrite(db, 'DELETE FROM user_activity WHERE user_id = ? AND room_id = ?');
    this.removePractice = prepareWrite(db, 'DELETE FROM user_activity WHERE user_id = ? AND practice_attempt_id = ?');
  }

  /**
   * @brief Đọc resource đang giữ chỗ, không phụ thuộc trạng thái TCP.
   * @param userId Người dùng cần tra reservation.
   * @returns Ref của phòng/lượt luyện tập, hoặc null nếu không giữ chỗ.
   */
  find(userId: DbId): ActivityRef | null {
    const row = this.byUser.get(bindId(userId));
    if (row === undefined) return null;
    return row.room_id !== null
      ? { kind: 'ROOM', id: row.room_id as string }
      : { kind: 'PRACTICE', id: row.practice_attempt_id as string };
  }

  /**
   * @brief Đếm toàn bộ reservation; caller dùng cùng transaction với thao tác thêm.
   * @returns Tổng số người đang giữ chỗ, gồm cả người offline/nộp sớm trong phòng chưa kết thúc.
   */
  count(): number {
    return this.countAll.get()!.total as number;
  }

  /**
   * @brief Chèn reservation mới, PK chặn người dùng có hoạt động thứ hai; không thay thế hàng cũ.
   * @param userId Người dùng đã được helper nghiệp vụ kiểm điều kiện.
   * @param ref Resource đúng user/state; helper kiểm cap hoặc cùng ref trước khi gọi.
   */
  add(userId: DbId, ref: ActivityRef): void {
    requireTransaction(this.db);
    const resourceId = bindId(ref.id);
    this.insert.run(bindId(userId), ref.kind === 'ROOM' ? resourceId : null,
      ref.kind === 'PRACTICE' ? resourceId : null);
  }

  /**
   * @brief Xóa đúng user/kind/resource; không xóa nhầm activity mới.
   * @param userId Người dùng cần giải phóng chỗ.
   * @param ref Resource được nghiệp vụ cho phép release.
   * @returns true nếu xóa một hàng, false nếu không có đúng ref.
   */
  release(userId: DbId, ref: ActivityRef): boolean {
    requireTransaction(this.db);
    const statement = ref.kind === 'ROOM' ? this.removeRoom : this.removePractice;
    return statement.run(bindId(userId), bindId(ref.id)).changes === 1n;
  }
}
