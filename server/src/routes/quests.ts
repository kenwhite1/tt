// Quests module: daily quests, weekly SCA milestones, special tracks, goal challenges.
// Built by the quests module agent — see docs/ARCHITECTURE.md
import { Hono } from 'hono'
import { z } from 'zod'
import { C, friendshipLevel } from '../../../shared/constants'
import type { Env } from '../env'
import { db } from '../db'
import { ensureFresh } from '../engine/day'
import { addStones } from '../engine/core'
import { content } from '../content'
import type { PetRow, UserRow } from '../engine/rows'

export const questsRoutes = new Hono<Env>()

// ---------- content shapes ----------
interface DailyQuestDef { id: string; ru: string; type: string; deeplink: string; check: string }
interface SpecialTrack { id: string; ru_template: string; metric: string; tiers: number[] }
interface ChallengeDef {
  id: string; ru_name: string; ru_theme: string; badge_emoji: string
  goals: { ru: string; emoji: string }[]
}
interface ChallengeStateRow {
  user_id: number; challenge_id: string; month: string
  done: string; joined_day: string; completed: number
}

const DAILY_POOL = content.quests.daily_pool as DailyQuestDef[]
const SPECIAL_TRACKS = content.quests.special_tracks as unknown as SpecialTrack[]
const CHALLENGES = (content.challenges as unknown as { challenges: ChallengeDef[] }).challenges
const AFFIRMATIONS = content.quests.affirmations

// Quest types whose completion can't be derived from DB tables.
// The user honestly marks them done («отметить выполненным») —
// affirmation gets its own repeat-3-times mini-flow client-side.
const MANUAL_TYPES = new Set(['change_outfit', 'change_interior', 'affirmation'])

