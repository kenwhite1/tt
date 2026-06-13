// «Тёплый лучик» picker, a grid of vibes. Plus-only vibes show a 🔒 for free users
// (the server still bypasses the gate while the paywall is dormant, but we surface intent).
import type { Vibe } from './api'

export function VibePicker({ vibes, plus, onPick, title = 'Пошли тёплый лучик' }:
 { vibes: Vibe[]; plus: boolean; onPick: (v: Vibe) => void; title?: string }) {
 return (
 <>
 <h2 style={{ textAlign: 'center', marginBottom: 4 }}>{title}</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px' }}>
 Тёплый лучик согреет друга, а тебе за первый за день: +{2}🦴
 </p>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
 {vibes.map(v => {
 const locked = v.plus && !plus
 return (
 <button
 key={v.id}
 onClick={() => onPick(v)}
 style={{
 position: 'relative', border: 'none', cursor: 'pointer',
 background: v.color, borderRadius: 18, padding: '12px 6px',
 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
 boxShadow: 'var(--shadow-lip)', opacity: locked ? 0.78 : 1,
 }}
 >
 <span style={{ fontSize: 28 }}>{v.emoji}</span>
 <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brown-deep)', textAlign: 'center', lineHeight: 1.1 }}>{v.ru}</span>
 {locked && (
 <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 13 }}>🔒</span>
 )}
 </button>
 )
 })}
 </div>
 </>
 )
}
