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
 <Sub title="Активности" onBack={back}>
 <Row emoji="🎯" title="Идеи целей" sub="Маленькие шаги заботы" onClick={() => go('goalIdeas')} />
 <Row emoji="📓" title="Размышления" sub="Дневник и тёплые вопросы" onClick={() => go('reflections')} />
 <Row emoji="🌬️" title="Дыхание" sub="Успокоиться за пару минут" onClick={() => go('breathing')} />
 <Row emoji="🤸" title="Движение" sub="Лёгкая разминка" onClick={() => go('movement')} />
 <Row emoji="⏳" title="Таймеры" sub="Медитация и фокус" onClick={() => go('timers')} />
 <Row emoji="🌈" title="Заземление" sub="Вернуться в момент" onClick={() => go('grounding')} />
 {content?.quizzesEnabled && <Row emoji="📝" title="Викторины" sub="Прислушаться к себе" onClick={() => go('quizzes')} />}
 <Row emoji="💛" title="Назови эмоцию" sub="Понять, что чувствуешь" onClick={() => go('emotion')} />
 <Row emoji="🤝" title="Доброе дело" sub="Тепло другим, тепло себе" onClick={() => go('gooddeed')} />
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
 <div style={{ fontWeight: 800, fontSize: 18 }}>{state?.pet.name ?? 'Шарик'}</div>
 <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>хозяин, {state?.user.name}</div>
 <button onClick={copyCode} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
 <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-deep)' }}>КОД ДРУГА</div>
 <div style={{ fontWeight: 800, letterSpacing: 1.5, color: 'var(--accent-deep)' }}>{code} ⧉</div>
 </button>
 </div>

 <button className="card" style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #fbe3b2, #f8d77e)' }} onClick={() => go('plus')}>
 <b>💛 Шарик Плюс</b>
 <div style={{ fontSize: 13, color: 'var(--brown)' }}>Больше уюта и возможностей</div>
 </button>

 <h2 style={{ margin: '16px 4px 8px' }}>Забота</h2>
 <Row emoji="🧩" title="Активности" sub="Дыхание, дневник, упражнения" onClick={() => go('activities')} />
 <Row emoji="✅" title="Мои цели" onClick={() => go('myGoals')} />
 <Row emoji="🌿" title="Сферы заботы" onClick={() => go('scas')} />
 <Row emoji="📊" title="Инсайты" onClick={() => go('insights')} />
 <Row emoji="💌" title="Газеты" onClick={() => go('papers')} />
 <Row emoji="📅" title="История" sub="Загляни в любой день" onClick={() => go('history')} />
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
