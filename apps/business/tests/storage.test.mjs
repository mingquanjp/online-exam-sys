import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { UsersRepository } from '../dist/storage/users-repository.js';
import { RoomsRepository } from '../dist/storage/rooms-repository.js';
import { RoomMembersRepository } from '../dist/storage/room-members-repository.js';
import { UserActivityRepository } from '../dist/storage/user-activity-repository.js';
import { bindId } from '../dist/storage/storage-types.js';

const migration = readFileSync(new URL('../../../db/migrations/user-room-storage.sql', import.meta.url), 'utf8');
const config = { topic_id: null, easy_count: 4, medium_count: 5, hard_count: 3, duration_seconds: 900 };
const now = 1800000000000;

/** @brief Tạo SQLite thật trong bộ nhớ để kiểm DDL/query, không thay runner T06. */
function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('BEGIN');
  // Chạy DDL Minh Quân trước để kiểm FK có thể trỏ tới bảng cha được ghép sau.
  db.exec(migration);
  // Chỉ cung cấp khóa cha cho FK; không nhận đây là schema bank/attempts thật của T06.
  db.exec(`CREATE TABLE topics (id INTEGER PRIMARY KEY) STRICT;
    CREATE TABLE attempts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id)) STRICT;`);
  db.exec('COMMIT');
  return {
    db, users: new UsersRepository(db), rooms: new RoomsRepository(db),
    members: new RoomMembersRepository(db), activity: new UserActivityRepository(db),
  };
}

