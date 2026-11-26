import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Tx } from './storage-types.js';

const SQLITE_BUSY = 5;
const failedConnections = new WeakSet<DatabaseSync>();
const migrations = [
  { version: 1, files: ['user-room-storage.sql', 'exam-storage.sql'] },
];
const latestSchemaVersion = migrations[migrations.length - 1].version;
const requiredColumns = {
  schema_migrations: 'version, applied_at',
  users: 'id, username_key, display_name, password_hash, auth_version, role, active, created_at',
  rooms: `id, owner_id, name, topic_id, easy_count, medium_count, hard_count, duration_seconds,
    capacity, config_version, state, created_at, waiting_expires_at, cancelled_at, cancel_reason,
    started_at, deadline_at, ended_at`,
  room_members: 'room_id, user_id, joined_at',
  user_activity: 'user_id, room_id, practice_attempt_id',
  topics: 'id, name, name_key, active, version, created_at, updated_at',
  questions: `id, topic_id, difficulty, prompt, option_a, option_b, option_c, option_d,
    correct_option, active, version, updated_by, updated_at`,
  attempts: `id, user_id, room_id, kind, state, topic_id, easy_count, medium_count, hard_count,
    duration_seconds, total_count, started_at, deadline_at, finalized_at, finalize_reason, correct_count`,
  attempt_items: `attempt_id, position, source_question_id, source_version, topic_id, topic_name_snapshot,
    difficulty, prompt_snapshot, option_a_snapshot, option_b_snapshot, option_c_snapshot,
    option_d_snapshot, correct_option_snapshot`,
  answers: 'attempt_id, position, selected_option, revision, saved_at',
  operations: 'user_id, operation_id, operation_type, resource_id, payload_fingerprint, receipt, committed_at',
};

export type TransactionError = {
  code: string;
  effect: 'NONE' | 'UNKNOWN';
  details?: Record<string, unknown>;
  retry_after_ms?: number;
};

type TransactionDiagnostic = {
  step: 'BEGIN' | 'WORK' | 'COMMIT' | 'ROLLBACK' | 'CLOSE';
  sqliteCode?: number;
};

type TransactionFailure = { ok: false; error: TransactionError; diagnostics?: TransactionDiagnostic[] };

export type TransactionResult<T> = { ok: true; value: T } | TransactionFailure;

/** @brief Lấy bước gặp lỗi và mã SQLite để chẩn đoán nội bộ, bỏ thông báo lỗi gốc. */
function diagnostic(step: TransactionDiagnostic['step'], error: unknown): TransactionDiagnostic {
  if (typeof error === 'object' && error !== null && 'errcode' in error && typeof error.errcode === 'number') {
    return { step, sqliteCode: error.errcode };
  }
  return { step };
}

/** @brief Ánh xạ lỗi khi đã xác định transaction không ghi dữ liệu. */
function databaseError(info?: TransactionDiagnostic): TransactionFailure {
  // Node có thể trả mã SQLite mở rộng. Byte thấp chứa mã chính.
  if (info?.sqliteCode !== undefined && (info.sqliteCode & 0xff) === SQLITE_BUSY) {
    return { ok: false, error: { code: 'BUSY', effect: 'NONE', retry_after_ms: 100 }, diagnostics: [info] };
  }
  const failure: TransactionFailure = { ok: false, error: { code: 'DATABASE_ERROR', effect: 'NONE' } };
  if (info) failure.diagnostics = [info];
  return failure;
}

