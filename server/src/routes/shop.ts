// Economy module: 3 item shops (outfit / furniture / color), the Bag inventory hub,
// mail, gifting, selling, equipping (outfit slots / room slots / dyes), saved combos.
// Built by the economy module agent, see docs/ARCHITECTURE.md.
import { Hono } from 'hono'
import { z } from 'zod'
import { C, stageForWalks } from '../../../shared/constants'
import type { Stage } from '../../../shared/constants'
import { db } from '../db'
import { ensureFresh } from '../engine/day'
import { addStones } from '../engine/core'
import { hasPlus } from '../env'
import type { Env } from '../env'
import type { PetRow, UserRow } from '../engine/rows'
import { content } from '../content'

export const shopRoutes = new Hono<Env>()

// ---------- content shapes (typed locally, per ARCHITECTURE.md) ----------
interface Color { id: string; ru: string; hex: string }
interface ClothingItem { id: string; ru_name: string; slot: string; price: number; everyday: boolean; collection: string }
interface Plushie { id: string; ru_name: string; price: number }
interface DyePart { id: string; ru: string; price: number; stage_unlock: Stage; colors: Color[] }
interface FurnitureItem { id: string; ru_name: string; slot: string; price: number; everyday: boolean; collection: string }
interface FloorItem { id: string; ru_name: string; style_ru: string; hex: string; price: number }
interface WallpaperItem { id: string; ru: string; hex: string; price: number }
interface LocExclusive { id: string; ru_name: string; price: number }
interface LocationDef { id: string; ru_name: string; exclusive_clothing: LocExclusive[]; exclusive_furniture: LocExclusive[] }

const CL = content.clothing as unknown as { palette10: Color[]; items: ClothingItem[]; plushies: Plushie[]; dyes: { parts: DyePart[] } }
const FU = content.furniture as unknown as { slots: { id: string; ru: string }[]; items: FurnitureItem[]; floors: FloorItem[]; wallpapers: WallpaperItem[] }
const LOCATIONS = (content.locations as unknown as { locations: LocationDef[] }).locations

const PALETTE = CL.palette10
const DYE_PARTS = CL.dyes.parts
const DYE_COMBOS = DYE_PARTS.flatMap(part => part.colors.map(color => ({ part, color })))

const CLOTHING_SLOTS: { id: string; ru: string }[] = [
 { id: 'head', ru: 'На голову' },
 { id: 'face', ru: 'На мордочку' },
 { id: 'neck', ru: 'На шейку' },
 { id: 'top', ru: 'Верх' },
 { id: 'bottom', ru: 'Низ' },
 { id: 'full', ru: 'Целиком' },
 { id: 'feet', ru: 'На ножки' },
 { id: 'held', ru: 'В ручки' },
 { id: 'back', ru: 'На спинку' },
]
const FURNITURE_SLOTS = FU.slots // 14: 10 furniture + floor/wall/door/window

const STAGE_ORDER: Stage[] = ['baby', 'toddler', 'child', 'teen', 'adult']
const STAGE_RU: Record<Stage, string> = { baby: 'Малыш', toddler: 'Кроха', child: 'Ребёнок', teen: 'Подросток', adult: 'Взрослый' }

// Location exclusives have no slot in content, infer from RU name keywords (cosmetic only).
const CLOTHING_KEYWORDS: [RegExp, string][] = [
 [/костюм|кигуруми|юката|ханбок|саронг|чапан|туник|джеллаб|комбинезон|кимоно/i, 'full'],
 [/дождевик|пальто|плащ|куртк|ветровк|пуховичок|накидк/i, 'top'],
 [/футболк|свитшот|рубашк|жилет|свитер|майк|худи|толстовк|тельняшк|лопапейс|поло/i, 'top'],
 [/ушанк|берет|панам|тюбетейк|шляп|кеп|шапк|колпак|феск|тюрбан|венок|косынк|бейсболк|капюшон|корон/i, 'head'],
 [/шарф|бусы|плато[кч]|колье|галстук/i, 'neck'],
 [/очки|маск|пёрышки/i, 'face'],
 [/кроссовки|туфельк|сандали|носочки|носки|гольфы|шлёпанц|тапочк|ботиночк|сапожк|бабуши/i, 'feet'],
 [/шорты|юбк|штан|брюч/i, 'bottom'],
]
const FURNITURE_KEYWORDS: [RegExp, string][] = [
 [/кроват|юрта|топчан|гамак|шезлонг|палатк|купель/i, 'bed'],
 [/торшер|фонар|ламп|ночник|светильник|вывеск|гирлянд|маяк/i, 'lamp'],
 [/часы|часики/i, 'clock'],
 [/окно|окошко/i, 'window'],
 [/ковёр|коврик|плед|подушк/i, 'rug'],
 [/стол|котацу/i, 'dresser'],
 [/мозаичн|панель|балкончик|гитар|бумеранг|лесенк|мостик|арка/i, 'wall_item'],
 [/самовар|подстаканник|пиала|чайник|кувшин|миск|блюдо|стаканчик|кружк|горшоч|корзин|ваз|банка|кокос|пышк|бублик|трдельник|статуэтк|манэки|колокольчик|ракушк|камушек|папирус|бонсай|сервиз|сова|пирамидк|лодочк|паштел|сироп/i, 'dresser_item'],
]
function inferSlot(name: string, table: [RegExp, string][], fallback: string): string {
 for (const [re, slot] of table) if (re.test(name)) return slot
 return fallback
}

