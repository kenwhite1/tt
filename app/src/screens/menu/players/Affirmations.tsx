// Аффирмации: a warm card you can shuffle; «Беру с собой» logs an affirmation activity.
import { useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Loading, Sub, applyReward, useContent } from '../ui'
import type { Reward } from '../types'

export function Affirmations({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * 1000))
  const [busy, setBusy] = useState(false)

  if (!content) return <Sub title="Тёплые слова" onBack={onBack}><Loading /></Sub>
  const list = content.affirmations.length ? content.affirmations : ['Я делаю достаточно.']
  const text = list[idx % list.length]

  function shuffle() {
    haptic('tap')
    const n = list.length
    if (n <= 1) return
    // advance by a random non-zero step so we never repeat the current card
    setIdx(i => i + 1 + Math.floor(Math.random() * (n - 1)))
  }

  async function keep() {
    if (busy) return
    setBusy(true)
    try {
      const r = await req<{ reward: Reward }>('/activities/log', { kind: 'affirmation', refId: String(idx % list.length) })
      applyReward(r.reward, 'Пусть эти слова будут с тобой 💛')
    } catch { /* warm anyway */ }
    onBack()
  }

  return (
    <Sub title="Тёплые слова" onBack={onBack}>
      <div className="card" style={{ textAlign: 'center', padding: '40px 22px', background: 'linear-gradient(135deg, #fbe3b2, #f8d77e)' }}>
        <div style={{ fontSize: 40 }}>💛</div>
        <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, color: 'var(--brown-deep)' }}>{text}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={shuffle}>🔀 Ещё</button>
        <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={() => void keep()}>Беру с собой</button>
      </div>
    </Sub>
  )
}
