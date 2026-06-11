import { useEffect } from 'react'
import { useStore, type Tab } from './store'
import { TabIcons } from './art/icons'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { Quests } from './screens/Quests'
import { Shop } from './screens/Shop'
import { Friends } from './screens/Friends'
import { Bag } from './screens/Bag'
import { Pet } from './screens/Pet'
import { Puppy } from './art/Puppy'

const TABS: { key: Tab; ru: string }[] = [
  { key: 'home', ru: 'Дом' },
  { key: 'quests', ru: 'Задания' },
  { key: 'shop', ru: 'Магазин' },
  { key: 'friends', ru: 'Друзья' },
  { key: 'bag', ru: 'Сумка' },
  { key: 'pet', ru: 'Щенок' },
]

export function App() {
  const { phase, tab, setTab, boot, toast } = useStore()

  useEffect(() => { void boot() }, [boot])

  if (phase === 'loading') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Puppy state="happy" />
        <h2 style={{ marginTop: 12 }}>Дружок просыпается…</h2>
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
    <div className="screen">
      {toast && <div className="toast">{toast}</div>}
      {tab === 'home' && <Home />}
      {tab === 'quests' && <Quests />}
      {tab === 'shop' && <Shop />}
      {tab === 'friends' && <Friends />}
      {tab === 'bag' && <Bag />}
      {tab === 'pet' && <Pet />}
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
