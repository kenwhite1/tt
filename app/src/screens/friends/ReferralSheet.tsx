// Referral status: ladder progress 0..3 with Корова Печенька at the top.
import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { Referrals } from './api'
import { social } from './api'
import { Sheet } from './ui'

export function ReferralSheet({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Referrals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    social.referrals().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  function shareLink() {
    if (!data) return
    haptic('tap')
    const url = `https://t.me/share/url?url=${encodeURIComponent(data.link)}&text=${encodeURIComponent('Заходи растить щенка вместе со мной! 🐶')}`
    window.open(url, '_blank')
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 44 }}>🐮</div>
        <h2>Корова Печенька ждёт тебя</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '4px 0 0' }}>Позови друзей — и получи микропитомцев по дороге</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 16 }}>Загружаю…</div>
      ) : !data ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 16 }}>Не удалось загрузить</div>
      ) : (
        <>
          <div style={{ textAlign: 'center', fontWeight: 800, marginBottom: 14 }}>
            Друзей пришло: {data.count} / {data.max}
          </div>
          {data.ladder.map(step => {
            const reached = data.count >= step.tier
            return (
              <div key={step.tier} className="goal-row" style={{ opacity: step.done || reached ? 1 : 0.7 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, fontSize: 16, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.done ? 'var(--green)' : 'var(--card-shade)', color: step.done ? '#fff' : 'var(--brown)',
                }}>{step.done ? '✓' : step.tier}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{step.ru}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{step.tier} {step.tier === 1 ? 'друг' : 'друга'}</div>
                </div>
              </div>
            )
          })}
          <div className="card" style={{ background: 'var(--card-shade)', fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 4 }}>
            {data.inviteeGift}
          </div>
          <button className="btn accent" style={{ width: '100%' }} onClick={shareLink}>📨 Позвать друга</button>
        </>
      )}
    </Sheet>
  )
}
