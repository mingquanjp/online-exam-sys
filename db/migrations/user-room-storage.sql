-- SCRUM-10 / EXAM-T02: phần schema của Minh Quân, ghép vào runner T06.
-- Không tự BEGIN/COMMIT hoặc đánh số version riêng. Xem README về thứ tự ghép.
-- Version tối đa INT32_MAX; thời gian tối đa Number.MAX_SAFE_INTEGER.
CREATE TABLE users (
    id INTEGER PRIMARY KEY CHECK (id > 0),
    username_key TEXT NOT NULL UNIQUE
        CHECK (length(username_key) BETWEEN 3 AND 32
            AND username_key NOT GLOB '*[^a-z0-9_]*'),
    display_name TEXT NOT NULL CHECK (length(CAST(display_name AS BLOB)) BETWEEN 1 AND 100),
    password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
    auth_version INTEGER NOT NULL DEFAULT 1 CHECK (auth_version BETWEEN 1 AND 2147483647),
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at INTEGER NOT NULL CHECK (created_at BETWEEN 0 AND 9007199254740991)
) STRICT;

CREATE TABLE rooms (
    id INTEGER PRIMARY KEY CHECK (id > 0),
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (length(CAST(name AS BLOB)) BETWEEN 1 AND 100),
    topic_id INTEGER REFERENCES topics(id) ON DELETE RESTRICT,
    easy_count INTEGER NOT NULL CHECK (easy_count BETWEEN 0 AND 100),
    medium_count INTEGER NOT NULL CHECK (medium_count BETWEEN 0 AND 100),
    hard_count INTEGER NOT NULL CHECK (hard_count BETWEEN 0 AND 100),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 60 AND 7200),
    capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity = 50),
    config_version INTEGER NOT NULL DEFAULT 1 CHECK (config_version BETWEEN 1 AND 2147483647),
    state TEXT NOT NULL DEFAULT 'WAITING' CHECK (state IN ('WAITING', 'RUNNING', 'ENDED', 'CANCELLED')),
    -- Trừ 30 phút khỏi mốc tối đa để waiting_expires_at vẫn là số nguyên JS an toàn.
    created_at INTEGER NOT NULL CHECK (created_at BETWEEN 0 AND 9007199252940991),
    waiting_expires_at INTEGER NOT NULL CHECK (waiting_expires_at = created_at + 1800000),
    -- UTC có thể bị chỉnh lùi; domain dùng monotonic để quyết định hạn/thứ tự nghiệp vụ.
    cancelled_at INTEGER CHECK (cancelled_at BETWEEN 0 AND 9007199254740991),
    cancel_reason TEXT CHECK (cancel_reason IN ('HOST_CANCEL', 'WAIT_TIMEOUT')),
    started_at INTEGER CHECK (started_at BETWEEN 0 AND 9007199254740991),
    deadline_at INTEGER CHECK (deadline_at BETWEEN 0 AND 9007199254740991),
    ended_at INTEGER CHECK (ended_at BETWEEN 0 AND 9007199254740991),
    CHECK (easy_count + medium_count + hard_count BETWEEN 1 AND 100),
    CHECK (
        (state = 'WAITING' AND started_at IS NULL AND deadline_at IS NULL AND ended_at IS NULL
            AND cancelled_at IS NULL AND cancel_reason IS NULL)
        OR (state = 'RUNNING' AND started_at IS NOT NULL AND deadline_at IS NOT NULL
            AND deadline_at = started_at + duration_seconds * 1000 AND ended_at IS NULL
            AND cancelled_at IS NULL AND cancel_reason IS NULL)
        OR (state = 'ENDED' AND started_at IS NOT NULL AND deadline_at IS NOT NULL
            AND deadline_at = started_at + duration_seconds * 1000 AND ended_at IS NOT NULL
            AND cancelled_at IS NULL AND cancel_reason IS NULL)
        OR (state = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL
            AND started_at IS NULL AND deadline_at IS NULL AND ended_at IS NULL)
    )
) STRICT;

CREATE TABLE room_members (
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    joined_at INTEGER NOT NULL CHECK (joined_at BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (room_id, user_id)
) STRICT;

CREATE TABLE user_activity (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
    room_id INTEGER REFERENCES rooms(id) ON DELETE RESTRICT,
    practice_attempt_id INTEGER REFERENCES attempts(id) ON DELETE RESTRICT,
    CHECK ((room_id IS NOT NULL) <> (practice_attempt_id IS NOT NULL))
) STRICT;

CREATE INDEX rooms_state_idx ON rooms(state);
CREATE INDEX room_members_user_idx ON room_members(user_id);
