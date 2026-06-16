// Seasonal events: a 30-day reward calendar per season (Finch seasonal event 1:1).
// Four events rotate by month: «Летний дворик» (6-8), «Осенний лес» (9-11), «Зимняя сказка»
// (12-2), «Весенний сад» (3-5). 1 reward per day earned by a completed walk; free + Plus
// columns; chests with 4/10-color choice; micropet days; 14-day post-month claim window.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { z } from 'zod'
import { C } from '../../../shared/constants'
import { db } from '../db'
import { addStones } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { hasPlus, type Env } from '../env'
import type { UserRow } from '../engine/rows'

// ===== content (typed locally, per ARCHITECTURE.md) =====
const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content')
const loadJson = <T>(name: string): T => JSON.parse(readFileSync(join(contentDir, name), 'utf8')) as T

interface RewardSpec { kind: 'chest_clothing' | 'chest_furniture' | 'chest_black' | 'chest' | 'stones' | 'micropet' | 'item'; amount?: number; item_ref?: string }
interface EventDayDef { day: number; free: RewardSpec; plus: RewardSpec }
interface EventJson {
  id: string; ru_name: string; days: EventDayDef[]; item_set_ids: string[]; micropet_id: string
  months?: number[]; collection_clothing?: string; collection_furniture?: string
}
interface PaletteColor { id: string; ru: string; hex: string }
interface ContentItem { id: string; ru_name: string; slot: string; price: number; collection: string }
interface SpeciesVariant { id: string; ru_color: string; hex: string }
interface Species { id: string; ru_name: string; species_ru: string; variants: SpeciesVariant[]; emoji_hint?: string }

const challenges = loadJson<{ event: EventJson; events?: EventJson[] }>('challenges.json')
const EVENTS: EventJson[] = challenges.events?.length ? challenges.events : [challenges.event]
const clothingJson = loadJson<{ palette10: PaletteColor[]; items: ContentItem[] }>('items_clothing.json')
const furnitureJson = loadJson<{ items: ContentItem[] }>('items_furniture.json')
const micropetsJson = loadJson<{ natures: string[]; species: Species[] }>('micropets.json')

const PALETTE = clothingJson.palette10

// Per-event pools, computed once per event id.
interface Pools { clothing: ContentItem[]; furniture: ContentItem[]; species: Species | undefined }
const poolsCache = new Map<string, Pools>()
function poolsFor(ev: EventJson): Pools {
  let p = poolsCache.get(ev.id)
  if (!p) {
    p = {
      clothing: clothingJson.items.filter(i => i.collection === (ev.collection_clothing ?? 'summer_yard')),
      furniture: furnitureJson.items.filter(i => i.collection === (ev.collection_furniture ?? 'leto')),
      species: micropetsJson.species.find(s => s.id === ev.micropet_id),
    }
    poolsCache.set(ev.id, p)
  }
  return p
}

// Pick the event active in a given month-key (fallback to the first event).
function eventForMonth(mk: string): EventJson {
  const m = Number(mk.slice(5, 7))
  return EVENTS.find(e => Array.isArray(e.months) && e.months.includes(m)) ?? EVENTS[0]
}

// Legacy summer Plus-column refs → real catalog items; new events reference real ids directly.
const PLUS_REF: Record<string, { kind: 'clothing' | 'furniture'; id: string }> = {
  yard_straw_hat: { kind: 'clothing', id: 'shlyapa_solomennaya' },
  yard_cherry_sunglasses: { kind: 'clothing', id: 'ochki_solnechnye' },
  yard_gingham_shirt: { kind: 'clothing', id: 'mayka_s_ananasom' },
  yard_garden_sandals: { kind: 'clothing', id: 'shlyopantsy_lyagushata' },
  yard_daisy_sundress: { kind: 'clothing', id: 'plate_polevye_tsvety' },
  yard_lemonade_glass: { kind: 'clothing', id: 'stakan_limonada' },
  yard_picnic_rug: { kind: 'furniture', id: 'rug_limonnaya_dolka' },
  yard_strawberry_clock: { kind: 'furniture', id: 'clock_arbuz' },
  yard_sunflower_wall: { kind: 'furniture', id: 'wi_zerkalo_solnyshko' },
  yard_hammock_bed: { kind: 'furniture', id: 'bed_gamachok' },
  yard_firefly_garland: { kind: 'furniture', id: 'lamp_solntse' },
  yard_veranda_door: { kind: 'furniture', id: 'door_plyazhnyye_doski' },
}

interface ItemRef { kind: 'clothing' | 'furniture'; id: string; ru_name: string }

