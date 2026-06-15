-- Safety basics before social scales: user reports + a deliberate minor age stance.
-- A warm, cute self-care app attracts teens; "preset-only anonymous + young users +
-- Russian platform rules" is handled on purpose, not discovered after launch.

-- Self-declared minor flag (derived from the onboarding age question, "До 18").
-- Used to harden defaults for under-18s: anonymous-within-friends is forced to attributed,
-- and external "send to a non-user" link surfaces are disabled for these accounts.
ALTER TABLE users ADD COLUMN minor INTEGER NOT NULL DEFAULT 0;

-- Friend/content reports. report flow complements the existing mute/block.
CREATE TABLE reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  target_id   INTEGER,                 -- reported user (nullable for content-only reports)
  kind        TEXT NOT NULL,           -- user|vibe|message|coop|other
  ref         TEXT,                    -- id of the offending item (vibe id, coop id, etc.)
  reason      TEXT NOT NULL,           -- preset reason id
  note        TEXT,                    -- optional short free text (capped server-side)
  status      TEXT NOT NULL DEFAULT 'open',  -- open|reviewed|actioned|dismissed
  ts          INTEGER NOT NULL
);
CREATE INDEX idx_reports_status ON reports(status, ts);
CREATE INDEX idx_reports_target ON reports(target_id);
