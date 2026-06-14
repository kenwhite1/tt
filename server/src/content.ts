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
  stories: load<{ generic: { id: string; ru_text: string; replies: { ru: string; dim: string }[]; discovery_id: string | null }[]; discoveries: unknown[] }>('stories.json'),
  botCopy: load<Record<string, string[] | string>>('bot_copy.json'),
}

// Build the starter plan. With no survey areas it's the classic fixed plan; given the
// self-care areas the user picked in onboarding, it's tailored: a gentle universal base
// plus one easy win per requested area (deduped, capped).
export function starterGoals(areas?: string[]): ContentGoal[] {
  const byId = new Map(content.goals.goals.map(g => [g.id, g]))
  const out: ContentGoal[] = []
  const seen = new Set<string>()
  const push = (g?: ContentGoal) => { if (g && !seen.has(g.id)) { seen.add(g.id); out.push(g) } }

  if (!areas || areas.length === 0) {
    for (const id of content.goals.starter_goal_ids) push(byId.get(id))
    return out
  }

  // gentle base everyone starts with, then one fresh easy win per chosen area
  for (const id of ['ew_glass_of_water', 'ew_three_breaths']) push(byId.get(id))
  const ew = content.goals.goals.filter(g => g.category === 'easy_wins')
  for (const sca of areas) {
    push(ew.find(g => g.sca === sca && !seen.has(g.id))
      ?? content.goals.goals.find(g => g.sca === sca && !seen.has(g.id)))
  }
  // top up from the classic plan if the user picked very few areas
  for (const id of content.goals.starter_goal_ids) { if (out.length >= 4) break; push(byId.get(id)) }
  return out.slice(0, 7)
}

export function randomStory() {
  const list = content.stories.generic
  return list[Math.floor(Math.random() * list.length)]
}
