import { C } from '@shared/constants'
import type { WeeklyDto } from './types'

interface Props {
 weekly: WeeklyDto[]
 onClaim(sca: string, tier: number): void
}

export function WeeklyStars({ weekly, onClaim }: Props) {
 return (
 <>
 <h2 style={{ margin: '14px 4px 4px' }}>Недельные звёзды</h2>
 <p style={{ margin: '0 4px 10px', fontSize: 13, color: 'var(--ink-soft)' }}>
 Выполняй цели из сфер заботы в разные дни недели: {C.WEEKLY_MILESTONES.map(m => m.days).join(' / ')} дней -{' '}
 {C.WEEKLY_MILESTONES.map(m => m.stones).join(' / ')} 🦴
 </p>
 {weekly.length === 0 && (
 <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
 Привяжи свои цели к сферам заботы, и каждую неделю здесь будут появляться звёзды ⭐
 </div>
 )}
 {weekly.map(w => (
 <div key={w.sca} className="card" style={{ padding: '12px 14px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
 <span
 style={{
 width: 34, height: 34, borderRadius: 10, background: w.color,
 display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
 }}
 >
 {w.emoji}
 </span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{w.ru}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 {w.days} {plural(w.days)} с целями на этой неделе
 </div>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 {C.WEEKLY_MILESTONES.map((m, tier) => {
 const isClaimed = !!(w.claimed & (1 << tier))
 const reachable = w.days >= m.days
 return (
 <button
 key={tier}
 disabled={isClaimed || !reachable}
 onClick={() => onClaim(w.sca, tier)} className={reachable && !isClaimed ? 'star-tier' : undefined}
 style={{
 flex: 1, border: 'none', borderRadius: 14, padding: '8px 4px', cursor: reachable && !isClaimed ? 'pointer' : 'default',
 background: isClaimed ? 'var(--card-shade)' : reachable ? 'var(--gold)' : 'var(--card-shade)',
 boxShadow: reachable && !isClaimed ? '0 3px 0 var(--accent-deep)' : 'none',
 opacity: isClaimed ? 0.65 : 1, fontFamily: 'inherit',
 }}
 >
 <div style={{ fontSize: 20 }}>{isClaimed || reachable ? '⭐' : '☆'}</div>
 <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
 {isClaimed ? 'Получено' : reachable ? `Забрать ${m.stones} 🦴` : `${m.days} дн. → ${m.stones} 🦴`}
 </div>
 </button>
 )
 })}
 </div>
 </div>
 ))}
 </>
 )
}

function plural(n: number): string {
 const mod10 = n % 10, mod100 = n % 100
 if (mod10 === 1 && mod100 !== 11) return 'день'
 if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
 return 'дней'
}
