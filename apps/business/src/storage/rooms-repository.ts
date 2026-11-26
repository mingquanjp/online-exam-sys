import {
  bindId, prepareWrite, requireTransaction, type CancelReason, type DbId,
  type DbReadContext, type RoomConfig, type RoomState,
} from './storage-types.js';

export interface RoomRow extends RoomConfig {
  id: DbId;
  owner_id: DbId;
  name: string;
  capacity: number;
  config_version: number;
  state: RoomState;
  created_at: number;
  waiting_expires_at: number;
  cancelled_at: number | null;
  cancel_reason: CancelReason | null;
  started_at: number | null;
  deadline_at: number | null;
  ended_at: number | null;
}

export interface NewRoom extends RoomConfig {
  owner_id: DbId;
  name: string;
  created_at: number;
}

export interface RoomPage {
  items: RoomRow[];
  has_more: boolean;
}

export class RoomsRepository {
  private readonly insert;
  private readonly byId;
  private readonly listPage;
  private readonly configureWaiting;
  private readonly startWaiting;
  private readonly cancelWaiting;
  private readonly endRunning;

  /**
   * @brief Prepare query cố định; quyền, availability và thời gian do domain kiểm trong cùng transaction.
   * @param db Kết nối mượn đã migrate; repository không đóng hoặc commit kết nối.
   */
  constructor(private readonly db: DbReadContext) {
    // Hạn chờ cố định 30 phút theo C02/V03, không reset khi configure/join.
    this.insert = prepareWrite(db, `INSERT INTO rooms
      (owner_id, name, topic_id, easy_count, medium_count, hard_count, duration_seconds, created_at, waiting_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? + 1800000)`);
    const columns = `CAST(id AS TEXT) AS id, CAST(owner_id AS TEXT) AS owner_id,
      name, CAST(topic_id AS TEXT) AS topic_id, easy_count, medium_count, hard_count,
      duration_seconds, capacity, config_version, state, created_at, waiting_expires_at,
      cancelled_at, cancel_reason, started_at, deadline_at, ended_at`;
    this.byId = db.prepare(`SELECT ${columns} FROM rooms WHERE id = ?`);
    this.listPage = db.prepare(`SELECT ${columns} FROM rooms
      WHERE (? IS NULL OR id < ?) AND (? IS NULL OR state = ?) ORDER BY id DESC LIMIT ?`);
    this.configureWaiting = prepareWrite(db, `UPDATE rooms SET name = ?, topic_id = ?,
      easy_count = ?, medium_count = ?, hard_count = ?, duration_seconds = ?, config_version = config_version + 1
      WHERE id = ? AND state = 'WAITING' AND config_version = ?`);
    this.startWaiting = prepareWrite(db, `UPDATE rooms SET state = 'RUNNING', started_at = ?, deadline_at = ?
      WHERE id = ? AND state = 'WAITING' AND config_version = ?`);
    this.cancelWaiting = prepareWrite(db, `UPDATE rooms SET state = 'CANCELLED', cancelled_at = ?, cancel_reason = ?
      WHERE id = ? AND state = 'WAITING'`);
    this.endRunning = prepareWrite(db, `UPDATE rooms SET state = 'ENDED', ended_at = ?
      WHERE id = ? AND state = 'RUNNING'`);
  }

  /**
   * @brief Chèn WAITING; caller phải thêm membership chủ và activity trước khi commit.
   * @param room Config đã validate, owner đã xác thực và thời điểm tạo do server cấp.
   * @returns ID phòng mới; lỗi constraint/DB ném về caller.
   */
  create(room: NewRoom): DbId {
    requireTransaction(this.db);
    return this.insert.run(bindId(room.owner_id), room.name,
      room.topic_id === null ? null : bindId(room.topic_id), room.easy_count,
      room.medium_count, room.hard_count, room.duration_seconds,
      room.created_at, room.created_at).lastInsertRowid.toString();
  }

