// One shared shop front for the three item shops: Одежда (ёж Колюч), Мебель (сорока
// Соро́ка, «БУДКЕА»), Окрас (хамелеон Тео). 12 rotating slots, refresh ladder, daily
// gift, everyday collection, catalog + sell, buy/gift sheets.
import { useCallback, useEffect, useState } from 'react'
import { req } from '../../api'
import { haptic } from '../../telegram'
import { useStore } from '../../store'
import { Catalog } from './Catalog'
import { SellScreen } from './SellScreen'
import { GiftModal } from './GiftModal'
import type { GiftMode } from './GiftModal'
import { errRu } from './types'
import { BoneIcon } from '../../art/icons'
import type { EverydayDto, FloorDto, ListingDto, ShopDto, WallpaperDto } from './types'

export type ShopKind = 'outfit' | 'furniture' | 'color'

const NPC: Record<ShopKind, { emoji: string; name: string; greet: string }> = {
 outfit: { emoji: '🦔', name: 'Ёж Колюч', greet: 'Привет! Я как раз разложил обновки. Примеришь что-нибудь?' },
 furniture: { emoji: '🐦‍⬛', name: 'Соро́ка из «БУДКЕА»', greet: 'Заходи-заходи! Натащила тебе блестящих штучек для домика.' },
 color: { emoji: '🦎', name: 'Хамелеон Тео', greet: 'О, новые краски подоспели! Подберём питомцу настроение?' },
}

