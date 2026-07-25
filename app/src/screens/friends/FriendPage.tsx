// Friend page (sub-view): their puppy in their room, ❤ friendship level, Send Good Vibes,
// shared-goal streak strips, last-4-events feed, buddy/share goal, ⋯ menu.
import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { Friend, FriendsPayload, Vibe, Compliment } from './api'
import { social } from './api'
import { PuppyMini, Sheet, levelName, levelProgress } from './ui'
import { VibePicker } from './VibePicker'
import { t } from '../../i18n'

const EMOJI_CHOICES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦄', '🌸', '⭐', '💛', '🌳', '🍀']
const REPORT_REASONS = [
 { id: 'spam', ru: 'Спам или реклама' },
 { id: 'rude', ru: 'Грубость или травля' },
 { id: 'inappropriate', ru: 'Неприемлемое поведение' },
 { id: 'other', ru: 'Другое' },
]

export function FriendPage({ data, friend, onBack, reload }:
 { data: FriendsPayload; friend: Friend; onBack: () => void; reload: () => void }) {
 const goals = useStore(s => s.state?.goals ?? [])
 const [vibeOpen, setVibeOpen] = useState(false)
 const [menuOpen, setMenuOpen] = useState(false)
 const [renaming, setRenaming] = useState(false)
 const [emojiOpen, setEmojiOpen] = useState(false)
 const [shareOpen, setShareOpen] = useState<'share' | 'buddy' | null>(null)
 const [nick, setNick] = useState(friend.name)
 const [busy, setBusy] = useState(false)
 const [freezeBusy, setFreezeBusy] = useState(false)
 const [complimentOpen, setComplimentOpen] = useState(false)
 const [reportOpen, setReportOpen] = useState(false)

 const lvl = levelProgress(friend.pts, friend.level)

 async function giftFreeze() {
 if (freezeBusy) return
 setFreezeBusy(true)
 try {
 const r = await social.giftFreeze(friend.id)
 haptic('success')
 useStore.getState().showToast(r.usedBanked ? `${t('Подарил(а)')} ${friend.name} ${t('косточку-спасалочку 🦴')}` : t('Купил(а) и подарил(а) спасалочку 🦴'))
 if (!r.usedBanked) void useStore.getState().refresh()
 reload()
 } catch (e) {
 haptic('warn')
 const er = (e as { data?: { error?: string } })?.data?.error
 useStore.getState().showToast(er === 'not_enough_stones' ? t('Не хватает G') : er === 'sent_today' ? t('Сегодня уже дарил(а)') : t('Не вышло'))
 }
 setFreezeBusy(false)
 }

 async function sendVibe(v: Vibe) {
 setVibeOpen(false)
 try {
 const r = await social.sendVibe(friend.id, v.id)
 haptic('success')
 const bits: string[] = []
 if (r.reward.energy) bits.push(`+${r.reward.energy}⚡`)
 if (r.reward.stones) bits.push(`+${r.reward.stones} G`)
 if (r.reward.walkMinutesReduced) bits.push(`${t('прогулка')} −${r.reward.walkMinutesReduced} ${t('мин')}`)
 useStore.getState().showToast(`${t('Лучик')} ${v.emoji} ${t('полетел к')} ${friend.name}! ${bits.join(' ')}`.trim())
 if (r.reward.energy || r.reward.stones || r.reward.walkMinutesReduced) void useStore.getState().refresh()
 reload()
 } catch (e) {
 haptic('warn')
 useStore.getState().showToast((e as { message?: string }).message === 'plus_required' ? t('Этот лучик для Plus 🔒') : t('Не вышло отправить'))
 }
 }

 async function doKudos(goalId: number) {
 try { await social.kudos(goalId, friend.id); haptic('success'); useStore.getState().showToast(t('Похвалил(а) друга! 👏')) }
 catch { haptic('warn'); useStore.getState().showToast(t('Не вышло')) }
 }

 async function saveNick() {
 setRenaming(false)
 const v = nick.trim()
 try { await social.edit(friend.id, { nickname: v || null }); haptic('tap'); reload() } catch { haptic('warn') }
 }

 async function setEmoji(em: string | null) {
 setEmojiOpen(false)
 try { await social.edit(friend.id, { emoji: em }); haptic('tap'); reload() } catch { haptic('warn') }
 }

 async function toggleMute() {
 setMenuOpen(false)
 try { await social.edit(friend.id, { muted: !friend.muted }); haptic('tap'); useStore.getState().showToast(friend.muted ? t('Снова слышишь друга') : t('Лучики приглушены')); reload() }
 catch { haptic('warn') }
 }

 async function doUnfriend(block: boolean) {
 if (busy) return
 setBusy(true)
 try {
 await social.unfriend(friend.id, block)
 haptic('success')
 useStore.getState().showToast(block ? t('Заблокирован(а)') : t('Больше не друзья'))
 onBack(); reload()
 } catch { haptic('warn'); setBusy(false) }
 }

 async function doShare(goalId: number) {
 setShareOpen(null)
 try {
 if (shareOpen === 'buddy') { await social.buddyGoal(goalId, friend.id); useStore.getState().showToast(t('Приглашение к общей цели отправлено! 🤝')) }
 else { await social.shareGoal(goalId, [friend.id]); useStore.getState().showToast(t('Цель теперь общая ⭐')) }
 haptic('success'); reload()
 } catch { haptic('warn'); useStore.getState().showToast(t('Не вышло')) }
 }

 return (
 <div className="scroll" style={{ paddingTop: 4 }}>
 <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={onBack}>{t('‹ Дворик')}</button>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={() => setMenuOpen(true)}>⋯</button>
 </header>

 {/* friend's room */}
 <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(#f6e7c8 0%, #efe0bd 100%)', position: 'relative' }}>
 <PuppyMini stage={friend.stage} color={friend.color} dyes={friend.dyes} size={150} state="happy" />
 <h1 style={{ marginTop: 4 }}>{friend.emoji ? `${friend.emoji} ` : ''}{friend.name}</h1>
 <div style={{ color: 'var(--ink-soft)', fontWeight: 800, fontSize: 14 }}>{t('питомец')} {friend.petName}</div>

 {/* friendship level */}
 <div style={{ marginTop: 14, padding: '0 8px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
 <span>❤️ {levelName(friend.level)}</span>
 <span style={{ color: 'var(--ink-soft)' }}>{t('ур.')} {friend.level}</span>
 </div>
 <div className="energy-track" style={{ height: 14 }}>
 <div className="energy-fill love" style={{ width: `${Math.round(lvl.ratio * 100)}%` }} />
 </div>
 {lvl.next != null && (
 <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{Math.floor(friend.pts)} / {lvl.next} {t('очков дружбы')}</div>
 )}
 </div>
 </div>

 {/* gentle streak-freeze surfacing (care, never nag) */}
 {friend.atRisk && (
 <div className="card" style={{ background: '#eaf4ff', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
 <span style={{ fontSize: 24 }}>🦴</span>
 <div style={{ flex: 1, fontSize: 14 }}>{t('У')} <b>{friend.name}</b> {t('серия под угрозой. Подаришь косточку-спасалочку?')}</div>
 <button className="btn accent" style={{ padding: '8px 12px' }} disabled={freezeBusy} onClick={() => void giftFreeze()}>{t('Подарить')}</button>
 </div>
 )}

 <button className="btn accent" style={{ width: '100%', marginBottom: 10 }} onClick={() => setVibeOpen(true)}>
 {t('🌟 Послать тёплый лучик')}
 </button>

 <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
 <button className="btn ghost" style={{ flex: 1 }} onClick={() => setComplimentOpen(true)}>{t('💌 Комплимент')}</button>
 <button className="btn ghost" style={{ flex: 1 }} disabled={freezeBusy} onClick={() => void giftFreeze()}>{t('🦴 Спасалочка')}</button>
 </div>

 <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
 <button className="btn ghost" style={{ flex: 1 }} onClick={() => setShareOpen('share')}>{t('⭐ Поделиться целью')}</button>
 <button className="btn ghost" style={{ flex: 1 }} onClick={() => setShareOpen('buddy')}>{t('🤝 Общая цель')}</button>
 </div>

 {/* shared goal streak strips */}
 {friend.sharedGoals.length > 0 && (
 <>
 <h2 style={{ margin: '6px 4px 10px' }}>{t('Общие цели')}</h2>
 {friend.sharedGoals.map(g => (
 <div key={`${g.kind}-${g.goalId}`} className="goal-row">
 <span style={{ fontSize: 26 }}>{g.emoji || '⭐'}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{g.title}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 🔥 {g.streak} {g.kind === 'buddy' ? t('· напарники') : t('· у друга')} {g.doneToday ? t('· сегодня ✓') : ''}
 </div>
 </div>
 {!g.mine && (
 <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => void doKudos(g.goalId)}>👏</button>
 )}
 </div>
 ))}
 </>
 )}

 {/* last-4-events feed */}
 <h2 style={{ margin: '6px 4px 10px' }}>{t('Что нового')}</h2>
 {friend.feed.length === 0 ? (
 <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>{t('Пока тихо, но скоро будут новости ✨')}</div>
 ) : (
 <div className="card" style={{ padding: '6px 0' }}>
 {friend.feed.map((e, i) => (
 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 16px', borderTop: i ? '1px solid var(--card-shade)' : 'none' }}>
 <span style={{ fontWeight: 700 }}>{e.text}</span>
 <span style={{ color: 'var(--ink-soft)', fontSize: 12, whiteSpace: 'nowrap' }}>{e.day.slice(5)}</span>
 </div>
 ))}
 </div>
 )}

 {vibeOpen && (
 <Sheet onClose={() => setVibeOpen(false)}>
 <VibePicker vibes={data.vibeTypes} plus={data.plus} onPick={v => void sendVibe(v)} title={`${t('Тёплый лучик для')} ${friend.name}`} />
 </Sheet>
 )}

 {shareOpen && (
 <Sheet onClose={() => setShareOpen(null)}>
 <h2 style={{ textAlign: 'center', marginBottom: 4 }}>
 {shareOpen === 'buddy' ? t('Общая цель') : t('Поделиться целью')}
 </h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px' }}>
 {shareOpen === 'buddy' ? t('Идём к цели плечом к плечу, по разу в день') : `${friend.name} ${t('будет видеть твой стрик')}`}
 </p>
 {goals.length === 0 ? (
 <div style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>{t('Сначала заведи цель на Главной 🌱')}</div>
 ) : goals.map(g => (
 <button key={g.id} className="goal-row" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => void doShare(g.id)}>
 <span style={{ fontSize: 24 }}>{g.emoji}</span>
 <span style={{ flex: 1, fontWeight: 800 }}>{g.title}</span>
 <span style={{ color: 'var(--accent-deep)', fontWeight: 800 }}>›</span>
 </button>
 ))}
 </Sheet>
 )}

 {menuOpen && (
 <Sheet onClose={() => setMenuOpen(false)}>
 <h2 style={{ textAlign: 'center', marginBottom: 14 }}>{friend.name}</h2>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => { setMenuOpen(false); setNick(friend.name); setRenaming(true) }}>{t('✏️ Переименовать')}</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => { setMenuOpen(false); setEmojiOpen(true) }}>{t('😊 Значок-эмодзи')}</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => void toggleMute()}>{friend.muted ? t('🔔 Включить лучики') : t('🔕 Приглушить лучики')}</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => { setMenuOpen(false); setReportOpen(true) }}>{t('🚩 Пожаловаться')}</button>
 <button className="btn" style={{ width: '100%', marginBottom: 10, background: 'var(--ink-soft)', boxShadow: 'none' }} onClick={() => void doUnfriend(false)}>{t('Удалить из друзей')}</button>
 <button className="btn" style={{ width: '100%', background: 'var(--red)', boxShadow: 'none' }} onClick={() => void doUnfriend(true)}>{t('🚫 Заблокировать')}</button>
 </Sheet>
 )}

 {renaming && (
 <Sheet onClose={() => setRenaming(false)}>
 <h2 style={{ textAlign: 'center', marginBottom: 14 }}>{t('Как называть друга?')}</h2>
 <input
 autoFocus value={nick} onChange={e => setNick(e.target.value)}
 placeholder={friend.realName}
 style={{ width: '100%', border: '2px solid var(--gold)', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontFamily: 'inherit', marginBottom: 12 }}
 />
 <button className="btn" style={{ width: '100%' }} onClick={() => void saveNick()}>{t('Сохранить')}</button>
 </Sheet>
 )}

 {emojiOpen && (
 <Sheet onClose={() => setEmojiOpen(false)}>
 <h2 style={{ textAlign: 'center', marginBottom: 14 }}>{t('Значок для друга')}</h2>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
 {EMOJI_CHOICES.map(em => (
 <button key={em} style={{ fontSize: 30, background: 'var(--card-shade)', border: 'none', borderRadius: 14, padding: 8, cursor: 'pointer' }} onClick={() => void setEmoji(em)}>{em}</button>
 ))}
 </div>
 <button className="btn ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => void setEmoji(null)}>{t('Без значка')}</button>
 </Sheet>
 )}

 {complimentOpen && (
 <ComplimentSheet friendId={friend.id} friendName={friend.name} onClose={() => setComplimentOpen(false)} reload={reload} />
 )}

 {reportOpen && (
 <Sheet onClose={() => setReportOpen(false)}>
 <h2 style={{ textAlign: 'center', marginBottom: 4 }}>{t('Пожаловаться')}</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px' }}>{t('Мы посмотрим. Ещё можно приглушить или заблокировать.')}</p>
 {REPORT_REASONS.map(r => (
 <button key={r.id} className="btn ghost" style={{ width: '100%', marginBottom: 8 }} onClick={async () => {
 try { await social.report({ targetId: friend.id, kind: 'user', reason: r.id }); haptic('success'); useStore.getState().showToast(t('Спасибо, мы посмотрим 🙏')) }
 catch { haptic('warn') }
 setReportOpen(false)
 }}>{t(r.ru)}</button>
 ))}
 </Sheet>
 )}
 </div>
 )
}

