// «＋ Добавить друга», invite a new friend (share link), enter a friend code, or
// show my own code to copy.
import { useState } from 'react'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { FriendsPayload } from './api'
import { social } from './api'
import { Sheet } from './ui'

function inviteLink(bot: string, code: string) {
 return `https://t.me/${bot}?startapp=ref_${code}`
}

export function AddFriendSheet({ data, onClose, reload, onCoop }:
 { data: FriendsPayload; onClose: () => void; reload: () => void; onCoop?: () => void }) {
 const [mode, setMode] = useState<'menu' | 'code' | 'mine'>('menu')
 const [code, setCode] = useState('')
 const [busy, setBusy] = useState(false)
 const link = inviteLink(data.botUsername, data.me.code)

 function shareLink() {
 haptic('tap')
 const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Заходи растить питомца вместе со мной! 💛')}`
 window.open(url, '_blank')
 }

 async function submitCode() {
 const c = code.trim()
 if (!c || busy) return
 setBusy(true)
 try {
 const r = await social.add(c)
 haptic('success')
 useStore.getState().showToast(r.accepted ? 'Вы теперь друзья! 💛' : 'Заявка отправлена ✨')
 setCode(''); onClose(); reload()
 } catch (e) {
 haptic('warn')
 const msg = (e as { message?: string }).message
 const ru: Record<string, string> = {
 not_found: 'Код не найден', self: 'Это твой код 🙂', already_friends: 'Вы уже друзья',
 requests_closed: 'Друг закрыл заявки', already_sent: 'Заявка уже отправлена',
 }
 useStore.getState().showToast(ru[msg ?? ''] ?? 'Не вышло')
 setBusy(false)
 }
 }

 function copyMine() {
 haptic('tap')
 navigator.clipboard?.writeText(data.me.code).then(
 () => useStore.getState().showToast('Код скопирован 📋'),
 () => useStore.getState().showToast(data.me.code),
 )
 }

 return (
 <Sheet onClose={onClose}>
 {mode === 'menu' && (
 <>
 <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Добавить друга</h2>
 <button className="btn accent" style={{ width: '100%', marginBottom: 10 }} onClick={shareLink}>📨 Пригласить нового</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => setMode('code')}>🔢 Ввести код друга</button>
 <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={() => setMode('mine')}>🪪 Показать мой код</button>
 {onCoop && (
 <button className="btn ghost" style={{ width: '100%', borderStyle: 'dashed' }} onClick={() => { haptic('tap'); onCoop() }}>🥚 …или заведите общего щенка вместе</button>
 )}
 </>
 )}

 {mode === 'code' && (
 <>
 <h2 style={{ textAlign: 'center', marginBottom: 14 }}>Код друга</h2>
 <input
 autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase())}
 placeholder="Например: A1B2C3" autoCapitalize="characters"
 style={{ width: '100%', textAlign: 'center', letterSpacing: 2, border: '2px solid var(--gold)', borderRadius: 12, padding: '12px 14px', fontSize: 18, fontWeight: 800, fontFamily: 'inherit', marginBottom: 12 }}
 />
 <button className="btn" style={{ width: '100%', marginBottom: 10 }} disabled={busy || !code.trim()} onClick={() => void submitCode()}>Подружиться</button>
 <button className="btn ghost" style={{ width: '100%' }} onClick={() => setMode('menu')}>‹ Назад</button>
 </>
 )}

 {mode === 'mine' && (
 <>
 <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Твой код</h2>
 <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px' }}>Дай его другу, и вы соседи по Дворику</p>
 <div className="card" style={{ textAlign: 'center', background: 'var(--card-shade)' }}>
 <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-deep)' }}>{data.me.code}</div>
 </div>
 <button className="btn" style={{ width: '100%', marginBottom: 10 }} onClick={copyMine}>📋 Скопировать код</button>
 <button className="btn ghost" style={{ width: '100%' }} onClick={() => setMode('menu')}>‹ Назад</button>
 </>
 )}
 </Sheet>
 )
}
