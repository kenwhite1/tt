// DTO types mirroring server/src/routes/activities.ts responses.

export interface Reward { energy: number; stones: number; walkMinutesReduced?: number }

export interface BreathPhase { label: string; seconds: number }
export interface BreathPattern { id: string; name: string; tabs: string[]; phases: BreathPhase[]; plus: boolean }
export interface MovementSet {
  id: string; name: string; kind: string; plus: boolean
  moves: { name: string; seconds: number; animKey: string }[]
}
export interface GroundingEx { id: string; name: string; steps: string[] }
export interface Helpline { ru_name: string; phone: string | null; url?: string; hours: string }
export interface PromptFull { id: string; title: string; intro: string; steps: string[]; energy: number; plus: boolean; tabs?: string[] }
export interface QuizBand { min: number; max: number; ru_title: string; ru_text: string }
export interface QuizDef { id: string; name: string; scale: string; plus: boolean; intro: string; questions: string[]; bands: QuizBand[] }
export interface EmotionValence { id: string; ru: string; sub: { id: string | null; ru: string; words: string[] }[] }

export interface TimerCfg { free: number[]; plus: number[]; energy: Record<string, number> }

export interface ContentDto {
  plus: boolean
  breathing: { durations: { free: number[]; plus: number[] }; patterns: BreathPattern[] }
  movements: MovementSet[]
  movementEnergy: Record<string, number>
  movementDurations: { free: number[]; plus: number[] }
  grounding: GroundingEx[]
  timers: { meditation: TimerCfg; focus: TimerCfg }
  breathingEnergy: Record<string, number>
  firstaid: {
    name: string; note: string
    grounding: string[]; breathing: string[]
    sosPrompts: PromptFull[]
    helplines: Helpline[]
  }
  emotions: EmotionValence[]
  affirmations: string[]
  quizzesEnabled: boolean
  quizzes: { disclaimer: string; scales: Record<string, { ru: string; score: number }[]>; list: QuizDef[] } | null
}

export interface ReflectionHistoryItem {
  id: number; day: string; promptId: string | null
  title: string; snippet: string; valence: number | null; ts: number
}
export interface ReflectionsDto { prompts: PromptFull[]; history: ReflectionHistoryItem[] }

export interface GoalIdea { id: string; ru: string; emoji: string; category: string; sca: string | null }
export interface Sca { id: string; ru: string; emoji: string; color: string }
export interface GoalIdeasDto { categories: { id: string; ru: string }[]; scas: Sca[]; goals: GoalIdea[] }

export interface ScaProgress { id: string; ru: string; emoji: string; color: string; custom: boolean; goals: number; weekDays: string[] }
export interface ScasDto { monday: string; scas: ScaProgress[]; milestones: { days: number; stones: number }[] }

export interface MyGoal {
  id: number; title: string; emoji: string; sca: string | null
  timesPerDay: number; paused: boolean; archived: boolean; doneToday: number; createdAt: string
}
export interface MyGoalsDto { goals: MyGoal[]; scas: Sca[] }

export interface InsightsDto {
  range: string
  moodByDay: Record<string, number>
  goals: { total: number; top: { title: string; emoji: string; n: number }[]; missed: { title: string; emoji: string; missedDays: number }[] }
  reflections: { count: number; positive: number; negative: number }
  activities: { kind: string; n: number }[]
}

export interface HistoryDto {
  day: string
  completions: { title: string; emoji: string; ts: number }[]
  moods: { value: number; note: string | null; ts: number }[]
  reflections: { id: number; title: string; snippet: string; valence: number | null; ts: number }[]
  activities: { kind: string; ref_id: string | null; energy: number; ts: number }[]
  walk: { completed: number; started_ts: number; ends_ts: number; location_id: string } | null
}

export interface AppSettings {
  notifications: { morning: boolean; midday: boolean; evening: boolean; bedtime: boolean; streak: boolean; walk: boolean; mail: boolean; social: boolean }
  quizzes: boolean
  seasonal: boolean
  celebration: 'cheers' | 'reflect'
  mutedTags: string[]
}
export interface SettingsDto {
  userName: string; petName: string; petPronouns: 'he' | 'she' | 'they'
  wakeMin: number; sleepMin: number; tz: string
  pausedUntil: string | null; plus: boolean
  settings: AppSettings
}

export interface PapersDto {
  plus: boolean
  live: {
    id: string; kind: string; title: string; day: string
    stats: {
      checkinsThisWeek: number; checkinsLastWeek: number; checkinsTwoWeeksAgo: number
      goalsThisWeek: number; reflectionsThisWeek: number
      moodByDay: Record<string, number>; monday: string
    }
  }
  archive: { id: number; title: string; body: string; data: string; ts: number; read: number }[]
}
