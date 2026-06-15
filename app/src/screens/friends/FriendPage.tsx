// Friend page (sub-view): their puppy in their room, ❤ friendship level, Send Good Vibes,
// shared-goal streak strips, last-4-events feed, buddy/share goal, ⋯ menu.
import { useState } from 'react'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { Friend, FriendsPayload, Vibe } from './api'
import { social } from './api'
import { PuppyMini, Sheet, levelName, levelProgress } from './ui'
import { VibePicker } from './VibePicker'

const EMOJI_CHOICES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦄', '🌸', '⭐', '💛', '🌳', '🍀']

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

 const lvl = levelProgress(friend.pts, friend.level)

 async function sendVibe(v: Vibe) {
 setVibeOpen(false)
 try {
 const r = await social.sendVibe(friend.id, v.id)
 haptic('success')
 const bits: string[] = []
 if (r.reward.energy) bits.push(`+${r.reward.energy}⚡`)
 if (r.reward.stones) bits.push(`+${r.reward.stones}🦴`)
 if (r.reward.walkMinutesReduced) bits.push(`прогулка −${r.reward.walkMinutesReduced} мин`)
 useStore.getState().showToast(`Лучик ${v.emoji} полетел к ${friend.name}! ${bits.join(' ')}`.trim())
 if (r.reward.energy || r.reward.stones || r.reward.walkMinutesReduced) void useStore.getState().refresh()
 reload()
 } catch (e) {
 haptic('warn')
 useStore.getState().showToast((e as { message?: string }).message === 'plus_required' ? 'Этот лучик для Plus 🔒' : 'Не вышло отправить')
 }
 }

 async function doKudos(goalId: number) {
 try { await social.kudos(goalId, friend.id); haptic('success'); useStore.getState().showToast('Похвалил(а) друга! 👏') }
 catch { haptic('warn'); useStore.getState().showToast('Не вышло') }
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
 try { await social.edit(friend.id, { muted: !friend.muted }); haptic('tap'); useStore.getState().showToast(friend.muted ? 'Снова слышишь друга' : 'Лучики приглушены'); reload() }
 catch { haptic('warn') }
 }

 async function doUnfriend(block: boolean) {
 if (busy) return
 setBusy(true)
 try {
 await social.unfriend(friend.id, block)
 haptic('success')
 useStore.getState().showToast(block ? 'Заблокирован(а)' : 'Больше не друзья')
 onBack(); reload()
 } catch { haptic('warn'); setBusy(false) }
 }

 async function doShare(goalId: number) {
 setShareOpen(null)
 try {
 if (shareOpen === 'buddy') { await social.buddyGoal(goalId, friend.id); useStore.getState().showToast('Приглашение к общей цели отправлено! 🤝') }
 else { await social.shareGoal(goalId, [friend.id]); useStore.getState().showToast('Цель теперь общая ⭐') }
 haptic('success'); reload()
 } catch { haptic('warn'); useStore.getState().showToast('Не вышло') }
 }

 return (
 <div className="scroll" style={{ paddingTop: 4 }}>
 <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={onBack}>‹ Дворик</button>
 <button className="btn ghost" style={{ padding: '8px 14px' }} onClick={() => setMenuOpen(true)}>⋯</button>
 </header>

 {/* friend's room */}
 <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(#f6e7c8 0%, #efe0bd 100%)', position: 'relative' }}>
 <PuppyMini stage={friend.stage} color={friend.color} dyes={friend.dyes} size={150} state="happy" />
 <h1 style={{ marginTop: 4 }}>{friend.emoji ? `${friend.emoji} ` : ''}{friend.name}</h1>
 <div style={{ color: 'var(--ink-soft)', fontWeight: 800, fontSize: 14 }}>питомец {friend.petName}</div>

 {/* friendship level */}
 <div style={{ marginTop: 14, padding: '0 8px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
 <span>❤️ {levelName(friend.level)}</span>
 <span style={{ color: 'var(--ink-soft)' }}>ур. {friend.level}</span>
 </div>
 <div className="energy-track" style={{ height: 14 }}>
 <div className="energy-fill love" style={{ width: `${Math.round(lvl.ratio * 100)}%` }} />
 </div>
 {lvl.next != null && (
 <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{Math.floor(friend.pts)} / {lvl.next} очков дружбы</div>
 )}
 </div>
 </div>

 <button className="btn accent" style={{ width: '100%', marginBottom: 12 }} onClick={() => setVibeOpen(true)}>
 🌟 Послать тёплый лучик
 </button>

 <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
 <button className="btn ghost" style={{ flex: 1 }} onClick={() => setShareOpen('share')}>⭐ Поделиться целью</button>
 <button className="btn ghost" style={{ flex: 1 }} onClick={() => setShareOpen('buddy')}>🤝 Общая цель</button>
 </div>

 {/* shared goal streak strips */}
 {friend.sharedGoals.length > 0 && (
 <>
 <h2 style={{ margin: '6px 4px 10px' }}>Общие цели</h2>
 {friend.sharedGoals.map(g => (
 <div key={`${g.kind}-${g.goalId}`} className="goal-row">
 <span style={{ fontSize: 26 }}>{g.emoji || '⭐'}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800 }}>{g.title}</div>
 <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
 🔥 {g.streak} {g.kind === 'buddy' ? '· напарники' : '· у друга'} {g.doneToday ? '· сегодня ✓' : ''}
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
 <h2 style={{ margin: '6px 4px 10px' }}>Что нового</h2>
 {friend.feed.length === 0 ? (
 <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Пока тихо, но скоро будут новости ✨</div>
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
 <VibePicker vibes={data.vibeTypes} plus={data.plus} onPick={v => void sendVibe(v)} title={`Тёплый лучик для ${friend.name}`} />
 </Sheet>
 )}

 {shareOpen && (
 <Sheet onClose={() => setShareOpen(null)}>
 <h2 style={{ textAlign: 'center', marginBottom: 4 }}>
 {shareOpen === 'buddy' ? 'Общая цель' : 'Поделиться целью'}
 </h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px' }}>
 {shareOpen === 'buddy' ? 'Идём к цели плечом к плечу, по разу в день' : `${friend.name} будет видеть твой стрик`}
 </p>
 {goals.length === 0 ? (
 <div style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Сначала заведи цель на Главной 🌱</div>
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
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => { setMenuOpen(false); setNick(friend.name); setRenaming(true) }}>✏️ Переименовать</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => { setMenuOpen(false); setEmojiOpen(true) }}>😊 Значок-эмодзи</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => void toggleMute()}>{friend.muted ? '🔔 Включить лучики' : '🔕 Приглушить лучики'}</button>
 <button className="btn" style={{ width: '100%', marginBottom: 10, background: 'var(--ink-soft)', boxShadow: 'none' }} onClick={() => void doUnfriend(false)}>Удалить из друзей</button>
 <button className="btn" style={{ width: '100%', background: 'var(--red)', boxShadow: 'none' }} onClick={() => void doUnfriend(true)}>🚫 Заблокировать</button>
 </Sheet>
 )}

 {renaming && (
 <Sheet onClose={() => setRenaming(false)}>
 <h2 style={{ textAlign: 'center', marginBottom: 14 }}>Как называть друга?</h2>
 <input
 autoFocus value={nick} onChange={e => setNick(e.target.value)}
 placeholder={friend.realName}
 style={{ width: '100%', border: '2px solid var(--gold)', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontFamily: 'inherit', marginBottom: 12 }}
 />
 <button className="btn" style={{ width: '100%' }} onClick={() => void saveNick()}>Сохранить</button>
 </Sheet>
 )}

 {emojiOpen && (
 <Sheet onClose={() => setEmojiOpen(false)}>
 <h2 style={{ textAlign: 'center', marginBottom: 14 }}>Значок для друга</h2>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
 {EMOJI_CHOICES.map(em => (
 <button key={em} style={{ fontSize: 30, background: 'var(--card-shade)', border: 'none', borderRadius: 14, padding: 8, cursor: 'pointer' }} onClick={() => void setEmoji(em)}>{em}</button>
 ))}
 </div>
 <button className="btn ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => void setEmoji(null)}>Без значка</button>
 </Sheet>
 )}
 </div>
 )
}
