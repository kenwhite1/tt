// Every tunable game constant, mirrored from SPEC.md §4 (sources: research/finch/*).
export type Stage = 'baby' | 'toddler' | 'child' | 'teen' | 'adult'

export const C = {
  GOAL_ENERGY: 5,
  GOAL_STONES: 3,
  GOAL_ENERGY_LOW_MOOD: 7,
  GOAL_STONES_LOW_MOOD: 4,
  GOAL_MAX_PER_DAY: 100,

  ENERGY_BAR: { baby: 15, toddler: 20, child: 25, teen: 30, adult: 35 } as Record<Stage, number>,
  STAGE_AT_WALKS: { toddler: 7, child: 22, teen: 42, adult: 67 },
  WALK_HOURS: { baby: 8, toddler: 6.5, child: 6, teen: 6, adult: 6 } as Record<Stage, number>,
  WALK_MINUTES_PER_ENERGY: 2,
  WALK_BASE_STONES: 10,

  DAY_RESET_OFFSET_MIN: 120, // day flips at wake-up − 2h

  FRIENDSHIP_PTS: [1, 2, 4, 8, 15, 30, 80, 165, 340, 730],
  FRIENDSHIP_WALK_BONUS: [2, 4, 6, 8, 10, 14, 22, 35, 50, 75],
  FRIENDSHIP_LEVEL_STONES: 100,
  PATS_PER_POINT: 15,

  DAILY_QUEST_STONES: 25,
  DAILY_QUESTS_PER_DAY: 3,
  SPECIAL_QUEST_STONES: 100,
  WEEKLY_MILESTONES: [
    { days: 2, stones: 20 },
    { days: 4, stones: 50 },
    { days: 6, stones: 100 },
  ],

  STREAK_REPAIR_PER_WALKS: 3,
  STREAK_REPAIR_MAX: 2,
  STREAK_REPAIR_STONES: 150,
  PAUSE_MIN_DAYS: 1,
  PAUSE_MAX_DAYS: 7,
  PAUSE_DEFAULT_DAYS: 3,

  SHOP_SLOTS: 12,
  SHOP_SLOTS_FREE: 6,
  SHOP_REFRESH_COSTS: [0, 10, 35, 60, 85, 110, 135, 160],
  SHOP_DAILY_GIFT_MIN: 65,
  SHOP_DAILY_GIFT_MAX: 80,
  SELLBACK_RATIO: 0.5,

  TRAVEL_CHOICES_FREE: 3,
  TRAVEL_CHOICES_PLUS: 9,
  FLIGHT_COST: 300,
  FLIGHT_HOME_COST: 200,

  GIFT_FEE: 200,
  GIFTS_PER_FRIEND_PER_DAY: 1,
  VIBE_FIRST_ENERGY: 3,
  VIBE_FIRST_STONES: 2,
  VIBE_NUDGE_DAYS: 3,
  FRIEND_VISIT_MINUTES: 60,
  FRIENDS_PER_PAGE: 8,

  EGG_HATCH_COMPLETIONS: 7,
  MICROPET_ADULT_WALKS: 15,
  MICROPETS_IN_PLAYLAND: 10,

  LOCATION_PROGRESS_PER_WALK: 2,
  FOREST_PROGRESS_PER_WALK: 1.5,

  EVENT_UNLOCK_AFTER_DAYS: 3,
  EVENT_MICROPET_DAY_FREE: 25,
  EVENT_MICROPET_DAY_PLUS: 20,
  EVENT_CLAIM_WINDOW_DAYS: 14,
  EVENT_CHEST_BLACK_STONES_PCT: 12,

  CHALLENGE_GOALS: 14,
  CHALLENGE_JOIN_BY_DAY: 16,

  REFERRAL_WINDOW_HOURS: 48,
  REFERRAL_MAX_REWARDS: 3,

  MOOD_LOW_MAX: 2, // 1..5 scale; ≤2 = low-mood day
  SAVED_COMBOS_FREE: 2,

  // Finch prices halved → Telegram Stars: month $9.99/2≈$5→400★, year $69.99/2≈$35→2700★.
  PLUS_MONTH_STARS: 400,
  PLUS_YEAR_STARS: 2700,
} as const

export function stageForWalks(walks: number): Stage {
  if (walks >= C.STAGE_AT_WALKS.adult) return 'adult'
  if (walks >= C.STAGE_AT_WALKS.teen) return 'teen'
  if (walks >= C.STAGE_AT_WALKS.child) return 'child'
  if (walks >= C.STAGE_AT_WALKS.toddler) return 'toddler'
  return 'baby'
}

export function friendshipLevel(pts: number): number {
  let lvl = 0
  for (let i = 0; i < C.FRIENDSHIP_PTS.length; i++) if (pts >= C.FRIENDSHIP_PTS[i]) lvl = i + 1
  return Math.max(1, lvl)
}
