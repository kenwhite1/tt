// Telegram Stars payments for «Дружок Плюс», wired but DORMANT (PLUS_ENFORCED flag).
// Month = 30-day Stars subscription (subscription_period 2592000); year = one-off 365-day SKU.
import { Hono } from 'hono'
import type { Bot } from 'grammy'
import { z } from 'zod'
import { C } from '../../../shared/constants'
import { db } from '../db'
import { bot } from '../bot'
import type { Env } from '../env'

export const paymentsRoutes = new Hono<Env>()

paymentsRoutes.get('/config', c =>
 c.json({
 enforced: process.env.PLUS_ENFORCED === '1',
 monthStars: C.PLUS_MONTH_STARS,
 yearStars: C.PLUS_YEAR_STARS,
 }),
)

paymentsRoutes.post('/subscribe', async c => {
 const body = z.object({ plan: z.enum(['month', 'year']) }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 if (!bot) return c.json({ dev: true }) // no BOT_TOKEN, local/dev mode, payments dormant
 const user = c.get('user')
 try {
 const link = body.data.plan === 'month'
 ? await bot.api.raw.createInvoiceLink({
 title: 'Дружок Плюс, на месяц',
 description: 'Подписка на 30 дней: больше слотов в магазинах, направлений и наград события.',
 payload: `plus_month:${user.id}`,
 provider_token: '',
 currency: 'XTR',
 prices: [{ label: 'Дружок Плюс, 30 дней', amount: C.PLUS_MONTH_STARS }],
 subscription_period: 2_592_000, // the only allowed value (30 days)
 })
 : await bot.api.raw.createInvoiceLink({
 title: 'Дружок Плюс, на год',
 description: 'Разовая оплата: 365 дней Дружка Плюс. Выгоднее, чем по месяцам!',
 payload: `plus_year:${user.id}`,
 provider_token: '',
 currency: 'XTR',
 prices: [{ label: 'Дружок Плюс, 365 дней', amount: C.PLUS_YEAR_STARS }],
 })
 return c.json({ link })
 } catch (e) {
 console.error('createInvoiceLink failed', e)
 return c.json({ error: 'invoice_failed' }, 502)
 }
})

// Admin refund helper: POST /api/payments/refund {chargeId} with header x-admin-key.
paymentsRoutes.post('/refund', async c => {
 const key = process.env.ADMIN_KEY
 if (!key || c.req.header('x-admin-key') !== key) return c.json({ error: 'forbidden' }, 403)
 const body = z.object({ chargeId: z.string().min(1).max(200) }).safeParse(await c.req.json().catch(() => null))
 if (!body.success) return c.json({ error: 'bad_request' }, 400)
 const row = db.prepare('SELECT user_id FROM payments WHERE charge_id=?').get(body.data.chargeId) as
 | { user_id: number }
 | undefined
 if (!row) return c.json({ error: 'not_found' }, 404)
 if (!bot) return c.json({ dev: true })
 try {
 await bot.api.refundStarPayment(row.user_id, body.data.chargeId)
 } catch (e) {
 console.error('refundStarPayment failed', e)
 return c.json({ error: 'refund_failed' }, 502)
 }
 db.prepare('UPDATE users SET plus_until=NULL WHERE id=?').run(row.user_id)
 return c.json({ ok: true })
})

// Attached by the reminders module's bot.ts, keep the export name EXACT.
export function registerPaymentHandlers(b: Bot) {
 // Telegram requires an answer within 10 seconds, confirm immediately.
 b.on('pre_checkout_query', async ctx => {
 await ctx.answerPreCheckoutQuery(true)
 })

 b.on('message:successful_payment', async ctx => {
 const sp = ctx.message.successful_payment
 if (!ctx.from) return
 const isYear = sp.invoice_payload.startsWith('plus_year')
 const today = new Date().toISOString().slice(0, 10)

 let until: string
 if (!isYear && sp.subscription_expiration_date) {
 // entitlement straight from Telegram's renewal date
 until = new Date(sp.subscription_expiration_date * 1000).toISOString().slice(0, 10)
 } else {
 // extend from the later of (today, current plus_until)
 const u = db.prepare('SELECT plus_until FROM users WHERE id=?').get(ctx.from.id) as
 | { plus_until: string | null }
 | undefined
 const base = u?.plus_until && u.plus_until > today ? u.plus_until : today
 const d = new Date(`${base}T12:00:00Z`)
 d.setUTCDate(d.getUTCDate() + (isYear ? 365 : 30))
 until = d.toISOString().slice(0, 10)
 }

 db.prepare(
 'INSERT INTO payments (user_id, charge_id, stars, kind, sub_until, ts) VALUES (?,?,?,?,?,?)',
 ).run(ctx.from.id, sp.telegram_payment_charge_id, sp.total_amount, isYear ? 'sub_year' : 'sub_month', until, Date.now())
 db.prepare('UPDATE users SET plus_until=? WHERE id=?').run(until, ctx.from.id)

 await ctx.reply('Гав-гав! 💛 Дружок Плюс включён, спасибо, что заботишься о нас обоих!').catch(() => {})
 })
}
