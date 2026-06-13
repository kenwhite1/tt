// История: day picker (← →) + that day's goals, moods, reflections, activities, walk.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { Loading, MOOD_EMOJI, Sub, VALENCE_EMOJI, fmtDay, fmtTime, shiftDay } from '../ui'
import type { HistoryDto } from '../types'

const KIND_RU: Record<string, string> = {
  breathing: '🫧 Дыхание', meditation: '🧘 Медитация', focus: '🎯 Фокус', movement: '🤸 Движение',
  grounding: '🌿 Заземление', emotion: '💭 Эмоция', kindness: '🤝 Доброе дело', affirmation: '💛 Тёплые слова',
  quiz: '📋 Викторина', reflection: '📝 Размышление',
}

export function History({ onBack }: { onBack(): void }) {
  const [day, setDay] = useState<string | null>(null)
  const [today, setToday] = useState<string | null>(null)
  const [data, setData] = useState<HistoryDto | null>(null)

  useEffect(() => {
    const q = day ? `?day=${day}` : ''
    req<HistoryDto>(`/activities/history${q}`).then(d => {
      setData(d)
      if (!day) { setDay(d.day); setToday(d.day) } // first load with no param returns today
    }).catch(() => {})
  }, [day])

  const cur = day
  const isToday = !!today && cur === today
  const empty = data && data.completions.length === 0 && data.moods.length === 0 && data.reflections.length === 0 && data.activities.length === 0 && !data.walk

  return (
    <Sub title="История" onBack={onBack}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={() => cur && setDay(shiftDay(cur, -1))}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 800 }}>{cur ? fmtDay(cur) : '…'}</div>
        <button className="btn ghost" style={{ padding: '8px 14px' }} disabled={isToday} onClick={() => cur && !isToday && setDay(shiftDay(cur, 1))}>→</button>
      </div>

      {!data ? <Loading /> : empty ? (
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>В этот день записей нет. Это тоже нормально 💛</p>
      ) : (
        <>
          {data.moods.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 8 }}>Настроение</h2>
              {data.moods.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
                  <span style={{ fontSize: 22 }}>{MOOD_EMOJI[m.value - 1]}</span>
                  <span style={{ flex: 1, color: 'var(--ink-soft)', fontSize: 14 }}>{m.note ?? ''}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{fmtTime(m.ts)}</span>
                </div>
              ))}
            </div>
          )}

          {data.completions.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 8 }}>Цели</h2>
              {data.completions.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
                  <span>{g.emoji}</span><span style={{ flex: 1 }}>{g.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{fmtTime(g.ts)}</span>
                </div>
              ))}
            </div>
          )}

          {data.reflections.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 8 }}>Размышления</h2>
              {data.reflections.map(r => (
                <div key={r.id} style={{ padding: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b>{r.title}</b><span>{r.valence !== null ? VALENCE_EMOJI[String(r.valence)] : ''}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-soft)', whiteSpace: 'pre-line' }}>{r.snippet}</div>
                </div>
              ))}
            </div>
          )}

          {data.activities.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 8 }}>Активности</h2>
              {data.activities.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
                  <span style={{ flex: 1 }}>{KIND_RU[a.kind] ?? a.kind}</span>
                  {a.energy > 0 && <span style={{ color: 'var(--ink-soft)' }}>+{a.energy}⚡</span>}
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{fmtTime(a.ts)}</span>
                </div>
              ))}
            </div>
          )}

          {data.walk && (
            <div className="card">
              <h2 style={{ marginBottom: 6 }}>Прогулка</h2>
              <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{data.walk.completed ? '🐾 Прогулка состоялась' : '🐾 Прогулка началась'} в {fmtTime(data.walk.started_ts)}</p>
            </div>
          )}
        </>
      )}
    </Sub>
  )
}
