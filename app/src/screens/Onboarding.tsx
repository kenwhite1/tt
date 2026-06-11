import { useState } from 'react'
import { useStore } from '../store'
import { Puppy } from '../art/Puppy'
import { haptic } from '../telegram'

const EGGS = [
  { id: 'blue', hex: '#9DC9E8' }, { id: 'orange', hex: '#F2B463' }, { id: 'pink', hex: '#F2A8C0' },
  { id: 'green', hex: '#A8D3A0' }, { id: 'purple', hex: '#C0A8E0' }, { id: 'gray', hex: '#C9C5BD' },
]
const TRAITS = [
  { id: 'curiosity', ru: 'Любопытный' }, { id: 'confidence', ru: 'Смелый' },
  { id: 'compassion', ru: 'Добрый' }, { id: 'logic', ru: 'Рассудительный' },
  { id: 'resilience', ru: 'Стойкий' }, { id: 'security', ru: 'Спокойный' },
]
const PET_NAMES = ['Бублик', 'Тоша', 'Кнопа', 'Шуня', 'Барни', 'Соня', 'Пирожок', 'Луна']

export function Onboarding() {
  const { finishOnboarding, tgName } = useStore()
  const [step, setStep] = useState(0)
  const [egg, setEgg] = useState('')
  const [pronouns, setPronouns] = useState<'he' | 'she' | 'they'>('he')
  const [petName, setPetName] = useState('')
  const [trait, setTrait] = useState('')
  const [userName, setUserName] = useState(tgName)
  const next = () => { haptic('tap'); setStep(s => s + 1) }

  const Frame = ({ children, cta, ok }: { children: React.ReactNode; cta: string; ok: boolean }) => (
    <div className="screen" style={{ padding: '40px 22px calc(24px + var(--safe-bottom))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
        {children}
      </div>
      <button className="btn" style={{ width: '100%' }} disabled={!ok} onClick={step === 4 ? () => void finishOnboarding({ petName, pronouns, color: egg, trait, userName: userName || 'Друг' }) : next}>
        {cta}
      </button>
    </div>
  )

  if (step === 0) return (
    <Frame cta="Выбрать яйцо 🥚" ok={!!egg}>
      <h1>Из какого яйца вылупится твой щенок?</h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {EGGS.map(e => (
          <button key={e.id} onClick={() => { haptic('tap'); setEgg(e.id) }}
            style={{
              width: 64, height: 80, borderRadius: '50% 50% 46% 46%', background: e.hex, cursor: 'pointer',
              border: egg === e.id ? '4px solid var(--brown-deep)' : '4px solid transparent', boxShadow: 'var(--shadow-lip)',
            }} />
        ))}
      </div>
    </Frame>
  )

  if (step === 1) return (
    <Frame cta="Дальше" ok>
      <Puppy state="happy" size={150} />
      <h1>Ура, щенок родился! 🎉</h1>
      <p>Кто это у нас?</p>
      <div style={{ display: 'flex', gap: 10 }}>
        {([['he', 'Мальчик'], ['she', 'Девочка'], ['they', 'Не важно']] as const).map(([id, ru]) => (
          <button key={id} className={pronouns === id ? 'btn' : 'btn ghost'} onClick={() => setPronouns(id)}>{ru}</button>
        ))}
      </div>
    </Frame>
  )

  if (step === 2) return (
    <Frame cta="Дальше" ok={petName.trim().length > 0}>
      <Puppy size={120} />
      <h1>Как назовёшь?</h1>
      <input
        value={petName} onChange={e => setPetName(e.target.value)} placeholder="Имя щенка" maxLength={30}
        style={{ width: '100%', border: '3px solid var(--gold)', borderRadius: 14, padding: '12px 14px', fontSize: 18, textAlign: 'center', fontFamily: 'inherit' }}
      />
      <button className="btn ghost" onClick={() => setPetName(PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)])}>🎲 Случайное имя</button>
    </Frame>
  )

  if (step === 3) return (
    <Frame cta="Дальше" ok={!!trait}>
      <h1>Какой {petName || 'твой щенок'} по характеру?</h1>
      <p style={{ color: 'var(--ink-soft)' }}>Это даст небольшой бонус к развитию</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {TRAITS.map(t => (
          <button key={t.id} className={trait === t.id ? 'btn' : 'btn ghost'} onClick={() => setTrait(t.id)}>{t.ru}</button>
        ))}
      </div>
    </Frame>
  )

  return (
    <Frame cta="Начать! 🐾" ok={userName.trim().length > 0}>
      <Puppy state="happy" size={120} />
      <h1>А тебя как зовут?</h1>
      <p style={{ color: 'var(--ink-soft)' }}>{petName} будет обращаться к тебе по имени</p>
      <input
        value={userName} onChange={e => setUserName(e.target.value)} placeholder="Твоё имя" maxLength={40}
        style={{ width: '100%', border: '3px solid var(--gold)', borderRadius: 14, padding: '12px 14px', fontSize: 18, textAlign: 'center', fontFamily: 'inherit' }}
      />
    </Frame>
  )
}
