import { useRef, useState } from 'react'
import { useStore } from '../store'
import { Puppy } from '../art/Puppy'
import { PetRug } from '../art/PetRug'
import { RoomScene } from '../art/RoomScene'
import { WalkChat } from './travel/WalkChat'

function WalkCountdown({ endsTs }: { endsTs: number }) {
  const [, force] = useState(0)
  setTimeout(() => force(x => x + 1), 30_000)
  const left = Math.max(0, endsTs - Date.now())
  const h = Math.floor(left / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  return <span>{h > 0 ? `${h} ч ` : ''}{m} мин</span>
}

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

export function Home() {
  const { state, completeGoal, addGoal, startWalk, logMood } = useStore()
  const [showMood, setShowMood] = useState(false)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [react, setReact] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const reactTimer = useRef<ReturnType<typeof setTimeout>>()
  const hearts = useRef<HTMLDivElement>(null)
  if (!state) return null
  const { pet, energy, energyMax, walk, walkReady, goals } = state
  const walking = walk && !walk.completed
  const left = goals.filter(g => g.doneToday < g.timesPerDay).length

  function onPat(e: React.PointerEvent) {
    useStore.getState().pat(1)
    const el = document.createElement('div')
    el.className = 'heart-float'
    el.textContent = '💛'
    el.style.left = `${e.nativeEvent.offsetX}px`
    el.style.top = `${e.nativeEvent.offsetY}px`
    hearts.current?.appendChild(el)
    setTimeout(() => el.remove(), 1000)
  }

  async function onComplete(e: React.MouseEvent<HTMLButtonElement>, id: number) {
    const r = e.currentTarget.getBoundingClientRect()
    const reward = await completeGoal(id)
    const bits: string[] = []
    if (reward.walkMinutesReduced) bits.push(`🚶 −${reward.walkMinutesReduced} мин`)
    else { if (reward.energy) bits.push(`+${reward.energy}⚡`); if (reward.stones) bits.push(`+${reward.stones}🦴`) }
    const el = document.createElement('div')
    el.className = 'reward-pop'
    el.textContent = bits.join('  ') || '✓'
    el.style.left = `${r.left + r.width / 2}px`
    el.style.top = `${r.top - 4}px`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1200)
    setReact(true)
    clearTimeout(reactTimer.current)
    reactTimer.current = setTimeout(() => setReact(false), 1300)
  }

  async function onWalk() {
    setLeaving(true) // play the trot-out, then start the walk (room empties)
    await new Promise(r => setTimeout(r, 820))
    await startWalk()
    setLeaving(false)
  }

  return (
    <>
      <div className="scroll" style={{ paddingTop: 'calc(var(--safe-top) + 4px)' }}>
        {/* room hero with floating controls */}
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <RoomScene>
            {!walking && (
              <div ref={hearts} style={{ position: 'relative', display: 'inline-block', touchAction: 'none' }} onPointerDown={leaving ? undefined : onPat}>
                <PetRug>
                  <div className={leaving ? 'walk-out' : 'pet-rock'}>
                    <Puppy state={leaving ? 'walking' : react ? 'happy' : 'idle'} size={150} stage={pet.stage as never} />
                  </div>
                </PetRug>
              </div>
            )}
          </RoomScene>
          {/* pet is away on a walk — empty room + a paw-print trail toward the door */}
          {walking && (
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', left: '45%', top: '72%', fontSize: 20, opacity: 0.5 }}>🐾</span>
              <span style={{ position: 'absolute', left: '57%', top: '63%', fontSize: 17, opacity: 0.35 }}>🐾</span>
              <span style={{ position: 'absolute', left: '68%', top: '55%', fontSize: 14, opacity: 0.22 }}>🐾</span>
            </div>
          )}
          <button className="round-btn" style={{ position: 'absolute', top: 8, left: 10 }} onClick={() => useStore.getState().setMenuOpen(true)} aria-label="Меню">☰</button>
          <button className="round-btn" style={{ position: 'absolute', top: 8, right: 10 }} onClick={() => setShowMood(true)} aria-label="Настроение">
            {state.moodToday ? MOODS[state.moodToday - 1] : '🙂'}
          </button>
        </div>

        {/* adventure / energy card — sits below the room */}
        <div className="adv-card">
          <div className="adv-bolt">⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              {walking ? `${pet.name} на прогулке` : '1-я прогулка'}
            </div>
            {walking ? (
              <div style={{ fontSize: 14, opacity: 0.9 }}>Вернётся через <WalkCountdown endsTs={walk.endsTs} /></div>
            ) : (
              <div className="adv-track">
                <div className="adv-fill" style={{ width: `${Math.min(100, (energy / energyMax) * 100)}%` }} />
                <div className="adv-label">{energy} / {energyMax}</div>
              </div>
            )}
          </div>
        </div>

        {walkReady && (
          <button className="btn accent" style={{ width: '100%', marginBottom: 14 }} onClick={() => void onWalk()}>🐾 На прогулку!</button>
        )}

        {state.lowMoodDay && (
          <div className="card" style={{ background: '#fdeceb', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 26 }}>⛑️</span>
            <div>
              <b>Аптечка</b>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Сегодня можно полегче. Загляни сюда, если тяжело.</div>
            </div>
          </div>
        )}

        {/* goals header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 4px 12px' }}>
          <span style={{ fontSize: 20 }}>🗓️</span>
          <h2 style={{ flex: 1 }}>{left > 0 ? `Целей на сегодня: ${left}` : 'Все цели сделаны! 🎉'}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 6px 10px' }}>
          <span style={{ fontWeight: 800, color: 'var(--ink-soft)' }}>Начни день</span>
          <span style={{ flex: 1, height: 2, background: 'var(--card-shade)', borderRadius: 2 }} />
        </div>

        {goals.map(g => {
          const done = g.doneToday >= g.timesPerDay
          return (
            <div key={g.id} className="goal-row">
              <span className="goal-drag">⋮</span>
              <span className="goal-icon">{g.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="goal-title" style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>
                  {g.title} {g.isGoalOfDay ? '⭐' : ''}
                </div>
                {g.timesPerDay > 1 && <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{g.doneToday} / {g.timesPerDay}</div>}
              </div>
              <span className="goal-reward">5⚡</span>
              <button className={`goal-check ${done ? 'done' : ''}`} disabled={done} onClick={e => void onComplete(e, g.id)}>
                {done ? '✓' : ''}
              </button>
            </div>
          )
        })}

        {adding ? (
          <div className="card" style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Например: выпить воды"
              style={{ flex: 1, border: '2px solid var(--gold)', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit' }}
            />
            <button className="btn" onClick={() => { if (title.trim()) { void addGoal(title.trim()); setTitle(''); setAdding(false) } }}>+</button>
          </div>
        ) : (
          <button className="btn ghost" style={{ width: '100%' }} onClick={() => setAdding(true)}>+ Добавить цель</button>
        )}
      </div>

      {showMood && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowMood(false)}
        >
          <div className="card sheet" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ textAlign: 'center', marginBottom: 14 }}>Как ты сейчас?</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  style={{ fontSize: 38, background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => { void logMood(i + 1); setShowMood(false) }}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
