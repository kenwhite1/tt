// Заземление: pick an exercise, step through its steps one at a time, log on finish.
import { useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Loading, Sub, applyReward, useContent } from '../ui'
import type { GroundingEx, Reward } from '../types'

function Player({ ex, onDone }: { ex: GroundingEx; onDone(): void }) {
  const [idx, setIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const last = idx >= ex.steps.length - 1

  async function finish() {
    if (busy) return
    setBusy(true)
    try {
      const r = await req<{ reward: Reward }>('/activities/log', { kind: 'grounding', refId: ex.id })
      applyReward(r.reward, 'Ты здесь, ты в безопасности 💛')
    } catch { /* let out */ }
    onDone()
  }

  return (
    <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 10 }}>Шаг {idx + 1} из {ex.steps.length}</div>
      <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, minHeight: 120 }}>{ex.steps[idx]}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        {idx > 0 && <button className="btn ghost" onClick={() => setIdx(i => i - 1)}>Назад</button>}
        {last
          ? <button className="btn" disabled={busy} onClick={() => void finish()}>Готово 💛</button>
          : <button className="btn" onClick={() => { haptic('tap'); setIdx(i => i + 1) }}>Дальше</button>}
      </div>
    </div>
  )
}

export function Grounding({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [ex, setEx] = useState<GroundingEx | null>(null)

  if (!content) return <Sub title="Заземление" onBack={onBack}><Loading /></Sub>

  if (ex) {
    return <Sub title={ex.name} onBack={onBack}><Player ex={ex} onDone={onBack} /></Sub>
  }

  return (
    <Sub title="Заземление" onBack={onBack}>
      <p style={{ color: 'var(--ink-soft)', margin: '0 4px 10px' }}>Вернуться в «здесь и сейчас», когда мысли уносят. Я рядом.</p>
      {content.grounding.map(g => (
        <button
          key={g.id} className="goal-row"
          style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}
          onClick={() => { haptic('tap'); setEx(g) }}
        >
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 800, display: 'block' }}>{g.name}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{g.steps.length} шагов</span>
          </span>
        </button>
      ))}
    </Sub>
  )
}
