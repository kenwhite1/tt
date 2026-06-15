// Server-side funnel logging into the existing `events` table (same table the client
// /api/events route writes to). Best-effort: never throws, never blocks a request.
// Lets us measure activation + D1/D7/D30 + k-factor without a third-party SDK.
import { db } from '../db'

const ins = db.prepare('INSERT INTO events (user_id, name, props, ts) VALUES (?,?,?,?)')

export function logEvent(userId: number | null, name: string, props?: Record<string, unknown>): void {
  try {
    ins.run(userId, name, props ? JSON.stringify(props).slice(0, 2000) : null, Date.now())
  } catch { /* analytics is best-effort */ }
}

// Fire `name` only the first time it ever happens for a user (first_walk, first_share, …),
// so the funnel can compute activation cleanly without double-counting.
export function logFirst(userId: number, name: string, props?: Record<string, unknown>): void {
  try {
    const seen = db.prepare('SELECT 1 FROM events WHERE user_id=? AND name=? LIMIT 1').get(userId, name)
    if (!seen) logEvent(userId, name, props)
  } catch { /* best-effort */ }
}
