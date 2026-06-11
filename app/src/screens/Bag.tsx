const SECTIONS = [
  { id: 'mail', ru: 'Почта', emoji: '📮', full: true, locked: false },
  { id: 'outfits', ru: 'Одежда', emoji: '👕', full: false, locked: false },
  { id: 'furniture', ru: 'Мебель', emoji: '🛋️', full: false, locked: false },
  { id: 'colors', ru: 'Окрасы', emoji: '🎨', full: false, locked: true },
  { id: 'micropets', ru: 'Микропитомцы', emoji: '🐾', full: false, locked: true },
]

export function Bag() {
  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <div style={{ textAlign: 'center', fontSize: 56, marginBottom: 4 }}>🎒</div>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>Сумка щенка</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className="card"
            style={{
              margin: 0, textAlign: 'center', border: 'none',
              gridColumn: s.full ? '1 / -1' : undefined,
              opacity: s.locked ? 0.55 : 1, cursor: s.locked ? 'default' : 'pointer',
            }}
          >
            <div style={{ fontSize: 40 }}>{s.locked ? '❓' : s.emoji}</div>
            <h2>{s.ru}</h2>
          </button>
        ))}
      </div>
    </div>
  )
}
