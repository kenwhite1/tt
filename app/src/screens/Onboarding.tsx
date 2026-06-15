import { useEffect, useRef, useState } from 'react'
import { C } from '@shared/constants'
import { useStore } from '../store'
import { api } from '../api'
import { track } from '../analytics'
import { Mascot, MASCOTS, type Species } from '../art/Mascot'
import { declineName } from '../ru'
import { haptic, requestWriteAccess, addToHomeScreen, tg } from '../telegram'

/* ── content ─────────────────────────────────────────────────────────── */

const PRONOUNS = [
  { id: 'he', heart: '💙', ru: 'Он' },
  { id: 'she', heart: '💗', ru: 'Она' },
  { id: 'they', heart: '💛', ru: 'Пусть будет тайной' },
] as const

const TRAITS = [
  { id: 'curiosity', em: '🤔', ru: 'Любопытство' },
  { id: 'resilience', em: '😎', ru: 'Стойкость' },
  { id: 'compassion', em: '😍', ru: 'Доброта' },
  { id: 'logic', em: '🧐', ru: 'Логика' },
  { id: 'confidence', em: '🤠', ru: 'Уверенность' },
  { id: 'security', em: '😌', ru: 'Спокойствие' },
]

const PET_NAMES = ['Бублик', 'Тоша', 'Кнопа', 'Шуня', 'Барни', 'Соня', 'Пирожок', 'Луна', 'Персик', 'Марс']

const SECTIONS = [
  { key: 'about', label: 'О ТЕБЕ', count: 3 },
  { key: 'energy', label: 'ЭНЕРГИЯ И АКТИВНОСТЬ', count: 3 },
  { key: 'life', label: 'КАК ЖИЗНЬ', count: 3 },
  { key: 'support', label: 'ПОДДЕРЖКА', count: 1 },
]

type Q = {
  id: string; sec: number; q: string; sub?: string; multi?: boolean
  opts: { em?: string; lbl: string }[]; skip?: string
}
const QUESTIONS: Q[] = [
  { id: 'age', sec: 0, q: 'Сколько тебе лет?', sub: 'Это поможет настроить всё под тебя',
    opts: ['До 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65 и старше'].map(lbl => ({ lbl })) },
  { id: 'gender', sec: 0, q: 'Какой у тебя пол?', skip: 'Не хочу отвечать',
    opts: ['Мужской', 'Женский', 'Небинарный'].map(lbl => ({ lbl })) },
  { id: 'used', sec: 0, q: 'Пользовался(ась) такими приложениями раньше?',
    opts: [{ em: '🍼', lbl: 'Нет, это впервые!' }, { em: '🍵', lbl: 'Да, но начинаю заново' }] },
  { id: 'sleep', sec: 1, q: 'Сколько обычно спишь ночью?',
    opts: [{ em: '😴', lbl: 'Меньше 5 часов' }, { em: '🛏️', lbl: '5–7 часов' }, { em: '🌙', lbl: '7–9 часов' }, { em: '☀️', lbl: 'Больше 9 часов' }] },
  { id: 'bed', sec: 1, q: 'Легко ли тебе вставать с кровати?',
    opts: [{ em: '🐬', lbl: 'Очень легко, встаю быстро' }, { em: '🥒', lbl: 'Иногда легко, иногда тяжело' }, { em: '🧸', lbl: 'Тяжело, часто встаю с трудом' }] },
  { id: 'active', sec: 1, q: 'Насколько ты активен(на) днём?',
    opts: [{ em: '🏃', lbl: 'В движении почти весь день' }, { em: '🚶', lbl: 'Баланс покоя и движения' }, { em: '🪑', lbl: 'Мало двигаюсь, хочу больше' }, { em: '🌻', lbl: 'Есть ограничения по движению' }] },
  { id: 'overwhelm', sec: 2, q: 'Как часто ты чувствуешь себя перегруженным(ой)?',
    opts: [{ em: '😫', lbl: 'Несколько раз в неделю' }, { em: '🙁', lbl: 'Пара стрессовых дней в месяц' }, { em: '😌', lbl: 'Хорошо справляюсь со стрессом' }] },
  { id: 'support', sec: 2, q: 'На скольких людей можешь опереться в трудный момент?',
    opts: [{ em: '🌳', lbl: '3 и больше' }, { em: '🌿', lbl: '2' }, { em: '🌱', lbl: '1' }, { em: '🍃', lbl: 'Только на себя' }] },
  { id: 'routine', sec: 2, q: 'Насколько ты доволен(на) своим распорядком?',
    opts: [{ em: '🥳', lbl: 'Полностью, забочусь о себе хорошо' }, { em: '😌', lbl: 'Немного, хочу кое-что улучшить' }, { em: '😮', lbl: 'Совсем нет, жду больших перемен' }] },
  { id: 'areas', sec: 3, q: 'В каких сферах нужна поддержка?', multi: true,
    opts: [{ em: '✨', lbl: 'У меня всё хорошо, помощь не нужна' }, { em: '🌱', lbl: 'Завести и держать распорядок' }, { em: '🏔️', lbl: 'Справляться со стрессом и тревогой' }, { em: '🍎', lbl: 'Здоровое питание' }, { em: '🌻', lbl: 'Принятие себя и уверенность' }, { em: '🪥', lbl: 'Свежесть и чистота' }, { em: '❤️', lbl: 'Социальные навыки и связи' }] },
]

