// Browse-only catalogue: every item in the game by category, with owned-colour markers.
// You can't buy here, items must rotate into the shop (everyday collection excepted).
import { useEffect, useState } from 'react'
import { req } from '../../api'
import type { CatalogDto } from './types'
import type { ShopKind } from './ShopFront'

const KIND_OF: Record<ShopKind, string> = { outfit: 'clothing', furniture: 'furniture', color: 'dye' }

export function Catalog({ shop, onBack }: { shop: ShopKind; onBack(): void }) {
 const [data, setData] = useState<CatalogDto | null>(null)
 const [open, setOpen] = useState<string | null>(null)

 useEffect(() => {
 void req<CatalogDto>(`/shop/catalog?kind=${KIND_OF[shop]}`).then(setData)
 }, [shop])

 return (
 <div className="scroll" style={{ paddingTop: 8 }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
 <h1 style={{ flex: 1 }}>Каталог</h1>
 </header>
 <p style={{ margin: '0 4px 12px', fontSize: 13, color: 'var(--ink-soft)' }}>
 Здесь собрано всё на свете. Купить нельзя, жди, пока вещь появится в витрине. Зато можно
 посмотреть, что бывает 👀
 </p>

 {!data && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Листаем каталог…</p>}

 {/* dye parts */}
 {data?.parts?.map(p => (
 <div key={p.id} className="card">
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
 <h2>{p.ru}</h2>
 <span style={{ fontSize: 12, color: p.unlocked ? 'var(--green-deep)' : 'var(--ink-soft)' }}>
 {p.unlocked ? `${p.price} 🦴` : `c «${p.stageRu}»`}
 </span>
 </div>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
 {p.colors.map(col => (
 <span key={col.id} title={`${col.ru}${col.owned ? ' · есть' : ''}`}
 style={{ width: 32, height: 32, borderRadius: '50%', background: col.hex, border: col.owned ? '3px solid var(--brown-deep)' : '2px solid rgba(0,0,0,0.08)' }} />
 ))}
 </div>
 </div>
 ))}

 {/* clothing / furniture groups */}
 {data?.groups?.map(g => (
 <div key={g.id} className="card">
 <button onClick={() => setOpen(open === g.id ? null : g.id)}
 style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
 <h2>{g.ru}</h2>
 <span style={{ color: 'var(--ink-soft)' }}>{g.items.length} · {open === g.id ? '▲' : '▼'}</span>
 </button>
 {open === g.id && (
 <div style={{ marginTop: 10 }}>
 {g.items.map(it => (
 <div key={it.id} className="goal-row" style={{ marginBottom: 8 }}>
 <span style={{ fontSize: 20 }}>{shop === 'furniture' ? '🛋️' : '👕'}</span>
 <span style={{ flex: 1, fontWeight: 800 }}>
 {it.ru} {it.ownedColors.length > 0 && <span style={{ color: 'var(--green-deep)', fontSize: 12 }}>· есть {it.ownedColors.length}</span>}
 </span>
 <span style={{ color: 'var(--ink-soft)' }}>{it.price} 🦴</span>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}

 {/* floors / wallpapers (furniture catalogue tail) */}
 {data && (data.floors?.length || data.wallpapers?.length) ? (
 <div className="card">
 <h2 style={{ marginBottom: 8 }}>Полы и обои</h2>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
 {[...(data.floors ?? []), ...(data.wallpapers ?? [])].map(f => (
 <span key={f.id} title={f.ru} style={{ width: 34, height: 34, borderRadius: 8, background: f.hex, border: f.owned ? '3px solid var(--brown-deep)' : '2px solid rgba(0,0,0,0.08)' }} />
 ))}
 </div>
 </div>
 ) : null}
 </div>
 )
}
