// Discoveries logbook, likes (blue) / dislikes (red) by category. Used from Pet.tsx.
import { useEffect, useState } from 'react'
import { req } from '../../api'

interface Disc { id: string; ruName: string; category: string; liked: boolean; day: string; locationRu: string | null }
interface DiscoveriesRes { total: number; found: number; discoveries: Disc[] }

const CATS = [
 { id: 'food', ru: 'Еда', emoji: '🍩' },
 { id: 'drinks', ru: 'Напитки', emoji: '🍹' },
 { id: 'music', ru: 'Музыка', emoji: '🎵' },
 { id: 'books', ru: 'Книги', emoji: '📚' },
 { id: 'films', ru: 'Фильмы', emoji: '🎬' },
 { id: 'activities', ru: 'Занятия', emoji: '🎈' },
]

export function Discoveries({ onBack }: { onBack(): void }) {
 const [data, setData] = useState<DiscoveriesRes | null>(null)
 const [cat, setCat] = useState('food')
 useEffect(() => { req<DiscoveriesRes>('/travel/discoveries').then(setData).catch(() => {}) }, [])

 const inCat = (data?.discoveries ?? []).filter(d => d.category === cat)

 return (
 <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 8px)' }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 8px' }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
 <h1 style={{ flex: 1 }}>Открытия</h1>
 {data && <div className="card" style={{ margin: 0, padding: '8px 14px', fontWeight: 800 }}>{data.found} / {data.total}</div>}
 </header>

 <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 14px 10px' }}>
 {CATS.map(c => (
 <button
 key={c.id}
 className="btn ghost"
 style={{
 padding: '8px 12px', fontSize: 14, whiteSpace: 'nowrap',
 background: cat === c.id ? 'var(--gold)' : 'var(--card)',
 }}
 onClick={() => setCat(c.id)}
 >{c.emoji} {c.ru}</button>
 ))}
 </div>

 <div className="scroll">
 {!data ? (
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Открываем дневник…</p>
 ) : inCat.length === 0 ? (
 <div className="card" style={{ textAlign: 'center' }}>
 <div style={{ fontSize: 40 }}>🔍</div>
 <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)' }}>
 Здесь пока пусто. Щенок делает открытия на прогулках, поговори с ним, когда он вернётся!
 </p>
 </div>
 ) : (
 inCat.map(d => (
 <div
 key={d.id}
 className="goal-row"
 style={{
 background: d.liked ? '#e3eefb' : '#fdeceb',
 border: `2px solid ${d.liked ? '#4f86c6' : 'var(--red)'}`,
 }}
 >
 <span style={{ fontSize: 24 }}>{d.liked ? '💙' : '💔'}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{d.ruName}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 {d.liked ? 'Нравится' : 'Не нравится'}{d.locationRu ? ` · ${d.locationRu}` : ''} · {d.day}
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )
}
