import { C } from '@shared/constants'
import { useStore } from '../../store'

// Pet-friendship progress strip at the bottom of the Quests tab.
export function FriendshipStrip() {
 const pet = useStore(s => s.state?.pet)
 if (!pet) return null

 const level = pet.friendshipLevel
 const maxed = level >= C.FRIENDSHIP_PTS.length
 const prev = level > 0 ? C.FRIENDSHIP_PTS[level - 1] : 0
 const next = maxed ? null : C.FRIENDSHIP_PTS[level]
 const pct = next == null ? 100 : Math.min(100, ((pet.friendshipPts - prev) / (next - prev)) * 100)

 return (
 <div className="card" style={{ background: 'linear-gradient(135deg, #fff3d6, #ffe5ec)', padding: '14px 16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
 <span style={{ fontSize: 24 }}>💛</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>Дружба с {pet.name}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 Уровень {level} из {C.FRIENDSHIP_PTS.length}
 {next != null && <> · следующий за {C.FRIENDSHIP_LEVEL_STONES} 🦴</>}
 </div>
 </div>
 </div>
 <div className="energy-track" style={{ height: 12 }}>
 <div className="energy-fill" style={{ width: `${Math.max(0, pct)}%`, background: 'linear-gradient(90deg, #ffd1dc, #ff9eb5)' }} />
 </div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 700, marginTop: 6, textAlign: 'right' }}>
 {maxed
 ? 'Вы, не разлей вода! 🐾'
 : `${Math.floor(pet.friendshipPts)} / ${next} очков дружбы`}
 </div>
 </div>
 )
}
