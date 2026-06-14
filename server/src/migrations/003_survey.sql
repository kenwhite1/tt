-- Onboarding survey answers, one JSON blob per user (last-write-wins upsert).
CREATE TABLE onboarding_survey (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  data TEXT NOT NULL,
  ts INTEGER NOT NULL
);

-- One-time grace: when Шарик Плюс enforcement turns on, give every existing user a
-- 7-day trial so nobody is abruptly locked out of features they already had.
UPDATE users SET plus_until = date('now', '+7 days') WHERE plus_until IS NULL;
