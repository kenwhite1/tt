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
