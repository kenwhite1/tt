import { useStore } from '../store'

export function Friends() {
  const code = useStore(s => s.state?.user.friendCode ?? '')
  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 14 }}>Дворик</h1>
      <div className="card" style={{ background: 'linear-gradient(180deg, #b6d7a8 0%, #93c47d 100%)', textAlign: 'center', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 64 }}>🌳</div>
        <p style={{ fontWeight: 800, color: '#3d5c2e' }}>Здесь будут сидеть щенки твоих друзей</p>
      </div>
      <button className="btn" style={{ width: '100%', marginBottom: 12 }}>＋ Добавить друга</button>
      <div className="card" style={{ background: '#3d5c2e', color: '#fff' }}>
        <b style={{ color: 'var(--gold)' }}>ПОЗНАКОМЬСЯ С КОРОВОЙ ПЕЧЕНЬКОЙ</b>
        <div>Пригласи друзей — получишь микропитомца!</div>
      </div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 800 }}>КОД ДРУГА</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: 'var(--accent-deep)' }}>{code}</div>
      </div>
    </div>
  )
}