  /**
   * @brief Đọc phòng, các ID trả dạng chuỗi.
   * @param id ID phòng chuẩn thập phân.
   * @returns Hàng phòng hoặc null nếu không tồn tại.
   */
  findById(id: DbId): RoomRow | null {
    return (this.byId.get(bindId(id)) as unknown as RoomRow | undefined) ?? null;
  }

  /**
   * @brief Trang ID giảm dần theo 03 §5; đọc dư một hàng để xác định has_more.
   * @param afterId ID cuối trang trước, null là trang đầu.
   * @param limit Số hàng yêu cầu trong miền 1..20.
   * @param state Bộ lọc đã validate, null là mọi trạng thái.
   * @returns Hàng nội bộ và has_more; domain dựng DTO/cursor theo byte budget.
   */
  list(afterId: DbId | null, limit: number, state: RoomState | null = null): RoomPage {
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      throw new RangeError('Room page limit must be 1..20');
    }
    const cursor = afterId === null ? null : bindId(afterId);
    const rows = this.listPage.all(cursor, cursor, state, state, limit + 1) as unknown as RoomRow[];
    return { items: rows.slice(0, limit), has_more: rows.length > limit };
  }

  /**
   * @brief Thay toàn config WAITING nếu version đúng; không tự commit.
   * @param id Phòng domain đã kiểm quyền chủ và hạn chờ.
   * @param expectedVersion Version caller kỳ vọng.
   * @param name Tên phòng đã validate.
   * @param config Config đã validate và kiểm đủ nguồn câu hỏi.
   * @returns true nếu sửa một hàng; false để caller phân loại state/version/không tồn tại.
   */
  configure(id: DbId, expectedVersion: number, name: string, config: RoomConfig): boolean {
    requireTransaction(this.db);
    return this.configureWaiting.run(name, config.topic_id === null ? null : bindId(config.topic_id),
      config.easy_count, config.medium_count, config.hard_count, config.duration_seconds,
      bindId(id), expectedVersion).changes === 1n;
  }

  /**
   * @brief Ghi RUNNING sau khi caller tạo đủ snapshot; không tự gán bài hoặc xét deadline monotonic.
   * @param id Phòng domain đã kiểm quyền và hạn chờ.
   * @param expectedVersion Version config caller đã dùng để tạo đề.
   * @param startedAt Thời điểm bắt đầu Unix ms do server cấp.
   * @param deadlineAt Hạn chung bằng startedAt + duration_seconds * 1000.
   * @returns true nếu chuyển một hàng; false nếu không còn đúng state/version.
   */
  start(id: DbId, expectedVersion: number, startedAt: number, deadlineAt: number): boolean {
    requireTransaction(this.db);
    return this.startWaiting.run(startedAt, deadlineAt, bindId(id), expectedVersion).changes === 1n;
  }

  /**
   * @brief Chỉ chuyển WAITING sang CANCELLED; caller release activity đúng phòng trong cùng transaction.
   * @param id Phòng đã được domain kiểm quyền hoặc timer kiểm trạng thái.
   * @param cancelledAt Thời điểm hủy Unix ms.
   * @param reason Lý do chủ hủy hoặc hết hạn chờ.
   * @returns true nếu chuyển một hàng; false nếu không còn WAITING/không tồn tại.
   */
  cancel(id: DbId, cancelledAt: number, reason: CancelReason): boolean {
    requireTransaction(this.db);
    return this.cancelWaiting.run(cancelledAt, reason, bindId(id)).changes === 1n;
  }

  /**
   * @brief Chỉ chuyển RUNNING sang ENDED; caller chốt bài/release activity trước commit.
   * @param id Phòng được domain/timer cho phép kết thúc.
   * @param endedAt Thời điểm kết thúc Unix ms.
   * @returns true nếu chuyển một hàng; false nếu không còn RUNNING/không tồn tại.
   */
  end(id: DbId, endedAt: number): boolean {
    requireTransaction(this.db);
    return this.endRunning.run(endedAt, bindId(id)).changes === 1n;
  }
}
