// Идеи целей: browse goal suggestions by category, one-tap add via the core /goals endpoint.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { useStore } from '../../../store'
import { haptic } from '../../../telegram'
import { Chip, ChipRow, Loading, Sub } from '../ui'
import type { GoalIdeasDto } from '../types'

export function GoalIdeas({ onBack }: { onBack(): void }) {
  const [data, setData] = useState<GoalIdeasDto | null>(null)
  const [cat, setCat] = useState<string>('')
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    req<GoalIdeasDto>('/activities/goal-ideas')
      .then(d => { setData(d); setCat(d.categories[0]?.id ?? '') })
      .catch(() => {})
  }, [])

  async function add(g: { id: string; ru: string; emoji: string }) {
    if (added.has(g.id)) return
    haptic('success')
    setAdded(s => new Set(s).add(g.id))
    try {
      await req('/goals', { title: g.ru, emoji: g.emoji })
      useStore.getState().showToast('Цель добавлена 💛')
      void useStore.getState().refresh()
    } catch {
      setAdded(s => { const n = new Set(s); n.delete(g.id); return n })
      useStore.getState().showToast('Не получилось добавить')
    }
  }

  if (!data) return <Sub title="Идеи целей" onBack={onBack}><Loading /></Sub>
  const goals = data.goals.filter(g => g.category === cat)

  return (
    <Sub title="Идеи целей" onBack={onBack}>
      <p style={{ color: 'var(--ink-soft)', margin: '0 4px 8px' }}>Не знаешь, с чего начать? Бери готовую — одним касанием.</p>
      <ChipRow>
        {data.categories.map(c => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.ru}</Chip>)}
      </ChipRow>
      {goals.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Здесь пока пусто.</p>}
      {goals.map(g => {
        const done = added.has(g.id)
        return (
          <div key={g.id} className="goal-row">
            <span style={{ fontSize: 24 }}>{g.emoji}</span>
            <span style={{ flex: 1, fontWeight: 800 }}>{g.ru}</span>
            <button
              className={done ? 'btn ghost' : 'btn'} disabled={done}
              style={{ padding: '8px 14px', fontSize: 14 }}
              onClick={() => void add(g)}
            >{done ? '✓ В целях' : '+ Добавить'}</button>
          </div>
        )
      })}
    </Sub>
  )
}
