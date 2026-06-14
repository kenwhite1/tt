// Social module: Дворик, friends, vibes («Тёплые лучики»), hugs, gifts claiming,
// goal sharing / buddy goals, referrals. See research/finch/social.md + SPEC §4.
import { Hono } from 'hono'
import { z } from 'zod'
import { C, friendshipLevel, stageForWalks } from '../../../shared/constants'
import { content } from '../content'
import { db } from '../db'
import { addGoal, addStones, getUser } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { hasPlus } from '../env'
import type { Env } from '../env'
import type { GoalRow, PetRow, UserRow, WalkRow } from '../engine/rows'

export const socialRoutes = new Hono<Env>()

// ===== vibe catalog: 14 free + 4 Plus (Comfort/Dance/Flowers/Kudos analogs) =====
export const VIBES = [
 { id: 'dobroe_utro', ru: 'Доброе утро', emoji: '☀️', color: '#CDE7F5', plus: false },
 { id: 'obnimashki', ru: 'Обнимашки', emoji: '❤️', color: '#F5C9A8', plus: false },
 { id: 'spokoystvie', ru: 'Спокойствие', emoji: '🍃', color: '#C7DDF2', plus: false },
 { id: 'blagodarnost', ru: 'Благодарность', emoji: '🥰', color: '#F5C5D8', plus: false },
 { id: 'privet', ru: 'Привет', emoji: '🫲', color: '#CFEAC2', plus: false },
 { id: 'day_pyat', ru: 'Дай пять', emoji: '✋', color: '#F5D6A6', plus: false },
 { id: 'sila', ru: 'Сила', emoji: '💪', color: '#F3E5A4', plus: false },
 { id: 'razminka', ru: 'Разминка', emoji: '🤸', color: '#DCCBF0', plus: false },
 { id: 'sladkih_snov', ru: 'Сладких снов', emoji: '🌙', color: '#C5CEEF', plus: false },
 { id: 'mysli_o_tebe', ru: 'Мысли о тебе', emoji: '💭', color: '#E2D4F0', plus: false },
 { id: 'vodichki', ru: 'Водички', emoji: '🥤', color: '#C9E9F5', plus: false },
 { id: 'naryad', ru: 'Поддержка наряда', emoji: '🤩', color: '#D8F0C6', plus: false },
 { id: 'luchi_dobra', ru: 'Лучи добра', emoji: '🌟', color: '#CFE8BA', plus: false },
 { id: 'domik', ru: 'Домик-милый-домик', emoji: '💛', color: '#F5E4AA', plus: false },
 { id: 'podderzhka', ru: 'Поддержка', emoji: '😌', color: '#C2D8F2', plus: true },
 { id: 'tanets', ru: 'Танец', emoji: '🕺', color: '#F5CCA4', plus: true },
 { id: 'tsvety', ru: 'Цветы', emoji: '🌻', color: '#CBE9F2', plus: true },
 { id: 'bravo', ru: 'Браво', emoji: '🙌', color: '#DECBF0', plus: true },
] as const

// referral ladder (SPEC §4: 1 → 200🦴 + hood · 2 → plushie · 3 → Корова Печенька)
const REFERRAL_TIER1_STONES = 200
const REFERRAL_HOOD = 'kapyushonchik_ot_dozhdya'
const REFERRAL_PLUSHIE = 'plyush_kot_loskutok'
const REFERRAL_COW = 'pechenka_cow'
const INVITEE_GIFT_SPECIES = 'plyushka_hamster' // oatmeal-analog: common cuddly species

const BOT_USERNAME = process.env.BOT_USERNAME || 'sharikrubot'
const STAGE_RU: Record<string, string> = {
 baby: 'малыш', toddler: 'карапуз', child: 'ребёнок', teen: 'подросток', adult: 'взрослый',
}

// ===== small helpers =====
const isoToday = () => new Date().toISOString().slice(0, 10)

function shiftDay(date: string, days: number): string {
 const d = new Date(`${date}T12:00:00Z`)
 d.setUTCDate(d.getUTCDate() + days)
 return d.toISOString().slice(0, 10)
}

function settingsOf(uid: number): Record<string, unknown> {
 const row = db.prepare('SELECT settings FROM users WHERE id=?').get(uid) as { settings: string } | undefined
 try { return JSON.parse(row?.settings || '{}') as Record<string, unknown> } catch { return {} }
}

function patchSettings(uid: number, patch: Record<string, unknown>) {
 const s = { ...settingsOf(uid), ...patch }
 db.prepare('UPDATE users SET settings=? WHERE id=?').run(JSON.stringify(s), uid)
}

function mailTo(uid: number, kind: string, title: string, body: string, data: Record<string, unknown> = {}) {
 db.prepare('INSERT INTO mail (user_id, kind, title, body, data, ts) VALUES (?,?,?,?,?,?)')
 .run(uid, kind, title, body, JSON.stringify(data), Date.now())
}

function vibeMailText(friendName: string): string {
 const arr = content.botCopy.vibe_received as string[]
 const t = arr[Math.floor(Math.random() * arr.length)] ?? '{friend} шлёт тебе тепло 💛'
 return t.split('{friend}').join(friendName)
}

function getPet(uid: number): PetRow | undefined {
 return db.prepare('SELECT * FROM pets WHERE user_id=?').get(uid) as PetRow | undefined
}

function areFriends(a: number, b: number): boolean {
 return !!db.prepare('SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?').get(a, b)
}

function speciesName(speciesId: string): string {
 const sp = content.micropets.species.find(s => s.id === speciesId)
 return sp ? sp.ru_name.split(', ')[0] : speciesId
}

