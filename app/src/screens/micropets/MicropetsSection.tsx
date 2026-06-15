// Микропитомцы: playland scene + Лаборатория профессора Овса + Микропедия.
// Rendered inside the Bag tab. Built by the micropets module agent.
import { useCallback, useEffect, useState } from 'react'
import { C } from '@shared/constants'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import { playSfx } from '../../sound'
import { Micropet } from '../../art/Micropet'
import { Mascot } from '../../art/Mascot'
import { Micropedia } from './Micropedia'

export interface MicropetDto {
 id: number; speciesId: string; speciesName: string; speciesRu: string
 name: string; pronouns: string; nature: string; walks: number
 adult: boolean; foreverBaby: boolean; equipped: boolean; hatchedDay: string
 variantId: string; variantHex: string; variantColor: string
 description: string; emoji: string
}
export interface EggDto {
 goalId: number | null; goalTitle: string | null; goalEmoji: string | null
 progress: number; target: number; canHatch: boolean
}
export interface MicropetsDto {
 egg: EggDto; pets: MicropetDto[]; equippedId: number | null
 ownedSpecies: number; speciesTotal: number; playlandMax: number
}

const PRONOUN_RU: Record<string, string> = { he: 'он', she: 'она', they: 'они' }

const ROAM_CSS = `
@keyframes mp-roam {
 from { transform: translateX(0); }
 to { transform: translateX(var(--mp-dist, 100px)); }
}
@keyframes mp-bob {
 0%, 100% { margin-bottom: 0; }
 50% { margin-bottom: 4px; }
}
`

function EggBar({ egg }: { egg: EggDto }) {
 return (
 <div className="energy-track" style={{ height: 12 }}>
 <div className="energy-fill" style={{ width: `${(egg.progress / egg.target) * 100}%` }} />
 </div>
 )
}

