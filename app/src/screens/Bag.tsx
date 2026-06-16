// Сумка питомца, Почта · Одежда (примерочная) · Мебель (домик) · Окрасы · Микропитомцы.
import { useCallback, useEffect, useState } from 'react'
import { C } from '@shared/constants'
import { req } from '../api'
import { haptic } from '../telegram'
import { useStore } from '../store'
import { Mascot } from '../art/Mascot'
import { MicropetsSection } from './micropets/MicropetsSection'
import { collectibles, social, type Friend } from './friends/api'
import { Sheet } from './friends/ui'
import { errRu } from './shop/types'
import type { BagDto, MailItemDto, OwnedItemDto } from './shop/types'

type View = 'menu' | 'mail' | 'outfits' | 'furniture' | 'colors' | 'micropets' | 'collectibles'

export function Bag() {
 const [view, setView] = useState<View>('menu')
 const open = (v: View) => { haptic('tap'); setView(v) }

 if (view === 'micropets') return <MicropetsSection onBack={() => setView('menu')} />
 if (view === 'collectibles') return <CollectiblesView onBack={() => setView('menu')} />
 if (view === 'mail') return <MailView onBack={() => setView('menu')} />
 if (view !== 'menu') return <DressView kind={view} onBack={() => setView('menu')} />

 return <BagMenu onOpen={open} />
}

function BagMenu({ onOpen }: { onOpen(v: View): void }) {
 const [unread, setUnread] = useState(0)
 useEffect(() => { void req<BagDto>('/shop/bag').then(b => setUnread(b.mailUnread)).catch(() => {}) }, [])
 const SECTIONS: { id: View; ru: string; emoji: string; full?: boolean }[] = [
 { id: 'mail', ru: 'Почта', emoji: '📮', full: true },
 { id: 'outfits', ru: 'Одежда', emoji: '👕' },
 { id: 'furniture', ru: 'Мебель', emoji: '🛋️' },
 { id: 'colors', ru: 'Окрасы', emoji: '🎨' },
 { id: 'micropets', ru: 'Микропитомцы', emoji: '💛' },
 { id: 'collectibles', ru: 'Коллекция', emoji: '🏆', full: true },
 ]
 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <div style={{ textAlign: 'center', fontSize: 56, marginBottom: 4 }}>🎒</div>
 <h1 style={{ textAlign: 'center', marginBottom: 16 }}>Сумка питомца</h1>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 {SECTIONS.map(s => (
 <button key={s.id} className="card shop-tile" onClick={() => onOpen(s.id)}
 style={{ margin: 0, textAlign: 'center', border: 'none', cursor: 'pointer', gridColumn: s.full ? '1 / -1' : undefined, position: 'relative' }}>
 <div style={{ marginBottom: 8 }}><span className="emoji-medallion">{s.emoji}</span></div>
 <h2>{s.ru}</h2>
 {s.id === 'mail' && unread > 0 && (
 <span style={{ position: 'absolute', top: 12, right: 16, background: 'var(--red)', color: '#fff', borderRadius: 999, padding: '2px 9px', fontWeight: 800, fontSize: 13 }}>{unread}</span>
 )}
 </button>
 ))}
 </div>
 </div>
 )
}

// ---------- Mail ----------
function MailView({ onBack }: { onBack(): void }) {
 const [mail, setMail] = useState<MailItemDto[] | null>(null)
 const showToast = useStore(s => s.showToast)
 const load = useCallback(() => { void req<{ mail: MailItemDto[] }>('/shop/mail').then(r => setMail(r.mail)) }, [])
 useEffect(load, [load])

 async function read(m: MailItemDto) {
 if (!m.read) { await req(`/shop/mail/${m.id}/read`, {}).catch(() => {}); load() }
 }
 async function claimGift(m: MailItemDto) {
 const giftId = m.data.giftId
 if (typeof giftId !== 'number') return
 try {
 const r = await req<{ ru?: string; duplicate?: boolean; stones?: number }>(`/shop/gifts/${giftId}/claim`, {})
 haptic('success')
 showToast(r.duplicate ? `Уже есть, продали за ${r.stones} 🦴` : `Получено: ${r.ru} 🎁`)
 void useStore.getState().refresh(); load()
 } catch (e) { showToast(errRu(e)) }
 }
 async function respondRequest(m: MailItemDto, accept: boolean) {
 const fromId = m.data.fromId
 if (typeof fromId !== 'number') return
 await req(`/social/requests/${fromId}/${accept ? 'accept' : 'decline'}`, {}).catch(() => {})
 haptic(accept ? 'success' : 'tap'); showToast(accept ? 'Теперь вы друзья! 💛' : 'Отклонено'); load()
 }

 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
 <h1>Почта</h1>
 </header>
 {!mail && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Открываю ящик…</p>}
 {mail && mail.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginTop: 20 }}>Почта пустая 📭</p>}
 {mail?.map(m => (
 <div key={m.id} className="card" style={{ background: m.read ? 'var(--card)' : '#eef6fb' }} onClick={() => void read(m)}>
 <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
 <b style={{ flex: 1 }}>{m.kind === 'newsletter' ? '💌 ' : m.kind === 'gift' ? '🎁 ' : m.kind === 'friend_request' ? '🤝 ' : ''}{m.title}</b>
 {!m.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />}
 </div>
 {m.body && <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{m.body}</div>}
 {m.kind === 'gift' && typeof m.data.giftId === 'number' && (
 <button className="btn accent" style={{ marginTop: 10 }} onClick={e => { e.stopPropagation(); void claimGift(m) }}>Открыть подарок</button>
 )}
 {m.kind === 'friend_request' && typeof m.data.fromId === 'number' && (
 <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
 <button className="btn" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); void respondRequest(m, true) }}>Принять</button>
 <button className="btn ghost" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); void respondRequest(m, false) }}>Отклонить</button>
 </div>
 )}
 </div>
 ))}
 </div>
 )
}