function grantMicropet(uid: number, speciesId: string, day: string) {
 const natures = content.micropets.natures
 const sp = content.micropets.species.find(s => s.id === speciesId) as
 | { id: string; ru_name: string; variants?: { id: string }[] } | undefined
 const variant = sp?.variants?.[0]?.id ?? ''
 db.prepare(
 `INSERT INTO user_micropets (user_id, species_id, variant, name, pronouns, nature, hatched_day)
 VALUES (?,?,?,?,?,?,?)`,
 ).run(uid, speciesId, variant, speciesName(speciesId), 'they',
 natures[Math.floor(Math.random() * natures.length)] ?? '', day)
}

// Energy award outside goals, same semantics as engine/core.completeGoal:
// cap at stage bar; during an active walk convert to shortening at 2 min/⚡.
function awardEnergy(user: UserRow, amount: number): { energy: number; walkMinutesReduced?: number } {
 const day = user.last_day!
 const pet = getPet(user.id)
 if (!pet) return { energy: 0 }
 const bar = C.ENERGY_BAR[stageForWalks(pet.walks)]
 const walk = db.prepare('SELECT * FROM walks WHERE user_id=? AND day=? ORDER BY id DESC LIMIT 1')
 .get(user.id, day) as WalkRow | undefined
 if (walk && !walk.completed && walk.ends_ts > Date.now()) {
 const cut = amount * C.WALK_MINUTES_PER_ENERGY * 60_000
 db.prepare('UPDATE walks SET ends_ts=? WHERE id=?').run(Math.max(Date.now(), walk.ends_ts - cut), walk.id)
 return { energy: 0, walkMinutesReduced: amount * C.WALK_MINUTES_PER_ENERGY }
 }
 const fresh = db.prepare('SELECT energy FROM users WHERE id=?').get(user.id) as { energy: number }
 if (fresh.energy < bar) {
 const e = Math.min(amount, bar - fresh.energy)
 db.prepare('UPDATE users SET energy=energy+? WHERE id=?').run(e, user.id)
 return { energy: e }
 }
 return { energy: 0 }
}

// consecutive completion days for a goal, counting back from `today` (today optional)
function goalStreak(goalId: number, today: string): number {
 const rows = db.prepare('SELECT DISTINCT day FROM goal_completions WHERE goal_id=? ORDER BY day DESC LIMIT 90')
 .all(goalId) as { day: string }[]
 const set = new Set(rows.map(r => r.day))
 let cursor = today
 if (!set.has(cursor)) cursor = shiftDay(cursor, -1)
 let streak = 0
 while (set.has(cursor)) { streak += 1; cursor = shiftDay(cursor, -1) }
 return streak
}

function goalDoneToday(goalId: number, day: string): boolean {
 return !!db.prepare('SELECT 1 FROM goal_completions WHERE goal_id=? AND day=? LIMIT 1').get(goalId, day)
}

// ===== vibes core (used by send + answer) =====
type VibeReward = { energy: number; stones: number; walkMinutesReduced?: number }

function sendVibeCore(me: UserRow, friendId: number, type: string):
 { error: string } | { reward: VibeReward; first: boolean } {
 const vibe = VIBES.find(v => v.id === type)
 if (!vibe) return { error: 'bad_type' }
 if (vibe.plus && !hasPlus(me)) return { error: 'plus_required' }
 if (!areFriends(me.id, friendId)) return { error: 'not_friends' }
 const recipientSettings = settingsOf(friendId)
 if (recipientSettings.social_allow_vibes === false) return { error: 'vibes_closed' }
 const day = me.last_day!
 const first = !db.prepare('SELECT 1 FROM vibes WHERE from_id=? AND to_id=? AND day=? LIMIT 1')
 .get(me.id, friendId, day)
 // recipient muted me → vibe lands pre-read (never shown), friendship still grows
 const muted = (db.prepare('SELECT muted FROM friendships WHERE user_id=? AND friend_id=?')
 .get(friendId, me.id) as { muted: number } | undefined)?.muted ? 1 : 0

 let reward: VibeReward = { energy: 0, stones: 0 }
 db.transaction(() => {
 db.prepare('INSERT INTO vibes (from_id, to_id, type, day, ts, read, answered) VALUES (?,?,?,?,?,?,0)')
 .run(me.id, friendId, type, day, Date.now(), muted)
 db.prepare('UPDATE friendships SET pts=pts+0.5 WHERE user_id=? AND friend_id=?').run(me.id, friendId)
 db.prepare('UPDATE friendships SET pts=pts+0.5 WHERE user_id=? AND friend_id=?').run(friendId, me.id)
 if (first) {
 const e = awardEnergy(me, C.VIBE_FIRST_ENERGY)
 addStones(me.id, C.VIBE_FIRST_STONES, 'vibe_first')
 reward = { energy: e.energy, stones: C.VIBE_FIRST_STONES, walkMinutesReduced: e.walkMinutesReduced }
 }
 })()
 return { reward, first }
}

// ===== referrals: lazy settlement =====
interface PendingRef { tg_id: number; inviter_id: number; ts: number }

