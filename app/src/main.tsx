import { ggAvatarBadge } from './gg/avatarBadge'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initTelegram } from './telegram'
import { applyTheme } from './themeMode'
import { initAnalytics } from './analytics'
import { initLang } from './i18n'
import './theme.css'

initLang()
initTelegram()
applyTheme() // set light/dark before first paint (no flash)
initAnalytics() // capture client errors from the start
createRoot(document.getElementById('root')!).render(<App />)

// Значок аватара GG: косметика, купленная в хабе, видна и здесь (Avatar SDK).
void ggAvatarBadge({ size: 40, corner: 'top-left' })
