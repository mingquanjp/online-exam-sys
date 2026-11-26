import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { openDatabase, withTransaction } from '../dist/storage/database.js';
import { UsersRepository } from '../dist/storage/users-repository.js';

/** @brief Tạo đường dẫn DB tạm riêng cho từng ca để kiểm WAL và mở lại file thật. */
function databasePath(t) {
  const directory = mkdtempSync(join(tmpdir(), 'exam-storage-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, 'exam.sqlite3');
}

/** @brief Tạo tài khoản qua repository SCRUM-10 trong transaction của runner. */
function createUser(db, username = 'tester') {
  const users = new UsersRepository(db);
  return users.create({ username_key: username, display_name: 'Test', password_hash: 'fixture',
    role: 'USER', created_at: 1 });
}

test('migrate DB trống một lần, giữ dữ liệu và đọc lại chính sách SQLite', (t) => {
  const path = databasePath(t);
  using db = openDatabase(path);
  assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  assert.equal(db.prepare('PRAGMA synchronous').get().synchronous, 2);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(db.prepare('PRAGMA busy_timeout').get().timeout, 0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(withTransaction(db, (tx) => ({ ok: true, value: createUser(tx) })),
    { ok: true, value: '1' });
  using reopened = openDatabase(path);
  assert.equal(reopened.prepare('SELECT count(*) AS count FROM schema_migrations').get().count, 1);
  assert.equal(new UsersRepository(reopened).findByUsername('tester').id, '1');
});

test('từ chối schema mới hơn và DB cũ không có lịch sử migration', (t) => {
  const path = databasePath(t);
  {
    using db = new DatabaseSync(path);
    db.exec('CREATE TABLE original (value TEXT); INSERT INTO original VALUES (\'keep\')');
    assert.throws(() => openDatabase(path), /unversioned/i);
    assert.equal(db.prepare('SELECT value FROM original').get().value, 'keep');
    db.exec('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER); INSERT INTO schema_migrations VALUES (2, 1)');
  }
  assert.throws(() => openDatabase(path), /newer/i);
});

test('từ chối DB đã ghi version 1 nếu thiếu cột bắt buộc', (t) => {
  const path = databasePath(t);
  {
    using db = openDatabase(path);
    db.exec('ALTER TABLE answers RENAME COLUMN selected_option TO old_option');
  }
  assert.throws(() => openDatabase(path), /no such column: selected_option/);
  using raw = new DatabaseSync(path);
  assert.equal(raw.prepare('SELECT version FROM schema_migrations').get().version, 1);
  assert.doesNotThrow(() => raw.prepare('SELECT old_option FROM answers LIMIT 0'));
});

test('từ chối DB WAL chỉ đọc trước khi bàn giao kết nối', {
  skip: (process.platform === 'win32' || process.getuid?.() === 0)
    && 'Ca này cần quyền file POSIX và tài khoản không phải root',
}, (t) => {
  const path = databasePath(t);
  let history;
  {
    using db = openDatabase(path);
    history = db.prepare('SELECT * FROM schema_migrations').all();
  }
  chmodSync(path, 0o444);
  try {
    assert.throws(() => {
      using db = openDatabase(path);
    }, { code: 'EACCES' });
    assert.equal(existsSync(`${path}-wal`), false);
    assert.equal(existsSync(`${path}-shm`), false);
  } finally {
    chmodSync(path, 0o600);
  }
  using reopened = openDatabase(path);
  assert.deepEqual(reopened.prepare('SELECT * FROM schema_migrations').all(), history);
});

test('lỗi SQL ở phần DDL thứ hai rollback cả bảng của phần đầu và lịch sử', (t) => {
  const path = databasePath(t);
  const exec = DatabaseSync.prototype.exec;
  const injectFailure = t.mock.method(DatabaseSync.prototype, 'exec', function (sql) {
    // Để SQLite tạo lỗi cú pháp thật sau khi runner đã áp dụng DDL SCRUM-10.
    if (sql.includes('CREATE TABLE topics (')) return exec.call(this, 'CREATE TABLE incomplete (');
    return exec.call(this, sql);
  });
  assert.throws(() => openDatabase(path), /Migration 1 failed/);
  injectFailure.mock.restore();
  {
    using raw = new DatabaseSync(path);
    assert.deepEqual(raw.prepare('SELECT name FROM sqlite_schema').all(), []);
  }
  using repaired = openDatabase(path);
  assert.equal(repaired.prepare('SELECT version FROM schema_migrations').get().version, 1);
});

test('schema thật giữ roster, snapshot, revision và khóa duy nhất của receipt', (t) => {
  using db = openDatabase(databasePath(t));
  const work = withTransaction(db, (tx) => {
    createUser(tx);
    createUser(tx, 'outsider');
    tx.exec(`INSERT INTO topics (id,name,name_key,created_at,updated_at) VALUES (1,'TCP','TCP',1,1);
      INSERT INTO questions (id,topic_id,difficulty,prompt,option_a,option_b,option_c,option_d,correct_option,updated_by,updated_at)
      VALUES (1,1,'EASY','Original','a','b','c','d','A',1,1);
      INSERT INTO rooms (id,owner_id,name,topic_id,easy_count,medium_count,hard_count,duration_seconds,created_at,waiting_expires_at)
      VALUES (1,1,'Room',1,1,0,0,60,1,1800001);
      INSERT INTO room_members VALUES (1,1,1)`);
    const createAttempt = tx.prepare(`INSERT INTO attempts
      (id,user_id,room_id,kind,easy_count,medium_count,hard_count,duration_seconds,total_count,started_at,deadline_at)
      VALUES (?, ?, 1, 'EXAM', 1, 0, 0, 60, 1, 1, 60001)`);
    assert.throws(() => createAttempt.run(1, 2), /FOREIGN KEY/);
    createAttempt.run(1, 1);
    assert.throws(() => createAttempt.run(2, 1), /UNIQUE/);

    const createItem = tx.prepare(`INSERT INTO attempt_items VALUES
      (1,?,1,1,1,'TCP','EASY','Original','a','b','c','d','A')`);
    createItem.run(1);
    assert.throws(() => createItem.run(2), /UNIQUE/);
    assert.throws(() => tx.exec("INSERT INTO answers VALUES (1,2,'A',1,1)"), /FOREIGN KEY/);
    assert.throws(() => tx.exec("INSERT INTO answers VALUES (1,1,'A',0,1)"), /CHECK/);
    tx.exec("INSERT INTO answers VALUES (1,1,'A',1,1); UPDATE questions SET prompt='Edited', version=2");
    assert.equal(tx.prepare('SELECT prompt_snapshot FROM attempt_items').get().prompt_snapshot, 'Original');

    const record = tx.prepare('INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?)');
    const operation = ['a'.repeat(32), 'answer.save', 1, 'b'.repeat(64), '{"revision":1}', 1];
    record.run(1, ...operation);
    assert.throws(() => record.run(1, ...operation), /UNIQUE/);
    record.run(2, ...operation);
    return { ok: true, value: null };
  });
  assert.equal(work.ok, true);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('K07 dừng startup khi còn bài OPEN hoặc phòng RUNNING và giữ nguyên dữ liệu', (t) => {
  const path = databasePath(t);
  using db = openDatabase(path);
  assert.equal(withTransaction(db, (tx) => {
    createUser(tx);
    tx.exec(`INSERT INTO attempts (id,user_id,kind,easy_count,medium_count,hard_count,duration_seconds,started_at,deadline_at,total_count)
      VALUES (1,1,'PRACTICE',1,0,0,60,1,60001,1)`);
    return { ok: true, value: null };
  }).ok, true);
  assert.throws(() => openDatabase(path), /OPEN/);
  assert.equal(db.prepare('SELECT state FROM attempts').get().state, 'OPEN');
  db.exec(`UPDATE attempts SET state='FINALIZED', finalized_at=2, finalize_reason='EARLY_SUBMIT', correct_count=0;
    INSERT INTO rooms (id,owner_id,name,easy_count,medium_count,hard_count,duration_seconds,created_at,waiting_expires_at)
    VALUES (1,1,'Room',1,0,0,60,0,1800000)`);
  {
    using reopened = openDatabase(path);
    assert.equal(reopened.prepare('SELECT state FROM rooms').get().state, 'WAITING');
  }
  db.exec("UPDATE rooms SET state='RUNNING', started_at=1, deadline_at=60001");
  assert.throws(() => openDatabase(path), /RUNNING/);
  assert.equal(db.prepare('SELECT state FROM rooms').get().state, 'RUNNING');
});

test('rollback khi hàm nghiệp vụ trả lỗi, throw hoặc COMMIT bị FK từ chối', (t) => {
  using db = openDatabase(databasePath(t));
  const rejected = { ok: false, error: { code: 'FORBIDDEN', effect: 'NONE' } };
  assert.equal(withTransaction(db, (tx) => { createUser(tx); return rejected; }), rejected);
  assert.deepEqual(withTransaction(db, (tx) => { createUser(tx); throw Error('fixture'); }),
    { ok: false, error: { code: 'DATABASE_ERROR', effect: 'NONE' }, diagnostics: [{ step: 'WORK' }] });
  const failedCommit = withTransaction(db, (tx) => {
    createUser(tx);
    tx.exec('PRAGMA defer_foreign_keys = ON; INSERT INTO room_members VALUES (99,1,1)');
    return { ok: true, value: null };
  });
  assert.deepEqual(failedCommit, { ok: false, error: { code: 'DATABASE_ERROR', effect: 'NONE' },
    diagnostics: [{ step: 'COMMIT', sqliteCode: 787 }] });
  assert.equal(db.isTransaction, false);
  assert.equal(db.prepare('SELECT count(*) AS count FROM users').get().count, 0);
});

test('writer khác giữ khóa thì trả BUSY trước khi gọi hàm nghiệp vụ', (t) => {
  const path = databasePath(t);
  using db = openDatabase(path);
  using writer = new DatabaseSync(path);
  writer.exec('BEGIN IMMEDIATE');
  let called = false;
  assert.deepEqual(withTransaction(db, () => { called = true; return { ok: true, value: null }; }),
    { ok: false, error: { code: 'BUSY', effect: 'NONE', retry_after_ms: 100 },
      diagnostics: [{ step: 'BEGIN', sqliteCode: 5 }] });
  assert.equal(called, false);
});

test('COMMIT mất kết quả thì ngừng dùng kết nối và đọc lại sau khi mở DB', (t) => {
  const path = databasePath(t);
  using db = openDatabase(path);
  const exec = db.exec.bind(db);
  db.exec = (sql) => {
    exec(sql);
    // Chỉ giả lập lỗi trả về sau COMMIT. Việc ghi và đọc lại dùng SQLite thật.
    if (sql === 'COMMIT') throw Object.assign(Error('lost commit result'), { errcode: 10 });
  };
  assert.deepEqual(withTransaction(db, (tx) => ({ ok: true, value: createUser(tx) })),
    { ok: false, error: { code: 'OUTCOME_UNKNOWN', effect: 'UNKNOWN' },
      diagnostics: [{ step: 'COMMIT', sqliteCode: 10 }] });
  assert.equal(db.isOpen, false);
  assert.equal(withTransaction(db, () => assert.fail('connection already stopped')).ok, false);
  using reopened = openDatabase(path);
  assert.equal(new UsersRepository(reopened).findByUsername('tester').id, '1');
});

test('giữ cả mã lỗi COMMIT và ROLLBACK khi không thể xác nhận kết quả', (t) => {
  const path = databasePath(t);
  using db = openDatabase(path);
  const exec = db.exec.bind(db);
  db.exec = (sql) => {
    // COMMIT lỗi FK thật. Chỉ giả lập lỗi dọn để kiểm việc đóng kết nối.
    if (sql === 'ROLLBACK') throw Object.assign(Error('rollback failed'), { errcode: 10 });
    exec(sql);
  };
  assert.deepEqual(withTransaction(db, (tx) => {
    createUser(tx);
    tx.exec('PRAGMA defer_foreign_keys = ON; INSERT INTO room_members VALUES (99,1,1)');
    return { ok: true, value: null };
  }), {
    ok: false, error: { code: 'OUTCOME_UNKNOWN', effect: 'UNKNOWN' },
    diagnostics: [{ step: 'COMMIT', sqliteCode: 787 }, { step: 'ROLLBACK', sqliteCode: 10 }],
  });
  assert.equal(db.isOpen, false);
  using reopened = openDatabase(path);
  assert.equal(new UsersRepository(reopened).findByUsername('tester'), null);
});

test('từ chối transaction lồng mà vẫn giữ quyền commit của hàm ngoài', (t) => {
  using db = openDatabase(databasePath(t));
  const result = withTransaction(db, (tx) => {
    assert.equal(withTransaction(tx, () => assert.fail('nested callback must not run')).ok, false);
    assert.equal(tx.isTransaction, true);
    return { ok: true, value: createUser(tx) };
  });
  assert.deepEqual(result, { ok: true, value: '1' });
});
