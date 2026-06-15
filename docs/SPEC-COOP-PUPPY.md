# SPEC — «Общий щенок» (co-op puppy): shared-stakes, no-punishment

Add-on to `SPEC.md`. Working brand name: **«Содружок»** (со- + Дружок). Plain UI descriptor:
**«Общий щенок»**; on cards **«Наш щенок»**.

## 0. Why this exists
Competitor teardown finding: the only genuinely *viral* mechanics in the category —
Forest "Plant Together", Habitica party boss-battles, SleepTown circles — are all
**interdependent co-op**: my progress depends on whether *you* show up. Our current social
layer (vibes, gifts, shared-goal streaks) is **parallel** — we each have our own thing and
just watch each other. Interdependence is what actually makes someone recruit a *specific*
friend and keep them active.

This adds the interdependent layer **in the additive-only / no-punishment register the whole
app lives in** (cf. the "puppy never dies" rule). It is the warm version of Habitica: showing
up together *unlocks* growth; absence only *withholds* it. Acquisition falls out for free — a
co-op puppy can't be started alone, so every one drags in a friend (and a brand-new opener
flows through the existing referral ladder).

## 1. Locked design decisions
| Decision | Value |
|---|---|
| Entity | A second, **shared** puppy co-raised by 2 users (pair-first; schema allows ≤4 for a later «семья» mode) |
| Stakes | Interdependent — grows only when **both** contribute that day |
| Punishment | **NONE.** Never regresses, never "dies", never touches personal streak/energy/pet. Absence = only the absence of growth + a warm nudge |
| Cap | ≤ `COOP_MAX_ACTIVE` (3) active bonds per user |
| Entry | Invite an existing friend **or** share a `startapp` link (new user → also counts as a referral) |
| Naming | Co-named: founder proposes egg colour + name, partner confirms/rerolls at co-hatch |
| Reset | Each member's daily contribution keyed to **their own** game-day (wake−2h); shared bar is **derived**, never stored |
| Reward | Co-op walk pays **both** members 🦴 + mutual friendship pts; the growing puppy is the shared trophy |
| Money | Reuses 🦴; **no new paid anything**; works fully free at launch (Plus-agnostic) |

## 2. Naming (RU, warm, на «ты»)
| Concept | RU |
|---|---|
| Feature / bond | «Содружок» (общий щенок) |
| Card title | «Наш щенок» |
| Adopt together | «Завести общего щенка» |
| Shared fill | «вместе покормили» / split bar |
| Co-op walk | «Совместная прогулка» → кнопка «Гулять вместе» |
| Halves | «Твой вклад» / «Вклад друга» |
| Waiting | «[Имя] ждёт, пока вы соберётесь вдвоём» |

## 3. Data model — new migration `003_coop.sql` (002 stays frozen)
```sql
CREATE TABLE coop_pets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  pronouns      TEXT NOT NULL DEFAULT 'they',
  color         TEXT NOT NULL DEFAULT 'golden',
  dyes          TEXT NOT NULL DEFAULT '{}',          -- {part: colorId}, reuse Puppy rig
  walks         INTEGER NOT NULL DEFAULT 0,          -- → stage via stageForWalks()
  status        TEXT NOT NULL DEFAULT 'pending',     -- pending|active|dormant
  walk_day      TEXT, walk_started_ts INTEGER, walk_ends_ts INTEGER,
  walk_completed INTEGER NOT NULL DEFAULT 0, walk_story_id TEXT,
  created_at    TEXT NOT NULL
);
CREATE TABLE coop_members (
  coop_id          INTEGER NOT NULL REFERENCES coop_pets(id),
  user_id          INTEGER NOT NULL REFERENCES users(id),
  role             TEXT NOT NULL DEFAULT 'member',   -- founder|member
  last_contrib_day TEXT,                             -- that member's game-day of last fill
  joined_ts        INTEGER NOT NULL,
  PRIMARY KEY (coop_id, user_id)
);
CREATE INDEX idx_coop_member_user ON coop_members(user_id);
CREATE TABLE coop_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coop_id INTEGER NOT NULL REFERENCES coop_pets(id),
  from_id INTEGER NOT NULL, to_id INTEGER,           -- to_id NULL = open link invite
  code TEXT, status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|expired
  ts INTEGER NOT NULL
);
CREATE TABLE coop_walks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coop_id INTEGER NOT NULL, day TEXT NOT NULL,
  started_ts INTEGER NOT NULL, ends_ts INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0, story_id TEXT, discovery_id TEXT
);
CREATE INDEX idx_coop_walks ON coop_walks(coop_id, day);
```
**Deliberately no `energy` column.** The shared bar is *derived* (see §4), so it can never drift
out of sync with the source of truth — each member's `goal_completions`. This honours
ARCHITECTURE rule #5 (derive cross-module state lazily; don't hook other modules).

