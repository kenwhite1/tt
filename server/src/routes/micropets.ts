// Micropets module: Professor Oat's Lab egg loop, playland, micropedia, pet-profile data.
// Built by the micropets module agent, see docs/ARCHITECTURE.md
import { Hono } from 'hono'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from '../../../shared/constants'
import { db } from '../db'
import { ensureFresh } from '../engine/day'
import type { Env } from '../env'
import type { GoalRow, PetRow, WalkRow } from '../engine/rows'

// ----- content (loaded locally with full shape; content.ts types it minimally) -----
interface Variant { id: string; ru_color: string; hex: string }
interface Species {
 id: string; ru_name: string; species_ru: string; variants: Variant[]
 origin: string; event_hint?: string; ru_description: string; emoji_hint: string
}
const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content')
const mp = JSON.parse(readFileSync(join(contentDir, 'micropets.json'), 'utf8')) as
 { natures: string[]; species: Species[] }
const speciesById = new Map(mp.species.map(s => [s.id, s]))

// ----- rows -----
interface MicropetRow {
 id: number; user_id: number; species_id: string; variant: string; name: string
 pronouns: string; nature: string; walks: number; forever_baby: number
 equipped: number; hatched_day: string
}
interface EggRow { user_id: number; goal_id: number | null; progress: number }

function petDto(r: MicropetRow) {
 const sp = speciesById.get(r.species_id)
 const v = sp?.variants.find(x => x.id === r.variant) ?? sp?.variants[0]
 return {
 id: r.id,
 speciesId: r.species_id,
 speciesName: sp?.ru_name ?? r.species_id,
 speciesRu: sp?.species_ru ?? '',
 name: r.name,
 pronouns: r.pronouns,
 nature: r.nature,
 walks: r.walks,
 adult: r.walks >= C.MICROPET_ADULT_WALKS && !r.forever_baby,
 foreverBaby: !!r.forever_baby,
 equipped: !!r.equipped,
 hatchedDay: r.hatched_day,
 variantId: v?.id ?? '',
 variantHex: v?.hex ?? '#C9A3E0',
 variantColor: v?.ru_color ?? '',
 description: sp?.ru_description ?? '',
 emoji: sp?.emoji_hint ?? '🐾',
 }
}
export type MicropetDtoServer = ReturnType<typeof petDto>

// The egg row is auto-offered: it always exists (goal_id null = waiting to be linked).
// eggs.progress stores the BASELINE = the goal's total completion count at link time,
// so relinking always restarts the visible progress at 0/7.
function eggState(userId: number) {
 db.prepare('INSERT OR IGNORE INTO eggs (user_id) VALUES (?)').run(userId)
 const egg = db.prepare('SELECT * FROM eggs WHERE user_id=?').get(userId) as EggRow
 let progress = 0
 let goal: GoalRow | undefined
 if (egg.goal_id != null) {
 goal = db.prepare('SELECT * FROM goals WHERE id=?').get(egg.goal_id) as GoalRow | undefined
 const total = (db.prepare('SELECT COUNT(*) n FROM goal_completions WHERE goal_id=?')
 .get(egg.goal_id) as { n: number }).n
 progress = Math.min(C.EGG_HATCH_COMPLETIONS, Math.max(0, total - egg.progress))
 }
 return {
 goalId: egg.goal_id,
 goalTitle: goal?.title ?? null,
 goalEmoji: goal?.emoji ?? null,
 progress,
 target: C.EGG_HATCH_COMPLETIONS,
 canHatch: egg.goal_id != null && progress >= C.EGG_HATCH_COMPLETIONS,
 }
}

// Lazy walk accrual for the equipped micropet: once per game day, when the day's
// walk is over, credit the currently equipped pet. The (user, 'micropet_walk', day)
// marker in reminder_log guarantees exactly-once crediting.
function syncEquippedWalk(userId: number, day: string) {
 const w = db.prepare('SELECT * FROM walks WHERE user_id=? AND day=? ORDER BY id DESC LIMIT 1')
 .get(userId, day) as WalkRow | undefined
 if (!w) return
 if (!w.completed && w.ends_ts > Date.now()) return
 const r = db.prepare("INSERT OR IGNORE INTO reminder_log (user_id, kind, day) VALUES (?, 'micropet_walk', ?)")
 .run(userId, day)
 if (r.changes > 0) {
 db.prepare('UPDATE user_micropets SET walks=walks+1 WHERE user_id=? AND equipped=1').run(userId)
 }
}