/** @brief Trả lỗi ban đầu sau rollback, hoặc chặn kết nối nếu không xác nhận được rollback. */
function rollbackOrStop(db: DatabaseSync, failure: TransactionFailure): TransactionFailure {
  const diagnostics = [...(failure.diagnostics ?? [])];
  try {
    if (db.isOpen && db.isTransaction) {
      db.exec('ROLLBACK');
      return failure;
    }
  } catch (error) {
    diagnostics.push(diagnostic('ROLLBACK', error));
  }

  // Nếu COMMIT trả lỗi và transaction đã biến mất, kết quả ghi vẫn chưa rõ.
  if (diagnostics.length === 0) diagnostics.push({ step: 'ROLLBACK' });
  failedConnections.add(db);
  try {
    if (db.isOpen) db.close();
  } catch (error) {
    diagnostics.push(diagnostic('CLOSE', error));
  }
  return { ok: false, error: { code: 'OUTCOME_UNKNOWN', effect: 'UNKNOWN' }, diagnostics };
}

/**
 * @brief Thực thi một transaction đồng bộ, chỉ trả thành công sau COMMIT.
 * @param db Kết nối do dispatcher sở hữu, hoặc kết nối khởi tạo trước ready.
 * @param work Thao tác nhận Tx đã mở, không await hoặc tự điều khiển transaction.
 * @returns Kết quả nghiệp vụ sau commit, lỗi đã rollback, hoặc OUTCOME_UNKNOWN.
 * @note diagnostics dùng nội bộ. Chỉ trường error có thể đưa vào phản hồi client.
 */
export function withTransaction<T>(
  db: DatabaseSync,
  work: (tx: Tx) => TransactionResult<T>,
): TransactionResult<T> {
  if (failedConnections.has(db) || !db.isOpen || db.isTransaction) return databaseError();

  try {
    // Giành quyền ghi trước khi gọi nghiệp vụ để xử lý BUSY ngay ở đầu.
    db.exec('BEGIN IMMEDIATE');
  } catch (error) {
    return databaseError(diagnostic('BEGIN', error));
  }

  let result: TransactionResult<T>;
  try {
    result = work(db);
    if (typeof result?.ok !== 'boolean') throw new TypeError('Expected a synchronous transaction result');
  } catch (error) {
    return rollbackOrStop(db, databaseError(diagnostic('WORK', error)));
  }

  if (!result.ok) return rollbackOrStop(db, result);

  try {
    db.exec('COMMIT');
    return result;
  } catch (error) {
    return rollbackOrStop(db, databaseError(diagnostic('COMMIT', error)));
  }
}

/** @brief Đọc lịch sử migration và từ chối schema không nhận diện được. */
function readSchemaVersion(db: DatabaseSync): number {
  const objects = db.prepare("SELECT name, type FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'").all();
  if (objects.length === 0) return 0;
  if (!objects.some((object) => object.type === 'table' && object.name === 'schema_migrations')) {
    throw new Error('Refusing unversioned database with existing schema objects');
  }

  const history = db.prepare('SELECT version, applied_at FROM schema_migrations ORDER BY version');
  history.setReadBigInts(true);
  const rows = history.all();
  const latest = BigInt(latestSchemaVersion);
  if (rows.some((row) => typeof row.version === 'bigint' && row.version > latest)) {
    throw new Error('Database schema is newer than this application');
  }
  if (rows.length === 0 || rows.some((row, index) => !migrations[index] ||
      row.version !== BigInt(migrations[index].version) || typeof row.applied_at !== 'bigint' ||
      row.applied_at < 0n || row.applied_at > BigInt(Number.MAX_SAFE_INTEGER))) {
    throw new Error('Invalid schema migration history');
  }
  return migrations[rows.length - 1].version;
}

/** @brief Kiểm tra cấu hình thật của kết nối trước khi dùng SQLite. */
function configureDatabase(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL');
  if (db.prepare('PRAGMA foreign_keys').get()?.foreign_keys !== 1 ||
      db.prepare('PRAGMA journal_mode').get()?.journal_mode !== 'wal' ||
      db.prepare('PRAGMA synchronous').get()?.synchronous !== 2 ||
      db.prepare('PRAGMA busy_timeout').get()?.timeout !== 0) {
    throw new Error('SQLite did not apply WAL, FULL, foreign keys and busy timeout 0 ms');
  }
}

