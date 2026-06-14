import { C, stageForWalks, friendshipLevel } from '../../../shared/constants'
import type { GoalDto, RewardDto, StateDto } from '../../../shared/types'
import { db } from '../db'
import { ensureFresh, gameDay } from './day'
import type { GoalRow, PetRow, UserRow, WalkRow } from './rows'

const q = {
  user: db.prepare('SELECT * FROM users WHERE id=?'),
  pet: db.prepare('SELECT * FROM pets WHERE user_id=?'),
  goals: db.prepare('SELECT * FROM goals WHERE user_id=? AND archived=0 ORDER BY sort, id'),
  goal: db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?'),
  completionsToday: db.prepare('SELECT goal_id, COUNT(*) n FROM goal_completions WHERE user_id=? AND day=? GROUP BY goal_id'),
  walkToday: db.prepare('SELECT * FROM walks WHERE user_id=? AND day=? ORDER BY id DESC LIMIT 1'),
  moodToday: db.prepare('SELECT value FROM moods WHERE user_id=? AND day=? ORDER BY ts DESC LIMIT 1'),
}

export function getUser(id: number): UserRow | undefined {
  return q.user.get(id) as UserRow | undefined
}

export function addStones(userId: number, delta: number, reason: string) {
  db.prepare('UPDATE users SET stones=stones+? WHERE id=?').run(delta, userId)
  db.prepare('INSERT INTO ledger (user_id, delta, reason, ts) VALUES (?,?,?,?)').run(userId, delta, reason, Date.now())
}

function genFriendCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'
  let s = ''
  for (let i = 0; i < 10; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return s
}

export function bootstrapUser(tgId: number, name: string, opts: {
  petName: string; pronouns: string; color: string; trait: string; species?: string; tz?: string
}): UserRow {
  const now = new Date().toISOString()
  const tz = opts.tz ?? 'Europe/Moscow'
  db.prepare(
    `INSERT INTO users (id, name, tz, friend_code, created_at) VALUES (?,?,?,?,?)`,
  ).run(tgId, name, tz, genFriendCode(), now)
  const user = getUser(tgId)!
  const day = gameDay(user)
  db.prepare(
    `INSERT INTO pets (user_id, name, species, pronouns, color, trait, hatch_day) VALUES (?,?,?,?,?,?,?)`,
  ).run(tgId, opts.petName, opts.species ?? 'dog', opts.pronouns, opts.color, opts.trait, day)
  // Every new pup gets 7 days of Шарик Плюс free (honest "7 дней бесплатно", Finch-style).
  const trialUntil = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  db.prepare('UPDATE users SET plus_until=? WHERE id=?').run(trialUntil, tgId)
  return getUser(tgId)!
}

export function addGoal(userId: number, title: string, emoji: string, sca: string | null, timesPerDay = 1): GoalRow {
  const r = db.prepare(
    `INSERT INTO goals (user_id, title, emoji, sca, times_per_day, created_at) VALUES (?,?,?,?,?,?)`,
  ).run(userId, title, emoji, sca, Math.min(timesPerDay, C.GOAL_MAX_PER_DAY), new Date().toISOString())
  return q.goal.get(r.lastInsertRowid, userId) as GoalRow
}

function activeWalk(user: UserRow, day: string): WalkRow | null {
  const w = q.walkToday.get(user.id, day) as WalkRow | undefined
  if (!w) return null
  if (!w.completed && w.ends_ts <= Date.now()) return completeWalk(user, w)
  return w
}

function completeWalk(user: UserRow, w: WalkRow): WalkRow {
  const pet = q.pet.get(user.id) as PetRow
  const walks = pet.walks + 1
  const ptsBefore = pet.friendship_pts
  const pts = ptsBefore + 1 // passive point per walk
  const lvl = friendshipLevel(pts)
  const stones =
    C.WALK_BASE_STONES +
    C.FRIENDSHIP_WALK_BONUS[friendshipLevel(ptsBefore) - 1] +
    Math.floor(user.streak / 7) * 2
  db.transaction(() => {
    db.prepare('UPDATE walks SET completed=1 WHERE id=?').run(w.id)
    db.prepare('UPDATE pets SET walks=?, friendship_pts=? WHERE user_id=?').run(walks, pts, user.id)
    if (lvl > friendshipLevel(ptsBefore)) addStones(user.id, C.FRIENDSHIP_LEVEL_STONES, 'friendship_level')
    const repairsEarned = Math.floor(walks / C.STREAK_REPAIR_PER_WALKS) - Math.floor(pet.walks / C.STREAK_REPAIR_PER_WALKS)
    if (repairsEarned > 0 && user.repairs < C.STREAK_REPAIR_MAX) {
      db.prepare('UPDATE users SET repairs=MIN(?, repairs+?) WHERE id=?').run(C.STREAK_REPAIR_MAX, repairsEarned, user.id)
    }
    addStones(user.id, stones, 'walk_complete')
  })()
  return { ...w, completed: 1 }
}

export function isLowMoodDay(userId: number, day: string): boolean {
  const m = q.moodToday.get(userId, day) as { value: number } | undefined
  return !!m && m.value <= C.MOOD_LOW_MAX
}

