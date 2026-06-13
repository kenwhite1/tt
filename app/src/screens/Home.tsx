import { useRef, useState } from 'react'
import { useStore } from '../store'
import { Puppy } from '../art/Puppy'
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
 const hearts = useRef<HTMLDivElement>(null)
 const pats = useRef(0)
 if (!state) return null
 const { pet, energy, energyMax, walk, walkReady, goals } = state
 const walking = walk && !walk.completed

 function onPat(e: React.PointerEvent) {
 pats.current += 1
 useStore.getState().pat(1)
 const el = document.createElement('div')
 el.className = 'heart-float'
 el.textContent = '💛'
 el.style.left = `${e.nativeEvent.offsetX}px`
 el.style.top = `${e.nativeEvent.offsetY}px`
 hearts.current?.appendChild(el)
 setTimeout(() => el.remove(), 1000)
 }

 return (
 <>
 <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 14px 8px' }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => useStore.getState().setMenuOpen(true)}>☰</button>
 <h1>{pet.name}</h1>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => setShowMood(true)}>
 {state.moodToday ? MOODS[state.moodToday - 1] : '🙂'}
 </button>
 </header>

 <div className="scroll">
 <div className="card" style={{ textAlign: 'center', position: 'relative', background: 'linear-gradient(#cfe6f5 0%, #e8f3d8 70%, #d7e8bf 100%)' }}>
 <div ref={hearts} style={{ position: 'relative', display: 'inline-block' }} onPointerDown={onPat}>
 <Puppy state={walking ? 'happy' : 'idle'} />
 </div>
 {walk && walk.completed && !walk.chatDone && (
 <WalkChat walkId={walk.id} onDone={() => void useStore.getState().refresh()} />
 )}
 {walking ? (
 <p style={{ fontWeight: 800, color: 'var(--brown-deep)' }}>
 🐾 {pet.name} гуляет, вернётся через <WalkCountdown endsTs={walk.endsTs} />
 </p>
 ) : (
 <>
 <div className="energy-track" style={{ margin: '8px 12px' }}>
 <div className="energy-fill" style={{ width: `${Math.min(100, (energy / energyMax) * 100)}%` }} />
 </div>
 <p style={{ margin: '4px 0 8px', fontWeight: 800 }}>⚡ {energy} / {energyMax}</p>
 {walkReady && (
 <button className="btn accent" onClick={() => void startWalk()}>🐾 На прогулку!</button>
 )}
 </>
 )}
 </div>

 {state.lowMoodDay && (
 <div className="card" style={{ background: '#fdeceb', display: 'flex', gap: 10, alignItems: 'center' }}>
 <span style={{ fontSize: 26 }}>⛑️</span>
 <div>
 <b>Аптечка</b>
 <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Сегодня можно полегче. Загляни сюда, если тяжело.</div>
 </div>
 </div>
 )}

 <h2 style={{ margin: '6px 4px 10px' }}>Цели на сегодня</h2>
 {goals.map(g => {
 const done = g.doneToday >= g.timesPerDay
 return (
 <div key={g.id} className="goal-row">
 <button className={`goal-check ${done ? 'done' : ''}`} disabled={done} onClick={() => void completeGoal(g.id)}>
 {done ? '✓' : g.emoji}
 </button>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>
 {g.title} {g.isGoalOfDay ? '⭐' : ''}
 </div>
 {g.timesPerDay > 1 && <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{g.doneToday} / {g.timesPerDay}</div>}
 </div>
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
 <div className="card" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))' }} onClick={e => e.stopPropagation()}>
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
