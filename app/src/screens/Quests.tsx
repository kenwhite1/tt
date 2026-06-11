export function Quests() {
  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 14 }}>Задания</h1>
      <div className="card" style={{ background: 'linear-gradient(135deg, #cfe6f5, #e8f3d8)', textAlign: 'center' }}>
        <h2>🌞 Летний дворик</h2>
        <p style={{ color: 'var(--ink-soft)' }}>Сезонное событие откроется после 3 дней в приложении</p>
      </div>
      <div className="card">
        <h2>Ежедневные задания</h2>
        <p style={{ color: 'var(--ink-soft)' }}>Скоро здесь появятся задания на каждый день — по 25 🦴 за каждое</p>
      </div>
      <div className="card">
        <h2>Недельные звёзды</h2>
        <p style={{ color: 'var(--ink-soft)' }}>Выполняй цели из сфер заботы 2 / 4 / 6 дней в неделю — 20 / 50 / 100 🦴</p>
      </div>
      <div className="card">
        <h2>Особые задания</h2>
        <p style={{ color: 'var(--ink-soft)' }}>Долгие цели: коллекции, путешествия, дружба со щенком</p>
      </div>
    </div>
  )
}
