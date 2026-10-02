import { useEffect } from 'react'
import { useStore, type Tab } from './store'
import { tg, getStartParam } from './telegram'
import { coop } from './screens/friends/api'
import { resolveTheme } from './themeMode'
import { track } from './analytics'
import { TabIcons } from './art/icons'
import { t, useLang } from './i18n'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { Quests } from './screens/Quests'
import { Shop } from './screens/Shop'
import { Friends } from './screens/Friends'
import { Bag } from './screens/Bag'
import { Pet } from './screens/Pet'
import { Menu } from './screens/menu/Menu'
import { Puppy } from './art/Puppy'

const TABS: { key: Tab; ru: string }[] = [
  { key: 'home', ru: "Дом" },
  { key: 'quests', ru: "Задания" },
  { key: 'shop', ru: "Магазин" },
  { key: 'friends', ru: "Друзья" },
  { key: 'bag', ru: "Сумка" },
  { key: 'pet', ru: "Питомец" },
]

// per-tab page colour (drives the screen background + Telegram chrome)
// Deepened saturated colours so white headings clear the contrast bar (a11y).
const TAB_BG: Record<Tab, string> = {
  home: '#F3E2BC',
  quests: '#5F51B5',
  shop: '#2E8FC6',
  friends: '#5E9A48',
  bag: '#C2781C',
  pet: '#ECDCB4',
}

let coopHandled = false

export function App() {
  useLang() // re-render whole tree on language switch
  const { phase, tab, setTab, boot, toast, menuOpen, setMenuOpen } = useStore()

  useEffect(() => { void boot() }, [boot])
  useEffect(() => { if (phase === 'ready') track('app_open') }, [phase])

  // co-op deep link: t.me/<bot>?startapp=coop_<code> → accept the bond, land on Дворик
  useEffect(() => {
    if (phase !== 'ready' || coopHandled) return
    const sp = getStartParam()
    if (!sp || !sp.startsWith('coop_')) return
    coopHandled = true
    coop.accept(sp.slice(5)).then(r => {
      if (r.coop) { setTab('friends'); useStore.getState().showToast(t("Щенок вылупился! 🐣")) }
    }).catch(() => { /* invite gone / already member */ })
  }, [phase, setTab])

  // keep the Telegram header/background colour in sync with the active tab
  useEffect(() => {
    if (phase !== 'ready') return
    const dark = resolveTheme() === 'dark'
    const neutral = tab === 'home' || tab === 'pet'
    const c = dark && neutral ? '#18130f' : TAB_BG[tab]
    try { tg?.setBackgroundColor(c); tg?.setHeaderColor(c) } catch { /* older clients */ }
  }, [tab, phase])

  if (phase === 'loading') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="puppy-bob"><Puppy state="happy" /></div>
        <h2 style={{ marginTop: 12 }}>{t('Шарик просыпается…')}</h2>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Puppy state="sleeping" />
        <h2>{t('Не получилось подключиться')}</h2>
        <button className="btn" onClick={() => location.reload()}>{t('Попробовать ещё раз')}</button>
      </div>
    )
  }

  if (phase === 'onboarding') return <Onboarding />

  return (
    <div className={`screen tab-${tab}`}>
      {toast && <div className="toast">{toast}</div>}
      {menuOpen && <Menu onClose={() => setMenuOpen(false)} />}
      <div key={tab} className="tab-page">
        {tab === 'home' && <Home />}
        {tab === 'quests' && <Quests />}
        {tab === 'shop' && <Shop />}
        {tab === 'friends' && <Friends />}
        {tab === 'bag' && <Bag />}
        {tab === 'pet' && <Pet />}
      </div>
      <nav className="tabbar">
        {TABS.map(tb => (
          <button key={tb.key} className={`tab ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
            {TabIcons[tb.key]}
            <span>{t(tb.ru)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
