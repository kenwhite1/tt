// «Содружок» / co-op puppy — a second, SHARED puppy co-raised by 2 users.
// Interdependent (grows only when BOTH contribute that day), additive-only, no-punishment.
// The shared bar is DERIVED each read from goal_completions — never stored. See docs/SPEC-COOP-PUPPY.md.
import { Hono } from 'hono'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { C, stageForWalks, friendshipLevel, type Stage } from '../../../shared/constants'
import type { CoopDto, CoopMemberDto } from '../../../shared/types'
import { content } from '../content'
import { db } from '../db'
import { addStones, getUser } from '../engine/core'
import { ensureFresh, gameDay } from '../engine/day'
import { settleReferrals } from './social'
import { sendDM } from '../jobs'
import { logEvent, logFirst } from '../engine/analytics'
import type { Env } from '../env'
import type { PetRow, UserRow } from '../engine/rows'

export const coopRoutes = new Hono<Env>()

// ----- content (own module data; data-only, a non-coder can extend it) -----
const coopContent = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'coop_content.json'), 'utf8'),
) as {
  walk_stories: { id: string; ru_text: string; discovery_id: string | null }[]
  discoveries: { id: string; ru_name: string; emoji: string }[]
  bonded_micropets: { stage: string; species_id: string }[]
  egg_colors: { id: string; ru: string; hex: string }[]
}

const PER = C.COOP_CONTRIB_PER_MEMBER
const BOT_USERNAME = process.env.BOT_USERNAME || 'sharikrubot'

// ----- rows -----
interface CoopRow {
  id: number; name: string; pronouns: string; color: string; species: string; dyes: string
  walks: number; status: 'pending' | 'active' | 'dormant'
  streak: number; streak_day: string | null; created_at: string
}
interface MemberRow { coop_id: number; user_id: number; role: 'founder' | 'member'; last_contrib_day: string | null; joined_ts: number }
interface CoopWalkRow { id: number; coop_id: number; day: string; started_ts: number; ends_ts: number; completed: number; story_id: string | null; discovery_id: string | null }

// ----- small helpers (mirror social.ts patterns; local to keep the module self-contained) -----
const q = {
  coop: db.prepare('SELECT * FROM coop_pets WHERE id=?'),
  members: db.prepare('SELECT * FROM coop_members WHERE coop_id=? ORDER BY role DESC, joined_ts'),
  myMemberships: db.prepare('SELECT coop_id FROM coop_members WHERE user_id=?'),
  isMember: db.prepare('SELECT 1 FROM coop_members WHERE coop_id=? AND user_id=?'),
  activeWalk: db.prepare('SELECT * FROM coop_walks WHERE coop_id=? AND completed=0 ORDER BY id DESC LIMIT 1'),
  walkToday: db.prepare('SELECT 1 FROM coop_walks WHERE coop_id=? AND day=? LIMIT 1'),
  pet: db.prepare('SELECT * FROM pets WHERE user_id=?'),
  completionsOn: db.prepare('SELECT COUNT(*) n FROM goal_completions WHERE user_id=? AND day=?'),
}

function getPet(uid: number): PetRow | undefined { return q.pet.get(uid) as PetRow | undefined }
function isoNow() { return Date.now() }

function mailTo(uid: number, kind: string, title: string, body: string, data: Record<string, unknown> = {}) {
  db.prepare('INSERT INTO mail (user_id, kind, title, body, data, ts) VALUES (?,?,?,?,?,?)')
    .run(uid, kind, title, body, JSON.stringify(data), Date.now())
}

function areFriends(a: number, b: number): boolean {
  return !!db.prepare('SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?').get(a, b)
}
function ensureFriends(a: number, b: number) {
  const now = Date.now()
  db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(a, b, now)
  db.prepare('INSERT OR IGNORE INTO friendships (user_id, friend_id, created_ts) VALUES (?,?,?)').run(b, a, now)
}

function genCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return s
}

