// Travel module: «Хвост-трэвел» travel agency (кошка Сасси), flights, walk-return chat,
// locations logbook + discoveries. See docs/ARCHITECTURE.md + SPEC.md §4 travel rows.
import { Hono } from 'hono'
import { z } from 'zod'
import { C, stageForWalks, type Stage } from '../../../shared/constants'
import { db } from '../db'
import { content } from '../content'
import { addStones } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { hasPlus } from '../env'
import type { Env } from '../env'
import type { PetRow, UserRow, WalkRow } from '../engine/rows'

export const travelRoutes = new Hono<Env>()

// Stones for finishing the post-walk chat (small fixed bonus, per module brief).
const CHAT_STONES = 5

// ===== content (typed locally, content.ts keeps narrow types) =====
interface LocItem { id: string; ru_name: string; price: number }
interface Loc {
 id: string
 ru_name: string
 region_ru: string
 is_start?: boolean
 palette: { sky: string; ground: string; accent: string }
 progress_per_walk: number
 exclusive_clothing: LocItem[]
 exclusive_furniture: LocItem[]
}
interface Discovery { id: string; ru_name: string; category: string; location_id: string | null }

const LOCATIONS = (content.locations as unknown as { locations: Loc[] }).locations
const LOC_BY_ID = new Map(LOCATIONS.map(l => [l.id, l]))
const STORIES = content.stories.generic
const DISCOVERIES = content.stories.discoveries as unknown as Discovery[]
const DISCOVERY_BY_ID = new Map(DISCOVERIES.map(d => [d.id, d]))

// users table gained travel columns in 002_world.sql (rows.ts predates them)
type TravelUser = UserRow & { queued_flight: string | null; flights_total: number }

// ===== deterministic daily rotation =====
function hash32(s: string): number {
 let h = 2166136261 >>> 0
 for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
 return h >>> 0
}
function mulberry32(seed: number) {
 let a = seed >>> 0
 return () => {
 a = (a + 0x6d2b79f5) | 0
 let t = Math.imul(a ^ (a >>> 15), 1 | a)
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296
 }
}
// Free choices are always a prefix of the Plus choices (same seed, same shuffle).
function rotationFor(user: TravelUser, count: number): Loc[] {
 const rnd = mulberry32(hash32(`${user.id}:${user.last_day}:travel`))
 const pool = LOCATIONS.filter(l => l.id !== user.location_id)
 for (let i = pool.length - 1; i > 0; i--) {
 const j = Math.floor(rnd() * (i + 1))
 ;[pool[i], pool[j]] = [pool[j], pool[i]]
 }
 return pool.slice(0, count)
}

// ===== helpers =====
const getPet = (userId: number) => db.prepare('SELECT * FROM pets WHERE user_id=?').get(userId) as PetRow

function travelUnlocked(pet: PetRow): boolean {
 return pet.walks >= C.STAGE_AT_WALKS.child
}

function flightPrice(user: TravelUser, locationId: string): number {
 if (user.flights_total === 0) return 0 // first-ever flight is free
 return locationId === 'puppy_forest' ? C.FLIGHT_HOME_COST : C.FLIGHT_COST
}

function locationPct(userId: number, loc: Loc): number {
 const r = db.prepare('SELECT COUNT(*) n FROM walks WHERE user_id=? AND location_id=? AND completed=1')
 .get(userId, loc.id) as { n: number }
 return Math.min(100, Math.round(r.n * loc.progress_per_walk * 10) / 10)
}

function discoveriesFoundAt(userId: number, locationId: string): number {
 const r = db.prepare('SELECT COUNT(*) n FROM user_discoveries WHERE user_id=? AND location_id=?')
 .get(userId, locationId) as { n: number }
 return r.n
}

function walkTodayExists(userId: number, day: string): boolean {
 return !!db.prepare('SELECT id FROM walks WHERE user_id=? AND day=? LIMIT 1').get(userId, day)
}

// Creates the day's walk at the destination (the flight IS the walk), moves the user there.
function startFlightWalk(userId: number, locationId: string, stage: Stage, day: string) {
 const start = Date.now()
 const ends = start + C.WALK_HOURS[stage] * 3_600_000
 db.prepare('INSERT INTO walks (user_id, day, location_id, started_ts, ends_ts) VALUES (?,?,?,?,?)')
 .run(userId, day, locationId, start, ends)
 db.prepare('UPDATE users SET location_id=?, queued_flight=NULL WHERE id=?').run(locationId, userId)
 db.prepare('INSERT OR IGNORE INTO location_progress (user_id, location_id, first_visit_day) VALUES (?,?,?)')
 .run(userId, locationId, day)
}

