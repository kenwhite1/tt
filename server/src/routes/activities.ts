// Activities module: hamburger menu backend — activities suite, reflections, insights,
// history, settings, pause, streak repair. See docs/ARCHITECTURE.md + SPEC §3.7/§4.
import { Hono } from 'hono'
import { z } from 'zod'
import { C, stageForWalks } from '../../../shared/constants'
import { db } from '../db'
import { addStones } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { content } from '../content'
import { hasPlus, type Env } from '../env'
import type { GoalRow, PetRow, UserRow, WalkRow } from '../engine/rows'

export const activitiesRoutes = new Hono<Env>()

// ===== content typing (shapes live in server/content/*.json) =====
interface BreathPhase { label_ru: string; seconds: number }
interface BreathPattern { id: string; ru_name: string; tabs: string[]; phases: BreathPhase[]; plus: boolean }
interface GroundingEx { id: string; ru_name: string; steps: string[] }
interface MoveItem { ru_name: string; seconds: number; anim_key: string }
interface MovementSet { id: string; ru_name: string; kind: string; moves: MoveItem[] }
interface Helpline { ru_name: string; phone: string | null; url?: string; hours: string }
interface ExercisesContent {
  breathing_durations_min: { free: number[]; plus: number[] }
  breathing: BreathPattern[]
  grounding: GroundingEx[]
  movements: MovementSet[]
  movement_energy_by_minutes: Record<string, number>
  firstaid: { ru_name: string; ru_note: string; items: { type: string; id: string }[]; helplines: Helpline[] }
}
interface ReflectPrompt { id: string; ru_title: string; ru_intro: string; steps: string[]; tabs: string[]; energy: number; plus: boolean }
interface QuizDef { id: string; ru_name: string; scale: string; plus: boolean; ru_intro: string; questions: string[]; bands: { min: number; max: number; ru_title: string; ru_text: string }[] }
interface QuizzesContent { scales: Record<string, { ru: string; score: number }[]>; disclaimer_ru: string; quizzes: QuizDef[] }
interface EmotionsContent { valences: { id: string; ru: string; sub: { id: string | null; ru: string; words: string[] }[] }[] }

const EX = content.exercises as unknown as ExercisesContent
const REFL = (content.reflections as { prompts: unknown[] }).prompts as ReflectPrompt[]
const QUIZ = content.quizzes as unknown as QuizzesContent
const EMO = content.emotions as unknown as EmotionsContent
const AFFIRMATIONS = content.quests.affirmations

// Аптечка references reflections by aliased ids — map to reflections.json ids.
const FIRSTAID_REFL: Record<string, string> = {
  refl_my_triggers: 'dd_triggers',
  refl_words_for_dear_one: 'dd_words_for_loved_one',
  refl_step_to_healing: 'sos_healing_step',
  refl_rant_zone: 'sos_thunder_rod',
  refl_living_grief: 'sos_living_loss',
  refl_regroup_time: 'sos_anchor_point',
}

const GOAL_CATEGORIES_RU: Record<string, string> = {
  easy_wins: 'Лёгкие победы',
  sleep: 'Сон',
  exercise: 'Движение',
  loved_ones: 'Близкие',
  presence: 'Здесь и сейчас',
  tidy_up: 'Порядок',
  kindness: 'Добрые дела',
}

// Timer duration menus per SPEC §4 (meditation 3/5/10 free → 15–60 Plus; focus 10/20/30 free → 45/60 Plus).
const MEDITATION_FREE = [3, 5, 10]
const MEDITATION_PLUS = [15, 20, 30, 45, 60]
const FOCUS_FREE = [10, 20, 30]
const FOCUS_PLUS = [45, 60]
// SPEC: meditation 6+⚡, focus 10+⚡ — "+" scales gently with duration.
const MEDITATION_ENERGY: Record<number, number> = { 3: 6, 5: 8, 10: 10, 15: 12, 20: 14, 30: 16, 45: 18, 60: 20 }
const FOCUS_ENERGY: Record<number, number> = { 10: 10, 20: 12, 30: 14, 45: 16, 60: 18 }
// Breathing pays a bit above a flat goal for longer sessions (research gives no exact figure).
const BREATHING_ENERGY: Record<number, number> = { 1: 5, 3: 8, 5: 10, 10: 14 }
const FLAT_ENERGY: Record<string, number> = { grounding: 5, emotion: 4, kindness: 5, affirmation: 3, quiz: 5 }
const MOVEMENT_FREE_SETS = 5 // research: 5 sets free at 1/3 min, the rest Plus

