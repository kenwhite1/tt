import { create } from 'zustand'
import type { StateDto, RewardDto } from '@shared/types'
import { api } from './api'
import { haptic } from './telegram'
import { t } from './i18n'

export type Tab = 'home' | 'quests' | 'shop' | 'friends' | 'bag' | 'pet'
type Phase = 'loading' | 'ready' | 'error'

interface Store {
  phase: Phase
  tab: Tab
  state: StateDto | null
  toast: string | null
  tgName: string
  menuOpen: boolean
  setMenuOpen(open: boolean): void
  refresh(): Promise<void>
  setTab(tab: Tab): void
  boot(): Promise<void>
  completeGoal(id: number): Promise<RewardDto>
  addGoal(title: string, emoji?: string): Promise<void>
  startWalk(): Promise<void>
  logMood(value: number, note?: string): Promise<void>
  pat(count: number): void
  showToast(msg: string): void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

const DEFAULT_PET_NAMES = ['Бублик', 'Тоша', 'Кнопа', 'Шуня', 'Барни', 'Соня', 'Пирожок', 'Луна', 'Персик', 'Марс']

// G earning happens server-side only: every ledger entry is proxied to the hub
// wallet (/api/sdk/earn|spend) with an idempotency key, and /state reconciles
// the balance. The client never talks to the hub about money.

// A walk is completed server-side lazily, on any /state call. So we must re-fetch
// state when the user returns or when a walk's timer crosses the finish line -
// otherwise growth/stones silently stall until the next manual reopen.
let autoRefreshArmed = false
function armAutoRefresh() {
  if (autoRefreshArmed || typeof document === 'undefined') return
  autoRefreshArmed = true
  const refresh = () => { void useStore.getState().refresh() }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh() })
  window.addEventListener('focus', refresh)
  setInterval(() => {
    const walk = useStore.getState().state?.walk
    if (walk && !walk.completed && walk.endsTs <= Date.now()) refresh()
  }, 30_000)
}

export const useStore = create<Store>((set, get) => ({
  phase: 'loading',
  tab: 'home',
  state: null,
  toast: null,
  tgName: '',
  menuOpen: false,

  setMenuOpen: menuOpen => set({ menuOpen }),

  async refresh() {
    const { state } = await api.state()
    set({ state })
  },

  setTab: tab => { haptic('tap'); set({ tab }) },

  showToast(msg) {
    clearTimeout(toastTimer)
    set({ toast: t(msg) })
    toastTimer = setTimeout(() => set({ toast: null }), 2200)
  },

  async boot() {
    try {
      const r = await api.auth()
      set({ tgName: r.tg.name })
      // No onboarding: new players get a pet with default settings straight away.
      if (!r.registered) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        const petName = DEFAULT_PET_NAMES[Math.floor(Math.random() * DEFAULT_PET_NAMES.length)]
        const userName = (r.tg.name || '').trim().slice(0, 40) || 'Друг'
        await api.onboard({ petName, pronouns: 'he', trait: 'curiosity', species: 'dog', userName, tz })
      }
      const { state } = await api.state()
      set({ state, phase: 'ready' })
      armAutoRefresh()
    } catch (e) {
      console.error(e)
      set({ phase: 'error' })
    }
  },

  async completeGoal(id) {
    const { reward, state } = await api.completeGoal(id)
    haptic('success')
    set({ state })
    return reward // Home floats the exact reward from the tap point
  },

  async addGoal(title, emoji) {
    const { state } = await api.addGoal({ title, emoji })
    set({ state })
  },

  async startWalk() {
    const { state } = await api.startWalk()
    haptic('success')
    get().showToast(`${state.pet.name} ${t('на прогулке!')}`)
    set({ state })
  },

  async logMood(value, note) {
    const { state } = await api.mood(value, note)
    haptic('success')
    get().showToast('Настроение записано 💛')
    set({ state })
  },

  pat(count) {
    void api.pat(count).catch(() => {})
  },
}))
