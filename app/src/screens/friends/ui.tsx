// Shared bits for the Дворик: color mapping, friendship-level names, a bottom-sheet
// wrapper (copies the Home mood-sheet pattern), and a small puppy avatar.
import type { ReactNode } from 'react'
import { Puppy } from '../../art/Puppy'
import type { DyePart, PuppyState } from '../../art/Puppy'
import type { Stage } from '@shared/constants'
import { C } from '@shared/constants'

// box-color id → body hex (mirrors Onboarding palette); accepts a raw hex too.
const COLOR_HEX: Record<string, string> = {
 blue: '#9DC9E8', orange: '#F2B463', pink: '#F2A8C0',
 green: '#A8D3A0', purple: '#C0A8E0', gray: '#C9C5BD',
}
export function bodyHex(color: string | undefined): string | undefined {
 if (!color) return undefined
 if (color.startsWith('#')) return color
 return COLOR_HEX[color]
}

// Build a dyes object for <Puppy> from the friend's color id + JSON dyes string.
export function puppyDyes(color: string, dyesJson?: string): Partial<Record<DyePart, string>> | undefined {
 let parsed: Partial<Record<DyePart, string>> = {}
 if (dyesJson) {
 try { parsed = JSON.parse(dyesJson) as Partial<Record<DyePart, string>> } catch { /* ignore */ }
 }
 const body = bodyHex(color)
 const out = { ...(body ? { body } : {}), ...parsed }
 return Object.keys(out).length ? out : undefined
}

// Warm RU friendship-level names, one per FRIENDSHIP_PTS threshold (level 1..10).
export const FRIENDSHIP_NAMES = [
 'Приятели', 'Дружочки', 'Кореша', 'Лучшие друзья', 'Друзья навек',
 'Не разлей вода', 'Закадычные', 'Родственные души', 'Половинки', 'Навсегда вместе',
]
export function levelName(level: number): string {
 return FRIENDSHIP_NAMES[Math.min(FRIENDSHIP_NAMES.length, Math.max(1, level)) - 1]
}
// progress (0..1) toward the next level for the heart bar
export function levelProgress(pts: number, level: number): { ratio: number; next: number | null } {
 const idx = Math.min(level, C.FRIENDSHIP_PTS.length) - 1
 const cur = C.FRIENDSHIP_PTS[idx] ?? 0
 const next = C.FRIENDSHIP_PTS[idx + 1] ?? null
 if (next == null) return { ratio: 1, next: null }
 const span = next - cur
 return { ratio: Math.max(0, Math.min(1, (pts - cur) / span)), next }
}

export function timeAgo(ts: number): string {
 const diff = Date.now() - ts
 const m = Math.floor(diff / 60_000)
 if (m < 1) return 'только что'
 if (m < 60) return `${m} мин назад`
 const h = Math.floor(m / 60)
 if (h < 24) return `${h} ч назад`
 const d = Math.floor(h / 24)
 return `${d} дн назад`
}

export function PuppyMini({ stage, color, dyes, size = 70, state = 'idle' as PuppyState }:
 { stage: Stage; color: string; dyes?: string; size?: number; state?: PuppyState }) {
 return <Puppy size={size} stage={stage} dyes={puppyDyes(color, dyes)} state={state} />
}

// Bottom sheet, same shape as the Home mood sheet.
export function Sheet({ onClose, children, z = 50 }: { onClose: () => void; children: ReactNode; z?: number }) {
 return (
 <div
 style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: z, display: 'flex', alignItems: 'flex-end' }}
 onClick={onClose}
 >
 <div
 className="card"
 style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, maxHeight: '86vh', overflowY: 'auto', paddingBottom: 'calc(20px + var(--safe-bottom))' }}
 onClick={e => e.stopPropagation()}
 >
 {children}
 </div>
 </div>
 )
}
