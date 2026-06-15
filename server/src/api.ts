import { Hono } from 'hono'
import { z } from 'zod'
import { validateInitData, issueToken, verifyToken } from './auth'
import { addGoal, bootstrapUser, completeGoal, getState, getUser, logMood, patPet, startWalk } from './engine/core'
import { starterGoals } from './content'
import type { Env } from './env'
import { activitiesRoutes } from './routes/activities'
import { questsRoutes } from './routes/quests'
import { shopRoutes } from './routes/shop'
import { travelRoutes } from './routes/travel'
import { micropetsRoutes } from './routes/micropets'
import { socialRoutes } from './routes/social'
import { eventsRoutes } from './routes/events'
import { paymentsRoutes } from './routes/payments'
import type { UserRow } from './engine/rows'
import { db } from './db'

export const api = new Hono<Env>()

api.post('/auth', async c => {
 const body = await c.req.json<{ initData: string; onboarding?: unknown }>().catch(() => null)
 if (!body) return c.json({ error: 'bad_request' }, 400)
 const v = validateInitData(body.initData ?? '')
 if (!v) return c.json({ error: 'invalid_init_data' }, 401)
 let user = getUser(v.user.id)
 const token = await issueToken(v.user.id)
 return c.json({ token, registered: !!user, tg: { id: v.user.id, name: v.user.first_name } })
})

api.get('/health', c => c.json({ ok: true }))

const onboardingSchema = z.object({
 petName: z.string().min(1).max(30),
 pronouns: z.enum(['he', 'she', 'they']),
 trait: z.string().max(30),
 species: z.string().max(20).optional(),
 userName: z.string().min(1).max(40),
 tz: z.string().max(50).optional(),
 areas: z.array(z.string().max(30)).max(12).optional(),
})

api.use('/*', async (c, next) => {
 if (c.req.path.endsWith('/auth') || c.req.path.endsWith('/health') || c.req.path.endsWith('/events/summary')) return next()
 const token = c.req.header('authorization')?.replace(/^Bearer /, '')
 const uid = token ? await verifyToken(token) : null
 if (!uid) return c.json({ error: 'unauthorized' }, 401)
 const user = getUser(uid)
 if (!user && !c.req.path.endsWith('/onboard') && !c.req.path.endsWith('/events')) return c.json({ error: 'not_registered' }, 403)
 if (user) c.set('user', user)
 ;(c as unknown as { uid: number }).uid = uid
 return next()
})

api.post('/onboard', async c => {
 const uid = (c as unknown as { uid: number }).uid
 if (getUser(uid)) return c.json({ error: 'already_registered' }, 409)
 const body = onboardingSchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const { petName, pronouns, trait, species, userName, tz, areas } = body.data
 const user = bootstrapUser(uid, userName, { petName, pronouns, trait, species, tz })
 for (const g of starterGoals(areas)) addGoal(user.id, g.ru, g.emoji, g.sca)
 return c.json({ state: getState(user) })
})

// Retake the onboarding quiz (Settings → «Пройти знакомство заново»). Updates the
// existing pet/profile in place; keeps stones, streak, goals, micropets, friends.
api.post('/onboard/retake', async c => {
 const user = c.get('user') // middleware guarantees a registered user here
 const body = onboardingSchema.safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const { petName, pronouns, trait, species, userName } = body.data
 db.prepare('UPDATE users SET name=? WHERE id=?').run(userName, user.id)
 db.prepare('UPDATE pets SET name=?, pronouns=?, trait=?, species=? WHERE user_id=?')
  .run(petName, pronouns, trait, species ?? 'dog', user.id)
 return c.json({ state: getState(getUser(user.id)!) })
})

// Persist onboarding survey answers (raw JSON, last-write-wins). Requires a registered user.
api.post('/onboarding/survey', async c => {
  const raw = await c.req.json().catch(() => null)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return c.json({ error: 'bad_request' }, 400)
  const data = JSON.stringify(raw).slice(0, 8000)
  db.prepare(
    'INSERT INTO onboarding_survey (user_id, data, ts) VALUES (?,?,?) ' +
    'ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, ts=excluded.ts',
  ).run(c.get('user').id, data, Date.now())
  return c.json({ ok: true })
})

