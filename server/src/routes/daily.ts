// «Косточка дня» — one shared daily dig. The pool is global per game-day; each user's
// result is deterministic (stable on re-read) and persisted. 1/day, resets at wake−2h.
// All rewards are косточки (never desyncs other modules). See docs/SPEC-VIRAL-FEATURES.md §2.
import { Hono } from 'hono'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from '../../../shared/constants'
import type { DailyDigDto, DigResultDto } from '../../../shared/types'
import { db } from '../db'
import { addStones } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { logEvent, logFirst } from '../engine/analytics'
import type { Env } from '../env'

export const dailyRoutes = new Hono<Env>()

const pool = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'daily_pool.json'), 'utf8'),
) as { common: PoolItem[]; uncommon: PoolItem[]; rare: PoolItem[] }
interface PoolItem { ref: string; ru: string; emoji: string }
const TIERS: PoolItem[][] = [pool.common, pool.uncommon, pool.rare]

// djb2 → mulberry32: deterministic, stable per (user, day), no Math.random in the roll.
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return h >>> 0
}
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function roll(userId: number, day: string): DigResultDto {
  const r = rng(hash(`${userId}:${day}`))
  const weights = C.DAILY_DIG_WEIGHTS
  const total = weights.reduce((a, b) => a + b, 0)
  let x = r() * total
  let tier = 0
  for (let i = 0; i < weights.length; i++) { if (x < weights[i]) { tier = i; break } x -= weights[i] }
  const items = TIERS[tier]
  const item = items[Math.floor(r() * items.length)] ?? items[0]
  const stones = C.DAILY_DIG_STONES[tier] ?? C.DAILY_DIG_STONES[0]
  return { tier, kind: 'stones', ref: item.ref, stones, ru: item.ru, emoji: item.emoji }
}

function digStreak(userId: number, today: string): number {
  const rows = db.prepare('SELECT day FROM daily_dig WHERE user_id=? ORDER BY day DESC LIMIT 120').all(userId) as { day: string }[]
  const set = new Set(rows.map(r => r.day))
  const shift = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
  let cursor = today
  if (!set.has(cursor)) cursor = shift(cursor, -1)
  let streak = 0
  while (set.has(cursor)) { streak += 1; cursor = shift(cursor, -1) }
  return streak
}

function todayRow(userId: number, day: string): { result: string; shared: number } | undefined {
  return db.prepare('SELECT result, shared FROM daily_dig WHERE user_id=? AND day=?').get(userId, day) as
    { result: string; shared: number } | undefined
}

dailyRoutes.get('/today', c => {
  const me = ensureFresh(c.get('user'))
  const day = me.last_day!
  const row = todayRow(me.id, day)
  const dto: DailyDigDto = {
    day, dug: !!row,
    result: row ? JSON.parse(row.result) as DigResultDto : null,
    shared: !!row?.shared,
    streak: digStreak(me.id, day),
  }
  return c.json(dto)
})

dailyRoutes.post('/dig', c => {
  const me = ensureFresh(c.get('user'))
  const day = me.last_day!
  const existing = todayRow(me.id, day)
  if (existing) {
    return c.json({ result: JSON.parse(existing.result) as DigResultDto, alreadyDug: true, streak: digStreak(me.id, day) })
  }
  const result = roll(me.id, day)
  db.transaction(() => {
    db.prepare('INSERT INTO daily_dig (user_id, day, result, ts) VALUES (?,?,?,?)')
      .run(me.id, day, JSON.stringify(result), Date.now())
    addStones(me.id, result.stones, 'daily_dig')
  })()
  logEvent(me.id, 'daily_dig', { tier: result.tier }); logFirst(me.id, 'first_dig')
  return c.json({ result, alreadyDug: false, streak: digStreak(me.id, day) })
})

// what friends dug today — a gentle conversation starter (best-effort, same calendar day)
dailyRoutes.get('/friends', c => {
  const me = ensureFresh(c.get('user'))
  const day = me.last_day!
  const rows = db.prepare(
    `SELECT u.name, d.result FROM daily_dig d
     JOIN friendships f ON f.friend_id=d.user_id AND f.user_id=?
     JOIN users u ON u.id=d.user_id
     WHERE d.day=? ORDER BY d.ts DESC LIMIT 20`,
  ).all(me.id, day) as { name: string; result: string }[]
  const digs = rows.map(r => {
    const res = JSON.parse(r.result) as DigResultDto
    return { name: r.name, emoji: res.emoji, ru: res.ru, tier: res.tier }
  })
  return c.json({ digs })
})

// mark today's dig as shared (used by the share card flow to grant the one-time share reward elsewhere)
dailyRoutes.post('/shared', c => {
  const me = ensureFresh(c.get('user'))
  db.prepare('UPDATE daily_dig SET shared=1 WHERE user_id=? AND day=?').run(me.id, me.last_day!)
  return c.json({ ok: true })
})
