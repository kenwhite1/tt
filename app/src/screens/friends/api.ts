// Social (Дворик) client types + thin fetch helpers over the shared `req`.
// Mirrors the JSON shapes returned by server/src/routes/social.ts.
import { req } from '../../api'
import type { Stage } from '@shared/constants'
import type { CoopDto, DailyDigDto, DigResultDto } from '@shared/types'

export type Vibe = { id: string; ru: string; emoji: string; color: string; plus: boolean }

export interface SharedGoalStrip {
  goalId: number
  kind: string // 'share' | 'buddy'
  title: string
  emoji: string
  mine: boolean
  streak: number
  doneToday: boolean
}

export interface FeedEvent { day: string; text: string }

export interface Friend {
  id: number
  name: string
  realName: string
  emoji: string | null
  muted: boolean
  petName: string
  stage: Stage
  color: string
  dyes: string // JSON string
  pts: number
  level: number
  unreadVibes: number
  hugToday: boolean
  atRisk: boolean
  sharedGoals: SharedGoalStrip[]
  feed: FeedEvent[]
}

export interface FriendRequest { fromId: number; name: string; petName: string; ts: number }
export interface BuddyInvite { mailId: number; fromId: number; fromName: string; title: string; emoji: string; expires: number }
export interface Nudge { vibeId: number; fromId: number; name: string; type: string; ts: number }
export interface Visit { friendId: number; name: string; until: number }

export interface FriendsPayload {
  me: { code: string; petName: string; stage: Stage; color: string; species: string }
  botUsername: string
  plus: boolean
  friends: Friend[]
  requests: FriendRequest[]
  buddyInvites: BuddyInvite[]
  unreadVibesTotal: number
  hugAvailable: boolean
  nudge: Nudge | null
  visit: Visit | null
  referral: { count: number; max: number }
  vibeTypes: Vibe[]
  settings: { allowRequests: boolean; allowVibes: boolean; notifySocial: boolean }
}

export interface InboxGroup {
  fromId: number
  name: string
  petName: string
  flavor: string
  vibes: { id: number; type: string; ru: string; emoji: string; ts: number; answered: boolean }[]
}
export interface InboxPayload { groups: InboxGroup[]; vibeTypes: Vibe[]; plus: boolean }

export interface Referrals {
  count: number
  rewardsClaimed: number
  max: number
  code: string
  link: string
  botUsername: string
  ladder: { tier: number; ru: string; done: boolean }[]
  inviteeGift: string
}

export type VibeReward = { energy: number; stones: number; walkMinutesReduced?: number }

export const social = {
  friends: () => req<FriendsPayload>('/social/friends'),
  config: () => req<{ botUsername: string }>('/social/config'),
  referrals: () => req<Referrals>('/social/referrals'),
  inbox: () => req<InboxPayload>('/social/vibes/inbox'),
  add: (code: string) => req<{ sent?: boolean; accepted?: boolean }>('/social/add', { code }),
  accept: (fromId: number) => req<{ ok: boolean }>(`/social/requests/${fromId}/accept`, {}),
  decline: (fromId: number) => req<{ ok: boolean }>(`/social/requests/${fromId}/decline`, {}),
  edit: (id: number, patch: { nickname?: string | null; emoji?: string | null; muted?: boolean }) =>
    req<{ ok: boolean }>(`/social/friends/${id}/edit`, patch),
  unfriend: (id: number, block: boolean) => req<{ ok: boolean }>(`/social/friends/${id}/unfriend`, { block }),
  sendVibe: (friendId: number, type: string) =>
    req<{ reward: VibeReward; first: boolean }>('/social/vibes/send', { friendId, type }),
  answer: (id: number, type: string, invite?: boolean) =>
    req<{ reward: VibeReward | null; visit: { friendId: number; until: number } | null }>(`/social/vibes/${id}/answer`, { type, invite }),
  clear: (ids?: number[]) => req<{ ok: boolean }>('/social/vibes/clear', ids ? { ids } : {}),
  hug: () => req<{ ok: boolean; notified: number }>('/social/hug', {}),
  shareGoal: (goalId: number, friendIds: number[]) =>
    req<{ ok: boolean; shared: number }>(`/social/goals/${goalId}/share`, { friendIds }),
  buddyGoal: (goalId: number, friendId: number) =>
    req<{ ok: boolean; expires: number }>(`/social/goals/${goalId}/buddy`, { friendId }),
  buddyAccept: (mailId: number) => req<{ ok: boolean; goalId: number }>('/social/buddy/accept', { mailId }),
  buddyDecline: (mailId: number) => req<{ ok: boolean }>('/social/buddy/decline', { mailId }),
  kudos: (goalId: number, ownerId: number) =>
    req<{ ok: boolean }>(`/social/goals/${goalId}/kudos`, { ownerId }),
  // Feature 3 — giftable streak-freeze
  giftFreeze: (friendId: number, buy?: boolean) =>
    req<{ ok: boolean; usedBanked: boolean }>('/social/gift-freeze', { friendId, buy }),
  // Feature 4 — compliments
  compliments: () => req<{ compliments: Compliment[]; anonAllowed: boolean; isMinor: boolean }>('/social/compliments'),
  compliment: (body: { friendId?: number; external?: boolean; messageId: string; anon?: boolean }) =>
    req<{ ok?: boolean; first?: boolean; reward?: VibeReward; external?: boolean; link?: string; text?: string }>('/social/compliment', body),
  appreciationWeek: () =>
    req<{ count: number; items: { ru: string; emoji: string; from: string | null; ts: number }[] }>('/social/appreciation/week'),
  // safety — report
  report: (body: { targetId?: number; kind: 'user' | 'vibe' | 'message' | 'coop' | 'other'; ref?: string; reason: string; note?: string }) =>
    req<{ ok: boolean }>('/social/report', body),
}