const HEAR = [
  { em: '🎬', lbl: 'YouTube' }, { em: '👨‍👩‍👧', lbl: 'Друзья / семья' }, { em: '✈️', lbl: 'Telegram' },
  { em: '📰', lbl: 'Новости / блоги' }, { em: '🎧', lbl: 'Подкасты' }, { em: '📺', lbl: 'Телевидение' },
  { em: '📷', lbl: 'Instagram / Facebook' }, { em: '🔍', lbl: 'Нашёл(ла) в Google' }, { em: '🎮', lbl: 'Игры' },
  { em: '🧑‍⚕️', lbl: 'Психолог / врач' },
]

// survey "areas" option index → self-care area (sca); tailors the starter plan
// index 0 = "всё хорошо, помощь не нужна" → maps to no self-care area
const AREA_SCA = ['', 'productivity', 'calm', 'nutrition', 'self_kindness', 'hygiene', 'connection']

const COMMIT = [
  { em: '🙌', days: 2, ru: '2 дня', end: 'Первые шаги' },
  { em: '💪', days: 5, ru: '5 дней', end: 'Хороший старт' },
  { em: '🎯', days: 7, ru: '7 дней', end: 'Серьёзный настрой' },
  { em: '🔥', days: 14, ru: '14 дней', end: 'Несокрушимая серия' },
]

const ORDER = [
  'welcome', 'species', 'pronouns', 'name', 'trait', 'uname', 'whatcare', 'affirm', 'reminders', 'learnyou',
  'q:age', 'q:gender', 'q:used', 'q:sleep', 'q:bed', 'q:active', 'q:overwhelm', 'q:support', 'q:routine', 'q:areas',
  'creating', 'plan', 'plus1', 'plus2', 'plus3', 'hear', 'streak', 'commit', 'widget',
] as const
type Step = typeof ORDER[number]

/* ── component ───────────────────────────────────────────────────────── */

