// Газеты: live weekly digest («Недельные чувства») + archived newsletters.
// Free tier: latest issue only; older archive shows a Plus lock → PlusScreen.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { Loading, MOOD_EMOJI, Sub, fmtDay } from '../ui'
import type { PapersDto } from '../types'

const trend = (now: number, prev: number) => now > prev ? '↑' : now < prev ? '↓' : '→'

export function Papers({ onBack, onPlus }: { onBack(): void; onPlus(): void }) {
 const [data, setData] = useState<PapersDto | null>(null)
 const [open, setOpen] = useState<{ title: string; body: string } | null>(null)
 useEffect(() => { req<PapersDto>('/activities/papers').then(setData).catch(() => {}) }, [])

 if (!data) return <Sub title="Газеты" onBack={onBack}><Loading /></Sub>

 if (open) {
 return (
 <Sub title={open.title} onBack={() => setOpen(null)}>
 <div className="card"><p style={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>{open.body}</p></div>
 </Sub>
 )
 }

 const st = data.live.stats
 const moods = Object.entries(st.moodByDay).sort(([a], [b]) => a.localeCompare(b))

 return (
 <Sub title="Газеты" onBack={onBack}>
 <div className="card" style={{ background: 'linear-gradient(135deg, #fbe3b2, #f8d77e)' }}>
 <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brown)' }}>📰 СВЕЖИЙ ВЫПУСК · {fmtDay(data.live.day)}</div>
 <h2 style={{ margin: '4px 0 10px' }}>{data.live.title}</h2>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
 {moods.length === 0
 ? <span style={{ color: 'var(--brown)', fontSize: 14 }}>На этой неделе ещё нет отметок настроения.</span>
 : moods.map(([d, v]) => <span key={d} style={{ fontSize: 22 }} title={d}>{MOOD_EMOJI[v - 1] ?? '·'}</span>)}
 </div>
 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 800, color: 'var(--brown-deep)' }}>
 <span>📅 отметок: {st.checkinsThisWeek} {trend(st.checkinsThisWeek, st.checkinsLastWeek)}</span>
 <span>✅ целей: {st.goalsThisWeek}</span>
 <span>📝 записей: {st.reflectionsThisWeek}</span>
 </div>
 </div>

 <h2 style={{ margin: '6px 4px 8px' }}>Архив</h2>
 {data.archive.length === 0 && <p style={{ color: 'var(--ink-soft)', textAlign: 'center' }}>Прошлые выпуски появятся здесь по понедельникам.</p>}
 {data.archive.map(p => (
 <button key={p.id} className="goal-row" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }} onClick={() => setOpen({ title: p.title, body: p.body })}>
 <span style={{ fontSize: 24 }}>💌</span>
 <span style={{ flex: 1 }}>
 <span style={{ fontWeight: 800, display: 'block' }}>{p.title}</span>
 <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{fmtDay(new Date(p.ts).toISOString().slice(0, 10))}</span>
 </span>
 </button>
 ))}

 {!data.plus && (
 <button className="card" style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'var(--card-shade)' }} onClick={onPlus}>
 <b>🔒 Весь архив и все 4 газеты в неделю</b>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Открой в Дружок Плюс, старые выпуски и больше рубрик.</div>
 </button>
 )}
 </Sub>
 )
}
