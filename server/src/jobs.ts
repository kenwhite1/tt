// Reminder engine, the puppy DMs the user on their own day cycle (replaces push notifications).
// No-op without BOT_TOKEN (dev mode). Runs a minute-cron: per-user local-time windows,
// reminder_log dedupe, settings toggles, pause-mode silence, 403/429-aware sequential sender.
import cron from 'node-cron'
import { GrammyError } from 'grammy'
import { db } from './db'
import { bot, appKeyboard } from './bot'
import { content } from './content'
import { gameDay, localNow } from './engine/day'
import type { UserRow } from './engine/rows'

const copy = content.botCopy

function pool(key: string): string[] {
 const p = copy[key]
 return Array.isArray(p) ? p : []
}
function pick(arr: string[]): string {
 return arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''
}
function hashCode(s: string): number {
 let h = 0
 for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
 return Math.abs(h)
}
function shiftDate(date: string, days: number): string {
 const d = new Date(`${date}T12:00:00Z`)
 d.setUTCDate(d.getUTCDate() + days)
 return d.toISOString().slice(0, 10)
}
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// write_access lives in 002_world.sql but predates the shared UserRow type, extend locally.
type UserWithAccess = UserRow & { write_access: number }
interface EligibleRow extends UserRow { pet_name: string | null; write_access: number }

function fill(text: string, u: EligibleRow): string {
 return text.replaceAll('{name}', u.name || 'друг').replaceAll('{pet}', u.pet_name ?? 'Дружок')
}

// Per-type toggles live in users.settings JSON: notif_morning, notif_midday_support,
// notif_evening_checkin, notif_bedtime, notif_streak_saver, notif_walk_return, notif_mail,
// notif_social, absent key = ON; notif_all=false = global off.
function notifOn(u: UserRow, kind: string): boolean {
 try {
 const s = JSON.parse(u.settings || '{}') as Record<string, unknown>
 if (s.notif_all === false) return false
 return s[`notif_${kind}`] !== false
 } catch {
 return true
 }
}

function isPaused(u: UserRow, day: string): boolean {
 return !!u.paused_until && u.paused_until >= day
}

// ---- low-level delivery (403 → unreachable, 429 → wait retry_after & retry once) ----

async function deliver(userId: number, text: string): Promise<void> {
 if (!bot || !text) return
 try {
 await bot.api.sendMessage(userId, text, { reply_markup: appKeyboard() })
 } catch (e) {
 if (e instanceof GrammyError && e.error_code === 403) {
 db.prepare('UPDATE users SET write_access=0 WHERE id=?').run(userId)
 } else if (e instanceof GrammyError && e.error_code === 429) {
 await sleep(((e.parameters?.retry_after ?? 3) + 1) * 1000)
 try {
 await bot.api.sendMessage(userId, text, { reply_markup: appKeyboard() })
 } catch { /* give up this minute; dedupe already logged */ }
 } else {
 console.error('[jobs] sendMessage failed', userId, e)
 }
 }
}

// Fire-and-forget DM for social events (vibes/gifts/buddies), other modules import this.
// Respects write_access, pause mode and the notif_social toggle.
export function sendDM(userId: number, text: string): void {
 if (!bot) return
 const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as UserWithAccess | undefined
 if (!u || !u.write_access) return
 const day = gameDay(u)
 if (isPaused(u, day) || !notifOn(u, 'social')) return
 void deliver(userId, text)
}

// ---- the minute tick ----

const MIDDAY_MIN = 13 * 60 // 13:00 local
const EVENING_MIN = 19 * 60 + 30 // 19:30 local
const STREAK_MIN = 21 * 60 // 21:00 local
const MAIL_MIN = 9 * 60 // Monday 09:00 local
const BEDTIME_BEFORE = 30 // sleep − 30 min
const SEND_GAP_MS = 50
const WALK_RETURN_MAX_AGE_MS = 12 * 3_600_000

const logInsert = db.prepare('INSERT OR IGNORE INTO reminder_log (user_id, kind, day) VALUES (?,?,?)')