export function MicropetsSection({ onBack }: { onBack(): void }) {
 const goals = useStore(s => s.state?.goals ?? [])
 const species = useStore(s => s.state?.pet.species ?? 'dog')
 const showToast = useStore(s => s.showToast)
 const [data, setData] = useState<MicropetsDto | null>(null)
 const [view, setView] = useState<'playland' | 'lab' | 'pedia'>('playland')
 const [asList, setAsList] = useState(false)
 const [selectedId, setSelectedId] = useState<number | null>(null)
 const [gear, setGear] = useState(false)
 const [editName, setEditName] = useState('')
 const [editPronouns, setEditPronouns] = useState('they')
 const [confirmRelease, setConfirmRelease] = useState(false)
 const [pendingGoalId, setPendingGoalId] = useState<number | null>(null)
 const [hatched, setHatched] = useState<MicropetDto | null>(null)

 const reload = useCallback(() => {
 req<MicropetsDto>('/micropets').then(setData).catch(() => {})
 }, [])
 useEffect(() => { reload() }, [reload])

 const selected = data?.pets.find(p => p.id === selectedId) ?? null

 function openDetail(p: MicropetDto) {
 haptic('tap')
 setSelectedId(p.id)
 setGear(false)
 setConfirmRelease(false)
 setEditName(p.name)
 setEditPronouns(p.pronouns)
 }

 async function equip(p: MicropetDto) {
 await req(`/micropets/${p.id}/equip`, { on: !p.equipped })
 haptic('success')
 showToast(p.equipped ? `${p.name} останется дома 🏡` : `${p.name} пойдёт на прогулку! 🐾`)
 reload()
 }

 async function saveRename(p: MicropetDto) {
 const name = editName.trim()
 if (!name) return
 await req(`/micropets/${p.id}/rename`, { name, pronouns: editPronouns })
 haptic('success')
 showToast('Сохранено 💛')
 setGear(false)
 reload()
 }

 async function toggleForeverBaby(p: MicropetDto) {
 await req(`/micropets/${p.id}/forever-baby`, { on: !p.foreverBaby })
 haptic('tap')
 reload()
 }

 async function release(p: MicropetDto) {
 await req(`/micropets/${p.id}/release`, {})
 haptic('warn')
 showToast(`${p.name} отправился на волю. Спасибо за всё! 🌿`)
 setSelectedId(null)
 reload()
 }

 async function linkGoal(goalId: number) {
 const r = await req<{ egg: EggDto }>('/micropets/egg/link', { goalId })
 haptic('success')
 showToast('Коробочка привязана к цели! 🎁')
 setPendingGoalId(null)
 setData(d => (d ? { ...d, egg: r.egg } : d))
 }

 async function hatch() {
 const r = await req<{ pet: MicropetDto; egg: EggDto }>('/micropets/egg/hatch', {})
 haptic('success')
 playSfx('hatch')
 setHatched(r.pet)
 reload()
 }

 if (view === 'pedia') return <Micropedia onBack={() => setView('playland')} />

 if (!data) {
 return (
 <>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={onBack}>‹</button>
 <h1>🐾 Микропитомцы</h1>
 </div>
 <div className="card" style={{ textAlign: 'center' }}>Загружаю…</div>
 </>
 )
 }

 const { egg, pets } = data

 // ---------- Лаборатория профессора Овса ----------
 if (view === 'lab') {
 const pendingGoal = goals.find(g => g.id === pendingGoalId)
 return (
 <>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={() => setView('playland')}>‹</button>
 <h1>🐐 Лаборатория профессора Овса</h1>
 </div>

 <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
 <span style={{ fontSize: 44 }}>🐐</span>
 <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600 }}>
 «Привет! Привяжи коробочку-сюрприз к одной из своих целей. Выполни её {egg.target} раз -
 и внутри окажется новый друг. Кто именно, сюрприз даже для меня!»
 </div>
 </div>

 <div className="card" style={{ textAlign: 'center' }}>
 <div className={'egg-pop' + (egg.canHatch ? ' ready' : '')} style={{ fontSize: 64 }}>🎁</div>
 {egg.goalId != null ? (
 <>
 <div style={{ fontWeight: 800, margin: '6px 0' }}>
 {egg.goalEmoji} {egg.goalTitle}
 </div>
 <EggBar egg={egg} />
 <div style={{ fontWeight: 800, marginTop: 6 }}>{egg.progress} / {egg.target}</div>
 {egg.canHatch && (
 <button className="btn accent" style={{ marginTop: 10 }} onClick={() => void hatch()}>
 ✨ Открыть!
 </button>
 )}
 </>
 ) : (
 <div style={{ color: 'var(--ink-soft)', fontWeight: 700, marginTop: 4 }}>
 Коробочка ждёт, пока ты выберешь цель ниже
 </div>
 )}
 </div>

 <h2 style={{ margin: '4px 4px 10px' }}>Привязать к цели</h2>
 {goals.length === 0 && (
 <div className="card" style={{ color: 'var(--ink-soft)' }}>
 Сначала добавь цель на главном экране, и возвращайся!
 </div>
 )}
 {goals.map(g => {
 const linked = egg.goalId === g.id
 return (
 <button
 key={g.id}
 className="goal-row"
 style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', outline: linked ? '3px solid var(--gold)' : 'none' }}
 onClick={() => {
 if (linked) return
 if (egg.goalId != null && egg.progress > 0) setPendingGoalId(g.id)
 else void linkGoal(g.id)
 }}
 >
 <span style={{ fontSize: 22 }}>{g.emoji}</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{g.title}</span>
 {linked && <span style={{ fontWeight: 800, color: 'var(--accent-deep)' }}>🎁 привязано</span>}
 </button>
 )
 })}

 {pendingGoal && (
 <div className="card" style={{ background: '#fdeceb' }}>
 <b>Перепривязать коробочку к «{pendingGoal.title}»?</b>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '6px 0 10px' }}>
 Прогресс коробочки сбросится до 0 / {egg.target}.
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 <button className="btn" onClick={() => void linkGoal(pendingGoal.id)}>Да, перепривязать</button>
 <button className="btn ghost" onClick={() => setPendingGoalId(null)}>Отмена</button>
 </div>
 </div>
 )}

 {hatched && <HatchReveal pet={hatched} onClose={() => setHatched(null)} />}
 </>
 )
 }

 // ---------- Playland ----------
 const roaming = pets.slice(0, C.MICROPETS_IN_PLAYLAND)
 return (
 <>
 <style>{ROAM_CSS}</style>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 12px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={onBack}>‹</button>
 <h1 style={{ flex: 1 }}>🐾 Микропитомцы</h1>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => { haptic('tap'); setView('lab') }}>🐐</button>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => { haptic('tap'); setView('pedia') }}>📖</button>
 </div>

 <div
 className="card mp-meadow"
 style={{
 position: 'relative', height: 180, overflow: 'hidden', padding: 0,
 background: 'linear-gradient(#cfe6f5 0%, #d9ecc2 55%, #b9d99b 100%)',
 }}
 >
 <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)' }}>
 <Mascot species={species} size={70} />
 </div>
 {roaming.map((p, i) => {
 const dist = 60 + ((p.id * 37) % 120)
 const dur = 5 + ((p.id * 13) % 7)
 const delay = -((p.id * 7) % 10)
 const left = 6 + ((i * 53) % 60)
 const bottom = 6 + ((p.id * 17) % 50)
 return (
 <button
 key={p.id}
 onClick={() => openDetail(p)}
 style={{
 position: 'absolute', left: `${left}%`, bottom, border: 'none',
 background: 'none', padding: 0, cursor: 'pointer',
 ['--mp-dist' as never]: `${dist}px`,
 animation: `mp-roam ${dur}s ease-in-out ${delay}s infinite alternate, mp-bob 0.9s ease-in-out infinite`,
 }}
 >
 <Micropet speciesId={p.speciesId} variantHex={p.variantHex} adult={p.adult} size={p.adult ? 44 : 34} />
 {p.equipped && <div style={{ fontSize: 11, textAlign: 'center' }}>🐾</div>}
 </button>
 )
 })}
 {pets.length === 0 && (
 <div style={{ position: 'absolute', top: 14, width: '100%', textAlign: 'center', fontWeight: 800, color: 'var(--brown-deep)' }}>
 Пока тут только твой питомец, получи первого друга!
 </div>
 )}
 </div>

 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 10px' }}>
 <h2>Твои питомцы ({pets.length})</h2>
 <button className="btn ghost" style={{ padding: '6px 12px' }} onClick={() => { haptic('tap'); setAsList(v => !v) }}>
 {asList ? '▦ Сетка' : '☰ Список'}
 </button>
 </div>

 {asList ? (
 <>
 <button className="goal-row" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => setView('lab')}>
 <span style={{ fontSize: 26 }}>🎁</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>Коробочка</div>
 <EggBar egg={egg} />
 </div>
 <span style={{ fontWeight: 800 }}>{egg.progress}/{egg.target}</span>
 </button>
 {pets.map(p => (
 <button key={p.id} className="goal-row" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => openDetail(p)}>
 <Micropet speciesId={p.speciesId} variantHex={p.variantHex} adult={p.adult} size={40} />
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{p.name} {p.equipped ? '🐾' : ''}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{p.adult ? 'Взрослый' : 'Малыш'} · прогулок: {p.walks}</div>
 </div>
 <span style={{ color: 'var(--ink-soft)' }}>›</span>
 </button>
 ))}
 </>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
 <button className="card" style={{ margin: 0, padding: 10, border: 'none', textAlign: 'center', background: '#eaf3da', cursor: 'pointer' }} onClick={() => setView('lab')}>
 <div style={{ fontSize: 34 }}>🎁</div>
 <EggBar egg={egg} />
 <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>{egg.progress}/{egg.target}</div>
 </button>
 {pets.map(p => (
 <button key={p.id} className="card" style={{ margin: 0, padding: 10, border: 'none', textAlign: 'center', background: '#eaf3da', cursor: 'pointer' }} onClick={() => openDetail(p)}>
 <Micropet speciesId={p.speciesId} variantHex={p.variantHex} adult={p.adult} size={46} />
 <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>{p.name} {p.equipped ? '🐾' : ''}</div>
 </button>
 ))}
 </div>
 )}

 {/* ---------- detail sheet ---------- */}
 {selected && (
 <div
 style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }}
 onClick={() => setSelectedId(null)}
 >
 <div
 className="card"
 style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))', maxHeight: '80%', overflowY: 'auto' }}
 onClick={e => e.stopPropagation()}
 >
 <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
 <span className="mp-portrait"><Micropet speciesId={selected.speciesId} variantHex={selected.variantHex} adult={selected.adult} size={84} /></span>
 <div style={{ flex: 1 }}>
 <h2>{selected.name} {selected.emoji}</h2>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 700 }}>
 {selected.speciesRu} · {selected.variantColor} · {PRONOUN_RU[selected.pronouns] ?? selected.pronouns}
 </div>
 <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>
 {selected.adult ? '🌟 Взрослый' : '🍼 Малыш'} · 🐾 прогулок: {selected.walks}
 {!selected.adult && !selected.foreverBaby && ` / ${C.MICROPET_ADULT_WALKS}`}
 </div>
 <div style={{ fontSize: 13, color: 'var(--accent-deep)', fontWeight: 800, marginTop: 2 }}>
 Характер: {selected.nature || '-'}
 </div>
 </div>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => { haptic('tap'); setGear(g => !g); setConfirmRelease(false) }}>⚙️</button>
 </div>

 <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '10px 0' }}>{selected.description}</p>

 {!gear ? (
 <button className={selected.equipped ? 'btn ghost' : 'btn accent'} style={{ width: '100%' }} onClick={() => void equip(selected)}>
 {selected.equipped ? '🏡 Оставить дома' : '🐾 Взять на прогулку'}
 </button>
 ) : (
 <div>
 <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
 <input
 value={editName} maxLength={30} onChange={e => setEditName(e.target.value)}
 style={{ flex: 1, border: '2px solid var(--gold)', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit' }}
 />
 <button className="btn" onClick={() => void saveRename(selected)}>💾</button>
 </div>
 <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
 {(['he', 'she', 'they'] as const).map(p => (
 <button key={p} className={editPronouns === p ? 'btn' : 'btn ghost'} style={{ flex: 1, padding: '8px 0' }} onClick={() => setEditPronouns(p)}>
 {PRONOUN_RU[p]}
 </button>
 ))}
 </div>
 {!selected.adult && (
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => void toggleForeverBaby(selected)}>
 {selected.foreverBaby ? '🍼 Вечный малыш: вкл, выключить' : '🍼 Вечный малыш: выкл, включить'}
 </button>
 )}
 {!confirmRelease ? (
 <button className="btn ghost" style={{ width: '100%', color: 'var(--red)' }} onClick={() => setConfirmRelease(true)}>
 🌿 Отпустить на волю
 </button>
 ) : (
 <div className="card" style={{ background: '#fdeceb', margin: 0 }}>
 <b>Точно отпустить {selected.name}?</b>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '6px 0 10px' }}>Вернуть питомца будет нельзя.</div>
 <div style={{ display: 'flex', gap: 8 }}>
 <button className="btn" style={{ background: 'var(--red)', boxShadow: '0 4px 0 #b03c33' }} onClick={() => void release(selected)}>Отпустить</button>
 <button className="btn ghost" onClick={() => setConfirmRelease(false)}>Оставить</button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 )}

 {hatched && <HatchReveal pet={hatched} onClose={() => setHatched(null)} />}
 </>
 )
}