// ===== settings =====
export interface AppSettings {
  notifications: { morning: boolean; midday: boolean; evening: boolean; bedtime: boolean; streak: boolean; walk: boolean; mail: boolean; social: boolean }
  quizzes: boolean
  seasonal: boolean
  celebration: 'cheers' | 'reflect'
  mutedTags: string[]
}
const DEFAULT_SETTINGS: AppSettings = {
  notifications: { morning: true, midday: true, evening: true, bedtime: true, streak: true, walk: true, mail: true, social: true },
  quizzes: false,
  seasonal: true,
  celebration: 'cheers',
  mutedTags: [],
}

function getSettings(user: UserRow): AppSettings {
  let raw: Record<string, unknown> = {}
  try { raw = JSON.parse(user.settings || '{}') as Record<string, unknown> } catch { /* keep defaults */ }
  const notif = (raw.notifications ?? {}) as Partial<AppSettings['notifications']>
  return {
    notifications: { ...DEFAULT_SETTINGS.notifications, ...notif },
    quizzes: typeof raw.quizzes === 'boolean' ? raw.quizzes : DEFAULT_SETTINGS.quizzes,
    seasonal: typeof raw.seasonal === 'boolean' ? raw.seasonal : DEFAULT_SETTINGS.seasonal,
    celebration: raw.celebration === 'reflect' ? 'reflect' : 'cheers',
    mutedTags: Array.isArray(raw.mutedTags) ? (raw.mutedTags as string[]).filter(t => typeof t === 'string').slice(0, 50) : [],
  }
}

function notMuted(text: string, muted: string[]): boolean {
  if (!muted.length) return true
  const t = text.toLowerCase()
  return !muted.some(m => m && t.includes(m.toLowerCase()))
}

// ===== day helpers =====
function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
function mondayOf(day: string): string {
  const d = new Date(`${day}T12:00:00Z`)
  const dow = d.getUTCDay() // 0 = Sunday
  return shiftDate(day, -((dow + 6) % 7))
}

// ===== energy award outside goals (mirrors engine/core completeGoal semantics) =====
function awardEnergy(user: UserRow, amount: number): { energy: number; stones: number; walkMinutesReduced?: number } {
  const day = user.last_day!
  const pet = db.prepare('SELECT * FROM pets WHERE user_id=?').get(user.id) as PetRow
  const bar = C.ENERGY_BAR[stageForWalks(pet.walks)]
  const walk = db.prepare('SELECT * FROM walks WHERE user_id=? AND day=? ORDER BY id DESC LIMIT 1').get(user.id, day) as WalkRow | undefined
  if (walk && !walk.completed && walk.ends_ts > Date.now()) {
    const cut = amount * C.WALK_MINUTES_PER_ENERGY * 60_000
    db.prepare('UPDATE walks SET ends_ts=? WHERE id=?').run(Math.max(Date.now(), walk.ends_ts - cut), walk.id)
    return { energy: 0, stones: 0, walkMinutesReduced: amount * C.WALK_MINUTES_PER_ENERGY }
  }
  if (user.energy < bar) {
    const e = Math.min(amount, bar - user.energy)
    db.prepare('UPDATE users SET energy=energy+? WHERE id=?').run(e, user.id)
    return { energy: e, stones: 0 }
  }
  return { energy: 0, stones: 0 }
}

function logActivity(userId: number, day: string, kind: string, refId: string | null, energy: number) {
  db.prepare('INSERT INTO activity_log (user_id, day, kind, ref_id, energy, ts) VALUES (?,?,?,?,?,?)')
    .run(userId, day, kind, refId, energy, Date.now())
}