export interface Compliment { id: string; ru: string; emoji: string }

// ─── «Содружок» / co-op puppy ───
export interface CoopInvite { inviteId: number; coopId: number; fromId: number; fromName: string; name: string; code: string }
export interface CoopListPayload {
  bonds: CoopDto[]
  invites: CoopInvite[]
  maxActive: number
  canCreate: boolean
  botUsername: string
  eggColors: { id: string; ru: string; hex: string }[]
  contribPerMember: number
}
export const coop = {
  list: () => req<CoopListPayload>('/coop/list'),
  create: (body: { friendId?: number; name?: string; species?: string; color?: string }) =>
    req<{ coop: CoopDto; code: string; link: string }>('/coop/create', body),
  accept: (code?: string) => req<{ coop?: CoopDto; error?: string }>('/coop/accept', { code }),
  walkStart: (coopId: number) => req<{ coop: CoopDto }>('/coop/walk/start', { coopId }),
  walkClaim: (coopId: number) =>
    req<{ coop: CoopDto; claimed: boolean; reward: { stones: number } | null; story: string | null; leveledTo: Stage | null; discovery: { ru: string; emoji: string } | null }>('/coop/walk/claim', { coopId }),
  pet: (coopId: number) => req<{ ok: boolean }>('/coop/pet', { coopId }),
  rename: (coopId: number, name: string, confirm?: boolean) =>
    req<{ ok: boolean; applied: boolean; pending?: boolean }>('/coop/rename', { coopId, name, confirm }),
  pause: (coopId: number, pause: boolean) => req<{ coop: CoopDto }>('/coop/pause', { coopId, pause }),
  leave: (coopId: number) => req<{ ok: boolean }>('/coop/leave', { coopId }),
  invite: (coopId: number, friendId?: number) =>
    req<{ ok: boolean; code: string; link: string }>('/coop/invite', { coopId, friendId }),
}

// ─── «Косточка дня» daily dig ───
export const daily = {
  today: () => req<DailyDigDto>('/daily/today'),
  dig: () => req<{ result: DigResultDto; alreadyDug: boolean; streak: number }>('/daily/dig', {}),
  friends: () => req<{ digs: { name: string; emoji: string; ru: string; tier: number }[] }>('/daily/friends'),
  markShared: () => req<{ ok: boolean }>('/daily/shared', {}),
}

// ─── «Вечерний сбор» evening ───
export const evening = {
  now: () => req<{ inWindow: boolean; hour: number; windowMin: number; checkedIn: boolean; present: { name: string; petName: string; species: string }[] }>('/evening/now'),
  checkin: () => req<{ ok: boolean }>('/evening/checkin', {}),
  setHour: (hour: number) => req<{ ok: boolean; hour: number }>('/evening/settings', { hour }),
}

// ─── «Витрина» share cards ───
export const shareApi = {
  card: (body: { kind: string; ref?: string; png: string; text?: string }) =>
    req<{ url: string; preparedId: string | null; link: string; rewarded: number }>('/share/card', body),
  log: (body: { kind: string; ref?: string; surface: string }) => req<{ ok: boolean }>('/share/log', body),
}
