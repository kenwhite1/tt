// Reflection editor: prompted (step-by-step) or free-form journal, with valence picker.
import { useState } from 'react'
import { req } from '../../api'
import { haptic } from '../../telegram'
import { applyReward } from './ui'
import type { PromptFull, Reward } from './types'

const VALENCES = [
 { v: -1, emoji: '🌧', ru: 'Тяжело' },
 { v: 0, emoji: '😐', ru: 'Так себе' },
 { v: 1, emoji: '☀️', ru: 'Тепло' },
]

export function ReflectionEditor({ prompt, onDone }: { prompt: PromptFull | null; onDone(): void }) {
 const steps = prompt?.steps ?? []
 const [idx, setIdx] = useState(0)
 const [answers, setAnswers] = useState<string[]>(steps.map(() => ''))
 const [freeText, setFreeText] = useState('')
 const [valence, setValence] = useState<number | null>(null)
 const [phase, setPhase] = useState<'write' | 'valence'>('write')
 const [busy, setBusy] = useState(false)

 const canNext = prompt ? answers[idx]?.trim().length > 0 : freeText.trim().length > 0

 async function save() {
 if (busy) return
 setBusy(true)
 const text = prompt
 ? steps.map((s, i) => `${s}\n- ${answers[i].trim()}`).join('\n\n')
 : freeText.trim()
 try {
 const r = await req<{ reward: Reward }>('/activities/reflect', {
 promptId: prompt?.id, text, valence: valence ?? undefined,
 })
 applyReward(r.reward, 'Записано 💛')
 onDone()
 } catch {
 setBusy(false)
 }
 }

 if (phase === 'valence') {
 return (
 <div className="card" style={{ textAlign: 'center' }}>
 <h2 style={{ marginBottom: 6 }}>Какое чувство осталось после записи?</h2>
 <div style={{ display: 'flex', justifyContent: 'space-around', margin: '14px 0' }}>
 {VALENCES.map(o => (
 <button
 key={o.v}
 onClick={() => { haptic('tap'); setValence(o.v) }}
 style={{
 background: valence === o.v ? 'var(--gold)' : 'var(--card-shade)',
 border: 'none', borderRadius: 16, padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit',
 }}
 >
 <div style={{ fontSize: 30 }}>{o.emoji}</div>
 <div style={{ fontWeight: 800, fontSize: 13 }}>{o.ru}</div>
 </button>
 ))}
 </div>
 <button className="btn" disabled={busy} onClick={() => void save()}>Сохранить</button>
 <div style={{ marginTop: 8 }}>
 <button className="btn ghost" style={{ padding: '6px 14px', fontSize: 14 }} disabled={busy} onClick={() => void save()}>
 Пропустить и сохранить
 </button>
 </div>
 </div>
 )
 }

 return (
 <>
 <div className="card">
 <h2>{prompt ? prompt.title : 'Свободная запись'}</h2>
 <p style={{ color: 'var(--ink-soft)', margin: '6px 0 0' }}>
 {prompt ? prompt.intro : 'Пиши о чём угодно, я просто рядом и слушаю. Чем больше напишешь, тем больше энергии (4-8⚡).'}
 </p>
 {prompt && <p style={{ margin: '8px 0 0', fontWeight: 800 }}>⚡ {prompt.energy}</p>}
 </div>

 {prompt ? (
 <div className="card">
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 800, marginBottom: 6 }}>
 Шаг {idx + 1} из {steps.length}
 </div>
 <p style={{ margin: '0 0 10px', fontWeight: 800 }}>{steps[idx]}</p>
 <textarea
 value={answers[idx]}
 onChange={e => setAnswers(a => a.map((x, i) => (i === idx ? e.target.value : x)))}
 placeholder="Напиши пару строк…"
 style={{
 width: '100%', minHeight: 110, border: '2px solid var(--gold)', borderRadius: 12,
 padding: 10, fontSize: 16, fontFamily: 'inherit', resize: 'vertical', background: '#fff', color: 'var(--ink)',
 }}
 />
 <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
 {idx > 0 && <button className="btn ghost" onClick={() => setIdx(i => i - 1)}>Назад</button>}
 <button
 className="btn" style={{ flex: 1 }} disabled={!canNext}
 onClick={() => { haptic('tap'); idx < steps.length - 1 ? setIdx(i => i + 1) : setPhase('valence') }}
 >
 {idx < steps.length - 1 ? 'Дальше' : 'Готово'}
 </button>
 </div>
 </div>
 ) : (
 <div className="card">
 <textarea
 autoFocus
 value={freeText}
 onChange={e => setFreeText(e.target.value)}
 placeholder="Сегодня я…"
 style={{
 width: '100%', minHeight: 180, border: '2px solid var(--gold)', borderRadius: 12,
 padding: 10, fontSize: 16, fontFamily: 'inherit', resize: 'vertical', background: '#fff', color: 'var(--ink)',
 }}
 />
 <button className="btn" style={{ width: '100%', marginTop: 10 }} disabled={!canNext} onClick={() => setPhase('valence')}>
 Готово
 </button>
 </div>
 )}
 </>
 )
}
