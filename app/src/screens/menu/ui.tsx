// Shared bits for the menu module: sub-screen frame, rows, toggles, reward toast, content cache.
import { useEffect, useState, type ReactNode } from 'react'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { ContentDto, Reward } from './types'

export function Sub({ title, onBack, children }: { title: string; onBack(): void; children: ReactNode }) {
  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 8px' }}>
        <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>←</button>
        <h1 style={{ flex: 1 }}>{title}</h1>
      </header>
      <div className="scroll">{children}</div>
    </>
  )
}

export function Row({ emoji, title, sub, onClick, right }: {
  emoji: string; title: string; sub?: string; onClick?(): void; right?: ReactNode
}) {
  return (
    <button
      className="goal-row"
      style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}
      onClick={onClick}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ flex: 1 }}>
        <span style={{ fontWeight: 800, display: 'block', color: 'var(--ink)' }}>{title}</span>
        {sub && <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{sub}</span>}
      </span>
      {right ?? <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>›</span>}
    </button>
  )
}

export function Toggle({ value, onChange, label, sub }: { value: boolean; onChange(v: boolean): void; label: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{sub}</div>}
      </div>
      <button
        onClick={() => { haptic('tap'); onChange(!value) }}
        style={{
          width: 52, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: value ? 'var(--green)' : 'var(--card-shade)', position: 'relative', transition: 'background 0.15s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 25 : 3, width: 24, height: 24,
          borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

export function Chip({ active, locked, onClick, children }: { active?: boolean; locked?: boolean; onClick?(): void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none', borderRadius: 999, padding: '8px 14px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
        background: active ? 'var(--accent)' : 'var(--card)',
        color: active ? '#fff' : 'var(--brown)',
        boxShadow: active ? '0 3px 0 var(--accent-deep)' : 'var(--shadow-lip)',
        opacity: locked ? 0.55 : 1,
      }}
    >{children}{locked ? ' 🔒' : ''}</button>
  )
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0 10px', flexWrap: 'wrap' }}>{children}</div>
}

// Toast a reward + refresh global state (stones/energy changed server-side).
export function applyReward(r: Reward | undefined, fallback = 'Готово! 💛') {
  haptic('success')
  const bits: string[] = []
  if (r?.energy) bits.push(`+${r.energy}⚡`)
  if (r?.stones) bits.push(`+${r.stones}🦴`)
  if (r?.walkMinutesReduced) bits.push(`прогулка −${r.walkMinutesReduced} мин`)
  useStore.getState().showToast(bits.join('  ') || fallback)
  void useStore.getState().refresh()
}

// ===== activities content (one fetch per session) =====
let contentCache: ContentDto | null = null
export function invalidateContent() { contentCache = null }
export function useContent(): ContentDto | null {
  const [c, setC] = useState<ContentDto | null>(contentCache)
  useEffect(() => {
    if (contentCache) { setC(contentCache); return }
    req<ContentDto>('/activities/content')
      .then(d => { contentCache = d; setC(d) })
      .catch(() => {})
  }, [])
  return c
}

export function Loading() {
  return <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontWeight: 800 }}>Загружаю…</p>
}

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export const fmtDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

export function shiftDay(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const VALENCE_EMOJI: Record<string, string> = { '-1': '🌧', '0': '😐', '1': '☀️' }
export const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']
