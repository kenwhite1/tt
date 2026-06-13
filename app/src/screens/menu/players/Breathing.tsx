// Дыхание: pick a pattern + duration, then an animated circle that scales per phase.
import { useEffect, useRef, useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Chip, ChipRow, Loading, Sub, applyReward, useContent } from '../ui'
import type { BreathPattern, Reward } from '../types'

const TAB_RU: Record<string, string> = {
  calm: 'Спокойствие', focus: 'Фокус', morning: 'Утро', energize: 'Заряд', night: 'Вечер',
}
const TAB_ORDER = ['calm', 'focus', 'morning', 'energize', 'night']

function Player({ pattern, minutes, onDone }: { pattern: BreathPattern; minutes: number; onDone(): void }) {
  const phases = pattern.phases.length ? pattern.phases : [{ label: 'вдох', seconds: 4 }, { label: 'выдох', seconds: 4 }]
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [remaining, setRemaining] = useState(minutes * 60)
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)

  // phase cycler
  useEffect(() => {
    if (done) return
    const cur = phases[phaseIdx % phases.length]
    const t = setTimeout(() => {
      haptic('tap')
      idxRef.current += 1
      setPhaseIdx(idxRef.current)
    }, cur.seconds * 1000)
    return () => clearTimeout(t)
  }, [phaseIdx, done]) // eslint-disable-line react-hooks/exhaustive-deps

  // countdown
  useEffect(() => {
    if (done) return
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(t); finish(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  async function finish() {
    if (done) return
    setDone(true)
    try {
      const r = await req<{ reward: Reward }>('/activities/log', { kind: 'breathing', refId: pattern.id, minutes })
      applyReward(r.reward, 'Дыхание завершено 💛')
    } catch { /* still let the user out */ }
    onDone()
  }

  const cur = phases[phaseIdx % phases.length]
  const label = (cur.label || '').toLowerCase()
  const big = label.includes('вдох')
  const small = label.includes('выдох')
  const scale = big ? 1.35 : small ? 0.75 : 1
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
      <p style={{ fontWeight: 800, color: 'var(--ink-soft)', marginTop: 0 }}>{pattern.name} · {mm}:{ss}</p>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 150, height: 150, borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 32%, var(--gold), var(--accent))',
            transform: `scale(${scale})`, transition: `transform ${cur.seconds}s ease-in-out`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(217,139,31,0.3)',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 22, color: '#fff' }}>{cur.label}</span>
        </div>
      </div>
      <button className="btn ghost" style={{ marginTop: 18 }} onClick={() => void finish()}>Закончить</button>
    </div>
  )
}

export function Breathing({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [tab, setTab] = useState('calm')
  const [pattern, setPattern] = useState<BreathPattern | null>(null)
  const [minutes, setMinutes] = useState(1)

  if (!content) return <Sub title="Дыхание" onBack={onBack}><Loading /></Sub>
  const plus = content.plus
  const free = content.breathing.durations.free
  const allDur = [...new Set([...content.breathing.durations.free, ...content.breathing.durations.plus])].sort((a, b) => a - b)

  if (pattern) {
    return (
      <Sub title={pattern.name} onBack={onBack}>
        <Player pattern={pattern} minutes={minutes} onDone={onBack} />
      </Sub>
    )
  }

  const list = content.breathing.patterns.filter(p => p.tabs.includes(tab))

  return (
    <Sub title="Дыхание" onBack={onBack}>
      <p style={{ color: 'var(--ink-soft)', margin: '0 4px 8px' }}>Подыши вместе со мной — круг покажет ритм.</p>

      <ChipRow>
        {TAB_ORDER.map(t => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{TAB_RU[t]}</Chip>)}
      </ChipRow>

      <div style={{ fontWeight: 800, margin: '4px 4px 8px', color: 'var(--ink-soft)', fontSize: 14 }}>Сколько минут</div>
      <ChipRow>
        {allDur.map(m => {
          const locked = !free.includes(m) && !plus
          return <Chip key={m} active={minutes === m} locked={locked} onClick={() => !locked && setMinutes(m)}>{m} мин</Chip>
        })}
      </ChipRow>

      {list.map(p => {
        const locked = p.plus && !plus
        return (
          <button
            key={p.id} className="goal-row"
            style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, opacity: locked ? 0.6 : 1 }}
            onClick={() => { if (!locked) { haptic('tap'); setPattern(p) } }}
          >
            <span style={{ fontSize: 24 }}>🫧</span>
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 800, display: 'block' }}>{p.name}{locked ? ' 🔒' : ''}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{p.phases.map(ph => `${ph.label} ${ph.seconds}с`).join(' · ')}</span>
            </span>
          </button>
        )
      })}
    </Sub>
  )
}