// ===== GET /content — the whole activities library in one call =====
activitiesRoutes.get('/content', c => {
  const user = ensureFresh(c.get('user'))
  const plus = hasPlus(user)
  const s = getSettings(user)
  const promptCard = (p: ReflectPrompt) => ({ id: p.id, title: p.ru_title, intro: p.ru_intro, steps: p.steps, energy: p.energy, plus: p.plus })
  return c.json({
    plus,
    breathing: {
      durations: EX.breathing_durations_min,
      patterns: EX.breathing.map(b => ({ id: b.id, name: b.ru_name, tabs: b.tabs, phases: b.phases.map(p => ({ label: p.label_ru, seconds: p.seconds })), plus: b.plus })),
    },
    movements: EX.movements.map((m, i) => ({
      id: m.id, name: m.ru_name, kind: m.kind, plus: i >= MOVEMENT_FREE_SETS,
      moves: m.moves.map(v => ({ name: v.ru_name, seconds: v.seconds, animKey: v.anim_key })),
    })),
    movementEnergy: EX.movement_energy_by_minutes,
    movementDurations: EX.breathing_durations_min, // same 1/3 free → 5/10 plus ladder
    grounding: EX.grounding.map(g => ({ id: g.id, name: g.ru_name, steps: g.steps })),
    timers: {
      meditation: { free: MEDITATION_FREE, plus: MEDITATION_PLUS, energy: MEDITATION_ENERGY },
      focus: { free: FOCUS_FREE, plus: FOCUS_PLUS, energy: FOCUS_ENERGY },
    },
    breathingEnergy: BREATHING_ENERGY,
    firstaid: {
      name: EX.firstaid.ru_name,
      note: EX.firstaid.ru_note,
      grounding: EX.firstaid.items.filter(i => i.type === 'grounding').map(i => i.id),
      breathing: EX.firstaid.items.filter(i => i.type === 'breathing').map(i => i.id),
      sosPrompts: EX.firstaid.items.filter(i => i.type === 'reflection')
        .map(i => REFL.find(p => p.id === (FIRSTAID_REFL[i.id] ?? i.id)))
        .filter((p): p is ReflectPrompt => !!p)
        .map(promptCard),
      helplines: EX.firstaid.helplines,
    },
    emotions: EMO.valences,
    affirmations: AFFIRMATIONS,
    quizzesEnabled: s.quizzes,
    quizzes: s.quizzes ? {
      disclaimer: QUIZ.disclaimer_ru,
      scales: QUIZ.scales,
      list: QUIZ.quizzes.map(q => ({ id: q.id, name: q.ru_name, scale: q.scale, plus: q.plus, intro: q.ru_intro, questions: q.questions, bands: q.bands })),
    } : null,
  })
})

// ===== GET /goal-ideas =====
activitiesRoutes.get('/goal-ideas', c => {
  const user = ensureFresh(c.get('user'))
  const muted = getSettings(user).mutedTags
  return c.json({
    categories: Object.entries(GOAL_CATEGORIES_RU).map(([id, ru]) => ({ id, ru })),
    scas: content.goals.scas,
    goals: content.goals.goals.filter(g => notMuted(g.ru, muted)),
  })
})

// ===== Reflections =====
activitiesRoutes.get('/reflections', c => {
  const user = ensureFresh(c.get('user'))
  const muted = getSettings(user).mutedTags
  const prompts = REFL.filter(p => notMuted(p.ru_title + ' ' + p.ru_intro, muted))
    .map(p => ({ id: p.id, title: p.ru_title, intro: p.ru_intro, steps: p.steps, tabs: p.tabs, energy: p.energy, plus: p.plus }))
  const history = (db.prepare('SELECT id, day, prompt_id, text, valence, ts FROM reflections WHERE user_id=? ORDER BY ts DESC LIMIT 50').all(user.id) as
    { id: number; day: string; prompt_id: string | null; text: string; valence: number | null; ts: number }[])
    .map(r => ({
      id: r.id, day: r.day, promptId: r.prompt_id,
      title: r.prompt_id ? (REFL.find(p => p.id === r.prompt_id)?.ru_title ?? 'Запись') : 'Свободная запись',
      snippet: r.text.slice(0, 140), valence: r.valence, ts: r.ts,
    }))
  return c.json({ prompts, history })
})

