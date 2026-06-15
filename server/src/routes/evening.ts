// «Вечерний сбор» — a gentle synchronized wind-down window (Feature 6). Opt-in, skippable,
// NO streak, NO countdown; presence is only ever encouraging. See docs/SPEC-VIRAL-FEATURES.md §6.
import { Hono } from 'hono'
import { z } from 'zod'
import { C } from '../../../shared/constants'
import { db } from '../db'
import { ensureFresh, localNow } from '../engine/day'
import { logEvent } from '../engine/analytics'
import type { Env } from '../env'

export const eveningRoutes = new Hono<Env>()

function settingsOf(uid: number): Record<string, unknown> {
  const row = db.prepare('SELECT settings FROM users WHERE id=?').get(uid) as { settings: string } | undefined
  try { return JSON.parse(row?.settings || '{}') as Record<string, unknown> } catch { return {} }
}
function eveningHour(uid: number): number {
  const h = settingsOf(uid).evening_hour
  return typeof h === 'number' && h >= 0 && h <= 23 ? h : C.EVENING_DEFAULT_HOUR
}

eveningRoutes.get('/now', c => {
  const me = ensureFresh(c.get('user'))
  const day = me.last_day!
  const hour = eveningHour(me.id)
  const { minutes } = localNow(me.tz)
  const start = hour * 60
  const inWindow = minutes >= start && minutes < start + C.EVENING_WINDOW_MIN
  const checkedIn = !!db.prepare('SELECT 1 FROM evening_checkin WHERE user_id=? AND day=?').get(me.id, day)
  const present = db.prepare(
    `SELECT u.name, p.name AS pet_name, p.species FROM evening_checkin e
     JOIN friendships f ON f.friend_id=e.user_id AND f.user_id=?
     JOIN users u ON u.id=e.user_id JOIN pets p ON p.user_id=e.user_id
     WHERE e.day=? ORDER BY e.ts DESC LIMIT 20`,
  ).all(me.id, day) as { name: string; pet_name: string; species: string }[]
  return c.json({
    inWindow, hour, windowMin: C.EVENING_WINDOW_MIN, checkedIn,
    present: present.map(p => ({ name: p.name, petName: p.pet_name, species: p.species })),
  })
})

eveningRoutes.post('/checkin', c => {
  const me = ensureFresh(c.get('user'))
  const day = me.last_day!
  db.prepare('INSERT OR IGNORE INTO evening_checkin (user_id, day, ts) VALUES (?,?,?)').run(me.id, day, Date.now())
  logEvent(me.id, 'evening_checkin')
  return c.json({ ok: true })
})

eveningRoutes.post('/settings', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ hour: z.number().int().min(0).max(23) }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const s = { ...settingsOf(me.id), evening_hour: body.data.hour }
  db.prepare('UPDATE users SET settings=? WHERE id=?').run(JSON.stringify(s), me.id)
  return c.json({ ok: true, hour: body.data.hour })
})
