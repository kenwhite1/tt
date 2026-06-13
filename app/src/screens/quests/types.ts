// DTO shapes returned by /api/quests/* (mirrors server/src/routes/quests.ts buildState).
export interface DailyQuestDto {
  id: string
  ru: string
  type: string
  done: boolean
  claimed: boolean
  manual: boolean
  reward: number
  question?: { text: string; options: string[]; answer: number | null }
  affirmation?: string
}

export interface WeeklyDto {
  sca: string
  ru: string
  emoji: string
  color: string
  days: number
  claimed: number // bitmask: 1|2|4 for tiers 0/1/2
}

export interface SpecialDto {
  id: string
  ru: string
  metric: string
  value: number
  target: number | null
  tier: number
  totalTiers: number
  claimable: boolean
  reward: number
}

export interface ChallengeDto {
  id: string
  name: string
  theme: string
  badge: string
  goals: { ru: string; emoji: string }[]
  joined: boolean
  joinable: boolean
  completed: boolean
  doneIdx: number[]
  checkedToday: boolean
}

export interface QuestsState {
  day: string
  month: string
  daily: DailyQuestDto[]
  weekly: WeeklyDto[]
  special: SpecialDto[]
  challenges: ChallengeDto[]
}

export interface QuestsResp {
  state: QuestsState
  reward?: number
  celebrate?: boolean
}
