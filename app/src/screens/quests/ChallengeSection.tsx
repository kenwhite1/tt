import { useState } from 'react'
import { C } from '@shared/constants'
import { haptic } from '../../telegram'
import type { ChallengeDto } from './types'

interface Props {
 challenges: ChallengeDto[]
 onJoin(id: string): void
 onCheck(id: string, index: number): void
}

export function ChallengeSection({ challenges, onJoin, onCheck }: Props) {
 const [open, setOpen] = useState<string | null>(null)
 if (challenges.length === 0) return null

 return (
 <>
 <h2 style={{ margin: '6px 4px 10px' }}>Испытание месяца</h2>
 {challenges.map(ch => {
 const expanded = open === ch.id
 const doneCount = ch.doneIdx.length
 return (
 <div key={ch.id} className="card" style={{ background: ch.completed ? 'linear-gradient(135deg, #fdf3d0, #f8e6b0)' : undefined }}>
 <div
 style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
 onClick={() => { haptic('tap'); setOpen(expanded ? null : ch.id) }}
 >
 <span style={{ fontSize: 30 }} className={ch.completed ? 'badge-earned' : undefined}>{ch.badge}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{ch.name}</div>
 {ch.completed ? (
 <div style={{ fontSize: 13, color: 'var(--brown-deep)', fontWeight: 800 }}>Пройдено! Значок твой 🏅</div>
 ) : ch.joined ? (
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{doneCount} из {C.CHALLENGE_GOALS}</div>
 ) : (
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 {ch.joinable ? `${C.CHALLENGE_GOALS} маленьких дел за месяц` : `Присоединиться можно до ${C.CHALLENGE_JOIN_BY_DAY}-го числа, увидимся в следующем месяце 💛`}
 </div>
 )}
 </div>
 <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>{expanded ? '▾' : '▸'}</span>
 </div>

 {ch.joined && !ch.completed && (
 <div className="energy-track" style={{ height: 12, marginTop: 10 }}>
 <div className="energy-fill" style={{ width: `${(doneCount / C.CHALLENGE_GOALS) * 100}%` }} />
 </div>
 )}

 {expanded && (
 <div style={{ marginTop: 12 }}>
 <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--ink-soft)' }}>{ch.theme}</p>

 {!ch.joined && ch.joinable && (
 <button className="btn" style={{ width: '100%', marginBottom: 10 }} onClick={() => onJoin(ch.id)}>
 Присоединиться
 </button>
 )}

 {ch.joined && !ch.completed && ch.checkedToday && (
 <div style={{ fontSize: 13, color: 'var(--green-deep)', fontWeight: 800, marginBottom: 10 }}>
 Сегодня уже отмечено, продолжим завтра 💛
 </div>
 )}

 {ch.goals.map((g, i) => {
 const done = ch.doneIdx.includes(i)
 const canCheck = ch.joined && !ch.completed && !done && !ch.checkedToday
 return (
 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
 <button
 className={`goal-check ${done ? 'done' : ''}`}
 style={{ width: 30, height: 30, fontSize: 15, opacity: canCheck || done ? 1 : 0.5 }}
 disabled={!canCheck}
 onClick={() => onCheck(ch.id, i)}
 >
 {done ? '✓' : g.emoji}
 </button>
 <span
 style={{
 fontSize: 14, fontWeight: 700, flex: 1,
 textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1,
 }}
 >
 {g.ru}
 </span>
 </div>
 )
 })}

 {!ch.joined && (
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
 Одно дело в день, в любом порядке. Пройдёшь все {C.CHALLENGE_GOALS}, получишь значок и памятную табличку для домика.
 </div>
 )}
 </div>
 )}
 </div>
 )
 })}
 </>
 )
}