function getPet(userId: number, id: number): MicropetRow | undefined {
 return db.prepare('SELECT * FROM user_micropets WHERE id=? AND user_id=?')
 .get(id, userId) as MicropetRow | undefined
}

export const micropetsRoutes = new Hono<Env>()

// Playland payload: pets, equipped, egg, micropedia counters.
micropetsRoutes.get('/', c => {
 const user = ensureFresh(c.get('user'))
 syncEquippedWalk(user.id, user.last_day!)
 const rows = db.prepare('SELECT * FROM user_micropets WHERE user_id=? ORDER BY id')
 .all(user.id) as MicropetRow[]
 const owned = new Set(rows.map(r => r.species_id))
 return c.json({
 egg: eggState(user.id),
 pets: rows.map(petDto),
 equippedId: rows.find(r => r.equipped)?.id ?? null,
 ownedSpecies: owned.size,
 speciesTotal: mp.species.length,
 playlandMax: C.MICROPETS_IN_PLAYLAND,
 })
})

// Link (or relink) the egg to a goal. Baseline = the goal's lifetime completion
// count right now → visible progress resets to 0/7 on every (re)link.
micropetsRoutes.post('/egg/link', async c => {
 const body = z.object({ goalId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const goal = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?')
 .get(body.data.goalId, user.id) as GoalRow | undefined
 if (!goal || goal.archived) return c.json({ error: 'goal_not_found' }, 404)
 db.prepare('INSERT OR IGNORE INTO eggs (user_id) VALUES (?)').run(user.id)
 const total = (db.prepare('SELECT COUNT(*) n FROM goal_completions WHERE goal_id=?')
 .get(goal.id) as { n: number }).n
 db.prepare('UPDATE eggs SET goal_id=?, progress=? WHERE user_id=?').run(goal.id, total, user.id)
 return c.json({ egg: eggState(user.id) })
})

// Hatch: uniform random over ALL species (common + seasonal + referral cow),
// random variant, random nature; duplicates allowed. A fresh unlinked egg is
// auto-offered immediately.
micropetsRoutes.post('/egg/hatch', c => {
 const user = ensureFresh(c.get('user'))
 const egg = eggState(user.id)
 if (!egg.canHatch) return c.json({ error: 'not_ready' }, 400)
 const sp = mp.species[Math.floor(Math.random() * mp.species.length)]
 const variant = sp.variants[Math.floor(Math.random() * sp.variants.length)]
 const nature = mp.natures[Math.floor(Math.random() * mp.natures.length)]
 const name = sp.ru_name.split(' ')[0]
 const r = db.prepare(
 'INSERT INTO user_micropets (user_id, species_id, variant, name, nature, hatched_day) VALUES (?,?,?,?,?,?)',
 ).run(user.id, sp.id, variant.id, name, nature, user.last_day)
 db.prepare('UPDATE eggs SET goal_id=NULL, progress=0 WHERE user_id=?').run(user.id)
 const row = db.prepare('SELECT * FROM user_micropets WHERE id=?').get(r.lastInsertRowid) as MicropetRow
 return c.json({ pet: petDto(row), egg: eggState(user.id) })
})

// Equip, exactly one companion at a time. {on:false} = leave everyone home.
micropetsRoutes.post('/:id/equip', async c => {
 const body = z.object({ on: z.boolean().optional() }).safeParse(await c.req.json().catch(() => ({})))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const id = Number(c.req.param('id'))
 const row = getPet(user.id, id)
 if (!row) return c.json({ error: 'not_found' }, 404)
 const on = body.data.on !== false
 db.prepare('UPDATE user_micropets SET equipped=0 WHERE user_id=?').run(user.id)
 if (on) db.prepare('UPDATE user_micropets SET equipped=1 WHERE id=?').run(id)
 return c.json({ equippedId: on ? id : null })
})

micropetsRoutes.post('/:id/rename', async c => {
 const body = z.object({
 name: z.string().min(1).max(30),
 pronouns: z.enum(['he', 'she', 'they']).optional(),
 }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const id = Number(c.req.param('id'))
 const row = getPet(user.id, id)
 if (!row) return c.json({ error: 'not_found' }, 404)
 db.prepare('UPDATE user_micropets SET name=?, pronouns=? WHERE id=?')
 .run(body.data.name.trim(), body.data.pronouns ?? row.pronouns, id)
 return c.json({ pet: petDto(getPet(user.id, id)!) })
})

// "Вечный малыш", keep the pet a baby forever (toggle hidden once adult).
micropetsRoutes.post('/:id/forever-baby', async c => {
 const body = z.object({ on: z.boolean() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const id = Number(c.req.param('id'))
 const row = getPet(user.id, id)
 if (!row) return c.json({ error: 'not_found' }, 404)
 db.prepare('UPDATE user_micropets SET forever_baby=? WHERE id=?').run(body.data.on ? 1 : 0, id)
 return c.json({ pet: petDto(getPet(user.id, id)!) })
})

micropetsRoutes.post('/:id/release', c => {
 const user = ensureFresh(c.get('user'))
 const id = Number(c.req.param('id'))
 const row = getPet(user.id, id)
 if (!row) return c.json({ error: 'not_found' }, 404)
 db.prepare('DELETE FROM user_micropets WHERE id=?').run(id)
 return c.json({ released: true })
})

// Micropedia: all species in index order; unknown ones masked as «???».
micropetsRoutes.get('/micropedia', c => {
 const user = ensureFresh(c.get('user'))
 const rows = db.prepare(
 'SELECT species_id, variant, COUNT(*) n FROM user_micropets WHERE user_id=? GROUP BY species_id, variant',
 ).all(user.id) as { species_id: string; variant: string; n: number }[]
 const bySpecies = new Map<string, Map<string, number>>()
 for (const r of rows) {
 if (!bySpecies.has(r.species_id)) bySpecies.set(r.species_id, new Map())
 bySpecies.get(r.species_id)!.set(r.variant, r.n)
 }
 const species = mp.species.map(s => {
 const ownedVariants = bySpecies.get(s.id)
 const known = !!ownedVariants
 let dupes = 0
 if (ownedVariants) for (const n of ownedVariants.values()) dupes += n
 return {
 id: s.id,
 ruName: known ? s.ru_name : '???',
 speciesRu: known ? s.species_ru : '',
 emoji: known ? s.emoji_hint : '❓',
 known,
 count: dupes,
 origin: s.origin,
 eventHint: known ? (s.event_hint ?? null) : null,
 description: known ? s.ru_description : '',
 variants: s.variants.map(v => ({
 id: v.id, hex: v.hex, ruColor: known ? v.ru_color : '',
 owned: (ownedVariants?.get(v.id) ?? 0) > 0,
 count: ownedVariants?.get(v.id) ?? 0,
 })),
 }
 })
 return c.json({ species, owned: bySpecies.size, total: mp.species.length })
})

// Challenge badges (written by the quests module; read lazily here for the profile tab).
micropetsRoutes.get('/badges', c => {
 const user = ensureFresh(c.get('user'))
 const badges = db.prepare('SELECT badge_id, ts FROM badges WHERE user_id=? ORDER BY ts DESC')
 .all(user.id) as { badge_id: string; ts: number }[]
 return c.json({ badges: badges.map(b => ({ id: b.badge_id, ts: b.ts })) })
})

// Profile extras for the Щенок tab: lifetime stones (ledger faucet sum) + personality dims.
micropetsRoutes.get('/profile', c => {
 const user = ensureFresh(c.get('user'))
 const pet = db.prepare('SELECT * FROM pets WHERE user_id=?').get(user.id) as PetRow
 const earned = db.prepare('SELECT COALESCE(SUM(delta),0) s FROM ledger WHERE user_id=? AND delta>0')
 .get(user.id) as { s: number }
 let personality: Record<string, number> = {}
 try { personality = JSON.parse(pet.personality) as Record<string, number> } catch { /* empty */ }
 return c.json({ lifetimeStones: earned.s, personality, trait: pet.trait })
})
