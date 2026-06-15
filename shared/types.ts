import type { Stage } from './constants'

export interface UserDto {
  id: number
  name: string
  stones: number
  streak: number
  streakBest: number
  repairs: number
  friendCode: string
  plus: boolean
  pausedUntil: string | null
  wakeMin: number
  sleepMin: number
  tz: string
}

export interface PetDto {
  name: string
  species: string
  pronouns: 'he' | 'she' | 'they'
  stage: Stage
  walks: number
  friendshipPts: number
  friendshipLevel: number
  color: string
  trait: string
  hatchDay: string
}

export interface GoalDto {
  id: number
  title: string
  emoji: string
  sca: string | null
  timesPerDay: number
  doneToday: number
  isGoalOfDay: boolean
  paused: boolean
}

export interface WalkDto {
  id: number
  locationId: string
  startedTs: number
  endsTs: number
  completed: boolean
  chatDone: boolean
}

export interface StateDto {
  user: UserDto
  pet: PetDto
  day: string
  energy: number
  energyMax: number
  walk: WalkDto | null
  walkReady: boolean
  moodToday: number | null
  lowMoodDay: boolean
  goals: GoalDto[]
}

export interface RewardDto {
  energy: number
  stones: number
  walkMinutesReduced?: number
}

// ─── «Содружок» / co-op puppy ───
export interface CoopMemberDto {
  userId: number
  name: string
  species: string
  contrib: number          // 0..COOP_CONTRIB_PER_MEMBER for their own game-day
  isMe: boolean
  role: 'founder' | 'member'
  showedUp: boolean        // contrib >= COOP_CONTRIB_PER_MEMBER
}
export interface CoopDto {
  id: number
  name: string
  pronouns: string
  species: string
  color: string
  dyes: Record<string, string>
  stage: Stage
  walks: number
  status: 'pending' | 'active' | 'dormant'
  bar: number              // derived Σ contrib
  barFull: number          // COOP_CONTRIB_PER_MEMBER × memberCount
  myContrib: number
  members: CoopMemberDto[]
  walk: { startedTs: number; endsTs: number; completed: boolean } | null
  walkReady: boolean
  walkClaimable: boolean
  streak: number
  friendshipPts: number
  friendshipLevel: number
  shareCode: string        // for invite / story deep-link
}

// ─── «Косточка дня» daily dig ───
export interface DigResultDto {
  tier: number             // 0 common · 1 uncommon · 2 rare
  kind: string             // stones|discovery|dye|egg
  ref: string
  stones: number
  ru: string               // human label of what was dug up
  emoji: string
}
export interface DailyDigDto {
  day: string
  dug: boolean
  result: DigResultDto | null
  shared: boolean
  streak: number           // gentle "N days digging" counter (separate from main streak)
}
