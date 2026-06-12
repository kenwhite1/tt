# Druzhok — module architecture & build conventions

Telegram Mini App: Russian self-care Tamagotchi (golden puppy), 1:1 Finch mechanics.
Monorepo: `server/` (Hono + better-sqlite3 + grammY, tsx runtime), `app/` (Vite + React + TS),
`shared/` (constants + DTO types), `server/content/*.json` (the entire RU content library).

## Read these before writing code
- `SPEC.md` — §3 screen map, §4 mechanics constants, §5 Plus gating, §6 Telegram notes
- `shared/constants.ts` — ALL numbers come from here, never inline magic numbers
- `server/src/engine/core.ts`, `server/src/api.ts` — server patterns
- `app/src/store.ts`, `app/src/screens/Home.tsx`, `app/src/theme.css` — client patterns
- `research/finch/<your-area>.md` — exact mechanics for your module
- your module's `server/content/*.json` — real data shapes (parse with `JSON.parse(readFileSync(...))`, type locally with `as`)

## Hard rules
1. Edit ONLY the files your module owns (table below). Shared files are pre-wired — if
   something seems missing there, work around it inside your own files.
2. NEVER: run git commands, npm install, create migrations, or edit
   `server/src/migrations/*`, `server/src/db.ts`, `server/src/api.ts`, `server/src/auth.ts`,
   `server/src/engine/*`, `server/src/content.ts`, `app/src/App.tsx`, `app/src/store.ts`,
   `app/src/api.ts`, `app/src/main.tsx`, `app/src/theme.css`, `shared/*`, anyone else's module dirs.
3. The DB schema is FIXED (`002_world.sql`). Design within it; JSON columns are your
   flexibility valve.
4. All user-visible text: Russian, warm, на «ты». All rewards/costs from `shared/constants.ts`.
5. Derive cross-module state lazily by querying tables (e.g. daily-quest "complete_goal" =
   `EXISTS(goal_completions today)`), never by hooking other modules' code.
6. Typecheck your work: `cd server && npx tsc --noEmit` / `cd app && npx tsc --noEmit`.
   Fix YOUR errors; ignore others' modules.

## Server pattern
Each module: `server/src/routes/<module>.ts` exporting `export const <module>Routes = new Hono<Env>()`
(`Env` from `../env`). Mounted in api.ts under `/api/<module>/*` AFTER auth middleware —
`c.get('user')` gives a UserRow (possibly stale; call `ensureFresh(c.get('user'))` from
`../engine/day` before mutating; re-read fresh rows for responses). Money: use `addStones()`
from `../engine/core`. Plus gate: `hasPlus(user)` — implement locally as
`!!user.plus_until && user.plus_until >= user.last_day` BUT always honor
`process.env.PLUS_ENFORCED !== '1'` → treat everyone as Plus (dormant paywall).

## Client pattern
`req` helper from `app/src/api.ts` (`req<T>(path, body?)` — POST if body given, auth header
automatic). Refresh global state after mutations that touch stones/energy/goals:
`useStore.getState().refresh()`. Sub-navigation INSIDE your tab component via local
`useState` — no router. Styling: classes from theme.css (`card`, `btn`, `goal-row`,
`energy-track`...) + inline styles; palette via CSS vars. Haptics: `haptic()` from
`../telegram` on rewards/taps. Currency display: 🦴; energy: ⚡.

## File ownership
| Module | Server (routes/) | App (screens/) | Also owns |
|---|---|---|---|
| activities | activities.ts | menu/ (Menu.tsx + sub-screens: activities hub, breathing, reflections, timers, grounding, movements, quizzes, emotions, first-aid, insights, history, settings) | — |
| quests | quests.ts | quests/ + rewrite Quests.tsx | — |
| economy | shop.ts | shop/ + rewrite Shop.tsx, bag/ + rewrite Bag.tsx (import MicropetsSection from ../micropets/) | — |
| travel | travel.ts | travel/ (WalkChat.tsx pre-stubbed, travel agency UI, locations logbook, discoveries) | — |
| micropets | micropets.ts | micropets/ (MicropetsSection.tsx pre-stubbed: playland+lab+micropedia) + rewrite Pet.tsx | — |
| social | social.ts | friends/ + rewrite Friends.tsx | — |
| events | events.ts, payments.ts | events/ (EventCalendar.tsx pre-stubbed), plus/ (PlusScreen.tsx pre-stubbed) | — |
| reminders | — | — | server/src/jobs.ts, server/src/bot.ts |
| art | — | — | app/src/art/* (Puppy stages, Micropet.tsx, LocationScene.tsx, NPCs, items) |

## Key engine facts
- Game day = string `YYYY-MM-DD`, flips at wake−2h. `user.last_day` is today after `ensureFresh`.
- Week key for weekly milestones: ISO week of the game day, format `YYYY-Www`.
- `walks` table: one row per day max; `completed` set lazily on state read; `story_id`,
  `chat_done`, `discovery_id` are for the post-walk chat (assign lazily on chat open).
- `items_owned` uniqueness: (user_id, kind, item_id, color_id). Sell-back = floor(price/2).
- Shop rotation: deterministic per (user, shop, day, refresh#) — seed a PRNG with a hash.
- One soft currency (stones = косточки). No paid randomness ever.
