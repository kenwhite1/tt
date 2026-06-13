// Движение: pick a set, then a per-move 30s countdown player. Logs minutes by set length.
import { useEffect, useRef, useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Loading, Sub, applyReward, useContent } from '../ui'
import type { MovementSet, Reward } from '../types'

const KIND_RU: Record<string, string> = { stretch: 'Растяжка', yoga: 'Йога', exercise: 'Зарядка' }
const KIND_EMOJI: Record<string, string> = { stretch: '🧎', yoga: '🧘', exercise: '🤸' }

function Player({ set, onDone }: { set: MovementSet; onDone(): void }) {
 const [idx, setIdx] = useState(0)
 const move = set.moves[idx]
 const [left, setLeft] = useState(move?.seconds ?? 30)
 const [done, setDone] = useState(false)
 const totalSec = set.moves.reduce((s, m) => s + m.seconds, 0)

 useEffect(() => { setLeft(set.moves[idx]?.seconds ?? 30) }, [idx, set])

 useEffect(() => {
 if (done) return
 const t = setInterval(() => {
 setLeft(l => {
 if (l <= 1) {
 if (idx < set.moves.length - 1) { haptic('tap'); setIdx(i => i + 1); return set.moves[idx + 1].seconds }
 clearInterval(t); finish(); return 0
 }
 return l - 1
 })
 }, 1000)
 return () => clearInterval(t)
 }, [idx, done]) // eslint-disable-line react-hooks/exhaustive-deps

 async function finish() {
 if (done) return
 setDone(true)
 const minutes = Math.max(1, Math.round(totalSec / 60))
 try {
 const r = await req<{ reward: Reward }>('/activities/log', { kind: 'movement', refId: set.id, minutes })
 applyReward(r.reward, 'Размялись! 💛')
 } catch { /* let out anyway */ }
 onDone()
 }

 if (!move) return null
 const pct = ((move.seconds - left) / move.seconds) * 100

 return (
 <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
 <p style={{ fontWeight: 800, color: 'var(--ink-soft)', marginTop: 0 }}>Движение {idx + 1} из {set.moves.length}</p>
 <div style={{ fontSize: 56, margin: '8px 0' }}>{KIND_EMOJI[set.kind] ?? '🤸'}</div>
 <h2 style={{ marginBottom: 12 }}>{move.name}</h2>
 <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--brown-deep)' }}>{left}</div>
 <div className="energy-track" style={{ margin: '12px 8px' }}>
 <div className="energy-fill" style={{ width: `${pct}%` }} />
 </div>
 <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
 <button className="btn ghost" onClick={() => { if (idx < set.moves.length - 1) setIdx(i => i + 1); else void finish() }}>Дальше ›</button>
 <button className="btn ghost" onClick={() => void finish()}>Закончить</button>
 </div>
 </div>
 )
}

export function Movement({ onBack }: { onBack(): void }) {
 const content = useContent()
 const [set, setSet] = useState<MovementSet | null>(null)
 const kindsRef = useRef<string[]>([])

 if (!content) return <Sub title="Движение" onBack={onBack}><Loading /></Sub>
 const plus = content.plus

 if (set) {
 return (
 <Sub title={set.name} onBack={onBack}>
 <Player set={set} onDone={onBack} />
 </Sub>
 )
 }

 const kinds = [...new Set(content.movements.map(m => m.kind))]
 kindsRef.current = kinds

 return (
 <Sub title="Движение" onBack={onBack}>
 <p style={{ color: 'var(--ink-soft)', margin: '0 4px 10px' }}>Мягко подвигаться вместе с Дружком, 30 секунд на каждое движение.</p>
 {kinds.map(k => (
 <div key={k}>
 <h2 style={{ margin: '6px 4px 8px' }}>{KIND_EMOJI[k] ?? '🤸'} {KIND_RU[k] ?? k}</h2>
 {content.movements.filter(m => m.kind === k).map(m => {
 const locked = m.plus && !plus
 return (
 <button
 key={m.id} className="goal-row"
 style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, opacity: locked ? 0.6 : 1 }}
 onClick={() => { if (!locked) { haptic('tap'); setSet(m) } }}
 >
 <span style={{ flex: 1 }}>
 <span style={{ fontWeight: 800, display: 'block' }}>{m.name}{locked ? ' 🔒' : ''}</span>
 <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{m.moves.length} движений</span>
 </span>
 </button>
 )
 })}
 </div>
 ))}
 </Sub>
 )
}