// Location-exclusive item indexes (id → meta with inferred slot)
const EXCL_CLOTHING = new Map<string, { ru: string; price: number; slot: string }>()
const EXCL_FURNITURE = new Map<string, { ru: string; price: number; slot: string }>()
for (const loc of LOCATIONS) {
 for (const it of loc.exclusive_clothing) EXCL_CLOTHING.set(it.id, { ru: it.ru_name, price: it.price, slot: inferSlot(it.ru_name, CLOTHING_KEYWORDS, 'held') })
 for (const it of loc.exclusive_furniture) EXCL_FURNITURE.set(it.id, { ru: it.ru_name, price: it.price, slot: inferSlot(it.ru_name, FURNITURE_KEYWORDS, 'door_left') })
}

// ---------- deterministic PRNG: hash(userId, shop, day, refreshes) ----------
function hashSeed(s: string): number {
 let h = 1779033703 ^ s.length
 for (let i = 0; i < s.length; i++) {
 h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
 h = (h << 13) | (h >>> 19)
 }
 return h >>> 0
}
function mulberry32(seed: number): () => number {
 let a = seed | 0
 return () => {
 a = (a + 0x6d2b79f5) | 0
 let t = Math.imul(a ^ (a >>> 15), 1 | a)
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296
 }
}

// ---------- shop engine ----------
type ShopId = 'outfit' | 'furniture' | 'color'
type Kind = 'clothing' | 'furniture' | 'dye' | 'plushie' | 'floor' | 'wallpaper'

interface Listing {
 kind: Kind
 itemId: string // for dyes: the body-part id
 colorId: string
 ru: string
 colorRu: string
 hex: string
 price: number
 location?: boolean
}
interface SlotsData { list: Listing[]; discount: Listing }
interface ShopStateRow { user_id: number; shop: string; day: string; slots: string; refreshes: number; gift_claimed: number }
interface OwnedRow { id: number; user_id: number; kind: string; item_id: string; color_id: string; acquired_ts: number }
interface GiftRow { id: number; from_id: number; to_id: number; kind: string; item_id: string; color_id: string; box_color: string | null; day: string; ts: number; claimed: number }
interface ComboRow { id: number; user_id: number; kind: string; name: string; data: string; ts: number }
interface MailRow { id: number; user_id: number; kind: string; title: string; body: string; data: string; read: number; ts: number }

const q = {
 pet: db.prepare('SELECT * FROM pets WHERE user_id=?'),
 stones: db.prepare('SELECT stones FROM users WHERE id=?'),
 owned: db.prepare('SELECT 1 FROM items_owned WHERE user_id=? AND kind=? AND item_id=? AND color_id=?'),
 ownAll: db.prepare('SELECT * FROM items_owned WHERE user_id=? ORDER BY acquired_ts DESC'),
 insertOwned: db.prepare('INSERT INTO items_owned (user_id, kind, item_id, color_id, acquired_ts) VALUES (?,?,?,?,?)'),
 deleteOwned: db.prepare('DELETE FROM items_owned WHERE user_id=? AND kind=? AND item_id=? AND color_id=?'),
 shopState: db.prepare('SELECT * FROM shop_state WHERE user_id=? AND shop=?'),
 giftedToday: db.prepare('SELECT 1 FROM gifts WHERE from_id=? AND to_id=? AND day=?'),
 friendship: db.prepare('SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?'),
}

function pet(userId: number): PetRow { return q.pet.get(userId) as PetRow }
function stonesOf(userId: number): number { return (q.stones.get(userId) as { stones: number }).stones }
function owns(userId: number, kind: string, itemId: string, colorId: string): boolean {
 return !!q.owned.get(userId, kind, itemId, colorId)
}
function dyeUnlocked(partId: string, stage: Stage): boolean {
 const part = DYE_PARTS.find(p => p.id === partId)
 if (!part) return false
 return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(part.stage_unlock)
}

function pickDistinct<T>(rng: () => number, arr: T[], n: number, key: (t: T) => string): T[] {
 const out: T[] = []
 const seen = new Set<string>()
 let guard = 0
 while (out.length < n && guard++ < 2000) {
 const t = arr[Math.floor(rng() * arr.length)]
 const k = key(t)
 if (!seen.has(k)) { seen.add(k); out.push(t) }
 }
 return out
}

function dyeListing(part: DyePart, color: Color): Listing {
 return { kind: 'dye', itemId: part.id, colorId: color.id, ru: `Краска: ${part.ru.toLowerCase()}`, colorRu: color.ru, hex: color.hex, price: part.price }
}

function rollSlots(userId: number, locationId: string, shop: ShopId, day: string, refreshes: number): SlotsData {
 const rng = mulberry32(hashSeed(`${userId}:${shop}:${day}:${refreshes}`))
 const pickColor = () => PALETTE[Math.floor(rng() * PALETTE.length)]

 if (shop === 'color') {
 const combos = pickDistinct(rng, DYE_COMBOS, C.SHOP_SLOTS + 1, c => `${c.part.id}:${c.color.id}`)
 const list = combos.slice(0, C.SHOP_SLOTS).map(c => dyeListing(c.part, c.color))
 const d = combos[C.SHOP_SLOTS]
 return { list, discount: { ...dyeListing(d.part, d.color), price: Math.floor(d.part.price / 2) } }
 }

 const kind: Kind = shop === 'outfit' ? 'clothing' : 'furniture'
 const loc = LOCATIONS.find(l => l.id === locationId) ?? LOCATIONS[0]
 const excl = shop === 'outfit' ? loc.exclusive_clothing : loc.exclusive_furniture
 const list: Listing[] = []

 // slot 1 = location exclusive (map-pin flag)
 const e = excl[Math.floor(rng() * excl.length)]
 const c0 = pickColor()
 list.push({ kind, itemId: e.id, colorId: c0.id, ru: e.ru_name, colorRu: c0.ru, hex: c0.hex, price: e.price, location: true })

 const pool = (shop === 'outfit' ? CL.items : FU.items).filter(i => !i.everyday)
 const picks = pickDistinct(rng, pool, C.SHOP_SLOTS, i => i.id)
 for (let i = 0; i < C.SHOP_SLOTS - 1; i++) {
 const it = picks[i]
 const c = pickColor()
 list.push({ kind, itemId: it.id, colorId: c.id, ru: it.ru_name, colorRu: c.ru, hex: c.hex, price: it.price })
 }

 // occasional plushie (~5% chance, outfit shop)
 if (shop === 'outfit' && rng() < 0.05 && CL.plushies.length > 0) {
 const p = CL.plushies[Math.floor(rng() * CL.plushies.length)]
 const c = pickColor()
 const idx = 1 + Math.floor(rng() * (C.SHOP_SLOTS - 1))
 list[idx] = { kind: 'plushie', itemId: p.id, colorId: c.id, ru: p.ru_name, colorRu: c.ru, hex: c.hex, price: p.price }
 }

 const dItem = picks[C.SHOP_SLOTS - 1]
 const dc = pickColor()
 const discount: Listing = { kind, itemId: dItem.id, colorId: dc.id, ru: dItem.ru_name, colorRu: dc.ru, hex: dc.hex, price: Math.floor(dItem.price / 2) }
 return { list, discount }
}

