// Настройки: profile, day mode (wake/sleep), pet, notifications, quizzes, seasonal, celebration.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { useStore } from '../../../store'
import { haptic } from '../../../telegram'
import { Loading, Sub, Toggle } from '../ui'
import { invalidateContent } from '../ui'
import type { AppSettings, SettingsDto } from '../types'
import { isSoundOn, setSoundOn, playSfx } from '../../../sound'
import { getThemePref, setThemePref, type ThemePref } from '../../../themeMode'

const THEMES: [ThemePref, string][] = [['auto', 'Авто'], ['light', 'Светлая'], ['dark', 'Тёмная']]

const HH = (min: number) => String(Math.floor(min / 60)).padStart(2, '0')
const MM = (min: number) => String(min % 60).padStart(2, '0')

function TimePicker({ label, value, onChange }: { label: string; value: number; onChange(min: number): void }) {
  const h = Math.floor(value / 60)
  const m = value % 60
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px' }}>
      <div style={{ flex: 1, fontWeight: 800 }}>{label}</div>
      <select value={h} onChange={e => onChange(Number(e.target.value) * 60 + m)} style={selStyle}>
        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
      </select>
      <span style={{ fontWeight: 800 }}>:</span>
      <select value={m} onChange={e => onChange(h * 60 + Number(e.target.value))} style={selStyle}>
        {[0, 15, 30, 45].map(v => <option key={v} value={v}>{String(v).padStart(2, '0')}</option>)}
      </select>
    </div>
  )
}
const selStyle: React.CSSProperties = {
  border: '2px solid var(--gold)', borderRadius: 10, padding: '6px 8px', fontSize: 16, fontFamily: 'inherit', background: '#fff', color: 'var(--ink)', fontWeight: 800,
}

const NOTIF: { key: keyof AppSettings['notifications']; ru: string }[] = [
  { key: 'morning', ru: 'Утреннее «доброе утро»' },
  { key: 'midday', ru: 'Поддержка среди дня' },
  { key: 'evening', ru: 'Вечерняя отметка' },
  { key: 'bedtime', ru: 'Перед сном' },
  { key: 'streak', ru: 'Спасти серию' },
  { key: 'walk', ru: 'Шарик вернулся с прогулки' },
  { key: 'mail', ru: 'Новая почта и газеты' },
  { key: 'social', ru: 'Друзья и лучики' },
]
const PRONOUNS: { v: 'he' | 'she' | 'they'; ru: string }[] = [
  { v: 'he', ru: 'он' }, { v: 'she', ru: 'она' }, { v: 'they', ru: 'они' },
]