## 4. Core loop — derived, no cron, no module hooks
`today(u)` = a member's current game-day (wake−2h) = `user.last_day` after `ensureFresh`.

```
contrib(member) = MIN(
  COOP_CONTRIB_PER_MEMBER,
  COUNT(*) FROM goal_completions WHERE user_id = member.user_id AND day = today(member)
)
bar      = Σ contrib(member)                       -- derived each read
barFull  = COOP_CONTRIB_PER_MEMBER × memberCount   -- = COOP_ENERGY_BAR
```
The bar fills **only if both** members complete ≥ `COOP_CONTRIB_PER_MEMBER` goals **in their own
day**. One person can't solo-fill it — that single clamp *is* the shared-stakes mechanism, and it
rides the signal users already emit (goal completions), so there's nothing new to log and no
write into the goals route.

**Co-op walk:**
- Available when `bar == barFull` **and** no `coop_walks` row for `(coop_id, day)` (1/day).
- Either member taps «Гулять вместе» → insert `coop_walks`, duration = `WALK_HOURS[stage]`
  (reuse), runs real-time server-side (continues while app closed, exactly like personal walks).
- Completion (lazy on read, like personal walks): `coop_pets.walks += 1` (→ shared stage via
  existing `stageForWalks`), assign a co-op story/discovery, and pay **each** member
  `+COOP_WALK_STONES 🦴` (`addStones`) and `+FRIENDSHIP_WALK_BONUS[level]` to the pair's
  `friendships.pts` (**both** directional rows). Haptic + shared "мы подросли" toast.

**Day flips for free:** because `contrib` keys on each member's own `today`, the bar "resets" at
each member's wake−2h with **zero stored state and zero cron**. The personal day-reset cron
already exists; co-op needs none.

## 5. No-punishment guarantees (non-negotiable)
1. `coop_pets.walks`/stage **never decrease**. Missed days = slower growth, nothing else.
2. **Zero** effect on either member's personal streak, energy, pet, or rewards. Purely additive.
3. The bar can't decay — it's derived; an absent day simply contributes 0.
4. Any "sulk" visual (puppy curls up / «скучает») is **cosmetic only**, no stat behind it.
5. On **Пауза** (`paused_until`) or inactivity ≥ `COOP_DORMANT_DAYS`, status→`dormant` (a soft
   visual); flips back to `active` the moment both contribute again. Dormancy grants/removes
   nothing.
6. The present member is **never blocked or penalised**: their contribution banks, they can
   pet/name/decorate the shared puppy, and the "your friend hasn't shown up yet" line is framed
   as *encouragement to nudge*, never as a loss.

The stake is positive-only — "our puppy grows when we both show up." The sole consequence of
absence is no growth that day plus a warm nudge. (This is the conscious divergence from
Habitica, whose boss *damages* your party for misses: effective, but guilt-driven, which would
break the anti-hustle tone.)

## 6. Virality surfaces (the point)
1. **Acquisition by construction.** A co-op puppy can't start solo. «Завести общего щенка» →
   pick an existing friend **or** share `t.me/<bot>?startapp=coop_<code>`. If the opener is a new
   Telegram user, run them through the existing `pending_referrals → referrals` path so the
   founder also climbs the referral ladder (Корова Печенька). Co-op = a second, stickier
   referral funnel.
2. **Daily two-sided visibility (gentle reciprocity, not guilt).** The «Наш щенок» card shows the
   **split** bar — «Твой вклад 5/5 · Вклад друга 2/5». Each partner literally sees whether the
   other showed up. That transparency drives organic friend-to-friend "эй, покорми нашего
   щенка" pokes — the highest-intent retention message there is, and it comes from a friend, not
   from us.
3. **Milestone story cards (`shareToStory`).** Co-hatch / each stage-up / a 7-day "both showed up"
   streak → one-tap story featuring **both** names + the shared puppy + a join deep-link.
   Co-raised milestones get posted more (two people motivated to share one moment). Also closes
   the share-surface gap flagged in the growth audit.
4. **Re-engagement DM with a social reason.** If one contributes and the partner hasn't by
   `COOP_STREAK_NUDGE_HOUR`, the bot DMs the partner *from the puppy*: «[Друг] уже погулял бы со
   мной 🐾 осталось только ты». Toggleable; respects Пауза; reuses the sharded reminder sender.
5. **Bonded micropet.** Clearing a co-op stage hatches a **co-op-exclusive** micropet variant for
   *both* members — a collectible obtainable only via co-op, pulling users to open more bonds
   (up to the cap).