function getShopState(user: UserRow, shop: ShopId): { row: ShopStateRow; data: SlotsData } {
 const day = user.last_day!
 let row = q.shopState.get(user.id, shop) as ShopStateRow | undefined
 if (!row || row.day !== day) {
 const data = rollSlots(user.id, user.location_id, shop, day, 0)
 db.prepare(
 `INSERT INTO shop_state (user_id, shop, day, slots, refreshes, gift_claimed) VALUES (?,?,?,?,0,0)
 ON CONFLICT(user_id, shop) DO UPDATE SET day=excluded.day, slots=excluded.slots, refreshes=0, gift_claimed=0`,
 ).run(user.id, shop, day, JSON.stringify(data))
 row = q.shopState.get(user.id, shop) as ShopStateRow
 }
 return { row, data: JSON.parse(row.slots) as SlotsData }
}

function nextRefreshCost(refreshes: number): number {
 const costs = C.SHOP_REFRESH_COSTS
 return costs[Math.min(refreshes, costs.length - 1)] ?? costs[costs.length - 1]
}

// ---------- price / meta lookups ----------
function priceOf(kind: string, itemId: string): number | null {
 if (kind === 'clothing') return CL.items.find(i => i.id === itemId)?.price ?? EXCL_CLOTHING.get(itemId)?.price ?? null
 if (kind === 'plushie') return CL.plushies.find(p => p.id === itemId)?.price ?? null
 if (kind === 'furniture') return FU.items.find(i => i.id === itemId)?.price ?? EXCL_FURNITURE.get(itemId)?.price ?? null
 if (kind === 'floor') return FU.floors.find(f => f.id === itemId)?.price ?? null
 if (kind === 'wallpaper') return FU.wallpapers.find(w => w.id === itemId)?.price ?? null
 if (kind === 'dye') return DYE_PARTS.find(p => p.id === itemId)?.price ?? null
 return null
}
function metaOf(kind: string, itemId: string, colorId: string): { ru: string; slot: string; price: number; hex: string; colorRu: string } | null {
 const pal = PALETTE.find(p => p.id === colorId)
 const base = { hex: pal?.hex ?? '#EADFC8', colorRu: pal?.ru ?? '' }
 if (kind === 'clothing') {
 const it = CL.items.find(i => i.id === itemId)
 if (it) return { ru: it.ru_name, slot: it.slot, price: it.price, ...base }
 const ex = EXCL_CLOTHING.get(itemId)
 return ex ? { ru: ex.ru, slot: ex.slot, price: ex.price, ...base } : null
 }
 if (kind === 'plushie') {
 const p = CL.plushies.find(x => x.id === itemId)
 return p ? { ru: p.ru_name, slot: 'held', price: p.price, ...base } : null
 }
 if (kind === 'furniture') {
 const it = FU.items.find(i => i.id === itemId)
 if (it) return { ru: it.ru_name, slot: it.slot, price: it.price, ...base }
 const ex = EXCL_FURNITURE.get(itemId)
 return ex ? { ru: ex.ru, slot: ex.slot, price: ex.price, ...base } : null
 }
 if (kind === 'floor') {
 const f = FU.floors.find(x => x.id === itemId)
 return f ? { ru: `Пол «${f.ru_name}» (${f.style_ru.toLowerCase()})`, slot: 'floor', price: f.price, hex: f.hex, colorRu: '' } : null
 }
 if (kind === 'wallpaper') {
 const w = FU.wallpapers.find(x => x.id === itemId)
 return w ? { ru: `Обои «${w.ru}»`, slot: 'wall', price: w.price, hex: w.hex, colorRu: '' } : null
 }
 if (kind === 'dye') {
 const part = DYE_PARTS.find(p => p.id === itemId)
 const col = part?.colors.find(c => c.id === colorId)
 return part && col ? { ru: `Краска: ${part.ru.toLowerCase()}`, slot: part.id, price: part.price, hex: col.hex, colorRu: col.ru } : null
 }
 return null
}

// ---------- equipment JSON helpers ----------
type EquipSlots = Record<string, { kind: string; itemId: string; colorId: string } | undefined>

