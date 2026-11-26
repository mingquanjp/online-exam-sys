-- SCRUM-14: phần ngân hàng, bài làm và receipt của migration khởi tạo.
-- FK ghép của bài thi trỏ tới roster. FK ghép của đáp án trỏ tới đúng câu trong đề.
CREATE TABLE topics (
    id INTEGER PRIMARY KEY CHECK (id > 0),
    name TEXT NOT NULL CHECK (length(CAST(name AS BLOB)) BETWEEN 1 AND 100),
    name_key TEXT NOT NULL UNIQUE CHECK (name_key = name),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version BETWEEN 1 AND 2147483647),
    created_at INTEGER NOT NULL CHECK (created_at BETWEEN 0 AND 9007199254740991),
    updated_at INTEGER NOT NULL CHECK (updated_at BETWEEN 0 AND 9007199254740991)
) STRICT;

CREATE TABLE questions (
    id INTEGER PRIMARY KEY CHECK (id > 0),
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    prompt TEXT NOT NULL CHECK (length(CAST(prompt AS BLOB)) BETWEEN 1 AND 4096),
    option_a TEXT NOT NULL CHECK (length(CAST(option_a AS BLOB)) BETWEEN 1 AND 1024),
    option_b TEXT NOT NULL CHECK (length(CAST(option_b AS BLOB)) BETWEEN 1 AND 1024),
    option_c TEXT NOT NULL CHECK (length(CAST(option_c AS BLOB)) BETWEEN 1 AND 1024),
    option_d TEXT NOT NULL CHECK (length(CAST(option_d AS BLOB)) BETWEEN 1 AND 1024),
    correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version BETWEEN 1 AND 2147483647),
    updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_at INTEGER NOT NULL CHECK (updated_at BETWEEN 0 AND 9007199254740991)
) STRICT;

CREATE TABLE attempts (
    id INTEGER PRIMARY KEY CHECK (id > 0),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    room_id INTEGER,
    kind TEXT NOT NULL CHECK (kind IN ('EXAM', 'PRACTICE')),
    state TEXT NOT NULL DEFAULT 'OPEN' CHECK (state IN ('OPEN', 'FINALIZED')),
    topic_id INTEGER REFERENCES topics(id) ON DELETE RESTRICT,
    easy_count INTEGER NOT NULL CHECK (easy_count BETWEEN 0 AND 100),
    medium_count INTEGER NOT NULL CHECK (medium_count BETWEEN 0 AND 100),
    hard_count INTEGER NOT NULL CHECK (hard_count BETWEEN 0 AND 100),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 60 AND 7200),
    total_count INTEGER NOT NULL CHECK (total_count BETWEEN 1 AND 100),
    started_at INTEGER NOT NULL CHECK (started_at BETWEEN 0 AND 9007199254740991),
    deadline_at INTEGER NOT NULL CHECK (deadline_at BETWEEN 0 AND 9007199254740991),
    finalized_at INTEGER CHECK (finalized_at BETWEEN 0 AND 9007199254740991),
    finalize_reason TEXT CHECK (finalize_reason IN ('EARLY_SUBMIT', 'TIME_EXPIRED', 'HOST_END')),
    correct_count INTEGER CHECK (correct_count BETWEEN 0 AND total_count),
    UNIQUE (room_id, user_id),
    FOREIGN KEY (room_id, user_id) REFERENCES room_members(room_id, user_id) ON DELETE RESTRICT,
    CHECK (total_count = easy_count + medium_count + hard_count),
    CHECK (deadline_at = started_at + duration_seconds * 1000),
    CHECK ((kind = 'EXAM' AND room_id IS NOT NULL) OR (kind = 'PRACTICE' AND room_id IS NULL)),
    CHECK (kind = 'EXAM' OR finalize_reason IS NULL OR finalize_reason <> 'HOST_END'),
    CHECK (
        (state = 'OPEN' AND finalized_at IS NULL AND finalize_reason IS NULL AND correct_count IS NULL)
        OR (state = 'FINALIZED' AND finalized_at IS NOT NULL AND finalize_reason IS NOT NULL AND correct_count IS NOT NULL)
    )
) STRICT;

CREATE TABLE attempt_items (
    attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 100),
    source_question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    source_version INTEGER NOT NULL CHECK (source_version BETWEEN 1 AND 2147483647),
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    topic_name_snapshot TEXT NOT NULL CHECK (length(CAST(topic_name_snapshot AS BLOB)) BETWEEN 1 AND 100),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    prompt_snapshot TEXT NOT NULL CHECK (length(CAST(prompt_snapshot AS BLOB)) BETWEEN 1 AND 4096),
    option_a_snapshot TEXT NOT NULL CHECK (length(CAST(option_a_snapshot AS BLOB)) BETWEEN 1 AND 1024),
    option_b_snapshot TEXT NOT NULL CHECK (length(CAST(option_b_snapshot AS BLOB)) BETWEEN 1 AND 1024),
    option_c_snapshot TEXT NOT NULL CHECK (length(CAST(option_c_snapshot AS BLOB)) BETWEEN 1 AND 1024),
    option_d_snapshot TEXT NOT NULL CHECK (length(CAST(option_d_snapshot AS BLOB)) BETWEEN 1 AND 1024),
    correct_option_snapshot TEXT NOT NULL CHECK (correct_option_snapshot IN ('A', 'B', 'C', 'D')),
    PRIMARY KEY (attempt_id, position),
    UNIQUE (attempt_id, source_question_id)
) STRICT;

CREATE TABLE answers (
    attempt_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 2147483647),
    saved_at INTEGER NOT NULL CHECK (saved_at BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (attempt_id, position),
    FOREIGN KEY (attempt_id, position) REFERENCES attempt_items(attempt_id, position) ON DELETE RESTRICT
) STRICT;

CREATE TABLE operations (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    operation_id TEXT NOT NULL CHECK (length(operation_id) = 32 AND operation_id NOT GLOB '*[^0-9a-f]*'),
    operation_type TEXT NOT NULL CHECK (length(operation_type) > 0),
    resource_id INTEGER NOT NULL CHECK (resource_id > 0),
    payload_fingerprint TEXT NOT NULL
        CHECK (length(payload_fingerprint) = 64 AND payload_fingerprint NOT GLOB '*[^0-9a-f]*'),
    receipt TEXT NOT NULL CHECK (CASE WHEN json_valid(receipt) THEN json_type(receipt) = 'object' ELSE 0 END),
    committed_at INTEGER NOT NULL CHECK (committed_at BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (user_id, operation_id)
) STRICT;

CREATE INDEX questions_topic_difficulty_active_idx ON questions(topic_id, difficulty, active);
CREATE INDEX questions_difficulty_active_idx ON questions(difficulty, active);
CREATE INDEX attempts_user_started_idx ON attempts(user_id, started_at);
CREATE INDEX attempts_room_state_idx ON attempts(room_id, state);
CREATE INDEX operations_committed_idx ON operations(committed_at);
