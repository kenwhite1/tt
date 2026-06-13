import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Puppy } from '../art/Puppy'
import { req } from '../api'
import { haptic, getStartParam, requestWriteAccess, addToHomeScreen } from '../telegram'

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

// the pet's first little question, answers are warm, each leans on a personality side
const RESONATE = {
 q: 'Что тебе сейчас звучит теплее всего?',
 options: [
 'Можно не торопиться',
 'Я справлюсь, шаг за шагом',
 'Я не один(а)',
 'Сегодня я выбираю заботу о себе',
 ],
}
const HOW = [
 { emoji: '🐾', ru: 'Отмечай маленькие цели заботы о себе' },
 { emoji: '⚡', ru: 'Щенок наполняется энергией и уходит на прогулки' },
 { emoji: '💛', ru: 'Никакой гонки: маленький шаг это уже шаг' },
]
const SURVEY = ['Впервые', 'Немного пробовал(а)', 'Да, не раз']

type Step =
 | 'welcome' | 'egg' | 'hatch' | 'pronouns' | 'name' | 'trait' | 'you'
 | 'resonate' | 'how' | 'survey' | 'creating' | 'firstgoal' | 'reminder' | 'invite'

export function Onboarding() {
 const { finishOnboarding, enterApp, tgName } = useStore()
 const goals = useStore(s => s.state?.goals) // stable ref; fallback applied in render (a `?? []` here loops)
 const [step, setStep] = useState<Step>('welcome')
 const [egg, setEgg] = useState('')
 const [pronouns, setPronouns] = useState<'he' | 'she' | 'they'>('he')
 const [petName, setPetName] = useState('')
 const [trait, setTrait] = useState('')
 const [userName, setUserName] = useState(tgName)
 const [resonate, setResonate] = useState<number | null>(null)
 const [survey, setSurvey] = useState<number | null>(null)
 const [inviteCode, setInviteCode] = useState('')
 const [inviteMsg, setInviteMsg] = useState('')
 const [busy, setBusy] = useState(false)

 // pre-fill invite code from a ref_ deep link
 useEffect(() => {
 const p = getStartParam()
 if (p && p.startsWith('ref_')) setInviteCode(p.slice(4))
 }, [])

 const name = petName.trim() || 'щенок'
 const go = (s: Step) => { haptic('tap'); setStep(s) }

 async function createAccount() {
 setBusy(true)
 setStep('creating')
 try {
 await finishOnboarding({ petName: petName.trim(), pronouns, color: egg, trait, userName: userName.trim() || 'Друг' })
 setStep('firstgoal')
 } catch {
 setStep('survey') // let them retry
 } finally {
 setBusy(false)
 }
 }

 async function enableReminders() {
 setBusy(true)
 try { await requestWriteAccess(); addToHomeScreen() } catch { /* ignore */ }
 setBusy(false)
 go('invite')
 }

 async function applyInvite() {
 if (!inviteCode.trim() || busy) return
 setBusy(true)
 try {
 const r = await req<{ ok: boolean; inviterName?: string }>('/social/referral', { code: inviteCode.trim() })
 setInviteMsg(r.ok ? `Ура! ${r.inviterName ?? 'Друг'} пригласил(а) тебя, скоро прибежит подарок 🎁` : 'Такой код не нашёлся, но это не страшно 💛')
 } catch {
 setInviteMsg('Не получилось применить код, но это не страшно 💛')
 }
 haptic('success')
 setBusy(false)
 setTimeout(() => enterApp(), 1100)
 }

 return (
 <div className="screen" style={{ padding: 'calc(var(--safe-top) + 24px) 22px calc(24px + var(--safe-bottom))', display: 'flex', flexDirection: 'column' }}>
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>

 {step === 'welcome' && (<>
 <Puppy state="sleeping" size={150} />
 <h1>Привет! 🐶</h1>
 <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>
 Сейчас у тебя появится маленький золотистый щенок. Он будет расти, когда ты заботишься о себе.
 Здесь нет гонки и оценок, только тёплые маленькие шаги в твоём темпе.
 </p>
 </>)}

 {step === 'egg' && (<>
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
 </>)}

 {step === 'hatch' && <Hatch eggHex={EGGS.find(e => e.id === egg)?.hex ?? '#F2B463'} />}

 {step === 'pronouns' && (<>
 <Puppy state="happy" size={150} />
 <h1>Кто это у нас?</h1>
 <div style={{ display: 'flex', gap: 10 }}>
 {([['he', 'Мальчик'], ['she', 'Девочка'], ['they', 'Пусть будет тайной']] as const).map(([id, ru]) => (
 <button key={id} className={pronouns === id ? 'btn' : 'btn ghost'} onClick={() => { haptic('tap'); setPronouns(id) }}>{ru}</button>
 ))}
 </div>
 </>)}

 {step === 'name' && (<>
 <Puppy size={120} />
 <h1>Как назовёшь?</h1>
 <input value={petName} onChange={e => setPetName(e.target.value)} placeholder="Имя щенка" maxLength={30}
 style={inputStyle} />
 <button className="btn ghost" onClick={() => setPetName(PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)])}>🎲 Случайное имя</button>
 </>)}

 {step === 'trait' && (<>
 <h1>Какой {name} по характеру?</h1>
 <p style={{ color: 'var(--ink-soft)' }}>Это даст небольшой бонус к развитию</p>
 <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
 {TRAITS.map(t => (
 <button key={t.id} className={trait === t.id ? 'btn' : 'btn ghost'} onClick={() => { haptic('tap'); setTrait(t.id) }}>{t.ru}</button>
 ))}
 </div>
 </>)}

 {step === 'you' && (<>
 <Puppy state="happy" size={120} />
 <h1>А тебя как зовут?</h1>
 <p style={{ color: 'var(--ink-soft)' }}>{name} будет обращаться к тебе по имени</p>
 <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Твоё имя" maxLength={40} style={inputStyle} />
 </>)}

 {step === 'resonate' && (<>
 <Puppy size={120} />
 <h1>{name} что-то хочет спросить…</h1>
 <p style={{ fontWeight: 800 }}>{RESONATE.q}</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
 {RESONATE.options.map((o, i) => (
 <button key={i} className={resonate === i ? 'btn' : 'btn ghost'} style={{ width: '100%' }} onClick={() => { haptic('tap'); setResonate(i) }}>{o}</button>
 ))}
 </div>
 {resonate !== null && <p style={{ color: 'var(--ink-soft)' }}>{name} прижался к тебе. Кажется, вы поняли друг друга 💛</p>}
 </>)}

 {step === 'how' && (<>
 <h1>Как мы будем расти вместе</h1>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
 {HOW.map((h, i) => (
 <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', margin: 0 }}>
 <span style={{ fontSize: 28 }}>{h.emoji}</span>
 <span style={{ fontWeight: 700 }}>{h.ru}</span>
 </div>
 ))}
 </div>
 </>)}

 {step === 'survey' && (<>
 <Puppy size={110} />
 <h1>Бывал(а) в приложениях для заботы о себе?</h1>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
 {SURVEY.map((o, i) => (
 <button key={i} className={survey === i ? 'btn' : 'btn ghost'} style={{ width: '100%' }} onClick={() => { haptic('tap'); setSurvey(i) }}>{o}</button>
 ))}
 </div>
 </>)}

 {step === 'creating' && (<>
 <Puppy state="happy" size={150} />
 <h1>Готовлю ваш дом… 🏡</h1>
 </>)}

 {step === 'firstgoal' && (<>
 <Puppy state="happy" size={120} />
 <h1>Вот твои первые цели</h1>
 <p style={{ color: 'var(--ink-soft)' }}>Отметь хотя бы одну, и {name} начнёт расти!</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
 {(goals ?? []).slice(0, 4).map(g => (
 <div key={g.id} className="goal-row" style={{ margin: 0 }}>
 <span className="goal-check">{g.emoji}</span>
 <span style={{ fontWeight: 800 }}>{g.title}</span>
 </div>
 ))}
 </div>
 </>)}

 {step === 'reminder' && (<>
 <Puppy size={120} />
 <h1>Можно я буду напоминать о себе?</h1>
 <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>
 Я буду тихонько присылать тёплые слова утром и вечером и помогать не терять серию.
 Без спама, обещаю. Это можно выключить в любой момент.
 </p>
 </>)}

 {step === 'invite' && (<>
 <Puppy state="happy" size={110} />
 <h1>Тебя пригласил друг?</h1>
 <p style={{ color: 'var(--ink-soft)' }}>Введи его код, вы оба получите подарок 🎁</p>
 <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Код друга" maxLength={20}
 style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 2 }} />
 {inviteMsg && <p style={{ color: 'var(--brown)', fontWeight: 700 }}>{inviteMsg}</p>}
 </>)}
 </div>

 {/* footer */}
 <Footer
 step={step} busy={busy}
 egg={egg} pronouns={pronouns} petName={petName} trait={trait} userName={userName}
 resonate={resonate} survey={survey} inviteCode={inviteCode}
 go={go} createAccount={createAccount} enableReminders={enableReminders} applyInvite={applyInvite} enterApp={enterApp}
 />
 </div>
 )
}

