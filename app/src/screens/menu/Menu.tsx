// Hamburger «Меню» — the hub that links the whole self-care suite + settings + pause.
import { useEffect, useState } from 'react'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import { PlusScreen } from '../plus/PlusScreen'
import { Row, Sub, Toggle } from './ui'
import type { SettingsDto } from './types'
import { Reflections } from './Reflections'
import { GoalIdeas } from './players/GoalIdeas'
import { Breathing } from './players/Breathing'
import { Movement } from './players/Movement'
import { Timers } from './players/Timers'
import { Grounding } from './players/Grounding'
import { Quizzes } from './players/Quizzes'
import { NameEmotion } from './players/NameEmotion'
import { GoodDeed } from './players/GoodDeed'
import { Affirmations } from './players/Affirmations'
import { FirstAid } from './players/FirstAid'
import { MyGoals } from './screens/MyGoals'
import { Scas } from './screens/Scas'
import { Insights } from './screens/Insights'
import { Papers } from './screens/Papers'

type View =
  | 'root' | 'activities' | 'settings' | 'pause' | 'plus'
  | 'reflections' | 'goalIdeas' | 'breathing' | 'movement' | 'timers' | 'grounding'
  | 'quizzes' | 'emotion' | 'gooddeed' | 'affirmations' | 'firstaid'
  | 'myGoals' | 'scas' | 'insights' | 'papers'

export function Menu({ onClose }: { onClose(): void }) {
  const [view, setView] = useState<View>('root')
  const state = useStore(s => s.state)
  const go = (v: View) => { haptic('tap'); setView(v) }
  const back = () => setView('root')
  const backActivities = () => setView('activities')

  // sub-screens
  if (view === 'plus') return <PlusScreen onClose={back} />
  if (view === 'reflections') return <Frame><Reflections onBack={backActivities} /></Frame>
  if (view === 'goalIdeas') return <Frame><GoalIdeas onBack={backActivities} /></Frame>
  if (view === 'breathing') return <Frame><Breathing onBack={backActivities} /></Frame>
  if (view === 'movement') return <Frame><Movement onBack={backActivities} /></Frame>
  if (view === 'timers') return <Frame><Timers onBack={backActivities} /></Frame>
  if (view === 'grounding') return <Frame><Grounding onBack={backActivities} /></Frame>
  if (view === 'quizzes') return <Frame><Quizzes onBack={backActivities} /></Frame>
  if (view === 'emotion') return <Frame><NameEmotion onBack={backActivities} /></Frame>
  if (view === 'gooddeed') return <Frame><GoodDeed onBack={backActivities} /></Frame>
  if (view === 'affirmations') return <Frame><Affirmations onBack={backActivities} /></Frame>
  if (view === 'firstaid') return <Frame><FirstAid onBack={back} /></Frame>
  if (view === 'myGoals') return <Frame><MyGoals onBack={back} /></Frame>
  if (view === 'scas') return <Frame><Scas onBack={back} /></Frame>
  if (view === 'insights') return <Frame><Insights onBack={back} /></Frame>
  if (view === 'papers') return <Frame><Papers onBack={back} onPlus={() => setView('plus')} /></Frame>
  if (view === 'settings') return <Frame><SettingsView onBack={back} /></Frame>
  if (view === 'pause') return <Frame><PauseView onBack={back} /></Frame>

  if (view === 'activities') {
    return (
      <Frame>
        <Sub title="Активности" onBack={back}>
          <Row emoji="🎯" title="Идеи целей" sub="Маленькие шаги заботы" onClick={() => go('goalIdeas')} />
          <Row emoji="📓" title="Размышления" sub="Дневник и тёплые вопросы" onClick={() => go('reflections')} />
          <Row emoji="🌬️" title="Дыхание" sub="Успокоиться за пару минут" onClick={() => go('breathing')} />
          <Row emoji="🤸" title="Движение" sub="Лёгкая разминка" onClick={() => go('movement')} />
          <Row emoji="⏳" title="Таймеры" sub="Медитация и фокус" onClick={() => go('timers')} />
          <Row emoji="🌈" title="Заземление" sub="Вернуться в момент" onClick={() => go('grounding')} />
          <Row emoji="📝" title="Викторины" sub="Прислушаться к себе" onClick={() => go('quizzes')} />
          <Row emoji="💛" title="Назови эмоцию" sub="Понять, что чувствуешь" onClick={() => go('emotion')} />
          <Row emoji="🤝" title="Доброе дело" sub="Тепло другим — тепло себе" onClick={() => go('gooddeed')} />
          <Row emoji="✨" title="Аффирмации" sub="Доброе слово себе" onClick={() => go('affirmations')} />
        </Sub>
      </Frame>
    )
  }

  // root
  const code = state?.user.friendCode ?? ''
  const copyCode = () => {
    void navigator.clipboard?.writeText(code).catch(() => {})
    haptic('success'); useStore.getState().showToast('Код скопирован 🐾')
  }
  return (
    <Frame>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 8px' }}>
        <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onClose}>✕</button>
        <h1 style={{ flex: 1 }}>Меню</h1>
      </header>
      <div className="scroll">
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 18 }}>{state?.pet.name ?? 'Дружок'}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>хозяин — {state?.user.name}</div>
          <button onClick={copyCode} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-deep)' }}>КОД ДРУГА</div>
            <div style={{ fontWeight: 800, letterSpacing: 1.5, color: 'var(--accent-deep)' }}>{code} ⧉</div>
          </button>
        </div>

        <button className="card" style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #fbe3b2, #f8d77e)' }} onClick={() => go('plus')}>
          <b>💛 Дружок Плюс</b>
          <div style={{ fontSize: 13, color: 'var(--brown)' }}>Больше уюта и возможностей</div>
        </button>

        <h2 style={{ margin: '16px 4px 8px' }}>Забота</h2>
        <Row emoji="🧩" title="Активности" sub="Дыхание, дневник, упражнения" onClick={() => go('activities')} />
        <Row emoji="✅" title="Мои цели" onClick={() => go('myGoals')} />
        <Row emoji="🌿" title="Сферы заботы" onClick={() => go('scas')} />
        <Row emoji="📊" title="Инсайты" onClick={() => go('insights')} />
        <Row emoji="💌" title="Газеты" onClick={() => go('papers')} />
        <Row emoji="⛑️" title="Аптечка" sub="Если сейчас тяжело" onClick={() => go('firstaid')} />

        <h2 style={{ margin: '16px 4px 8px' }}>Настройки</h2>
        <Row emoji="⚙️" title="Настройки" onClick={() => go('settings')} />
        <Row emoji="⏸️" title="Пауза" sub="Отдохнуть без потери серии" onClick={() => go('pause')} />
      </div>
    </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 60, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top))' }}>
      {children}
    </div>
  )
}

