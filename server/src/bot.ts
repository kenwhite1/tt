import { Bot, webhookCallback } from 'grammy'
import { BOT_TOKEN } from './auth'
import { db } from './db'

export const bot = BOT_TOKEN ? new Bot(BOT_TOKEN) : null
const APP_URL = process.env.APP_URL ?? ''

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
    await ctx.reply('Гав! 🐶 Я Дружок — твой щенок заботы о себе. Открывай приложение, я тебя жду!', {
      reply_markup: APP_URL
        ? { inline_keyboard: [[{ text: '🐾 Открыть Дружка', web_app: { url: APP_URL } }]] }
        : undefined,
    })
  })
}

export const botWebhook = bot ? webhookCallback(bot, 'hono') : null
