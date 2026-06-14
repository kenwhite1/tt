// Tiny synthesized sound effects via WebAudio — no asset files, works offline.
// Respects a mute flag stored in localStorage; created lazily on first play
// (after a user gesture, which Telegram's webview requires).
let ctx: AudioContext | null = null
let muted = localStorage.getItem('sfxMuted') === '1'

export function isSoundOn(): boolean { return !muted }
export function setSoundOn(on: boolean): void {
  muted = !on
  localStorage.setItem('sfxMuted', muted ? '1' : '0')
}

function audioCtx(): AudioContext | null {
  if (muted) return null
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = ctx ?? new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

function blip(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = 'sine', peak = 0.12): void {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g); g.connect(c.destination)
  o.start(at); o.stop(at + dur + 0.02)
}

export type Sfx = 'pat' | 'complete' | 'hatch' | 'level'

// Soft, warm cues — short and quiet so they never feel like a game-show.
export function playSfx(name: Sfx): void {
  const c = audioCtx()
  if (!c) return
  const t = c.currentTime
  switch (name) {
    case 'pat':
      blip(c, 680, t, 0.11, 'sine', 0.09)
      break
    case 'complete': // a gentle C5 → G5
      blip(c, 523.25, t, 0.13, 'triangle')
      blip(c, 783.99, t + 0.085, 0.18, 'triangle')
      break
    case 'hatch': // bright ascending arpeggio
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => blip(c, f, t + i * 0.08, 0.22, 'triangle', 0.11))
      break
    case 'level':
      ;[659.25, 880, 1318.5].forEach((f, i) => blip(c, f, t + i * 0.07, 0.2, 'sine', 0.1))
      break
  }
}
