// «Коллекция» — limited-supply cosmetic collectible puppy items (Feature 5B).
// Earned with косточки, transparent minted/cap counts, serial edition number. No gambling,
// no paid randomness, no airdrop. One edition per user per drop. See SPEC-VIRAL-FEATURES §5B.
import { Hono } from 'hono'
import { z } from 'zod'
import { C } from '../../../shared/constants'
import { db } from '../db'
import { addStones, getUser } from '../engine/core'
import { ensureFresh } from '../engine/day'
import { logEvent } from '../engine/analytics'
import type { Env } from '../env'

export const collectiblesRoutes = new Hono<Env>()

const DROPS = C.COLLECTIBLE_DROPS as readonly { id: string; ru: string; emoji: string; cap: number; price: number; season: string }[]
const DROP_BY_ID = new Map(DROPS.map(d => [d.id, d]))

function mintedOf(itemId: string): number {
  const row = db.prepare('SELECT minted FROM collectible_supply WHERE item_id=?').get(itemId) as { minted: number } | undefined
  return row?.minted ?? 0
}

collectiblesRoutes.get('/', c => {
  const me = ensureFresh(c.get('user'))
  const owned = new Map((db.prepare("SELECT item_id, edition FROM items_owned WHERE user_id=? AND kind='collectible'")
    .all(me.id) as { item_id: string; edition: number | null }[]).map(r => [r.item_id, r.edition]))
  const drops = DROPS.map(d => ({
    id: d.id, ru: d.ru, emoji: d.emoji, cap: d.cap, price: d.price, season: d.season,
    minted: mintedOf(d.id),
    ownedEdition: owned.has(d.id) ? owned.get(d.id) ?? 0 : null,
  }))
  return c.json({ drops, stones: me.stones })
})

collectiblesRoutes.post('/:id/claim', c => {
  const me = ensureFresh(c.get('user'))
  const drop = DROP_BY_ID.get(c.req.param('id'))
  if (!drop) return c.json({ error: 'not_found' }, 404)
  const already = db.prepare("SELECT 1 FROM items_owned WHERE user_id=? AND kind='collectible' AND item_id=?").get(me.id, drop.id)
  if (already) return c.json({ error: 'already_owned' }, 409)
  if (me.stones < drop.price) return c.json({ error: 'not_enough_stones' }, 400)

  let edition = 0
  let ok = false
  db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO collectible_supply (item_id, minted, cap) VALUES (?,0,?)').run(drop.id, drop.cap)
    const minted = (db.prepare('SELECT minted FROM collectible_supply WHERE item_id=?').get(drop.id) as { minted: number }).minted
    if (minted >= drop.cap) return // sold out
    edition = minted + 1
    db.prepare('UPDATE collectible_supply SET minted=? WHERE item_id=?').run(edition, drop.id)
    addStones(me.id, -drop.price, 'collectible')
    db.prepare('INSERT INTO items_owned (user_id, kind, item_id, color_id, edition, acquired_ts) VALUES (?,?,?,?,?,?)')
      .run(me.id, 'collectible', drop.id, '', edition, Date.now())
    ok = true
  })()
  if (!ok) return c.json({ error: 'sold_out' }, 409)
  logEvent(me.id, 'collectible_claim', { id: drop.id, edition })
  return c.json({ ok: true, edition, minted: mintedOf(drop.id), cap: drop.cap, stones: getUser(me.id)!.stones })
})