function collectDue(): { userId: number; text: string }[] {
 const sends: { userId: number; text: string }[] = []
 const users = db.prepare(
 'SELECT u.*, p.name AS pet_name FROM users u LEFT JOIN pets p ON p.user_id=u.id WHERE u.write_access=1',
 ).all() as EligibleRow[]
 const byId = new Map(users.map(u => [u.id, u]))

 const queue = (u: EligibleRow, kind: string, day: string, text: string) => {
 if (!notifOn(u, kind)) return false
 if (logInsert.run(u.id, kind, day).changes === 0) return false
 if (text) sends.push({ userId: u.id, text: fill(text, u) })
 return true
 }

 for (const u of users) {
 const local = localNow(u.tz)
 const day = gameDay(u)
 if (isPaused(u, day)) continue
 const within = (target: number) => {
 const t = ((target % 1440) + 1440) % 1440
 return Math.abs(local.minutes - t) <= 1
 }
 const footer = hashCode(`${u.id}:${day}:footer`) % 6 === 0 ? `\n\n${pick(pool('reminder_footer'))}` : ''

 // Утро, в момент подъёма
 if (within(u.wake_min)) queue(u, 'morning', day, pick(pool('morning')) + footer)
 // Тёплое слово днём, ~3 дня в неделю, 13:00
 if (within(MIDDAY_MIN) && hashCode(`${u.id}:${day}:midday`) % 7 < 3)
 queue(u, 'midday_support', day, pick(pool('midday_support')) + footer)
 // Вечерний чек-ин, 19:30
 if (within(EVENING_MIN)) queue(u, 'evening_checkin', day, pick(pool('evening_checkin')))
 // Перед сном, за 30 минут до отбоя
 if (within(u.sleep_min - BEDTIME_BEFORE)) queue(u, 'bedtime', day, pick(pool('bedtime')))
 // Спасатель серии, 21:00, если сегодня ещё не открывал приложение
 if (within(STREAK_MIN) && u.last_day !== day) queue(u, 'streak_saver', day, pick(pool('streak_saver')))
 // Газета «Недельный лай», понедельник 09:00
 if (within(MAIL_MIN) && new Date(`${local.date}T12:00:00Z`).getUTCDay() === 1) {
 if (queue(u, 'mail', day, pick(pool('mail')))) insertNewsletter(u, day)
 }
 }

 // Возвращение с прогулки: прогулка кончилась, разговор ещё не состоялся
 const now = Date.now()
 const walks = db.prepare(
 'SELECT user_id, day FROM walks WHERE ends_ts<=? AND ends_ts>? AND chat_done=0',
 ).all(now, now - WALK_RETURN_MAX_AGE_MS) as { user_id: number; day: string }[]
 for (const w of walks) {
 const u = byId.get(w.user_id)
 if (!u || isPaused(u, gameDay(u))) continue
 queue(u, 'walk_return', w.day, pick(pool('walk_return')))
 }

 // Почта, помеченная модулями как «сообщить в DM» (mail.data.notify=true), один раз
 const mailRows = db.prepare(
 `SELECT id, user_id, title, data FROM mail WHERE data LIKE '%"notify":true%'`,
 ).all() as { id: number; user_id: number; title: string; data: string }[]
 for (const m of mailRows) {
 let data: Record<string, unknown>
 try { data = JSON.parse(m.data) as Record<string, unknown> } catch { data = {} }
 if (data.notify !== true) continue
 data.notify = false // mark sent first, a failed send must not loop forever
 db.prepare('UPDATE mail SET data=? WHERE id=?').run(JSON.stringify(data), m.id)
 const u = byId.get(m.user_id)
 if (!u || isPaused(u, gameDay(u)) || !notifOn(u, 'mail')) continue
 const text = typeof data.dm_text === 'string' && data.dm_text ? data.dm_text : pick(pool('mail'))
 sends.push({ userId: u.id, text: fill(text, u) })
 }

 return sends
}

// «Недельный лай»: weekly stats letter into the in-app mailbox (the DM only announces it).
function insertNewsletter(u: EligibleRow, day: string) {
 const from = shiftDate(day, -6)
 const checkins = (db.prepare('SELECT COUNT(*) n FROM moods WHERE user_id=? AND day>=? AND day<=?')
 .get(u.id, from, day) as { n: number }).n
 const avgMood = (db.prepare('SELECT AVG(value) v FROM moods WHERE user_id=? AND day>=? AND day<=?')
 .get(u.id, from, day) as { v: number | null }).v
 const goalsDone = (db.prepare('SELECT COUNT(*) n FROM goal_completions WHERE user_id=? AND day>=? AND day<=?')
 .get(u.id, from, day) as { n: number }).n
 const walksDone = (db.prepare('SELECT COUNT(*) n FROM walks WHERE user_id=? AND day>=? AND day<=? AND completed=1')
 .get(u.id, from, day) as { n: number }).n

 const moodLine = avgMood == null
 ? 'настроение на этой неделе ты не отмечал, и это тоже окей'
 : avgMood >= 4 ? 'чаще всего тебе было радостно ☀️'
 : avgMood >= 3 ? 'настроение держалось ровно и спокойно 🌿'
 : 'неделя была непростой, я рядом и очень тобой горжусь 💛'

 const petName = u.pet_name ?? 'Дружок'
 const body = [
 `Гав! Это «Недельный лай», наша с тобой газета. ${petName} собирал новости всю неделю 🗞🐶`,
 '',
 `Неделя ${from}, ${day}:`,
 `• Отметок настроения: ${checkins}, ${moodLine}`,
 `• Выполнено целей: ${goalsDone}`,
 `• Прогулок вместе: ${walksDone}`,
 '',
 checkins + goalsDone + walksDone > 0
 ? 'Каждый маленький шаг на этой неделе, это забота о себе. Я всё видел и очень рад 💛'
 : 'На этой неделе было тихо, и это нормально. Я никуда не денусь и жду тебя, когда будут силы 💛',
 ].join('\n')

 db.prepare('INSERT INTO mail (user_id, kind, title, body, data, ts) VALUES (?,?,?,?,?,?)')
 .run(u.id, 'newsletter', 'Недельный лай 🗞', body, '{}', Date.now())
}

// ---- scheduler ----

let running = false
async function tick() {
 if (running) return
 running = true
 try {
 const sends = collectDue()
 for (const s of sends) {
 await deliver(s.userId, s.text)
 await sleep(SEND_GAP_MS)
 }
 } catch (e) {
 console.error('[jobs] tick failed', e)
 } finally {
 running = false
 }
}

if (bot) {
 cron.schedule('* * * * *', () => { void tick() })
 console.log('reminder engine: minute cron armed')
}
