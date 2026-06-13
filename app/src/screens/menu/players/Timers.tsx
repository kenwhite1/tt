// Таймеры: meditation + focus. Pick a duration, watch the Puppy rest, log on finish.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Puppy } from '../../../art/Puppy'
import { Chip, ChipRow, Loading, Sub, applyReward, useContent } from '../ui'
import type { Reward, TimerCfg } from '../types'

function Running({ kind, minutes, onDone }: { kind: 'meditation' | 'focus'; minutes: number; onDone(): void }) {
  const [left, setLeft] = useState(minutes * 60)
  const [done, setDone] = useState(false)
  const total = minutes * 60

  useEffect(() => {
    if (done) return
    const t = setInterval(() => {
      setLeft(l => {
        if (l <= 1) { clearInterval(t); finish(); return 0 }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  async function finish() {
    if (done) return
    setDone(true)
    try {
      const r = await req<{ reward: Reward }>('/activities/log', { kind, minutes })
      applyReward(r.reward, kind === 'meditation' ? 'Медитация завершена 💛' : 'Фокус-сессия завершена 💛')
    } catch { /* let out */ }
    onDone()
  }

  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  const pct = ((total - left) / total) * 100

  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <Puppy state="sleeping" size={150} />
      <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--brown-deep)', margin: '6px 0' }}>{mm}:{ss}</div>
      <div className="energy-track" style={{ margin: '8px 8px' }}>
        <div className="energy-fill" style={{ width: `${pct}%` }} />
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        {kind === 'meditation' ? 'Шарик отдыхает рядом. Просто будь здесь.' : 'Шарик дремлет, пока ты в деле. Сосредоточься на одном.'}
      </p>
      <button className="btn ghost" onClick={() => void finish()}>Закончить раньше</button>
    </div>
  )
}

function Picker({ kind, cfg, plus, onPick }: { kind: 'meditation' | 'focus'; cfg: TimerCfg; plus: boolean; onPick(m: number): void }) {
  const all = [...new Set([...cfg.free, ...cfg.plus])].sort((a, b) => a - b)
  return (
    <div className="card">
      <h2>{kind === 'meditation' ? '🧘 Медитация' : '🎯 Фокус'}</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '4px 0 10px' }}>
        {kind === 'meditation' ? 'Тихое время с Шариком.' : 'Помодоро-таймер: одно дело, без отвлечений.'}
      </p>
      <ChipRow>
        {all.map(m => {
          const locked = !cfg.free.includes(m) && !plus
          return <Chip key={m} locked={locked} onClick={() => { if (!locked) { haptic('tap'); onPick(m) } }}>{m} мин</Chip>
        })}
      </ChipRow>
    </div>
  )
}

export function Timers({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [run, setRun] = useState<{ kind: 'meditation' | 'focus'; minutes: number } | null>(null)

  if (!content) return <Sub title="Таймеры" onBack={onBack}><Loading /></Sub>

  if (run) {
    return (
      <Sub title={run.kind === 'meditation' ? 'Медитация' : 'Фокус'} onBack={onBack}>
        <Running kind={run.kind} minutes={run.minutes} onDone={onBack} />
      </Sub>
    )
  }

  return (
    <Sub title="Таймеры" onBack={onBack}>
      <Picker kind="meditation" cfg={content.timers.meditation} plus={content.plus} onPick={m => setRun({ kind: 'meditation', minutes: m })} />
      <Picker kind="focus" cfg={content.timers.focus} plus={content.plus} onPick={m => setRun({ kind: 'focus', minutes: m })} />
    </Sub>
  )
}