// co-op-exclusive micropet for both members when a stage is cleared
function grantBondedMicropet(uid: number, speciesId: string, day: string) {
  const natures = content.micropets.natures
  const sp = content.micropets.species.find(s => s.id === speciesId) as { ru_name: string } | undefined
  const name = sp ? sp.ru_name.split(', ')[0] : speciesId
  db.prepare(
    `INSERT INTO user_micropets (user_id, species_id, variant, name, pronouns, nature, hatched_day)
     VALUES (?,?,?,?,?,?,?)`,
  ).run(uid, speciesId, 'coop', name, 'they', natures[Math.floor(Math.random() * natures.length)] ?? '', day)
}

// derived contribution for one member, on THEIR own game-day
function contribOf(u: UserRow): { day: string; contrib: number } {
  const day = gameDay(u)
  const n = (q.completionsOn.get(u.id, day) as { n: number }).n
  return { day, contrib: Math.min(PER, n) }
}

function activeBondCount(uid: number): number {
  return (db.prepare(
    `SELECT COUNT(*) n FROM coop_members m JOIN coop_pets c ON c.id=m.coop_id
     WHERE m.user_id=? AND c.status IN ('pending','active')`,
  ).get(uid) as { n: number }).n
}

// Lazily complete a co-op walk whose timer elapsed (mirrors personal walk completion).
function completeCoopWalkIfDue(coopId: number): { completed: boolean; leveledTo?: Stage; storyId?: string } {
  const w = q.activeWalk.get(coopId) as CoopWalkRow | undefined
  if (!w || w.completed || w.ends_ts > isoNow()) return { completed: false }
  const cp = q.coop.get(coopId) as CoopRow
  const beforeStage = stageForWalks(cp.walks)
  const walks = cp.walks + 1
  const afterStage = stageForWalks(walks)
  const story = coopContent.walk_stories[Math.floor(Math.random() * coopContent.walk_stories.length)]
  const members = q.members.all(coopId) as MemberRow[]
  // co-op streak: each completed co-op walk = a confirmed "both showed up" day
  const today = w.day
  const yesterday = shiftDay(today, -1)
  const streak = cp.streak_day === today ? cp.streak : cp.streak_day === yesterday ? cp.streak + 1 : 1

  db.transaction(() => {
    db.prepare('UPDATE coop_walks SET completed=1, story_id=?, discovery_id=? WHERE id=?')
      .run(story.id, story.discovery_id, w.id)
    db.prepare('UPDATE coop_pets SET walks=?, walk_completed=1, walk_story_id=?, streak=?, streak_day=? WHERE id=?')
      .run(walks, story.id, streak, today, coopId)
    const level = friendshipLevel(Math.floor(memberPairPts(members)))
    for (const m of members) {
      addStones(m.user_id, C.COOP_WALK_STONES, 'coop_walk')
      logEvent(m.user_id, 'coop_walk', { coopId })
    }
    // mutual friendship points for the pair (both directional rows), modest +1 like a personal walk
    if (members.length === 2) {
      const [a, b] = members
      db.prepare('UPDATE friendships SET pts=pts+1 WHERE user_id=? AND friend_id=?').run(a.user_id, b.user_id)
      db.prepare('UPDATE friendships SET pts=pts+1 WHERE user_id=? AND friend_id=?').run(b.user_id, a.user_id)
      void level
    }
    // bonded micropet for everyone when a stage is cleared
    if (afterStage !== beforeStage) {
      const bonded = coopContent.bonded_micropets.find(x => x.stage === afterStage)
      if (bonded) for (const m of members) grantBondedMicropet(m.user_id, bonded.species_id, today)
    }
  })()
  return { completed: true, leveledTo: afterStage !== beforeStage ? afterStage : undefined, storyId: story.id }
}

