CREATE TABLE users (
  id INTEGER PRIMARY KEY,            -- telegram user id
  name TEXT NOT NULL DEFAULT '',
  tz TEXT NOT NULL DEFAULT 'Europe/Moscow',
  wake_min INTEGER NOT NULL DEFAULT 420,   -- 07:00
  sleep_min INTEGER NOT NULL DEFAULT 1380, -- 23:00
  stones INTEGER NOT NULL DEFAULT 0,
  energy INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  streak_intensity TEXT NOT NULL DEFAULT 'normal',
  last_day TEXT,
  repairs INTEGER NOT NULL DEFAULT 1,
  walks_since_repair INTEGER NOT NULL DEFAULT 0,
  plus_until TEXT,
  paused_until TEXT,
  friend_code TEXT NOT NULL,
  referred_by INTEGER,
  referral_rewards INTEGER NOT NULL DEFAULT 0,
  location_id TEXT NOT NULL DEFAULT 'puppy_forest',
  settings TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_users_friend_code ON users(friend_code);

CREATE TABLE pets (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  name TEXT NOT NULL,
  pronouns TEXT NOT NULL DEFAULT 'he',
  color TEXT NOT NULL DEFAULT 'golden',
  trait TEXT NOT NULL DEFAULT 'curiosity',
  walks INTEGER NOT NULL DEFAULT 0,
  friendship_pts REAL NOT NULL DEFAULT 0,
  pats_today INTEGER NOT NULL DEFAULT 0,
  personality TEXT NOT NULL DEFAULT '{}',  -- {confidence,curiosity,security,resilience,compassion,logic}
  hatch_day TEXT NOT NULL,
  dyes TEXT NOT NULL DEFAULT '{}'          -- {part: colorId}
);

CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⭐',
  sca TEXT,
  times_per_day INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  paused INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  goal_of_day TEXT,                        -- game-day string when starred
  linked_exercise TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_goals_user ON goals(user_id, archived);

CREATE TABLE goal_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX idx_completions_user_day ON goal_completions(user_id, day);
CREATE INDEX idx_completions_goal_day ON goal_completions(goal_id, day);

CREATE TABLE moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,
  value INTEGER NOT NULL,                  -- 1..5
  note TEXT,
  factors TEXT,                            -- JSON array
  ts INTEGER NOT NULL
);
CREATE INDEX idx_moods_user_day ON moods(user_id, day);

CREATE TABLE walks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,
  location_id TEXT NOT NULL,
  started_ts INTEGER NOT NULL,
  ends_ts INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  chat_done INTEGER NOT NULL DEFAULT 0,
  story_id TEXT,
  discovery_id TEXT
);
CREATE INDEX idx_walks_user_day ON walks(user_id, day);

CREATE TABLE ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX idx_ledger_user ON ledger(user_id);
