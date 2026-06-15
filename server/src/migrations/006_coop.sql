-- «Содружок» / co-op puppy: a second, SHARED puppy co-raised by 2 users (schema allows ≤4).
-- Interdependent, additive-only, no-punishment. The shared bar is DERIVED (never stored) from
-- each member's goal_completions, so it can never drift out of sync. See docs/SPEC-COOP-PUPPY.md.

CREATE TABLE coop_pets (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  pronouns       TEXT NOT NULL DEFAULT 'they',
  color          TEXT NOT NULL DEFAULT 'golden',
  species        TEXT NOT NULL DEFAULT 'dog',          -- reuse Mascot rig
  dyes           TEXT NOT NULL DEFAULT '{}',           -- {part: colorId}
  walks          INTEGER NOT NULL DEFAULT 0,           -- → stage via stageForWalks()
  status         TEXT NOT NULL DEFAULT 'pending',      -- pending|active|dormant
  walk_day       TEXT,
  walk_started_ts INTEGER,
  walk_ends_ts   INTEGER,
  walk_completed INTEGER NOT NULL DEFAULT 0,
  walk_story_id  TEXT,
  streak         INTEGER NOT NULL DEFAULT 0,           -- consecutive "both showed up" days
  streak_day     TEXT,                                 -- last day the shared bar was full
  created_at     TEXT NOT NULL
);

CREATE TABLE coop_members (
  coop_id          INTEGER NOT NULL REFERENCES coop_pets(id),
  user_id          INTEGER NOT NULL REFERENCES users(id),
  role             TEXT NOT NULL DEFAULT 'member',     -- founder|member
  last_contrib_day TEXT,                               -- that member's game-day of last fill
  joined_ts        INTEGER NOT NULL,
  PRIMARY KEY (coop_id, user_id)
);
CREATE INDEX idx_coop_member_user ON coop_members(user_id);

CREATE TABLE coop_invites (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  coop_id INTEGER NOT NULL REFERENCES coop_pets(id),
  from_id INTEGER NOT NULL,
  to_id   INTEGER,                                     -- NULL = open link invite
  code    TEXT,
  status  TEXT NOT NULL DEFAULT 'pending',             -- pending|accepted|expired
  ts      INTEGER NOT NULL
);
CREATE INDEX idx_coop_invites_code ON coop_invites(code);
CREATE INDEX idx_coop_invites_to ON coop_invites(to_id, status);

CREATE TABLE coop_walks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  coop_id     INTEGER NOT NULL,
  day         TEXT NOT NULL,
  started_ts  INTEGER NOT NULL,
  ends_ts     INTEGER NOT NULL,
  completed   INTEGER NOT NULL DEFAULT 0,
  story_id    TEXT,
  discovery_id TEXT
);
CREATE INDEX idx_coop_walks ON coop_walks(coop_id, day);
