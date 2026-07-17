// Vendored «game is game» hub SDK (logic-exact from GG/shared/sdk.ts).
// The game reports WHAT happened; only the hub decides the G reward. A
// compromised game can at most lie about the outcome (limited, detectable),
// it can never mint currency. No launch token / hub url -> graceful no-op.
import { getStartParam } from './telegram'

export type MatchOutcome = 'win' | 'loss' | 'draw' | 'finish'
export type MatchMode = 'multi' | 'solo' | 'friends'

export interface MatchReport {
  idempotencyKey: string
  result: MatchOutcome
  placement?: number
  players?: number
  humanPlayers?: number
  score?: number
  durationSec?: number
  mode?: MatchMode
  stats?: Record<string, number | boolean | string>
  opponents?: number[]
}

export interface ReportResponse {
  ok: boolean
  rewarded: boolean
  coins: number
  error?: string
}

// One call at match/session end. The hub dedups by idempotencyKey, so a retry
// after a network failure is safe.
export async function ggReport(
  hubUrl: string,
  launchToken: string,
  report: MatchReport,
): Promise<ReportResponse> {
  try {
    const res = await fetch(`${hubUrl.replace(/\/$/, '')}/api/sdk/result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-gg-launch': launchToken },
      body: JSON.stringify(report),
    })
    const json = (await res.json().catch(() => ({}))) as ReportResponse
    return res.ok ? json : { ok: false, rewarded: false, coins: 0, error: json.error ?? 'request_failed' }
  } catch {
    return { ok: false, rewarded: false, coins: 0, error: 'network' }
  }
}

// Unwrap the launch token from a Telegram start_param (base64url of a JWT), or
// null when start_param is a plain deep-link (ref code, coop_...) rather than a
// launch token.
export function decodeLaunchParam(startParam: string | undefined): string | null {
  if (!startParam) return null
  try {
    const token = atob(startParam.replace(/-/g, '+').replace(/_/g, '/'))
    return token.split('.').length === 3 ? token : null
  } catch {
    return null
  }
}

// Hub language hint from the launch token: 'ru' | 'en' | null. Reads the `lng`
// claim of the JWT payload without verifying the signature (it is only a UI
// hint, not a right to any reward). null -> not launched from the hub.
export function launchLang(startParam: string | undefined): 'ru' | 'en' | null {
  const token = decodeLaunchParam(startParam)
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.lng === 'en' ? 'en' : payload.lng === 'ru' ? 'ru' : null
  } catch {
    return null
  }
}

// ─── Hub wiring for this game ───────────────────────────────────────────
const HUB_URL: string =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_HUB_URL ||
  'https://game-is-game-hub-production.up.railway.app'

// The current launch token, or null when opened outside the hub.
export function launchToken(): string | null {
  return decodeLaunchParam(getStartParam() ?? undefined)
}

// Report one self-care session to the hub. Дружок is a solo self-care pet, so a
// "session" is a game-day in which the user did something for themselves. The
// idempotencyKey is stable per player+game-day, so the hub credits G at most
// once per day no matter how many goals are completed - honest and dedup-safe.
// No launch token -> no-op (game opened outside the hub).
export async function reportSession(report: {
  userId: number
  day: string
  score: number
  stats?: Record<string, number | boolean | string>
}): Promise<void> {
  const token = launchToken()
  if (!token) return // opened outside the hub: nothing to report
  await ggReport(HUB_URL, token, {
    idempotencyKey: `druzhok:${report.userId}:${report.day}`,
    result: 'finish',
    mode: 'solo',
    players: 1,
    humanPlayers: 1,
    score: report.score,
    stats: report.stats,
  })
}