function settleOne(p: PendingRef) {
 const invitee = getUser(p.tg_id)
 if (!invitee) return // not registered yet, keep pending
 const diff = Date.parse(invitee.created_at) - p.ts
 const valid = diff >= 0 && diff <= C.REFERRAL_WINDOW_HOURS * 3_600_000
 && invitee.id !== p.inviter_id && !invitee.referred_by
 if (!valid) {
 db.prepare('DELETE FROM pending_referrals WHERE tg_id=?').run(p.tg_id)
 return
 }
 const inviter = getUser(p.inviter_id)
 if (!inviter) { db.prepare('DELETE FROM pending_referrals WHERE tg_id=?').run(p.tg_id); return }
 const today = isoToday()
 db.transaction(() => {
 db.prepare('DELETE FROM pending_referrals WHERE tg_id=?').run(p.tg_id)
 const ins = db.prepare('INSERT OR IGNORE INTO referrals (invitee_id, inviter_id, ts, gift_species) VALUES (?,?,?,?)')
 .run(invitee.id, inviter.id, Date.now(), INVITEE_GIFT_SPECIES)
 if (!ins.changes) return
 db.prepare('UPDATE users SET referred_by=? WHERE id=?').run(inviter.id, invitee.id)
 // auto-friend both ways
 const now = Date.now()
 db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(inviter.id, invitee.id, now)
 db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(invitee.id, inviter.id, now)
 // invitee gift: a micropet friend right away
 grantMicropet(invitee.id, INVITEE_GIFT_SPECIES, invitee.last_day ?? today)
 mailTo(invitee.id, 'system', 'Подарок за знакомство! 🎁',
 `Тебя пригласил(а) ${inviter.name}, и к тебе уже бежит микропитомец ${speciesName(INVITEE_GIFT_SPECIES)}! Загляни в Сумку 💛`,
 { referral: true })
 // inviter ladder rewards, capped
 if (inviter.referral_rewards < C.REFERRAL_MAX_REWARDS) {
 const tier = inviter.referral_rewards + 1
 let rewardText = ''
 if (tier === 1) {
 addStones(inviter.id, REFERRAL_TIER1_STONES, 'referral_t1')
 db.prepare('INSERT OR IGNORE INTO items_owned (user_id, kind, item_id, color_id, acquired_ts) VALUES (?,?,?,?,?)')
 .run(inviter.id, 'clothing', REFERRAL_HOOD, '', now)
 rewardText = `${REFERRAL_TIER1_STONES}🦴 и уютный капюшончик`
 } else if (tier === 2) {
 db.prepare('INSERT OR IGNORE INTO items_owned (user_id, kind, item_id, color_id, acquired_ts) VALUES (?,?,?,?,?)')
 .run(inviter.id, 'plushie', REFERRAL_PLUSHIE, '', now)
 rewardText = 'плюшевый кот Лоскуток'
 } else {
 grantMicropet(inviter.id, REFERRAL_COW, inviter.last_day ?? today)
 rewardText = 'микропитомец Корова Печенька! 🐮'
 }
 db.prepare('UPDATE users SET referral_rewards=? WHERE id=?').run(tier, inviter.id)
 mailTo(inviter.id, 'system', `${invitee.name} теперь с нами! 🎉`,
 `Твоё приглашение сработало. Награда: ${rewardText}. Вы уже друзья во Дворике 💛`,
 { referral: true, tier })
 } else {
 mailTo(inviter.id, 'system', `${invitee.name} теперь с нами! 🎉`,
 'Твоё приглашение сработало, вы уже друзья во Дворике 💛', { referral: true })
 }
 })()
}

function settleReferrals(me: UserRow) {
 const mine = db.prepare('SELECT * FROM pending_referrals WHERE tg_id=?').get(me.id) as PendingRef | undefined
 if (mine) settleOne(mine)
 const asInviter = db.prepare(
 'SELECT p.* FROM pending_referrals p JOIN users u ON u.id=p.tg_id WHERE p.inviter_id=?',
 ).all(me.id) as PendingRef[]
 for (const p of asInviter) settleOne(p)
}

// =====================================================================
// routes
// =====================================================================

socialRoutes.get('/config', c => c.json({ botUsername: BOT_USERNAME }))