function readEquip(table: 'outfits' | 'rooms', userId: number): EquipSlots {
 const r = db.prepare(`SELECT slots FROM ${table} WHERE user_id=?`).get(userId) as { slots: string } | undefined
 try { return r ? (JSON.parse(r.slots) as EquipSlots) : {} } catch { return {} }
}
function writeEquip(table: 'outfits' | 'rooms', userId: number, slots: EquipSlots) {
 db.prepare(
 `INSERT INTO ${table} (user_id, slots) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET slots=excluded.slots`,
 ).run(userId, JSON.stringify(slots))
}
function readDyes(userId: number): Record<string, string | undefined> {
 try { return JSON.parse(pet(userId).dyes) as Record<string, string> } catch { return {} }
}
function writeDyes(userId: number, dyes: Record<string, string | undefined>) {
 db.prepare('UPDATE pets SET dyes=? WHERE user_id=?').run(JSON.stringify(dyes), userId)
}

// Removes an owned item everywhere: inventory, equipped outfit/room/dyes, saved combos.
function removeOwnedEverywhere(userId: number, kind: string, itemId: string, colorId: string) {
 q.deleteOwned.run(userId, kind, itemId, colorId)
 for (const table of ['outfits', 'rooms'] as const) {
 const slots = readEquip(table, userId)
 let changed = false
 for (const k of Object.keys(slots)) {
 const v = slots[k]
 if (v && v.itemId === itemId && v.colorId === colorId && v.kind === kind) { delete slots[k]; changed = true }
 }
 if (changed) writeEquip(table, userId, slots)
 }
 if (kind === 'dye') {
 const dyes = readDyes(userId)
 if (dyes[itemId] === colorId) { delete dyes[itemId]; writeDyes(userId, dyes) }
 }
 const combos = db.prepare('SELECT * FROM saved_combos WHERE user_id=?').all(userId) as ComboRow[]
 for (const cb of combos) {
 try {
 const data = JSON.parse(cb.data) as Record<string, { kind?: string; itemId?: string; colorId?: string } | string | undefined>
 let changed = false
 for (const k of Object.keys(data)) {
 const v = data[k]
 if (kind === 'dye' && cb.kind === 'color') {
 if (k === itemId && v === colorId) { delete data[k]; changed = true }
 } else if (v && typeof v === 'object' && v.itemId === itemId && v.colorId === colorId && v.kind === kind) {
 delete data[k]; changed = true
 }
 }
 if (changed) db.prepare('UPDATE saved_combos SET data=? WHERE id=?').run(JSON.stringify(data), cb.id)
 } catch { /* skip malformed */ }
 }
}

// ---------- shop responses ----------
function buildShopResponse(user: UserRow, shop: ShopId) {
 const plus = hasPlus(user)
 const { row, data } = getShopState(user, shop)

 // daily NPC gift, first open of the outfit shop each day (ёж Колюч)
 let npcGift: number | null = null
 if (shop === 'outfit' && !row.gift_claimed) {
 npcGift = C.SHOP_DAILY_GIFT_MIN + Math.floor(Math.random() * (C.SHOP_DAILY_GIFT_MAX - C.SHOP_DAILY_GIFT_MIN + 1))
 addStones(user.id, npcGift, 'shop_daily_gift')
 db.prepare('UPDATE shop_state SET gift_claimed=1 WHERE user_id=? AND shop=?').run(user.id, shop)
 }

 const stage = stageForWalks(pet(user.id).walks)
 const slots = data.list.map((l, i) => ({
 ...l,
 sold: owns(user.id, l.kind, l.itemId, l.colorId),
 locked: i >= C.SHOP_SLOTS_FREE && !plus,
 stageLocked: l.kind === 'dye' && !dyeUnlocked(l.itemId, stage),
 stageRu: l.kind === 'dye' ? STAGE_RU[DYE_PARTS.find(p => p.id === l.itemId)?.stage_unlock ?? 'baby'] : undefined,
 }))
 const discount = plus
 ? { ...data.discount, sold: owns(user.id, data.discount.kind, data.discount.itemId, data.discount.colorId) }
 : null

 const ownedColorsOf = (kind: Kind, itemId: string) =>
 (db.prepare('SELECT color_id FROM items_owned WHERE user_id=? AND kind=? AND item_id=?').all(user.id, kind, itemId) as { color_id: string }[]).map(r => r.color_id)

 const everyday = shop === 'color' ? [] : (shop === 'outfit' ? CL.items : FU.items)
 .filter(i => i.everyday)
 .map(i => ({ id: i.id, ru: i.ru_name, slot: i.slot, price: i.price, ownedColors: ownedColorsOf(shop === 'outfit' ? 'clothing' : 'furniture', i.id) }))

 const floors = shop === 'furniture'
 ? FU.floors.map(f => ({ id: f.id, ru: f.ru_name, styleRu: f.style_ru, hex: f.hex, price: f.price, owned: owns(user.id, 'floor', f.id, '') }))
 : []
 const wallpapers = shop === 'furniture'
 ? FU.wallpapers.map(w => ({ id: w.id, ru: w.ru, hex: w.hex, price: w.price, owned: owns(user.id, 'wallpaper', w.id, '') }))
 : []
 const dyeParts = shop === 'color'
 ? DYE_PARTS.map(p => ({ id: p.id, ru: p.ru, price: p.price, stage: p.stage_unlock, stageRu: STAGE_RU[p.stage_unlock], unlocked: dyeUnlocked(p.id, stage) }))
 : []

 const locRu = (LOCATIONS.find(l => l.id === user.location_id) ?? LOCATIONS[0]).ru_name
 return {
 shop, day: row.day, stones: stonesOf(user.id), plus,
 refreshes: row.refreshes, nextRefreshCost: nextRefreshCost(row.refreshes),
 npcGift, slots, discount, everyday, floors, wallpapers, dyeParts,
 palette: PALETTE, locationRu: locRu,
 }
}

const SHOP_PARAM = '/:shop{outfit|furniture|color}'

// ============================== BAG / MAIL / INVENTORY ==============================