export function Onboarding() {
  const { finishOnboarding, enterApp, tgName } = useStore()
  const goals = useStore(s => s.state?.goals)
  // When retaking from Settings the user is already registered — prefill the
  // current pet so tapping straight through changes nothing by accident.
  const pet = useStore(s => s.state?.pet)
  const meName = useStore(s => s.state?.user.name)
  const [step, setStep] = useState<Step>('welcome')
  const [species, setSpecies] = useState<Species>((pet?.species as Species) || 'dog')
  const [pronouns, setPronouns] = useState<'he' | 'she' | 'they'>(pet?.pronouns ?? 'he')
  const [petName, setPetName] = useState(() => pet?.name || PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)])
  const [trait, setTrait] = useState(pet?.trait ?? '')
  const [userName, setUserName] = useState(meName || tgName)
  const [ans, setAns] = useState<Record<string, number | number[]>>({})
  const [commit, setCommit] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const advTimer = useRef<ReturnType<typeof setTimeout>>()

  const sp = MASCOTS.find(m => m.id === species) ?? MASCOTS[0]
  const name = petName.trim() || 'малыш'
  const i = ORDER.indexOf(step)
  const go = (s: Step) => { haptic('tap'); setStep(s) }
  const next = () => go(ORDER[Math.min(ORDER.length - 1, i + 1)])
  const back = () => go(ORDER[Math.max(0, i - 1)])

  // tint Telegram chrome to match the current screen (white, or blue for celebration)
  useEffect(() => {
    const blue = step === 'streak' || step === 'commit'
    const c = blue ? '#36a9e1' : '#ffffff'
    try { tg?.setBackgroundColor(c); tg?.setHeaderColor(c) } catch { /* older clients */ }
  }, [step])

  // create the pet/goals on the backend, then reveal the starter plan
  useEffect(() => {
    if (step !== 'creating') return
    let alive = true
    setBusy(true)
    finishOnboarding({ petName: petName.trim(), pronouns, trait, species, userName: userName.trim() || 'Друг', areas: selectedAreas() })
      .then(() => { if (alive) { haptic('success'); void api.survey(buildSurvey()).catch(() => {}); setStep('plan') } })
      .catch(() => { if (alive) setStep('q:areas') })
      .finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { track('onboard_start') }, [])
  useEffect(() => () => clearTimeout(advTimer.current), [])

  function pickSingle(qid: string, idx: number) {
    haptic('tap'); setAns(a => ({ ...a, [qid]: idx }))
    clearTimeout(advTimer.current)
    advTimer.current = setTimeout(next, 200)
  }
  function toggleMulti(qid: string, idx: number) {
    haptic('tap')
    setAns(a => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as number[]) : []
      // 'areas' option 0 = "всё хорошо, помощь не нужна": a "none of the above"
      // choice that's mutually exclusive with the actual support areas.
      if (qid === 'areas' && idx === 0) return { ...a, [qid]: cur.includes(0) ? [] : [0] }
      const base = qid === 'areas' ? cur.filter(x => x !== 0) : cur
      return { ...a, [qid]: base.includes(idx) ? base.filter(x => x !== idx) : [...base, idx] }
    })
  }
  async function enableReminders() {
    setBusy(true)
    // the Telegram grant alone never reaches the server — tell it explicitly so DMs start
    try { if (await requestWriteAccess()) await api.enableNotifications().catch(() => {}) } catch { /* ignore */ }
    setBusy(false); next()
  }

  // collect the survey into a readable, self-describing blob for the backend
  function buildSurvey(): Record<string, unknown> {
    const out: Record<string, unknown> = { pronouns, trait, species }
    for (const qq of QUESTIONS) {
      const v = ans[qq.id]
      if (v == null) continue
      out[qq.id] = Array.isArray(v)
        ? v.map(idx => qq.opts[idx]?.lbl).filter(Boolean)
        : v === -1 ? 'skipped' : qq.opts[v]?.lbl
    }
    if (typeof ans.hear === 'number') out.hear = HEAR[ans.hear]?.lbl
    if (commit !== null) out.commitDays = COMMIT[commit].days
    return out
  }
  function finish() { track('onboard_complete'); void api.survey(buildSurvey()).catch(() => {}); enterApp() }

  // self-care areas (+ sleep/activity nudges) the user picked → tailors the starter plan
  function selectedAreas(): string[] {
    const set = new Set<string>()
    const a = ans['areas']
    if (Array.isArray(a)) for (const idx of a) { const s = AREA_SCA[idx]; if (s) set.add(s) }
    if (ans['sleep'] === 0 || ans['sleep'] === 1) set.add('sleep')
    if (ans['active'] === 2) set.add('movement')
    if (ans['overwhelm'] === 0 || ans['overwhelm'] === 1) set.add('calm')
    if (ans['support'] === 3) { set.add('connection'); set.add('self_kindness') }
    if (ans['routine'] === 2) set.add('productivity')
    return [...set]
  }

  // open the real Telegram Stars invoice; continue whatever the user decides
  async function buyPlus(plan: 'month' | 'year') {
    track('plus_invoice_open', { plan, from: 'onboarding' })
    try {
      const r = await api.subscribe(plan)
      if (r.link && tg?.openInvoice) { tg.openInvoice(r.link, () => next()); return }
    } catch { /* payments unavailable (dev / older client) */ }
    next()
  }

  /* survey screens are data-driven */
  if (step.startsWith('q:')) {
    const q = QUESTIONS.find(x => 'q:' + x.id === step)!
    const sec = SECTIONS[q.sec]
    const within = QUESTIONS.filter(x => x.sec === q.sec).findIndex(x => x.id === q.id)
    const selected = ans[q.id]
    const multiSel = Array.isArray(selected) ? selected : []
    return (
      <Shell
        top={<><button className="onb-chev" onClick={back} aria-label="Назад">‹</button><Progress sec={q.sec} within={within} count={sec.count} /></>}
        foot={q.multi ? <button className="onb-btn" disabled={multiSel.length === 0} onClick={next}>Дальше</button> : undefined}
      >
        <span className="onb-eyebrow">{sec.label}</span>
        <Pet species={species} size={120} badge="?" />
        <h1 className="onb-h1">{q.q}</h1>
        {q.sub && <p className="onb-sub">{q.sub}</p>}
        <div className="onb-opts">
          {q.opts.map((o, idx) => {
            const on = q.multi ? multiSel.includes(idx) : selected === idx
            return (
              <button key={idx} className={`onb-opt${on ? ' sel' : ''}`}
                onClick={() => (q.multi ? toggleMulti(q.id, idx) : pickSingle(q.id, idx))}>
                {o.em && <span className="em">{o.em}</span>}
                <span className="lbl">{o.lbl}</span>
                {q.multi
                  ? <span className="plus">{on ? '✓' : '+'}</span>
                  : on && <span className="chk">✓</span>}
              </button>
            )
          })}
        </div>
        {q.skip && <button className="onb-link muted" onClick={() => { setAns(a => ({ ...a, [q.id]: -1 })); next() }}>{q.skip}</button>}
      </Shell>
    )
  }

  switch (step) {
    case 'welcome':
      return (
        <Shell foot={
          <>
            <button className="onb-btn" onClick={next}>Завести питомца</button>
            <p className="onb-fine">Шарик это развлекательное приложение для заботы о себе в игровой форме. Это не медицинская или психологическая услуга, и оно не заменяет консультацию специалиста. Если тебе тяжело, пожалуйста, обратись за профессиональной помощью.</p>
          </>}>
          <Pet species={species} size={150} state="happy" />
          <h1 className="onb-h1" style={{ fontSize: 34 }}>Шарик</h1>
          <p className="onb-sub">Твой новый друг для заботы о себе.</p>
        </Shell>
      )

    case 'species':
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <h1 className="onb-h1">Кто будет твоим питомцем?</h1>
          <p className="onb-sub">Выбери друга, который будет расти вместе с тобой.</p>
          <div className="onb-species">
            {MASCOTS.map(m => (
              <button key={m.id} className={`onb-spec${species === m.id ? ' sel' : ''}`}
                onClick={() => { haptic('tap'); setSpecies(m.id) }} aria-label={m.ru}>
                <Mascot species={m.id} size={84} />
                <span className="nm">{m.ru}</span>
                {species === m.id && <span className="onb-spec-chk">✓</span>}
              </button>
            ))}
          </div>
        </Shell>
      )

    case 'pronouns':
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <Pet species={species} size={140} state="happy" />
          <h1 className="onb-h1">Теперь {name} с тобой!</h1>
          <p className="onb-sub" style={{ fontWeight: 800, color: 'var(--oink)' }}>Местоимения питомца</p>
          <div className="onb-opts">
            {PRONOUNS.map(pn => {
              const on = pronouns === pn.id
              return (
                <button key={pn.id} className={`onb-opt heart${on ? ' sel' : ''}`} onClick={() => { haptic('tap'); setPronouns(pn.id) }}>
                  <span className="em">{on ? pn.heart : '🤍'}</span>
                  <span className="lbl">{pn.ru}</span>
                  {on && <span className="chk" style={{ background: 'var(--ob)' }}>✓</span>}
                </button>
              )
            })}
          </div>
        </Shell>
      )

    case 'name':
      return (
        <Shell foot={
          <div className="onb-inrow">
            <button className="onb-btn sec" onClick={() => { haptic('tap'); setPetName(PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)]) }}>Перемешать</button>
            <button className="onb-btn" disabled={!petName.trim()} onClick={next}>Дальше</button>
          </div>}>
          <Pet species={species} size={120} />
          <h1 className="onb-h1">Как назовём питомца?</h1>
          <p className="onb-sub">Это можно поменять позже.</p>
          <input className="onb-input" value={petName} onChange={e => setPetName(e.target.value)} maxLength={24} />
        </Shell>
      )

    case 'trait':
      return (
        <Shell foot={<button className="onb-btn" disabled={!trait} onClick={next}>Дальше</button>}>
          <Pet species={species} size={120} state="happy" />
          <h1 className="onb-h1">Выбери черту для {declineName(name, 'gen')}</h1>
          <p className="onb-sub" style={{ fontWeight: 800, color: 'var(--oink)' }}>{name} ценит…</p>
          <div className="onb-opts">
            {TRAITS.map(t => {
              const on = trait === t.id
              return (
                <button key={t.id} className={`onb-opt${on ? ' sel' : ''}`} onClick={() => { haptic('tap'); setTrait(t.id) }}>
                  <span className="em">{t.em}</span>
                  <span className="lbl">{t.ru}</span>
                  {on && <span className="chk">✓</span>}
                </button>
              )
            })}
          </div>
        </Shell>
      )

    case 'uname':
      return (
        <Shell foot={<button className="onb-btn" disabled={!userName.trim()} onClick={next}>Дальше</button>}>
          <div className="onb-bubble tail">Привет! Спасибо, что выбрал(а) меня! Меня зовут {name}, а тебя как?</div>
          <Pet species={species} size={120} />
          <input className="onb-input" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Твоё имя" maxLength={32} />
        </Shell>
      )

    case 'whatcare':
      return (
        <Shell>
          <div className="onb-bubble tail">Приятно познакомиться, {userName.trim() || 'друг'}! Меня называют питомцем заботы о себе. А что такое забота о себе?</div>
          <Pet species={species} size={120} badge="?" />
          <div className="onb-opts" style={{ marginTop: 8 }}>
            <button className="onb-answer orange" onClick={next}>Забота о себе это когда заботишься о теле, разуме и отношениях и при этом радуешься жизни!</button>
            <button className="onb-answer pink" onClick={next}>Забота о себе это когда делаешь, что можешь, даже когда тебе непросто.</button>
          </div>
        </Shell>
      )

    case 'affirm': {
      const tr = TRAITS.find(t => t.id === trait) ?? TRAITS[0]
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <div className="onb-bubble tail">Ух ты! Когда ты заботишься о себе, ты заботишься и обо мне! Давай вместе!</div>
          <Pet species={species} size={130} state="happy" hold="❤️" />
          <div className="onb-stat">
            <span className="em">{tr.em}</span>
            <div><b>{name} получил(а)</b><span>+5.9 {tr.ru}</span></div>
          </div>
        </Shell>
      )
    }

    case 'reminders':
      return (
        <Shell foot={
          <>
            <button className="onb-btn" disabled={busy} onClick={enableReminders}>Включить напоминания</button>
            <button className="onb-btn sec" disabled={busy} onClick={next}>Может позже</button>
          </>}>
          <h1 className="onb-h1">Напоминания от {declineName(name, 'gen')}</h1>
          <div className="onb-noti">
            <span className="onb-noti-emoji" aria-hidden>{sp.emoji}</span>
            <div>
              <div className="nt">От {declineName(name, 'gen')}</div>
              <div className="nb">Не забудь попить воды!</div>
            </div>
            <span className="when">сейчас</span>
          </div>
          <Pet species={species} size={140} state="walking" />
        </Shell>
      )

    case 'learnyou':
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <Pet species={species} size={130} />
          <h1 className="onb-h1">Давай узнаем тебя получше!</h1>
          <p className="onb-sub">{name} хочет понять, как расти вместе с тобой.</p>
        </Shell>
      )

    case 'creating':
      return (
        <Shell>
          <div className="onb-pop"><Pet species={species} size={150} state="happy" /></div>
          <h1 className="onb-h1">Готовлю ваш дом…</h1>
        </Shell>
      )

    case 'plan':
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Поехали!</button>}>
          <div className="onb-bubble tail">У тебя всё получится!</div>
          <Pet species={species} size={110} />
          <div className="onb-pad">
            <div className="onb-pad-tabs">{Array.from({ length: 5 }).map((_, k) => <i key={k} />)}</div>
            <h3>Стартовый план {userName.trim() || ''}</h3>
            <div className="cap">Попробуй эти простые цели с {declineName(name, 'ins')}!</div>
            {(goals ?? []).slice(0, 7).map(g => (
              <div key={g.id} className="row"><span className="em">{g.emoji}</span><span>{g.title}</span></div>
            ))}
          </div>
        </Shell>
      )

    case 'plus1':
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <p className="onb-sub">Шарик бесплатный</p>
          <h1 className="onb-h1">А ещё дарим тебе <span className="onb-accent">7 дней Шарик Плюс!</span></h1>
          <Pet species={species} size={160} state="happy" hold="❤️" />
          <p className="onb-sub">Это подарок к знакомству. Сами по себе деньги не спишутся.</p>
        </Shell>
      )

    case 'plus2':
      return (
        <Shell foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <p className="onb-sub">Без скрытых платежей</p>
          <h1 className="onb-h1">Ничего не спишется <span className="onb-accent">само</span></h1>
          <Pet species={species} size={150} badge="⭐" />
          <p className="onb-sub">Шарик Плюс оплачивается звёздами Telegram и только когда ты сам(а) захочешь. Никаких автосписаний и карт.</p>
        </Shell>
      )

    case 'plus3': {
      const perMonth = Math.round(C.PLUS_YEAR_STARS / 12)
      return (
        <Shell foot={
          <>
            <button className="onb-btn" disabled={busy} onClick={() => void buyPlus('year')}>Оформить за {C.PLUS_YEAR_STARS} ⭐ на год</button>
            <button className="onb-link muted" onClick={next}>Пропустить</button>
          </>}>
          <p className="onb-sub"><span className="onb-accent" style={{ fontWeight: 800 }}>Лучшая цена</span></p>
          <h1 className="onb-h1">Шарик Плюс на целый год</h1>
          <Pet species={species} size={138} state="happy" badge="😎" />
          <div className="onb-stat" style={{ background: '#f2a93b' }}>
            <span className="em">⭐</span>
            <div><b>{C.PLUS_YEAR_STARS} звёзд за весь год</b><span>≈ {perMonth} ⭐/мес вместо {C.PLUS_MONTH_STARS} ⭐/мес</span></div>
          </div>
          <p className="onb-sub">Это разовая оплата за 365 дней, не ежемесячно. Отменять ничего не нужно.</p>
        </Shell>
      )
    }

    case 'hear': {
      const sel = ans['hear']
      return (
        <Shell foot={<button className="onb-btn" disabled={typeof sel !== 'number'} onClick={next}>Продолжить</button>}>
          <h1 className="onb-h1">Откуда ты узнал(а) о нас?</h1>
          <div className="onb-opts">
            {HEAR.map((h, idx) => (
              <button key={idx} className={`onb-opt${sel === idx ? ' sel' : ''}`} onClick={() => { haptic('tap'); setAns(a => ({ ...a, hear: idx })) }}>
                <span className="em">{h.em}</span><span className="lbl">{h.lbl}</span>{sel === idx && <span className="chk">✓</span>}
              </button>
            ))}
          </div>
        </Shell>
      )
    }

    case 'streak':
      return (
        <Shell blue foot={<button className="onb-btn" onClick={next}>Дальше</button>}>
          <div className="onb-float"><Pet species={species} size={150} state="happy" /></div>
          <div className="onb-big">1</div>
          <div className="onb-streak-label">ДЕНЬ ПОДРЯД</div>
          <div className="onb-week">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, k) => (
              <div key={d} className="d"><span>{d}</span><span className={`dot${k === 0 ? ' on' : ''}`}>{k === 0 ? '✓' : ''}</span></div>
            ))}
          </div>
        </Shell>
      )

    case 'commit':
      return (
        <Shell blue foot={<button className="onb-btn" disabled={commit === null} onClick={next}>Беру на себя!</button>}>
          <h1 className="onb-h1">Сколько дней подряд ты будешь заботиться о {declineName(name, 'prep')}?</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pet species={species} size={84} badge="?" />
            <div className="onb-bubble tail" style={{ fontSize: 15 }}>У тебя получится!</div>
          </div>
          <div className="onb-opts">
            {COMMIT.map((c, idx) => (
              <button key={idx} className={`onb-opt${commit === idx ? ' sel' : ''}`} onClick={() => { haptic('tap'); setCommit(idx) }}>
                <span className="em">{c.em}</span><span className="lbl">{c.ru}</span><span className="end">{c.end}</span>
              </button>
            ))}
          </div>
        </Shell>
      )

    case 'widget':
      return (
        <Shell foot={
          <>
            <button className="onb-btn" disabled={busy} onClick={async () => { setBusy(true); try { addToHomeScreen() } catch { /* ignore */ } setBusy(false); finish() }}>Добавить на главный экран</button>
            <button className="onb-btn sec" onClick={finish}>Не сейчас</button>
          </>}>
          <h1 className="onb-h1">Закрепи свою привычку!</h1>
          <p className="onb-sub">С приложением на главном экране держать привычки <span className="onb-accent" style={{ fontWeight: 800 }}>в 4 раза проще.</span></p>
          <div className="onb-phone">
            <div className="scr">
              <div className="wdg">{sp.emoji}</div>
              {Array.from({ length: 8 }).map((_, k) => <div key={k} className="ic" />)}
            </div>
          </div>
        </Shell>
      )
  }
}

