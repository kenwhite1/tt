// First-party analytics: best-effort funnel + error events to /api/events.
// Never throws, never blocks; silently drops if offline / unauthenticated.
import { req } from './api'

export function track(name: string, props?: Record<string, unknown>): void {
  void req('/events', { name, props }).catch(() => { /* analytics is best-effort */ })
}

let inited = false
export function initAnalytics(): void {
  if (inited) return
  inited = true
  window.addEventListener('error', ev => {
    track('client_error', { msg: String(ev.message ?? '').slice(0, 280), src: String(ev.filename ?? '').slice(-60), line: ev.lineno ?? 0 })
  })
  window.addEventListener('unhandledrejection', ev => {
    track('client_error', { kind: 'promise', msg: String((ev as PromiseRejectionEvent).reason ?? 'rejection').slice(0, 280) })
  })
}