shopRoutes.get('/bag', c => {
 const user = ensureFresh(c.get('user'))
 const plus = hasPlus(user)
 const p = pet(user.id)
 const stage = stageForWalks(p.walks)
 const rows = q.ownAll.all(user.id) as OwnedRow[]

 const owned = { clothing: [] as unknown[], furniture: [] as unknown[], floors: [] as unknown[], wallpapers: [] as unknown[], dyes: [] as unknown[] }
 for (const r of rows) {
 const m = metaOf(r.kind, r.item_id, r.color_id)
 if (!m) continue
 const entry = { kind: r.kind, itemId: r.item_id, colorId: r.color_id, ru: m.ru, slot: m.slot, price: m.price, hex: m.hex, colorRu: m.colorRu }
 if (r.kind === 'clothing' || r.kind === 'plushie') owned.clothing.push(entry)
 else if (r.kind === 'furniture') owned.furniture.push(entry)
 else if (r.kind === 'floor') owned.floors.push(entry)
 else if (r.kind === 'wallpaper') owned.wallpapers.push(entry)
 else if (r.kind === 'dye') owned.dyes.push(entry)
 }

 const combos = db.prepare('SELECT * FROM saved_combos WHERE user_id=? ORDER BY ts').all(user.id) as ComboRow[]
 const comboDto = (k: string) => combos.filter(cb => cb.kind === k).map(cb => ({ id: cb.id, name: cb.name, count: Object.keys(JSON.parse(cb.data) as object).length }))
 const mailUnread = (db.prepare('SELECT COUNT(*) n FROM mail WHERE user_id=? AND read=0').get(user.id) as { n: number }).n

 return c.json({
 stones: stonesOf(user.id), plus, mailUnread, petStage: stage,
 clothingSlots: CLOTHING_SLOTS,
 furnitureSlots: FURNITURE_SLOTS,
 dyeParts: DYE_PARTS.map(dp => ({ id: dp.id, ru: dp.ru, price: dp.price, stage: dp.stage_unlock, stageRu: STAGE_RU[dp.stage_unlock], unlocked: dyeUnlocked(dp.id, stage) })),
 owned,
 equipped: { outfit: readEquip('outfits', user.id), room: readEquip('rooms', user.id), dyes: readDyes(user.id) },
 combos: { outfit: comboDto('outfit'), room: comboDto('room'), color: comboDto('color') },
 comboLimit: plus ? null : C.SAVED_COMBOS_FREE,
 })
})

shopRoutes.get('/mail', c => {
 const user = ensureFresh(c.get('user'))
 const rows = db.prepare('SELECT * FROM mail WHERE user_id=? ORDER BY ts DESC LIMIT 100').all(user.id) as MailRow[]
 return c.json({
 mail: rows.map(m => {
 let data: Record<string, unknown> = {}
 try { data = JSON.parse(m.data) as Record<string, unknown> } catch { /* keep empty */ }
 return { id: m.id, kind: m.kind, title: m.title, body: m.body, data, read: !!m.read, ts: m.ts }
 }),
 })
})

shopRoutes.post('/mail/:id/read', c => {
 const user = ensureFresh(c.get('user'))
 db.prepare('UPDATE mail SET read=1 WHERE id=? AND user_id=?').run(Number(c.req.param('id')), user.id)
 return c.json({ ok: true })
})

shopRoutes.post('/gifts/:id/claim', c => {
 const user = ensureFresh(c.get('user'))
 const g = db.prepare('SELECT * FROM gifts WHERE id=? AND to_id=?').get(Number(c.req.param('id')), user.id) as GiftRow | undefined
 if (!g) return c.json({ error: 'not_found' }, 404)
 if (g.claimed) return c.json({ error: 'already_claimed' }, 400)
 db.prepare('UPDATE gifts SET claimed=1 WHERE id=?').run(g.id)
 const m = metaOf(g.kind, g.item_id, g.color_id)
 if (owns(user.id, g.kind, g.item_id, g.color_id)) {
 // duplicate: auto-sell at half price
 const refund = Math.floor((priceOf(g.kind, g.item_id) ?? 0) * C.SELLBACK_RATIO)
 addStones(user.id, refund, 'gift_duplicate')
 return c.json({ duplicate: true, stones: refund, ru: m?.ru ?? '' })
 }
 q.insertOwned.run(user.id, g.kind, g.item_id, g.color_id, Date.now())
 return c.json({ ok: true, ru: m?.ru ?? '', colorRu: m?.colorRu ?? '' })
})

// ============================== CATALOG ==============================

