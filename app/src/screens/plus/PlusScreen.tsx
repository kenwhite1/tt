// «Дружок Плюс», the premium tier. Built 1:1 but DORMANT at launch: when the server
// reports enforced=false, everything is already free and the buy buttons show that.
import { useEffect, useState } from 'react'
import { req } from '../../api'
import { tg } from '../../telegram'
import { useStore } from '../../store'

interface ConfigDto { enforced: boolean; monthStars: number; yearStars: number }

const BENEFITS: { emoji: string; ru: string }[] = [
 { emoji: '🛍️', ru: '12 витрин в магазинах вместо 6 + вещь со скидкой −50% каждый день' },
 { emoji: '✈️', ru: '9 направлений у Сасси вместо 3' },
 { emoji: '🎁', ru: 'Вторая колонка наград в событии и микропитомец на 5 дней раньше' },
 { emoji: '🌈', ru: 'Гарантированный полный набор вещей события и выбор из 10 цветов' },
 { emoji: '💌', ru: 'Все 4 газеты в неделю и весь архив' },
 { emoji: '🌟', ru: '4 особых тёплых лучика для друзей' },
 { emoji: '🧘', ru: 'Все упражнения, дыхания и длительности таймеров' },
 { emoji: '🎨', ru: 'Любые эмодзи целей, цвета сфер заботы' },
 { emoji: '👗', ru: 'Бесконечные сохранённые образы, комнаты и окрасы' },
]

export function PlusScreen({ onClose }: { onClose(): void }) {
 const [cfg, setCfg] = useState<ConfigDto | null>(null)
 const [busy, setBusy] = useState(false)
 const showToast = useStore(s => s.showToast)

 useEffect(() => { void req<ConfigDto>('/payments/config').then(setCfg) }, [])

 async function subscribe(plan: 'month' | 'year') {
 if (busy || !cfg?.enforced) return
 setBusy(true)
 try {
 const r = await req<{ link?: string; dev?: boolean }>('/payments/subscribe', { plan })
 if (r.link && tg?.openInvoice) {
 tg.openInvoice(r.link, status => {
 if (status === 'paid') { showToast('Спасибо! Дружок Плюс активирован 💛'); void useStore.getState().refresh(); onClose() }
 })
 } else {
 showToast('Оплата пока недоступна')
 }
 } catch { showToast('Не получилось открыть оплату') }
 setBusy(false)
 }

 return (
 <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 70, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 8px)' }}>
 <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px 8px' }}>
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onClose}>✕</button>
 <h1 style={{ flex: 1 }}>Дружок Плюс</h1>
 </header>

 <div className="scroll">
 <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fbe3b2, #f8d77e)' }}>
 <div style={{ fontSize: 52 }}>💛</div>
 <h2>Поддержи Дружка и получи больше уюта</h2>
 <p style={{ color: 'var(--brown)', margin: '6px 0 0', fontSize: 14 }}>
 Все важные вещи заботы о себе всегда бесплатны. Плюс, это удобство и красота, а не стена.
 </p>
 </div>

 {BENEFITS.map((b, i) => (
 <div key={i} className="goal-row">
 <span style={{ fontSize: 22 }}>{b.emoji}</span>
 <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{b.ru}</span>
 </div>
 ))}

 {cfg && !cfg.enforced ? (
 <div className="card" style={{ textAlign: 'center', background: '#eef6e3', marginTop: 8 }}>
 <h2>Сейчас всё открыто бесплатно 💛</h2>
 <p style={{ color: 'var(--ink-soft)', margin: '6px 0 0', fontSize: 14 }}>
 Мы ещё не включили подписку, наслаждайся всеми возможностями без ограничений.
 </p>
 </div>
 ) : cfg ? (
 <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
 <button className="btn ghost" style={{ flex: 1, flexDirection: 'column' }} disabled={busy} onClick={() => void subscribe('month')}>
 <b>{cfg.monthStars} ⭐</b><span style={{ fontSize: 12 }}>в месяц</span>
 </button>
 <button className="btn accent" style={{ flex: 1, flexDirection: 'column' }} disabled={busy} onClick={() => void subscribe('year')}>
 <b>{cfg.yearStars} ⭐</b><span style={{ fontSize: 12 }}>на год · выгоднее</span>
 </button>
 </div>
 ) : null}
 </div>
 </div>
 )
}
