// Loads the RU content library (server/content/*.json) once at boot.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content')
const load = <T>(name: string): T => JSON.parse(readFileSync(join(dir, name), 'utf8')) as T

export interface ContentGoal { id: string; ru: string; emoji: string; category: string; sca: string | null }
export interface Sca { id: string; ru: string; emoji: string; color: string }

export const content = {
  goals: load<{ scas: Sca[]; goals: ContentGoal[]; starter_goal_ids: string[] }>('goals.json'),
  reflections: load<{ prompts: unknown[] }>('reflections.json'),
  exercises: load<Record<string, unknown>>('exercises.json'),
  emotions: load<Record<string, unknown>>('emotions.json'),
  quizzes: load<Record<string, unknown>>('quizzes.json'),
  quests: load<{ daily_pool: { id: string; ru: string; type: string; deeplink: string; check: string }[]; special_tracks: unknown[]; affirmations: string[] }>('quests.json'),
  challenges: load<Record<string, unknown>>('challenges.json'),
  micropets: load<{ natures: string[]; species: { id: string; ru_name: string; origin: string }[] }>('micropets.json'),
  locations: load<{ locations: { id: string; ru_name: string; progress_per_walk: number }[] }>('locations.json'),
  clothing: load<Record<string, unknown>>('items_clothing.json'),
  furniture: load<Record<string, unknown>>('items_furniture.json'),
  stories: load<{ generic: { id: string; ru_text: string; replies: { ru: string; dim: string }[]; discovery_id: string | null; location_id?: string | null }[]; discoveries: unknown[] }>('stories.json'),
  botCopy: load<Record<string, string[] | string>>('bot_copy.json'),
}

// Build the starter plan. With no survey areas it's the classic fixed plan; otherwise
// the plan is built FROM the self-care areas the user picked (plus the ones inferred from
// their survey answers), so different answers genuinely produce different daily activities.
export function starterGoals(areas?: string[]): ContentGoal[] {
  const byId = new Map(content.goals.goals.map(g => [g.id, g]))
  const out: ContentGoal[] = []
  const seen = new Set<string>()
  const push = (g?: ContentGoal) => { if (g && !seen.has(g.id)) { seen.add(g.id); out.push(g) } }

  const chosen = (areas ?? []).filter(Boolean)
  if (chosen.length === 0) {
    for (const id of content.goals.starter_goal_ids) push(byId.get(id))
    return out
  }

  // One gentle universal anchor, then several goals drawn from the chosen areas.
  // Fewer areas → more goals each, so a focused answer still yields a full, on-point plan.
  push(byId.get('ew_glass_of_water'))
  const ew = content.goals.goals.filter(g => g.category === 'easy_wins')
  const perArea = chosen.length === 1 ? 3 : chosen.length === 2 ? 2 : 1
  for (const sca of chosen) {
    // easy wins first (gentlest), then any other goal for the area
    const pool = [...ew.filter(g => g.sca === sca), ...content.goals.goals.filter(g => g.sca === sca && g.category !== 'easy_wins')]
    let added = 0
    for (const g of pool) {
      if (added >= perArea) break
      if (!seen.has(g.id)) { push(g); added++ }
    }
  }
  // never leave the plan thin
  for (const id of content.goals.starter_goal_ids) { if (out.length >= 4) break; push(byId.get(id)) }
  return out.slice(0, 7)
}

export function randomStory() {
  const list = content.stories.generic
  return list[Math.floor(Math.random() * list.length)]
}
