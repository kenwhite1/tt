# Дружок 🐶 — self-care pet, a Telegram Mini App

A cozy self-care Tamagotchi: a golden puppy that grows as you complete gentle self-care
goals (drink water, breathe, journal, go outside). Anti-hustle, streaks, collection, friends.
Russian-first. Built as a 1:1 mechanics clone of Finch, original art and copy throughout.

## Stack
- **Server** — Node 22, Hono, better-sqlite3, grammY (bot + Telegram Stars), node-cron
  (reminder DMs). One process serves the API, the bot webhook, and the built mini app.
- **App** — Vite + React + TS, Telegram WebApp SDK. Portrait, fullscreen, safe-area aware.
- **Shared** — `shared/constants.ts` holds every tunable game number (one source of truth).
- **Content** — `server/content/*.json`: the whole RU library (goals, reflections, exercises,
  quizzes, emotions, quests, challenges, 62 micropets, 27 locations, items, stories, bot copy).

## Local dev
```bash
npm install
npm run dev:server     # :3000  (DEV MODE without BOT_TOKEN — auth stubbed to one user)
npm run dev:app        # :5173  (proxies /api → :3000)
```
Open http://localhost:5173. Typecheck everything: `npm run typecheck`.

## Deploy to Railway (production)
1. **Create the bot** — in Telegram open [@BotFather](https://t.me/BotFather), send
   `/newbot`, pick a name + username, copy the token. (See `docs/BOTFATHER.md` for the full
   click-by-click, including Mini App setup and menu button.)
2. **Railway** — New Project → Deploy from GitHub repo → pick this repo.
   - Add a **Volume** mounted at `/data`.
   - Set **Variables** (see `.env.example`): `BOT_TOKEN`, `APP_URL` (the Railway domain),
     `BOT_USERNAME`, `WEBHOOK_SECRET`, `JWT_SECRET`, `DATA_DIR=/data`. Leave `PLUS_ENFORCED`
     unset to keep the paywall dormant.
   - Railway builds (`npm install && npm run build`) and starts (`npm start`). On boot the
     server registers the Telegram webhook at `APP_URL` automatically.
3. **Tell BotFather the Mini App URL** = your `APP_URL` (so the bot's menu button opens it).
4. Open the bot, tap **Открыть Дружка** — done.

## Monetization
«Дружок Плюс» (Telegram Stars: 30-day subscription + 365-day SKU) is fully built but
**dormant** — `PLUS_ENFORCED` unset means everything is unlocked and the paywall shows
"всё бесплатно". Flip `PLUS_ENFORCED=1` to enforce gating and activate Stars. No paid
randomness anywhere (Telegram-ToS-safe).

## Layout
```
shared/      constants + DTO types
server/src/  db, migrations, auth, engine/ (day-cycle, core loop), routes/ (8 modules),
             bot.ts, jobs.ts (reminder cron), content.ts
server/content/  the RU content library (JSON)
app/src/     screens/ (6 tabs + menu + sub-flows), art/ (SVG puppy, micropets, scenes),
             store.ts, api.ts, telegram.ts, theme.css
docs/        ARCHITECTURE.md (module map), BOTFATHER.md (bot setup)
```
