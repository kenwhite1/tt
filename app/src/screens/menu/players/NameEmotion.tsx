// Назови эмоцию: valence → subgroup → word. Logs an emotion activity on pick.
import { useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Loading, Sub, VALENCE_EMOJI, applyReward, useContent } from '../ui'
import type { EmotionValence, Reward } from '../types'

const VAL_EMOJI: Record<string, string> = { pleasant: '☀️', neutral: '😐', unpleasant: '🌧' }

export function NameEmotion({ onBack }: { onBack(): void }) {
 const content = useContent()
 const [valence, setValence] = useState<EmotionValence | null>(null)
 const [subIdx, setSubIdx] = useState<number | null>(null)
 const [chosen, setChosen] = useState<string | null>(null)
 const [busy, setBusy] = useState(false)

 if (!content) return <Sub title="Назови эмоцию" onBack={onBack}><Loading /></Sub>

 async function pickWord(word: string) {
 if (busy) return
 setBusy(true)
 setChosen(word)
 try {
 const r = await req<{ reward: Reward }>('/activities/log', { kind: 'emotion', refId: word.slice(0, 40) })
 applyReward(r.reward, `«${word}», я слышу тебя 💛`)
 } catch { /* keep the warm screen */ }
 setBusy(false)
 }

 // result card
 if (chosen) {
 return (
 <Sub title="Назови эмоцию" onBack={onBack}>
 <div className="card" style={{ textAlign: 'center', padding: '28px 18px' }}>
 <div style={{ fontSize: 48 }}>{valence ? VAL_EMOJI[valence.id] ?? '💛' : '💛'}</div>
 <h2 style={{ margin: '8px 0' }}>{chosen}</h2>
 <p style={{ color: 'var(--ink-soft)' }}>Назвать чувство, уже половина дела. Спасибо, что заглянул(а) внутрь.</p>
 <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
 <button className="btn ghost" onClick={() => { setChosen(null); setSubIdx(null) }}>Ещё раз</button>
 <button className="btn" onClick={onBack}>Готово</button>
 </div>
 </div>
 </Sub>
 )
 }

 // step 3: words
 if (valence && subIdx !== null) {
 const sub = valence.sub[subIdx]
 return (
 <Sub title={valence.ru} onBack={() => setSubIdx(null)}>
 <p style={{ color: 'var(--ink-soft)', margin: '0 4px 10px' }}>Что ближе всего?</p>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
 {sub.words.map(w => (
 <button
 key={w} disabled={busy}
 onClick={() => void pickWord(w)}
 style={{
 border: 'none', borderRadius: 999, padding: '10px 16px', fontWeight: 800, fontSize: 15,
 cursor: 'pointer', fontFamily: 'inherit', background: 'var(--card)', color: 'var(--brown)',
 boxShadow: 'var(--shadow-lip)',
 }}
 >{w}</button>
 ))}
 </div>
 </Sub>
 )
 }

 // step 2: subgroups (skip if a single null subgroup)
 if (valence) {
 const subs = valence.sub
 if (subs.length === 1) { setSubIdx(0); return null }
 return (
 <Sub title={valence.ru} onBack={() => setValence(null)}>
 <p style={{ color: 'var(--ink-soft)', margin: '0 4px 10px' }}>Куда это ближе?</p>
 {subs.map((s, i) => (
 <button
 key={s.id ?? i} className="goal-row"
 style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}
 onClick={() => { haptic('tap'); setSubIdx(i) }}
 >
 <span style={{ flex: 1, fontWeight: 800 }}>{s.ru}</span>
 <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>›</span>
 </button>
 ))}
 </Sub>
 )
 }

 // step 1: valence
 return (
 <Sub title="Назови эмоцию" onBack={onBack}>
 <p style={{ color: 'var(--ink-soft)', margin: '0 4px 12px' }}>Как тебе сейчас в целом?</p>
 {content.emotions.map(v => (
 <button
 key={v.id} className="goal-row"
 style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}
 onClick={() => { haptic('tap'); setValence(v) }}
 >
 <span style={{ fontSize: 26 }}>{VAL_EMOJI[v.id] ?? VALENCE_EMOJI[String(0)]}</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{v.ru}</span>
 <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>›</span>
 </button>
 ))}
 </Sub>
 )
}