function memberPairPts(members: MemberRow[]): number {
  if (members.length < 2) return 0
  const row = db.prepare('SELECT pts FROM friendships WHERE user_id=? AND friend_id=?')
    .get(members[0].user_id, members[1].user_id) as { pts: number } | undefined
  return row?.pts ?? 0
}

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Build the client DTO for one bond, from the requester's perspective.
function buildDto(coopId: number, meId: number, meDay: string): CoopDto | null {
  const cp = q.coop.get(coopId) as CoopRow | undefined
  if (!cp) return null
  completeCoopWalkIfDue(coopId)
  const fresh = q.coop.get(coopId) as CoopRow
  const members = q.members.all(coopId) as MemberRow[]
  const stage = stageForWalks(fresh.walks)

  const memberDtos: CoopMemberDto[] = members.map(m => {
    const u = getUser(m.user_id)!
    const pet = getPet(m.user_id)
    const { contrib } = contribOf(u)
    return {
      userId: m.user_id, name: u.name, species: pet?.species ?? 'dog',
      contrib, isMe: m.user_id === meId, role: m.role, showedUp: contrib >= PER,
    }
  })
  const bar = memberDtos.reduce((s, m) => s + m.contrib, 0)
  const barFull = PER * Math.max(1, members.length)
  const myContrib = memberDtos.find(m => m.isMe)?.contrib ?? 0

  const w = q.activeWalk.get(coopId) as CoopWalkRow | undefined
  const walkInProgress = w && !w.completed && w.ends_ts > isoNow()
  const walkClaimable = !!w && !w.completed && w.ends_ts <= isoNow()
  const walkedToday = !!q.walkToday.get(coopId, meDay)
  const walkReady = fresh.status === 'active' && bar >= barFull && !w && !walkedToday

  const pts = memberPairPts(members)
  return {
    id: fresh.id, name: fresh.name, pronouns: fresh.pronouns, species: fresh.species,
    color: fresh.color, dyes: safeJson(fresh.dyes), stage, walks: fresh.walks, status: fresh.status,
    bar, barFull, myContrib, members: memberDtos,
    walk: walkInProgress ? { startedTs: w!.started_ts, endsTs: w!.ends_ts, completed: false } : null,
    walkReady, walkClaimable,
    streak: fresh.streak,
    friendshipPts: pts, friendshipLevel: friendshipLevel(Math.floor(pts)),
    shareCode: shareCodeFor(coopId),
  }
}

function safeJson(s: string): Record<string, string> {
  try { return JSON.parse(s || '{}') as Record<string, string> } catch { return {} }
}

// A stable open-link invite code for a bond (creates one lazily if missing).
function shareCodeFor(coopId: number): string {
  const row = db.prepare("SELECT code FROM coop_invites WHERE coop_id=? AND code IS NOT NULL ORDER BY id LIMIT 1")
    .get(coopId) as { code: string } | undefined
  return row?.code ?? ''
}

// =====================================================================
// routes
// =====================================================================

// founder creates a pending shared puppy + invites a friend (friendId) or makes an open link
coopRoutes.post('/create', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({
    friendId: z.number().int().optional(),
    name: z.string().min(1).max(30).optional(),
    species: z.string().max(20).optional(),
    color: z.string().max(20).optional(),
  }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  if (activeBondCount(me.id) >= C.COOP_MAX_ACTIVE) return c.json({ error: 'cap' }, 409)

  const myPet = getPet(me.id)
  const name = (body.data.name ?? `Наш ${myPet?.name ?? 'щенок'}`).slice(0, 30)
  const species = body.data.species ?? myPet?.species ?? 'dog'
  const color = body.data.color ?? 'golden'
  const code = genCode()
  let coopId = 0
  db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO coop_pets (name, species, color, status, created_at) VALUES (?,?,?,?,?)',
    ).run(name, species, color, 'pending', new Date().toISOString())
    coopId = Number(r.lastInsertRowid)
    db.prepare('INSERT INTO coop_members (coop_id, user_id, role, joined_ts) VALUES (?,?,?,?)')
      .run(coopId, me.id, 'founder', Date.now())
    const toId = body.data.friendId && areFriends(me.id, body.data.friendId) ? body.data.friendId : null
    db.prepare('INSERT INTO coop_invites (coop_id, from_id, to_id, code, status, ts) VALUES (?,?,?,?,?,?)')
      .run(coopId, me.id, toId, code, 'pending', Date.now())
    if (toId) {
      mailTo(toId, 'coop_invite', `${me.name} зовёт завести общего щенка! 🐾`,
        `Вы будете растить ${name} вдвоём, по очереди заботясь о нём. Открой «Друзья», чтобы согласиться 💛`,
        { coopId, code, fromId: me.id })
      sendDM(toId, `${me.name} зовёт тебя завести общего щенка 🐾 Откройте «Друзья» — там ждёт ${name}.`)
    }
  })()
  logEvent(me.id, 'coop_create', { hasFriend: !!body.data.friendId })
  const link = `https://t.me/${BOT_USERNAME}?startapp=coop_${code}`
  return c.json({ coop: buildDto(coopId, me.id, me.last_day!), code, link })
})

