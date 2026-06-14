import type { StateDto, RewardDto } from '@shared/types'
import { getInitData } from './telegram'

let token: string | null = sessionStorage.getItem('jwt')

export async function req<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw Object.assign(new Error(json.error ?? 'request_failed'), { status: res.status, data: json })
  return json as T
}

export const api = {
  async auth(): Promise<{ registered: boolean; tg: { id: number; name: string } }> {
    const r = await req<{ token: string; registered: boolean; tg: { id: number; name: string } }>(
      '/auth', { initData: getInitData() },
    )
    token = r.token
    sessionStorage.setItem('jwt', r.token)
    return r
  },
  onboard: (data: { petName: string; pronouns: string; color: string; trait: string; species?: string; userName: string; tz?: string; areas?: string[] }) =>
    req<{ state: StateDto }>('/onboard', data),
  state: () => req<{ state: StateDto }>('/state'),
  addGoal: (data: { title: string; emoji?: string }) => req<{ state: StateDto }>('/goals', data),
  completeGoal: (id: number) => req<{ reward: RewardDto; state: StateDto }>(`/goals/${id}/complete`, {}),
  starGoal: (id: number) => req<{ state: StateDto }>(`/goals/${id}/star`, {}),
  startWalk: () => req<{ state: StateDto }>('/walk/start', {}),
  pat: (count: number) => req<{ pts: number }>('/pet/pat', { count }),
  mood: (value: number, note?: string) => req<{ state: StateDto }>('/mood', { value, note }),
  survey: (data: Record<string, unknown>) => req<{ ok: boolean }>('/onboarding/survey', data),
  subscribe: (plan: 'month' | 'year') => req<{ link?: string; dev?: boolean }>('/payments/subscribe', { plan }),
  enableNotifications: () => req<{ ok: boolean }>('/notifications/enable', {}),
}
