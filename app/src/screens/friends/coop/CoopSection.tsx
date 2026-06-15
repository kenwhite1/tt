// «Содружок» / «Наш щенок» — the co-op puppy surface inside the Дворик.
// Cards with the split contribution bar, the shared «Гулять вместе» walk, co-op streak,
// adopt flow (friend or link), and a detail sheet (rename/pause/leave/share).
import { useEffect, useRef, useState } from 'react'
import type { CoopDto } from '@shared/types'
import { coop, type CoopListPayload, type Friend } from '../api'
import { Sheet, PuppyMini } from '../ui'
import { Mascot, MASCOTS } from '../../../art/Mascot'
import { haptic, shareLink } from '../../../telegram'
import { useStore } from '../../../store'
import { ShareSheet } from '../../../share'

const STAGE_RU: Record<string, string> = { baby: 'малыш', toddler: 'карапуз', child: 'ребёнок', teen: 'подросток', adult: 'взрослый' }

function remainingText(endsTs: number): string {
  const ms = endsTs - Date.now()
  if (ms <= 0) return 'почти дома'
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`
}

export function CoopSection({ friends, mySpecies, openAdoptSignal = 0 }: { friends: Friend[]; mySpecies: string; openAdoptSignal?: number }) {
  const [data, setData] = useState<CoopListPayload | null>(null)
  const [adopt, setAdopt] = useState(false)
  const [detail, setDetail] = useState<CoopDto | null>(null)
  const [hatchShare, setHatchShare] = useState<CoopDto | null>(null)

  function reload() { coop.list().then(setData).catch(() => { /* offline */ }) }
  useEffect(reload, [])
  // open the adopt flow when triggered from the AddFriendSheet CTA
  useEffect(() => { if (openAdoptSignal > 0) setAdopt(true) }, [openAdoptSignal])
  // keep an open detail in sync after reloads
  useEffect(() => { if (detail && data) { const f = data.bonds.find(b => b.id === detail.id); if (f) setDetail(f) } }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null
  const showCta = data.canCreate && (data.bonds.length > 0 || data.invites.length > 0 || friends.length > 0)
  if (data.bonds.length === 0 && data.invites.length === 0 && friends.length === 0) return null

  return (
    <div style={{ marginBottom: 12 }}>
      {(data.bonds.length > 0 || data.invites.length > 0) && (
        <h3 style={{ color: '#3d5c2e', margin: '4px 2px 8px' }}>Наш щенок 🐾</h3>
      )}

      {/* pending invites to me */}
      {data.invites.map(inv => (
        <div key={inv.inviteId} className="card" style={{ background: '#fff3e0', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 26 }}>🥚</span>
          <div style={{ flex: 1, fontSize: 14 }}><b>{inv.fromName}</b> зовёт растить общего щенка <b>{inv.name}</b></div>
          <button className="btn accent" style={{ padding: '8px 14px' }} onClick={async () => {
            try { const r = await coop.accept(inv.code); haptic('success'); useStore.getState().showToast('Щенок вылупился! 🐣'); reload(); if (r.coop) setHatchShare(r.coop) }
            catch { haptic('warn'); useStore.getState().showToast('Не получилось принять') }
          }}>Принять</button>
        </div>
      ))}

      {/* active bonds */}
      {data.bonds.map(b => <CoopCard key={b.id} bond={b} onOpen={() => setDetail(b)} reload={reload} />)}

      {showCta && (
        <button className="btn ghost" style={{ width: '100%', marginBottom: 12, borderStyle: 'dashed' }} onClick={() => { haptic('tap'); setAdopt(true) }}>
          🥚 …или заведите общего щенка вместе
        </button>
      )}

      {adopt && <AdoptSheet friends={friends} mySpecies={mySpecies} eggColors={data.eggColors} onClose={() => setAdopt(false)} reload={reload} />}
      {detail && <CoopDetail bond={detail} onClose={() => setDetail(null)} reload={reload} />}
      {hatchShare && (
        <ShareSheet
          opts={{ kind: 'coop', ref: `hatch_${hatchShare.id}`, species: hatchShare.species, headline: `У нас вылупился ${hatchShare.name}!`, subtitle: 'Растим вдвоём 🐣', emoji: '🐣' }}
          text={`Мы завели общего щенка ${hatchShare.name} в Шарике 🐣`}
          onClose={() => setHatchShare(null)}
        />
      )}
    </div>
  )
}

function SplitBar({ bond }: { bond: CoopDto }) {
  const per = Math.max(1, bond.barFull / Math.max(1, bond.members.length))
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, height: 14, borderRadius: 8, overflow: 'hidden', background: 'var(--card-shade)' }}>
        {bond.members.map(m => (
          <div key={m.userId} style={{ flex: 1, background: 'var(--card-shade)', position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, (m.contrib / per) * 100)}%`, background: m.isMe ? '#4d7339' : '#7bb15c' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>
        {bond.members.map(m => (
          <span key={m.userId}>{m.isMe ? 'Твой вклад' : `Вклад ${m.name}`} {m.contrib}/{per}{m.showedUp ? ' ✓' : ''}</span>
        ))}
      </div>
    </div>
  )
}

