import { useStore } from '../store'

const SHOPS = [
  { id: 'outfit', ru: 'Одежда', emoji: '👕', npc: 'Ёж Колюч' },
  { id: 'furniture', ru: 'Мебель', emoji: '🛋️', npc: 'БУДКЕА' },
  { id: 'color', ru: 'Окрас', emoji: '🎨', npc: 'Студия Тео' },
  { id: 'travel', ru: 'Путешествия', emoji: '✈️', npc: 'Хвост-трэвел' },
]

export function Shop() {
  const stones = useStore(s => s.state?.user.stones ?? 0)
  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1>Магазин</h1>
        <div className="card" style={{ margin: 0, padding: '8px 14px', fontWeight: 800 }}>🦴 {stones}</div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SHOPS.map(s => (
          <button key={s.id} className="card" style={{ margin: 0, textAlign: 'center', border: 'none', cursor: 'pointer' }}>
            <div style={{ fontSize: 44 }}>{s.emoji}</div>
            <h2>{s.ru}</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{s.npc}</div>
          </button>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginTop: 16 }}>
        Витрины откроются совсем скоро 🐾
      </p>
    </div>
  )
}
