// Сферы заботы: per-area weekly progress, which days this week each area got attention.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { Loading, Sub } from '../ui'
import type { ScasDto } from '../types'

const WEEK_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function weekDates(monday: string): string[] {
 const base = new Date(`${monday}T12:00:00Z`)
 return Array.from({ length: 7 }, (_, i) => {
 const d = new Date(base)
 d.setUTCDate(d.getUTCDate() + i)
 return d.toISOString().slice(0, 10)
 })
}

export function Scas({ onBack }: { onBack(): void }) {
 const [data, setData] = useState<ScasDto | null>(null)
 useEffect(() => { req<ScasDto>('/activities/scas').then(setData).catch(() => {}) }, [])

 if (!data) return <Sub title="Сферы заботы" onBack={onBack}><Loading /></Sub>
 const dates = weekDates(data.monday)

 return (
 <Sub title="Сферы заботы" onBack={onBack}>
 <p style={{ color: 'var(--ink-soft)', margin: '0 4px 10px' }}>Из чего складывается твоя забота о себе на этой неделе.</p>
 {data.scas.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Привяжи цели к сферам заботы, чтобы видеть прогресс.</p>}
 {data.scas.map(s => {
 const hit = new Set(s.weekDays)
 return (
 <div key={s.id} className="card" style={{ padding: 14 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
 <span style={{ width: 36, height: 36, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.emoji}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{s.ru}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{s.goals} {s.goals === 1 ? 'цель' : 'целей'} · {s.weekDays.length} дн. на неделе</div>
 </div>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
 {dates.map((d, i) => {
 const on = hit.has(d)
 return (
 <div key={d} style={{ textAlign: 'center', flex: 1 }}>
 <div style={{
 width: 26, height: 26, borderRadius: '50%', margin: '0 auto',
 background: on ? s.color : 'var(--card-shade)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: on ? 'var(--brown-deep)' : 'var(--ink-soft)',
 }}>{on ? '✓' : ''}</div>
 <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{WEEK_RU[i]}</div>
 </div>
 )
 })}
 </div>
 </div>
 )
 })}
 </Sub>
 )
}
