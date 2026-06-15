// «Витрина» — premium milestone share cards (Feature 1). The CLIENT rasterizes the card
// (puppy art + headline + deep-link) on a <canvas> and uploads the PNG here; the server only
// hosts it statically and (best-effort) prepares an inline message for chat-forwarding.
// No server-side image library needed. See docs/SPEC-VIRAL-FEATURES.md §1.
import { Hono } from 'hono'
import { z } from 'zod'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { C } from '../../../shared/constants'
import { db } from '../db'
import { addStones } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { logEvent, logFirst } from '../engine/analytics'
import { bot } from '../bot'
import type { Env } from '../env'

export const shareRoutes = new Hono<Env>()

const here = dirname(fileURLToPath(import.meta.url))
const cardsDir = join(process.env.DATA_DIR ?? join(here, '..', '..', '..', 'data'), 'cards')
mkdirSync(cardsDir, { recursive: true })
const APP_URL = (process.env.APP_URL ?? '').replace(/\/$/, '')
const BOT_USERNAME = process.env.BOT_USERNAME || 'sharikrubot'

function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

// kind ∈ hatch|stage|streak|micropet|location|event|coop|dig|stats ; ref discriminates the milestone
shareRoutes.post('/card', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({
    kind: z.string().min(1).max(20),
    ref: z.string().max(40).optional(),
    png: z.string().max(4_000_000), // data URL or raw base64 of the rendered card
    text: z.string().max(280).optional(),
  }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)

  const ref = body.data.ref ?? ''
  const b64 = body.data.png.replace(/^data:image\/\w+;base64,/, '')
  let buf: Buffer
  try { buf = Buffer.from(b64, 'base64') } catch { return c.json({ error: 'bad_image' }, 400) }
  if (buf.length < 64 || buf.length > 3_000_000) return c.json({ error: 'bad_image' }, 400)

  const fname = `${hashStr(`${me.id}:${body.data.kind}:${ref}:${buf.length}`)}.png`
  try { writeFileSync(join(cardsDir, fname), buf) } catch { return c.json({ error: 'save_failed' }, 500) }
  const url = APP_URL ? `${APP_URL}/cards/${fname}` : `/cards/${fname}`

  // once-per-milestone reward (anti-spam via the unique index on (user_id, kind, ref))
  const ins = db.prepare('INSERT OR IGNORE INTO share_events (user_id, kind, ref, surface, ts) VALUES (?,?,?,?,?)')
    .run(me.id, body.data.kind, ref, 'card', Date.now())
  let rewarded = 0
  if (ins.changes > 0) {
    addStones(me.id, C.SHARE_REWARD_STONES, 'share_reward')
    rewarded = C.SHARE_REWARD_STONES
    logFirst(me.id, 'first_share', { kind: body.data.kind })
  }
  logEvent(me.id, 'share_card', { kind: body.data.kind, ref })

  // best-effort prepared inline message (Bot API 8.0+) so the client can forward into chats
  let preparedId: string | null = null
  const link = `https://t.me/${BOT_USERNAME}?startapp=ref_${me.friend_code}`
  if (bot && APP_URL) {
    try {
      const result = {
        type: 'photo', id: fname.slice(0, 32),
        photo_url: url, thumbnail_url: url,
        caption: (body.data.text ?? 'Загляни ко мне в Шарик 💛').slice(0, 200),
        reply_markup: { inline_keyboard: [[{ text: 'Открыть Шарика', url: link }]] },
      }
      const prepared = await (bot.api as unknown as {
        savePreparedInlineMessage: (uid: number, r: unknown, o: unknown) => Promise<{ id: string }>
      }).savePreparedInlineMessage(me.id, result, { allow_user_chats: true, allow_group_chats: true })
      preparedId = prepared?.id ?? null
    } catch { /* old Bot API / no token — client falls back to story or link */ }
  }

  return c.json({ url, preparedId, link, rewarded })
})

// log a share's chosen surface (story/message/link) for analytics; idempotent-ish
shareRoutes.post('/log', async c => {
  const me = ensureFresh(c.get('user'))
  const body = z.object({ kind: z.string().max(20), ref: z.string().max(40).optional(), surface: z.string().max(10) })
    .safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'bad_request' }, 400)
  logEvent(me.id, 'share_surface', { kind: body.data.kind, surface: body.data.surface })
  return c.json({ ok: true })
})
