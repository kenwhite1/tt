// «Вечерний сбор» — a gentle wind-down moment. Opt-in (set your hour), no streak, no timer.
// Shows who's around in your window and lets you check in. See SPEC-VIRAL-FEATURES §6.
import { useEffect, useState } from 'react'
import { evening } from './api'
import { Sheet } from './ui'
import { Mascot } from '../../art/Mascot'
import { haptic } from '../../telegram'
import { useStore } from '../../store'

type Now = { inWindow: boolean; hour: number; windowMin: number; checkedIn: boolean; present: { name: string; petName: string; species: string }[] }

export function EveningCard() {
  const [now, setNow] = useState<Now | null>(null)
  const [settings, setSettings] = useState(false)

  function reload() { evening.now().then(setNow).catch(() => { /* offline */ }) }
  useEffect(reload, [])
  if (!now) return null
  // Show only inside the window, or always offer the settings entry from the gear in Дворик.
  if (!now.inWindow && now.present.length === 0) {
    return (
      <button className="btn ghost" style={{ width: '100%', marginBottom: 12, fontSize: 13 }} onClick={() => { haptic('tap'); setSettings(true) }}>
        🌙 Вечерний сбор в {String(now.hour).padStart(2, '0')}:00 · настроить
        {settings && <HourSheet hour={now.hour} onClose={() => setSettings(false)} onSaved={reload} />}
      </button>
    )
  }

  return (
    <div className="card" style={{ marginBottom: 12, background: 'linear-gradient(160deg, #3a3a6b, #2a2a52)', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 26 }}>🌙</span>
        <div style={{ flex: 1 }}>
          <b>Вечерний сбор</b>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {now.present.length > 0 ? `${now.present.length} друзей укладывают щенков` : 'Тихо выдохнуть перед сном'}
          </div>
        </div>
        <button className="btn ghost" style={{ padding: '6px 10px', color: '#fff' }} onClick={() => { haptic('tap'); setSettings(true) }}>⚙️</button>
      </div>
      {now.present.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
          {now.present.slice(0, 8).map((p, i) => (
            <div key={i} style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ opacity: 0.9 }}><Mascot species={p.species} size={40} state="sleeping" /></div>
              <div style={{ fontSize: 11, opacity: 0.8, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
            </div>
          ))}
        </div>
      )}
      <button className="btn" style={{ width: '100%', marginTop: 10 }} disabled={now.checkedIn}
        onClick={async () => { await evening.checkin(); haptic('success'); useStore.getState().showToast('Спокойной ночи 🌙'); reload() }}>
        {now.checkedIn ? 'Ты здесь 💛' : 'Я укладываю щенка 🌙'}
      </button>
      {settings && <HourSheet hour={now.hour} onClose={() => setSettings(false)} onSaved={reload} />}
    </div>
  )
}

function HourSheet({ hour, onClose, onSaved }: { hour: number; onClose: () => void; onSaved: () => void }) {
  const HOURS = [18, 19, 20, 21, 22, 23]
  return (
    <Sheet onClose={onClose} z={60}>
      <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Когда вам собираться?</h2>
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px' }}>Мягкое окно на 1.5 часа. Без серий и обратного отсчёта — просто вместе выдохнуть.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {HOURS.map(h => (
          <button key={h} className={`btn ${h === hour ? '' : 'ghost'}`} onClick={async () => { await evening.setHour(h); haptic('tap'); onSaved(); onClose() }}>
            {String(h).padStart(2, '0')}:00
          </button>
        ))}
      </div>
    </Sheet>
  )
}
