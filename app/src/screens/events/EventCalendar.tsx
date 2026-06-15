// Seasonal event «Летний дворик», reward calendar banner + 30-day two-column track.
// Rendered at the top of the Quests tab. Chest opening = reveal → 4/10-color choice.
import { useCallback, useEffect, useRef, useState } from 'react'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import { LocationScene } from '../../art/LocationScene'
import { PlusScreen } from '../plus/PlusScreen'

type CellState = 'locked' | 'claimable' | 'pending' | 'claimed' | 'plus_locked'
interface Spec { kind: string; amount?: number; itemName?: string }
interface DayRow { day: number; free: Spec; plus: Spec; freeState: CellState; plusState: CellState }
interface ColorOpt { id: string; ru: string; hex: string }
interface ItemRef { kind: 'clothing' | 'furniture'; id: string; ru_name: string }
interface EventDto {
 hidden: boolean
 reason?: string
 event?: { id: string; name: string; month: string; isCurrent: boolean; day: number; totalDays: number; deadline: string | null }
 daysEarned?: number
 plus?: boolean
 micropet?: { name: string; emoji: string } | null
 days?: DayRow[]
 past?: { month: string; deadline: string; unclaimed: number } | null
}
type ClaimResp =
 | { stones: number; fromChest?: boolean }
 | { item: ItemRef; colors: ColorOpt[] }
 | { pet: { name: string; species: string; variant: { id: string; ru: string; hex: string }; emoji: string } }

const CHEST_STYLE: Record<string, { bg: string; emoji: string }> = {
 chest_clothing: { bg: '#f2a93b', emoji: '🎁' },
 chest_furniture: { bg: '#9b6fc9', emoji: '🎁' },
 chest_black: { bg: '#4a4039', emoji: '🎁' },
 chest: { bg: '#f8d77e', emoji: '🎁' },
}

function RewardCell({ spec, state, petEmoji, onClick }: {
 spec: Spec; state: CellState; petEmoji: string; onClick(): void
}) {
 const claimed = state === 'claimed'
 const locked = state === 'locked'
 const plusLocked = state === 'plus_locked'
 const chest = CHEST_STYLE[spec.kind]
 const inner = spec.kind === 'stones'
 ? <span style={{ fontWeight: 800, fontSize: 13 }}>🦴{spec.amount}</span>
 : spec.kind === 'micropet'
 ? <span style={{ fontSize: 20 }}>{petEmoji}</span>
 : spec.kind === 'item'
 ? <span style={{ fontSize: 20 }}>🎀</span>
 : <span style={{ fontSize: 18 }}>{chest?.emoji ?? '🎁'}</span>

 return (
 <button
 onClick={onClick}
 disabled={claimed || locked}
 title={spec.itemName}
 style={{
 width: 52, height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
 background: claimed ? 'var(--card-shade)'
 : spec.kind.startsWith('chest') ? (chest?.bg ?? 'var(--gold)')
 : spec.kind === 'item' ? 'var(--gold)' : 'var(--card)',
 boxShadow: state === 'claimable' || state === 'pending' ? '0 0 0 3px var(--green)' : 'var(--shadow-lip)',
 opacity: locked || plusLocked ? 0.45 : 1,
 color: spec.kind === 'chest_black' ? '#fff' : 'var(--ink)',
 }}
 >
 {claimed ? <span style={{ fontSize: 20 }}>✓</span> : inner}
 {(locked || plusLocked) && (
 <span style={{ position: 'absolute', right: -4, bottom: -4, fontSize: 13 }}>🔒</span>
 )}
 {state === 'pending' && (
 <span style={{ position: 'absolute', right: -4, top: -4, fontSize: 13 }}>🎨</span>
 )}
 </button>
 )
}

