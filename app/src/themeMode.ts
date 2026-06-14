// Light/dark theme: follows the user's Telegram colour scheme by default,
// with a manual override saved in localStorage. Sets [data-theme] on <html>.
import { tg } from './telegram'

export type ThemePref = 'auto' | 'light' | 'dark'

export function getThemePref(): ThemePref {
  const v = localStorage.getItem('themePref')
  // light is the default; 'auto' (follow Telegram) is opt-in via Settings
  return v === 'auto' || v === 'light' || v === 'dark' ? v : 'light'
}

export function resolveTheme(pref: ThemePref = getThemePref()): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref
  if (tg) return tg.colorScheme === 'dark' ? 'dark' : 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(pref: ThemePref = getThemePref()): 'light' | 'dark' {
  const t = resolveTheme(pref)
  document.documentElement.dataset.theme = t
  return t
}

export function setThemePref(pref: ThemePref): 'light' | 'dark' {
  localStorage.setItem('themePref', pref)
  return applyTheme(pref)
}
