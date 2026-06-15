// Thin typed wrapper over the Telegram WebApp bridge; safe no-ops outside Telegram.
interface TgWebApp {
  initData: string
  initDataUnsafe: { user?: { id: number; first_name: string }; start_param?: string }
  colorScheme: 'light' | 'dark'
  ready(): void
  expand(): void
  isVersionAtLeast(v: string): boolean
  requestFullscreen?(): void
  lockOrientation?(): void
  disableVerticalSwipes?(): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  setHeaderColor(c: string): void
  setBackgroundColor(c: string): void
  requestWriteAccess?(cb?: (ok: boolean) => void): void
  addToHomeScreen?(): void
  openTelegramLink?(url: string): void
  shareToStory?(mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }): void
  shareMessage?(msgId: string, cb?: (sent: boolean) => void): void
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void }
  openInvoice?(url: string, cb: (status: string) => void): void
}

declare global {
  interface Window { Telegram?: { WebApp: TgWebApp } }
}

export const tg: TgWebApp | null = window.Telegram?.WebApp ?? null
export const inTelegram = !!tg && tg.initData.length > 0

export function initTelegram() {
  if (!tg) return
  try {
    tg.ready()
    tg.expand()
    tg.setHeaderColor('#F3E2BC')
    tg.setBackgroundColor('#F3E2BC')
    if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes?.()
    // NOTE: no requestFullscreen() — fullscreen makes the webview draw *under*
    // Telegram's floating Close/⋯ controls, which then overlap the app header.
    // Standard (expanded) mode keeps Telegram's header above the app — no collision.
  } catch { /* older clients */ }
}

export function haptic(kind: 'tap' | 'success' | 'warn' = 'tap') {
  const h = tg?.HapticFeedback
  if (!h) return
  if (kind === 'tap') h.impactOccurred('light')
  else if (kind === 'success') h.notificationOccurred('success')
  else h.notificationOccurred('warning')
}

export function getInitData(): string {
  return tg?.initData ?? ''
}

// startapp deep-link payload (e.g. "ref_AB12CD34" from an invite link).
export function getStartParam(): string | null {
  return tg?.initDataUnsafe?.start_param ?? null
}

// Ask the user to allow the bot to DM them (reminders). Resolves true outside Telegram (dev).
export function requestWriteAccess(): Promise<boolean> {
  return new Promise(resolve => {
    if (!tg?.requestWriteAccess) { resolve(true); return }
    try { tg.requestWriteAccess(ok => resolve(!!ok)) } catch { resolve(false) }
  })
}

export function addToHomeScreen(): void {
  try { tg?.addToHomeScreen?.() } catch { /* unsupported client */ }
}

// ─── Share surfaces (Feature 1 «Витрина») ───────────────────────────────
// Open a t.me/share/url forward dialog — the universal fallback that works on every client.
export function shareLink(url: string, text: string): void {
  const u = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  try {
    if (tg?.openTelegramLink) tg.openTelegramLink(u)
    else window.open(u, '_blank')
  } catch { /* ignore */ }
}

// Post a milestone card to the user's Telegram Story (Bot API 7.8+), with the app
// deep-link baked in as a tappable widget. Falls back to a forwardable link.
export function shareStory(mediaUrl: string, text: string, link: { url: string; name?: string }): boolean {
  if (tg?.shareToStory && tg.isVersionAtLeast('7.8')) {
    try { tg.shareToStory(mediaUrl, { text, widget_link: link }); return true } catch { /* fall through */ }
  }
  shareLink(link.url, text)
  return false
}

// Forward a server-prepared inline message into a chat (Bot API 8.0+).
export function shareCard(preparedId: string, fallbackUrl: string, fallbackText: string): Promise<boolean> {
  return new Promise(resolve => {
    if (tg?.shareMessage && tg.isVersionAtLeast('8.0')) {
      try { tg.shareMessage(preparedId, ok => resolve(!!ok)); return } catch { /* fall through */ }
    }
    shareLink(fallbackUrl, fallbackText)
    resolve(false)
  })
}

export function tgVersionAtLeast(v: string): boolean {
  try { return !!tg?.isVersionAtLeast(v) } catch { return false }
}