function resolveRef(ref: string): ItemRef | null {
  const m = PLUS_REF[ref]
  if (m) {
    const list = m.kind === 'clothing' ? clothingJson.items : furnitureJson.items
    const it = list.find(i => i.id === m.id)
    return it ? { kind: m.kind, id: it.id, ru_name: it.ru_name } : null
  }
  // direct catalog id (new seasonal events)
  const cl = clothingJson.items.find(i => i.id === ref)
  if (cl) return { kind: 'clothing', id: cl.id, ru_name: cl.ru_name }
  const fu = furnitureJson.items.find(i => i.id === ref)
  if (fu) return { kind: 'furniture', id: fu.id, ru_name: fu.ru_name }
  return null
}

// ===== date helpers (game-day strings YYYY-MM-DD) =====
function monthEnd(mk: string): string {
  const [y, m] = mk.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}
function daysInMonth(mk: string): number {
  return Number(monthEnd(mk).slice(8, 10))
}
function prevMonthKey(mk: string): string {
  const [y, m] = mk.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ===== per-user event state (event_state table; claimed = JSON array) =====
interface ClaimEntry {
  day: number
  column: 'free' | 'plus'
  kind: 'stones' | 'item' | 'micropet'
  stones?: number
  item?: ItemRef
  colors?: string[]
  color?: string
  pending?: boolean
}

const eventKey = (ev: EventJson, mk: string) => `${ev.id}:${mk}`

function readState(uid: number, mk: string, ev: EventJson): { daysEarned: number; claimed: ClaimEntry[] } {
  const key = eventKey(ev, mk)
  db.prepare('INSERT OR IGNORE INTO event_state (user_id, event_id) VALUES (?,?)').run(uid, key)
  const row = db.prepare('SELECT days_earned, claimed FROM event_state WHERE user_id=? AND event_id=?')
    .get(uid, key) as { days_earned: number; claimed: string }
  let claimed: ClaimEntry[] = []
  try { claimed = JSON.parse(row.claimed) as ClaimEntry[] } catch { /* keep [] */ }
  return { daysEarned: row.days_earned, claimed }
}

function writeClaimed(uid: number, mk: string, ev: EventJson, claimed: ClaimEntry[]) {
  db.prepare('UPDATE event_state SET claimed=? WHERE user_id=? AND event_id=?')
    .run(JSON.stringify(claimed), uid, eventKey(ev, mk))
}

// Lazy credit: distinct days with a completed walk inside the event month.
function creditDays(uid: number, mk: string, today: string, ev: EventJson): number {
  const row = db.prepare(
    `SELECT COUNT(DISTINCT day) n FROM walks
     WHERE user_id=? AND day>=? AND day<=? AND (completed=1 OR ends_ts<=?)`,
  ).get(uid, `${mk}-01`, monthEnd(mk), Date.now()) as { n: number }
  const n = Math.min(row.n, Math.min(ev.days.length, daysInMonth(mk)))
  db.prepare('UPDATE event_state SET days_earned=?, last_credit_day=? WHERE user_id=? AND event_id=?')
    .run(n, today, uid, eventKey(ev, mk))
  return n
}

// ===== visibility =====
function hiddenReason(user: UserRow): { reason: string; unlockIn?: number } | null {
  let settings: Record<string, unknown> = {}
  try { settings = JSON.parse(user.settings) as Record<string, unknown> } catch { /* {} */ }
  if (settings.seasonal_events === false) return { reason: 'disabled' }
  const ageDays = Math.floor((Date.now() - Date.parse(user.created_at)) / 86_400_000)
  if (ageDays < C.EVENT_UNLOCK_AFTER_DAYS) return { reason: 'too_new', unlockIn: C.EVENT_UNLOCK_AFTER_DAYS - ageDays }
  return null
}

function pastWindowOpen(prevMk: string, today: string): boolean {
  return today <= shiftDate(monthEnd(prevMk), C.EVENT_CLAIM_WINDOW_DAYS)
}

function resolveMonth(user: UserRow, requested: string | undefined): { mk: string; isCurrent: boolean } | null {
  const cur = user.last_day!.slice(0, 7)
  if (!requested || requested === cur) return { mk: cur, isCurrent: true }
  const prev = prevMonthKey(cur)
  if (requested === prev && pastWindowOpen(prev, user.last_day!)) return { mk: prev, isCurrent: false }
  return null
}

const colorOpts = (ids: string[]) =>
  ids.map(id => PALETTE.find(p => p.id === id)).filter((p): p is PaletteColor => !!p)

function pickColorIds(n: number): string[] {
  const ids = PALETTE.map(p => p.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids.slice(0, n)
}

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function rollChestItem(spec: RewardSpec, pools: Pools): ItemRef {
  const cloth = pools.clothing.length ? pools.clothing : clothingJson.items
  const furn = pools.furniture.length ? pools.furniture : furnitureJson.items
  if (spec.kind === 'chest_clothing') {
    const it = rand(cloth)
    return { kind: 'clothing', id: it.id, ru_name: it.ru_name }
  }
  if (spec.kind === 'chest_furniture') {
    const it = rand(furn)
    return { kind: 'furniture', id: it.id, ru_name: it.ru_name }
  }
  const fromClothing = Math.random() < cloth.length / (cloth.length + furn.length)
  const it = fromClothing ? rand(cloth) : rand(furn)
  return { kind: fromClothing ? 'clothing' : 'furniture', id: it.id, ru_name: it.ru_name }
}

function specSummary(spec: RewardSpec) {
  if (spec.kind === 'stones') return { kind: 'stones', amount: spec.amount ?? 25 }
  if (spec.kind === 'item') {
    const it = spec.item_ref ? resolveRef(spec.item_ref) : null
    return { kind: 'item', itemName: it?.ru_name ?? 'Подарок' }
  }
  return { kind: spec.kind }
}

type CellState = 'locked' | 'claimable' | 'pending' | 'claimed' | 'plus_locked'

function cellState(entry: ClaimEntry | undefined, day: number, daysEarned: number): CellState {
  if (entry && !entry.pending) return 'claimed'
  if (entry?.pending) return 'pending'
  return day <= daysEarned ? 'claimable' : 'locked'
}

// ===== routes =====
export const eventsRoutes = new Hono<Env>()

eventsRoutes.get('/', c => {
  const user = ensureFresh(c.get('user'))
  const today = user.last_day!
  const hidden = hiddenReason(user)
  if (hidden) return c.json({ hidden: true, ...hidden })

  const view = resolveMonth(user, c.req.query('month'))
  if (!view) return c.json({ error: 'month_unavailable' }, 400)
  const { mk, isCurrent } = view
  const ev = eventForMonth(mk)
  const pools = poolsFor(ev)

  const trackLen = Math.min(ev.days.length, daysInMonth(mk))
  const daysEarned = creditDays(user.id, mk, today, ev)
  const { claimed } = readState(user.id, mk, ev)
  const plus = hasPlus(user)
  const curDay = isCurrent ? Math.min(Number(today.slice(8, 10)), trackLen) : trackLen

  const days = ev.days.slice(0, trackLen).map(d => {
    const freeEntry = claimed.find(e => e.day === d.day && e.column === 'free')
    const plusEntry = claimed.find(e => e.day === d.day && e.column === 'plus')
    return {
      day: d.day,
      free: specSummary(d.free),
      plus: specSummary(d.plus),
      freeState: cellState(freeEntry, d.day, daysEarned),
      plusState: plus ? cellState(plusEntry, d.day, daysEarned) : ('plus_locked' as CellState),
    }
  })

  // Notice about last month's unclaimed rewards (14-day window) — using that month's event.
  let past: { month: string; deadline: string; unclaimed: number } | null = null
  if (isCurrent) {
    const prev = prevMonthKey(mk)
    if (pastWindowOpen(prev, today)) {
      const prevEv = eventForMonth(prev)
      const hadState = db.prepare('SELECT days_earned, claimed FROM event_state WHERE user_id=? AND event_id=?')
        .get(user.id, eventKey(prevEv, prev)) as { days_earned: number; claimed: string } | undefined
      if (hadState && hadState.days_earned > 0) {
        let prevClaimed: ClaimEntry[] = []
        try { prevClaimed = JSON.parse(hadState.claimed) as ClaimEntry[] } catch { /* [] */ }
        const cols = plus ? 2 : 1
        const unclaimed = hadState.days_earned * cols - prevClaimed.filter(e => !e.pending && (plus || e.column === 'free')).length
        if (unclaimed > 0) past = { month: prev, deadline: shiftDate(monthEnd(prev), C.EVENT_CLAIM_WINDOW_DAYS), unclaimed }
      }
    }
  }

  return c.json({
    hidden: false,
    event: {
      id: ev.id,
      name: ev.ru_name,
      month: mk,
      isCurrent,
      day: curDay,
      totalDays: trackLen,
      deadline: isCurrent ? null : shiftDate(monthEnd(mk), C.EVENT_CLAIM_WINDOW_DAYS),
    },
    daysEarned,
    plus,
    micropet: pools.species ? { name: pools.species.ru_name, emoji: pools.species.emoji_hint ?? '💛' } : null,
    days,
    past,
  })
})

const claimSchema = z.object({
  day: z.number().int().min(1).max(31),
  column: z.enum(['free', 'plus']),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

eventsRoutes.post('/claim', async c => {
  const body = claimSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  if (hiddenReason(user)) return c.json({ error: 'event_hidden' }, 403)
  const view = resolveMonth(user, body.data.month)
  if (!view) return c.json({ error: 'month_unavailable' }, 400)
  const { mk } = view
  const ev = eventForMonth(mk)
  const pools = poolsFor(ev)
  const { day, column } = body.data

  const trackLen = Math.min(ev.days.length, daysInMonth(mk))
  const def = ev.days.find(d => d.day === day)
  if (!def || day > trackLen) return c.json({ error: 'bad_day' }, 400)
  if (column === 'plus' && !hasPlus(user)) return c.json({ error: 'plus_only' }, 403)

  const daysEarned = creditDays(user.id, mk, user.last_day!, ev)
  if (day > daysEarned) return c.json({ error: 'not_earned_yet' }, 400)

  const { claimed } = readState(user.id, mk, ev)
  const existing = claimed.find(e => e.day === day && e.column === column)
  if (existing && !existing.pending) return c.json({ error: 'already_claimed' }, 400)
  if (existing?.pending && existing.item && existing.colors) {
    return c.json({ item: existing.item, colors: colorOpts(existing.colors) })
  }

  const spec = column === 'free' ? def.free : def.plus

  if (spec.kind === 'stones') {
    const amount = spec.amount ?? 25
    addStones(user.id, amount, 'event_day')
    claimed.push({ day, column, kind: 'stones', stones: amount })
    writeClaimed(user.id, mk, ev, claimed)
    return c.json({ stones: amount })
  }

  if (spec.kind === 'micropet') {
    if (!pools.species) return c.json({ error: 'no_species' }, 500)
    const sp = pools.species
    const variant = rand(sp.variants)
    const nature = micropetsJson.natures.length ? rand(micropetsJson.natures) : ''
    const petName = sp.ru_name.split(', ')[0]
    db.prepare(
      `INSERT INTO user_micropets (user_id, species_id, variant, name, pronouns, nature, hatched_day)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(user.id, sp.id, variant.id, petName, 'they', nature, user.last_day)
    claimed.push({ day, column, kind: 'micropet' })
    writeClaimed(user.id, mk, ev, claimed)
    return c.json({
      pet: {
        name: sp.ru_name,
        species: sp.species_ru,
        variant: { id: variant.id, ru: variant.ru_color, hex: variant.hex },
        emoji: sp.emoji_hint ?? '💛',
      },
    })
  }

  if (spec.kind === 'chest_black' && Math.random() * 100 < C.EVENT_CHEST_BLACK_STONES_PCT) {
    const amount = 40 + Math.floor(Math.random() * 41)
    addStones(user.id, amount, 'event_chest_black')
    claimed.push({ day, column, kind: 'stones', stones: amount })
    writeClaimed(user.id, mk, ev, claimed)
    return c.json({ stones: amount, fromChest: true })
  }

  const item = spec.kind === 'item' && spec.item_ref
    ? (resolveRef(spec.item_ref) ?? rollChestItem({ kind: 'chest' }, pools))
    : rollChestItem(spec, pools)
  const colorIds = column === 'plus' ? PALETTE.map(p => p.id) : pickColorIds(4)
  claimed.push({ day, column, kind: 'item', item, colors: colorIds, pending: true })
  writeClaimed(user.id, mk, ev, claimed)
  return c.json({ item, colors: colorOpts(colorIds) })
})

const colorSchema = claimSchema.extend({ colorId: z.string().min(1).max(30) })

eventsRoutes.post('/color', async c => {
  const body = colorSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  const view = resolveMonth(user, body.data.month)
  if (!view) return c.json({ error: 'month_unavailable' }, 400)
  const { mk } = view
  const ev = eventForMonth(mk)
  const { day, column, colorId } = body.data

  const { claimed } = readState(user.id, mk, ev)
  const entry = claimed.find(e => e.day === day && e.column === column)
  if (!entry || !entry.pending || !entry.item || !entry.colors) return c.json({ error: 'nothing_pending' }, 400)
  if (!entry.colors.includes(colorId)) return c.json({ error: 'bad_color' }, 400)

  db.prepare(
    'INSERT OR IGNORE INTO items_owned (user_id, kind, item_id, color_id, acquired_ts) VALUES (?,?,?,?,?)',
  ).run(user.id, entry.item.kind, entry.item.id, colorId, Date.now())
  entry.pending = false
  entry.color = colorId
  writeClaimed(user.id, mk, ev, claimed)
  const chosen = PALETTE.find(p => p.id === colorId)
  return c.json({ ok: true, item: entry.item, color: chosen ?? { id: colorId, ru: '', hex: '#ccc' } })
})
