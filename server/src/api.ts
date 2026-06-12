import { Hono } from 'hono'
import { z } from 'zod'
import { validateInitData, issueToken, verifyToken } from './auth'
import { addGoal, bootstrapUser, completeGoal, getState, getUser, logMood, patPet, startWalk } from './engine/core'
import { content, starterGoals } from './content'
import type { UserRow } from './engine/rows'
import { db } from './db'

type Env = { Variables: { user: UserRow } }
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
  color: z.string().max(20),
  trait: z.string().max(30),
  userName: z.string().min(1).max(40),
  tz: z.string().max(50).optional(),
})

api.use('/*', async (c, next) => {
  if (c.req.path.endsWith('/auth') || c.req.path.endsWith('/health')) return next()
  const token = c.req.header('authorization')?.replace(/^Bearer /, '')
  const uid = token ? await verifyToken(token) : null
  if (!uid) return c.json({ error: 'unauthorized' }, 401)
  const user = getUser(uid)
  if (!user && !c.req.path.endsWith('/onboard')) return c.json({ error: 'not_registered' }, 403)
  if (user) c.set('user', user)
  ;(c as unknown as { uid: number }).uid = uid
  return next()
})

api.post('/onboard', async c => {
  const uid = (c as unknown as { uid: number }).uid
  if (getUser(uid)) return c.json({ error: 'already_registered' }, 409)
  const body = onboardingSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  const { petName, pronouns, color, trait, userName, tz } = body.data
  const user = bootstrapUser(uid, userName, { petName, pronouns, color, trait, tz })
  for (const g of starterGoals()) addGoal(user.id, g.ru, g.emoji, g.sca)
  return c.json({ state: getState(user) })
})

api.get('/state', c => c.json({ state: getState(c.get('user')) }))

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