// ---------- «Ответь с друзьями» — question of the day (same for everyone) ----------
const FRIEND_QUESTIONS: { q: string; options: string[] }[] = [
  { q: 'Как ты любишь начинать утро?', options: ['Не спеша, под одеялом', 'С чашки чего-нибудь тёплого', 'Сразу за дела', 'С музыкой'] },
  { q: 'Что для тебя лучший отдых?', options: ['Поспать', 'Погулять', 'Посмотреть сериал', 'Встретиться с друзьями'] },
  { q: 'Какая погода тебе милее всего?', options: ['Солнечная', 'Дождь за окном', 'Снегопад', 'Тёплый ветер'] },
  { q: 'Что выберешь на вечер?', options: ['Книгу', 'Фильм', 'Игру', 'Разговор по душам'] },
  { q: 'Какой завтрак тебе ближе?', options: ['Сладкий', 'Сытный', 'Лёгкий', 'Какой получится'] },
  { q: 'Где тебе лучше всего думается?', options: ['В душе', 'На прогулке', 'В кровати', 'В дороге'] },
  { q: 'Какое время года — твоё?', options: ['Весна', 'Лето', 'Осень', 'Зима'] },
  { q: 'Какая суперспособность тебе нужнее всего?', options: ['Телепортация', 'Читать мысли', 'Останавливать время', 'Никогда не уставать'] },
  { q: 'Какой звук тебя успокаивает?', options: ['Дождь', 'Море', 'Мурчание кота', 'Тишина'] },
  { q: 'Что вкуснее всего?', options: ['Пицца', 'Суши', 'Блины', 'Жареная картошка'] },
  { q: 'Куда тебя тянет больше всего?', options: ['К морю', 'В горы', 'В лес', 'В большой город'] },
  { q: 'Как ты заряжаешься энергией?', options: ['В одиночестве', 'С близкими', 'На природе', 'Во сне'] },
  { q: 'Какой напиток — твой?', options: ['Чай', 'Кофе', 'Какао', 'Вода с лимоном'] },
  { q: 'Что делаешь, когда грустно?', options: ['Слушаю музыку', 'Ем вкусное', 'Пишу близким', 'Сплю'] },
  { q: 'Какая музыка у тебя играет чаще?', options: ['Спокойная', 'Энергичная', 'Грустная', 'Любая подряд'] },
  { q: 'Ты сова или жаворонок?', options: ['Сова', 'Жаворонок', 'Голубь: как получится', 'Зависит от дня'] },
  { q: 'Что важнее всего в выходной?', options: ['Выспаться', 'Успеть всё', 'Ничего не планировать', 'Увидеть друзей'] },
  { q: 'Какой подарок приятнее получать?', options: ['Сделанный руками', 'Практичный', 'Сюрприз', 'Время вместе'] },
  { q: 'Какое маленькое счастье тебе ближе?', options: ['Свежая постель', 'Вкусная еда', 'Любимая песня', 'Объятия'] },
  { q: 'Как ты относишься к дождю?', options: ['Люблю под него спать', 'Люблю гулять под ним', 'Смотрю в окно', 'Жду солнца'] },
  { q: 'Что выберешь?', options: ['Завтрак в кровати', 'Ужин при свечах', 'Пикник на траве', 'Перекус на бегу'] },
  { q: 'О чём ты чаще мечтаешь?', options: ['О путешествиях', 'О доме у моря', 'О спокойствии', 'О новых друзьях'] },
  { q: 'Какая у тебя суперсила на кухне?', options: ['Готовлю вкусно', 'Красиво раскладываю', 'Быстро разогреваю', 'Мою посуду под музыку'] },
  { q: 'Что помогает тебе уснуть?', options: ['Тишина', 'Книга', 'Сериал', 'Тёплый душ'] },
  { q: 'Какой питомец тебе ближе (кроме меня!)?', options: ['Кот', 'Ещё одна собака', 'Птичка', 'Рыбки'] },
  { q: 'Как ты празднуешь маленькие победы?', options: ['Вкусняшкой', 'Рассказываю близким', 'Тихо радуюсь', 'Танцую'] },
  { q: 'Чего тебе чаще всего не хватает в дне?', options: ['Сна', 'Времени на себя', 'Общения', 'Тишины'] },
  { q: 'Какой вечер пятницы — идеальный?', options: ['Дома в пижаме', 'В гостях', 'В кино', 'Гулять допоздна'] },
  { q: 'Что тебя радует быстрее всего?', options: ['Смешное видео', 'Вкусный запах', 'Солнце в окне', 'Сообщение от друга'] },
  { q: 'С чем у тебя ассоциируется уют?', options: ['Плед и чай', 'Запах выпечки', 'Лампа и книга', 'Дом после прогулки'] },
]

// ---------- deterministic helpers ----------
function hash32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
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

function daysSinceEpoch(day: string): number {
  return Math.floor(Date.parse(`${day}T12:00:00Z`) / 86_400_000)
}