// accept an invite (by code from a link, or a direct invite addressed to me) → co-hatch, activate
coopRoutes.post('/accept', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ code: z.string().max(32).optional() }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const code = body.data.code?.trim().toUpperCase().replace(/^COOP_/, '')

  const invite = (code
    ? db.prepare("SELECT * FROM coop_invites WHERE code=? AND status='pending' ORDER BY id DESC LIMIT 1").get(code)
    : db.prepare("SELECT * FROM coop_invites WHERE to_id=? AND status='pending' ORDER BY id DESC LIMIT 1").get(me.id)
  ) as { id: number; coop_id: number; from_id: number; to_id: number | null } | undefined
  if (!invite) return c.json({ error: 'invite_not_found' }, 404)
  if (invite.from_id === me.id) return c.json({ error: 'own_invite' }, 400)
  if (q.isMember.get(invite.coop_id, me.id)) return c.json({ error: 'already_member' }, 409)
  if (activeBondCount(me.id) >= C.COOP_MAX_ACTIVE) return c.json({ error: 'cap' }, 409)
  const members = q.members.all(invite.coop_id) as MemberRow[]
  if (members.length >= 4) return c.json({ error: 'full' }, 409)

  db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO coop_members (coop_id, user_id, role, joined_ts) VALUES (?,?,?,?)')
      .run(invite.coop_id, me.id, 'member', Date.now())
    db.prepare("UPDATE coop_invites SET status='accepted' WHERE id=?").run(invite.id)
    db.prepare("UPDATE coop_pets SET status='active' WHERE id=?").run(invite.coop_id)
    ensureFriends(me.id, invite.from_id)
    const founder = getUser(invite.from_id)
    const cp = q.coop.get(invite.coop_id) as CoopRow
    if (founder) {
      mailTo(invite.from_id, 'system', `${me.name} согласился(ась)! Вы вместе растите ${cp.name} 🐣`,
        'Общий щенок вылупился. Кормите его вдвоём — он растёт, только когда оба заходят 💛', { coopId: invite.coop_id })
      sendDM(invite.from_id, `${me.name} принял(а) приглашение — ваш общий щенок ${cp.name} вылупился! 🐣`)
    }
  })()
  // co-op also feeds the referral ladder if the accepter is a fresh invite from a link
  settleReferrals(me)
  logEvent(me.id, 'coop_accept', { coopId: invite.coop_id })
  logFirst(invite.from_id, 'first_invite_accepted', { via: 'coop' })
  return c.json({ coop: buildDto(invite.coop_id, me.id, me.last_day!) })
})