/* ── pieces ──────────────────────────────────────────────────────────── */

function Shell({ children, foot, top, blue }: { children: React.ReactNode; foot?: React.ReactNode; top?: React.ReactNode; blue?: boolean }) {
  return (
    <div className={`onb${blue ? ' blue' : ''}`}>
      {blue && <div className="onb-rays" />}
      <div className="onb-scroll">
        {top && <div className="onb-top">{top}</div>}
        <div className="onb-body">{children}</div>
        {foot && <div className="onb-foot">{foot}</div>}
      </div>
    </div>
  )
}

function Pet({ species, size, state, badge, hold }: { species: Species; size: number; state?: 'idle' | 'happy' | 'walking' | 'sleeping'; badge?: string; hold?: string }) {
  return (
    <div className="onb-pet">
      <Mascot species={species} size={size} state={state ?? 'idle'} />
      {badge && <span className="badge">{badge}</span>}
      {hold && <span className="hold">{hold}</span>}
    </div>
  )
}

function Progress({ sec, within, count }: { sec: number; within: number; count: number }) {
  return (
    <div className="onb-prog">
      {SECTIONS.map((_, idx) => {
        const done = idx < sec
        const w = idx === sec ? `${(within / count) * 100}%` : '0%'
        return <div key={idx} className={`seg${done ? ' done' : ''}`}>{!done && <span className="fill" style={{ width: w }} />}</div>
      })}
    </div>
  )
}