shopRoutes.get('/catalog', c => {
 const user = ensureFresh(c.get('user'))
 const kind = c.req.query('kind') ?? 'clothing'
 const ownedColorsOf = (k: string, itemId: string) =>
 (db.prepare('SELECT color_id FROM items_owned WHERE user_id=? AND kind=? AND item_id=?').all(user.id, k, itemId) as { color_id: string }[]).map(r => r.color_id)

 if (kind === 'dye') {
 const stage = stageForWalks(pet(user.id).walks)
 return c.json({
 kind,
 parts: DYE_PARTS.map(p => ({
 id: p.id, ru: p.ru, price: p.price, stageRu: STAGE_RU[p.stage_unlock], unlocked: dyeUnlocked(p.id, stage),
 colors: p.colors.map(col => ({ ...col, owned: owns(user.id, 'dye', p.id, col.id) })),
 })),
 })
 }
 if (kind === 'furniture') {
 const groups = FURNITURE_SLOTS.filter(s => !['floor', 'wall'].includes(s.id)).map(s => ({
 id: s.id, ru: s.ru,
 items: FU.items.filter(i => i.slot === s.id).map(i => ({ id: i.id, ru: i.ru_name, price: i.price, everyday: i.everyday, ownedColors: ownedColorsOf('furniture', i.id) })),
 }))
 groups.push({
 id: 'travel', ru: 'Из путешествий',
 items: [...EXCL_FURNITURE.entries()].map(([id, m]) => ({ id, ru: m.ru, price: m.price, everyday: false, ownedColors: ownedColorsOf('furniture', id) })),
 })
 return c.json({ kind, groups, palette: PALETTE, floors: FU.floors.map(f => ({ id: f.id, ru: f.ru_name, styleRu: f.style_ru, hex: f.hex, price: f.price, owned: owns(user.id, 'floor', f.id, '') })), wallpapers: FU.wallpapers.map(w => ({ id: w.id, ru: w.ru, hex: w.hex, price: w.price, owned: owns(user.id, 'wallpaper', w.id, '') })) })
 }
 const groups = CLOTHING_SLOTS.map(s => ({
 id: s.id, ru: s.ru,
 items: CL.items.filter(i => i.slot === s.id).map(i => ({ id: i.id, ru: i.ru_name, price: i.price, everyday: i.everyday, ownedColors: ownedColorsOf('clothing', i.id) })),
 }))
 groups.push({
 id: 'plushies', ru: 'Легендарные плюшки',
 items: CL.plushies.map(p => ({ id: p.id, ru: p.ru_name, price: p.price, everyday: false, ownedColors: ownedColorsOf('plushie', p.id) })),
 })
 groups.push({
 id: 'travel', ru: 'Из путешествий',
 items: [...EXCL_CLOTHING.entries()].map(([id, m]) => ({ id, ru: m.ru, price: m.price, everyday: false, ownedColors: ownedColorsOf('clothing', id) })),
 })
 return c.json({ kind, groups, palette: PALETTE, floors: [], wallpapers: [] })
})

// ============================== SELL ==============================

const sellSchema = z.object({
 kind: z.enum(['clothing', 'furniture', 'dye', 'plushie', 'floor', 'wallpaper']),
 itemId: z.string().min(1).max(80),
 colorId: z.string().max(40).default(''),
})

shopRoutes.post('/sell', async c => {
 const body = sellSchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const { kind, itemId, colorId } = body.data
 if (!owns(user.id, kind, itemId, colorId)) return c.json({ error: 'not_owned' }, 400)
 if (kind === 'dye' && readDyes(user.id)[itemId] === colorId) return c.json({ error: 'dye_worn' }, 400)
 const price = priceOf(kind, itemId)
 if (price == null) return c.json({ error: 'unknown_item' }, 400)
 const refund = Math.floor(price * C.SELLBACK_RATIO)
 db.transaction(() => {
 removeOwnedEverywhere(user.id, kind, itemId, colorId)
 addStones(user.id, refund, 'shop_sell')
 })()
 return c.json({ ok: true, refund, stones: stonesOf(user.id) })
})

// ============================== EQUIP ==============================

const equipSchema = z.object({
 kind: z.enum(['outfit', 'room', 'dye']),
 slot: z.string().min(1).max(30),
 itemId: z.string().max(80).nullable(),
 colorId: z.string().max(40).default(''),
})

shopRoutes.post('/equip', async c => {
 const body = equipSchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const { kind, slot, itemId, colorId } = body.data

 if (kind === 'dye') {
 const part = DYE_PARTS.find(dp => dp.id === slot)
 if (!part) return c.json({ error: 'bad_slot' }, 400)
 const dyes = readDyes(user.id)
 if (itemId === null) {
 delete dyes[slot]
 } else {
 if (!dyeUnlocked(slot, stageForWalks(pet(user.id).walks))) return c.json({ error: 'stage_locked' }, 400)
 if (!owns(user.id, 'dye', slot, colorId)) return c.json({ error: 'not_owned' }, 400)
 dyes[slot] = colorId
 }
 writeDyes(user.id, dyes)
 return c.json({ ok: true, dyes })
 }

 const table = kind === 'outfit' ? 'outfits' as const : 'rooms' as const
 const validSlots = kind === 'outfit' ? CLOTHING_SLOTS.map(s => s.id) : FURNITURE_SLOTS.map(s => s.id)
 if (!validSlots.includes(slot)) return c.json({ error: 'bad_slot' }, 400)
 const slots = readEquip(table, user.id)

 if (itemId === null) {
 delete slots[slot]
 writeEquip(table, user.id, slots)
 return c.json({ ok: true, slots })
 }

 // resolve the owned kind for this item
 let itemKind: string | null = null
 if (kind === 'outfit') {
 if (owns(user.id, 'clothing', itemId, colorId)) itemKind = 'clothing'
 else if (owns(user.id, 'plushie', itemId, colorId)) itemKind = 'plushie'
 } else {
 if (slot === 'floor' && owns(user.id, 'floor', itemId, '')) itemKind = 'floor'
 else if (slot === 'wall' && owns(user.id, 'wallpaper', itemId, '')) itemKind = 'wallpaper'
 else if (owns(user.id, 'furniture', itemId, colorId)) itemKind = 'furniture'
 }
 if (!itemKind) return c.json({ error: 'not_owned' }, 400)
 const m = metaOf(itemKind, itemId, colorId)
 if (!m) return c.json({ error: 'unknown_item' }, 400)
 if (m.slot !== slot) return c.json({ error: 'wrong_slot' }, 400)
 slots[slot] = { kind: itemKind, itemId, colorId: itemKind === 'floor' || itemKind === 'wallpaper' ? '' : colorId }
 writeEquip(table, user.id, slots)
 return c.json({ ok: true, slots })
})

// ============================== SAVED COMBOS ==============================

const comboKind = z.enum(['outfit', 'room', 'color'])