// ISO week key of a game day, e.g. 2026-W24.
function isoWeek(day: string): string {
  const d = new Date(`${day}T12:00:00Z`)
  const thu = new Date(d)
  thu.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3)
  const year = thu.getUTCFullYear()
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const week = 1 + Math.round(((thu.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

// Monday..Sunday date bounds of the ISO week containing `day`.
function weekBounds(day: string): { start: string; end: string } {
  const d = new Date(`${day}T12:00:00Z`)
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  const sun = new Date(mon)
  sun.setUTCDate(mon.getUTCDate() + 6)
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) }
}

// Stable per-(user, day) roll of today's daily quests — distinct types.
function rollDaily(userId: number, day: string): DailyQuestDef[] {
  const rnd = mulberry32(hash32(`${userId}:${day}:daily`))
  const idx = DAILY_POOL.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  const seen = new Set<string>()
  const picked: DailyQuestDef[] = []
  for (const i of idx) {
    const quest = DAILY_POOL[i]
    if (seen.has(quest.type)) continue
    seen.add(quest.type)
    picked.push(quest)
    if (picked.length >= C.DAILY_QUESTS_PER_DAY) break
  }
  return picked
}

// ---------- prepared statements ----------
const q = {
  pet: db.prepare('SELECT * FROM pets WHERE user_id=?'),
  anyGoalDone: db.prepare('SELECT 1 x FROM goal_completions WHERE user_id=? AND day=? LIMIT 1'),
  anyWalk: db.prepare('SELECT 1 x FROM walks WHERE user_id=? AND day=? LIMIT 1'),
  anyMood: db.prepare('SELECT 1 x FROM moods WHERE user_id=? AND day=? LIMIT 1'),
  anyActivity: db.prepare('SELECT 1 x FROM activity_log WHERE user_id=? AND day=? AND kind=? LIMIT 1'),
  anyReflection: db.prepare('SELECT 1 x FROM reflections WHERE user_id=? AND day=? LIMIT 1'),
  anyVibe: db.prepare('SELECT 1 x FROM vibes WHERE from_id=? AND day=? LIMIT 1'),
  dqInsert: db.prepare('INSERT OR IGNORE INTO daily_quests (user_id, day, quest_id) VALUES (?,?,?)'),
  dqRows: db.prepare('SELECT quest_id, done, claimed FROM daily_quests WHERE user_id=? AND day=?'),
  dqRow: db.prepare('SELECT done, claimed FROM daily_quests WHERE user_id=? AND day=? AND quest_id=?'),
  dqSetDone: db.prepare('UPDATE daily_quests SET done=? WHERE user_id=? AND day=? AND quest_id=?'),
  dqClaim: db.prepare('UPDATE daily_quests SET claimed=1, done=MAX(done,1) WHERE user_id=? AND day=? AND quest_id=? AND claimed=0'),
  weeklyDays: db.prepare(
    `SELECT g.sca sca, COUNT(DISTINCT gc.day) days
     FROM goal_completions gc JOIN goals g ON g.id=gc.goal_id
     WHERE gc.user_id=? AND gc.day>=? AND gc.day<=? AND g.sca IS NOT NULL
     GROUP BY g.sca`,
  ),
  scaDays: db.prepare(
    `SELECT COUNT(DISTINCT gc.day) days
     FROM goal_completions gc JOIN goals g ON g.id=gc.goal_id
     WHERE gc.user_id=? AND gc.day>=? AND gc.day<=? AND g.sca=?`,
  ),
  userScas: db.prepare('SELECT DISTINCT sca FROM goals WHERE user_id=? AND archived=0 AND sca IS NOT NULL'),
  wsInsert: db.prepare('INSERT OR IGNORE INTO weekly_state (user_id, week, sca) VALUES (?,?,?)'),
  wsGet: db.prepare('SELECT claimed FROM weekly_state WHERE user_id=? AND week=? AND sca=?'),
  wsClaim: db.prepare('UPDATE weekly_state SET claimed=claimed|? WHERE user_id=? AND week=? AND sca=?'),
  countOwned: db.prepare('SELECT COUNT(*) n FROM items_owned WHERE user_id=? AND kind=?'),
  countSpecies: db.prepare('SELECT COUNT(DISTINCT species_id) n FROM user_micropets WHERE user_id=?'),
  countLocations: db.prepare('SELECT COUNT(DISTINCT location_id) n FROM walks WHERE user_id=?'),
  spInsert: db.prepare('INSERT OR IGNORE INTO special_progress (user_id, track_id) VALUES (?,?)'),
  spGet: db.prepare('SELECT claimed_tiers FROM special_progress WHERE user_id=? AND track_id=?'),
  spBump: db.prepare('UPDATE special_progress SET claimed_tiers=claimed_tiers+1 WHERE user_id=? AND track_id=?'),
  chGet: db.prepare('SELECT * FROM challenge_state WHERE user_id=? AND challenge_id=? AND month=?'),
  chAll: db.prepare('SELECT * FROM challenge_state WHERE user_id=? AND month=?'),
  chInsert: db.prepare('INSERT OR IGNORE INTO challenge_state (user_id, challenge_id, month, done, joined_day) VALUES (?,?,?,?,?)'),
  chUpdate: db.prepare('UPDATE challenge_state SET done=?, completed=? WHERE user_id=? AND challenge_id=? AND month=?'),
  badgeInsert: db.prepare('INSERT OR IGNORE INTO badges (user_id, badge_id, ts) VALUES (?,?,?)'),
  itemInsert: db.prepare('INSERT OR IGNORE INTO items_owned (user_id, kind, item_id, color_id, acquired_ts) VALUES (?,?,?,?,?)'),
}

// ---------- lazy done-detection per quest type (cross-module via tables only) ----------
function isDerivedDone(userId: number, day: string, type: string): boolean {
  switch (type) {
    case 'complete_goal': return !!q.anyGoalDone.get(userId, day)
    case 'pat_pet': {
      const pet = q.pet.get(userId) as PetRow | undefined
      return (pet?.pats_today ?? 0) > 0
    }
    case 'walk': return !!q.anyWalk.get(userId, day)
    case 'log_mood': return !!q.anyMood.get(userId, day)
    case 'breathing': return !!q.anyActivity.get(userId, day, 'breathing')
    case 'gratitude_reflection': return !!q.anyReflection.get(userId, day) || !!q.anyActivity.get(userId, day, 'gratitude')
    case 'name_emotion': return !!q.anyActivity.get(userId, day, 'emotion')
    case 'affirmation': return !!q.anyActivity.get(userId, day, 'affirmation')
    case 'send_vibe': return !!q.anyVibe.get(userId, day)
    default: return false // change_outfit / change_interior / answer_friends — stored flag only
  }
}

function specialValue(userId: number, pet: PetRow, metric: string): number {
  switch (metric) {
    case 'clothing': return (q.countOwned.get(userId, 'clothing') as { n: number }).n
    case 'furniture': return (q.countOwned.get(userId, 'furniture') as { n: number }).n
    case 'micropets': return (q.countSpecies.get(userId) as { n: number }).n
    case 'locations': return (q.countLocations.get(userId) as { n: number }).n
    case 'stage': return pet.walks
    case 'friendship': return friendshipLevel(pet.friendship_pts)
    default: return 0
  }
}

// ---------- full quests state ----------
function buildState(user: UserRow) {
  const day = user.last_day!
  const pet = q.pet.get(user.id) as PetRow

  // daily
  const rolled = rollDaily(user.id, day)
  for (const quest of rolled) q.dqInsert.run(user.id, day, quest.id)
  const rows = new Map(
    (q.dqRows.all(user.id, day) as { quest_id: string; done: number; claimed: number }[]).map(r => [r.quest_id, r]),
  )
  const question = FRIEND_QUESTIONS[daysSinceEpoch(day) % FRIEND_QUESTIONS.length]
  const affirmation = AFFIRMATIONS[daysSinceEpoch(day) % AFFIRMATIONS.length]
  const daily = rolled.map(quest => {
    const row = rows.get(quest.id)
    const stored = row?.done ?? 0
    return {
      id: quest.id,
      ru: quest.ru,
      type: quest.type,
      done: stored > 0 || isDerivedDone(user.id, day, quest.type),
      claimed: !!row?.claimed,
      manual: MANUAL_TYPES.has(quest.type),
      reward: C.DAILY_QUEST_STONES,
      ...(quest.type === 'answer_friends'
        ? { question: { text: question.q, options: question.options, answer: stored > 0 ? stored - 1 : null } }
        : {}),
      ...(quest.type === 'affirmation' ? { affirmation } : {}),
    }
  })

  // weekly milestones per SCA
  const week = isoWeek(day)
  const { start, end } = weekBounds(day)
  const dayRows = q.weeklyDays.all(user.id, start, end) as { sca: string; days: number }[]
  const daysBySca = new Map(dayRows.map(r => [r.sca, r.days]))
  const scaIds = new Set<string>((q.userScas.all(user.id) as { sca: string }[]).map(r => r.sca))
  for (const r of dayRows) scaIds.add(r.sca)
  const scaMeta = new Map(content.goals.scas.map(s => [s.id, s]))
  const weekly = [...scaIds]
    .map(sca => {
      q.wsInsert.run(user.id, week, sca)
      const claimed = (q.wsGet.get(user.id, week, sca) as { claimed: number }).claimed
      const meta = scaMeta.get(sca)
      return {
        sca,
        ru: meta?.ru ?? sca,
        emoji: meta?.emoji ?? '⭐',
        color: meta?.color ?? '#FFE8B8',
        days: daysBySca.get(sca) ?? 0,
        claimed,
      }
    })
    .sort((a, b) => b.days - a.days || a.ru.localeCompare(b.ru))

  // special tracks
  const special = SPECIAL_TRACKS.map(track => {
    q.spInsert.run(user.id, track.id)
    const tier = (q.spGet.get(user.id, track.id) as { claimed_tiers: number }).claimed_tiers
    const target = tier < track.tiers.length ? track.tiers[tier] : null
    const value = specialValue(user.id, pet, track.metric)
    return {
      id: track.id,
      ru: track.ru_template.replace('{n}', String(target ?? track.tiers[track.tiers.length - 1])),
      metric: track.metric,
      value,
      target,
      tier,
      totalTiers: track.tiers.length,
      claimable: target != null && value >= target,
      reward: C.SPECIAL_QUEST_STONES,
    }
  })

  // goal challenges (current month)
  const month = day.slice(0, 7)
  const joinOpen = Number(day.slice(8, 10)) <= C.CHALLENGE_JOIN_BY_DAY
  const stRows = new Map((q.chAll.all(user.id, month) as ChallengeStateRow[]).map(r => [r.challenge_id, r]))
  const challenges = CHALLENGES.map(ch => {
    const st = stRows.get(ch.id)
    const done = st ? (JSON.parse(st.done) as { i: number; day: string }[]) : []
    return {
      id: ch.id,
      name: ch.ru_name,
      theme: ch.ru_theme,
      badge: ch.badge_emoji,
      goals: ch.goals,
      joined: !!st,
      joinable: !st && joinOpen,
      completed: !!st?.completed,
      doneIdx: done.map(d => d.i),
      checkedToday: done.some(d => d.day === day),
    }
  })

  return { day, month, daily, weekly, special, challenges }
}

// ---------- routes ----------
questsRoutes.get('/state', c => {
  const user = ensureFresh(c.get('user'))
  return c.json({ state: buildState(user) })
})

// Honest manual confirmation for quest types we can't derive from tables.
questsRoutes.post('/daily/:id/done', c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const id = c.req.param('id')
  const quest = rollDaily(user.id, day).find(x => x.id === id)
  if (!quest || !MANUAL_TYPES.has(quest.type)) return c.json({ error: 'not_found' }, 404)
  q.dqInsert.run(user.id, day, id)
  q.dqSetDone.run(1, user.id, day, id)
  return c.json({ state: buildState(user) })
})

