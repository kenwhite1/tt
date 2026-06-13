// Микропедия, collection index of all 62 species; unknown ones show as «???» silhouettes.
// Used from the Bag micropets section and from the Щенок profile tab.
import { useEffect, useState } from 'react'
import { req } from '../../api'
import { haptic } from '../../telegram'
import { Micropet } from '../../art/Micropet'

export interface PediaVariant { id: string; hex: string; ruColor: string; owned: boolean; count: number }
export interface PediaSpecies {
 id: string; ruName: string; speciesRu: string; emoji: string; known: boolean
 count: number; origin: string; eventHint: string | null; description: string
 variants: PediaVariant[]
}
interface PediaDto { species: PediaSpecies[]; owned: number; total: number }

const UNKNOWN_HEX = '#BFB6A8'

export function Micropedia({ onBack }: { onBack(): void }) {
 const [data, setData] = useState<PediaDto | null>(null)
 const [openId, setOpenId] = useState<string | null>(null)

 useEffect(() => {
 req<PediaDto>('/micropets/micropedia').then(setData).catch(() => {})
 }, [])

 const open = data?.species.find(s => s.id === openId) ?? null

 return (
 <>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 2px 12px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={onBack}>‹</button>
 <h1 style={{ flex: 1 }}>📖 Микропедия</h1>
 {data && (
 <span style={{ fontWeight: 800, color: 'var(--brown)' }}>{data.owned} / {data.total}</span>
 )}
 </div>

 {open && (
 <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
 <Micropet
 speciesId={open.id}
 variantHex={open.variants.find(v => v.owned)?.hex ?? open.variants[0]?.hex}
 size={64}
 />
 <div style={{ flex: 1 }}>
 <b>{open.ruName}</b> {open.emoji}
 {open.count > 1 && (
 <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 800, color: 'var(--accent-deep)' }}>×{open.count}</span>
 )}
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{open.description}</div>
 {open.eventHint && (
 <div style={{ fontSize: 12, color: 'var(--accent-deep)', fontWeight: 700, marginTop: 4 }}>🎪 {open.eventHint}</div>
 )}
 <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
 {open.variants.map(v => (
 <span
 key={v.id}
 title={v.ruColor}
 style={{
 width: 16, height: 16, borderRadius: '50%',
 background: v.owned ? v.hex : 'var(--card-shade)',
 border: `2px solid ${v.owned ? 'var(--brown)' : 'var(--ink-soft)'}`,
 opacity: v.owned ? 1 : 0.5,
 }}
 />
 ))}
 </div>
 </div>
 </div>
 )}

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingBottom: 8 }}>
 {!data && <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Загружаю…</div>}
 {data?.species.map(s => (
 <button
 key={s.id}
 className="card"
 onClick={() => {
 if (!s.known) return
 haptic('tap')
 setOpenId(openId === s.id ? null : s.id)
 }}
 style={{
 margin: 0, padding: '10px 6px', border: 'none', textAlign: 'center',
 cursor: s.known ? 'pointer' : 'default',
 outline: openId === s.id ? '3px solid var(--gold)' : 'none',
 position: 'relative',
 }}
 >
 <div style={{ opacity: s.known ? 1 : 0.45, filter: s.known ? 'none' : 'grayscale(1)' }}>
 <Micropet
 speciesId={s.id}
 variantHex={s.known ? (s.variants.find(v => v.owned)?.hex ?? s.variants[0]?.hex) : UNKNOWN_HEX}
 size={48}
 />
 </div>
 {s.known && s.count > 1 && (
 <span style={{
 position: 'absolute', top: 6, right: 8, fontSize: 11, fontWeight: 800,
 background: 'var(--gold)', borderRadius: 999, padding: '1px 6px', color: 'var(--brown-deep)',
 }}>×{s.count}</span>
 )}
 <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4, color: s.known ? 'var(--ink)' : 'var(--ink-soft)' }}>
 {s.known ? s.ruName.split(' ')[0] : '???'}
 </div>
 {s.known && (
 <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
 {s.variants.map(v => (
 <span key={v.id} style={{
 width: 9, height: 9, borderRadius: '50%',
 background: v.owned ? v.hex : 'var(--card-shade)',
 border: '1.5px solid ' + (v.owned ? 'var(--brown)' : 'var(--ink-soft)'),
 }} />
 ))}
 </div>
 )}
 </button>
 ))}
 </div>
 </>
 )
}
