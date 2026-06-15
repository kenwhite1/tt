# HANDOFF — finish the «Шарик» logo

Instructions for the next Claude. You're picking this up cold; everything you need is here.

## TL;DR
- Project = **«Шарик»**, a Telegram Mini App: a 1:1 clone of the Finch self-care app, in
  **Russian**, with an original **golden-puppy** mascot. It is fully built, deployed, and live.
- **Your job:** design and wire the app **logo / icon** (an original puppy-mascot logo +
  wordmark), use it on the loading splash + as a favicon, provide a clean icon for BotFather,
  then deploy.
- **Hard rule:** ORIGINAL artwork only. Do NOT copy Finch's logo or asset files. Match the cozy
  *style*, never their specific artwork. (The owner asked for Finch's assets; the prior Claude
  declined and you should too — build original.)

## Where everything lives
- Working dir: `/Users/c/Desktop/game is game inc/tt`
- Git: private repo `github.com/bobthescienceskeleton-del/druzhok`, branch `main`. Git auth goes
  through the `gh` CLI (active account `bobthescienceskeleton-del`). Commit + push when done.
- Deployed on **Railway**, service name **`druzhok`**. Live: https://druzhok-production.up.railway.app
- Bot: **@sharikrubot** (token lives in Railway env vars, never in the repo). Railway CLI is
  already logged in (account kenwhiteprivate@gmail.com).
- Monetization («Шарик Плюс») is built but DORMANT (`PLUS_ENFORCED` unset). Don't touch it.

## Build / preview / deploy — read this, it has real gotchas
Monorepo: `server/` (Node + Hono + better-sqlite3 + grammY) and `app/` (Vite + React + TS);
shared numbers in `shared/constants.ts`; RU content in `server/content/*.json`.

- **Typecheck:** `cd app && npx tsc --noEmit` and `cd server && npx tsc --noEmit` (both must be 0).
- **Build the SPA:** from repo root, `npm run build` → outputs `app/dist`.
- **Local preview:** from repo root, `npm start` serves the API + built app on `:3000` in
  **DEV MODE** (no BOT_TOKEN → Telegram auth is stubbed to a single user id 1). To see the Home
  screen you must onboard that user once (snippet at the bottom), then open `localhost:3000`.
  Prefer the `mcp__Claude_Preview__*` tools (preview_start uses `.claude/launch.json` → name
  `druzhok`; preview_eval `window.location.reload()`, preview_screenshot, etc.).