// ---------- Коллекция (limited collectibles) ----------
interface Drop { id: string; ru: string; emoji: string; cap: number; price: number; season: string; minted: number; ownedEdition: number | null }
function CollectiblesView({ onBack }: { onBack(): void }) {
 const [data, setData] = useState<{ drops: Drop[]; stones: number } | null>(null)
 const [busy, setBusy] = useState<string | null>(null)
 const [gift, setGift] = useState<Drop | null>(null)
 const showToast = useStore(s => s.showToast)
 const load = useCallback(() => { void collectibles.list().then(setData) }, [])
 useEffect(load, [load])

 async function claim(d: Drop) {
 setBusy(d.id); haptic('tap')
 try {
 const r = await collectibles.claim(d.id)
 haptic('success'); showToast(`Твой экземпляр №${r.edition}! 🏆`)
 void useStore.getState().refresh(); load()
 } catch (e) { haptic('warn'); showToast(errRu(e)) }
 setBusy(null)
 }

 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
 <h1>Коллекция 🏆</h1>
 </header>
 <p style={{ color: 'var(--ink-soft)', fontSize: 13, margin: '0 4px 12px' }}>
 Особые вещицы ограниченного тиража. У каждой свой номер. Прозрачно: видно, сколько уже разобрали. Можно подарить другу.
 </p>
 {!data && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Открываю витрину…</p>}
 {data?.drops.map(d => {
 const soldOut = d.minted >= d.cap
 const owned = d.ownedEdition != null
 const canAfford = data.stones >= d.price
 return (
 <div key={d.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
 <span style={{ fontSize: 34 }}>{d.emoji}</span>
 <div style={{ flex: 1, minWidth: 0 }}>
 <b>{d.ru}</b>
 <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Разобрано {d.minted} из {d.cap}</div>
 <div style={{ height: 6, background: 'var(--card-shade)', borderRadius: 4, marginTop: 4, overflow: 'hidden' }}>
 <div style={{ width: `${Math.min(100, (d.minted / d.cap) * 100)}%`, height: '100%', background: 'var(--gold)' }} />
 </div>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
 {owned
 ? <span style={{ fontWeight: 800, color: 'var(--accent-deep)', whiteSpace: 'nowrap' }}>№{d.ownedEdition}</span>
 : <button className="btn" disabled={soldOut || !canAfford || busy === d.id} onClick={() => void claim(d)} style={{ whiteSpace: 'nowrap', padding: '6px 12px' }}>{soldOut ? 'Разобрали' : `${d.price}🦴`}</button>}
 {!soldOut && <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => { haptic('tap'); setGift(d) }}>🎁 Подарить</button>}
 </div>
 </div>
 )
 })}
 {gift && <GiftCollectibleSheet drop={gift} onClose={() => setGift(null)} onDone={load} />}
 </div>
 )
}

function GiftCollectibleSheet({ drop, onClose, onDone }: { drop: Drop; onClose(): void; onDone(): void }) {
 const [friends, setFriends] = useState<Friend[] | null>(null)
 const showToast = useStore(s => s.showToast)
 useEffect(() => { void social.friends().then(p => setFriends(p.friends)).catch(() => setFriends([])) }, [])
 async function give(f: Friend) {
 try {
 const r = await collectibles.gift(drop.id, f.id)
 haptic('success'); showToast(`Подарок №${r.edition} отправлен ${f.name} 🎁`)
 void useStore.getState().refresh(); onDone(); onClose()
 } catch (e) { haptic('warn'); showToast(errRu(e)) }
 }
 return (
 <Sheet onClose={onClose}>
 <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Подарить «{drop.ru}» {drop.emoji}</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 12px' }}>Другу достанется свежий экземпляр со своим номером. Цена подарка {C.COLLECTIBLE_GIFT_FEE}🦴.</p>
 {!friends && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Загружаю друзей…</p>}
 {friends && friends.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Сначала заведи друга во Дворике 💛</p>}
 {friends?.map(f => (
 <button key={f.id} className="goal-row" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => void give(f)}>
 <span style={{ flex: 1, fontWeight: 700 }}>{f.emoji ? `${f.emoji} ` : ''}{f.name}</span>
 <span style={{ color: 'var(--accent-deep)', fontWeight: 800 }}>🎁</span>
 </button>
 ))}
 </Sheet>
 )
}

