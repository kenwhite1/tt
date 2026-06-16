import { create } from 'zustand'
import type { StateDto, RewardDto } from '@shared/types'
import { api } from './api'
import { haptic } from './telegram'

export type Tab = 'home' | 'quests' | 'shop' | 'friends' | 'bag' | 'pet'
type Phase = 'loading' | 'onboarding' | 'ready' | 'error'

interface Store {
  phase: Phase
  tab: Tab
  state: StateDto | null
  toast: string | null
  tgName: string
  menuOpen: boolean
  retaking: boolean
  setMenuOpen(open: boolean): void
  refresh(): Promise<void>
  setTab(tab: Tab): void
  boot(): Promise<void>
  finishOnboarding(data: { petName: string; pronouns: string; trait: string; species?: string; userName: string; areas?: string[] }): Promise<void>
  restartOnboarding(): void
  enterApp(): void
  completeGoal(id: number): Promise<RewardDto>
  addGoal(title: string, emoji?: string): Promise<void>
  startWalk(): Promise<void>
  logMood(value: number, note?: string): Promise<void>
  pat(count: number): void
  showToast(msg: string): void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

// A walk is completed server-side lazily, on any /state call. So we must re-fetch
// state when the user returns or when a walk's timer crosses the finish line —
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
  retaking: false,

  setMenuOpen: menuOpen => set({ menuOpen }),

  async refresh() {
    const { state } = await api.state()
    set({ state })
  },

  setTab: tab => { haptic('tap'); set({ tab }) },

  showToast(msg) {
    clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = setTimeout(() => set({ toast: null }), 2200)
  },

  async boot() {
    try {
      const r = await api.auth()
      set({ tgName: r.tg.name })
      if (!r.registered) { set({ phase: 'onboarding' }); return }
      const { state } = await api.state()
      set({ state, phase: 'ready' })
      armAutoRefresh()
    } catch (e) {
      console.error(e)
      set({ phase: 'error' })
    }
  },

  // Creates the account/pet/starter-goals and stores state, but STAYS in onboarding
  // so the post-creation beats (first goal, reminders, invite) can run. enterApp() finishes.
  async finishOnboarding(data) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Retake (already registered) updates the existing pet; first run creates it.
    const { state } = get().retaking
      ? await api.onboardRetake({ ...data, tz })
      : await api.onboard({ ...data, tz })
    haptic('success')
    set({ state })
  },

  // Re-run the onboarding quiz from Settings (keeps all progress).
  restartOnboarding() {
    haptic('tap')
    set({ phase: 'onboarding', retaking: true, menuOpen: false })
  },

  enterApp() {
    set({ phase: 'ready', retaking: false })
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
    get().showToast(`${state.pet.name} на прогулке!`)
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