export function completeGoal(userRaw: UserRow, goalId: number): { reward: RewardDto } | { error: string } {
  const user = ensureFresh(userRaw)
  const day = user.last_day!
  const goal = q.goal.get(goalId, user.id) as GoalRow | undefined
  if (!goal || goal.archived) return { error: 'not_found' }
  const doneRow = db.prepare('SELECT COUNT(*) n FROM goal_completions WHERE goal_id=? AND day=?').get(goalId, day) as { n: number }
  if (doneRow.n >= goal.times_per_day) return { error: 'done_for_today' }

  const low = isLowMoodDay(user.id, day)
  const energyGain = low ? C.GOAL_ENERGY_LOW_MOOD : C.GOAL_ENERGY
  const stonesGain = (low ? C.GOAL_STONES_LOW_MOOD : C.GOAL_STONES) + (goal.goal_of_day === day ? 2 + Math.floor(Math.random() * 4) : 0)

  const pet = q.pet.get(user.id) as PetRow
  const bar = C.ENERGY_BAR[stageForWalks(pet.walks)]
  const walk = activeWalk(user, day)

  let reward: RewardDto = { energy: 0, stones: stonesGain }
  db.transaction(() => {
    db.prepare('INSERT INTO goal_completions (goal_id, user_id, day, ts) VALUES (?,?,?,?)').run(goalId, user.id, day, Date.now())
    if (walk && !walk.completed) {
      // during a walk: energy shortens it, 2 min per point
      const cut = energyGain * C.WALK_MINUTES_PER_ENERGY * 60_000
      db.prepare('UPDATE walks SET ends_ts=? WHERE id=?').run(Math.max(Date.now(), walk.ends_ts - cut), walk.id)
      reward = { energy: 0, stones: stonesGain, walkMinutesReduced: energyGain * C.WALK_MINUTES_PER_ENERGY }
    } else if (user.energy < bar) {
      const e = Math.min(energyGain, bar - user.energy)
      db.prepare('UPDATE users SET energy=energy+? WHERE id=?').run(e, user.id)
      reward = { energy: e, stones: stonesGain }
    }
    addStones(user.id, stonesGain, 'goal')
  })()
  return { reward }
}

export function startWalk(userRaw: UserRow): { walk: WalkRow } | { error: string } {
  const user = ensureFresh(userRaw)
  const day = user.last_day!
  const pet = q.pet.get(user.id) as PetRow
  const stage = stageForWalks(pet.walks)
  if (user.energy < C.ENERGY_BAR[stage]) return { error: 'not_enough_energy' }
  if (q.walkToday.get(user.id, day)) return { error: 'walk_done_today' }
  const start = Date.now()
  const ends = start + C.WALK_HOURS[stage] * 3_600_000
  const r = db.prepare(
    'INSERT INTO walks (user_id, day, location_id, started_ts, ends_ts) VALUES (?,?,?,?,?)',
  ).run(user.id, day, user.location_id, start, ends)
  return { walk: db.prepare('SELECT * FROM walks WHERE id=?').get(r.lastInsertRowid) as WalkRow }
}

export function patPet(userRaw: UserRow, count: number): { pts: number } {
  const user = ensureFresh(userRaw)
  const pet = q.pet.get(user.id) as PetRow
  const pats = pet.pats_today + Math.max(0, Math.min(count, 200))
  const newPts = Math.floor(pats / C.PATS_PER_POINT) - Math.floor(pet.pats_today / C.PATS_PER_POINT)
  db.prepare('UPDATE pets SET pats_today=?, friendship_pts=friendship_pts+? WHERE user_id=?').run(pats, newPts, user.id)
  return { pts: newPts }
}

export function logMood(userRaw: UserRow, value: number, note?: string, factors?: string[]) {
  const user = ensureFresh(userRaw)
  db.prepare('INSERT INTO moods (user_id, day, value, note, factors, ts) VALUES (?,?,?,?,?,?)')
    .run(user.id, user.last_day, value, note ?? null, factors ? JSON.stringify(factors) : null, Date.now())
}

export function getState(userRaw: UserRow): StateDto {
  const user = ensureFresh(userRaw)
  const day = user.last_day!
  const pet = q.pet.get(user.id) as PetRow
  const stage = stageForWalks(pet.walks)
  const walk = activeWalk(user, day)
  const done = new Map((q.completionsToday.all(user.id, day) as { goal_id: number; n: number }[]).map(r => [r.goal_id, r.n]))
  const moodRow = q.moodToday.get(user.id, day) as { value: number } | undefined

  const goals: GoalDto[] = (q.goals.all(user.id) as GoalRow[]).map(g => ({
    id: g.id,
    title: g.title,
    emoji: g.emoji,
    sca: g.sca,
    timesPerDay: g.times_per_day,
    doneToday: done.get(g.id) ?? 0,
    isGoalOfDay: g.goal_of_day === day,
    paused: !!g.paused,
  }))

  return {
    user: {
      id: user.id, name: user.name, stones: user.stones, streak: user.streak,
      streakBest: user.streak_best, repairs: user.repairs, friendCode: user.friend_code,
      plus: !!user.plus_until && user.plus_until >= day, pausedUntil: user.paused_until,
      wakeMin: user.wake_min, sleepMin: user.sleep_min, tz: user.tz,
    },
    pet: {
      name: pet.name, species: pet.species, pronouns: pet.pronouns, stage, walks: pet.walks,
      friendshipPts: pet.friendship_pts, friendshipLevel: friendshipLevel(pet.friendship_pts),
      color: pet.color, trait: pet.trait, hatchDay: pet.hatch_day,
    },
    day,
    energy: user.energy,
    energyMax: C.ENERGY_BAR[stage],
    walk: walk ? {
      id: walk.id, locationId: walk.location_id, startedTs: walk.started_ts,
      endsTs: walk.ends_ts, completed: !!walk.completed, chatDone: !!walk.chat_done,
    } : null,
    walkReady: !walk && user.energy >= C.ENERGY_BAR[stage],
    moodToday: moodRow?.value ?? null,
    lowMoodDay: isLowMoodDay(user.id, day),
    goals,
  }
}