// ---------- Dressing room / furniture / colours ----------
function DressView({ kind, onBack }: { kind: 'outfits' | 'furniture' | 'colors'; onBack(): void }) {
 const [bag, setBag] = useState<BagDto | null>(null)
 const [activeSlot, setActiveSlot] = useState<string | null>(null)
 const showToast = useStore(s => s.showToast)
 const species = useStore(s => s.state?.pet.species ?? 'dog')
 const load = useCallback(() => { void req<BagDto>('/shop/bag').then(setBag) }, [])
 useEffect(load, [load])

 const title = kind === 'outfits' ? 'Примерочная' : kind === 'furniture' ? 'Домик' : 'Окрасы'
 const equipKind = kind === 'outfits' ? 'outfit' : kind === 'furniture' ? 'room' : 'dye'

 async function equip(slot: string, itemId: string | null, colorId: string) {
 try {
 await req('/shop/equip', { kind: equipKind, slot, itemId, colorId })
 haptic('tap'); load()
 } catch (e) { haptic('warn'); showToast(errRu(e)) }
 }

 if (!bag) return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button><h1>{title}</h1></header>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Открываю сумку…</p>
 </div>
 )

 const slots = kind === 'outfits' ? bag.clothingSlots : kind === 'furniture' ? bag.furnitureSlots : bag.dyeParts.map(p => ({ id: p.id, ru: p.ru }))
 const ownedFor = (slotId: string): OwnedItemDto[] => {
 if (kind === 'colors') return bag.owned.dyes.filter(d => d.itemId === slotId)
 const pool = kind === 'outfits' ? bag.owned.clothing : [...bag.owned.furniture, ...bag.owned.floors, ...bag.owned.wallpapers]
 return pool.filter(i => i.slot === slotId)
 }
 const equippedColor = (slotId: string): string | undefined =>
 kind === 'colors' ? bag.equipped.dyes[slotId] : (kind === 'outfits' ? bag.equipped.outfit[slotId] : bag.equipped.room[slotId])?.colorId
 const equippedItem = (slotId: string): string | undefined =>
 kind === 'colors' ? bag.equipped.dyes[slotId] : (kind === 'outfits' ? bag.equipped.outfit[slotId] : bag.equipped.room[slotId])?.itemId

 // slot -> {itemId,colorId} so the dressing-room preview renders the actual garments + colours
 const equippedOutfit: Record<string, { itemId: string; colorId: string }> = {}
 for (const [slot, entry] of Object.entries(bag.equipped.outfit)) {
  if (entry?.itemId) equippedOutfit[slot] = { itemId: entry.itemId, colorId: entry.colorId ?? '' }
 }

 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
 <h1>{title}</h1>
 </header>

 <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(#cfe6f5, #e8f3d8)' }}>
 <Mascot species={species} size={150} outfit={kind === 'outfits' ? equippedOutfit : undefined} />
 </div>

 {slots.map(s => {
 const owned = ownedFor(s.id)
 const part = kind === 'colors' ? bag.dyeParts.find(p => p.id === s.id) : null
 return (
 <div key={s.id} className="card">
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: owned.length ? 10 : 0 }}>
 <h2>{s.ru}{part && !part.unlocked ? ` 🔒` : ''}</h2>
 {(equippedItem(s.id)) && (
 <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => void equip(s.id, null, '')}>Снять</button>
 )}
 </div>
 {part && !part.unlocked ? (
 <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>Откроется на стадии «{part.stageRu}»</p>
 ) : owned.length === 0 ? (
 <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>Пока ничего нет, загляни в магазин 🛍️</p>
 ) : (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
 {owned.map(it => {
 const on = kind === 'colors' ? equippedColor(s.id) === it.colorId : equippedItem(s.id) === it.itemId && equippedColor(s.id) === it.colorId
 return (
 <button key={`${it.itemId}:${it.colorId}`} title={it.ru} onClick={() => void equip(s.id, kind === 'colors' ? s.id : it.itemId, it.colorId)}
 className={'swatch' + (on ? ' sel' : '')} style={{ width: 52, height: 52, borderRadius: 12, background: it.hex, cursor: 'pointer' }} />
 )
 })}
 </div>
 )}
 </div>
 )
 })}
 </div>
 )
}