// «Лучик от друга» - preset compliment, optionally anonymous-within-friends.
function ComplimentSheet({ friendId, friendName, onClose, reload }:
 { friendId: number; friendName: string; onClose: () => void; reload: () => void }) {
 const [list, setList] = useState<Compliment[]>([])
 const [anonAllowed, setAnonAllowed] = useState(false)
 const [anon, setAnon] = useState(false)
 useEffect(() => { social.compliments().then(r => { setList(r.compliments); setAnonAllowed(r.anonAllowed) }).catch(() => { /* ignore */ }) }, [])

 async function send(id: string) {
 try {
 const r = await social.compliment({ friendId, messageId: id, anon })
 haptic('success'); useStore.getState().showToast(`${t('Лучик-комплимент полетел к')} ${friendName} ✨`)
 if (r.reward && (r.reward.energy || r.reward.stones)) void useStore.getState().refresh()
 reload(); onClose()
 } catch { haptic('warn'); useStore.getState().showToast(t('Не вышло отправить')) }
 }

 return (
 <Sheet onClose={onClose}>
 <h2 style={{ textAlign: 'center', marginBottom: 4 }}>{t('Лучик-комплимент')}</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 12px' }}>{t('Тёплые слова, которые щенок доставит лично 💛')}</p>
 {anonAllowed && (
 <button className={`btn ${anon ? '' : 'ghost'}`} style={{ width: '100%', marginBottom: 12 }} onClick={() => { haptic('tap'); setAnon(a => !a) }}>
 {anon ? t('🙈 Тайный лучик (друг не узнает, кто)') : t('👤 Отправить от своего имени')}
 </button>
 )}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {list.map(m => (
 <button key={m.id} className="goal-row" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => void send(m.id)}>
 <span style={{ fontSize: 22 }}>{m.emoji}</span>
 <span style={{ flex: 1, fontWeight: 700 }}>{t(m.ru)}</span>
 <span style={{ color: 'var(--accent-deep)', fontWeight: 800 }}>›</span>
 </button>
 ))}
 </div>
 </Sheet>
 )
}
