// Инсайты: mood calendar + goal stats + reflection valence over a chosen range.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { Chip, ChipRow, Loading, MOOD_EMOJI, Sub } from '../ui'
import type { InsightsDto } from '../types'

const RANGES: { id: string; ru: string }[] = [
 { id: '2w', ru: '2 недели' }, { id: '1m', ru: 'Месяц' }, { id: '3m', ru: '3 месяца' }, { id: 'all', ru: 'Всё время' },
]
const KIND_RU: Record<string, string> = {
 breathing: 'Дыхание', meditation: 'Медитации', focus: 'Фокус', movement: 'Движение',
 grounding: 'Заземление', emotion: 'Эмоции', kindness: 'Добрые дела', affirmation: 'Тёплые слова',
 quiz: 'Викторины', reflection: 'Размышления',
}

export function Insights({ onBack }: { onBack(): void }) {
 const [range, setRange] = useState('2w')
 const [data, setData] = useState<InsightsDto | null>(null)

 useEffect(() => {
 setData(null)
 req<InsightsDto>(`/activities/insights?range=${range}`).then(setData).catch(() => {})
 }, [range])

 const moodDays = data ? Object.entries(data.moodByDay).sort(([a], [b]) => a.localeCompare(b)) : []

 return (
 <Sub title="Инсайты" onBack={onBack}>
 <ChipRow>
 {RANGES.map(r => <Chip key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>{r.ru}</Chip>)}
 </ChipRow>

 {!data ? <Loading /> : (
 <>
 <div className="card">
 <h2 style={{ marginBottom: 10 }}>Настроение</h2>
 {moodDays.length === 0 ? (
 <p style={{ color: 'var(--ink-soft)', margin: 0 }}>Отмечай настроение на главном экране, здесь появится твоя картинка.</p>
 ) : (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
 {moodDays.map(([day, v]) => (
 <div key={day} title={day} style={{ width: 30, textAlign: 'center', fontSize: 20 }}>{MOOD_EMOJI[v - 1] ?? '·'}</div>
 ))}
 </div>
 )}
 </div>

 <div className="card">
 <h2 style={{ marginBottom: 10 }}>Цели</h2>
 <p style={{ margin: '0 0 8px', fontWeight: 800 }}>Всего выполнено: {data.goals.total}</p>
 {data.goals.top.length > 0 && (
 <>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 800, margin: '6px 0' }}>Чаще всего</div>
 {data.goals.top.map((g, i) => (
 <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
 <span>{g.emoji}</span><span style={{ flex: 1 }}>{g.title}</span><b>{g.n}</b>
 </div>
 ))}
 </>
 )}
 {data.goals.missed.length > 0 && (
 <>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 800, margin: '10px 0 6px' }}>Просятся вернуться</div>
 {data.goals.missed.map((g, i) => (
 <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
 <span>{g.emoji}</span><span style={{ flex: 1 }}>{g.title}</span><span style={{ color: 'var(--ink-soft)' }}>−{g.missedDays} дн.</span>
 </div>
 ))}
 </>
 )}
 {data.goals.total === 0 && data.goals.missed.length === 0 && <p style={{ color: 'var(--ink-soft)', margin: 0 }}>Пока пусто, но всё впереди.</p>}
 </div>

 <div className="card">
 <h2 style={{ marginBottom: 10 }}>Размышления</h2>
 <p style={{ margin: 0 }}>Записей: <b>{data.reflections.count}</b></p>
 {data.reflections.count > 0 && (
 <p style={{ margin: '6px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>
 ☀️ тепло: {data.reflections.positive} · 🌧 тяжело: {data.reflections.negative}
 </p>
 )}
 </div>

 {data.activities.length > 0 && (
 <div className="card">
 <h2 style={{ marginBottom: 10 }}>Активности</h2>
 {data.activities.map((a, i) => (
 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
 <span>{KIND_RU[a.kind] ?? a.kind}</span><b>{a.n}</b>
 </div>
 ))}
 </div>
 )}
 </>
 )}
 </Sub>
 )
}