const NOTIF_LABELS: { key: keyof SettingsDto['settings']['notifications']; ru: string }[] = [
  { key: 'morning', ru: 'Утреннее приветствие' },
  { key: 'midday', ru: 'Тёплое слово днём' },
  { key: 'evening', ru: 'Вечерний чек-ин' },
  { key: 'bedtime', ru: 'Перед сном' },
  { key: 'streak', ru: 'Спасатель серии' },
  { key: 'walk', ru: 'Возвращение с прогулки' },
  { key: 'mail', ru: 'Почта и газеты' },
  { key: 'social', ru: 'Друзья и лучики' },
]
const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function SettingsView({ onBack }: { onBack(): void }) {
  const [s, setS] = useState<SettingsDto | null>(null)
  useEffect(() => { void req<SettingsDto>('/activities/settings').then(setS) }, [])

  async function patch(body: Record<string, unknown>) {
    const r = await req<SettingsDto>('/activities/settings', body)
    setS(r)
    void useStore.getState().refresh()
  }
  function setNotif(key: string, val: boolean) {
    if (!s) return
    void patch({ settings: { notifications: { [key]: val } } })
  }

  if (!s) return <Sub title="Настройки" onBack={onBack}><p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Загружаю…</p></Sub>

  return (
    <Sub title="Настройки" onBack={onBack}>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Режим дня</h2>
        <TimeField label="Подъём" value={s.wakeMin} onChange={v => void patch({ wakeMin: v })} />
        <TimeField label="Отбой" value={s.sleepMin} onChange={v => void patch({ sleepMin: v })} />
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '6px 0 0' }}>
          Новый день начинается за 2 часа до подъёма ({fmtMin(((s.wakeMin - 120) % 1440 + 1440) % 1440)}).
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Уведомления</h2>
        {NOTIF_LABELS.map(n => (
          <Toggle key={n.key} label={n.ru} value={s.settings.notifications[n.key]} onChange={v => setNotif(n.key, v)} />
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Прочее</h2>
        <Toggle label="Викторины" sub="Самопроверки в активностях" value={s.settings.quizzes} onChange={v => void patch({ settings: { quizzes: v } })} />
        <Toggle label="Сезонные события" value={s.settings.seasonal} onChange={v => void patch({ settings: { seasonal: v } })} />
      </div>
    </Sub>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: number; onChange(v: number): void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontWeight: 800 }}>{label}</span>
      <input type="time" value={fmtMin(value)} onChange={e => {
        const [h, m] = e.target.value.split(':').map(Number)
        if (!Number.isNaN(h) && !Number.isNaN(m)) onChange(h * 60 + m)
      }} style={{ border: '2px solid var(--gold)', borderRadius: 10, padding: '6px 10px', fontSize: 16, fontFamily: 'inherit' }} />
    </div>
  )
}

function PauseView({ onBack }: { onBack(): void }) {
  const state = useStore(s => s.state)
  const paused = state?.user.pausedUntil && state.user.pausedUntil >= (state.day ?? '')
  const [days, setDays] = useState(3)
  const showToast = useStore(s => s.showToast)

  async function start() {
    await req('/activities/pause', { days }).catch(() => {})
    haptic('success'); showToast('Пауза включена 🌙'); void useStore.getState().refresh(); onBack()
  }
  async function end() {
    await req('/activities/pause/end', {}).catch(() => {})
    haptic('success'); showToast('С возвращением! 🐾'); void useStore.getState().refresh(); onBack()
  }

  return (
    <Sub title="Пауза" onBack={onBack}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🌙</div>
        {paused ? (
          <>
            <h2>Сейчас ты на паузе</h2>
            <p style={{ color: 'var(--ink-soft)' }}>Серия заморожена и сохранится. Возвращайся, когда будешь готов(а).</p>
            <p style={{ fontWeight: 800 }}>До {state?.user.pausedUntil}</p>
            <button className="btn accent" style={{ width: '100%', marginTop: 10 }} onClick={() => void end()}>Вернуться сейчас</button>
          </>
        ) : (
          <>
            <h2>Нужна передышка?</h2>
            <p style={{ color: 'var(--ink-soft)' }}>Пауза сохранит твою серию и приглушит напоминания. Аптечка остаётся доступной.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '14px 0' }}>
              <button className="btn ghost" onClick={() => setDays(d => Math.max(1, d - 1))}>−</button>
              <b style={{ fontSize: 22 }}>{days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</b>
              <button className="btn ghost" onClick={() => setDays(d => Math.min(7, d + 1))}>+</button>
            </div>
            <button className="btn accent" style={{ width: '100%' }} onClick={() => void start()}>Поставить на паузу</button>
          </>
        )}
      </div>
    </Sub>
  )
}
