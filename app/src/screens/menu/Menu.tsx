// Hamburger «Меню», the hub that links the whole self-care suite + settings + pause.
import { useState } from 'react'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import { PlusScreen } from '../plus/PlusScreen'
import { Row, Sub, useContent } from './ui'
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
import { History } from './screens/History'
import { Settings } from './screens/Settings'
import { Pause } from './screens/Pause'
import { t } from '../../i18n'

type View =
 | 'root' | 'activities' | 'settings' | 'pause' | 'plus'
 | 'reflections' | 'goalIdeas' | 'breathing' | 'movement' | 'timers' | 'grounding'
 | 'quizzes' | 'emotion' | 'gooddeed' | 'affirmations' | 'firstaid'
 | 'myGoals' | 'scas' | 'insights' | 'papers' | 'history'

export function Menu({ onClose }: { onClose(): void }) {
 const [view, setView] = useState<View>('root')
 const state = useStore(s => s.state)
 const content = useContent()
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
 if (view === 'history') return <Frame><History onBack={back} /></Frame>
 if (view === 'settings') return <Frame><Settings onBack={back} /></Frame>
 if (view === 'pause') return <Frame><Pause onBack={back} /></Frame>

 if (view === 'activities') {
 return (
 <Frame>
 <Sub title={t('Активности')} onBack={back}>
 <Row emoji="🎯" title={t('Идеи целей')} sub={t('Маленькие шаги заботы')} onClick={() => go('goalIdeas')} />
 <Row emoji="📓" title={t('Размышления')} sub={t('Дневник и тёплые вопросы')} onClick={() => go('reflections')} />
 <Row emoji="🌬️" title={t('Дыхание')} sub={t('Успокоиться за пару минут')} onClick={() => go('breathing')} />
 <Row emoji="🤸" title={t('Движение')} sub={t('Лёгкая разминка')} onClick={() => go('movement')} />
 <Row emoji="⏳" title={t('Таймеры')} sub={t('Медитация и фокус')} onClick={() => go('timers')} />
 <Row emoji="🌈" title={t('Заземление')} sub={t('Вернуться в момент')} onClick={() => go('grounding')} />
 {content?.quizzesEnabled && <Row emoji="📝" title={t('Викторины')} sub={t('Прислушаться к себе')} onClick={() => go('quizzes')} />}
 <Row emoji="💛" title={t('Назови эмоцию')} sub={t('Понять, что чувствуешь')} onClick={() => go('emotion')} />
 <Row emoji="🤝" title={t('Доброе дело')} sub={t('Тепло другим, тепло себе')} onClick={() => go('gooddeed')} />
 <Row emoji="✨" title={t('Аффирмации')} sub={t('Доброе слово себе')} onClick={() => go('affirmations')} />
 </Sub>
 </Frame>
 )
 }

 // root
 const code = state?.user.friendCode ?? ''
 const copyCode = () => {
 void navigator.clipboard?.writeText(code).catch(() => {})
 haptic('success'); useStore.getState().showToast(t('Код скопирован ✨'))
 }
 return (
 <Frame>
 <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 8px' }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onClose}>✕</button>
 <h1 style={{ flex: 1 }}>{t('Меню')}</h1>
 </header>
 <div className="scroll">
 <div className="card">
 <div style={{ fontWeight: 800, fontSize: 18 }}>{state?.pet.name ?? t('Шарик')}</div>
 <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{t('хозяин')}, {state?.user.name}</div>
 <button onClick={copyCode} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
 <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-deep)' }}>{t('КОД ДРУГА')}</div>
 <div style={{ fontWeight: 800, letterSpacing: 1.5, color: 'var(--accent-deep)' }}>{code} ⧉</div>
 </button>
 </div>

 <button className="card" style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #fbe3b2, #f8d77e)' }} onClick={() => go('plus')}>
 <b>💛 {t('Шарик Плюс')}</b>
 <div style={{ fontSize: 13, color: 'var(--brown)' }}>{t('Больше уюта и возможностей')}</div>
 </button>

 <h2 style={{ margin: '16px 4px 8px' }}>{t('Забота')}</h2>
 <Row emoji="🧩" title={t('Активности')} sub={t('Дыхание, дневник, упражнения')} onClick={() => go('activities')} />
 <Row emoji="✅" title={t('Мои цели')} onClick={() => go('myGoals')} />
 <Row emoji="🌿" title={t('Сферы заботы')} onClick={() => go('scas')} />
 <Row emoji="📊" title={t('Инсайты')} onClick={() => go('insights')} />
 <Row emoji="💌" title={t('Газеты')} onClick={() => go('papers')} />
 <Row emoji="📅" title={t('История')} sub={t('Загляни в любой день')} onClick={() => go('history')} />
 <Row emoji="⛑️" title={t('Аптечка')} sub={t('Если сейчас тяжело')} onClick={() => go('firstaid')} />

 <h2 style={{ margin: '16px 4px 8px' }}>{t('Настройки')}</h2>
 <Row emoji="⚙️" title={t('Настройки')} onClick={() => go('settings')} />
 <Row emoji="⏸️" title={t('Пауза')} sub={t('Отдохнуть без потери серии')} onClick={() => go('pause')} />
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
