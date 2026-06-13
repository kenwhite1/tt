// Дворик — the courtyard. Green tree scene with your puppy in a nest at the center,
// friends' puppies around it, «???» signposts when you have few friends, page dots when
// many, hug-request + heart inbox on top, add-friend pill, referral banner, settings gear.
import { useEffect, useState } from 'react'
import { C } from '@shared/constants'
import { useStore } from '../store'
import { haptic } from '../telegram'
import type { Friend, FriendsPayload } from './friends/api'
import { social } from './friends/api'
import { PuppyMini } from './friends/ui'
import { AddFriendSheet } from './friends/AddFriendSheet'
import { FriendPage } from './friends/FriendPage'
import { InboxSheet } from './friends/InboxSheet'
import { ReferralSheet } from './friends/ReferralSheet'
import { SettingsSheet } from './friends/SettingsSheet'

// fixed slots around the central nest (percentages within the scene box)
const SLOTS = [
  { x: 14, y: 16 }, { x: 78, y: 14 }, { x: 6, y: 52 }, { x: 84, y: 50 },
  { x: 20, y: 80 }, { x: 70, y: 82 }, { x: 46, y: 6 }, { x: 46, y: 90 },
]

export function Friends() {
  const [data, setData] = useState<FriendsPayload | null>(null)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<null | 'add' | 'inbox' | 'referral' | 'settings'>(null)
  const [active, setActive] = useState<Friend | null>(null)
  const [hugBusy, setHugBusy] = useState(false)

  function reload() {
    social.friends().then(d => { setData(d); setError(false) }).catch(() => setError(true))
  }
  useEffect(reload, [])

  // keep the open friend page in sync with reloaded data
  useEffect(() => {
    if (active && data) {
      const fresh = data.friends.find(f => f.id === active.id)
      if (fresh) setActive(fresh)
      else setActive(null)
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="scroll" style={{ paddingTop: 8, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 14 }}>Дворик</h1>
        <div className="card" style={{ color: 'var(--ink-soft)' }}>
          Не удалось загрузить Дворик 🐾
          <button className="btn ghost" style={{ marginTop: 12 }} onClick={reload}>Обновить</button>
        </div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="scroll" style={{ paddingTop: 8, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 14 }}>Дворик</h1>
        <div className="card" style={{ color: 'var(--ink-soft)', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Загружаю…</div>
      </div>
    )
  }

  if (active) {
    return <FriendPage data={data} friend={active} onBack={() => setActive(null)} reload={reload} />
  }

  const d = data // non-null past the guards above
  const perPage = C.FRIENDS_PER_PAGE
  const pages = Math.max(1, Math.ceil(d.friends.length / perPage))
  const pageFriends = d.friends.slice(page * perPage, page * perPage + perPage)
  const showSignposts = d.friends.length < 3

  async function doHug() {
    if (hugBusy || !d.hugAvailable) return
    setHugBusy(true)
    try {
      const r = await social.hug()
      haptic('success')
      useStore.getState().showToast(r.notified > 0 ? `Обнимашка разлетелась ${r.notified} друзьям 🤗` : 'Обнимашка отправлена 🤗 (друзей пока нет)')
      reload()
    } catch { haptic('warn'); useStore.getState().showToast('Сегодня уже обнимались 🤗'); setHugBusy(false) }
  }

  function answerNudge() {
    if (!d.nudge) return
    setActive(d.friends.find(f => f.id === d.nudge!.fromId) ?? null)
  }

  const visitLeftMin = data.visit ? Math.max(0, Math.round((data.visit.until - Date.now()) / 60_000)) : 0

  return (
    <div className="scroll" style={{ paddingTop: 4 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
        <button className="btn ghost" style={{ padding: '8px 12px', position: 'relative' }} onClick={() => void doHug()} disabled={hugBusy} title="Попросить обнимашку">
          🤗 {!data.hugAvailable && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>·1/день</span>}
        </button>
        <h1>Дворик</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn ghost" style={{ padding: '8px 12px', position: 'relative' }} onClick={() => setOpen('inbox')}>
            ❤️
            {data.unreadVibesTotal > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {data.unreadVibesTotal}
              </span>
            )}
          </button>
          <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => setOpen('settings')}>⚙️</button>
        </div>
      </header>

      {/* tree scene */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, background: 'linear-gradient(180deg, #cde6c2 0%, #a9d693 55%, #8fc878 100%)', minHeight: 360 }}>
        {/* big tree */}
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 96, opacity: 0.9, pointerEvents: 'none' }}>🌳</div>

        {/* signposts when few friends */}
        {showSignposts && SLOTS.slice(0, 3).map((s, i) => (
          <div key={`sp-${i}`} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%,-50%)', textAlign: 'center', opacity: 0.85, pointerEvents: 'none' }}>
            <div style={{ background: 'var(--brown)', color: 'var(--gold)', fontWeight: 800, padding: '6px 12px', borderRadius: 8, boxShadow: 'var(--shadow-lip)' }}>???</div>
            <div style={{ width: 6, height: 26, background: 'var(--brown-deep)', margin: '0 auto', borderRadius: 3 }} />
          </div>
        ))}

        {/* friends around */}
        {pageFriends.map((f, i) => {
          const s = SLOTS[i % SLOTS.length]
          return (
            <button
              key={f.id}
              onClick={() => { haptic('tap'); setActive(f) }}
              style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%,-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{ position: 'relative' }}>
                <PuppyMini stage={f.stage} color={f.color} dyes={f.dyes} size={62} />
                {f.unreadVibes > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--red)', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.unreadVibes}</span>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#3d5c2e', background: 'rgba(255,255,255,0.7)', borderRadius: 999, padding: '1px 8px', marginTop: 2, maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.emoji ? `${f.emoji} ` : ''}{f.name}
              </span>
            </button>
          )
        })}

        {/* own puppy in the nest, center */}
        <div style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: -14 }}>🪺</div>
          <PuppyMini stage={data.me.stage} color={data.me.color} size={96} state="idle" />
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3d5c2e', background: 'rgba(255,255,255,0.8)', borderRadius: 999, padding: '1px 10px', display: 'inline-block' }}>
            {data.me.petName || 'Дружок'} (ты)
          </div>
        </div>
      </div>

      {/* page dots */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 12 }}>
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ width: 9, height: 9, borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === page ? 'var(--brown-deep)' : 'var(--card-shade)' }} />
          ))}
        </div>
      )}

      {/* active visit note */}
      {data.visit && visitLeftMin > 0 && (
        <div className="card" style={{ background: '#fbf0d6', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>🏡</span>
          <div style={{ fontSize: 14 }}><b>{data.visit.name}</b> в гостях ещё {visitLeftMin} мин — загляни в комнату!</div>
        </div>
      )}

      {/* 3-day unanswered nudge */}
      {data.nudge && (
        <div className="card" style={{ background: '#fff3e0', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>💌</span>
          <div style={{ flex: 1, fontSize: 14 }}><b>{data.nudge.name}</b> ждёт ответа на лучик уже {C.VIBE_NUDGE_DAYS} дня</div>
          <button className="btn accent" style={{ padding: '8px 14px' }} onClick={() => void answerNudge()}>Ответить</button>
        </div>
      )}

      <button className="btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => setOpen('add')}>＋ Добавить друга</button>

      {/* referral banner */}
      <button
        onClick={() => setOpen('referral')}
        className="card"
        style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: '#3d5c2e', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <span style={{ fontSize: 34 }}>🐮</span>
        <div style={{ flex: 1 }}>
          <b style={{ color: 'var(--gold)' }}>Познакомься с Коровой Печенькой</b>
          <div style={{ fontSize: 13, opacity: 0.92 }}>Позови друзей и получи микропитомца! · {data.referral.count}/{data.referral.max}</div>
        </div>
        <span style={{ fontSize: 22, color: 'var(--gold)' }}>›</span>
      </button>

      {open === 'add' && <AddFriendSheet data={data} onClose={() => setOpen(null)} reload={reload} />}
      {open === 'inbox' && <InboxSheet data={data} onClose={() => setOpen(null)} reload={reload} />}
      {open === 'referral' && <ReferralSheet onClose={() => setOpen(null)} />}
      {open === 'settings' && <SettingsSheet data={data} onClose={() => setOpen(null)} />}
    </div>
  )
}
