# Druzhok — Finch-parity audit + co-op/viral build (2026-06-15)

## Part 1 — Finch-parity audit (verdict per subsystem)

Method: 9 parallel auditors compared each subsystem to its `research/finch/*.md` ground truth and
traced the actual logic. Headline: **mechanics are sound and faithful; the gap is content depth for
week-2+, plus a handful of real bugs.**

| Subsystem | Verdict | Notes |
|---|---|---|
| Economy (shop/items/dyes/rooms/gifting) | **matches** | 220 clothing, 180 furniture, 235 dyes — solid. No bugs. |
| Micropets / pet stages / eggs | mostly | 62 species, correct growth/hatch. Natures cosmetic (intentional). |
| Walks / travel / discoveries | mostly | 27 locations, 60 stories, 120 discoveries. Healthy ~2mo, but stories are **global, not location-specific**; no seasonal. |
| Core loop (goals/energy/streak) | mostly | Day-reset correct. See bugs below. |
| Quests / progression | mostly | Daily pool was thin (now expanded); only 2 challenges, no monthly rotation. |
| Social / vibes / referrals | mostly | Correct rewards/gating. `vibe_received` was thin (now 14). |
| Events / Plus / payments | mostly | 1:1 event calendar. Chest reveal race condition; Star price drift. |
| Self-care activities | mostly | Deep content (62 prompts, 10 breathing…). See blocker bug. |
| Reminders / bot | mostly | 6 kinds, deduped. Pools were thin (now expanded). |

### Real bugs found in EXISTING code (flagged — NOT auto-changed, since several touch economy/business logic)
1. **[economy] Reflections pay BOTH energy AND stones** — `server/src/routes/activities.ts:~241-246`.
   Finch reflections are energy-only. Either a genuine over-pay bug or an intentional generosity
   choice — **owner call**. One-line fix: drop the `addStones(...)` in the reflect handler.
2. **[events] Chest reveal race** — `app/src/screens/events/EventCalendar.tsx:~125`. A 900ms
   `setTimeout` can fire after the modal already advanced on fast networks → jank. Fix: clear the
   timeout on response.
3. **[pricing] Star price drift** — `shared/constants.ts` has `299/1999`; a prior note said `400/2700`
   was deployed. Reconcile to the intended price (business decision).
4. **[reminders] Newsletter fires every Monday** regardless of activity (Finch gates on 3-day
   inactivity). Minor.

Fixed in this build (display-only, safe): the Home goal-reward chip showed a hardcoded `5⚡` even on
low-mood days (real reward 7⚡) — now reflects the actual value.

> Note: the "Goal-of-the-Day bonus is per-completion not per-tap" item the auditor flagged is **not a
> bug** — `completeGoal` runs once per tap, so the bonus already rolls per tap.

## Part 2 — What shipped this session (all additive; server+app typecheck clean, migrations apply, app builds)

**Foundation:** migrations `006_coop` / `007_viral` / `008_safety` (new tables + `ADD COLUMN` only,
002 etc. untouched); constants block; shared DTOs; Telegram `shareToStory`/`shareMessage` bridges;
server `logEvent`/`logFirst` analytics helper; `/cards/*` static hosting.

**«Содружок» / co-op puppy (flagship):** `routes/coop.ts` (create/accept/list/walk-start/walk-claim/
pet/rename-handshake/pause/leave/invite), derived shared bar (no stored energy), co-op walk pays both,
co-op streak, bonded micropet on stage-up, referral attribution on accept, bot `coop_` deep-link,
`jobs.ts` co-op nudge. Client: `CoopSection` (cards + split bar + walk + adopt flow + detail + share),
auto-accept on `startapp=coop_…`.

**Viral features:** (1) **Share cards** — client canvas renderer + `ShareSheet` + `routes/share.ts`
(host PNG, once-per-milestone reward, prepared-inline-message), wired to co-op + daily dig. (2)
**«Косточка дня»** daily dig — `routes/daily.ts` (deterministic, 1/day) + Home card + share + friends'
digs. (3) **Giftable streak-freeze** — `/social/gift-freeze`, claim banks a repair (over-cap), at-risk
surfacing in FriendPage + DM. (4) **«Лучик от друга»** compliments — `/social/compliment` (preset-only,
anonymous-within-friends, minor-gated), weekly appreciation, FriendPage picker. (5A) sticker pack →
`docs/STICKERS-PUPPY.md`. (5B) collectibles → schema + constants ready (route/UI intentionally deferred,
per spec "later"). (6) **«Вечерний сбор»** — `routes/evening.ts` + opt-in jobs reminder + `EveningCard`.

**Safety:** `reports` table + `/social/report` (preset reasons) + report in FriendPage menu; deliberate
minor stance (`users.minor` from the onboarding age answer → anonymous forced to attributed, external
"send to a non-user" disabled for under-18s).

**Analytics funnel:** server-side `walk_start/first_walk`, `coop_*`, `daily_dig/first_dig`,
`share_card/first_share`, `compliment*`, `gift_freeze`, `report`, `first_invite_accepted` — on top of
the existing `events` table + `/api/events/summary`.

**Perf:** onboarding now preloads all mascot webps during the welcome beat (was the "second too long").

**Content cook (safe, validated):** daily-quest pool 16→30, affirmations 30→54, `vibe_received` 5→14,
`mail` 10, evening reminder copy; + 3 new content libraries (`coop_content`, `daily_pool`,
`compliments`). All data-only JSON a non-coder can extend.

## Part 3 — Highest-ROI content backlog (structural; left for a deliberate pass to avoid risking core files)
1. **Location-specific walk stories + location-tied discoveries** (biggest week-2 depth lever) — today
   all 60 stories are global and every discovery has `location_id: null`.
2. **Monthly challenge rotation** — only 2 static challenges; add a seasonal set + rotation.
3. **Seasonal events beyond `summer_yard`** — one event today; add autumn/winter/spring.
4. Newsletter persona variants; more reminder seasonal variants.
