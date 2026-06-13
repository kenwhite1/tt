// Locations logbook — all 27 locations, «???» cards for unvisited. Used from Pet.tsx.
import { useEffect, useState } from 'react'
import { req } from '../../api'
import { LocationScene } from '../../art/LocationScene'

interface LogLoc {
  id: string
  visited: boolean
  ruName?: string
  regionRu?: string
  palette?: { sky: string; ground: string; accent: string }
  pct?: number
  discoveriesFound?: number
  current?: boolean
}
interface LogbookRes { total: number; visitedCount: number; locations: LogLoc[] }

export function Logbook({ onBack }: { onBack(): void }) {
  const [data, setData] = useState<LogbookRes | null>(null)
  useEffect(() => { req<LogbookRes>('/travel/logbook').then(setData).catch(() => {}) }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 8px)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 8px' }}>
        <button className="btn ghost" style={{ padding: '8px 12px' }} onClick={onBack}>‹</button>
        <h1 style={{ flex: 1 }}>Локации</h1>
        {data && <div className="card" style={{ margin: 0, padding: '8px 14px', fontWeight: 800 }}>{data.visitedCount} / {data.total}</div>}
      </header>

      <div className="scroll">
        {!data ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Листаем дневник путешествий…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {data.locations.map(l =>
              l.visited ? (
                <div key={l.id} className="card" style={{ margin: 0, padding: 10 }}>
                  <LocationScene sky={l.palette?.sky} ground={l.palette?.ground} accent={l.palette?.accent}>
                    <div style={{ padding: '12px 0', fontSize: 26 }}>{l.pct === 100 ? '🏆' : '🐾'}</div>
                  </LocationScene>
                  <div style={{ fontWeight: 800, marginTop: 8 }}>
                    {l.ruName} {l.current ? '📍' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{l.regionRu}</div>
                  <div className="energy-track" style={{ height: 10, margin: '8px 0 4px' }}>
                    <div className="energy-fill" style={{ width: `${l.pct ?? 0}%` }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {l.pct}% · открытий: {l.discoveriesFound}
                  </div>
                </div>
              ) : (
                <div key={l.id} className="card" style={{ margin: 0, padding: 10, textAlign: 'center', background: 'var(--card-shade)' }}>
                  <div style={{ fontSize: 34, padding: '18px 0', opacity: 0.5 }}>❔</div>
                  <div style={{ fontWeight: 800, color: 'var(--ink-soft)' }}>???</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Ещё не открыто</div>
                </div>
              ),
            )}
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)', margin: '14px 0 16px' }}>
          Новые места ждут в турбюро «Хвост-трэвел» ✈️
        </p>
      </div>
    </div>
  )
}
