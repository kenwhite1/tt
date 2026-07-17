// Пауза: gentle break mode. Slider 1-7 days; shows countdown + end-early when paused.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { useStore } from '../../../store'
import { haptic } from '../../../telegram'
import { Loading, Sub, fmtDay } from '../ui'
import type { SettingsDto } from '../types'
import { t } from '../../../i18n'

function daysLeft(until: string): number {
 const today = new Date(); today.setHours(12, 0, 0, 0)
 const end = new Date(`${until}T12:00:00`)
 return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86_400_000))
}

export function Pause({ onBack }: { onBack(): void }) {
 const [d, setD] = useState<SettingsDto | null>(null)
 const [days, setDays] = useState(3)
 const [busy, setBusy] = useState(false)

 const load = () => { req<SettingsDto>('/activities/settings').then(setD).catch(() => {}) }
 useEffect(load, [])

 async function start() {
 if (busy) return
 setBusy(true)
 try {
 await req('/activities/pause', { days })
 haptic('success')
 useStore.getState().showToast(t('Пауза включена. Отдыхай 💛'))
 void useStore.getState().refresh()
 load()
 } catch { useStore.getState().showToast(t('Не получилось')) }
 setBusy(false)
 }

 async function end() {
 if (busy) return
 setBusy(true)
 try {
 await req('/activities/pause/end', {})
 haptic('success')
 useStore.getState().showToast(t('С возвращением! 💛'))
 void useStore.getState().refresh()
 load()
 } catch { useStore.getState().showToast(t('Не получилось')) }
 setBusy(false)
 }

 if (!d) return <Sub title={t('Пауза')} onBack={onBack}><Loading /></Sub>

 if (d.pausedUntil) {
 const left = daysLeft(d.pausedUntil)
 return (
 <Sub title={t('Пауза')} onBack={onBack}>
 <div className="card" style={{ textAlign: 'center', background: '#eef6e3' }}>
 <div style={{ fontSize: 44 }}>🌙</div>
 <h2>{t('Ты на паузе')}</h2>
 <p style={{ color: 'var(--ink-soft)', margin: '6px 0' }}>
 {t('Серия и цели заморожены до')} {fmtDay(d.pausedUntil)}.
 {left > 0 ? ` ${t('Осталось')} ${left} ${left === 1 ? t('день') : left < 5 ? t('дня') : t('дней')}.` : ` ${t('Пауза заканчивается сегодня.')}`}
 </p>
 <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{t('Шарик подождёт тебя и не будет грустить. Отдыхай столько, сколько нужно.')}</p>
 <button className="btn" style={{ marginTop: 8 }} disabled={busy} onClick={() => void end()}>{t('Вернуться сейчас')}</button>
 </div>
 </Sub>
 )
 }

 return (
 <Sub title={t('Пауза')} onBack={onBack}>
 <div className="card">
 <div style={{ fontSize: 40, textAlign: 'center' }}>🌙</div>
 <h2 style={{ textAlign: 'center' }}>{t('Нужен отдых?')}</h2>
 <p style={{ color: 'var(--ink-soft)', textAlign: 'center', margin: '6px 0 14px' }}>
 {t('На паузе серия не прерывается, цели не давят, а Шарик спокойно ждёт. Это забота, а не пропуск.')}
 </p>
 <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: 'var(--brown-deep)' }}>{days} {days === 1 ? t('день') : days < 5 ? t('дня') : t('дней')}</div>
 <input
 type="range" min={1} max={7} value={days} onChange={e => setDays(Number(e.target.value))}
 style={{ width: '100%', accentColor: 'var(--accent)', margin: '10px 0' }}
 />
 <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={() => void start()}>{t('Включить паузу')}</button>
 </div>
 </Sub>
 )
}
