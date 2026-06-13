// Активности hub: the catalog of self-care activities, each routing to its player.
import { useState } from 'react'
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

type View =
  | 'home' | 'ideas' | 'reflect' | 'breath' | 'move' | 'timers'
  | 'ground' | 'quiz' | 'emotion' | 'deed' | 'affirm' | 'firstaid'

export function ActivitiesHub({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [view, setView] = useState<View>('home')
  const back = () => setView('home')

  if (view === 'ideas') return <GoalIdeas onBack={back} />
  if (view === 'reflect') return <Reflections onBack={back} />
  if (view === 'breath') return <Breathing onBack={back} />
  if (view === 'move') return <Movement onBack={back} />
  if (view === 'timers') return <Timers onBack={back} />
  if (view === 'ground') return <Grounding onBack={back} />
  if (view === 'quiz') return <Quizzes onBack={back} />
  if (view === 'emotion') return <NameEmotion onBack={back} />
  if (view === 'deed') return <GoodDeed onBack={back} />
  if (view === 'affirm') return <Affirmations onBack={back} />
  if (view === 'firstaid') return <FirstAid onBack={back} />

  const quizzesOn = content?.quizzesEnabled ?? false

  return (
    <Sub title="Активности" onBack={onBack}>
      <p style={{ color: 'var(--ink-soft)', margin: '0 4px 10px' }}>Маленькие дела заботы о себе. Бери любое — и заряжай Дружка ⚡.</p>
      <Row emoji="💡" title="Идеи целей" sub="Готовые цели — добавь одним касанием" onClick={() => setView('ideas')} />
      <Row emoji="📝" title="Размышления" sub="Вопросы и свободный дневник" onClick={() => setView('reflect')} />
      <Row emoji="🫧" title="Дыхание" sub="Подыши по ритму вместе со мной" onClick={() => setView('breath')} />
      <Row emoji="🤸" title="Движение" sub="Растяжка, йога, лёгкая зарядка" onClick={() => setView('move')} />
      <Row emoji="⏳" title="Таймеры" sub="Медитация и фокус-сессии" onClick={() => setView('timers')} />
      <Row emoji="🌿" title="Заземление" sub="Вернуться в «здесь и сейчас»" onClick={() => setView('ground')} />
      {quizzesOn && <Row emoji="📋" title="Викторины" sub="Мягкие самопроверки" onClick={() => setView('quiz')} />}
      <Row emoji="💭" title="Назови эмоцию" sub="Найти точное слово для чувства" onClick={() => setView('emotion')} />
      <Row emoji="🤝" title="Доброе дело" sub="Немного тепла для кого-то" onClick={() => setView('deed')} />
      <Row emoji="💛" title="Тёплые слова" sub="Аффирмация на сегодня" onClick={() => setView('affirm')} />
      <button
        className="goal-row" style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, background: '#fdeceb' }}
        onClick={() => setView('firstaid')}
      >
        <span style={{ fontSize: 24 }}>⛑️</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, display: 'block', color: 'var(--ink)' }}>Аптечка</span>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Когда тяжело — всё здесь и всегда бесплатно</span>
        </span>
        <span style={{ color: 'var(--ink-soft)', fontWeight: 800 }}>›</span>
      </button>
    </Sub>
  )
}