/** @brief Gom thao tác trong test; không mô phỏng policy lỗi commit/IO của T06. */
function transaction(db, work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/** @brief Tạo tài khoản thử bằng hash giả, chỉ gọi trong transaction fixture. */
function createUser(f, username = 'host_01') {
  return f.users.create({ username_key: username, display_name: 'Người dùng thử',
    password_hash: 'fixture-encoded-hash-not-a-real-password', role: 'USER', created_at: now });
}

/** @brief Tạo phòng thử theo config cố định; test tự nối membership/activity khi cần. */
function createRoom(f, ownerId) {
  return f.rooms.create({ ...config, owner_id: ownerId, name: 'Thi TCP/UDP', created_at: now });
}

test('DDL có NOT NULL/STRICT/FK/unique/check/index và mặc định tài khoản', (t) => {
  const f = fixture(t);
  const id = transaction(f.db, () => createUser(f));
  assert.deepEqual({ ...f.users.findById(id) }, {
    id, username_key: 'host_01', display_name: 'Người dùng thử',
    password_hash: 'fixture-encoded-hash-not-a-real-password', auth_version: 1,
    role: 'USER', active: 1, created_at: now,
  });
  assert.equal(f.users.findByUsername('host_01').id, id);
  assert.equal(f.users.findById('999'), null);
  assert.throws(() => transaction(f.db, () => createUser(f)), /UNIQUE/);
  assert.throws(() => f.db.exec("UPDATE users SET display_name = NULL"), /NOT NULL/);
  for (const assignment of ["role = 'ROOT'", 'active = 2', 'auth_version = 0',
    'auth_version = 2147483648', "username_key = 'Upper'", "username_key = 'bad-name'",
    "display_name = ''", "display_name = '" + 'é'.repeat(51) + "'", "password_hash = ''",
    'created_at = -1', 'created_at = 9007199254740992']) {
    assert.throws(() => f.db.exec(`UPDATE users SET ${assignment}`), /CHECK/, assignment);
  }
  assert.throws(() => f.db.exec("UPDATE users SET auth_version = 'not-an-integer'"), /INTEGER/);
  const indexes = f.db.prepare("SELECT name FROM sqlite_schema WHERE type = 'index'").all().map(r => r.name);
  assert.ok(indexes.includes('rooms_state_idx'));
  assert.ok(indexes.includes('room_members_user_idx'));
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('Tạo phòng + membership chủ + activity commit và rollback cùng nhau', (t) => {
  const f = fixture(t);
  const ownerId = transaction(f.db, () => createUser(f));
  const roomId = transaction(f.db, () => {
    const id = createRoom(f, ownerId);
    f.members.add(id, ownerId, now);
    f.activity.add(ownerId, { kind: 'ROOM', id });
    return id;
  });
  const room = f.rooms.findById(roomId);
  assert.equal(room.state, 'WAITING');
  assert.equal(room.config_version, 1);
  assert.equal(room.capacity, 50);
  assert.equal(room.waiting_expires_at, now + 1800000);
  assert.equal(f.members.find(roomId, ownerId).user_id, ownerId);
  assert.equal(f.members.count(roomId), 1);
  assert.equal(f.activity.count(), 1);
  assert.deepEqual(f.activity.find(ownerId), { kind: 'ROOM', id: roomId });
  assert.throws(() => transaction(f.db, () => {
    const id = createRoom(f, ownerId);
    f.members.add(id, ownerId, now);
    // PK user_activity từ chối hoạt động thứ hai; room/member vừa tạo phải rollback.
    f.activity.add(ownerId, { kind: 'ROOM', id });
  }), /UNIQUE/);
  assert.equal(f.rooms.list(null, 20).items.length, 1);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM room_members').get().n, 1);
  assert.equal(f.db.isTransaction, false);
});

test('FK sai và membership trùng bị chặn; không CASCADE xóa lịch sử', (t) => {
  const f = fixture(t);
  transaction(f.db, () => {
    const owner = createUser(f);
    const room = createRoom(f, owner);
    f.members.add(room, owner, now);
    assert.throws(() => f.members.add(room, owner, now), /UNIQUE/);
    assert.throws(() => f.members.add(room, '999', now), /FOREIGN KEY/);
    assert.throws(() => f.members.add('999', owner, now), /FOREIGN KEY/);
    assert.throws(() => createRoom(f, '999'), /FOREIGN KEY/);
    assert.throws(() => f.rooms.create({ ...config, topic_id: '999', owner_id: owner, name: 'Topic thiếu', created_at: now }), /FOREIGN KEY/);
    assert.throws(() => f.activity.add('999', { kind: 'ROOM', id: room }), /FOREIGN KEY/);
    assert.throws(() => f.activity.add(owner, { kind: 'ROOM', id: '999' }), /FOREIGN KEY/);
    assert.throws(() => f.activity.add(owner, { kind: 'PRACTICE', id: '999' }), /FOREIGN KEY/);
    assert.throws(() => f.db.prepare('DELETE FROM users WHERE id = ?').run(bindId(owner)), /FOREIGN KEY/);
    assert.throws(() => f.db.prepare('DELETE FROM rooms WHERE id = ?').run(bindId(room)), /FOREIGN KEY/);
  });
});

test('Activity XOR và PK chặn hai hoạt động; release đúng user/kind/resource', (t) => {
  const f = fixture(t);
  transaction(f.db, () => {
    const owner = createUser(f);
    const other = createUser(f, 'other_01');
    const room = createRoom(f, owner);
    const secondRoom = createRoom(f, other);
    f.db.prepare('INSERT INTO attempts (id, user_id) VALUES (?, ?)').run(1n, bindId(owner));
    assert.throws(() => f.db.prepare('INSERT INTO user_activity (user_id) VALUES (?)').run(bindId(owner)), /CHECK/);
    assert.throws(() => f.db.prepare('INSERT INTO user_activity VALUES (?, ?, ?)').run(bindId(owner), bindId(room), 1n), /CHECK/);
    f.activity.add(owner, { kind: 'ROOM', id: room });
    f.activity.add(other, { kind: 'ROOM', id: secondRoom });
    assert.throws(() => f.activity.add(owner, { kind: 'PRACTICE', id: '1' }), /UNIQUE/);
    assert.equal(f.activity.release(owner, { kind: 'ROOM', id: secondRoom }), false);
    assert.equal(f.activity.release(owner, { kind: 'PRACTICE', id: room }), false);
    assert.equal(f.activity.release(other, { kind: 'ROOM', id: room }), false);
    assert.equal(f.activity.count(), 2);
    assert.equal(f.activity.release(owner, { kind: 'ROOM', id: room }), true);
    assert.equal(f.activity.release(owner, { kind: 'ROOM', id: room }), false);
    f.activity.add(owner, { kind: 'PRACTICE', id: '1' });
    assert.deepEqual(f.activity.find(owner), { kind: 'PRACTICE', id: '1' });
    assert.equal(f.activity.release(owner, { kind: 'PRACTICE', id: '1' }), true);
    assert.equal(f.activity.find(owner), null);
    assert.equal(f.activity.count(), 1);
  });
});

test('Cấu hình/thời gian/trạng thái sai bị CHECK chặn, kể cả NULL', (t) => {
  const f = fixture(t);
  transaction(f.db, () => {
    const owner = createUser(f);
    createRoom(f, owner);
    for (const assignment of ['easy_count = -1', 'medium_count = 101', 'hard_count = -1',
      'easy_count = 0, medium_count = 0, hard_count = 0',
      'easy_count = 100, medium_count = 1', 'duration_seconds = 59', 'duration_seconds = 7201',
      'capacity = 51', 'config_version = 0', 'config_version = 2147483648',
      'waiting_expires_at = created_at + 1800001', "state = 'UNKNOWN'", "name = ''",
      "state = 'RUNNING'", "state = 'ENDED'", "state = 'CANCELLED'",
      "state = 'CANCELLED', cancelled_at = created_at, cancel_reason = 'WRONG'",
      'started_at = created_at', 'ended_at = created_at',
      "state = 'RUNNING', started_at = created_at, deadline_at = created_at + 1"]) {
      assert.throws(() => f.db.exec(`UPDATE rooms SET ${assignment}`), /CHECK/, assignment);
    }
    assert.equal(f.rooms.list(null, 20).items[0].state, 'WAITING');
  });
});

test('Configure/start dùng version, transition sai không ghi; phân trang có thứ tự', (t) => {
  const f = fixture(t);
  transaction(f.db, () => {
    const owner = createUser(f);
    const first = createRoom(f, owner);
    const second = createRoom(f, owner);
    f.db.exec('INSERT INTO topics (id) VALUES (1)');
    assert.equal(f.rooms.configure(first, 1, 'Thi mới', { ...config, topic_id: '1' }), true);
    assert.equal(f.rooms.findById(first).config_version, 2);
    assert.equal(f.rooms.findById(first).topic_id, '1');
    assert.equal(f.rooms.findById(first).waiting_expires_at, now + 1800000);
    assert.equal(f.rooms.configure(first, 1, 'Version cũ', config), false);
    assert.equal(f.rooms.start(first, 1, now + 1000, now + 901000), false);
    assert.equal(f.rooms.start(first, 2, now + 1000, now + 901000), true);
    assert.equal(f.rooms.cancel(first, now + 2000, 'HOST_CANCEL'), false);
    assert.equal(f.rooms.configure(first, 2, 'Đã thi', config), false);
    assert.equal(f.rooms.end(first, now + 5000), true);
    assert.equal(f.rooms.end(first, now + 6000), false);
    assert.equal(f.rooms.start(first, 2, now + 7000, now + 907000), false);
    assert.equal(f.rooms.findById(first).ended_at, now + 5000);
    assert.equal(f.rooms.cancel(second, now + 3000, 'WAIT_TIMEOUT'), true);
    assert.equal(f.rooms.start(second, 1, now + 4000, now + 904000), false);
    assert.equal(f.rooms.cancel(second, now + 4000, 'HOST_CANCEL'), false);
    assert.equal(f.rooms.findById(second).started_at, null);
    assert.deepEqual(f.rooms.list(null, 1).items.map(r => r.id), [second]);
    assert.equal(f.rooms.list(null, 1).has_more, true);
    assert.deepEqual(f.rooms.list(second, 1).items.map(r => r.id), [first]);
    assert.equal(f.rooms.list(second, 1).has_more, false);
    assert.deepEqual(f.rooms.list(first, 20).items, []);
    assert.deepEqual(f.rooms.list(null, 20, 'ENDED').items.map(r => r.id), [first]);
    assert.deepEqual(f.rooms.list(null, 20, 'WAITING').items, []);
    assert.equal(f.rooms.findById('999'), null);
    assert.throws(() => f.rooms.list(null, 21), /limit/);
  });
});

test('UTC lùi không chặn start/cancel/end; timestamp vẫn phải trong miền an toàn', (t) => {
  const f = fixture(t);
  const { cancelledRoom, runningRoom } = transaction(f.db, () => {
    const owner = createUser(f);
    return { cancelledRoom: createRoom(f, owner), runningRoom: createRoom(f, owner) };
  });
  // Chỉ giả lập UTC đầu vào. Domain xét hạn bằng monotonic ở consumer, không ở repository.
  const startedAt = now - 1000;
  const endedAt = now - 2000;
  transaction(f.db, () => {
    for (const invalid of [-1, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => f.rooms.cancel(cancelledRoom, invalid, 'HOST_CANCEL'), /CHECK/);
      assert.throws(() => f.rooms.start(runningRoom, 1, invalid, invalid + 900000), /CHECK/);
    }
    assert.equal(f.rooms.cancel(cancelledRoom, startedAt, 'HOST_CANCEL'), true);
    assert.equal(f.rooms.start(runningRoom, 1, startedAt, startedAt + 900000), true);
    for (const invalid of [-1, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => f.rooms.end(runningRoom, invalid), /CHECK/);
    }
    assert.equal(f.rooms.end(runningRoom, endedAt), true);
  });
  const cancelled = f.rooms.findById(cancelledRoom);
  assert.equal(cancelled.state, 'CANCELLED');
  assert.equal(cancelled.cancelled_at, startedAt);
  assert.equal(cancelled.started_at, null);
  const ended = f.rooms.findById(runningRoom);
  assert.equal(ended.state, 'ENDED');
  assert.equal(ended.started_at, startedAt);
  assert.equal(ended.deadline_at, startedAt + 900000);
  assert.equal(ended.ended_at, endedAt);
  assert.equal(ended.waiting_expires_at, now + 1800000);
});

test('Hủy phòng release cùng transaction, giữ roster; rollback không báo hủy giả', (t) => {
  const f = fixture(t);
  let room;
  let owner;
  transaction(f.db, () => {
    owner = createUser(f);
    room = createRoom(f, owner);
    f.members.add(room, owner, now);
    f.activity.add(owner, { kind: 'ROOM', id: room });
  });
  assert.throws(() => transaction(f.db, () => {
    f.rooms.cancel(room, now + 1000, 'HOST_CANCEL');
    f.activity.release(owner, { kind: 'ROOM', id: room });
    throw new Error('fixture fault after release');
  }), /fixture fault/);
  assert.equal(f.rooms.findById(room).state, 'WAITING');
  assert.equal(f.activity.count(), 1);
  transaction(f.db, () => {
    assert.equal(f.rooms.cancel(room, now + 2000, 'HOST_CANCEL'), true);
    for (const member of f.members.list(room)) {
      f.activity.release(member.user_id, { kind: 'ROOM', id: room });
    }
  });
  assert.equal(f.rooms.findById(room).state, 'CANCELLED');
  assert.equal(f.activity.count(), 0);
  assert.equal(f.members.count(room), 1);
  // Không gọi remove khi mất TCP: roster/activity bền chỉ đổi bởi nghiệp vụ.
  assert.equal(f.members.list(room)[0].user_id, owner);
});

test('Rời phòng xóa đúng membership và release cùng transaction', (t) => {
  const f = fixture(t);
  transaction(f.db, () => {
    const owner = createUser(f);
    const student = createUser(f, 'student_01');
    const room = createRoom(f, owner);
    f.members.add(room, owner, now);
    f.members.add(room, student, now);
    f.activity.add(student, { kind: 'ROOM', id: room });
    assert.equal(f.members.remove('999', student), false);
    assert.equal(f.members.remove(room, '999'), false);
    assert.equal(f.members.remove(room, student), true);
    assert.equal(f.activity.release(student, { kind: 'ROOM', id: room }), true);
    assert.equal(f.members.find(room, student), null);
    assert.equal(f.members.find(room, owner).user_id, owner);
  });
});

test('ID > 2^53 đi qua BigInt/string trong create/read/list/member/activity/write', (t) => {
  const f = fixture(t);
  transaction(f.db, () => {
    const largeId = '9007199254740993';
    f.db.prepare(`INSERT INTO users (id, username_key, display_name, password_hash, created_at)
      VALUES (?, 'large_01', 'Test', 'fixture-hash', ?)`).run(bindId(largeId), now);
    const nextUser = createUser(f);
    assert.equal(nextUser, '9007199254740994');
    assert.equal(f.users.findById(largeId).id, largeId);
    assert.equal(f.users.findByUsername('host_01').id, nextUser);
    const firstRoom = createRoom(f, largeId);
    f.db.prepare('UPDATE rooms SET id = ? WHERE id = ?').run(bindId(largeId), bindId(firstRoom));
    const nextRoom = createRoom(f, nextUser);
    assert.equal(nextRoom, '9007199254740994');
    f.members.add(nextRoom, nextUser, now);
    f.activity.add(nextUser, { kind: 'ROOM', id: nextRoom });
    assert.equal(f.rooms.findById(nextRoom).owner_id, nextUser);
    assert.equal(f.rooms.list(nextRoom, 1).items[0].id, largeId);
    assert.equal(f.members.list(nextRoom)[0].user_id, nextUser);
    assert.equal(f.activity.find(nextUser).id, nextRoom);
    assert.equal(f.rooms.configure(nextRoom, 1, 'Đổi tên', config), true);
    assert.equal(f.activity.release(nextUser, { kind: 'ROOM', id: nextRoom }), true);
    assert.equal(f.members.remove(nextRoom, nextUser), true);
  });
  assert.equal(bindId('9223372036854775807'), 9223372036854775807n);
  for (const invalid of ['0', '-1', '01', '1.0', '1e3', '9223372036854775808', '1; DROP TABLE users', '9'.repeat(200)]) {
    assert.throws(() => bindId(invalid), RangeError);
  }
});

test('Repository chỉ bind dữ liệu; mutation thiếu transaction bị chặn', (t) => {
  const f = fixture(t);
  const text = "Robert'); DROP TABLE users; --";
  const id = transaction(f.db, () => f.users.create({ username_key: 'safe_01', display_name: text,
    password_hash: 'fixture-hash', role: 'USER', created_at: now }));
  assert.equal(f.users.findById(id).display_name, text);
  assert.equal(f.users.findByUsername(text), null);
  assert.equal(f.users.findByUsername('safe_01').id, id);
  for (const write of [() => createUser(f), () => createRoom(f, id),
    () => f.members.add('1', id, now), () => f.members.remove('1', id),
    () => f.activity.add(id, { kind: 'ROOM', id: '1' }),
    () => f.activity.release(id, { kind: 'ROOM', id: '1' }),
    () => f.rooms.configure('1', 1, 'Test', config),
    () => f.rooms.start('1', 1, now, now + 900000),
    () => f.rooms.cancel('1', now, 'HOST_CANCEL'), () => f.rooms.end('1', now)]) {
    assert.throws(write, /caller-owned transaction/);
  }
});
