import type { DatabaseSync, StatementSync } from 'node:sqlite';

export type DbId = string;
export type DbReadContext = DatabaseSync;
// T06 cung cấp with_transaction; repository chỉ mượn kết nối đang trong transaction.
export type Tx = DatabaseSync;
export type ActivityRef = { kind: 'ROOM' | 'PRACTICE'; id: DbId };
export type RoomState = 'WAITING' | 'RUNNING' | 'ENDED' | 'CANCELLED';
export type CancelReason = 'HOST_CANCEL' | 'WAIT_TIMEOUT';

export interface RoomConfig {
  topic_id: DbId | null;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  duration_seconds: number;
}

/**
 * @brief Chuyển ID chuẩn thập phân sang BigInt để bind SQL không mất int64.
 * @param id ID nội bộ hoặc ID đã qua schema validator.
 * @returns ID dương trong miền signed int64; ném RangeError nếu sai.
 */
export function bindId(id: DbId): bigint {
  if (!/^[1-9][0-9]{0,18}$/.test(id)) {
    throw new RangeError('Expected a canonical positive int64 ID');
  }
  const value = BigInt(id);
  if (value > 9223372036854775807n) {
    throw new RangeError('ID exceeds signed int64');
  }
  return value;
}

/**
 * @brief Kiểm tra tiền điều kiện ghi; caller vẫn sở hữu commit/rollback và lỗi DB.
 * @param db Kết nối mượn từ dispatcher/T06, không được repository đóng.
 */
export function requireTransaction(db: Tx): void {
  if (!db.isTransaction) {
    throw new Error('Repository mutation requires a caller-owned transaction');
  }
}

/**
 * @brief Prepare lệnh ghi với kết quả rowid BigInt, kể cả khi caller chỉ dùng changes.
 * @param db Kết nối dùng chung, phải sống lâu hơn statement.
 * @param sql SQL cố định do module cung cấp, không nhận SQL từ người dùng.
 * @returns Statement thuộc vòng đời kết nối; không tự thực thi transaction.
 */
export function prepareWrite(db: DbReadContext, sql: string): StatementSync {
  const statement = db.prepare(sql);
  statement.setReadBigInts(true);
  return statement;
}