type CardShare = { kind: string; ref: string; species: string; headline: string; subtitle?: string; emoji?: string; text: string }
function CoopCard({ bond, onOpen, reload }: { bond: CoopDto; onOpen: () => void; reload: () => void }) {
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState<CardShare | null>(null)
  const waiting = bond.members.find(m => !m.showedUp && !m.isMe)

  async function startWalk() {
    setBusy(true); haptic('tap')
    try { await coop.walkStart(bond.id); haptic('success'); useStore.getState().showToast('Пошли гулять вместе! 🐾'); reload() }
    catch { haptic('warn'); useStore.getState().showToast('Сейчас нельзя') }
    setBusy(false)
  }
  async function claim() {
    setBusy(true); haptic('tap')
    try {
      const r = await coop.walkClaim(bond.id)
      if (r.claimed) {
        haptic('success')
        useStore.getState().showToast(r.leveledTo ? `Мы подросли — теперь ${STAGE_RU[r.leveledTo]}! 💛` : `Прогулка! +${r.reward?.stones}🦴 каждому 🦴`)
        // §6.3 auto-offer a milestone story card on stage-up or a streak milestone
        const st = r.coop.streak
        if (r.leveledTo) setShare({ kind: 'coop', ref: `stage_${bond.id}_${r.leveledTo}`, species: bond.species, headline: `${bond.name} подрос(ла) до «${STAGE_RU[r.leveledTo]}»!`, subtitle: 'Мы растим его вдвоём', emoji: '🎉', text: `Наш общий щенок ${bond.name} подрос в Шарике! 🎉` })
        else if ([7, 30, 100, 365].includes(st)) setShare({ kind: 'coop', ref: `streak_${bond.id}_${st}`, species: bond.species, headline: `${st} дней вместе!`, subtitle: `${bond.name} растёт с нами`, emoji: '🔥', text: `${st} дней подряд растим общего щенка вдвоём 🔥` })
      }
      reload()
    } catch { haptic('warn') }
    setBusy(false)
  }

  return (
    <>
    <div className="card" style={{ marginBottom: 8, opacity: bond.status === 'dormant' ? 0.7 : 1 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onOpen} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
          <Mascot species={bond.species} size={64} state={bond.walk ? 'walking' : 'idle'} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <b style={{ fontSize: 16 }}>{bond.name}</b>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>· {STAGE_RU[bond.stage]}</span>
            {bond.streak > 0 && <span style={{ fontSize: 12, color: '#c2781c' }}>· {bond.streak} дн вместе 🔥</span>}
          </div>
          <div style={{ marginTop: 6 }}><SplitBar bond={bond} /></div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {bond.walk ? (
          <button className="btn ghost" style={{ width: '100%' }} disabled>На прогулке · {remainingText(bond.walk.endsTs)}</button>
        ) : bond.walkClaimable ? (
          <button className="btn accent" style={{ width: '100%' }} disabled={busy} onClick={() => void claim()}>Забрать прогулку 🦴</button>
        ) : bond.walkReady ? (
          <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={() => void startWalk()}>Гулять вместе 🐾</button>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center' }}>
            {waiting ? `${waiting.name} ждёт, пока вы соберётесь вдвоём 💛` : 'Покормите щенка вдвоём, чтобы пойти гулять'}
          </div>
        )}
      </div>
    </div>
    {share && (
      <ShareSheet
        opts={{ kind: share.kind, ref: share.ref, species: share.species, headline: share.headline, subtitle: share.subtitle, emoji: share.emoji }}
        text={share.text} onClose={() => setShare(null)}
      />
    )}
    </>
  )
}

function AdoptSheet({ friends, mySpecies, eggColors, onClose, reload }: {
  friends: Friend[]; mySpecies: string; eggColors: { id: string; ru: string; hex: string }[]; onClose: () => void; reload: () => void
}) {
  const [friendId, setFriendId] = useState<number | null>(null)
  const [species, setSpecies] = useState(mySpecies || 'dog')
  const [color, setColor] = useState(eggColors[0]?.id ?? 'golden')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  async function create() {
    setBusy(true); haptic('tap')
    try {
      const r = await coop.create({ friendId: friendId ?? undefined, name: name.trim() || undefined, species, color })
      haptic('success')
      if (friendId) { useStore.getState().showToast('Приглашение отправлено! 💛'); reload(); onClose() }
      else { setLink(r.link); reload() }
    } catch (e) {
      haptic('warn')
      useStore.getState().showToast((e as { data?: { error?: string } })?.data?.error === 'cap' ? 'У вас уже 3 общих щенка' : 'Не получилось')
    }
    setBusy(false)
  }

  return (
    <Sheet onClose={onClose} z={60}>
      <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Завести общего щенка</h2>
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, marginBottom: 14 }}>
        Растите его вдвоём: он подрастает, только когда оба зашли. Никаких штрафов — просто общее тепло 💛
      </p>
      {link ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🥚</div>
          <p style={{ fontSize: 14, marginBottom: 12 }}>Отправь ссылку другу — как только он откроет, щенок вылупится у вас обоих.</p>
          <button className="btn" style={{ width: '100%', marginBottom: 8 }} onClick={() => { shareLink(link, 'Заведём общего щенка в Шарике? 🐾'); }}>Отправить ссылку</button>
          <button className="btn ghost" style={{ width: '100%' }} onClick={onClose}>Готово</button>
        </div>
      ) : (
        <>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>Имя щенка</label>
          <input className="onb-input" value={name} onChange={e => setName(e.target.value)} placeholder="Наш малыш" maxLength={30}
            style={{ width: '100%', marginBottom: 12 }} />

          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>Кто это будет</label>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '6px 0 12px' }}>
            {MASCOTS.map(m => (
              <button key={m.id} onClick={() => { haptic('tap'); setSpecies(m.id) }}
                style={{ border: species === m.id ? '2px solid #4d7339' : '2px solid transparent', borderRadius: 14, background: 'var(--card-shade)', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                <Mascot species={m.id} size={52} />
              </button>
            ))}
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>Цвет яйца</label>
          <div style={{ display: 'flex', gap: 8, padding: '6px 0 12px' }}>
            {eggColors.map(ec => (
              <button key={ec.id} title={ec.ru} onClick={() => { haptic('tap'); setColor(ec.id) }}
                style={{ width: 38, height: 38, borderRadius: '50%', background: ec.hex, cursor: 'pointer', border: color === ec.id ? '3px solid #4d7339' : '2px solid #fff', boxShadow: 'var(--shadow-lip)' }} />
            ))}
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>С кем растим</label>
          <div style={{ maxHeight: 180, overflowY: 'auto', margin: '6px 0 14px' }}>
            <button className={`coop-pick${friendId === null ? ' sel' : ''}`} onClick={() => setFriendId(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: 10, borderRadius: 12, border: friendId === null ? '2px solid #4d7339' : '1px solid var(--card-shade)', background: 'var(--card)', marginBottom: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 22 }}>🔗</span><span style={{ fontWeight: 700 }}>Поделиться ссылкой (можно с новым другом)</span>
            </button>
            {friends.map(f => (
              <button key={f.id} onClick={() => setFriendId(f.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: 8, borderRadius: 12, border: friendId === f.id ? '2px solid #4d7339' : '1px solid var(--card-shade)', background: 'var(--card)', marginBottom: 6, cursor: 'pointer' }}>
                <PuppyMini stage={f.stage} color={f.color} dyes={f.dyes} size={40} />
                <span style={{ fontWeight: 700 }}>{f.name}</span>
              </button>
            ))}
          </div>

          <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={() => void create()}>
            {friendId ? 'Пригласить' : 'Создать ссылку'}
          </button>
        </>
      )}
    </Sheet>
  )
}