activitiesRoutes.post('/reflect', async c => {
  const body = z.object({
    promptId: z.string().max(60).optional(),
    text: z.string().min(1).max(8000),
    valence: z.number().int().min(-1).max(1).optional(),
  }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  let energy: number
  let promptId: string | null = null
  if (body.data.promptId) {
    const prompt = REFL.find(p => p.id === body.data.promptId)
    if (!prompt) return c.json({ error: 'not_found' }, 404)
    if (prompt.plus && !hasPlus(user)) return c.json({ error: 'plus_required' }, 403)
    energy = prompt.energy
    promptId = prompt.id
  } else {
    // free-form: the more you write, the more energy (4–8⚡)
    energy = Math.max(4, Math.min(8, 4 + Math.floor(body.data.text.length / 200)))
  }
  const mood = db.prepare('SELECT value FROM moods WHERE user_id=? AND day=? ORDER BY ts DESC LIMIT 1').get(user.id, day) as { value: number } | undefined
  const lowMood = !!mood && mood.value <= C.MOOD_LOW_MAX
  const stones = lowMood ? C.GOAL_STONES_LOW_MOOD : C.GOAL_STONES
  const r = db.prepare('INSERT INTO reflections (user_id, day, prompt_id, text, valence, ts) VALUES (?,?,?,?,?,?)')
    .run(user.id, day, promptId, body.data.text, body.data.valence ?? null, Date.now())
  const reward = awardEnergy(user, energy)
  addStones(user.id, stones, 'reflection')
  reward.stones = stones
  logActivity(user.id, day, 'reflection', promptId, energy)
  return c.json({ id: Number(r.lastInsertRowid), reward })
})

// ===== POST /log — breathing / meditation / focus / movement / grounding / emotion / kindness / affirmation =====
activitiesRoutes.post('/log', async c => {
  const body = z.object({
    kind: z.enum(['breathing', 'meditation', 'focus', 'movement', 'grounding', 'emotion', 'kindness', 'affirmation']),
    refId: z.string().max(80).optional(),
    minutes: z.number().int().min(1).max(60).optional(),
  }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  const plus = hasPlus(user)
  const { kind, refId, minutes } = body.data

  let energy = 0
  if (kind === 'breathing') {
    const m = minutes ?? 1
    if (!(m in BREATHING_ENERGY)) return c.json({ error: 'bad_duration' }, 400)
    if (!EX.breathing_durations_min.free.includes(m) && !plus) return c.json({ error: 'plus_required' }, 403)
    const pattern = EX.breathing.find(b => b.id === refId)
    if (pattern?.plus && !plus) return c.json({ error: 'plus_required' }, 403)
    energy = BREATHING_ENERGY[m]
  } else if (kind === 'movement') {
    const m = minutes ?? 1
    const e = EX.movement_energy_by_minutes[String(m)]
    if (!e) return c.json({ error: 'bad_duration' }, 400)
    if (!EX.breathing_durations_min.free.includes(m) && !plus) return c.json({ error: 'plus_required' }, 403)
    const idx = EX.movements.findIndex(s => s.id === refId)
    if (idx >= MOVEMENT_FREE_SETS && !plus) return c.json({ error: 'plus_required' }, 403)
    energy = e
  } else if (kind === 'meditation') {
    const m = minutes ?? 3
    if (!(m in MEDITATION_ENERGY)) return c.json({ error: 'bad_duration' }, 400)
    if (!MEDITATION_FREE.includes(m) && !plus) return c.json({ error: 'plus_required' }, 403)
    energy = MEDITATION_ENERGY[m]
  } else if (kind === 'focus') {
    const m = minutes ?? 10
    if (!(m in FOCUS_ENERGY)) return c.json({ error: 'bad_duration' }, 400)
    if (!FOCUS_FREE.includes(m) && !plus) return c.json({ error: 'plus_required' }, 403)
    energy = FOCUS_ENERGY[m]
  } else {
    energy = FLAT_ENERGY[kind]
  }

  const reward = awardEnergy(user, energy)
  logActivity(user.id, user.last_day!, kind, refId ?? null, energy)
  return c.json({ reward })
})

// ===== POST /quiz =====
activitiesRoutes.post('/quiz', async c => {
  const body = z.object({ quizId: z.string().max(40), score: z.number().int().min(0).max(100) })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  if (!getSettings(user).quizzes) return c.json({ error: 'quizzes_disabled' }, 400)
  const quiz = QUIZ.quizzes.find(q => q.id === body.data.quizId)
  if (!quiz) return c.json({ error: 'not_found' }, 404)
  if (quiz.plus && !hasPlus(user)) return c.json({ error: 'plus_required' }, 403)
  const band = quiz.bands.find(b => body.data.score >= b.min && body.data.score <= b.max) ?? quiz.bands[quiz.bands.length - 1]
  db.prepare('INSERT INTO quiz_results (user_id, quiz_id, score, day, ts) VALUES (?,?,?,?,?)')
    .run(user.id, quiz.id, body.data.score, user.last_day, Date.now())
  const reward = awardEnergy(user, FLAT_ENERGY.quiz)
  logActivity(user.id, user.last_day!, 'quiz', quiz.id, FLAT_ENERGY.quiz)
  return c.json({ band: { title: band.ru_title, text: band.ru_text }, disclaimer: QUIZ.disclaimer_ru, reward })
})

// ===== GET /insights =====
activitiesRoutes.get('/insights', c => {
  const user = ensureFresh(c.get('user'))
  const today = user.last_day!
  const range = c.req.query('range') ?? '2w'
  const startDay = range === 'all' ? '0000-01-01'
    : range === '3m' ? shiftDate(today, -89)
    : range === '1m' ? shiftDate(today, -29)
    : shiftDate(today, -13)

  // mood calendar: last value per day
  const moodRows = db.prepare('SELECT day, value, ts FROM moods WHERE user_id=? AND day>=? ORDER BY ts').all(user.id, range === 'all' ? shiftDate(today, -364) : startDay) as { day: string; value: number }[]
  const moodByDay: Record<string, number> = {}
  for (const m of moodRows) moodByDay[m.day] = m.value

  // goal stats
  const counts = db.prepare(
    `SELECT g.id, g.title, g.emoji, COUNT(*) n FROM goal_completions c JOIN goals g ON g.id=c.goal_id
     WHERE c.user_id=? AND c.day>=? GROUP BY c.goal_id ORDER BY n DESC`,
  ).all(user.id, startDay) as { id: number; title: string; emoji: string; n: number }[]
  const total = counts.reduce((s, r) => s + r.n, 0)

  // most-missed: active daily goals with the fewest distinct completion days in range
  const activeGoals = db.prepare('SELECT * FROM goals WHERE user_id=? AND archived=0 AND paused=0').all(user.id) as GoalRow[]
  const rangeStartReal = range === 'all' ? (user.created_at ?? today).slice(0, 10) : startDay
  const missed = activeGoals.map(g => {
    const from = g.created_at.slice(0, 10) > rangeStartReal ? g.created_at.slice(0, 10) : rangeStartReal
    const expected = Math.max(0, Math.round((new Date(`${today}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86_400_000) + 1)
    const doneDays = (db.prepare('SELECT COUNT(DISTINCT day) n FROM goal_completions WHERE goal_id=? AND day>=?').get(g.id, from) as { n: number }).n
    return { title: g.title, emoji: g.emoji, missedDays: Math.max(0, expected - doneDays) }
  }).filter(m => m.missedDays > 0).sort((a, b) => b.missedDays - a.missedDays).slice(0, 5)

  const refl = db.prepare(
    `SELECT COUNT(*) n,
      SUM(CASE WHEN valence>0 THEN 1 ELSE 0 END) pos,
      SUM(CASE WHEN valence<0 THEN 1 ELSE 0 END) neg
     FROM reflections WHERE user_id=? AND day>=?`,
  ).get(user.id, startDay) as { n: number; pos: number | null; neg: number | null }

  const acts = db.prepare('SELECT kind, COUNT(*) n FROM activity_log WHERE user_id=? AND day>=? GROUP BY kind').all(user.id, startDay) as { kind: string; n: number }[]

  return c.json({
    range,
    moodByDay,
    goals: { total, top: counts.slice(0, 5), missed },
    reflections: { count: refl.n, positive: refl.pos ?? 0, negative: refl.neg ?? 0 },
    activities: acts,
  })
})

// ===== GET /history?day= =====
activitiesRoutes.get('/history', c => {
  const user = ensureFresh(c.get('user'))
  const qd = c.req.query('day')
  const day = qd && /^\d{4}-\d{2}-\d{2}$/.test(qd) ? qd : user.last_day!
  const completions = db.prepare(
    `SELECT g.title, g.emoji, c.ts FROM goal_completions c JOIN goals g ON g.id=c.goal_id
     WHERE c.user_id=? AND c.day=? ORDER BY c.ts`,
  ).all(user.id, day) as { title: string; emoji: string; ts: number }[]
  const moods = db.prepare('SELECT value, note, ts FROM moods WHERE user_id=? AND day=? ORDER BY ts').all(user.id, day) as { value: number; note: string | null; ts: number }[]
  const reflections = (db.prepare('SELECT id, prompt_id, text, valence, ts FROM reflections WHERE user_id=? AND day=? ORDER BY ts').all(user.id, day) as
    { id: number; prompt_id: string | null; text: string; valence: number | null; ts: number }[])
    .map(r => ({ id: r.id, title: r.prompt_id ? (REFL.find(p => p.id === r.prompt_id)?.ru_title ?? 'Запись') : 'Свободная запись', snippet: r.text.slice(0, 200), valence: r.valence, ts: r.ts }))
  const activities = db.prepare('SELECT kind, ref_id, energy, ts FROM activity_log WHERE user_id=? AND day=? ORDER BY ts').all(user.id, day) as { kind: string; ref_id: string | null; energy: number; ts: number }[]
  const walk = db.prepare('SELECT completed, started_ts, ends_ts, location_id FROM walks WHERE user_id=? AND day=? ORDER BY id DESC LIMIT 1').get(user.id, day) as { completed: number; started_ts: number; ends_ts: number; location_id: string } | undefined
  return c.json({ day, completions, moods, reflections, activities, walk: walk ?? null })
})

// ===== My goals (list + editing; adding goes through core POST /api/goals) =====
activitiesRoutes.get('/goals', c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const rows = db.prepare('SELECT * FROM goals WHERE user_id=? ORDER BY archived, paused, sort, id').all(user.id) as GoalRow[]
  const done = new Map((db.prepare('SELECT goal_id, COUNT(*) n FROM goal_completions WHERE user_id=? AND day=? GROUP BY goal_id').all(user.id, day) as { goal_id: number; n: number }[]).map(r => [r.goal_id, r.n]))
  return c.json({
    goals: rows.map(g => ({
      id: g.id, title: g.title, emoji: g.emoji, sca: g.sca, timesPerDay: g.times_per_day,
      paused: !!g.paused, archived: !!g.archived, doneToday: done.get(g.id) ?? 0, createdAt: g.created_at,
    })),
    scas: content.goals.scas,
  })
})

activitiesRoutes.post('/goals/:id', async c => {
  const body = z.object({
    title: z.string().min(1).max(120).optional(),
    emoji: z.string().min(1).max(8).optional(),
    sca: z.string().max(40).nullable().optional(),
    timesPerDay: z.number().int().min(1).max(C.GOAL_MAX_PER_DAY).optional(),
    paused: z.boolean().optional(),
    archived: z.boolean().optional(),
  }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  const id = Number(c.req.param('id'))
  const goal = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?').get(id, user.id) as GoalRow | undefined
  if (!goal) return c.json({ error: 'not_found' }, 404)
  const b = body.data
  if (b.emoji !== undefined && b.emoji !== goal.emoji && !hasPlus(user)) return c.json({ error: 'plus_required' }, 403) // custom emoji = Plus
  db.prepare(
    'UPDATE goals SET title=?, emoji=?, sca=?, times_per_day=?, paused=?, archived=? WHERE id=? AND user_id=?',
  ).run(
    b.title ?? goal.title,
    b.emoji ?? goal.emoji,
    b.sca === undefined ? goal.sca : b.sca,
    b.timesPerDay ?? goal.times_per_day,
    b.paused === undefined ? goal.paused : (b.paused ? 1 : 0),
    b.archived === undefined ? goal.archived : (b.archived ? 1 : 0),
    id, user.id,
  )
  return c.json({ ok: true })
})

activitiesRoutes.post('/goals/:id/delete', c => {
  const user = c.get('user')
  const id = Number(c.req.param('id'))
  const goal = db.prepare('SELECT id FROM goals WHERE id=? AND user_id=?').get(id, user.id)
  if (!goal) return c.json({ error: 'not_found' }, 404)
  db.transaction(() => {
    db.prepare('DELETE FROM goal_completions WHERE goal_id=?').run(id) // delete wipes history (irreversible)
    db.prepare('DELETE FROM goals WHERE id=? AND user_id=?').run(id, user.id)
  })()
  return c.json({ ok: true })
})

// ===== Self-care areas: 9 designed + custom, weekly progress =====
activitiesRoutes.get('/scas', c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const monday = mondayOf(day)
  const goalCounts = db.prepare('SELECT sca, COUNT(*) n FROM goals WHERE user_id=? AND archived=0 AND sca IS NOT NULL GROUP BY sca').all(user.id) as { sca: string; n: number }[]
  const byId = new Map(goalCounts.map(r => [r.sca, r.n]))
  const weekDays = db.prepare(
    `SELECT g.sca sca, c.day day FROM goal_completions c JOIN goals g ON g.id=c.goal_id
     WHERE c.user_id=? AND c.day>=? AND g.sca IS NOT NULL GROUP BY g.sca, c.day`,
  ).all(user.id, monday) as { sca: string; day: string }[]
  const daysBySca = new Map<string, string[]>()
  for (const r of weekDays) {
    const arr = daysBySca.get(r.sca) ?? []
    arr.push(r.day)
    daysBySca.set(r.sca, arr)
  }
  const designed = content.goals.scas.map(s => ({
    id: s.id, ru: s.ru, emoji: s.emoji, color: s.color, custom: false,
    goals: byId.get(s.id) ?? 0, weekDays: daysBySca.get(s.id) ?? [],
  }))
  const knownIds = new Set(content.goals.scas.map(s => s.id))
  const custom = goalCounts.filter(r => !knownIds.has(r.sca)).map(r => ({
    id: r.sca, ru: r.sca, emoji: '🌟', color: '#EEDFC0', custom: true,
    goals: r.n, weekDays: daysBySca.get(r.sca) ?? [],
  }))
  return c.json({ monday, scas: [...designed, ...custom], milestones: C.WEEKLY_MILESTONES })
})

// ===== Settings =====
activitiesRoutes.get('/settings', c => {
  const user = ensureFresh(c.get('user'))
  const pet = db.prepare('SELECT name, pronouns FROM pets WHERE user_id=?').get(user.id) as { name: string; pronouns: string }
  return c.json({
    userName: user.name, petName: pet.name, petPronouns: pet.pronouns,
    wakeMin: user.wake_min, sleepMin: user.sleep_min, tz: user.tz,
    pausedUntil: user.paused_until, plus: hasPlus(user),
    settings: getSettings(user),
  })
})

activitiesRoutes.post('/settings', async c => {
  const body = z.object({
    userName: z.string().min(1).max(40).optional(),
    petName: z.string().min(1).max(30).optional(),
    petPronouns: z.enum(['he', 'she', 'they']).optional(),
    wakeMin: z.number().int().min(0).max(1439).optional(),
    sleepMin: z.number().int().min(0).max(1439).optional(),
    tz: z.string().max(50).optional(),
    settings: z.object({
      notifications: z.object({
        morning: z.boolean().optional(), midday: z.boolean().optional(), evening: z.boolean().optional(),
        bedtime: z.boolean().optional(), streak: z.boolean().optional(), walk: z.boolean().optional(),
        mail: z.boolean().optional(), social: z.boolean().optional(),
      }).optional(),
      quizzes: z.boolean().optional(),
      seasonal: z.boolean().optional(),
      celebration: z.enum(['cheers', 'reflect']).optional(),
      mutedTags: z.array(z.string().min(1).max(40)).max(50).optional(),
    }).optional(),
  }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  const b = body.data
  if (b.userName !== undefined || b.wakeMin !== undefined || b.sleepMin !== undefined || b.tz !== undefined) {
    db.prepare('UPDATE users SET name=?, wake_min=?, sleep_min=?, tz=? WHERE id=?')
      .run(b.userName ?? user.name, b.wakeMin ?? user.wake_min, b.sleepMin ?? user.sleep_min, b.tz ?? user.tz, user.id)
  }
  if (b.petName !== undefined || b.petPronouns !== undefined) {
    const pet = db.prepare('SELECT name, pronouns FROM pets WHERE user_id=?').get(user.id) as { name: string; pronouns: string }
    db.prepare('UPDATE pets SET name=?, pronouns=? WHERE user_id=?')
      .run(b.petName ?? pet.name, b.petPronouns ?? pet.pronouns, user.id)
  }
  if (b.settings) {
    const cur = getSettings(user)
    const merged: AppSettings = {
      ...cur,
      ...b.settings,
      notifications: { ...cur.notifications, ...(b.settings.notifications ?? {}) },
      mutedTags: b.settings.mutedTags ?? cur.mutedTags,
      celebration: b.settings.celebration ?? cur.celebration,
    }
    db.prepare('UPDATE users SET settings=? WHERE id=?').run(JSON.stringify(merged), user.id)
  }
  return c.json({ ok: true })
})

// ===== Pause mode =====
activitiesRoutes.post('/pause', async c => {
  const body = z.object({ days: z.number().int().min(C.PAUSE_MIN_DAYS).max(C.PAUSE_MAX_DAYS).default(C.PAUSE_DEFAULT_DAYS) })
    .safeParse(await c.req.json().catch(() => ({})))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const user = ensureFresh(c.get('user'))
  const until = shiftDate(user.last_day!, body.data.days)
  db.prepare('UPDATE users SET paused_until=? WHERE id=?').run(until, user.id)
  return c.json({ pausedUntil: until })
})

activitiesRoutes.post('/pause/end', c => {
  const user = ensureFresh(c.get('user'))
  db.prepare('UPDATE users SET paused_until=NULL WHERE id=?').run(user.id)
  return c.json({ ok: true })
})

// ===== Streak repair (Pet.tsx calls this exact path: /api/activities/streak/repair) =====
activitiesRoutes.post('/streak/repair', c => {
  const user = ensureFresh(c.get('user'))
  let usedRepair = false
  if (user.repairs > 0) {
    db.prepare('UPDATE users SET repairs=repairs-1 WHERE id=?').run(user.id)
    usedRepair = true
  } else if (user.stones >= C.STREAK_REPAIR_STONES) {
    addStones(user.id, -C.STREAK_REPAIR_STONES, 'streak_repair')
  } else {
    return c.json({ error: 'not_enough_stones', cost: C.STREAK_REPAIR_STONES }, 400)
  }
  // restore continuity with the best streak (+1 for today)
  const streak = Math.max(user.streak, user.streak_best) + 1
  const best = Math.max(user.streak_best, streak)
  db.prepare('UPDATE users SET streak=?, streak_best=? WHERE id=?').run(streak, best, user.id)
  const fresh = db.prepare('SELECT streak, streak_best, repairs, stones FROM users WHERE id=?').get(user.id) as { streak: number; streak_best: number; repairs: number; stones: number }
  return c.json({ streak: fresh.streak, streakBest: fresh.streak_best, repairs: fresh.repairs, stones: fresh.stones, usedRepair })
})

// ===== Newspapers («Газеты»): live weekly digest + archived mail newsletters =====
activitiesRoutes.get('/papers', c => {
  const user = ensureFresh(c.get('user'))
  const plus = hasPlus(user)
  const today = user.last_day!
  const monday = mondayOf(today)
  const weekAgo = shiftDate(monday, -7)
  const twoAgo = shiftDate(monday, -14)
  const cnt = (from: string, to: string) =>
    (db.prepare('SELECT COUNT(DISTINCT day) n FROM moods WHERE user_id=? AND day>=? AND day<?').get(user.id, from, to) as { n: number }).n
  const goalsThisWeek = (db.prepare('SELECT COUNT(*) n FROM goal_completions WHERE user_id=? AND day>=?').get(user.id, monday) as { n: number }).n
  const reflThisWeek = (db.prepare('SELECT COUNT(*) n FROM reflections WHERE user_id=? AND day>=?').get(user.id, monday) as { n: number }).n
  const moodRows = db.prepare('SELECT day, value FROM moods WHERE user_id=? AND day>=? ORDER BY ts').all(user.id, monday) as { day: string; value: number }[]
  const moodByDay: Record<string, number> = {}
  for (const m of moodRows) moodByDay[m.day] = m.value

  const live = {
    id: 'weekly_feels_live',
    kind: 'weekly_feels',
    title: 'Недельные чувства',
    day: today,
    stats: {
      checkinsThisWeek: cnt(monday, shiftDate(today, 1)),
      checkinsLastWeek: cnt(weekAgo, monday),
      checkinsTwoWeeksAgo: cnt(twoAgo, weekAgo),
      goalsThisWeek, reflectionsThisWeek: reflThisWeek, moodByDay, monday,
    },
  }
  let archive = db.prepare("SELECT id, title, body, data, ts, read FROM mail WHERE user_id=? AND kind='newsletter' ORDER BY ts DESC LIMIT 30")
    .all(user.id) as { id: number; title: string; body: string; data: string; ts: number; read: number }[]
  if (!plus) archive = archive.slice(0, 1) // free tier: latest issue only
  return c.json({ plus, live, archive })
})