shopRoutes.get('/combos', c => {
 const user = ensureFresh(c.get('user'))
 const k = comboKind.safeParse(c.req.query('kind'))
 if (!k.success) return c.json({ error: 'bad_request' }, 400)
 const rows = db.prepare('SELECT * FROM saved_combos WHERE user_id=? AND kind=? ORDER BY ts').all(user.id, k.data) as ComboRow[]
 return c.json({ combos: rows.map(r => ({ id: r.id, name: r.name, data: JSON.parse(r.data) as unknown })) })
})

shopRoutes.post('/combos', async c => {
 const body = z.object({ kind: comboKind, name: z.string().max(40).optional() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const { kind } = body.data
 const count = (db.prepare('SELECT COUNT(*) n FROM saved_combos WHERE user_id=? AND kind=?').get(user.id, kind) as { n: number }).n
 if (!hasPlus(user) && count >= C.SAVED_COMBOS_FREE) return c.json({ error: 'combo_limit' }, 400)
 const data = kind === 'outfit' ? readEquip('outfits', user.id) : kind === 'room' ? readEquip('rooms', user.id) : readDyes(user.id)
 if (Object.keys(data).length === 0) return c.json({ error: 'empty_combo' }, 400)
 const name = body.data.name?.trim() || `Образ ${count + 1}`
 const r = db.prepare('INSERT INTO saved_combos (user_id, kind, name, data, ts) VALUES (?,?,?,?,?)')
 .run(user.id, kind, name, JSON.stringify(data), Date.now())
 return c.json({ ok: true, id: Number(r.lastInsertRowid), name })
})

shopRoutes.post('/combos/:id/apply', c => {
 const user = ensureFresh(c.get('user'))
 const row = db.prepare('SELECT * FROM saved_combos WHERE id=? AND user_id=?').get(Number(c.req.param('id')), user.id) as ComboRow | undefined
 if (!row) return c.json({ error: 'not_found' }, 404)
 if (row.kind === 'color') {
 writeDyes(user.id, JSON.parse(row.data) as Record<string, string>)
 } else {
 writeEquip(row.kind === 'outfit' ? 'outfits' : 'rooms', user.id, JSON.parse(row.data) as EquipSlots)
 }
 return c.json({ ok: true })
})

shopRoutes.post('/combos/:id/delete', c => {
 const user = ensureFresh(c.get('user'))
 db.prepare('DELETE FROM saved_combos WHERE id=? AND user_id=?').run(Number(c.req.param('id')), user.id)
 return c.json({ ok: true })
})

// ============================== GIFTING ==============================

shopRoutes.get('/gift-targets', c => {
 const user = ensureFresh(c.get('user'))
 const kind = c.req.query('kind') ?? ''
 const itemId = c.req.query('itemId') ?? ''
 const colorId = c.req.query('colorId') ?? ''
 const day = user.last_day!
 const friends = db.prepare(
 `SELECT f.friend_id id, COALESCE(f.nickname, u.name) name FROM friendships f JOIN users u ON u.id=f.friend_id WHERE f.user_id=?`,
 ).all(user.id) as { id: number; name: string }[]
 return c.json({
 friends: friends.map(f => ({
 ...f,
 owned: kind && itemId ? owns(f.id, kind, itemId, colorId) : false,
 giftedToday: !!q.giftedToday.get(user.id, f.id, day),
 })),
 })
})

function performGift(user: UserRow, friendId: number, boxColor: string, kind: string, itemId: string, colorId: string, fee: number, listingRu: string, colorRu: string): { error?: string; stones?: number } {
 const day = user.last_day!
 if (kind === 'dye') return { error: 'dyes_not_giftable' }
 if (!q.friendship.get(user.id, friendId)) return { error: 'not_friends' }
 if (q.giftedToday.get(user.id, friendId, day)) return { error: 'already_gifted_today' }
 if (owns(friendId, kind, itemId, colorId)) return { error: 'friend_owns' }
 if (stonesOf(user.id) < fee) return { error: 'not_enough_stones' }
 db.transaction(() => {
 addStones(user.id, -fee, 'gift_sent')
 const r = db.prepare('INSERT INTO gifts (from_id, to_id, kind, item_id, color_id, box_color, day, ts) VALUES (?,?,?,?,?,?,?,?)')
 .run(user.id, friendId, kind, itemId, colorId, boxColor, day, Date.now())
 db.prepare('INSERT INTO mail (user_id, kind, title, body, data, ts) VALUES (?,?,?,?,?,?)')
 .run(friendId, 'gift', `🎁 Подарок от ${user.name}`,
 `${user.name} прислал(а) тебе подарок: ${listingRu}${colorRu ? ` (${colorRu.toLowerCase()})` : ''}. Открой коробочку!`,
 JSON.stringify({ gift_id: Number(r.lastInsertRowid), from_id: user.id, from_name: user.name, item_ru: listingRu, box_color: boxColor }),
 Date.now())
 })()
 return { stones: stonesOf(user.id) }
}

const giftOwnSchema = z.object({
 kind: z.enum(['clothing', 'furniture', 'plushie']),
 itemId: z.string().min(1).max(80),
 colorId: z.string().max(40).default(''),
 friendId: z.number().int(),
 boxColor: z.string().max(20).default('krasny'),
})

// Gift one of YOUR OWN items from the Bag: 200🦴 fee, the item leaves your inventory.
shopRoutes.post('/gift-own', async c => {
 const body = giftOwnSchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const { kind, itemId, colorId, friendId, boxColor } = body.data
 if (!owns(user.id, kind, itemId, colorId)) return c.json({ error: 'not_owned' }, 400)
 const m = metaOf(kind, itemId, colorId)
 if (!m) return c.json({ error: 'unknown_item' }, 400)
 const r = performGift(user, friendId, boxColor, kind, itemId, colorId, C.GIFT_FEE, m.ru, m.colorRu)
 if (r.error) return c.json({ error: r.error }, 400)
 removeOwnedEverywhere(user.id, kind, itemId, colorId)
 return c.json({ ok: true, stones: r.stones })
})

// ============================== THE THREE SHOPS ==============================

shopRoutes.get(SHOP_PARAM, c => {
 const user = ensureFresh(c.get('user'))
 return c.json(buildShopResponse(user, c.req.param('shop') as ShopId))
})

shopRoutes.post(`${SHOP_PARAM}/refresh`, c => {
 const user = ensureFresh(c.get('user'))
 const shop = c.req.param('shop') as ShopId
 const { row } = getShopState(user, shop)
 const cost = nextRefreshCost(row.refreshes)
 if (stonesOf(user.id) < cost) return c.json({ error: 'not_enough_stones' }, 400)
 const data = rollSlots(user.id, user.location_id, shop, user.last_day!, row.refreshes + 1)
 db.transaction(() => {
 if (cost > 0) addStones(user.id, -cost, 'shop_refresh')
 db.prepare('UPDATE shop_state SET refreshes=refreshes+1, slots=? WHERE user_id=? AND shop=?')
 .run(JSON.stringify(data), user.id, shop)
 })()
 return c.json(buildShopResponse(user, shop))
})

const buySchema = z.object({
 slot: z.number().int().min(0).max(12).optional(), // 12 = the Plus 50%-off listing
 itemId: z.string().max(80).optional(),
 colorId: z.string().max(40).optional(),
})

shopRoutes.post(`${SHOP_PARAM}/buy`, async c => {
 const body = buySchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const shop = c.req.param('shop') as ShopId
 const plus = hasPlus(user)

 let listing: Listing | null = null
 if (body.data.slot !== undefined) {
 const { data } = getShopState(user, shop)
 if (body.data.slot === 12) {
 if (!plus) return c.json({ error: 'plus_required' }, 403)
 listing = data.discount
 } else {
 if (body.data.slot >= C.SHOP_SLOTS_FREE && !plus) return c.json({ error: 'plus_required' }, 403)
 listing = data.list[body.data.slot] ?? null
 }
 } else if (body.data.itemId) {
 // Everyday collection: any colour via the palette picker
 const colorId = body.data.colorId ?? ''
 if (shop === 'outfit') {
 const it = CL.items.find(i => i.id === body.data.itemId && i.everyday)
 const col = PALETTE.find(p => p.id === colorId)
 if (it && col) listing = { kind: 'clothing', itemId: it.id, colorId: col.id, ru: it.ru_name, colorRu: col.ru, hex: col.hex, price: it.price }
 } else if (shop === 'furniture') {
 const it = FU.items.find(i => i.id === body.data.itemId && i.everyday)
 const col = PALETTE.find(p => p.id === colorId)
 if (it && col) listing = { kind: 'furniture', itemId: it.id, colorId: col.id, ru: it.ru_name, colorRu: col.ru, hex: col.hex, price: it.price }
 if (!listing) {
 const f = FU.floors.find(x => x.id === body.data.itemId)
 if (f) listing = { kind: 'floor', itemId: f.id, colorId: '', ru: `Пол «${f.ru_name}»`, colorRu: '', hex: f.hex, price: f.price }
 const w = FU.wallpapers.find(x => x.id === body.data.itemId)
 if (w) listing = { kind: 'wallpaper', itemId: w.id, colorId: '', ru: `Обои «${w.ru}»`, colorRu: '', hex: w.hex, price: w.price }
 }
 }
 }
 if (!listing) return c.json({ error: 'not_found' }, 404)

 if (listing.kind === 'dye' && !dyeUnlocked(listing.itemId, stageForWalks(pet(user.id).walks))) {
 return c.json({ error: 'stage_locked' }, 400)
 }
 if (owns(user.id, listing.kind, listing.itemId, listing.colorId)) return c.json({ error: 'owned' }, 400)
 if (stonesOf(user.id) < listing.price) return c.json({ error: 'not_enough_stones' }, 400)

 db.transaction(() => {
 q.insertOwned.run(user.id, listing!.kind, listing!.itemId, listing!.colorId, Date.now())
 addStones(user.id, -listing!.price, `shop_buy_${shop}`)
 })()
 return c.json({ ok: true, stones: stonesOf(user.id), ru: listing.ru, colorRu: listing.colorRu })
})

const giftSchema = z.object({
 slot: z.number().int().min(0).max(12),
 friendId: z.number().int(),
 boxColor: z.string().max(20).default('krasny'),
})

shopRoutes.post(`${SHOP_PARAM}/gift`, async c => {
 const body = giftSchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const user = ensureFresh(c.get('user'))
 const shop = c.req.param('shop') as ShopId
 if (shop === 'color') return c.json({ error: 'dyes_not_giftable' }, 400)
 const plus = hasPlus(user)
 const { data } = getShopState(user, shop)
 let listing: Listing | null
 if (body.data.slot === 12) {
 if (!plus) return c.json({ error: 'plus_required' }, 403)
 listing = data.discount
 } else {
 if (body.data.slot >= C.SHOP_SLOTS_FREE && !plus) return c.json({ error: 'plus_required' }, 403)
 listing = data.list[body.data.slot] ?? null
 }
 if (!listing) return c.json({ error: 'not_found' }, 404)
 // gift-before-buy rule: once you own this item+colour, store gifting is blocked
 if (owns(user.id, listing.kind, listing.itemId, listing.colorId)) return c.json({ error: 'owned_gift_blocked' }, 400)
 const r = performGift(user, body.data.friendId, body.data.boxColor, listing.kind, listing.itemId, listing.colorId, listing.price + C.GIFT_FEE, listing.ru, listing.colorRu)
 if (r.error) return c.json({ error: r.error }, 400)
 return c.json({ ok: true, stones: r.stones })
})