export function Settings({ onBack }: { onBack(): void }) {
  const [d, setD] = useState<SettingsDto | null>(null)
  const [soundOn, setSoundOnState] = useState(isSoundOn())
  const [themePref, setThemePrefState] = useState(getThemePref())

  useEffect(() => { req<SettingsDto>('/activities/settings').then(setD).catch(() => {}) }, [])

  async function save(patch: Record<string, unknown>, toast = 'Сохранено 💛') {
    try {
      await req('/activities/settings', patch)
      haptic('success')
      useStore.getState().showToast(toast)
      void useStore.getState().refresh()
    } catch { useStore.getState().showToast('Не получилось') }
  }

  if (!d) return <Sub title="Настройки" onBack={onBack}><Loading /></Sub>
  const s = d.settings
  const allOn = NOTIF.every(n => s.notifications[n.key])

  function patchSettings(partial: Partial<AppSettings>) {
    const merged = { ...s, ...partial }
    setD(prev => prev ? { ...prev, settings: merged } : prev)
    void save({ settings: partial })
  }
  function patchNotif(partial: Partial<AppSettings['notifications']>) {
    const merged = { ...s.notifications, ...partial }
    setD(prev => prev ? { ...prev, settings: { ...s, notifications: merged } } : prev)
    void save({ settings: { notifications: partial } })
  }

  return (
    <Sub title="Настройки" onBack={onBack}>
      {/* profile */}
      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Профиль</h2>
        <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)' }}>Как тебя зовут</label>
        <input
          defaultValue={d.userName}
          onBlur={e => { const v = e.target.value.trim(); if (v && v !== d.userName) { setD({ ...d, userName: v }); void save({ userName: v }) } }}
          style={inputStyle}
        />
      </div>

      {/* pet */}
      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Шарик</h2>
        <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)' }}>Имя питомца</label>
        <input
          defaultValue={d.petName}
          onBlur={e => { const v = e.target.value.trim(); if (v && v !== d.petName) { setD({ ...d, petName: v }); void save({ petName: v }) } }}
          style={inputStyle}
        />
        <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', display: 'block', marginTop: 8 }}>Местоимения</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {PRONOUNS.map(p => (
            <button key={p.v} onClick={() => { setD({ ...d, petPronouns: p.v }); void save({ petPronouns: p.v }) }}
              style={pillStyle(d.petPronouns === p.v)}>{p.ru}</button>
          ))}
        </div>
      </div>

      {/* day mode */}
      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Режим дня</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 4px' }}>День Шарика начинается за пару часов до пробуждения.</p>
        <TimePicker label="🌅 Подъём" value={d.wakeMin} onChange={v => { setD({ ...d, wakeMin: v }); void save({ wakeMin: v }) }} />
        <TimePicker label="🌙 Отбой" value={d.sleepMin} onChange={v => { setD({ ...d, sleepMin: v }); void save({ sleepMin: v }) }} />
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Сейчас: подъём {HH(d.wakeMin)}:{MM(d.wakeMin)}, отбой {HH(d.sleepMin)}:{MM(d.sleepMin)} · {d.tz}</div>
      </div>

      {/* notifications */}
      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Уведомления</h2>
        <Toggle label="Все уведомления" value={allOn} onChange={v => {
          const next = Object.fromEntries(NOTIF.map(n => [n.key, v])) as AppSettings['notifications']
          setD({ ...d, settings: { ...s, notifications: next } }); void save({ settings: { notifications: next } })
          if (v) void req('/notifications/enable', {}).catch(() => {}) // ensure the bot may DM
        }} />
        <div style={{ height: 1, background: 'var(--card-shade)', margin: '6px 0' }} />
        {NOTIF.map(n => (
          <Toggle key={n.key} label={n.ru} value={s.notifications[n.key]} onChange={v => patchNotif({ [n.key]: v })} />
        ))}
      </div>

      {/* preferences */}
      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Предпочтения</h2>
        <Toggle label="Викторины-самопроверки" sub="Мягкие опросники о самочувствии" value={s.quizzes}
          onChange={v => { invalidateContent(); patchSettings({ quizzes: v }) }} />
        <Toggle label="Сезонные события" sub="Праздничные ивенты и наряды" value={s.seasonal} onChange={v => patchSettings({ seasonal: v })} />
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', margin: '10px 2px 6px' }}>Как отмечать выполнение цели</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => patchSettings({ celebration: 'cheers' })} style={pillStyle(s.celebration === 'cheers')}>🎉 Радоваться</button>
          <button onClick={() => patchSettings({ celebration: 'reflect' })} style={pillStyle(s.celebration === 'reflect')}>🌿 Спокойно</button>
        </div>
      </div>

      {/* sound + theme (client-side, stored locally) */}
      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Звук и тема</h2>
        <Toggle label="Звуки" sub="Тихие звуки заботы о Шарике" value={soundOn}
          onChange={v => { setSoundOn(v); setSoundOnState(v); if (v) playSfx('complete') }} />
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', margin: '10px 2px 6px' }}>Тема оформления</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {THEMES.map(([v, ru]) => (
            <button key={v} onClick={() => { haptic('tap'); setThemePref(v); setThemePrefState(v) }} style={pillStyle(themePref === v)}>{ru}</button>
          ))}
        </div>
      </div>
    </Sub>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '2px solid var(--gold)', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit', marginTop: 4,
}
function pillStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, border: 'none', borderRadius: 999, padding: '10px 12px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? 'var(--accent)' : 'var(--card-shade)', color: active ? '#fff' : 'var(--brown)',
  }
}