// «Ответь с друзьями» — store the answer (answer index + 1) in daily_quests.done.
questsRoutes.post('/daily/answer', async c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const body = z.object({ answer: z.number().int().min(0).max(7) }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const quest = rollDaily(user.id, day).find(x => x.type === 'answer_friends')
  if (!quest) return c.json({ error: 'not_found' }, 404)
  const { options } = FRIEND_QUESTIONS[daysSinceEpoch(day) % FRIEND_QUESTIONS.length]
  if (body.data.answer >= options.length) return c.json({ error: 'bad_request' }, 400)
  q.dqInsert.run(user.id, day, quest.id)
  const row = q.dqRow.get(user.id, day, quest.id) as { done: number; claimed: number }
  if (row.done === 0) q.dqSetDone.run(body.data.answer + 1, user.id, day, quest.id)
  return c.json({ state: buildState(user) })
})

questsRoutes.post('/daily/:id/claim', c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const id = c.req.param('id')
  const quest = rollDaily(user.id, day).find(x => x.id === id)
  if (!quest) return c.json({ error: 'not_found' }, 404)
  q.dqInsert.run(user.id, day, id)
  const row = q.dqRow.get(user.id, day, id) as { done: number; claimed: number }
  if (row.done === 0 && !isDerivedDone(user.id, day, quest.type)) return c.json({ error: 'not_done' }, 400)
  const r = q.dqClaim.run(user.id, day, id)
  if (r.changes === 0) return c.json({ error: 'already_claimed' }, 400)
  addStones(user.id, C.DAILY_QUEST_STONES, 'daily_quest')
  return c.json({ reward: C.DAILY_QUEST_STONES, state: buildState(user) })
})

