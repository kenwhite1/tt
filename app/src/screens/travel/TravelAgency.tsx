// «Хвост-трэвел» — turbyuro run by кошка Сасси. Daily destination rotation, one-way flights.
import { useCallback, useEffect, useState } from 'react'
import { req } from '../../api'
import { useStore } from '../../store'
import { haptic } from '../../telegram'
import { LocationScene } from '../../art/LocationScene'

interface ItemPreview { ruName: string; price: number }
interface Dest {
  id: string; ruName: string; regionRu: string
  palette: { sky: string; ground: string; accent: string }
  pct: number; discoveriesFound: number; price: number
  clothing: ItemPreview[]; furniture: ItemPreview[]
}
interface AgencyRes {
  unlocked: boolean
  stones: number
  walksNow?: number
  walksNeed?: number
  firstFlightFree?: boolean
  current?: { id: string; ruName: string; regionRu: string; pct: number } | null
  queued?: { id: string; ruName: string } | null
  destinations?: Dest[]
}
interface FlyRes { ok: boolean; departed: boolean; queued: boolean; price: number; destination: { id: string; ruName: string } }

export function TravelAgency({ onBack }: { onBack(): void }) {
  const [data, setData] = useState<AgencyRes | null>(null)
  const [confirm, setConfirm] = useState<Dest | null>(null)
  const [buying, setBuying] = useState(false)

  const load = useCallback(() => {
    req<AgencyRes>('/travel/agency').then(setData).catch(() => {})
  }, [])
  useEffect(load, [load])

  async function fly(dest: Dest) {
    if (buying) return
    setBuying(true)
    try {
      const r = await req<FlyRes>('/travel/fly', { locationId: dest.id })
      haptic('success')
      useStore.getState().showToast(
        r.departed ? `Полетели в ${r.destination.ruName}! ✈️` : `Билет куплен! Летим, как наберётся энергия ✈️`,
      )
      setConfirm(null)
      load()
      void useStore.getState().refresh()
    } catch (e) {
      const err = (e as { data?: { error?: string } }).data?.error
      useStore.getState().showToast(
        err === 'not_enough_stones' ? 'Не хватает косточек 🦴' :
        err === 'flight_already_queued' ? 'Билет уже куплен — сначала долетим!' :
        'Не получилось купить билет',
      )
    } finally {
      setBuying(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 8px)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 8px' }}>
        <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
        <h1 style={{ flex: 1 }}>Хвост-трэвел</h1>
        <div className="card" style={{ margin: 0, padding: '8px 14px', fontWeight: 800 }}>🦴 {data?.stones ?? '…'}</div>
      </header>

      <div className="scroll">
        {!data ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Сасси раскладывает билеты…</p>
        ) : !data.unlocked ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>🐈✈️</div>
            <h2 style={{ margin: '8px 0' }}>Турбюро пока закрыто</h2>
            <p style={{ color: 'var(--ink-soft)', margin: '0 0 10px' }}>
              Сасси откроет двери, когда щенок немного подрастёт и сможет летать.
            </p>
            <div className="energy-track" style={{ margin: '0 12px' }}>
              <div className="energy-fill" style={{ width: `${Math.min(100, ((data.walksNow ?? 0) / (data.walksNeed ?? 1)) * 100)}%` }} />
            </div>
            <p style={{ fontWeight: 800, margin: '6px 0 0' }}>🐾 {data.walksNow} / {data.walksNeed} прогулок</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 38 }}>🐈</span>
              <div>
                <b>Сасси</b>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                  Мяу! Вот сегодняшние направления. Завтра подберу новые — я кошка непредсказуемая.
                </div>
              </div>
            </div>

            {data.queued && (
              <div className="card" style={{ background: '#e3eefb', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 26 }}>🎫</span>
                <div>
                  <b>Билет в {data.queued.ruName} куплен!</b>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                    Полетим, как только щенок наберёт энергию на прогулку.
                  </div>
                </div>
              </div>
            )}

            {data.firstFlightFree && !data.queued && (
              <div className="card" style={{ background: '#fdf3d7', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 26 }}>🎉</span>
                <div><b>Первый полёт — за счёт Сасси!</b></div>
              </div>
            )}

            {data.current && (
              <p style={{ margin: '2px 4px 12px', color: 'var(--ink-soft)', fontWeight: 800 }}>
                📍 Сейчас вы в: {data.current.ruName} · открыто {data.current.pct}%
              </p>
            )}

            {(data.destinations ?? []).map(d => (
              <div key={d.id} className="card" style={{ padding: 12 }}>
                <LocationScene sky={d.palette.sky} ground={d.palette.ground} accent={d.palette.accent}>
                  <div style={{ padding: '18px 0', fontSize: 36 }}>🏙️</div>
                </LocationScene>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '10px 2px 2px' }}>
                  <h2>{d.ruName}</h2>
                  <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{d.regionRu}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 2px 8px' }}>
                  Открыто {d.pct}% · открытий: {d.discoveriesFound}
                </div>
                <div style={{ fontSize: 13, margin: '0 2px 10px' }}>
                  <b>Только здесь:</b>{' '}
                  {[...d.clothing, ...d.furniture].map(i => i.ruName).join(' · ')}
                </div>
                <button className="btn accent" style={{ width: '100%' }} disabled={!!data.queued || buying} onClick={() => setConfirm(d)}>
                  {d.price === 0 ? '✈️ Лететь бесплатно' : `✈️ Билет за ${d.price} 🦴`}
                </button>
              </div>
            ))}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 16px' }}>
              Направления меняются раз в день — обновить за косточки нельзя.
            </p>
          </>
        )}
      </div>

      {confirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 46, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setConfirm(null)}
        >
          <div
            className="card"
            style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ textAlign: 'center', marginBottom: 10 }}>Летим в {confirm.ruName}?</h2>
            <p style={{ color: 'var(--ink-soft)', margin: '0 4px 12px', lineHeight: 1.4 }}>
              ⚠️ Билет в один конец: вернуться можно будет, только когда город снова появится у Сасси.
              Полёт займёт место сегодняшней прогулки (или завтрашней, если щенок уже гулял).
            </p>
            <p style={{ textAlign: 'center', fontWeight: 800, marginBottom: 12 }}>
              {confirm.price === 0 ? 'Бесплатно — первый полёт 🎉' : `Стоимость: ${confirm.price} 🦴`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setConfirm(null)}>Остаться</button>
              <button className="btn accent" style={{ flex: 1 }} disabled={buying} onClick={() => void fly(confirm)}>Летим! ✈️</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
