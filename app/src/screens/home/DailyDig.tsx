// «Косточка дня» — once-a-day dig on Home. 1/day, resets at wake−2h. Shareable result.
import { useEffect, useState } from 'react'
import type { DigResultDto } from '@shared/types'
import { daily } from '../friends/api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import { playSfx } from '../../sound'
import { ShareSheet } from '../../share'

const TIER_RU = ['Обычная находка', 'Редкая находка', 'Очень редкая находка!']

export function DailyDig() {
  const species = useStore(s => s.state?.pet.species ?? 'dog')
  const petName = useStore(s => s.state?.pet.name ?? 'Шарик')
  const [dug, setDug] = useState<boolean | null>(null)
  const [result, setResult] = useState<DigResultDto | null>(null)
  const [streak, setStreak] = useState(0)
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState(false)
  const [friendDigs, setFriendDigs] = useState<{ name: string; emoji: string }[]>([])

  useEffect(() => {
    daily.today().then(d => { setDug(d.dug); setResult(d.result); setStreak(d.streak) }).catch(() => setDug(false))
    daily.friends().then(d => setFriendDigs(d.digs)).catch(() => { /* ignore */ })
  }, [])

  async function dig() {
    if (busy) return
    setBusy(true); haptic('tap')
    try {
      const r = await daily.dig()
      setResult(r.result); setDug(true); setStreak(r.streak)
      haptic('success'); playSfx('complete')
      void useStore.getState().refresh()
    } catch { haptic('warn') }
    setBusy(false)
  }

  if (dug === null) return null

  if (!dug) {
    return (
      <button className="card" onClick={() => void dig()} disabled={busy}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(160deg, #f4d58b, #e9b24a)' }}>
        <span style={{ fontSize: 30 }}>🦴</span>
        <div style={{ flex: 1 }}>
          <b style={{ color: '#5a3d12' }}>Раскопать косточку дня</b>
          <div style={{ fontSize: 13, color: '#6b4d1e' }}>{petName} что-нибудь да найдёт · 1 раз в день</div>
        </div>
        <span style={{ fontSize: 22, color: '#5a3d12' }}>⛏️</span>
      </button>
    )
  }

  return (
    <div className="card" style={{ background: '#fbf3df' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34 }}>{result?.emoji ?? '🦴'}</span>
        <div style={{ flex: 1 }}>
          <b>{petName} выкопал {result?.ru ?? 'косточку'}</b>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            {result ? TIER_RU[result.tier] : ''} · +{result?.stones ?? 0}🦴{streak > 1 ? ` · ${streak} дн подряд` : ''}
          </div>
        </div>
        <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => { haptic('tap'); setShare(true) }}>Поделиться</button>
      </div>
      {friendDigs.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
          Сегодня друзья выкопали: {friendDigs.slice(0, 6).map(f => f.emoji).join(' ')}
        </div>
      )}
      {share && result && (
        <ShareSheet
          opts={{ kind: 'dig', ref: result.ref, species, headline: `${petName} выкопал ${result.ru}!`, subtitle: TIER_RU[result.tier], emoji: result.emoji }}
          text={`Моя косточка дня в Шарике: ${result.emoji} ${result.ru}`}
          onClose={() => { setShare(false); void daily.markShared() }}
        />
      )}
    </div>
  )
}