export function EventCalendar() {
 const [data, setData] = useState<EventDto | null>(null)
 const [month, setMonth] = useState<string | undefined>(undefined)
 const [expanded, setExpanded] = useState(false)
 const [showPlus, setShowPlus] = useState(false)
 const [modal, setModal] = useState<
 | { phase: 'opening' | 'choose'; day: number; column: 'free' | 'plus'; item?: ItemRef; colors?: ColorOpt[] }
 | { phase: 'pet'; pet: { name: string; species: string; variant: { id: string; ru: string; hex: string }; emoji: string } }
 | null
 >(null)
 // chest "shake → reveal" timer, tracked so it can't fire after unmount or overlap a new claim
 const chestTimer = useRef<ReturnType<typeof setTimeout>>()
 useEffect(() => () => clearTimeout(chestTimer.current), [])

 const load = useCallback(async (m?: string) => {
 try {
 const r = await req<EventDto>(`/events${m ? `?month=${m}` : ''}`)
 setData(r)
 if (r.days?.some(d => d.freeState === 'claimable' || d.freeState === 'pending')) setExpanded(true)
 } catch { setData(null) }
 }, [])

 useEffect(() => { void load(month) }, [load, month])

 if (!data || data.hidden || !data.event || !data.days) return null
 const { event, days, daysEarned = 0, plus = false } = data
 const petEmoji = data.micropet?.emoji ?? '💛'

 async function claim(day: number, column: 'free' | 'plus', state: CellState, spec: Spec) {
 if (state === 'plus_locked') { setShowPlus(true); return }
 if (state !== 'claimable' && state !== 'pending') return
 haptic('tap')
 const isChest = spec.kind.startsWith('chest')
 if (isChest && state !== 'pending') setModal({ phase: 'opening', day, column })
 try {
 const r = await req<ClaimResp>('/events/claim', { day, column, month: event.isCurrent ? undefined : event.month })
 if ('stones' in r) {
 setModal(null)
 haptic('success')
 useStore.getState().showToast(`+${r.stones}🦴${'fromChest' in r && r.fromChest ? ' из сундука!' : ''}`)
 await useStore.getState().refresh()
 await load(month)
 } else if ('pet' in r) {
 setModal({ phase: 'pet', pet: r.pet })
 haptic('success')
 await load(month)
 } else {
 // item + colors: let the chest shake a moment, then reveal
 const show = () => setModal({ phase: 'choose', day, column, item: r.item, colors: r.colors })
 if (isChest && state !== 'pending') { clearTimeout(chestTimer.current); chestTimer.current = setTimeout(show, 900) }
 else show()
 }
 } catch (e) {
 setModal(null)
 const err = e as { data?: { error?: string } }
 if (err.data?.error === 'plus_only') setShowPlus(true)
 else useStore.getState().showToast('Не получилось забрать, попробуй ещё раз')
 }
 }

 async function pickColor(day: number, column: 'free' | 'plus', colorId: string) {
 try {
 const r = await req<{ ok: boolean; item: ItemRef; color: ColorOpt }>('/events/color', {
 day, column, colorId, month: event.isCurrent ? undefined : event.month,
 })
 haptic('success')
 useStore.getState().showToast(`${r.item.ru_name} (${r.color.ru.toLowerCase()}), в сумке! 🎉`)
 setModal(null)
 await load(month)
 } catch {
 useStore.getState().showToast('Не получилось выбрать цвет')
 }
 }

 return (
 <>
 <style>{`
 @keyframes chest-shake {
 0%, 100% { transform: rotate(0deg) scale(1); }
 20% { transform: rotate(-8deg) scale(1.05); }
 40% { transform: rotate(8deg) scale(1.1); }
 60% { transform: rotate(-6deg) scale(1.15); }
 80% { transform: rotate(6deg) scale(1.2); }
 }
 @keyframes reveal-pop {
 from { transform: scale(0.4); opacity: 0; }
 60% { transform: scale(1.15); }
 to { transform: scale(1); opacity: 1; }
 }
        .ev-banner { position: relative; overflow: hidden; }
        .ev-banner::before { content: ''; position: absolute; inset: -40%; pointer-events: none; z-index: 0; background: radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,0) 70%); mix-blend-mode: soft-light; animation: banner-sheen 7s ease-in-out infinite; }
        .ev-banner > * { position: relative; z-index: 1; }
        @keyframes banner-sheen { 0%, 100% { transform: translate(-22%, -12%); opacity: .5; } 50% { transform: translate(24%, 10%); opacity: .9; } }
        @media (prefers-reduced-motion: reduce) { .ev-banner::before { animation: none; } }
 `}</style>

 <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
 <div className="ev-banner" onClick={() => { haptic('tap'); setExpanded(x => !x) }} style={{ cursor: 'pointer' }}>
 <LocationScene sky="#ffe9b8" ground="#cdeaa5">
 <div style={{ fontSize: 34 }}>🌞🍉⛱️</div>
 <h2 style={{ margin: '4px 0' }}>{event.name}</h2>
 {!event.isCurrent && event.deadline && (
 <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--brown-deep)', fontWeight: 800 }}>
 Прошлое событие, награды можно забрать до {event.deadline.slice(8, 10)}.{event.deadline.slice(5, 7)}
 </p>
 )}
 <div className="energy-track" style={{ margin: '6px 18px' }}>
 <div className="energy-fill" style={{ width: `${(event.day / event.totalDays) * 100}%` }} />
 </div>
 <p style={{ margin: '4px 0 2px', fontWeight: 800, color: 'var(--brown-deep)' }}>
 День {event.day} из {event.totalDays} · заработано наград: {daysEarned}
 </p>
 <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
 Гуляй со своим питомцем каждый день, каждая прогулка открывает награду {expanded ? '▲' : '▼'}
 </p>
 </LocationScene>
 </div>

 {expanded && (
 <div style={{ padding: '12px 14px 14px' }}>
 {data.past && (
 <button
 className="btn ghost"
 style={{ width: '100%', marginBottom: 10, fontSize: 14 }}
 onClick={() => setMonth(data.past!.month)}
 >
 🎁 Остались награды прошлого месяца: {data.past.unclaimed}, забрать
 </button>
 )}
 {!event.isCurrent && (
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10, fontSize: 14 }} onClick={() => setMonth(undefined)}>
 ← Вернуться к текущему событию
 </button>
 )}

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 6, paddingRight: 2 }}>
 <span style={{ width: 52, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)' }}>МОЯ</span>
 <span
 style={{ width: 52, textAlign: 'center', fontSize: 11, fontWeight: 800, color: plus ? 'var(--accent-deep)' : 'var(--ink-soft)', cursor: 'pointer' }}
 onClick={() => !plus && setShowPlus(true)}
 >ПЛЮС{plus ? '' : ' 🔒'}</span>
 </div>

 {days.map(d => (
 <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
 <span style={{
 width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontWeight: 800, fontSize: 13,
 background: d.day <= daysEarned ? 'var(--green)' : 'var(--card-shade)',
 color: d.day <= daysEarned ? '#fff' : 'var(--ink-soft)',
 }}>{d.day}</span>
 <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {d.free.kind === 'micropet' || d.plus.kind === 'micropet'
 ? `Микропитомец: ${data.micropet?.name ?? ''}`
 : d.plus.kind === 'item' ? d.plus.itemName : ''}
 </div>
 <RewardCell spec={d.free} state={d.freeState} petEmoji={petEmoji} onClick={() => void claim(d.day, 'free', d.freeState, d.free)} />
 <RewardCell spec={d.plus} state={d.plusState} petEmoji={petEmoji} onClick={() => void claim(d.day, 'plus', d.plusState, d.plus)} />
 </div>
 ))}

 {!plus && (
 <button className="btn accent" style={{ width: '100%', marginTop: 6 }} onClick={() => setShowPlus(true)}>
 ✨ Открыть колонку Плюс
 </button>
 )}
 </div>
 )}
 </div>

 {modal && (
 <div
 style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
 onClick={() => { if (modal.phase !== 'opening') setModal(null) }}
 >
 <div className="card" style={{ width: 'min(320px, 86vw)', textAlign: 'center', margin: 0 }} onClick={e => e.stopPropagation()}>
 {modal.phase === 'opening' && (
 <>
 <div style={{ fontSize: 64, animation: 'chest-shake 0.9s ease infinite' }}>🎁</div>
 <p style={{ fontWeight: 800 }}>Открываем сундук…</p>
 </>
 )}
 {modal.phase === 'choose' && modal.item && modal.colors && (
 <>
 <div style={{ fontSize: 54, animation: 'reveal-pop 0.4s ease' }}>
 {modal.item.kind === 'clothing' ? '👒' : '🛋️'}
 </div>
 <h2 style={{ margin: '6px 0' }}>{modal.item.ru_name}</h2>
 <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 12px' }}>
 Выбери цвет, какой тебе по душе?
 </p>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
 {modal.colors.map(col => (
 <button
 key={col.id}
 title={col.ru}
 onClick={() => void pickColor(modal.day, modal.column, col.id)}
 style={{
 width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
 background: col.hex, border: '3px solid var(--card-shade)',
 boxShadow: 'var(--shadow-lip)',
 }}
 />
 ))}
 </div>
 </>
 )}
 {modal.phase === 'pet' && (
 <>
 <div style={{ fontSize: 64, animation: 'reveal-pop 0.5s ease' }}>{modal.pet.emoji}</div>
 <h2 style={{ margin: '6px 0' }}>{modal.pet.name}</h2>
 <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
 Новый микропитомец ({modal.pet.variant.ru}) поселился у тебя! Загляни в Сумку → Микропитомцы 💛
 </p>
 <button className="btn" style={{ marginTop: 8 }} onClick={() => setModal(null)}>Ура!</button>
 </>
 )}
 </div>
 </div>
 )}

 {showPlus && <PlusScreen onClose={() => setShowPlus(false)} />}
 </>
 )
}
