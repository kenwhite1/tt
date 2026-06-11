import { create } from 'zustand'
import type { StateDto } from '@shared/types'
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
  setTab(tab: Tab): void
  boot(): Promise<void>
  finishOnboarding(data: { petName: string; pronouns: string; color: string; trait: string; userName: string }): Promise<void>
  completeGoal(id: number): Promise<void>
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

  async finishOnboarding(data) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { state } = await api.onboard({ ...data, tz })
    haptic('success')
    set({ state, phase: 'ready' })
  },

  async completeGoal(id) {
    const { reward, state } = await api.completeGoal(id)
    haptic('success')
    const bits = []
    if (reward.energy) bits.push(`+${reward.energy}⚡`)
    if (reward.stones) bits.push(`+${reward.stones}🦴`)
    if (reward.walkMinutesReduced) bits.push(`прогулка −${reward.walkMinutesReduced} мин`)
    get().showToast(bits.join('  ') || 'Готово!')
    set({ state })
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
