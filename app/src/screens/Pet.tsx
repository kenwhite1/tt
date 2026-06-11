import { useStore } from '../store'
import { Puppy } from '../art/Puppy'

const STAGE_RU: Record<string, string> = {
  baby: 'Малыш', toddler: 'Кроха', child: 'Ребёнок', teen: 'Подросток', adult: 'Взрослый',
}
const PRONOUN_RU: Record<string, string> = { he: 'Он', she: 'Она', they: 'Они' }

export function Pet() {
  const state = useStore(s => s.state)
  if (!state) return null
  const { pet, user } = state
  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ background: 'var(--card-shade)', borderRadius: 18, padding: 6 }}>
          <Puppy size={110} />
        </div>
        <div>
          <h1>{STAGE_RU[pet.stage]} {pet.name}</h1>
          <div style={{ color: 'var(--ink-soft)', fontWeight: 700 }}>{PRONOUN_RU[pet.pronouns]}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-deep)', marginTop: 8 }}>КОД ДРУГА</div>
          <div style={{ fontWeight: 800, letterSpacing: 1.5, color: 'var(--accent-deep)' }}>{user.friendCode} ⧉</div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34 }}>🌞</span>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 20 }}>{user.streak} </b>
          {user.streak === 1 ? 'день подряд' : user.streak < 5 ? 'дня подряд' : 'дней подряд'}
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Лучшая серия заботы о себе: {user.streakBest}</div>
        </div>
        <span style={{ color: 'var(--ink-soft)' }}>›</span>
      </div>

      <h2 style={{ margin: '8px 4px 10px' }}>Коллекция</h2>
      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Микропитомцы</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ background: 'var(--card-shade)', borderRadius: 14, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, opacity: 0.5 }}>👻</div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 800, color: 'var(--brown)' }}>0 / 62 ›</div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Локации</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ background: 'linear-gradient(#9fcf8a, #6da653)', borderRadius: 14, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🌲</div>
          {[0, 1].map(i => (
            <div key={i} style={{ background: 'var(--card-shade)', borderRadius: 14, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, opacity: 0.5 }}>❓</div>
          ))}
        </div>
        <div style={{ fontSize: 13, textAlign: 'center', marginTop: 6, fontWeight: 700 }}>Щенячий лес — 1%</div>
        <div style={{ textAlign: 'center', marginTop: 6, fontWeight: 800, color: 'var(--brown)' }}>1 / 27 ›</div>
      </div>
    </div>
  )
}
