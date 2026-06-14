-- Lightweight first-party analytics event log (funnel + errors). No PII beyond user_id.
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  props TEXT,
  ts INTEGER NOT NULL
);
CREATE INDEX idx_events_name_ts ON events (name, ts);
CREATE INDEX idx_events_user_ts ON events (user_id, ts);
