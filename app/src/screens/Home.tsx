import { useEffect, useRef, useState } from 'react'
import { C } from '@shared/constants'
import { req } from '../api'
import { useStore } from '../store'
import { Mascot } from '../art/Mascot'
import type { BagDto } from './shop/types'
import { PetRug } from '../art/PetRug'
import { RoomScene } from '../art/RoomScene'
import { BoltIcon } from '../art/icons'
import { playSfx } from '../sound'
import { track } from '../analytics'
import { WalkChat } from './travel/WalkChat'
import { DailyDig } from './home/DailyDig'

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
  // equipped outfit (slot -> itemId) so the pet wears its clothes on the home screen
  const [outfit, setOutfit] = useState<Record<string, { itemId: string; colorId: string }>>({})
  const [room, setRoom] = useState<Record<string, { itemId: string; colorId: string }>>({})
  useEffect(() => {
    void req<BagDto>('/shop/bag').then(b => {
      const o: Record<string, { itemId: string; colorId: string }> = {}
      for (const [slot, entry] of Object.entries(b.equipped.outfit)) {
        if (entry?.itemId) o[slot] = { itemId: entry.itemId, colorId: entry.colorId ?? '' }
      }
      setOutfit(o)
      const r: Record<string, { itemId: string; colorId: string }> = {}
      for (const [slot, entry] of Object.entries(b.equipped.room)) {
        if (entry?.itemId) r[slot] = { itemId: entry.itemId, colorId: entry.colorId ?? '' }
      }
      setRoom(r)
    }).catch(() => {})
  }, [])
  if (!state) return null
  const { pet, energy, energyMax, walk, walkReady, goals } = state
  const goalEnergy = state.lowMoodDay ? C.GOAL_ENERGY_LOW_MOOD : C.GOAL_ENERGY
  const walking = walk && !walk.completed
  const hr = new Date().getHours()
  const sleepy = !leaving && !react && (hr >= 21 || hr < 6) // dozes off at night, wakes on a pat
  const left = goals.filter(g => g.doneToday < g.timesPerDay).length

  function onPat(e: React.PointerEvent) {
    useStore.getState().pat(1)
    playSfx('pat')
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
    playSfx('complete')
    track('goal_complete')
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
          <RoomScene furniture={room}>
            {!walking && (
              <div ref={hearts} style={{ position: 'relative', display: 'inline-block', touchAction: 'none' }} onPointerDown={leaving ? undefined : onPat}>
                <PetRug>
                  <div className={leaving ? 'walk-out' : 'pet-rock'}>
                    {sleepy && <span className="pet-zzz" aria-hidden>💤</span>}
                    <Mascot species={pet.species} state={leaving ? 'walking' : react ? 'happy' : sleepy ? 'sleeping' : 'idle'} size={150} outfit={outfit} />
                  </div>
                </PetRug>
              </div>
            )}
          </RoomScene>
          <button className="round-btn" style={{ position: 'absolute', top: 8, left: 10 }} onClick={() => useStore.getState().setMenuOpen(true)} aria-label="Меню">☰</button>
          <button className="round-btn" style={{ position: 'absolute', top: 8, right: 10 }} onClick={() => setShowMood(true)} aria-label="Настроение">
            {state.moodToday ? MOODS[state.moodToday - 1] : '🙂'}
          </button>
        </div>

        {/* adventure / energy card — sits below the room */}
        <div className="adv-card">
          <div className="adv-bolt"><BoltIcon /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              {walking ? `${pet.name} на прогулке`
                : walkReady ? 'Готовы гулять!'
                : walk && walk.completed ? 'Сегодня уже гуляли 🌙'
                : 'Копим энергию на прогулку'}
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

        {walk && walk.completed && !walk.chatDone && (
          <WalkChat walkId={walk.id} onDone={() => void useStore.getState().refresh()} />
        )}

        {walkReady && (
          <button className="btn accent" style={{ width: '100%', marginBottom: 14 }} onClick={() => void onWalk()}>На прогулку!</button>
        )}

        {!walking && !walkReady && walk && walk.completed && walk.chatDone && (
          <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#eef3f7' }}>
            <span style={{ fontSize: 22 }}>🌙</span>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Сегодня вы уже гуляли вместе. Энергия копится дальше, а новая прогулка будет завтра.</div>
          </div>
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

        {/* «Косточка дня» — daily dig */}
        <div style={{ marginBottom: 14 }}><DailyDig /></div>

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
              <span className="goal-reward">{goalEnergy}⚡</span>
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
                  onClick={async () => {
                    // await so a failed save surfaces a toast instead of silently closing the sheet
                    try { await logMood(i + 1); setShowMood(false) }
                    catch { useStore.getState().showToast('Не получилось записать настроение, попробуй ещё раз') }
                  }}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
