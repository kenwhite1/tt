export interface UserRow {
  id: number
  name: string
  tz: string
  wake_min: number
  sleep_min: number
  stones: number
  energy: number
  streak: number
  streak_best: number
  streak_intensity: string
  last_day: string | null
  repairs: number
  walks_since_repair: number
  plus_until: string | null
  paused_until: string | null
  friend_code: string
  referred_by: number | null
  referral_rewards: number
  location_id: string
  settings: string
  created_at: string
}

export interface PetRow {
  user_id: number
  name: string
  pronouns: 'he' | 'she' | 'they'
  color: string
  trait: string
  walks: number
  friendship_pts: number
  pats_today: number
  personality: string
  hatch_day: string
  dyes: string
}

export interface GoalRow {
  id: number
  user_id: number
  title: string
  emoji: string
  sca: string | null
  times_per_day: number
  sort: number
  paused: number
  archived: number
  goal_of_day: string | null
  linked_exercise: string | null
  created_at: string
}

export interface WalkRow {
  id: number
  user_id: number
  day: string
  location_id: string
  started_ts: number
  ends_ts: number
  completed: number
  chat_done: number
  story_id: string | null
  discovery_id: string | null
}