export function ShopFront({ shop, onBack }: { shop: ShopKind; onBack(): void }) {
 const [data, setData] = useState<ShopDto | null>(null)
 const [sub, setSub] = useState<'front' | 'catalog' | 'sell'>('front')
 const [sheet, setSheet] = useState<{ listing: ListingDto; slot: number } | null>(null)
 const [everydaySheet, setEverydaySheet] = useState<EverydayDto | null>(null)
 const [pickedColor, setPickedColor] = useState<string | null>(null)
 const [gift, setGift] = useState<{ mode: GiftMode; ru: string } | null>(null)
 const [giftCard, setGiftCard] = useState<number | null>(null)
 const [busy, setBusy] = useState(false)
 const showToast = useStore(s => s.showToast)

 const load = useCallback(async () => {
 const r = await req<ShopDto>(`/shop/${shop}`)
 setData(r)
 if (r.npcGift) {
 setGiftCard(r.npcGift)
 haptic('success')
 void useStore.getState().refresh()
 }
 }, [shop])

 useEffect(() => { setData(null); setSub('front'); void load() }, [load])

 async function refreshSlots() {
 if (!data || busy) return
 setBusy(true)
 try {
 const r = await req<ShopDto>(`/shop/${shop}/refresh`, {})
 haptic('success')
 setData(r)
 void useStore.getState().refresh()
 } catch (e) { haptic('warn'); showToast(errRu(e)) }
 setBusy(false)
 }

 async function buy(body: { slot: number } | { itemId: string; colorId: string }) {
 if (busy) return
 setBusy(true)
 try {
 const r = await req<{ ru: string }>(`/shop/${shop}/buy`, body)
 haptic('success')
 showToast(`Куплено: ${r.ru} 🎉`)
 setSheet(null); setEverydaySheet(null); setPickedColor(null)
 void useStore.getState().refresh()
 await load()
 } catch (e) { haptic('warn'); showToast(errRu(e)) }
 setBusy(false)
 }

 if (sub === 'catalog') return <Catalog shop={shop} onBack={() => setSub('front')} />
 if (sub === 'sell') return <SellScreen onBack={() => { setSub('front'); void load() }} />

 const npc = NPC[shop]

 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
 <h1 style={{ flex: 1 }}>{shop === 'outfit' ? 'Одежда' : shop === 'furniture' ? 'БУДКЕА' : 'Студия окраса'}</h1>
 <button className="btn ghost" style={{ padding: '8px 12px' }} title="Каталог" onClick={() => setSub('catalog')}>📖</button>
 <button className="btn ghost" style={{ padding: '8px 12px' }} title="Продать" onClick={() => setSub('sell')}>💰</button>
 <div className="card" style={{ margin: 0, padding: '8px 12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><BoneIcon size={18} /> {data?.stones ?? '…'}</div>
 </header>

 {/* NPC greeting */}
 <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
 <span style={{ fontSize: 40 }}>{npc.emoji}</span>
 <div>
 <b>{npc.name}</b>
 <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{npc.greet}</div>
 </div>
 </div>

 {!data && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Раскладываем товары…</p>}

 {data && (
 <>
 {/* Plus 50%-off listing / hint */}
 {data.discount ? (
 <button
 className="card"
 style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', border: '2px dashed var(--accent)', cursor: 'pointer', textAlign: 'left' }}
 onClick={() => setSheet({ listing: data.discount!, slot: 12 })}
 >
 <span className="swatch" style={{ width: 40, height: 40, borderRadius: 12, background: data.discount.hex, flexShrink: 0 }} />
 <div style={{ flex: 1 }}>
 <b>−50% сегодня: {data.discount.ru}</b>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{data.discount.colorRu}</div>
 </div>
 <b>{data.discount.sold ? 'КУПЛЕНО' : `${data.discount.price} 🦴`}</b>
 </button>
 ) : (
 <div className="card" style={{ background: 'var(--card-shade)', fontSize: 14, color: 'var(--ink-soft)' }}>
 ⭐ С «Шарик Плюс» здесь была бы вещь со скидкой −50% и ещё 6 витрин ниже.
 </div>
 )}

 {/* refresh */}
 <button className="btn ghost" style={{ width: '100%', marginBottom: 14 }} disabled={busy} onClick={() => void refreshSlots()}>
 🔄 Обновить витрину {data.nextRefreshCost === 0 ? '(бесплатно)' : `(${data.nextRefreshCost} 🦴)`}
 </button>

 {/* 12 slots */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 {data.slots.map((l, i) => (
 <SlotCard key={i} l={l} onTap={() => {
 if (l.locked) { showToast('Эта витрина откроется с «Шарик Плюс» ⭐'); return }
 setSheet({ listing: l, slot: i })
 }} />
 ))}
 </div>

 {/* dye stage info */}
 {shop === 'color' && (
 <div className="card" style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-soft)' }}>
 ✨ Краски открываются по мере роста питомца:{' '}
 {data.dyeParts.map(p => `${p.ru.toLowerCase()}, ${p.stageRu.toLowerCase()}`).join(', ')}.
 </div>
 )}

 {/* Everyday collection */}
 {data.everyday.length > 0 && (
 <>
 <h2 style={{ margin: '18px 4px 10px' }}>Повседневная коллекция</h2>
 <p style={{ margin: '0 4px 10px', fontSize: 13, color: 'var(--ink-soft)' }}>Эти вещи всегда в наличии, выбирай любой цвет.</p>
 {data.everyday.map(it => (
 <button key={it.id} className="goal-row" style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setEverydaySheet(it); setPickedColor(null) }}>
 <span style={{ fontSize: 22 }}>{shop === 'outfit' ? '👕' : '🛋️'}</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{it.ru}</span>
 <b>{it.price} 🦴</b>
 </button>
 ))}
 </>
 )}

 {/* furniture extras: floors & wallpapers */}
 {shop === 'furniture' && (
 <>
 <h2 style={{ margin: '18px 4px 10px' }}>Полы</h2>
 <SwatchGrid items={data.floors.map(f => ({ id: f.id, ru: `${f.ru} · ${f.styleRu}`, hex: f.hex, price: f.price, owned: f.owned }))}
 onBuy={id => void buy({ itemId: id, colorId: '' })} />
 <h2 style={{ margin: '18px 4px 10px' }}>Обои</h2>
 <SwatchGrid items={data.wallpapers.map(w => ({ id: w.id, ru: w.ru, hex: w.hex, price: w.price, owned: w.owned }))}
 onBuy={id => void buy({ itemId: id, colorId: '' })} />
 </>
 )}
 </>
 )}

 {/* daily gift card from ёж Колюч */}
 {giftCard !== null && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setGiftCard(null)}>
 <div className="card gift-pop" style={{ width: '82%', textAlign: 'center', position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
 <span className="gift-burst" aria-hidden />
 <div style={{ fontSize: 52 }}>🦔</div>
 <h2>Подарочек от Колюча!</h2>
 <p style={{ color: 'var(--ink-soft)' }}>«Рад тебя видеть! Держи горсть косточек, заходи почаще.»</p>
 <p style={{ fontSize: 26, fontWeight: 800, margin: '8px 0' }}>+{giftCard} 🦴</p>
 <button className="btn accent" onClick={() => setGiftCard(null)}>Спасибо!</button>
 </div>
 </div>
 )}

 {/* slot purchase sheet */}
 {sheet && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 44, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSheet(null)}>
 <div className="card" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))' }} onClick={e => e.stopPropagation()}>
 <div style={{ textAlign: 'center' }}>
 <span className="swatch" style={{ display: 'inline-block', width: 64, height: 64, borderRadius: 18, background: sheet.listing.hex }} />
 <h2 style={{ marginTop: 8 }}>{sheet.listing.ru}</h2>
 <p style={{ color: 'var(--ink-soft)', margin: '4px 0 2px' }}>
 {sheet.listing.colorRu}{sheet.listing.location ? ` · 📍 из локации «${data?.locationRu}»` : ''}
 </p>
 {sheet.listing.stageLocked && (
 <p style={{ color: 'var(--red)', fontSize: 14 }}>Откроется на стадии «{sheet.listing.stageRu}»</p>
 )}
 </div>
 {sheet.listing.sold ? (
 <p style={{ textAlign: 'center', fontWeight: 800, margin: '12px 0' }}>КУПЛЕНО, уже в твоей сумке 🎒</p>
 ) : (
 <button className="btn accent" style={{ width: '100%', marginTop: 12 }} disabled={busy || sheet.listing.stageLocked}
 onClick={() => void buy({ slot: sheet.slot })}>
 Купить за {sheet.listing.price} 🦴
 </button>
 )}
 {shop !== 'color' && !sheet.listing.sold && (
 <button className="btn ghost" style={{ width: '100%', marginTop: 10 }}
 onClick={() => {
 setGift({
 mode: { type: 'slot', shop, slot: sheet.slot, kind: sheet.listing.kind, itemId: sheet.listing.itemId, colorId: sheet.listing.colorId, price: sheet.listing.price },
 ru: `${sheet.listing.ru} (${sheet.listing.colorRu.toLowerCase()})`,
 })
 setSheet(null)
 }}>
 🎁 Подарить другу
 </button>
 )}
 </div>
 </div>
 )}

 {/* everyday colour-picker sheet */}
 {everydaySheet && data && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 44, display: 'flex', alignItems: 'flex-end' }} onClick={() => setEverydaySheet(null)}>
 <div className="card" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))' }} onClick={e => e.stopPropagation()}>
 <h2 style={{ textAlign: 'center' }}>{everydaySheet.ru}</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '4px 0 10px' }}>Выбери цвет</p>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
 {data.palette.map(p => {
 const ownedAlready = everydaySheet.ownedColors.includes(p.id)
 return (
 <button key={p.id} disabled={ownedAlready} onClick={() => setPickedColor(p.id)} aria-label={p.ru} className={'swatch' + (pickedColor === p.id ? ' sel' : '')}
 style={{
 width: 42, height: 42, borderRadius: '50%', background: p.hex, cursor: 'pointer', opacity: ownedAlready ? 0.25 : 1,
 border: 'none',
 }} />
 )
 })}
 </div>
 <button className="btn accent" style={{ width: '100%' }} disabled={!pickedColor || busy}
 onClick={() => pickedColor && void buy({ itemId: everydaySheet.id, colorId: pickedColor })}>
 Купить за {everydaySheet.price} 🦴
 </button>
 </div>
 </div>
 )}

 {gift && (
 <GiftModal mode={gift.mode} itemRu={gift.ru} onClose={() => setGift(null)} onDone={() => { setGift(null); void load() }} />
 )}
 </div>
 )
}

