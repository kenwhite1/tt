import { displayText } from "../../../i18n"
// Доброе дело: suggestions list from goal ideas (kindness category); tap «Сделал(а)» logs it.
import { useEffect, useState } from 'react'
import { req } from '../../../api'
import { haptic } from '../../../telegram'
import { Loading, Sub, applyReward } from '../ui'
import { t } from '../../../i18n'
import type { GoalIdeasDto, Reward } from '../types'

// Warm fallback ideas in case the kindness category is sparse.
const FALLBACK = () => [
 { id: 'kd_message', ru: t('написать кому-то тёплое сообщение'), emoji: '💌' },
 { id: 'kd_thanks', ru: t('поблагодарить близкого человека'), emoji: '🙏' },
 { id: 'kd_help', ru: t('предложить помощь тому, кому трудно'), emoji: '🤝' },
 { id: 'kd_compliment', ru: t('сделать искренний комплимент'), emoji: '🌷' },
 { id: 'kd_self', ru: t('сделать что-то доброе для себя'), emoji: '💛' },
]

export function GoodDeed({ onBack }: { onBack(): void }) {
 const [ideas, setIdeas] = useState<{ id: string; ru: string; emoji: string }[] | null>(null)
 const [busyId, setBusyId] = useState<string | null>(null)

 useEffect(() => {
 req<GoalIdeasDto>('/activities/goal-ideas')
 .then(d => {
 const kind = d.goals.filter(g => g.category === 'kindness').map(g => ({ id: g.id, ru: g.ru, emoji: g.emoji }))
 setIdeas(kind.length ? kind : FALLBACK())
 })
 .catch(() => setIdeas(FALLBACK()))
 }, [])

 async function didIt(id: string) {
 if (busyId) return
 setBusyId(id)
 haptic('success')
 try {
 const r = await req<{ reward: Reward }>('/activities/log', { kind: 'kindness', refId: id })
 applyReward(r.reward, t('Доброта возвращается 💛'))
 } catch { /* keep it warm */ }
 onBack()
 }

 return (
 <Sub title={t('Доброе дело')} onBack={onBack}>
 <p style={{ color: 'var(--ink-soft)', margin: '0 4px 12px' }}>{t('Маленькое добро, большим теплом. Выбери, что сделаешь сегодня.')}</p>
 {!ideas && <Loading />}
 {ideas?.map(g => (
 <div key={g.id} className="goal-row">
 <span style={{ fontSize: 24 }}>{g.emoji}</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{displayText(g.ru)}</span>
 <button className="btn" style={{ padding: '8px 14px', fontSize: 14 }} disabled={busyId === g.id} onClick={() => void didIt(g.id)}>
 {t('Сделал(а)')}
 </button>
 </div>
 ))}
 </Sub>
 )
}
