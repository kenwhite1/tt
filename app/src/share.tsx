// «Витрина» — milestone share cards. The card is composed on an offscreen <canvas>
// (mascot art + headline + pet name + CTA), rasterized to PNG, uploaded to /api/share/card,
// then posted to a Telegram Story / forwarded into a chat / saved. See SPEC-VIRAL-FEATURES §1.
import { useEffect, useState } from 'react'
import { shareApi } from './screens/friends/api'
import { Sheet } from './screens/friends/ui'
import { shareStory, shareCard, shareLink, haptic } from './telegram'
import { useStore } from './store'

const DOG = new Set(['dog', ''])
function mascotSrc(species: string): string {
  return DOG.has(species) ? '/pet.webp' : `/mascots/${species}.webp`
}
function pngFallback(species: string): string {
  return DOG.has(species) ? '/pet.png' : `/mascots/${species}.png`
}

function loadImage(src: string, fallback: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      const f = new Image()
      f.onload = () => resolve(f)
      f.onerror = () => resolve(null)
      f.src = fallback
    }
    img.src = src
  })
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w }
    else line = test
  }
  if (line) lines.push(line)
  return lines
}

export interface ShareCardOpts {
  kind: string
  ref?: string
  species: string
  headline: string
  petName?: string
  subtitle?: string
  emoji?: string
}

// Render the card to a PNG data URL (1080×1350, IG/Story-friendly portrait).
export async function renderCardPng(opts: ShareCardOpts): Promise<string> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  // warm gradient background
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#F7E9C6'); g.addColorStop(1, '#F0C95D')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // rounded white panel
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  roundRect(ctx, 70, 90, W - 140, H - 180, 56); ctx.fill()
  // mascot
  const img = await loadImage(mascotSrc(opts.species), pngFallback(opts.species))
  if (img) {
    const s = 520
    ctx.drawImage(img, (W - s) / 2, 200, s, s)
  } else {
    ctx.font = '320px serif'; ctx.textAlign = 'center'
    ctx.fillText(opts.emoji || '🐶', W / 2, 560)
  }
  // headline
  ctx.textAlign = 'center'; ctx.fillStyle = '#5a3d12'
  ctx.font = '800 76px Nunito, system-ui, sans-serif'
  const lines = wrap(ctx, opts.headline, W - 220)
  let y = 880
  for (const l of lines.slice(0, 2)) { ctx.fillText(l, W / 2, y); y += 92 }
  // pet name
  ctx.fillStyle = '#7a5a20'; ctx.font = '700 52px Nunito, system-ui, sans-serif'
  if (opts.subtitle) { ctx.fillText(opts.subtitle, W / 2, y + 8); y += 70 }
  // CTA footer
  ctx.fillStyle = '#5a3d12'; ctx.font = '700 40px Nunito, system-ui, sans-serif'
  ctx.fillText('🐾 Шарик · заведи своего щенка', W / 2, H - 150)
  return canvas.toDataURL('image/png')
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function ShareSheet({ opts, text, onClose }: { opts: ShareCardOpts; text: string; onClose: () => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hosted, setHosted] = useState<{ url: string; preparedId: string | null; link: string } | null>(null)

  useEffect(() => { renderCardPng(opts).then(setPreview).catch(() => setPreview(null)) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function ensureHosted() {
    if (hosted) return hosted
    if (!preview) throw new Error('no_preview')
    const r = await shareApi.card({ kind: opts.kind, ref: opts.ref, png: preview, text })
    if (r.rewarded > 0) useStore.getState().showToast(`+${r.rewarded}🦴 за то, что поделился 💛`)
    const h = { url: r.url, preparedId: r.preparedId, link: r.link }
    setHosted(h); return h
  }

  async function toStory() {
    setBusy(true); haptic('tap')
    try {
      const h = await ensureHosted()
      shareStory(h.url, text, { url: h.link, name: 'Открыть Шарика' })
      void shareApi.log({ kind: opts.kind, ref: opts.ref, surface: 'story' })
    } catch { useStore.getState().showToast('Не получилось, попробуй ещё раз') }
    setBusy(false)
  }

  async function toChat() {
    setBusy(true); haptic('tap')
    try {
      const h = await ensureHosted()
      const sent = h.preparedId ? await shareCard(h.preparedId, h.link, text) : false
      if (!sent) shareLink(h.link, text)
      void shareApi.log({ kind: opts.kind, ref: opts.ref, surface: h.preparedId ? 'message' : 'link' })
    } catch { useStore.getState().showToast('Не получилось, попробуй ещё раз') }
    setBusy(false)
  }

  function save() {
    if (!preview) return
    const a = document.createElement('a')
    a.href = preview; a.download = `sharik-${opts.kind}.png`; a.click()
  }

  return (
    <Sheet onClose={onClose} z={70}>
      <h2 style={{ textAlign: 'center', marginBottom: 12 }}>Поделиться 💛</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        {preview
          ? <img src={preview} alt="" style={{ width: 200, borderRadius: 18, boxShadow: 'var(--shadow-lip)' }} />
          : <div style={{ width: 200, height: 250, borderRadius: 18, background: 'var(--card-shade)' }} />}
      </div>
      <button className="btn" style={{ width: '100%', marginBottom: 8 }} disabled={busy || !preview} onClick={() => void toStory()}>В историю</button>
      <button className="btn accent" style={{ width: '100%', marginBottom: 8 }} disabled={busy || !preview} onClick={() => void toChat()}>Отправить другу</button>
      <button className="btn ghost" style={{ width: '100%' }} disabled={!preview} onClick={save}>Сохранить картинку</button>
    </Sheet>
  )
}