// ----- friends list (the whole Дворик payload) -----
socialRoutes.get('/friends', c => {
 const me = ensureFresh(c.get('user'))
 settleReferrals(me)
 const day = me.last_day!
 const yesterday = shiftDay(day, -1)
 const now = Date.now()

 const rows = db.prepare(
 `SELECT f.friend_id, f.nickname, f.emoji, f.muted, f.pts, f.created_ts,
 u.name, u.last_day AS f_day, p.name AS pet_name, p.walks, p.color, p.dyes
 FROM friendships f
 JOIN users u ON u.id=f.friend_id
 JOIN pets p ON p.user_id=f.friend_id
 WHERE f.user_id=? ORDER BY f.created_ts, f.friend_id`,
 ).all(me.id) as {
 friend_id: number; nickname: string | null; emoji: string | null; muted: number; pts: number
 created_ts: number; name: string; f_day: string | null; pet_name: string; walks: number; color: string; dyes: string
 }[]

 const unreadQ = db.prepare('SELECT COUNT(*) n FROM vibes WHERE to_id=? AND from_id=? AND read=0')
 const hugQ = db.prepare('SELECT 1 FROM hug_requests WHERE user_id=? AND day IN (?,?)')
 const sharedToMeQ = db.prepare(
 `SELECT sg.goal_id, sg.kind, g.title, g.emoji FROM shared_goals sg
 JOIN goals g ON g.id=sg.goal_id WHERE sg.owner_id=? AND sg.follower_id=? AND g.archived=0`)
 const sharedByMeQ = db.prepare(
 `SELECT sg.goal_id, sg.kind, g.title, g.emoji FROM shared_goals sg
 JOIN goals g ON g.id=sg.goal_id WHERE sg.owner_id=? AND sg.follower_id=? AND g.archived=0`)

 const friends = rows.map(r => {
 const fDay = r.f_day ?? day
 const stage = stageForWalks(r.walks)
 // last-4-events feed, derived lazily from world tables
 type Ev = { day: string; text: string }
 const feed: Ev[] = []
 const mps = db.prepare('SELECT species_id, name, hatched_day FROM user_micropets WHERE user_id=? ORDER BY id DESC LIMIT 4')
 .all(r.friend_id) as { species_id: string; name: string; hatched_day: string }[]
 for (const m of mps) feed.push({ day: m.hatched_day, text: `Появился микропитомец ${m.name} 🐣` })
 const disc = db.prepare('SELECT day FROM user_discoveries WHERE user_id=? ORDER BY day DESC LIMIT 4')
 .all(r.friend_id) as { day: string }[]
 for (const d of disc) feed.push({ day: d.day, text: 'Новое открытие на прогулке 🔍' })
 const locs = db.prepare(
 'SELECT location_id, first_visit_day FROM location_progress WHERE user_id=? AND first_visit_day IS NOT NULL ORDER BY first_visit_day DESC LIMIT 4')
 .all(r.friend_id) as { location_id: string; first_visit_day: string }[]
 for (const l of locs) {
 const loc = content.locations.locations.find(x => x.id === l.location_id)
 feed.push({ day: l.first_visit_day, text: `Новая локация: ${loc?.ru_name ?? l.location_id} 🗺️` })
 }
 for (const [st, need] of Object.entries(C.STAGE_AT_WALKS)) {
 if (r.walks >= need) {
 const w = db.prepare('SELECT day FROM walks WHERE user_id=? AND completed=1 ORDER BY id LIMIT 1 OFFSET ?')
 .get(r.friend_id, need - 1) as { day: string } | undefined
 if (w) feed.push({ day: w.day, text: `Щенок подрос, теперь ${STAGE_RU[st]}! 🐶` })
 }
 }
 feed.sort((a, b) => (a.day < b.day ? 1 : -1))

 const sharedGoals = [
 ...(sharedToMeQ.all(r.friend_id, me.id) as { goal_id: number; kind: string; title: string; emoji: string }[])
 .map(g => ({
 goalId: g.goal_id, kind: g.kind, title: g.title, emoji: g.emoji, mine: false,
 streak: goalStreak(g.goal_id, fDay), doneToday: goalDoneToday(g.goal_id, fDay),
 })),
 ...(sharedByMeQ.all(me.id, r.friend_id) as { goal_id: number; kind: string; title: string; emoji: string }[])
 .map(g => ({
 goalId: g.goal_id, kind: g.kind, title: g.title, emoji: g.emoji, mine: true,
 streak: goalStreak(g.goal_id, day), doneToday: goalDoneToday(g.goal_id, day),
 })),
 ]

 return {
 id: r.friend_id,
 name: r.nickname || r.name,
 realName: r.name,
 emoji: r.emoji,
 muted: !!r.muted,
 petName: r.pet_name,
 stage,
 color: r.color,
 dyes: r.dyes,
 pts: r.pts,
 level: friendshipLevel(Math.floor(r.pts)),
 unreadVibes: (unreadQ.get(me.id, r.friend_id) as { n: number }).n,
 hugToday: !!hugQ.get(r.friend_id, day, yesterday),
 sharedGoals,
 feed: feed.slice(0, 4),
 }
 })

 // pending incoming friend requests
 const requests = (db.prepare(
 `SELECT fr.from_id, fr.ts, u.name, p.name AS pet_name FROM friend_requests fr
 JOIN users u ON u.id=fr.from_id JOIN pets p ON p.user_id=fr.from_id
 WHERE fr.to_id=? AND fr.status='pending' ORDER BY fr.ts DESC`,
 ).all(me.id) as { from_id: number; ts: number; name: string; pet_name: string }[])
 .map(r => ({ fromId: r.from_id, name: r.name, petName: r.pet_name, ts: r.ts }))

 // 3-day unanswered-vibe nudge
 const nudgeRow = db.prepare(
 `SELECT v.id, v.from_id, v.type, v.ts, u.name FROM vibes v JOIN users u ON u.id=v.from_id
 WHERE v.to_id=? AND v.answered=0 AND v.ts<?
 AND EXISTS(SELECT 1 FROM friendships f WHERE f.user_id=v.to_id AND f.friend_id=v.from_id)
 ORDER BY v.ts LIMIT 1`,
 ).get(me.id, now - C.VIBE_NUDGE_DAYS * 86_400_000) as
 { id: number; from_id: number; type: string; ts: number; name: string } | undefined
 const nudge = nudgeRow
 ? { vibeId: nudgeRow.id, fromId: nudgeRow.from_id, name: nudgeRow.name, type: nudgeRow.type, ts: nudgeRow.ts }
 : null

 // active 1h friend visit (set when answering a vibe with the invite checkbox)
 const s = settingsOf(me.id)
 let visit: { friendId: number; name: string; until: number } | null = null
 const v = s.social_visit as { friendId: number; until: number } | undefined
 if (v && v.until > now) {
 const friend = friends.find(f => f.id === v.friendId)
 if (friend) visit = { friendId: v.friendId, name: friend.name, until: v.until }
 }

 // pending buddy invites (mail kind buddy_invite, 24h expiry)
 const buddyInvites: { mailId: number; fromId: number; fromName: string; title: string; emoji: string; expires: number }[] = []
 const invRows = db.prepare("SELECT id, data FROM mail WHERE user_id=? AND kind='buddy_invite' AND read=0").all(me.id) as
 { id: number; data: string }[]
 for (const m of invRows) {
 try {
 const d = JSON.parse(m.data) as { goalId: number; fromId: number; title: string; emoji: string; expires: number }
 if (d.expires < now) { db.prepare('UPDATE mail SET read=1 WHERE id=?').run(m.id); continue }
 const inviter = getUser(d.fromId)
 if (!inviter) continue
 buddyInvites.push({ mailId: m.id, fromId: d.fromId, fromName: inviter.name, title: d.title, emoji: d.emoji, expires: d.expires })
 } catch { /* skip malformed */ }
 }

 const unreadVibesTotal = (db.prepare('SELECT COUNT(*) n FROM vibes WHERE to_id=? AND read=0').get(me.id) as { n: number }).n
 const hugAvailable = !db.prepare('SELECT 1 FROM hug_requests WHERE user_id=? AND day=?').get(me.id, day)
 const referralCount = (db.prepare('SELECT COUNT(*) n FROM referrals WHERE inviter_id=?').get(me.id) as { n: number }).n
 const myPet = getPet(me.id)

 return c.json({
 me: {
 code: me.friend_code,
 petName: myPet?.name ?? '',
 stage: myPet ? stageForWalks(myPet.walks) : 'baby',
 color: myPet?.color ?? '',
 species: myPet?.species ?? 'dog',
 },
 botUsername: BOT_USERNAME,
 plus: hasPlus(me),
 friends,
 requests,
 buddyInvites,
 unreadVibesTotal,
 hugAvailable,
 nudge,
 visit,
 referral: { count: referralCount, max: C.REFERRAL_MAX_REWARDS },
 vibeTypes: VIBES,
 settings: {
 allowRequests: s.social_allow_requests !== false,
 allowVibes: s.social_allow_vibes !== false,
 notifySocial: s.social_notify !== false,
 },
 })
})