## 7. Screens (slot into existing «Друзья» / Дворик)
- **Дворик:** a «Наш щенок» card per active bond above the friends grid — shared puppy art
  (reuse Puppy rig + `dyes`), split contribution bar, stage label, «Гулять вместе» (enabled at
  full) or a countdown while walking, drag-to-pat (shared hearts). Tap → detail.
- **Co-op detail:** big scene, both avatars + names, friendship-level strip (reuses
  `friendships.pts`), co-op streak («N дней вместе»), recent co-op discoveries, «Поделиться в
  истории», «Переименовать» (both must agree), «Пауза двора» (mutual).
- **Adopt flow:** «Завести общего щенка» → choose friend / share link → founder picks egg colour
  + proposes name → partner accepts via DM deep-link → co-hatch animation → both land on the card.
- **Hooks into existing UI:** add «…или заведите общего щенка вместе» CTA in `AddFriendSheet` and
  next to the referral banner.

## 8. Constants (append to `shared/constants.ts`)
```ts
COOP_MAX_ACTIVE: 3,            // concurrent bonds per user
COOP_CONTRIB_PER_MEMBER: 5,   // daily goals each must complete to fill their half
COOP_WALK_STONES: 12,         // 🦴 paid to EACH member on co-op walk (≈ half a daily quest)
COOP_DORMANT_DAYS: 10,        // inactivity → cosmetic 'dormant'
COOP_STREAK_NUDGE_HOUR: 19,   // local hour to DM the not-yet-contributed partner
// reuse as-is: STAGE_AT_WALKS, WALK_HOURS, FRIENDSHIP_WALK_BONUS, stageForWalks(), friendshipLevel()
// derived, not stored:  COOP_ENERGY_BAR = COOP_CONTRIB_PER_MEMBER * memberCount
```
**Tuning:** 5/member ≈ a light normal day (your goals are «выпить воды»-tier micro-goals), so it
won't feel like a chore; raise to gate harder, lower for gentler. `COOP_WALK_STONES = 12` ≈
`DAILY_QUEST_STONES`(25)/2 each, so a co-op walk pays out like a shared daily quest — meaningful,
not economy-breaking. All one-line tunable, same as §4 of the main spec.

## 9. Server module — new `routes/coop.ts` (mounted after auth; mirrors module pattern)
```
POST /api/coop/create   { friendId? }  → coop_pets(pending) + founder coop_member + invite (DM/link)
POST /api/coop/accept   { code }        → add member, status→active, co-hatch; referral attribution if new
GET  /api/coop/list                     → per bond: derived bar, my/their contrib, stage, walk state, streak
POST /api/coop/walk/start { coopId }     → guard bar==full & 1/day → insert coop_walks
POST /api/coop/walk/claim { coopId }     → lazy-complete, pay both, walks+=1, assign story
POST /api/coop/pet|rename|pause|leave    → cosmetic / social
```
Conventions: `ensureFresh(user)` before mutating; `addStones()` for 🦴; derive bar/contrib by
querying `goal_completions` (no goals-module hook); honour `process.env.PLUS_ENFORCED !== '1'`.
Jobs: add the §6.4 nudge as one new reminder kind in `jobs.ts`/`bot.ts`, toggleable, logged in
`reminder_log` (keyed `coop_nudge`).

## 10. Edge cases
- **Different TZ / wake times:** each half keys to that member's own `last_day`; the walk can
  launch once both halves are full within their respective days. Document that a co-op "day" is
  per-member, not global.
- **Partner leaves / unfriends:** bond → `dormant`; the surviving member keeps the puppy
  (read-only) and may invite a new partner into the same `coop_pets` (continuity > loss). Never
  delete a shared puppy out from under someone.
- **Cap reached:** «Завести общего щенка» disabled with «у вас уже 3 общих щенка».
- **Both inactive:** dormant; nothing lost; revives on next dual contribution.
- **Plus (if `PLUS_ENFORCED=1` later):** Plus may raise `COOP_MAX_ACTIVE` (3 → e.g. 6) —
  convenience only, never exclusive content (matches the §5 gating rule in the main spec).

## 11. Build order
1. `003_coop.sql` + constants.
2. `routes/coop.ts`: create/accept (+referral attribution), list (derived bar), walk start/claim.
3. Reuse Puppy art for co-op render; «Наш щенок» card + detail in `app/src/screens/friends/`.
4. Adopt + accept deep-link flow; CTA in `AddFriendSheet` + referral banner.
5. `shareToStory` milestone cards (hatch / stage / streak).
6. Reminder nudge in `jobs.ts` / `bot.ts`.
7. RU co-op story/discovery content + the bonded micropet variant.

**Definition of done:** two test accounts adopt one shared puppy; it advances a stage **only**
after *both* complete their goals across multiple days; no path reduces any stat or streak; a
milestone produces a story card with both names and a working join link.
