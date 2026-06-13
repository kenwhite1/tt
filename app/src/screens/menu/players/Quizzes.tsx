// Викторины: gentle self-check quizzes. Scaled options → sum score → band result card.
import { useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Loading, Sub, applyReward, useContent } from '../ui'
import type { QuizDef, Reward } from '../types'

interface QuizResult { band: { title: string; text: string }; disclaimer: string; reward: Reward }

function Player({ quiz, scale, onDone }: { quiz: QuizDef; scale: { ru: string; score: number }[]; onDone(): void }) {
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  async function answer(score: number) {
    haptic('tap')
    const next = [...answers, score]
    setAnswers(next)
    if (qIdx < quiz.questions.length - 1) { setQIdx(qIdx + 1); return }
    // last → submit
    if (busy) return
    setBusy(true)
    const total = next.reduce((s, v) => s + v, 0)
    try {
      const r = await req<QuizResult>('/activities/quiz', { quizId: quiz.id, score: total })
      applyReward(r.reward, 'Спасибо, что прислушался(ась) к себе 💛')
      setResult(r)
    } catch { onDone() }
    setBusy(false)
  }

  if (result) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
        <div style={{ fontSize: 44 }}>🌤️</div>
        <h2 style={{ margin: '6px 0' }}>{result.band.title}</h2>
        <p style={{ lineHeight: 1.5 }}>{result.band.text}</p>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 14, fontStyle: 'italic' }}>{result.disclaimer}</p>
        <button className="btn" style={{ marginTop: 8 }} onClick={onDone}>Готово</button>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 8 }}>Вопрос {qIdx + 1} из {quiz.questions.length}</div>
      <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, minHeight: 70 }}>{quiz.questions[qIdx]}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {scale.map(opt => (
          <button
            key={opt.score} disabled={busy}
            onClick={() => void answer(opt.score)}
            className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start' }}
          >{opt.ru}</button>
        ))}
      </div>
    </div>
  )
}

export function Quizzes({ onBack }: { onBack(): void }) {
  const content = useContent()
  const [quiz, setQuiz] = useState<QuizDef | null>(null)

  if (!content) return <Sub title="Викторины" onBack={onBack}><Loading /></Sub>
  if (!content.quizzes) {
    return (
      <Sub title="Викторины" onBack={onBack}>
        <div className="card"><p style={{ color: 'var(--ink-soft)' }}>Викторины выключены. Включи их в Настройках, если хочешь мягкие самопроверки.</p></div>
      </Sub>
    )
  }
  const { disclaimer, scales, list } = content.quizzes
  const plus = content.plus

  if (quiz) {
    const scale = scales[quiz.scale] ?? []
    return <Sub title={quiz.name} onBack={onBack}><Player quiz={quiz} scale={scale} onDone={onBack} /></Sub>
  }

  return (
    <Sub title="Викторины" onBack={onBack}>
      <div className="card" style={{ background: 'var(--card-shade)' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>{disclaimer}</p>
      </div>
      {list.map(q => {
        const locked = q.plus && !plus
        return (
          <button
            key={q.id} className="goal-row"
            style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, opacity: locked ? 0.6 : 1 }}
            onClick={() => { if (!locked) { haptic('tap'); setQuiz(q) } }}
          >
            <span style={{ fontSize: 24 }}>📋</span>
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 800, display: 'block' }}>{q.name}{locked ? ' 🔒' : ''}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{q.questions.length} вопросов</span>
            </span>
          </button>
        )
      })}
    </Sub>
  )
}
