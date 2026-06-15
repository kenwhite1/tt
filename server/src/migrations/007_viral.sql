-- Telegram-native growth layer. See docs/SPEC-VIRAL-FEATURES.md.
-- (Spec called this 004_viral.sql; renumbered to 007 — 003/004/005 are already taken.)

-- Feature 1 «Витрина» — premium milestone share cards (analytics + anti-spam dedupe).
CREATE TABLE share_events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind    TEXT NOT NULL,                 -- hatch|stage|streak|micropet|location|event|coop|dig|stats
  ref     TEXT,                          -- milestone discriminator (e.g. "30" for a 30-day streak)
  surface TEXT NOT NULL,                 -- story|message|link
  ts      INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_share_once ON share_events(user_id, kind, ref);

-- Feature 2 «Косточка дня» — one shared deterministic daily dig.
CREATE TABLE daily_dig (
  user_id INTEGER NOT NULL,
  day     TEXT NOT NULL,
  result  TEXT NOT NULL,                 -- JSON {tier, kind, ref, stones}
  shared  INTEGER NOT NULL DEFAULT 0,
  ts      INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);

-- Feature 4 «Лучик от друга» — anonymous-within-friends preset compliments (extends vibes).
ALTER TABLE vibes ADD COLUMN anon INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vibes ADD COLUMN message_id TEXT;          -- preset compliment id

-- Feature 5B collectible puppy items (earned/cosmetic, transparent supply, no gambling).
ALTER TABLE items_owned ADD COLUMN edition INTEGER;     -- nullable serial for limited drops
CREATE TABLE collectible_supply (
  item_id TEXT PRIMARY KEY,
  minted  INTEGER NOT NULL DEFAULT 0,
  cap     INTEGER
);

-- Feature 6 «Вечерний сбор» — synchronized gentle evening moment.
CREATE TABLE evening_checkin (
  user_id INTEGER NOT NULL,
  day     TEXT NOT NULL,
  ts      INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);

-- Feature 3 «Косточка-спасалочка» (giftable streak-freeze) reuses the gifts table — no DDL.
