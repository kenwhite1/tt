// Дворик settings (gear): the one toggle the server persists for social is the
// social-notifications flag (notifications.social). allowVibes/allowRequests are shown
// as current status (read-only here, there is no write endpoint for them).
import { useState } from 'react'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { FriendsPayload } from './api'
import { Sheet } from './ui'

export function SettingsSheet({ data, onClose }: { data: FriendsPayload; onClose: () => void }) {
 const [notify, setNotify] = useState(data.settings.notifySocial)
 const [busy, setBusy] = useState(false)

 async function toggleNotify() {
 if (busy) return
 const next = !notify
 setNotify(next); setBusy(true); haptic('tap')
 try {
 await req('/activities/settings', { settings: { notifications: { social: next } } })
 } catch {
 setNotify(!next); haptic('warn'); useStore.getState().showToast('Не сохранилось')
 } finally { setBusy(false) }
 }

 return (
 <Sheet onClose={onClose}>
 <h2 style={{ textAlign: 'center', marginBottom: 16 }}>⚙️ Настройки Дворика</h2>

 <label className="goal-row" style={{ cursor: 'pointer' }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>Уведомления о Дворике</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Лучики, обнимашки, заявки в друзья</div>
 </div>
 <input type="checkbox" checked={notify} onChange={() => void toggleNotify()} style={{ width: 22, height: 22 }} />
 </label>

 <div className="card" style={{ background: 'var(--card-shade)', padding: 12 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 700 }}>
 <span>Принимаю тёплые лучики</span>
 <span>{data.settings.allowVibes ? 'да 💛' : 'нет'}</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 700 }}>
 <span>Принимаю заявки в друзья</span>
 <span>{data.settings.allowRequests ? 'да 🐾' : 'нет'}</span>
 </div>
 </div>
 </Sheet>
 )
}