/** @brief Áp dụng từng migration và ghi version trong cùng transaction. */
function migrateDatabase(db: DatabaseSync, currentVersion: number): void {
  for (const migration of migrations.filter(({ version }) => version > currentVersion)) {
    const statements = migration.files.map((file) =>
      readFileSync(new URL(`../../../../db/migrations/${file}`, import.meta.url), 'utf8'));
    const result = withTransaction(db, (tx) => {
      if (migration.version === 1) {
        tx.exec(`CREATE TABLE schema_migrations (
          version INTEGER PRIMARY KEY CHECK (version > 0),
          applied_at INTEGER NOT NULL CHECK (applied_at BETWEEN 0 AND 9007199254740991)
        ) STRICT`);
      }
      for (const sql of statements) tx.exec(sql);
      if (tx.prepare('PRAGMA foreign_key_check').get() !== undefined) {
        throw new Error('Migration produced foreign key violations');
      }
      if (migration.version === latestSchemaVersion) checkReadiness(tx);
      tx.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(migration.version, Date.now());
      return { ok: true, value: undefined };
    });
    if (!result.ok) {
      throw new Error(`Migration ${migration.version} failed (${result.error.code})`, { cause: result.diagnostics });
    }
  }
}

/** @brief Kiểm bảng, cột bắt buộc và từ chối khởi động khi còn ca dở theo K07. */
function checkReadiness(db: DatabaseSync): void {
  const tables = new Set(db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all()
    .map((row) => row.name));
  for (const [table, columns] of Object.entries(requiredColumns)) {
    if (!tables.has(table)) throw new Error(`Incomplete database schema: missing ${table}`);
    // Cho SQLite kiểm tên cột khi prepare, không đọc các hàng dữ liệu.
    db.prepare(`SELECT ${columns} FROM main.${table} LIMIT 0`);
  }
  if (db.prepare("SELECT 1 FROM rooms WHERE state = 'RUNNING' LIMIT 1").get()) {
    throw new Error('K07: database still contains a RUNNING room');
  }
  if (db.prepare("SELECT 1 FROM attempts WHERE state = 'OPEN' LIMIT 1").get()) {
    throw new Error('K07: database still contains an OPEN attempt');
  }
}

/**
 * @brief Mở DB local và chỉ bàn giao kết nối sau migration, đọc lại cấu hình và kiểm K07.
 * @param databasePath Đường dẫn file đã resolve. Launcher giữ khóa bộ dữ liệu trước khi gọi.
 * @returns Kết nối duy nhất do dispatcher sở hữu và đóng khi kết thúc.
 */
export function openDatabase(databasePath: string): DatabaseSync {
  // Chặn file chỉ đọc trước khi SQLite tạo WAL/SHM với cùng quyền file.
  if (existsSync(databasePath)) accessSync(databasePath, constants.W_OK);
  const db = new DatabaseSync(databasePath, { timeout: 0 });
  try {
    const currentVersion = readSchemaVersion(db);
    configureDatabase(db);
    if (currentVersion === latestSchemaVersion) {
      checkReadiness(db);
      // Quyền file chính chưa bảo đảm SQLite ghi được qua WAL hiện có.
      // Thử ghi rồi rollback. Nếu lỗi, nhánh catch đóng DB.
      db.exec('BEGIN IMMEDIATE');
      db.prepare('UPDATE schema_migrations SET applied_at = applied_at WHERE version = ?').run(currentVersion);
      db.exec('ROLLBACK');
    } else {
      // Migration cuối kiểm readiness trước COMMIT để còn rollback khi schema lỗi.
      migrateDatabase(db, currentVersion);
    }
    return db;
  } catch (error) {
    // Giữ lỗi startup gốc nếu SQLite báo thêm lỗi lúc dọn kết nối.
    try {
      if (db.isOpen) db.close();
    } catch {
      // Launcher sẽ dừng tiến trình khi startup lỗi.
    }
    throw error;
  }
}
