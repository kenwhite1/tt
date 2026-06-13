// Магазин — 4-way chooser into the three item shops + the travel agency.
import { useState } from 'react'
import { useStore } from '../store'
import { haptic } from '../telegram'
import { ShopFront, type ShopKind } from './shop/ShopFront'
import { TravelAgency } from './travel/TravelAgency'

const SHOPS: { id: ShopKind; ru: string; emoji: string; npc: string }[] = [
  { id: 'outfit', ru: 'Одежда', emoji: '🦔', npc: 'Ёж Колюч' },
  { id: 'furniture', ru: 'Мебель', emoji: '🐦‍⬛', npc: 'БУДКЕА' },
  { id: 'color', ru: 'Окрас', emoji: '🦎', npc: 'Студия Тео' },
]

type View = 'menu' | ShopKind | 'travel'

export function Shop() {
  const stones = useStore(s => s.state?.user.stones ?? 0)
  const [view, setView] = useState<View>('menu')
  const open = (v: View) => { haptic('tap'); setView(v) }

  if (view === 'travel') return <TravelAgency onBack={() => setView('menu')} />
  if (view !== 'menu') return <ShopFront shop={view} onBack={() => setView('menu')} />

  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1>Магазин</h1>
        <div className="card" style={{ margin: 0, padding: '8px 14px', fontWeight: 800 }}>🦴 {stones}</div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SHOPS.map(s => (
          <button key={s.id} className="card" style={{ margin: 0, textAlign: 'center', border: 'none', cursor: 'pointer' }} onClick={() => open(s.id)}>
            <div style={{ fontSize: 44 }}>{s.emoji}</div>
            <h2>{s.ru}</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{s.npc}</div>
          </button>
        ))}
        <button className="card" style={{ margin: 0, textAlign: 'center', border: 'none', cursor: 'pointer' }} onClick={() => open('travel')}>
          <div style={{ fontSize: 44 }}>✈️</div>
          <h2>Путешествия</h2>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Хвост-трэвел · Сасси</div>
        </button>
      </div>
    </div>
  )
}
