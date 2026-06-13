import { Bot, webhookCallback } from 'grammy'
import { BOT_TOKEN } from './auth'
import { db } from './db'
import { content } from './content'
import { registerPaymentHandlers } from './routes/payments'

export const bot = BOT_TOKEN ? new Bot(BOT_TOKEN) : null
const APP_URL = process.env.APP_URL ?? ''

const copy = content.botCopy
const openLabel = typeof copy.open_button === 'string' ? copy.open_button : 'Открыть Дружка'

function pickFrom(key: string, fallback: string): string {
  const p = copy[key]
  if (Array.isArray(p) && p.length) return p[Math.floor(Math.random() * p.length)]
  return fallback
}

export function appKeyboard() {
  return APP_URL
    ? { inline_keyboard: [[{ text: openLabel, web_app: { url: APP_URL } }]] }
    : undefined
}

function grantWriteAccess(tgId: number) {
  db.prepare('UPDATE users SET write_access=1 WHERE id=?').run(tgId)
}

if (bot) {
  bot.command('start', async ctx => {
    const payload = ctx.match?.toString() ?? ''
    if (payload.startsWith('ref_') && ctx.from) {
      const code = payload.slice(4)
      const inviter = db.prepare('SELECT id FROM users WHERE friend_code=?').get(code) as { id: number } | undefined
      if (inviter && inviter.id !== ctx.from.id && !db.prepare('SELECT id FROM users WHERE id=?').get(ctx.from.id)) {
        db.prepare('INSERT OR REPLACE INTO pending_referrals (tg_id, inviter_id, ts) VALUES (?,?,?)')
          .run(ctx.from.id, inviter.id, Date.now())
      }
    }
    if (ctx.from) grantWriteAccess(ctx.from.id)
    const pet = ctx.from
      ? (db.prepare('SELECT name FROM pets WHERE user_id=?').get(ctx.from.id) as { name: string } | undefined)
      : undefined
    const greeting = pickFrom(
      'onboarding_bot_greeting',
      'Гав! 🐶 Я Дружок — твой щенок заботы о себе. Открывай приложение, я тебя жду!',
    )
      .replaceAll('{name}', ctx.from?.first_name || 'друг')
      .replaceAll('{pet}', pet?.name ?? 'Дружок')
    await ctx.reply(greeting, { reply_markup: appKeyboard() })
  })

  // Any message to the bot = explicit permission to DM (reminder engine relies on this).
  bot.on('message', ctx => {
    grantWriteAccess(ctx.from.id)
  })

  registerPaymentHandlers(bot)
}

export const botWebhook = bot ? webhookCallback(bot, 'hono') : null
