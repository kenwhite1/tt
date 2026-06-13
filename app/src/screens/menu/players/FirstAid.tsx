// Аптечка: always-free crisis toolkit, grounding + calming breathing shortcuts, SOS
// reflections, and helplines as tel: links. Red-tinted, gentle, never gated.
import { useState } from 'react'
import { req } from '../../../api'
import { ReflectionEditor } from '../ReflectionEditor'
import { Loading, Sub, applyReward, useContent } from '../ui'
import type { GroundingEx, PromptFull, Reward } from '../types'

// Minimal inline grounding-step player (Аптечка stays self-contained).
function StepPlayer({ ex, kind, onBack }: { ex: { id: string; name: string; steps: string[] }; kind: 'grounding'; onBack(): void }) {
 const [idx, setIdx] = useState(0)
 const [busy, setBusy] = useState(false)
 const last = idx >= ex.steps.length - 1
 async function finish() {
 if (busy) return
 setBusy(true)
 try {
 const r = await req<{ reward: Reward }>('/activities/log', { kind, refId: ex.id })
 applyReward(r.reward, 'Ты справляешься 💛')
 } catch { /* let out */ }
 onBack()
 }
 return (
 <Sub title={ex.name} onBack={onBack}>
 <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
 <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 10 }}>Шаг {idx + 1} из {ex.steps.length}</div>
 <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, minHeight: 110 }}>{ex.steps[idx]}</p>
 {last
 ? <button className="btn" disabled={busy} onClick={() => void finish()}>Готово 💛</button>
 : <button className="btn" onClick={() => setIdx(i => i + 1)}>Дальше</button>}
 </div>
 </Sub>
 )
}

export function FirstAid({ onBack }: { onBack(): void }) {
 const content = useContent()
 const [ground, setGround] = useState<GroundingEx | null>(null)
 const [sos, setSos] = useState<PromptFull | null>(null)

 if (!content) return <Sub title="Аптечка" onBack={onBack}><Loading /></Sub>
 const fa = content.firstaid

 if (ground) {
 return <StepPlayer ex={ground} kind="grounding" onBack={() => setGround(null)} />
 }
 if (sos) {
 return (
 <Sub title={sos.title} onBack={() => setSos(null)}>
 <ReflectionEditor prompt={sos} onDone={() => setSos(null)} />
 </Sub>
 )
 }

 const groundEx = fa.grounding.map(id => content.grounding.find(g => g.id === id)).filter((g): g is GroundingEx => !!g)
 // breathing shortcuts: panic/anxiety calming patterns referenced by id
 const breathEx = fa.breathing.map(id => content.breathing.patterns.find(b => b.id === id)).filter((b): b is NonNullable<typeof b> => !!b)

 function tel(phone: string) { return phone.replace(/[^0-9+]/g, '') }

 return (
 <Sub title="Аптечка" onBack={onBack}>
 <div className="card" style={{ background: '#fdeceb' }}>
 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <span style={{ fontSize: 30 }}>⛑️</span>
 <div>
 <b>{fa.name}</b>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{fa.note}</div>
 </div>
 </div>
 </div>

 <h2 style={{ margin: '6px 4px 8px' }}>🌿 Заземлиться</h2>
 {groundEx.map(g => (
 <button key={g.id} className="goal-row" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }} onClick={() => setGround(g)}>
 <span style={{ fontSize: 22 }}>🌿</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{g.name}</span>
 <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>›</span>
 </button>
 ))}

 {breathEx.length > 0 && <h2 style={{ margin: '10px 4px 8px' }}>🫧 Продышаться</h2>}
 {breathEx.map(b => (
 <div key={b.id} className="goal-row">
 <span style={{ fontSize: 22 }}>🫧</span>
 <span style={{ flex: 1 }}>
 <span style={{ fontWeight: 800, display: 'block' }}>{b.name}</span>
 <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{b.phases.map(p => `${p.label} ${p.seconds}с`).join(' · ')}</span>
 </span>
 </div>
 ))}

 {fa.sosPrompts.length > 0 && <h2 style={{ margin: '10px 4px 8px' }}>📝 Выговориться</h2>}
 {fa.sosPrompts.map(p => (
 <button key={p.id} className="goal-row" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }} onClick={() => setSos(p)}>
 <span style={{ fontSize: 22 }}>📝</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{p.title}</span>
 <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>›</span>
 </button>
 ))}

 {fa.helplines.length > 0 && <h2 style={{ margin: '10px 4px 8px' }}>📞 Поговорить с человеком</h2>}
 {fa.helplines.map((h, i) => (
 <a
 key={i} className="goal-row" href={h.phone ? `tel:${tel(h.phone)}` : (h.url ?? '#')}
 target={h.phone ? undefined : '_blank'} rel="noreferrer"
 style={{ textDecoration: 'none', color: 'inherit' }}
 >
 <span style={{ fontSize: 22 }}>{h.phone ? '📞' : '🔗'}</span>
 <span style={{ flex: 1 }}>
 <span style={{ fontWeight: 800, display: 'block' }}>{h.ru_name}</span>
 <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{h.phone ?? h.url} · {h.hours}</span>
 </span>
 </a>
 ))}
 </Sub>
 )
}