// Lazy queued-flight application: ticket bought after today's walk departs at the next
// full-energy moment. Called at the top of every GET in this module.
function applyQueuedFlight(userRaw: UserRow): TravelUser {
 const user = ensureFresh(userRaw) as TravelUser
 if (!user.queued_flight || !LOC_BY_ID.has(user.queued_flight)) return user
 const day = user.last_day!
 if (walkTodayExists(user.id, day)) return user
 const pet = getPet(user.id)
 const stage = stageForWalks(pet.walks)
 if (user.energy < C.ENERGY_BAR[stage]) return user
 const dest = user.queued_flight
 db.transaction(() => startFlightWalk(user.id, dest, stage, day))()
 return { ...user, location_id: dest, queued_flight: null }
}

function locCard(user: TravelUser, loc: Loc) {
 return {
 id: loc.id,
 ruName: loc.ru_name,
 regionRu: loc.region_ru,
 palette: loc.palette,
 pct: locationPct(user.id, loc),
 discoveriesFound: discoveriesFoundAt(user.id, loc.id),
 }
}

// ===== GET /agency, Сасси's daily destination rotation =====
travelRoutes.get('/agency', c => {
 const user = applyQueuedFlight(c.get('user'))
 const pet = getPet(user.id)
 if (!travelUnlocked(pet)) {
 return c.json({
 unlocked: false,
 walksNow: pet.walks,
 walksNeed: C.STAGE_AT_WALKS.child,
 stones: user.stones,
 })
 }
 const count = hasPlus(user) ? C.TRAVEL_CHOICES_PLUS : C.TRAVEL_CHOICES_FREE
 const current = LOC_BY_ID.get(user.location_id)
 const queued = user.queued_flight ? LOC_BY_ID.get(user.queued_flight) : null
 return c.json({
 unlocked: true,
 stones: user.stones,
 firstFlightFree: user.flights_total === 0,
 current: current ? locCard(user, current) : null,
 queued: queued ? { id: queued.id, ruName: queued.ru_name } : null,
 destinations: rotationFor(user, count).map(loc => ({
 ...locCard(user, loc),
 price: flightPrice(user, loc.id),
 clothing: loc.exclusive_clothing.map(i => ({ ruName: i.ru_name, price: i.price })),
 furniture: loc.exclusive_furniture.map(i => ({ ruName: i.ru_name, price: i.price })),
 })),
 })
})

