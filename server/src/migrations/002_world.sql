-- Full world schema: economy, travel, micropets, quests, events, social, journal, mail, payments.

ALTER TABLE users ADD COLUMN queued_flight TEXT;
ALTER TABLE users ADD COLUMN flights_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN write_access INTEGER NOT NULL DEFAULT 0;

-- ===== inventory & shops =====
CREATE TABLE items_owned (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,                 -- clothing|furniture|dye|plushie|floor|wallpaper
  item_id TEXT NOT NULL,
  color_id TEXT NOT NULL DEFAULT '',
  acquired_ts INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_owned_unique ON items_owned(user_id, kind, item_id, color_id);

CREATE TABLE outfits (user_id INTEGER PRIMARY KEY REFERENCES users(id), slots TEXT NOT NULL DEFAULT '{}');
CREATE TABLE rooms (user_id INTEGER PRIMARY KEY REFERENCES users(id), slots TEXT NOT NULL DEFAULT '{}');
CREATE TABLE saved_combos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,                 -- outfit|room|color
  name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE TABLE shop_state (
  user_id INTEGER NOT NULL REFERENCES users(id),
  shop TEXT NOT NULL,                 -- outfit|furniture|color|travel
  day TEXT NOT NULL,
  slots TEXT NOT NULL,                -- JSON array of listings
  refreshes INTEGER NOT NULL DEFAULT 0,
  gift_claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, shop)
);

-- ===== travel & discoveries =====
CREATE TABLE location_progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  location_id TEXT NOT NULL,
  pct REAL NOT NULL DEFAULT 0,
  walks INTEGER NOT NULL DEFAULT 0,
  first_visit_day TEXT,
  PRIMARY KEY (user_id, location_id)
);
CREATE TABLE user_discoveries (
  user_id INTEGER NOT NULL REFERENCES users(id),
  discovery_id TEXT NOT NULL,
  liked INTEGER NOT NULL,
  day TEXT NOT NULL,
  location_id TEXT,
  PRIMARY KEY (user_id, discovery_id)
);

-- ===== micropets =====
CREATE TABLE user_micropets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  species_id TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  pronouns TEXT NOT NULL DEFAULT 'they',
  nature TEXT NOT NULL DEFAULT '',
  walks INTEGER NOT NULL DEFAULT 0,
  forever_baby INTEGER NOT NULL DEFAULT 0,
  equipped INTEGER NOT NULL DEFAULT 0,
  hatched_day TEXT NOT NULL
);
CREATE INDEX idx_micropets_user ON user_micropets(user_id);
CREATE TABLE eggs (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  goal_id INTEGER,
  progress INTEGER NOT NULL DEFAULT 0
);

-- ===== quests & progression =====
CREATE TABLE daily_quests (
  user_id INTEGER NOT NULL, day TEXT NOT NULL, quest_id TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0, claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, quest_id)
);
CREATE TABLE special_progress (
  user_id INTEGER NOT NULL, track_id TEXT NOT NULL,
  claimed_tiers INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, track_id)
);
CREATE TABLE weekly_state (
  user_id INTEGER NOT NULL, week TEXT NOT NULL, sca TEXT NOT NULL,
  claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, week, sca)
);
CREATE TABLE challenge_state (
  user_id INTEGER NOT NULL, challenge_id TEXT NOT NULL, month TEXT NOT NULL,
  done TEXT NOT NULL DEFAULT '[]', joined_day TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, challenge_id, month)
);
CREATE TABLE badges (
  user_id INTEGER NOT NULL, badge_id TEXT NOT NULL, ts INTEGER NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

-- ===== seasonal events =====
CREATE TABLE event_state (
  user_id INTEGER NOT NULL, event_id TEXT NOT NULL,
  days_earned INTEGER NOT NULL DEFAULT 0,
  last_credit_day TEXT,
  claimed TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (user_id, event_id)
);

-- ===== social =====
CREATE TABLE friendships (
  user_id INTEGER NOT NULL, friend_id INTEGER NOT NULL,
  nickname TEXT, emoji TEXT,
  muted INTEGER NOT NULL DEFAULT 0,
  pts REAL NOT NULL DEFAULT 0,
  created_ts INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);
CREATE TABLE friend_requests (
  from_id INTEGER NOT NULL, to_id INTEGER NOT NULL,
  ts INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  PRIMARY KEY (from_id, to_id)
);
CREATE TABLE vibes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id INTEGER NOT NULL, to_id INTEGER NOT NULL,
  type TEXT NOT NULL, day TEXT NOT NULL, ts INTEGER NOT NULL,
  read INTEGER NOT NULL DEFAULT 0, answered INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_vibes_to ON vibes(to_id, read);
CREATE TABLE gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id INTEGER NOT NULL, to_id INTEGER NOT NULL,
  kind TEXT NOT NULL, item_id TEXT NOT NULL, color_id TEXT NOT NULL DEFAULT '',
  box_color TEXT, day TEXT NOT NULL, ts INTEGER NOT NULL,
  claimed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE shared_goals (
  goal_id INTEGER NOT NULL, owner_id INTEGER NOT NULL, follower_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'share',  -- share|buddy
  ts INTEGER NOT NULL,
  PRIMARY KEY (goal_id, follower_id)
);
CREATE TABLE hug_requests (user_id INTEGER NOT NULL, day TEXT NOT NULL, PRIMARY KEY (user_id, day));
CREATE TABLE referrals (
  invitee_id INTEGER PRIMARY KEY,
  inviter_id INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  gift_species TEXT
);
CREATE TABLE pending_referrals (tg_id INTEGER PRIMARY KEY, inviter_id INTEGER NOT NULL, ts INTEGER NOT NULL);

-- ===== journal, activities, quizzes =====
CREATE TABLE reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, day TEXT NOT NULL,
  prompt_id TEXT, text TEXT NOT NULL,
  valence INTEGER, tags TEXT NOT NULL DEFAULT '[]',
  ts INTEGER NOT NULL
);
CREATE INDEX idx_reflections_user ON reflections(user_id, day);
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, day TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- breathing|meditation|focus|movement|grounding|quiz|emotion|kindness
  ref_id TEXT, energy INTEGER NOT NULL DEFAULT 0,
  ts INTEGER NOT NULL
);
CREATE INDEX idx_activity_user ON activity_log(user_id, day);
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL, day TEXT NOT NULL, ts INTEGER NOT NULL
);

-- ===== mail, reminders, payments =====
CREATE TABLE mail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,                 -- newsletter|friend_request|gift|system
  title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL DEFAULT '{}',
  read INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL
);
CREATE INDEX idx_mail_user ON mail(user_id, read);
CREATE TABLE reminder_log (
  user_id INTEGER NOT NULL, kind TEXT NOT NULL, day TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, day)
);
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  charge_id TEXT NOT NULL,
  stars INTEGER NOT NULL,
  kind TEXT NOT NULL,                 -- sub_month|sub_year
  sub_until TEXT,
  ts INTEGER NOT NULL
);
