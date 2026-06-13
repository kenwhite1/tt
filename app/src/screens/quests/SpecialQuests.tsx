import type { SpecialDto } from './types'

const METRIC_EMOJI: Record<string, string> = {
 clothing: '👕', furniture: '🛋️', micropets: '🐾', locations: '🗺️', stage: '🌱', friendship: '💛',
}

interface Props {
 special: SpecialDto[]
 onClaim(id: string): void
}

export function SpecialQuests({ special, onClaim }: Props) {
 return (
 <>
 <h2 style={{ margin: '14px 4px 4px' }}>Особые задания</h2>
 <p style={{ margin: '0 4px 10px', fontSize: 13, color: 'var(--ink-soft)' }}>
 Долгие цели, по {special[0]?.reward ?? 100} 🦴 за каждый уровень
 </p>
 {special.map(track => {
 const allDone = track.target == null
 const pct = allDone ? 100 : Math.min(100, (track.value / track.target!) * 100)
 return (
 <div key={track.id} className="card" style={{ padding: '12px 14px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <span style={{ fontSize: 22 }}>{METRIC_EMOJI[track.metric] ?? '⭐'}</span>
 <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{track.ru}</div>
 {track.claimable && (
 <button
 className="btn accent"
 style={{ padding: '8px 14px', fontSize: 14, whiteSpace: 'nowrap' }}
 onClick={() => onClaim(track.id)}
 >
 Забрать {track.reward} 🦴
 </button>
 )}
 </div>
 <div className="energy-track" style={{ height: 12, margin: '10px 0 6px' }}>
 <div className="energy-fill" style={{ width: `${pct}%` }} />
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 700 }}>
 {allDone ? (
 <span>Все уровни пройдены, ты чудо! 🎉</span>
 ) : (
 <span>{Math.min(track.value, track.target!)} / {track.target}</span>
 )}
 <span>уровень {Math.min(track.tier + 1, track.totalTiers)} из {track.totalTiers}</span>
 </div>
 </div>
 )
 })}
 </>
 )
}