api.get('/state', c => c.json({ state: getState(c.get('user')) }))

// allow the bot to DM this user (reminders) — called after the Telegram
// write-access grant, since that grant alone never reaches the server.
api.post('/notifications/enable', c => {
 db.prepare('UPDATE users SET write_access=1 WHERE id=?').run(c.get('user').id)
 return c.json({ ok: true })
})

// first-party analytics: log a funnel/error event (uid optional → works mid-onboarding)
api.post('/events', async c => {
 const body = z.object({ name: z.string().min(1).max(60), props: z.record(z.unknown()).optional() })
 .safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const uid = (c as unknown as { uid: number }).uid ?? null
 const props = body.data.props ? JSON.stringify(body.data.props).slice(0, 2000) : null
 db.prepare('INSERT INTO events (user_id, name, props, ts) VALUES (?,?,?,?)').run(uid, body.data.name, props, Date.now())
 return c.json({ ok: true })
})

// owner funnel summary (guarded by ADMIN_KEY; exempt from auth above)
api.get('/events/summary', c => {
 const key = process.env.ADMIN_KEY
 if (!key || c.req.header('x-admin-key') !== key) return c.json({ error: 'forbidden' }, 403)
 const days = Math.min(90, Math.max(1, Number(c.req.query('days')) || 30))
 const since = Date.now() - days * 86_400_000
 const byName = db.prepare(
 'SELECT name, COUNT(*) n, COUNT(DISTINCT user_id) users FROM events WHERE ts > ? GROUP BY name ORDER BY n DESC',
 ).all(since)
 const activeUsers = (db.prepare('SELECT COUNT(DISTINCT user_id) n FROM events WHERE ts > ?').get(since) as { n: number }).n
 const accounts = (db.prepare('SELECT COUNT(*) n FROM users').get() as { n: number }).n
 return c.json({ days, accounts, activeUsers, byName })
})

api.post('/goals', async c => {
 const body = z.object({
 title: z.string().min(1).max(120),
 emoji: z.string().max(8).optional(),
 sca: z.string().max(40).nullable().optional(),
 timesPerDay: z.number().int().min(1).max(100).optional(),
 }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 addGoal(c.get('user').id, body.data.title, body.data.emoji ?? '⭐', body.data.sca ?? null, body.data.timesPerDay ?? 1)
 return c.json({ state: getState(c.get('user')) })
})

api.post('/goals/:id/complete', c => {
 const r = completeGoal(c.get('user'), Number(c.req.param('id')))
 if ('error' in r) return c.json(r, 400)
 return c.json({ reward: r.reward, state: getState(c.get('user')) })
})

api.post('/goals/:id/star', c => {
 const user = c.get('user')
 const day = user.last_day
 db.prepare('UPDATE goals SET goal_of_day=NULL WHERE user_id=?').run(user.id)
 db.prepare('UPDATE goals SET goal_of_day=? WHERE id=? AND user_id=?').run(day, Number(c.req.param('id')), user.id)
 return c.json({ state: getState(user) })
})

api.post('/walk/start', c => {
 const r = startWalk(c.get('user'))
 if ('error' in r) return c.json(r, 400)
 return c.json({ state: getState(c.get('user')) })
})

api.post('/pet/pat', async c => {
 const body = z.object({ count: z.number().int().min(1).max(200) }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const r = patPet(c.get('user'), body.data.count)
 return c.json({ pts: r.pts })
})

api.post('/mood', async c => {
 const body = z.object({
 value: z.number().int().min(1).max(5),
 note: z.string().max(2000).optional(),
 factors: z.array(z.string().max(40)).max(20).optional(),
 }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 logMood(c.get('user'), body.data.value, body.data.note, body.data.factors)
 return c.json({ state: getState(c.get('user')) })
})

// module routes (mounted after auth middleware, c.get('user') is available)
api.route('/activities', activitiesRoutes)
api.route('/quests', questsRoutes)
api.route('/shop', shopRoutes)
api.route('/travel', travelRoutes)
api.route('/micropets', micropetsRoutes)
api.route('/social', socialRoutes)
api.route('/events', eventsRoutes)
api.route('/payments', paymentsRoutes)