function CoopDetail({ bond, onClose, reload }: { bond: CoopDto; onClose: () => void; reload: () => void }) {
  const [share, setShare] = useState(false)
  const [renaming, setRenaming] = useState('')
  const orphan = bond.members.length < 2
  const hearts = useRef<HTMLDivElement>(null)
  const lastPat = useRef(0)

  // drag-to-pat the shared puppy: float hearts; bank a (cosmetic) pat, throttled
  function onPat(e: React.PointerEvent) {
    haptic('tap')
    const el = document.createElement('div')
    el.className = 'heart-float'; el.textContent = '💛'
    el.style.left = `${e.nativeEvent.offsetX}px`; el.style.top = `${e.nativeEvent.offsetY}px`
    hearts.current?.appendChild(el); setTimeout(() => el.remove(), 1000)
    const now = Date.now()
    if (now - lastPat.current > 800) { lastPat.current = now; void coop.pet(bond.id).catch(() => {}) }
  }

  return (
    <Sheet onClose={onClose} z={60}>
      <div style={{ textAlign: 'center' }}>
        <div ref={hearts} style={{ position: 'relative', display: 'inline-block', touchAction: 'none' }} onPointerDown={onPat}>
          <Mascot species={bond.species} size={120} state={bond.walk ? 'walking' : 'happy'} />
        </div>
        <h2 style={{ margin: '6px 0 2px' }}>{bond.name}</h2>
        <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          {STAGE_RU[bond.stage]} · {bond.walks} прогулок{bond.streak > 0 ? ` · ${bond.streak} дн вместе 🔥` : ''}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6 }}>Сегодня</div>
        <SplitBar bond={bond} />
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 22 }}>💞</span>
        <div style={{ flex: 1, fontSize: 14 }}>Дружба: уровень {bond.friendshipLevel}</div>
      </div>

      {bond.recentDiscoveries.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 8 }}>Наши находки 🔍</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {bond.recentDiscoveries.map((d, i) => (
              <span key={i} style={{ fontSize: 13, background: 'var(--card-shade)', borderRadius: 999, padding: '4px 10px' }}>{d.emoji} {d.ru}</span>
            ))}
          </div>
        </div>
      )}

      <button className="btn accent" style={{ width: '100%', marginTop: 12 }} onClick={() => { haptic('tap'); setShare(true) }}>
        Поделиться в истории 💛
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="onb-input" value={renaming} onChange={e => setRenaming(e.target.value)} placeholder="Новое имя…" maxLength={30} style={{ flex: 1 }} />
        <button className="btn ghost" disabled={!renaming.trim()} onClick={async () => {
          const r = await coop.rename(bond.id, renaming.trim()); setRenaming('')
          useStore.getState().showToast(r.applied ? 'Переименовали 💛' : 'Предложение отправлено другу')
          reload()
        }}>Переименовать</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={async () => { await coop.pause(bond.id, bond.status !== 'dormant'); reload() }}>
          {bond.status === 'dormant' ? 'Снять паузу' : 'Пауза двора'}
        </button>
        {orphan
          ? <button className="btn" style={{ flex: 1 }} onClick={async () => { const r = await coop.invite(bond.id); shareLink(r.link, 'Поможешь растить щенка в Шарике? 🐾') }}>Позвать друга</button>
          : <button className="btn ghost" style={{ flex: 1, color: 'var(--red)' }} onClick={async () => { await coop.leave(bond.id); useStore.getState().showToast('Ты ушёл из двора. Щенок остаётся другу 💛'); reload(); onClose() }}>Уйти</button>}
      </div>

      {share && (
        <ShareSheet
          opts={{ kind: 'coop', ref: String(bond.id), species: bond.species, headline: `Растим ${bond.name} вдвоём!`, subtitle: `${STAGE_RU[bond.stage]} · ${bond.streak} дн вместе`, emoji: '🐾' }}
          text={`Мы вместе растим щенка ${bond.name} в Шарике 🐾`}
          onClose={() => setShare(false)}
        />
      )}
    </Sheet>
  )
}