const inputStyle: React.CSSProperties = {
 width: '100%', border: '3px solid var(--gold)', borderRadius: 14, padding: '12px 14px',
 fontSize: 18, textAlign: 'center', fontFamily: 'inherit',
}

// Egg → crack → puppy reveal (auto after a beat).
function Hatch({ eggHex }: { eggHex: string }) {
 const [open, setOpen] = useState(false)
 const t = useRef<ReturnType<typeof setTimeout>>()
 useEffect(() => { t.current = setTimeout(() => { setOpen(true); haptic('success') }, 1300); return () => clearTimeout(t.current) }, [])
 return (
 <>
 {open ? <Puppy state="happy" size={160} /> : (
 <div style={{
 width: 110, height: 138, borderRadius: '50% 50% 46% 46%', background: eggHex,
 boxShadow: 'var(--shadow-lip)', animation: 'breathe 0.5s ease-in-out infinite',
 }} />
 )}
 <h1>{open ? 'Ура, он вылупился! 🎉' : 'Яйцо шевелится…'}</h1>
 </>
 )
}

interface FooterProps {
 step: Step; busy: boolean
 egg: string; pronouns: string; petName: string; trait: string; userName: string
 resonate: number | null; survey: number | null; inviteCode: string
 go: (s: Step) => void; createAccount: () => void; enableReminders: () => void; applyInvite: () => void; enterApp: () => void
}

