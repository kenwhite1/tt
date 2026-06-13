import { useState } from 'react'
import { haptic } from '../../telegram'
import type { DailyQuestDto } from './types'

const TYPE_EMOJI: Record<string, string> = {
 pat_pet: '🐶', complete_goal: '✅', walk: '🐾', affirmation: '🌞',
 gratitude_reflection: '🌼', name_emotion: '💬', breathing: '🌬️',
 change_outfit: '👕', change_interior: '🛋️', send_vibe: '💛',
 answer_friends: '❓', log_mood: '🙂',
}

interface Props {
 daily: DailyQuestDto[]
 onClaim(id: string): void
 onDone(id: string): void
 onAnswer(answer: number): void
}

export function DailyQuests({ daily, onClaim, onDone, onAnswer }: Props) {
 const [open, setOpen] = useState<string | null>(null)
 const [affTaps, setAffTaps] = useState(0)

 return (
 <>
 <h2 style={{ margin: '6px 4px 10px' }}>Ежедневные задания</h2>
 {daily.map(quest => {
 const expanded = open === quest.id
 return (
 <div key={quest.id} className="card" style={{ padding: '12px 14px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <div
 className={`goal-check ${quest.done ? 'done' : ''}`}
 style={{ cursor: 'default' }}
 >
 {quest.done ? '✓' : TYPE_EMOJI[quest.type] ?? '⭐'}
 </div>
 <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{quest.ru}</div>
 {quest.claimed ? (
 <span style={{ fontWeight: 800, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>✓ {quest.reward} 🦴</span>
 ) : quest.done ? (
 <button className="btn accent" style={{ padding: '8px 14px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => onClaim(quest.id)}>
 Забрать {quest.reward} 🦴
 </button>
 ) : quest.type === 'answer_friends' || quest.type === 'affirmation' || quest.manual ? (
 <button
 className="btn ghost"
 style={{ padding: '8px 12px', fontSize: 14, whiteSpace: 'nowrap' }}
 onClick={() => { haptic('tap'); setAffTaps(0); setOpen(expanded ? null : quest.id) }}
 >
 {expanded ? 'Свернуть' : 'Открыть'}
 </button>
 ) : (
 <span style={{ color: 'var(--ink-soft)', fontSize: 13, whiteSpace: 'nowrap' }}>+{quest.reward} 🦴</span>
 )}
 </div>

 {expanded && quest.type === 'answer_friends' && quest.question && (
 <div style={{ marginTop: 12 }}>
 <div style={{ fontWeight: 800, marginBottom: 8 }}>{quest.question.text}</div>
 {quest.question.options.map((opt, i) => (
 <button
 key={i}
 className="btn ghost"
 style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8, fontSize: 15 }}
 onClick={() => { haptic('tap'); onAnswer(i); setOpen(null) }}
 >
 {opt}
 </button>
 ))}
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Друзья увидят, что ты тоже ответил(а) на вопрос дня 💛</div>
 </div>
 )}

 {expanded && quest.type === 'affirmation' && quest.affirmation && (
 <div style={{ marginTop: 12, textAlign: 'center' }}>
 <div style={{ fontWeight: 800, fontSize: 17, margin: '4px 0 10px' }}>«{quest.affirmation}»</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
 Произнеси вслух или про себя, и нажми после каждого раза
 </div>
 <button
 className="btn"
 onClick={() => {
 haptic('tap')
 const n = affTaps + 1
 setAffTaps(n)
 if (n >= 3) { onDone(quest.id); setOpen(null) }
 }}
 >
 Повторяю 🌞 {affTaps} / 3
 </button>
 </div>
 )}

 {expanded && quest.manual && quest.type !== 'affirmation' && (
 <div style={{ marginTop: 12, textAlign: 'center' }}>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
 {quest.type === 'change_outfit'
 ? 'Загляни в Сумку → Одежда, переодень щенка, а потом вернись сюда.'
 : 'Загляни в Сумку → Мебель, поменяй что-нибудь в домике, а потом вернись сюда.'}
 </div>
 <button className="btn" onClick={() => { onDone(quest.id); setOpen(null) }}>
 Отметить выполненным
 </button>
 </div>
 )}
 </div>
 )
 })}
 </>
 )
}