// ===== POST /fly, buy a one-way ticket =====
travelRoutes.post('/fly', async c => {
 const body = z.object({ locationId: z.string().min(1).max(40) }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user')) as TravelUser
 const pet = getPet(user.id)
 if (!travelUnlocked(pet)) return c.json({ error: 'locked' }, 400)
 if (user.queued_flight) return c.json({ error: 'flight_already_queued' }, 400)
 const dest = LOC_BY_ID.get(body.data.locationId)
 if (!dest || dest.id === user.location_id) return c.json({ error: 'not_available' }, 400)
 const count = hasPlus(user) ? C.TRAVEL_CHOICES_PLUS : C.TRAVEL_CHOICES_FREE
 if (!rotationFor(user, count).some(l => l.id === dest.id)) return c.json({ error: 'not_in_rotation' }, 400)
 const price = flightPrice(user, dest.id)
 if (user.stones < price) return c.json({ error: 'not_enough_stones' }, 400)

 const day = user.last_day!
 const stage = stageForWalks(pet.walks)
 const departNow = !walkTodayExists(user.id, day) && user.energy >= C.ENERGY_BAR[stage]
 db.transaction(() => {
 if (price > 0) addStones(user.id, -price, 'flight')
 db.prepare('UPDATE users SET flights_total=flights_total+1 WHERE id=?').run(user.id)
 if (departNow) startFlightWalk(user.id, dest.id, stage, day)
 else db.prepare('UPDATE users SET queued_flight=? WHERE id=?').run(dest.id, user.id)
 })()
 return c.json({ ok: true, departed: departNow, queued: !departNow, price, destination: { id: dest.id, ruName: dest.ru_name } })
})

// ===== walk-return chat (once-a-day post-walk story) =====
function getWalk(userId: number, walkId: number): WalkRow | undefined {
 return db.prepare('SELECT * FROM walks WHERE id=? AND user_id=?').get(walkId, userId) as WalkRow | undefined
}

function ensureStory(walk: WalkRow): typeof STORIES[number] {
 let story = walk.story_id ? STORIES.find(s => s.id === walk.story_id) : undefined
 if (!story) {
 story = STORIES[Math.floor(Math.random() * STORIES.length)]
 db.prepare('UPDATE walks SET story_id=? WHERE id=?').run(story.id, walk.id)
 walk.story_id = story.id
 }
 return story
}

travelRoutes.get('/chat/:walkId', c => {
 const user = applyQueuedFlight(c.get('user'))
 const walk = getWalk(user.id, Number(c.req.param('walkId')))
 if (!walk) return c.json({ error: 'not_found' }, 404)
 if (!walk.completed && walk.ends_ts > Date.now()) return c.json({ error: 'walk_in_progress' }, 400)
 if (walk.chat_done) return c.json({ done: true })
 const story = ensureStory(walk)
 return c.json({
 done: false,
 story: {
 ruText: story.ru_text,
 replies: story.replies.map(r => r.ru),
 customAllowed: true,
 },
 })
})

travelRoutes.post('/chat/:walkId', async c => {
 const body = z.object({
 replyIdx: z.number().int().min(0).max(7).optional(),
 custom: z.string().min(1).max(500).optional(),
 }).safeParse(await c.req.json().catch(() => null))
 if (!body.success || (body.data.replyIdx === undefined) === (body.data.custom === undefined)) {
 return c.json({ error: 'bad_request' }, 400)
 }
 const user = ensureFresh(c.get('user')) as TravelUser
 const walk = getWalk(user.id, Number(c.req.param('walkId')))
 if (!walk) return c.json({ error: 'not_found' }, 404)
 if (!walk.completed && walk.ends_ts > Date.now()) return c.json({ error: 'walk_in_progress' }, 400)
 if (walk.chat_done) return c.json({ error: 'already_done' }, 400)
 const story = ensureStory(walk)
 const isCustom = body.data.custom !== undefined
 if (!isCustom && body.data.replyIdx! >= story.replies.length) return c.json({ error: 'bad_request' }, 400)

 let discoveryCard: { id: string; ruName: string; category: string; liked: boolean } | null = null
 db.transaction(() => {
 db.prepare('UPDATE walks SET chat_done=1 WHERE id=?').run(walk.id)
 if (!isCustom) {
 // chosen reply grows the puppy's personality along its dimension
 const dim = story.replies[body.data.replyIdx!].dim
 const pet = getPet(user.id)
 let personality: Record<string, number>
 try { personality = JSON.parse(pet.personality || '{}') as Record<string, number> } catch { personality = {} }
 personality[dim] = (personality[dim] ?? 0) + 1
 db.prepare('UPDATE pets SET personality=? WHERE user_id=?').run(JSON.stringify(personality), user.id)

 // discovery: likes/dislikes are the puppy's own (70/30), never reply-driven.
 // custom replies skip the discovery entirely, consent feature (SPEC §4).
 const disc = story.discovery_id ? DISCOVERY_BY_ID.get(story.discovery_id) : undefined
 if (disc) {
 const existing = db.prepare('SELECT liked FROM user_discoveries WHERE user_id=? AND discovery_id=?')
 .get(user.id, disc.id) as { liked: number } | undefined
 const liked = existing ? !!existing.liked : Math.random() < 0.7
 if (!existing) {
 db.prepare('INSERT INTO user_discoveries (user_id, discovery_id, liked, day, location_id) VALUES (?,?,?,?,?)')
 .run(user.id, disc.id, liked ? 1 : 0, user.last_day, user.location_id)
 }
 db.prepare('UPDATE walks SET discovery_id=? WHERE id=?').run(disc.id, walk.id)
 discoveryCard = { id: disc.id, ruName: disc.ru_name, category: disc.category, liked }
 }
 }
 addStones(user.id, CHAT_STONES, 'walk_chat')
 })()
 return c.json({ stones: CHAT_STONES, discovery: discoveryCard })
})

// ===== GET /logbook, all 27 locations («???» for unvisited). Also consumed by Pet.tsx. =====
travelRoutes.get('/logbook', c => {
 const user = applyQueuedFlight(c.get('user'))
 const walked = new Set(
 (db.prepare('SELECT DISTINCT location_id id FROM walks WHERE user_id=?').all(user.id) as { id: string }[]).map(r => r.id),
 )
 const progressed = new Set(
 (db.prepare('SELECT location_id id FROM location_progress WHERE user_id=?').all(user.id) as { id: string }[]).map(r => r.id),
 )
 const locations = LOCATIONS.map(loc => {
 const visited = !!loc.is_start || loc.id === user.location_id || walked.has(loc.id) || progressed.has(loc.id)
 if (!visited) return { id: loc.id, visited: false as const }
 return {
 ...locCard(user, loc),
 visited: true as const,
 current: loc.id === user.location_id,
 }
 })
 return c.json({
 total: LOCATIONS.length,
 visitedCount: locations.filter(l => l.visited).length,
 locations,
 })
})

// ===== GET /discoveries, the likes/dislikes logbook. Also consumed by Pet.tsx. =====
travelRoutes.get('/discoveries', c => {
 const user = applyQueuedFlight(c.get('user'))
 const rows = db.prepare('SELECT discovery_id, liked, day, location_id FROM user_discoveries WHERE user_id=? ORDER BY day DESC, rowid DESC')
 .all(user.id) as { discovery_id: string; liked: number; day: string; location_id: string | null }[]
 const discoveries = rows.flatMap(r => {
 const d = DISCOVERY_BY_ID.get(r.discovery_id)
 if (!d) return []
 const loc = r.location_id ? LOC_BY_ID.get(r.location_id) : undefined
 return [{
 id: d.id,
 ruName: d.ru_name,
 category: d.category,
 liked: !!r.liked,
 day: r.day,
 locationRu: loc?.ru_name ?? null,
 }]
 })
 return c.json({ total: DISCOVERIES.length, found: discoveries.length, discoveries })
})