// all of my bonds + any pending invites addressed to me
coopRoutes.get('/list', c => {
  const me = ensureFresh(c.get('user'))
  const day = me.last_day!
  const ids = (q.myMemberships.all(me.id) as { coop_id: number }[]).map(r => r.coop_id)
  const bonds = ids.map(id => buildDto(id, me.id, day)).filter(Boolean) as CoopDto[]
  const invites = (db.prepare(
    `SELECT i.id, i.coop_id, i.from_id, i.code, c.name, u.name AS from_name
     FROM coop_invites i JOIN coop_pets c ON c.id=i.coop_id JOIN users u ON u.id=i.from_id
     WHERE i.to_id=? AND i.status='pending'`,
  ).all(me.id) as { id: number; coop_id: number; from_id: number; code: string; name: string; from_name: string }[])
    .map(r => ({ inviteId: r.id, coopId: r.coop_id, fromId: r.from_id, fromName: r.from_name, name: r.name, code: r.code }))
  return c.json({
    bonds, invites, maxActive: C.COOP_MAX_ACTIVE, canCreate: activeBondCount(me.id) < C.COOP_MAX_ACTIVE,
    botUsername: BOT_USERNAME, eggColors: coopContent.egg_colors, contribPerMember: PER,
  })
})

function requireMember(coopId: number, meId: number): CoopRow | null {
  if (!q.isMember.get(coopId, meId)) return null
  return (q.coop.get(coopId) as CoopRow) ?? null
}

// start the co-op walk (either member, once both halves are full, 1/day)
coopRoutes.post('/walk/start', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const dto = buildDto(body.data.coopId, me.id, me.last_day!)
  if (!dto || !requireMember(body.data.coopId, me.id)) return c.json({ error: 'not_member' }, 404)
  if (!dto.walkReady) return c.json({ error: 'not_ready' }, 400)
  const stage = dto.stage
  const start = Date.now()
  const ends = start + C.WALK_HOURS[stage] * 3_600_000
  db.transaction(() => {
    db.prepare('INSERT INTO coop_walks (coop_id, day, started_ts, ends_ts) VALUES (?,?,?,?)')
      .run(body.data.coopId, me.last_day!, start, ends)
    db.prepare('UPDATE coop_pets SET walk_day=?, walk_started_ts=?, walk_ends_ts=?, walk_completed=0 WHERE id=?')
      .run(me.last_day!, start, ends, body.data.coopId)
  })()
  return c.json({ coop: buildDto(body.data.coopId, me.id, me.last_day!) })
})

// claim a finished co-op walk (lazy-complete; pays BOTH). Safe to call repeatedly.
coopRoutes.post('/walk/claim', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  if (!requireMember(body.data.coopId, me.id)) return c.json({ error: 'not_member' }, 404)
  const r = completeCoopWalkIfDue(body.data.coopId)
  const story = r.storyId ? coopContent.walk_stories.find(s => s.id === r.storyId) : undefined
  const disc = story?.discovery_id ? coopContent.discoveries.find(d => d.id === story.discovery_id) : undefined
  return c.json({
    coop: buildDto(body.data.coopId, me.id, me.last_day!),
    claimed: r.completed,
    reward: r.completed ? { stones: C.COOP_WALK_STONES } : null,
    story: story ? story.ru_text : null,
    leveledTo: r.leveledTo ?? null,
    discovery: disc ? { ru: disc.ru_name, emoji: disc.emoji } : null,
  })
})

// shared pat — cosmetic only (hearts on the client), no stat behind it
coopRoutes.post('/pet', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  if (!requireMember(body.data.coopId, me.id)) return c.json({ error: 'not_member' }, 404)
  return c.json({ ok: true })
})

