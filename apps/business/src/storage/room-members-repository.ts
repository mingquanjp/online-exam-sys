import { bindId, prepareWrite, requireTransaction, type DbId, type DbReadContext } from './storage-types.js';

export interface MemberRow {
  room_id: DbId;
  user_id: DbId;
  joined_at: number;
}

export class RoomMembersRepository {
  private readonly insert;
  private readonly byPair;
  private readonly byRoom;
  private readonly countMembers;
  private readonly removePair;

  /**
   * @brief Prepare query membership trên DB dùng chung; không giữ presence online trong SQLite.
   * @param db Kết nối mượn đã migrate, không thuộc quyền đóng của repository.
   */
  constructor(private readonly db: DbReadContext) {
    this.insert = prepareWrite(db, 'INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)');
    const columns = 'CAST(room_id AS TEXT) AS room_id, CAST(user_id AS TEXT) AS user_id, joined_at';
    this.byPair = db.prepare(`SELECT ${columns} FROM room_members WHERE room_id = ? AND user_id = ?`);
    this.byRoom = db.prepare(`SELECT ${columns} FROM room_members WHERE room_id = ? ORDER BY room_members.user_id`);
    this.countMembers = db.prepare('SELECT count(*) AS total FROM room_members WHERE room_id = ?');
    this.removePair = prepareWrite(db, 'DELETE FROM room_members WHERE room_id = ? AND user_id = ?');
  }

  /**
   * @brief Thêm một thành viên; caller kiểm quyền/state/capacity và reserve cùng transaction.
   * @param roomId Phòng WAITING đã được domain kiểm điều kiện.
   * @param userId Người dùng đã xác thực, gồm chủ khi tạo phòng.
   * @param joinedAt Thời điểm tham gia Unix ms.
   */
  add(roomId: DbId, userId: DbId, joinedAt: number): void {
    requireTransaction(this.db);
    this.insert.run(bindId(roomId), bindId(userId), joinedAt);
  }

  /**
   * @brief Tra đúng cặp phòng/người dùng.
   * @param roomId Phòng cần tra.
   * @param userId Người dùng cần tra.
   * @returns Membership hoặc null nếu chưa tham gia.
   */
  find(roomId: DbId, userId: DbId): MemberRow | null {
    return (this.byPair.get(bindId(roomId), bindId(userId)) as unknown as MemberRow | undefined) ?? null;
  }

  /**
   * @brief Đọc roster bền của phòng, gồm cả thành viên mất kết nối.
   * @param roomId Phòng cần đọc roster.
   * @returns Danh sách thành viên tăng theo user_id.
   */
  list(roomId: DbId): MemberRow[] {
    return this.byRoom.all(bindId(roomId)) as unknown as MemberRow[];
  }

  /**
   * @brief Đếm membership để caller kiểm capacity trong transaction.
   * @param roomId Phòng cần đếm.
   * @returns Số thành viên, 0 nếu chưa có hàng.
   */
  count(roomId: DbId): number {
    return this.countMembers.get(bindId(roomId))!.total as number;
  }

  /**
   * @brief Xóa đúng cặp khi người thường rời WAITING; không gọi khi disconnect/kết thúc/hủy phòng.
   * @param roomId Phòng đã được domain kiểm trạng thái.
   * @param userId Thành viên thường đã được domain kiểm quyền rời.
   * @returns true nếu xóa một hàng, false nếu không có đúng cặp.
   */
  remove(roomId: DbId, userId: DbId): boolean {
    requireTransaction(this.db);
    return this.removePair.run(bindId(roomId), bindId(userId)).changes === 1n;
  }
}