questsRoutes.post('/weekly/:sca/claim', async c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const sca = c.req.param('sca')
  const body = z.object({ tier: z.number().int().min(0).max(C.WEEKLY_MILESTONES.length - 1) })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const milestone = C.WEEKLY_MILESTONES[body.data.tier]
  const week = isoWeek(day)
  const { start, end } = weekBounds(day)
  const { days } = q.scaDays.get(user.id, start, end, sca) as { days: number }
  if (days < milestone.days) return c.json({ error: 'not_done' }, 400)
  q.wsInsert.run(user.id, week, sca)
  const { claimed } = q.wsGet.get(user.id, week, sca) as { claimed: number }
  const bit = 1 << body.data.tier
  if (claimed & bit) return c.json({ error: 'already_claimed' }, 400)
  q.wsClaim.run(bit, user.id, week, sca)
  addStones(user.id, milestone.stones, 'weekly_milestone')
  return c.json({ reward: milestone.stones, state: buildState(user) })
})

questsRoutes.post('/special/:track/claim', c => {
  const user = ensureFresh(c.get('user'))
  const track = SPECIAL_TRACKS.find(t => t.id === c.req.param('track'))
  if (!track) return c.json({ error: 'not_found' }, 404)
  q.spInsert.run(user.id, track.id)
  const { claimed_tiers } = q.spGet.get(user.id, track.id) as { claimed_tiers: number }
  if (claimed_tiers >= track.tiers.length) return c.json({ error: 'all_claimed' }, 400)
  const pet = q.pet.get(user.id) as PetRow
  if (specialValue(user.id, pet, track.metric) < track.tiers[claimed_tiers]) return c.json({ error: 'not_done' }, 400)
  q.spBump.run(user.id, track.id)
  addStones(user.id, C.SPECIAL_QUEST_STONES, 'special_quest')
  return c.json({ reward: C.SPECIAL_QUEST_STONES, state: buildState(user) })
})

