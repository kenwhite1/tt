// Sell owned items back for 50% of their price. Worn dyes can't be sold.
import { useCallback, useEffect, useState } from 'react'
import { req } from '../../api'
import { haptic } from '../../telegram'
import { useStore } from '../../store'
import { errRu } from './types'
import type { BagDto, OwnedItemDto } from './types'

const SECTIONS: { key: keyof BagDto['owned']; ru: string; emoji: string }[] = [
  { key: 'clothing', ru: 'Одежда', emoji: '👕' },
  { key: 'furniture', ru: 'Мебель', emoji: '🛋️' },
  { key: 'floors', ru: 'Полы', emoji: '🟫' },
  { key: 'wallpapers', ru: 'Обои', emoji: '🧱' },
  { key: 'dyes', ru: 'Краски', emoji: '🎨' },
]

export function SellScreen({ onBack }: { onBack(): void }) {
  const [bag, setBag] = useState<BagDto | null>(null)
  const [confirm, setConfirm] = useState<OwnedItemDto | null>(null)
  const [busy, setBusy] = useState(false)
  const showToast = useStore(s => s.showToast)

  const load = useCallback(() => { void req<BagDto>('/shop/bag').then(setBag) }, [])
  useEffect(load, [load])

  async function sell(it: OwnedItemDto) {
    if (busy) return
    setBusy(true)
    try {
      const r = await req<{ refund: number }>('/shop/sell', { kind: it.kind, itemId: it.itemId, colorId: it.colorId })
      haptic('success')
      showToast(`Продано за ${r.refund} 🦴`)
      setConfirm(null)
      void useStore.getState().refresh()
      load()
    } catch (e) { haptic('warn'); showToast(errRu(e)) }
    setBusy(false)
  }

  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
        <h1 style={{ flex: 1 }}>Продать</h1>
        <div className="card" style={{ margin: 0, padding: '8px 12px', fontWeight: 800 }}>🦴 {bag?.stones ?? '…'}</div>
      </header>
      <p style={{ margin: '0 4px 12px', fontSize: 13, color: 'var(--ink-soft)' }}>
        За вещь вернётся половина её цены. Краску, которую щенок носит прямо сейчас, продать нельзя.
      </p>

      {!bag && <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Открываем сумку…</p>}

      {bag && SECTIONS.map(sec => {
        const items = bag.owned[sec.key]
        if (!items.length) return null
        return (
          <div key={sec.key} className="card">
            <h2 style={{ marginBottom: 10 }}>{sec.emoji} {sec.ru}</h2>
            {items.map(it => (
              <button key={`${it.itemId}:${it.colorId}`} className="goal-row" style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }} onClick={() => setConfirm(it)}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: it.hex, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 800 }}>{it.ru} <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{it.colorRu}</span></span>
                <b style={{ color: 'var(--green-deep)' }}>+{Math.floor(it.price / 2)} 🦴</b>
              </button>
            ))}
          </div>
        )
      })}

      {bag && SECTIONS.every(s => bag.owned[s.key].length === 0) && (
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginTop: 20 }}>Сумка пока пустая 🎒</p>
      )}

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,40,20,0.45)', zIndex: 46, display: 'flex', alignItems: 'flex-end' }} onClick={() => setConfirm(null)}>
          <div className="card" style={{ width: '100%', borderRadius: '26px 26px 0 0', margin: 0, paddingBottom: 'calc(20px + var(--safe-bottom))' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ textAlign: 'center' }}>Продать «{confirm.ru}»?</h2>
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '6px 0 14px' }}>
              Вернётся {Math.floor(confirm.price / 2)} 🦴. Вещь уйдёт из сумки.
            </p>
            <button className="btn accent" style={{ width: '100%' }} disabled={busy} onClick={() => void sell(confirm)}>Продать</button>
            <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => setConfirm(null)}>Оставить</button>
          </div>
        </div>
      )}
    </div>
  )
}
