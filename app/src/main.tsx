import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initTelegram } from './telegram'
import { applyTheme } from './themeMode'
import { initAnalytics } from './analytics'
import './theme.css'

initTelegram()
applyTheme() // set light/dark before first paint (no flash)
initAnalytics() // capture client errors from the start
createRoot(document.getElementById('root')!).render(<App />)