// ----- add friend by code -----
socialRoutes.post('/add', async c => {
 const me = ensureFresh(c.get('user'))
 const body = z.object({ code: z.string().min(4).max(32) }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const code = body.data.code.trim().toUpperCase().replace(/^REF_/, '')
 const target = db.prepare('SELECT * FROM users WHERE friend_code=?').get(code) as UserRow | undefined
 if (!target) return c.json({ error: 'not_found' }, 404)
 if (target.id === me.id) return c.json({ error: 'self' }, 400)
 if (areFriends(me.id, target.id)) return c.json({ error: 'already_friends' }, 409)
 const ts = settingsOf(target.id)
 const blocked = (ts.social_blocked as number[] | undefined) ?? []
 if (ts.social_allow_requests === false || blocked.includes(me.id)) return c.json({ error: 'requests_closed' }, 403)

 // reverse pending → instant mutual friendship
 const reverse = db.prepare("SELECT 1 FROM friend_requests WHERE from_id=? AND to_id=? AND status='pending'").get(target.id, me.id)
 if (reverse) {
 const now = Date.now()
 db.transaction(() => {
 db.prepare("UPDATE friend_requests SET status='accepted' WHERE from_id=? AND to_id=?").run(target.id, me.id)
 db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(me.id, target.id, now)
 db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(target.id, me.id, now)
 mailTo(target.id, 'system', `${me.name} теперь твой друг! 💛`, 'Вы нашли друг друга во Дворике, загляни в гости!')
 })()
 return c.json({ accepted: true })
 }
 const mine = db.prepare("SELECT 1 FROM friend_requests WHERE from_id=? AND to_id=? AND status='pending'").get(me.id, target.id)
 if (mine) return c.json({ error: 'already_sent' }, 409)
 const myPet = getPet(me.id)
 db.transaction(() => {
 db.prepare('INSERT OR REPLACE INTO friend_requests (from_id, to_id, ts, status) VALUES (?,?,?,?)')
 .run(me.id, target.id, Date.now(), 'pending')
 mailTo(target.id, 'friend_request', `${me.name} хочет дружить!`,
 `Щенок ${myPet?.name ?? 'Шарик'} машет хвостиком и ждёт ответа во вкладке «Друзья» 💛`,
 { fromId: me.id, name: me.name, petName: myPet?.name ?? '' })
 })()
 return c.json({ sent: true })
})

// ----- accept / decline friend request -----
socialRoutes.post('/requests/:fromId/accept', c => {
 const me = ensureFresh(c.get('user'))
 const fromId = Number(c.req.param('fromId'))
 const reqRow = db.prepare("SELECT 1 FROM friend_requests WHERE from_id=? AND to_id=? AND status='pending'").get(fromId, me.id)
 if (!reqRow) return c.json({ error: 'not_found' }, 404)
 const now = Date.now()
 db.transaction(() => {
 db.prepare("UPDATE friend_requests SET status='accepted' WHERE from_id=? AND to_id=?").run(fromId, me.id)
 db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(me.id, fromId, now)
 db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(fromId, me.id, now)
 mailTo(fromId, 'system', `${me.name} теперь твой друг! 💛`, 'Заявка принята, вы соседи по Дворику. Загляни в гости!')
 })()
 return c.json({ ok: true })
})

socialRoutes.post('/requests/:fromId/decline', c => {
 const me = ensureFresh(c.get('user'))
 const fromId = Number(c.req.param('fromId'))
 db.prepare("UPDATE friend_requests SET status='declined' WHERE from_id=? AND to_id=? AND status='pending'").run(fromId, me.id)
 return c.json({ ok: true })
})

// ----- per-friend controls: rename / emoji / mute -----
socialRoutes.post('/friends/:id/edit', async c => {
 const me = ensureFresh(c.get('user'))
 const friendId = Number(c.req.param('id'))
 const body = z.object({
 nickname: z.string().max(40).nullable().optional(),
 emoji: z.string().max(8).nullable().optional(),
 muted: z.boolean().optional(),
 }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 if (!areFriends(me.id, friendId)) return c.json({ error: 'not_friends' }, 404)
 const { nickname, emoji, muted } = body.data
 if (nickname !== undefined) db.prepare('UPDATE friendships SET nickname=? WHERE user_id=? AND friend_id=?').run(nickname, me.id, friendId)
 if (emoji !== undefined) db.prepare('UPDATE friendships SET emoji=? WHERE user_id=? AND friend_id=?').run(emoji, me.id, friendId)
 if (muted !== undefined) db.prepare('UPDATE friendships SET muted=? WHERE user_id=? AND friend_id=?').run(muted ? 1 : 0, me.id, friendId)
 return c.json({ ok: true })
})

// ----- unfriend (± block), silent on both sides -----
socialRoutes.post('/friends/:id/unfriend', async c => {
 const me = ensureFresh(c.get('user'))
 const friendId = Number(c.req.param('id'))
 const body = z.object({ block: z.boolean().optional() }).safeParse(await c.req.json().catch(() => ({})))
 const block = body.success ? !!body.data.block : false
 db.transaction(() => {
 db.prepare('DELETE FROM friendships WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)')
 .run(me.id, friendId, friendId, me.id)
 db.prepare('DELETE FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)')
 .run(me.id, friendId, friendId, me.id)
 db.prepare('DELETE FROM shared_goals WHERE (owner_id=? AND follower_id=?) OR (owner_id=? AND follower_id=?)')
 .run(me.id, friendId, friendId, me.id)
 if (block) {
 const s = settingsOf(me.id)
 const blocked = new Set(((s.social_blocked as number[] | undefined) ?? []))
 blocked.add(friendId)
 patchSettings(me.id, { social_blocked: [...blocked] })
 }
 })()
 return c.json({ ok: true })
})

// ----- vibes -----
socialRoutes.post('/vibes/send', async c => {
 const me = ensureFresh(c.get('user'))
 const body = z.object({ friendId: z.number().int(), type: z.string().max(40) })
 .safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const r = sendVibeCore(me, body.data.friendId, body.data.type)
 if ('error' in r) return c.json(r, 400)
 return c.json(r)
})

socialRoutes.get('/vibes/inbox', c => {
 const me = ensureFresh(c.get('user'))
 const rows = db.prepare(
 `SELECT v.id, v.from_id, v.type, v.ts, v.answered, u.name, p.name AS pet_name
 FROM vibes v JOIN users u ON u.id=v.from_id JOIN pets p ON p.user_id=v.from_id
 WHERE v.to_id=? AND v.read=0 ORDER BY v.ts DESC`,
 ).all(me.id) as { id: number; from_id: number; type: string; ts: number; answered: number; name: string; pet_name: string }[]
 const groups = new Map<number, {
 fromId: number; name: string; petName: string; flavor: string
 vibes: { id: number; type: string; ru: string; emoji: string; ts: number; answered: boolean }[]
 }>()
 for (const r of rows) {
 let g = groups.get(r.from_id)
 if (!g) {
 g = { fromId: r.from_id, name: r.name, petName: r.pet_name, flavor: vibeMailText(r.name), vibes: [] }
 groups.set(r.from_id, g)
 }
 const v = VIBES.find(x => x.id === r.type)
 g.vibes.push({ id: r.id, type: r.type, ru: v?.ru ?? r.type, emoji: v?.emoji ?? '💛', ts: r.ts, answered: !!r.answered })
 }
 return c.json({ groups: [...groups.values()], vibeTypes: VIBES, plus: hasPlus(me) })
})

socialRoutes.post('/vibes/:id/answer', async c => {
 const me = ensureFresh(c.get('user'))
 const id = Number(c.req.param('id'))
 const body = z.object({ type: z.string().max(40), invite: z.boolean().optional() })
 .safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const vibe = db.prepare('SELECT * FROM vibes WHERE id=? AND to_id=?').get(id, me.id) as
 { id: number; from_id: number; answered: number } | undefined
 if (!vibe) return c.json({ error: 'not_found' }, 404)
 if (vibe.answered) return c.json({ error: 'already_answered' }, 409)
 db.prepare('UPDATE vibes SET answered=1, read=1 WHERE id=?').run(id)
 const reply = sendVibeCore(me, vibe.from_id, body.data.type)
 let visit: { friendId: number; until: number } | null = null
 if (body.data.invite) {
 visit = { friendId: vibe.from_id, until: Date.now() + C.FRIEND_VISIT_MINUTES * 60_000 }
 patchSettings(me.id, { social_visit: visit })
 }
 return c.json({ reward: 'error' in reply ? null : reply.reward, visit })
})

socialRoutes.post('/vibes/clear', async c => {
 const me = ensureFresh(c.get('user'))
 const body = z.object({ ids: z.array(z.number().int()).max(500).optional() })
 .safeParse(await c.req.json().catch(() => ({})))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const ids = body.data.ids
 if (ids && ids.length) {
 const clear = db.prepare('UPDATE vibes SET read=1 WHERE id=? AND to_id=?')
 db.transaction(() => { for (const id of ids) clear.run(id, me.id) })()
 } else {
 db.prepare('UPDATE vibes SET read=1 WHERE to_id=?').run(me.id)
 }
 return c.json({ ok: true })
})

// ----- hug broadcast (1/day) -----
socialRoutes.post('/hug', c => {
 const me = ensureFresh(c.get('user'))
 const day = me.last_day!
 try {
 db.prepare('INSERT INTO hug_requests (user_id, day) VALUES (?,?)').run(me.id, day)
 } catch {
 return c.json({ error: 'already_today' }, 409)
 }
 const friends = db.prepare('SELECT friend_id FROM friendships WHERE user_id=?').all(me.id) as { friend_id: number }[]
 for (const f of friends) {
 mailTo(f.friend_id, 'system', `${me.name} просит обнимашку 🤗`,
 vibeMailText(me.name) + ' Открой Дворик и обними в ответ ❤️',
 { hug: true, fromId: me.id })
 }
 return c.json({ ok: true, notified: friends.length })
})

// ----- gifts: claiming (sending lives in the economy module) -----
socialRoutes.post('/gifts/:id/claim', c => {
 const me = ensureFresh(c.get('user'))
 const id = Number(c.req.param('id'))
 const gift = db.prepare('SELECT * FROM gifts WHERE id=? AND to_id=? AND claimed=0').get(id, me.id) as
 { id: number; from_id: number; kind: string; item_id: string; color_id: string } | undefined
 if (!gift) return c.json({ error: 'not_found' }, 404)
 db.transaction(() => {
 db.prepare('UPDATE gifts SET claimed=1 WHERE id=?').run(gift.id)
 if (gift.kind === 'micropet') {
 grantMicropet(me.id, gift.item_id, me.last_day ?? isoToday())
 } else {
 db.prepare('INSERT OR IGNORE INTO items_owned (user_id, kind, item_id, color_id, acquired_ts) VALUES (?,?,?,?,?)')
 .run(me.id, gift.kind, gift.item_id, gift.color_id, Date.now())
 }
 })()
 return c.json({ ok: true, kind: gift.kind, itemId: gift.item_id })
})

// ----- goal sharing -----
socialRoutes.post('/goals/:goalId/share', async c => {
 const me = ensureFresh(c.get('user'))
 const goalId = Number(c.req.param('goalId'))
 const body = z.object({ friendIds: z.array(z.number().int()).min(1).max(50) })
 .safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const goal = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=? AND archived=0').get(goalId, me.id) as GoalRow | undefined
 if (!goal) return c.json({ error: 'not_found' }, 404)
 const now = Date.now()
 let shared = 0
 db.transaction(() => {
 for (const fid of body.data.friendIds) {
 if (!areFriends(me.id, fid)) continue
 db.prepare("INSERT OR REPLACE INTO shared_goals (goal_id, owner_id, follower_id, kind, ts) VALUES (?,?,?,'share',?)")
 .run(goalId, me.id, fid, now)
 mailTo(fid, 'system', `${me.name} делится с тобой целью`,
 `«${goal.emoji} ${goal.title}», теперь ты видишь её стрик во Дворике. Поддержи! ⭐`,
 { goalId, fromId: me.id })
 shared += 1
 }
 })()
 return c.json({ ok: true, shared })
})

socialRoutes.post('/goals/:goalId/buddy', async c => {
 const me = ensureFresh(c.get('user'))
 const goalId = Number(c.req.param('goalId'))
 const body = z.object({ friendId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const goal = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=? AND archived=0').get(goalId, me.id) as GoalRow | undefined
 if (!goal) return c.json({ error: 'not_found' }, 404)
 if (!areFriends(me.id, body.data.friendId)) return c.json({ error: 'not_friends' }, 404)
 const expires = Date.now() + 24 * 3_600_000 // 24h accept window
 mailTo(body.data.friendId, 'buddy_invite', `${me.name} зовёт тебя к общей цели!`,
 `«${goal.emoji} ${goal.title}», по разу в день, плечом к плечу. Приглашение действует 24 часа 🤝`,
 { goalId, fromId: me.id, title: goal.title, emoji: goal.emoji, sca: goal.sca, expires })
 return c.json({ ok: true, expires })
})

socialRoutes.post('/buddy/accept', async c => {
 const me = ensureFresh(c.get('user'))
 const body = z.object({ mailId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const m = db.prepare("SELECT * FROM mail WHERE id=? AND user_id=? AND kind='buddy_invite' AND read=0").get(body.data.mailId, me.id) as
 { id: number; data: string } | undefined
 if (!m) return c.json({ error: 'not_found' }, 404)
 let d: { goalId: number; fromId: number; title: string; emoji: string; sca: string | null; expires: number }
 try { d = JSON.parse(m.data) } catch { return c.json({ error: 'bad_invite' }, 400) }
 db.prepare('UPDATE mail SET read=1 WHERE id=?').run(m.id)
 if (d.expires < Date.now()) return c.json({ error: 'expired' }, 410)
 if (!areFriends(me.id, d.fromId)) return c.json({ error: 'not_friends' }, 404)
 const original = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=? AND archived=0').get(d.goalId, d.fromId) as GoalRow | undefined
 if (!original) return c.json({ error: 'goal_gone' }, 404)
 const now = Date.now()
 let mirroredId = 0
 db.transaction(() => {
 const mirrored = addGoal(me.id, d.title, d.emoji || '⭐', d.sca ?? null)
 mirroredId = mirrored.id
 db.prepare("INSERT OR REPLACE INTO shared_goals (goal_id, owner_id, follower_id, kind, ts) VALUES (?,?,?,'buddy',?)")
 .run(d.goalId, d.fromId, me.id, now)
 db.prepare("INSERT OR REPLACE INTO shared_goals (goal_id, owner_id, follower_id, kind, ts) VALUES (?,?,?,'buddy',?)")
 .run(mirrored.id, me.id, d.fromId, now)
 mailTo(d.fromId, 'system', `${me.name} принимает вызов! 🤝`,
 `Вы вместе идёте к цели «${d.emoji} ${d.title}». Вперёд, по шажочку в день!`, { goalId: d.goalId })
 })()
 return c.json({ ok: true, goalId: mirroredId })
})

socialRoutes.post('/buddy/decline', async c => {
 const me = ensureFresh(c.get('user'))
 const body = z.object({ mailId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 db.prepare("UPDATE mail SET read=1 WHERE id=? AND user_id=? AND kind='buddy_invite'").run(body.data.mailId, me.id)
 return c.json({ ok: true })
})

// ----- shared goals overview -----
socialRoutes.get('/goals/shared', c => {
 const me = ensureFresh(c.get('user'))
 const day = me.last_day!
 const following = (db.prepare(
 `SELECT sg.goal_id, sg.kind, sg.owner_id, g.title, g.emoji, u.name, u.last_day AS o_day
 FROM shared_goals sg JOIN goals g ON g.id=sg.goal_id JOIN users u ON u.id=sg.owner_id
 WHERE sg.follower_id=? AND g.archived=0`,
 ).all(me.id) as { goal_id: number; kind: string; owner_id: number; title: string; emoji: string; name: string; o_day: string | null }[])
 .map(r => ({
 goalId: r.goal_id, kind: r.kind, ownerId: r.owner_id, ownerName: r.name,
 title: r.title, emoji: r.emoji,
 streak: goalStreak(r.goal_id, r.o_day ?? day), doneToday: goalDoneToday(r.goal_id, r.o_day ?? day),
 }))
 const mine = (db.prepare(
 `SELECT sg.goal_id, sg.kind, sg.follower_id, g.title, g.emoji, u.name
 FROM shared_goals sg JOIN goals g ON g.id=sg.goal_id JOIN users u ON u.id=sg.follower_id
 WHERE sg.owner_id=? AND g.archived=0`,
 ).all(me.id) as { goal_id: number; kind: string; follower_id: number; title: string; emoji: string; name: string }[])
 .map(r => ({
 goalId: r.goal_id, kind: r.kind, followerId: r.follower_id, followerName: r.name,
 title: r.title, emoji: r.emoji,
 streak: goalStreak(r.goal_id, day), doneToday: goalDoneToday(r.goal_id, day),
 }))
 return c.json({ following, mine })
})

// ----- kudos on a friend's shared goal -----
socialRoutes.post('/goals/:goalId/kudos', async c => {
 const me = ensureFresh(c.get('user'))
 const goalId = Number(c.req.param('goalId'))
 const body = z.object({ ownerId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const row = db.prepare('SELECT 1 FROM shared_goals WHERE goal_id=? AND owner_id=? AND follower_id=?')
 .get(goalId, body.data.ownerId, me.id)
 if (!row) return c.json({ error: 'not_found' }, 404)
 const goal = db.prepare('SELECT * FROM goals WHERE id=?').get(goalId) as GoalRow | undefined
 if (!goal) return c.json({ error: 'not_found' }, 404)
 mailTo(body.data.ownerId, 'system', `${me.name} хвалит тебя! 👏`,
 `За цель «${goal.emoji} ${goal.title}», так держать, ты молодец!`, { goalId, kudos: true, fromId: me.id })
 return c.json({ ok: true })
})

// ----- referrals: ladder status -----
socialRoutes.get('/referrals', c => {
 const me = ensureFresh(c.get('user'))
 settleReferrals(me)
 const fresh = getUser(me.id)!
 const count = (db.prepare('SELECT COUNT(*) n FROM referrals WHERE inviter_id=?').get(me.id) as { n: number }).n
 const link = `https://t.me/${BOT_USERNAME}?startapp=ref_${me.friend_code}`
 return c.json({
 count,
 rewardsClaimed: fresh.referral_rewards,
 max: C.REFERRAL_MAX_REWARDS,
 code: me.friend_code,
 link,
 botUsername: BOT_USERNAME,
 ladder: [
 { tier: 1, ru: `${REFERRAL_TIER1_STONES}🦴 и капюшончик для щенка`, done: fresh.referral_rewards >= 1 },
 { tier: 2, ru: 'Плюшевый кот Лоскуток', done: fresh.referral_rewards >= 2 },
 { tier: 3, ru: 'Микропитомец Корова Печенька 🐮', done: fresh.referral_rewards >= 3 },
 ],
 inviteeGift: `Твой друг сразу получит микропитомца ${speciesName(INVITEE_GIFT_SPECIES)} 🎁`,
 })
})

// Onboarding "тебя пригласили?" capture (also used for the ref_ deep link). Records a
// pending referral timestamped at account creation so it passes the 48h window, then settles.
socialRoutes.post('/referral', async c => {
  const body = z.object({ code: z.string().min(1).max(20) }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const me = ensureFresh(c.get('user'))
  if (me.referred_by) return c.json({ error: 'already_referred' }, 400)
  const code = body.data.code.trim().toUpperCase().replace(/^REF_/, '')
  const inviter = db.prepare('SELECT id, name FROM users WHERE friend_code=?').get(code) as { id: number; name: string } | undefined
  if (!inviter) return c.json({ error: 'bad_code' }, 404)
  if (inviter.id === me.id) return c.json({ error: 'self' }, 400)
  db.prepare('INSERT OR REPLACE INTO pending_referrals (tg_id, inviter_id, ts) VALUES (?,?,?)')
    .run(me.id, inviter.id, Date.parse(me.created_at) || Date.now())
  settleReferrals(me)
  const ok = !!getUser(me.id)?.referred_by
  return c.json({ ok, inviterName: inviter.name })
})
