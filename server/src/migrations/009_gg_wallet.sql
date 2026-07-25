-- Shared hub currency G: remember the «game is game» launch token per user so
-- the server can proxy wallet calls (balance / earn / spend) to the hub. The
-- hub has no CORS, so the client never talks to it directly.
ALTER TABLE users ADD COLUMN gg_launch TEXT;