function Footer(p: FooterProps) {
 const btn = (label: string, ok: boolean, onClick: () => void) => (
 <button className="btn" style={{ width: '100%' }} disabled={!ok || p.busy} onClick={onClick}>{label}</button>
 )
 switch (p.step) {
 case 'welcome': return btn('Поехали! 🥚', true, () => p.go('egg'))
 case 'egg': return btn('Выбрать яйцо', !!p.egg, () => p.go('hatch'))
 case 'hatch': return btn('Познакомиться', true, () => p.go('pronouns'))
 case 'pronouns': return btn('Дальше', true, () => p.go('name'))
 case 'name': return btn('Дальше', p.petName.trim().length > 0, () => p.go('trait'))
 case 'trait': return btn('Дальше', !!p.trait, () => p.go('you'))
 case 'you': return btn('Дальше', p.userName.trim().length > 0, () => p.go('resonate'))
 case 'resonate': return btn('Дальше', p.resonate !== null, () => p.go('how'))
 case 'how': return btn('Понятно!', true, () => p.go('survey'))
 case 'survey': return btn('Создать щенка 🐾', p.survey !== null, p.createAccount)
 case 'creating': return <div style={{ height: 50 }} />
 case 'firstgoal': return btn('За дело! 🐾', true, () => p.go('reminder'))
 case 'reminder': return (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <button className="btn" style={{ width: '100%' }} disabled={p.busy} onClick={p.enableReminders}>Да, напоминай 🔔</button>
 <button className="btn ghost" style={{ width: '100%' }} disabled={p.busy} onClick={() => p.go('invite')}>Не сейчас</button>
 </div>
 )
 case 'invite': return (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 <button className="btn" style={{ width: '100%' }} disabled={!p.inviteCode.trim() || p.busy} onClick={p.applyInvite}>Применить код</button>
 <button className="btn ghost" style={{ width: '100%' }} disabled={p.busy} onClick={p.enterApp}>Пропустить</button>
 </div>
 )
 }
}
