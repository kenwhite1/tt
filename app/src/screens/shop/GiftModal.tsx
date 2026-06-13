// Gift flow: pick a friend (1/friend/day), pick a box colour, pay price + fee.
import { useEffect, useState } from 'react'
import { C } from '@shared/constants'
import { req } from '../../api'
import { haptic } from '../../telegram'
import { useStore } from '../../store'
import { BOX_COLORS, errRu } from './types'
import type { GiftTargetDto } from './types'

export type GiftMode =
 | { type: 'slot'; shop: string; slot: number; kind: string; itemId: string; colorId: string; price: number }
 | { type: 'own'; kind: string; itemId: string; colorId: string }

export function GiftModal({ mode, itemRu, onClose, onDone }: {
 mode: GiftMode
 itemRu: string
 onClose(): void
 onDone(): void
}) {
 const [friends, setFriends] = useState<GiftTargetDto[] | null>(null)
 const [friendId, setFriendId] = useState<number | null>(null)
 const [box, setBox] = useState(BOX_COLORS[0].id)
 const [busy, setBusy] = useState(false)
 const showToast = useStore(s => s.showToast)

 useEffect(() => {
 void req<{ friends: GiftTargetDto[] }>(
 `/shop/gift-targets?kind=${mode.kind}&itemId=${encodeURIComponent(mode.itemId)}&colorId=${encodeURIComponent(mode.colorId)}`,
 ).then(r => setFriends(r.friends))
 }, [mode.kind, mode.itemId, mode.colorId])

 const cost = mode.type === 'slot' ? mode.price + C.GIFT_FEE : C.GIFT_FEE

 async function send() {
 if (friendId === null || busy) return
 setBusy(true)
 try {
 if (mode.type === 'slot') {
 await req(`/shop/${mode.shop}/gift`, { slot: mode.slot, friendId, boxColor: box })
 } else {
 await req('/shop/gift-own', { kind: mode.kind, itemId: mode.itemId, colorId: mode.colorId, friendId, boxColor: box })
 }
 haptic('success')
 showToast('Подарок отправлен! 🎁')
 void useStore.getState().refresh()
 onDone()
 } catch (e) {
 haptic('warn')
 showToast(errRu(e))
 setBusy(false)
 }
 }

 return (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 45, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
 <div className="card" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, maxHeight: '78vh', overflowY: 'auto', paddingBottom: 'calc(20px + var(--safe-bottom))' }} onClick={e => e.stopPropagation()}>
 <h2 style={{ textAlign: 'center' }}>🎁 Подарить</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '6px 0 12px' }}>{itemRu}</p>

 <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>Кому подарим?</h3>
 {friends === null && <p style={{ color: 'var(--ink-soft)' }}>Зову друзей…</p>}
 {friends !== null && friends.length === 0 && (
 <p style={{ color: 'var(--ink-soft)' }}>Пока некому дарить, загляни во «Дворик» и добавь друзей 🐾</p>
 )}
 {friends?.map(f => {
 const blocked = f.owned || f.giftedToday
 return (
 <button
 key={f.id}
 className="goal-row"
 disabled={blocked}
 onClick={() => setFriendId(f.id)}
 style={{ width: '100%', border: friendId === f.id ? '2px solid var(--accent)' : '2px solid transparent', opacity: blocked ? 0.5 : 1, cursor: 'pointer', textAlign: 'left' }}
 >
 <span style={{ fontSize: 22 }}>🐶</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{f.name}</span>
 {f.owned && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>уже есть</span>}
 {!f.owned && f.giftedToday && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>уже подарено</span>}
 {friendId === f.id && <span>✓</span>}
 </button>
 )
 })}

 <h3 style={{ fontSize: 15, margin: '12px 0 8px' }}>Цвет коробочки</h3>
 <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
 {BOX_COLORS.map(b => (
 <button
 key={b.id}
 onClick={() => setBox(b.id)}
 aria-label={b.ru}
 style={{
 width: 44, height: 44, borderRadius: 12, background: b.hex, cursor: 'pointer',
 border: box === b.id ? '3px solid var(--brown-deep)' : '3px solid transparent',
 }}
 />
 ))}
 </div>

 <button className="btn accent" style={{ width: '100%' }} disabled={friendId === null || busy} onClick={() => void send()}>
 Отправить за {cost} 🦴
 </button>
 <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
 {mode.type === 'slot' ? `Цена вещи + ${C.GIFT_FEE} 🦴 за доставку` : `Вещь уйдёт из твоей сумки, доставка ${C.GIFT_FEE} 🦴`}
 </p>
 </div>
 </div>
 )
}