// rename — both members must agree (lightweight propose→confirm handshake via settings)
coopRoutes.post('/rename', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int(), name: z.string().min(1).max(30), confirm: z.boolean().optional() })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const cp = requireMember(body.data.coopId, me.id)
  if (!cp) return c.json({ error: 'not_member' }, 404)
  const members = q.members.all(body.data.coopId) as MemberRow[]
  const others = members.filter(m => m.user_id !== me.id)
  // solo bond (partner left) → rename immediately
  if (others.length === 0) {
    db.prepare('UPDATE coop_pets SET name=? WHERE id=?').run(body.data.name, body.data.coopId)
    return c.json({ ok: true, applied: true })
  }
  const key = `coop_rename_${body.data.coopId}`
  const proposalByOther = others.some(o => (settingsOf(o.user_id)[key] as string) === body.data.name)
  if (body.data.confirm && proposalByOther) {
    db.transaction(() => {
      db.prepare('UPDATE coop_pets SET name=? WHERE id=?').run(body.data.name, body.data.coopId)
      for (const m of members) clearSetting(m.user_id, key)
    })()
    return c.json({ ok: true, applied: true })
  }
  // record my proposal and ask the partner to confirm
  patchSettings(me.id, { [key]: body.data.name })
  for (const o of others) {
    mailTo(o.user_id, 'coop', 'Предложение переименовать общего щенка',
      `${me.name} предлагает имя «${body.data.name}». Подтверди во вкладке «Друзья», если нравится 💛`, { coopId: body.data.coopId, name: body.data.name })
  }
  return c.json({ ok: true, applied: false, pending: true })
})

// «Пауза двора» — cosmetic dormant toggle (grants/removes nothing)
coopRoutes.post('/pause', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int(), pause: z.boolean() }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const cp = requireMember(body.data.coopId, me.id)
  if (!cp) return c.json({ error: 'not_member' }, 404)
  db.prepare('UPDATE coop_pets SET status=? WHERE id=?').run(body.data.pause ? 'dormant' : 'active', body.data.coopId)
  return c.json({ coop: buildDto(body.data.coopId, me.id, me.last_day!) })
})

// leave — never deletes the shared puppy; the surviving member keeps it (read-only) and may re-invite
coopRoutes.post('/leave', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int() }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  if (!requireMember(body.data.coopId, me.id)) return c.json({ error: 'not_member' }, 404)
  db.transaction(() => {
    db.prepare('DELETE FROM coop_members WHERE coop_id=? AND user_id=?').run(body.data.coopId, me.id)
    const left = (q.members.all(body.data.coopId) as MemberRow[])
    if (left.length === 0) db.prepare("UPDATE coop_pets SET status='dormant' WHERE id=?").run(body.data.coopId)
  })()
  return c.json({ ok: true })
})

// re-invite a new partner into an existing (e.g. orphaned) bond
coopRoutes.post('/invite', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ coopId: z.number().int(), friendId: z.number().int().optional() })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const cp = requireMember(body.data.coopId, me.id)
  if (!cp) return c.json({ error: 'not_member' }, 404)
  const code = genCode()
  const toId = body.data.friendId && areFriends(me.id, body.data.friendId) ? body.data.friendId : null
  db.prepare('INSERT INTO coop_invites (coop_id, from_id, to_id, code, status, ts) VALUES (?,?,?,?,?,?)')
    .run(body.data.coopId, me.id, toId, code, 'pending', Date.now())
  if (toId) {
    mailTo(toId, 'coop_invite', `${me.name} зовёт растить общего щенка ${cp.name}! 🐾`,
      'Открой «Друзья», чтобы согласиться 💛', { coopId: body.data.coopId, code, fromId: me.id })
    sendDM(toId, `${me.name} зовёт тебя растить общего щенка 🐾`)
  }
  return c.json({ ok: true, code, link: `https://t.me/${BOT_USERNAME}?startapp=coop_${code}` })
})

// ----- settings helpers (used by the rename handshake) -----
function settingsOf(uid: number): Record<string, unknown> {
  const row = db.prepare('SELECT settings FROM users WHERE id=?').get(uid) as { settings: string } | undefined
  try { return JSON.parse(row?.settings || '{}') as Record<string, unknown> } catch { return {} }
}
function patchSettings(uid: number, patch: Record<string, unknown>) {
  const s = { ...settingsOf(uid), ...patch }
  db.prepare('UPDATE users SET settings=? WHERE id=?').run(JSON.stringify(s), uid)
}
function clearSetting(uid: number, key: string) {
  const s = settingsOf(uid); delete s[key]
  db.prepare('UPDATE users SET settings=? WHERE id=?').run(JSON.stringify(s), uid)
}