function SlotCard({ l, onTap }: { l: ListingDto; onTap(): void }) {
 return (
 <button className="card slot-card" onClick={onTap} style={{
 margin: 0, padding: 12, textAlign: 'center', cursor: 'pointer', border: 'none', position: 'relative',
 background: l.location ? '#eef6e3' : 'var(--card)', opacity: l.sold ? 0.6 : 1,
 }}>
 {l.location && <span className="slot-badge" style={{ top: 8, left: 8 }}>📍</span>}
 {l.locked && <span className="slot-badge" style={{ top: 8, right: 8 }}>🔒</span>}
 <span className="swatch" style={{ display: 'inline-block', width: 44, height: 44, borderRadius: 14, background: l.hex, filter: l.locked ? 'grayscale(0.7)' : undefined }} />
 <div style={{ fontWeight: 800, fontSize: 13, minHeight: 34, marginTop: 6 }}>{l.ru}</div>
 <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{l.colorRu}</div>
 <div style={{ fontWeight: 800, marginTop: 4 }}>
 {l.sold ? 'КУПЛЕНО' : l.locked ? 'Плюс ⭐' : `${l.price} 🦴`}
 </div>
 {l.stageLocked && !l.locked && <div style={{ fontSize: 11, color: 'var(--red)' }}>с стадии «{l.stageRu}»</div>}
 </button>
 )
}

function SwatchGrid({ items, onBuy }: {
 items: { id: string; ru: string; hex: string; price: number; owned: boolean }[]
 onBuy(id: string): void
}) {
 const [open, setOpen] = useState<string | null>(null)
 return (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
 {items.map(it => (
 <button key={it.id} onClick={() => setOpen(open === it.id ? null : it.id)} title={it.ru}
 style={{
 width: 52, borderRadius: 12, border: 'none', background: 'var(--card)', boxShadow: 'var(--shadow-lip)',
 padding: 4, cursor: 'pointer', opacity: it.owned ? 0.35 : 1,
 }}>
 <span className="swatch" style={{ display: 'block', height: 36, borderRadius: 8, background: it.hex }} />
 {open === it.id && !it.owned && (
 <span className="btn accent" style={{ display: 'block', fontSize: 11, padding: '4px 2px', marginTop: 4 }}
 onClick={e => { e.stopPropagation(); onBuy(it.id); setOpen(null) }}>
 {it.price}🦴
 </span>
 )}
 {open === it.id && it.owned && <span style={{ fontSize: 10, fontWeight: 800 }}>есть</span>}
 </button>
 ))}
 </div>
 )
}
