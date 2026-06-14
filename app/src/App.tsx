import { useEffect } from 'react'
import { useStore, type Tab } from './store'
import { tg } from './telegram'
import { TabIcons } from './art/icons'
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
  { key: 'home', ru: 'Дом' },
  { key: 'quests', ru: 'Задания' },
  { key: 'shop', ru: 'Магазин' },
  { key: 'friends', ru: 'Друзья' },
  { key: 'bag', ru: 'Сумка' },
  { key: 'pet', ru: 'Щенок' },
]

// per-tab page colour (drives the screen background + Telegram chrome)
const TAB_BG: Record<Tab, string> = {
  home: '#F3E2BC',
  quests: '#6E5FC6',
  shop: '#3FA3DD',
  friends: '#74B25C',
  bag: '#F0A02C',
  pet: '#ECDCB4',
}

export function App() {
  const { phase, tab, setTab, boot, toast, menuOpen, setMenuOpen } = useStore()

  useEffect(() => { void boot() }, [boot])

  // keep the Telegram header/background colour in sync with the active tab
  useEffect(() => {
    if (phase !== 'ready') return
    const c = TAB_BG[tab]
    try { tg?.setBackgroundColor(c); tg?.setHeaderColor(c) } catch { /* older clients */ }
  }, [tab, phase])

  if (phase === 'loading') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="puppy-bob"><Puppy state="happy" /></div>
        <h2 style={{ marginTop: 12 }}>Шарик просыпается…</h2>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Puppy state="sleeping" />
        <h2>Не получилось подключиться</h2>
        <button className="btn" onClick={() => location.reload()}>Попробовать ещё раз</button>
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
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {TabIcons[t.key]}
            <span>{t.ru}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
