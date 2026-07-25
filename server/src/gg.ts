// «game is game» hub integration: the shared currency G. Дружок has NO
// currency of its own - the hub wallet is the single source of truth. The
// local users.stones column stays only as a synchronous mirror/offline cache
// so the sync SQLite gameplay logic (afford checks, prices) keeps working.
//
// Flow: the launch token (JWT, base64url-wrapped in Telegram start_param)
// is stored per user at /auth. Every ledger entry (earn or spend) is mirrored
// to the hub via POST /api/sdk/earn|spend with a deterministic idempotencyKey,
// and /state reconciles the local mirror from GET /api/sdk/balance. The hub
// has no CORS, so this server is the proxy - the client never calls it.
//
// Everything is fail-soft: hub down / opened outside the hub → the game keeps
// running on the local mirror, all errors are swallowed.
import { db } from './db'

const HUB_URL = (process.env.GG_HUB_URL ?? 'https://game-is-game-hub-production.up.railway.app').replace(/\/$/, '')
const HUB_TIMEOUT_MS = 2_500

// Unwrap the launch token from a Telegram start_param (base64url of a JWT), or
// null when start_param is a plain deep-link (ref code, coop_...) - same logic
// as the canonical GG/shared/sdk.ts decodeLaunchParam.
export function decodeLaunchParam(startParam: string | undefined | null): string | null {
  if (!startParam) return null
  try {
    const token = atob(startParam.replace(/-/g, '+').replace(/_/g, '/'))
    return token.split('.').length === 3 ? token : null
  } catch {
    return null
  }
}

// /auth may run before onboarding creates the users row; park the token in
// memory until flushPendingLaunchToken() persists it right after bootstrap.
const pendingLaunch = new Map<number, string>()

/** Remember the launch token at /auth so later wallet calls can be proxied. */
export function storeLaunchToken(userId: number, startParam: string | null | undefined): void {
  const token = decodeLaunchParam(startParam)
  if (!token) return // opened outside the hub: standalone play, local mirror only
  const r = db.prepare('UPDATE users SET gg_launch=? WHERE id=?').run(token, userId)
  if (r.changes === 0) pendingLaunch.set(userId, token) // user not onboarded yet
}

/** Persist a token parked before onboarding (call once the users row exists). */
export function flushPendingLaunchToken(userId: number): void {
  const token = pendingLaunch.get(userId)
  if (!token) return
  pendingLaunch.delete(userId)
  db.prepare('UPDATE users SET gg_launch=? WHERE id=?').run(token, userId)
}

function launchTokenOf(userId: number): string | null {
  const row = db.prepare('SELECT gg_launch FROM users WHERE id=?').get(userId) as
    | { gg_launch: string | null }
    | undefined
  return row?.gg_launch ?? null
}

async function hubPost(path: string, token: string, body: unknown): Promise<{ ok: boolean; coins: number } | null> {
  try {
    const res = await fetch(`${HUB_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-gg-launch': token },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(HUB_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as { ok?: boolean; coins?: number } | null
    return json?.ok ? { ok: true, coins: json.coins ?? 0 } : null
  } catch {
    return null // hub down / offline: the local mirror carries on
  }
}

/**
 * Mirror one ledger entry to the hub wallet, fire-and-forget. delta>0 → earn,
 * delta<0 → spend. idempotencyKey is stable per ledger row, so a duplicate
 * send can never double-credit. Deferred a tick so a rolled-back transaction
 * (ledger row gone) is never mirrored.
 */
export function mirrorLedgerEntry(userId: number, delta: number, reason: string, ledgerId: number): void {
  if (!HUB_URL || delta === 0) return
  const token = launchTokenOf(userId)
  if (!token) return
  setTimeout(() => {
    const row = db.prepare('SELECT id FROM ledger WHERE id=?').get(ledgerId)
    if (!row) return // transaction rolled back: nothing really happened
    const key = `pet:${delta > 0 ? 'earn' : 'spend'}:${userId}:${ledgerId}`
    void hubPost(delta > 0 ? '/api/sdk/earn' : '/api/sdk/spend', token, {
      amount: Math.abs(delta),
      reason: `pet:${reason}`,
      idempotencyKey: key,
    })
  }, 0)
}

/**
 * Pull the G balance from the hub and reconcile the local mirror. Returns the
 * hub balance, or null when standalone / hub unreachable (local value stands).
 */
export async function syncHubBalance(userId: number): Promise<number | null> {
  if (!HUB_URL) return null
  const token = launchTokenOf(userId)
  if (!token) return null
  try {
    const res = await fetch(`${HUB_URL}/api/sdk/balance`, {
      headers: { 'x-gg-launch': token },
      signal: AbortSignal.timeout(HUB_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as { ok?: boolean; coins?: number } | null
    if (!json?.ok || typeof json.coins !== 'number') return null
    db.prepare('UPDATE users SET stones=? WHERE id=?').run(json.coins, userId)
    return json.coins
  } catch {
    return null
  }
}

// ─── Друзья из хаба (§экосистема) ───────────────────────────────────────────
// Друзей заводят один раз в хабе, а зовут из любой игры. Хаб отдаёт список и
// сам рассылает приглашения на языке получателя, поэтому игре не нужны ни свой
// граф друзей, ни свой бот. Ходим через сервер: токен запуска лежит здесь, а на
// хабе нет CORS для браузера.

export interface HubPerson { id: number; name: string; color: string; face: string }

async function hubCall(path: string, token: string, body?: unknown): Promise<any | null> {
  try {
    const res = await fetch(`${HUB_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', 'x-gg-launch': token },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => null)
    return res.ok ? json : null
  } catch {
    return null
  }
}

/** Друзья игрока в хабе. Пустой список - запуск не из хаба или хаб недоступен. */
export async function hubFriends(userId: number): Promise<HubPerson[]> {
  const token = launchTokenOf(userId)
  if (!token) return []
  const r = (await hubCall('/api/sdk/friends', token)) as { ok: boolean; friends: HubPerson[] } | null
  return r?.ok ? r.friends : []
}

/** Позвать друзей из хаба в эту игру. Возвращает, скольким сообщение ушло. */
export async function inviteHubFriends(userId: number, friendIds: number[], note?: string): Promise<number> {
  const token = launchTokenOf(userId)
  if (!token || friendIds.length === 0) return 0
  const r = (await hubCall('/api/sdk/invite', token, { friendIds, note })) as { ok: boolean; sent: number } | null
  return r?.ok ? r.sent : 0
}