function HatchReveal({ pet, onClose }: { pet: MicropetDto; onClose(): void }) {
 return (
 <div
 style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
 onClick={onClose}
 >
 <div className="card" style={{ width: '100%', textAlign: 'center', margin: 0, position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
 <div className="confetti" aria-hidden>{Array.from({ length: 11 }).map((_, i) => (<i key={i} style={{ left: `${6 + i * 8}%`, ['--cd' as never]: `${(i % 5) * 0.08}s`, background: ['var(--gold)', 'var(--accent)', 'var(--green)', 'var(--red)', 'var(--accent-deep)'][i % 5] }} />))}</div>
 <div style={{ fontSize: 40 }}>🎁✨</div>
 <h2 style={{ margin: '8px 0' }}>Кто-то появился!</h2>
 <span className="mp-portrait"><Micropet speciesId={pet.speciesId} variantHex={pet.variantHex} size={96} /></span>
 <h1 style={{ margin: '8px 0 2px' }}>{pet.name} {pet.emoji}</h1>
 <div style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>
 {pet.speciesRu} · {pet.variantColor} · характер: {pet.nature}
 </div>
 <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{pet.description}</p>
 <button className="btn accent" style={{ width: '100%' }} onClick={onClose}>Ура! 🎉</button>
 </div>
 </div>
 )
}
