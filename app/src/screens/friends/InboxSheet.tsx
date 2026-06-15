// Heart inbox: incoming vibes grouped by sender + friend requests + buddy invites.
// Answer a vibe (pick one back, optionally invite «в гости на час»), clear one / clear all.
import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import type { FriendsPayload, InboxGroup, InboxPayload, Vibe } from './api'
import { social } from './api'
import { Sheet, timeAgo } from './ui'
import { VibePicker } from './VibePicker'

export function InboxSheet({ data, onClose, reload }:
  { data: FriendsPayload; onClose: () => void; reload: () => void }) {
  const [inbox, setInbox] = useState<InboxPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [answering, setAnswering] = useState<{ vibeId: number; name: string } | null>(null)
  const [invite, setInvite] = useState(false)

  function load() {
    setLoading(true)
    social.inbox().then(setInbox).catch(() => setInbox({ groups: [], vibeTypes: data.vibeTypes, plus: data.plus })).finally(() => setLoading(false))
  }
  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function answerWith(v: Vibe) {
    if (!answering) return
    const target = answering
    setAnswering(null)
    try {
      const r = await social.answer(target.vibeId, v.id, invite)
      haptic('success')
      const bits: string[] = []
      if (r.reward?.energy) bits.push(`+${r.reward.energy}⚡`)
      if (r.reward?.stones) bits.push(`+${r.reward.stones}🦴`)
      useStore.getState().showToast(
        r.visit
          ? `Позвал(а) ${target.name} в гости на час 🏡  ${bits.join('  ')}`.trim()
          : `Лучик ${v.emoji} в ответ!  ${bits.join('  ')}`.trim(),
      )
      if (r.reward?.energy || r.reward?.stones) void useStore.getState().refresh()
      setInvite(false); load(); reload()
    } catch { haptic('warn'); useStore.getState().showToast('Не вышло ответить') }
  }

  async function clearGroup(g: InboxGroup) {
    try { await social.clear(g.vibes.map(v => v.id)); haptic('tap'); load(); reload() } catch { haptic('warn') }
  }
  async function clearAll() {
    try { await social.clear(); haptic('tap'); load(); reload() } catch { haptic('warn') }
  }

  async function accept(fromId: number) {
    try { await social.accept(fromId); haptic('success'); useStore.getState().showToast('Теперь вы друзья! 💛'); reload() } catch { haptic('warn') }
  }
  async function decline(fromId: number) {
    try { await social.decline(fromId); haptic('tap'); reload() } catch { haptic('warn') }
  }
  async function buddyAccept(mailId: number) {
    try { await social.buddyAccept(mailId); haptic('success'); useStore.getState().showToast('Принял(а) вызов! 🤝'); void useStore.getState().refresh(); reload() } catch { haptic('warn'); useStore.getState().showToast('Приглашение уже неактуально') }
  }
  async function buddyDecline(mailId: number) {
    try { await social.buddyDecline(mailId); haptic('tap'); reload() } catch { haptic('warn') }
  }

  const groups = inbox?.groups ?? []
  const hasGroups = groups.length > 0

  return (
    <Sheet onClose={onClose}>
      <h2 style={{ textAlign: 'center', marginBottom: 14 }}>❤️ Тёплые лучики</h2>

      {/* friend requests */}
      {data.requests.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink-soft)', margin: '0 4px 6px' }}>ЗАЯВКИ В ДРУЗЬЯ</div>
          {data.requests.map(r => (
            <div key={r.fromId} className="goal-row">
              <span style={{ fontSize: 24 }}>💛</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>питомец {r.petName} · хочет дружить</div>
              </div>
              <button className="btn" style={{ padding: '8px 12px' }} onClick={() => void accept(r.fromId)}>✓</button>
              <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => void decline(r.fromId)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* buddy invites */}
      {data.buddyInvites.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink-soft)', margin: '0 4px 6px' }}>ПРИГЛАШЕНИЯ К ОБЩЕЙ ЦЕЛИ</div>
          {data.buddyInvites.map(b => (
            <div key={b.mailId} className="goal-row">
              <span style={{ fontSize: 24 }}>{b.emoji || '🤝'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{b.fromName} зовёт к общей цели</div>
              </div>
              <button className="btn" style={{ padding: '8px 12px' }} onClick={() => void buddyAccept(b.mailId)}>✓</button>
              <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => void buddyDecline(b.mailId)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 20 }}>Загружаю…</div>
      ) : !hasGroups && data.requests.length === 0 && data.buddyInvites.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '20px 0' }}>
          <div style={{ fontSize: 40 }}>💛</div>
          Пока никто не присылал лучиков. Пошли первым!
        </div>
      ) : hasGroups ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 6px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink-soft)' }}>ЛУЧИКИ</div>
            <button className="btn ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => void clearAll()}>Очистить всё</button>
          </div>
          {groups.map(g => (
            <div key={g.fromId} className="card" style={{ padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{g.name}</div>
                <button className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => void clearGroup(g)}>Прочитано</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{g.flavor}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {g.vibes.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--card-shade)', borderRadius: 999, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}>
                    <span style={{ fontSize: 16 }}>{v.emoji}</span>{v.ru}
                    <span style={{ color: 'var(--ink-soft)', fontWeight: 600, marginLeft: 2 }}>· {timeAgo(v.ts)}</span>
                  </div>
                ))}
              </div>
              <button className="btn accent" style={{ width: '100%', marginTop: 10 }} onClick={() => { setInvite(false); setAnswering({ vibeId: g.vibes[0].id, name: g.name }) }}>
                Ответить лучиком 🌟
              </button>
            </div>
          ))}
        </>
      ) : null}

      {answering && (
        <Sheet onClose={() => setAnswering(null)} z={60}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12, fontWeight: 700 }}>
            <input type="checkbox" checked={invite} onChange={e => setInvite(e.target.checked)} style={{ width: 18, height: 18 }} />
            Позвать в гости на час 🏡
          </label>
          <VibePicker
            vibes={inbox?.vibeTypes ?? data.vibeTypes}
            plus={inbox?.plus ?? data.plus}
            onPick={v => void answerWith(v)}
            title={`Ответить ${answering.name}`}
          />
        </Sheet>
      )}
    </Sheet>
  )
}