questsRoutes.post('/challenge/:id/join', c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const ch = CHALLENGES.find(x => x.id === c.req.param('id'))
  if (!ch) return c.json({ error: 'not_found' }, 404)
  if (Number(day.slice(8, 10)) > C.CHALLENGE_JOIN_BY_DAY) return c.json({ error: 'too_late' }, 400)
  q.chInsert.run(user.id, ch.id, day.slice(0, 7), '[]', day)
  return c.json({ state: buildState(user) })
})

// One challenge goal per day, any order; all 14 → badge + wall-badge furniture item.
questsRoutes.post('/challenge/:id/check', async c => {
  const user = ensureFresh(c.get('user'))
  const day = user.last_day!
  const ch = CHALLENGES.find(x => x.id === c.req.param('id'))
  if (!ch) return c.json({ error: 'not_found' }, 404)
  const body = z.object({ index: z.number().int().min(0).max(C.CHALLENGE_GOALS - 1) })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const month = day.slice(0, 7)
  const st = q.chGet.get(user.id, ch.id, month) as ChallengeStateRow | undefined
  if (!st) return c.json({ error: 'not_joined' }, 400)
  if (st.completed) return c.json({ error: 'already_completed' }, 400)
  const done = JSON.parse(st.done) as { i: number; day: string }[]
  if (done.some(d => d.day === day)) return c.json({ error: 'one_per_day' }, 400)
  if (done.some(d => d.i === body.data.index)) return c.json({ error: 'already_checked' }, 400)
  done.push({ i: body.data.index, day })
  const completed = done.length >= C.CHALLENGE_GOALS
  db.transaction(() => {
    q.chUpdate.run(JSON.stringify(done), completed ? 1 : 0, user.id, ch.id, month)
    if (completed) {
      q.badgeInsert.run(user.id, ch.id, Date.now())
      q.itemInsert.run(user.id, 'furniture', `badge_${ch.id}`, '', Date.now())
    }
  })()
  return c.json({ celebrate: completed, state: buildState(user) })
})
