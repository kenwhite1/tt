import { C } from '../../../shared/constants'
import { db } from '../db'
import type { UserRow } from './rows'

// Returns {date:'YYYY-MM-DD', minutes} in the user's timezone.
export function localNow(tz: string, at = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const p: Record<string, string> = {}
  for (const part of fmt.formatToParts(at)) p[part.type] = part.value
  const hour = p.hour === '24' ? 0 : Number(p.hour)
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: hour * 60 + Number(p.minute) }
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// The game day flips at wake-up time − 2h, NOT midnight.
export function gameDay(user: Pick<UserRow, 'tz' | 'wake_min'>, at = new Date()): string {
  const { date, minutes } = localNow(user.tz, at)
  const boundary = ((user.wake_min - C.DAY_RESET_OFFSET_MIN) % 1440 + 1440) % 1440
  return minutes >= boundary ? date : shiftDate(date, -1)
}

// Lazily roll the user into the current game day on any authed request.
// Streak ticks on open (matching the original: checking in is enough).
// Always re-reads the row: callers may hold a stale copy from middleware time.
export function ensureFresh(userStale: UserRow): UserRow {
  const user = (db.prepare('SELECT * FROM users WHERE id=?').get(userStale.id) as UserRow | undefined) ?? userStale
  const day = gameDay(user)
  if (user.last_day === day) return user

  let streak = user.streak
  if (user.paused_until && user.paused_until >= day) {
    // paused: streak frozen, no tick
  } else if (user.last_day === shiftDate(day, -1)) {
    streak += 1
  } else if (user.last_day == null) {
    streak = 1
  } else {
    streak = 1 // broken (repair flow restores later)
  }
  const best = Math.max(user.streak_best, streak)

  db.prepare(
    `UPDATE users SET last_day=?, streak=?, streak_best=?, energy=0 WHERE id=?`,
  ).run(day, streak, best, user.id)
  db.prepare(`UPDATE pets SET pats_today=0 WHERE user_id=?`).run(user.id)
  db.prepare(`UPDATE goals SET goal_of_day=NULL WHERE user_id=? AND goal_of_day IS NOT NULL AND goal_of_day<>?`).run(user.id, day)

  return { ...user, last_day: day, streak, streak_best: best, energy: 0 }
}
