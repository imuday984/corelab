-- Users own private progress; curriculum records are shared and contain no user identifiers.
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, settings TEXT NOT NULL, created_at TEXT NOT NULL);
-- Sessions store hashes of random bearer tokens and expire independently of cookies.
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
-- Password-reset tokens are hashed and single-use.
CREATE TABLE password_resets (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
-- Persistent rate-limit buckets survive Worker restarts.
CREATE TABLE rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at TEXT NOT NULL);
-- Subject metadata can be extended without changing React components.
CREATE TABLE subjects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
-- Modules group related topics within a subject.
CREATE TABLE modules (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id), title TEXT NOT NULL, UNIQUE(subject_id, title));
-- Topic JSON is structured curriculum data, not user progress.
CREATE TABLE topics (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id), module_id TEXT NOT NULL REFERENCES modules(id), data TEXT NOT NULL);
-- Learning material has its own relationship for future content editing.
CREATE TABLE learning_material (topic_id TEXT PRIMARY KEY REFERENCES topics(id), data TEXT NOT NULL);
-- Checkpoints have stable identifiers and belong to exactly one topic.
CREATE TABLE checkpoints (id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id), data TEXT NOT NULL);
-- One progress record per user and topic prevents contradictory learning states.
CREATE TABLE user_topic_progress (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id TEXT NOT NULL REFERENCES topics(id), status TEXT NOT NULL, viewed INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, review_step INTEGER NOT NULL DEFAULT 0, review_at TEXT, PRIMARY KEY(user_id, topic_id));
-- Checkpoint attempts are append-only history rather than overwritten scores.
CREATE TABLE checkpoint_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id TEXT NOT NULL REFERENCES topics(id), question_id TEXT NOT NULL REFERENCES checkpoints(id), answer TEXT NOT NULL, correct INTEGER, difficulty TEXT NOT NULL, created_at TEXT NOT NULL);
-- Quiz definitions retain the exact server-selected question list for an assessment.
CREATE TABLE quizzes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, subject_id TEXT NOT NULL, topic_id TEXT, questions TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
-- Quiz results retain answers and elapsed time for review and analytics.
CREATE TABLE quiz_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, quiz_id TEXT UNIQUE REFERENCES quizzes(id), subject_id TEXT NOT NULL, topic_id TEXT, score INTEGER NOT NULL, correct INTEGER NOT NULL, total INTEGER NOT NULL, seconds INTEGER NOT NULL, created_at TEXT NOT NULL, answers TEXT NOT NULL);
-- Bookmark uniqueness makes retries idempotent.
CREATE TABLE bookmarks (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id TEXT NOT NULL REFERENCES topics(id), created_at TEXT NOT NULL, PRIMARY KEY(user_id, topic_id));
-- Personal notes are private to the owning user and topic.
CREATE TABLE user_notes (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id TEXT NOT NULL REFERENCES topics(id), text TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id, topic_id));
-- Revision history retains completed review events alongside the next due date in progress.
CREATE TABLE revision_history (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id TEXT NOT NULL REFERENCES topics(id), created_at TEXT NOT NULL, step INTEGER NOT NULL);
-- Activity records are real learning events used for daily charts and streaks.
CREATE TABLE learning_activity (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id TEXT REFERENCES topics(id), kind TEXT NOT NULL, created_at TEXT NOT NULL);
-- Session lookups and expiration cleanup use these indexes.
CREATE INDEX sessions_user_idx ON sessions(user_id);
-- Rate-limit cleanup uses the expiration index.
CREATE INDEX rate_limits_expiration_idx ON rate_limits(expires_at);
-- Subject detail pages filter topics by their parent subject.
CREATE INDEX topics_subject_idx ON topics(subject_id);
-- Attempt history and latest-answer calculations use user/topic ordering.
CREATE INDEX attempts_user_topic_idx ON checkpoint_attempts(user_id, topic_id, created_at);
-- Quiz history is displayed newest first for one user.
CREATE INDEX quizzes_user_date_idx ON quiz_attempts(user_id, created_at);
-- Revision queues filter a user's next due date.
CREATE INDEX progress_user_review_idx ON user_topic_progress(user_id, review_at);
-- Daily activity charts group recent events by user and date.
CREATE INDEX activity_user_date_idx ON learning_activity(user_id, created_at);
