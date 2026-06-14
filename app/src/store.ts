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
  setMenuOpen(open: boolean): void
  refresh(): Promise<void>
  setTab(tab: Tab): void
  boot(): Promise<void>
  finishOnboarding(data: { petName: string; pronouns: string; color: string; trait: string; userName: string; areas?: string[] }): Promise<void>
  enterApp(): void
  completeGoal(id: number): Promise<RewardDto>
  addGoal(title: string, emoji?: string): Promise<void>
  startWalk(): Promise<void>
  logMood(value: number, note?: string): Promise<void>
  pat(count: number): void
  showToast(msg: string): void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

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
    } catch (e) {
      console.error(e)
      set({ phase: 'error' })
    }
  },

  // Creates the account/pet/starter-goals and stores state, but STAYS in onboarding
  // so the post-creation beats (first goal, reminders, invite) can run. enterApp() finishes.
  async finishOnboarding(data) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { state } = await api.onboard({ ...data, tz })
    haptic('success')
    set({ state })
  },

  enterApp() {
    set({ phase: 'ready' })
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
    get().showToast('Щенок отправился на прогулку! 🐾')
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