- **DEPLOY (critical):** `railway up --ci -s druzhok` from the repo root. This uploads the
  *current local files* and rebuilds.
  - ⚠️ Do **NOT** use `railway redeploy` for code changes — it re-runs the existing image and
    does **not** pull new code. Pushing to GitHub does NOT auto-deploy either (the service
    deploys from `railway up`, not the GitHub repo). Always `railway up`.
  - After it says "Deploy complete", poll `https://druzhok-production.up.railway.app/api/health`
    until it returns `{"ok":true}`.
  - Railway occasionally returns a transient `backboard.railway.com ... operation timed out`
    error during `railway up`. If so, just **run `railway up --ci -s druzhok` again** — it's
    flaky, not a real failure. (Health-200 alone can be the *old* build still serving, so always
    confirm the retry's "Deploy complete".)
- Telegram caches the webview: to see changes on a phone, **fully close and reopen the bot**.

## What "the logo" means right now
Current state:
- The **bot profile picture** in BotFather is a raster image the owner supplied (a rendered
  golden puppy hugging a heart). That's only the bot avatar.
- In-app, the mascot is an **original SVG**: `app/src/art/Puppy.tsx` (recently redrawn cuter —
  long floppy ears, big glossy eyes, soft snout; has growth stages + dye tints + outfit slots +
  SMIL animations). Reuse the head from this for the logo so they're consistent.
- The **loading screen** (`app/src/App.tsx`, `phase === 'loading'`) currently shows a bouncing
  `<Puppy state="happy"/>` + the text «Шарик просыпается…».
- There is **no logo/wordmark component and no favicon**. `app/index.html` has
  `<title>Шарик</title>` but no `<link rel="icon">`.

## What to build (original art only)
1. **`app/src/art/Logo.tsx`** — a logo lockup component: the cute puppy head (adapt the head
   group out of `Puppy.tsx`) above or beside the **wordmark «Шарик»** set in the app font
   (Nunito, weight 800). Use the warm palette from `app/src/theme.css` CSS vars: `--bg` cream
   `#f3e2bc`, `--accent` `#f2a93b`, `--accent-deep`, `--brown-deep` `#6f4322`, `--gold`. Offer a
   `size` prop and maybe a `variant` ('full' lockup vs 'mark' = head only).
2. **Loading screen:** replace the bare bouncing puppy in `app/src/App.tsx` with `<Logo>` (keep
   the `.puppy-bob` bounce + the «…просыпается» line, or fold it into the logo).
3. **Favicon:** create `app/public/icon.svg` (the puppy "mark" on a soft rounded cream/gold tile)
   and reference it in `app/index.html`: `<link rel="icon" type="image/svg+xml" href="/icon.svg" />`.
   Vite serves `app/public/*` at the site root.
4. **Telegram Mini App icon for BotFather:** BotFather's `/newapp` wants a raster (~640×360
   banner) and a square profile pic, which you can't generate here. So: produce a clean **SVG**
   icon/banner (`app/public/logo-card.svg`) and, in your final summary to the owner, give them
   two options — (a) screenshot/export that SVG to PNG and upload it in BotFather, or (b) keep
   their existing rendered puppy image. **Do not block** on raster generation.

Keep the puppy on-brand: same cute redraw (floppy ears, big eyes, soft snout, golden body
`#F3BA5E` with the purple collar `#8E6FC0`).

## Verify + ship checklist
1. `cd app && npx tsc --noEmit` → 0; `cd server && npx tsc --noEmit` → 0.
2. `npm run build` → OK.
3. Preview locally: confirm the new loading screen renders, the favicon shows in the browser tab,
   no console errors (`preview_console_logs` level error).
4. `git add -A && git commit -m "Logo: wordmark + mark, loading splash, favicon" && git push`.
5. `railway up --ci -s druzhok`; poll `/api/health`; retry once if the backboard timeout hits.
6. Tell the owner to reopen the bot, and hand them the BotFather icon instructions from step 4.

## Local-preview onboarding snippet (dev mode, after `npm start`)
```bash
T=$(curl -s -X POST localhost:3000/api/auth -H 'content-type: application/json' -d '{"initData":""}' \
  | node -e "let b='';process.stdin.on('data',d=>b+=d).on('end',()=>console.log(JSON.parse(b).token))")
curl -s -X POST localhost:3000/api/onboard -H "authorization: Bearer $T" -H 'content-type: application/json' \
  -d '{"petName":"Тоша","pronouns":"he","color":"orange","trait":"curiosity","userName":"Кен"}'
# then open localhost:3000 (or preview_start + reload)
```

## Orientation files
- `SPEC.md` — full feature spec (mechanics, screens, gating).
- `docs/ARCHITECTURE.md` — module map + build conventions.
- `docs/BOTFATHER.md` — bot/Mini App setup (extend it with the new icon steps).
- `app/src/art/Puppy.tsx` — the mascot SVG to reuse for the logo.
- `app/src/theme.css` — palette + animation keyframes.
- `app/src/App.tsx` — loading screen to update.
- `app/index.html` — add the favicon link here.

## Style notes for a 10/10 logo
- Soft, rounded, chunky — the Finch-mascot *feel*, original execution.
- The mark should read at 32px (favicon) AND large (splash): keep the head simple, high-contrast
  eyes, clear floppy-ear silhouette; avoid fine detail that muddies when tiny.
- Wordmark «Шарик»: Nunito 800, `--brown-deep` on cream, generous letter-spacing; maybe a tiny
  paw or heart accent. Keep it legible and warm.
