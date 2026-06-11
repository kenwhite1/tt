# SPEC — «Дружок» (working title): 1:1 Finch clone as a Telegram Mini App

Version 1.0 — 2026-06-11. Based on the interview (all decisions locked) + the full research
teardown in `research/finch/*.md` (8 documents, ~200KB, sources cited there inline).

**One-line goal:** rebuild Finch's complete feature set, screen structure, flows, mechanics,
and economy as a Russian-language Telegram Mini App, with a golden puppy mascot instead of the
bird. Original artwork (flat vector SVG in the same cozy style) and original Russian text;
identical structure, mechanics, and numbers everywhere.

---

## 1. Locked decisions (from interview)

| Decision | Value |
|---|---|
| Mascot | Golden puppy (user's hero image = bot avatar / icon) |
| Language | Russian-first; i18n layer from day one (EN later = data add) |
| Staging | Full build in one go; deep starter content library |
| Backend | Single Node.js artifact + SQLite (volume on Railway) |
| Hosting | Railway, deployed from a GitHub repo I create & push |
| Bot | User creates via @BotFather at deploy time (2-min script provided) |
| Monetization | Launch free; full «Plus» paywall UI + gating built but DORMANT; Telegram Stars wiring ready behind a flag |
| Reminders | Copy Finch cadence exactly, via bot DMs, per-type toggles |
| Art | Flat vector SVG drawn in-code (all pets, items, scenes); consistent cozy palette |
| Text/art provenance | 100% original art and Russian copy; mechanics/flows/layout 1:1 |

### 1.1 Name proposals (pick one; default if no objection = #1)
1. **«Дружок»** — the classic affectionate Russian dog name, literally "little friend."
   Reads instantly as "your companion." Bot: `@druzhok_pet_bot` (availability checked at deploy).
2. **«Лапка»** — "little paw" / «лапочка» = sweetie. Soft, feminine-skewing (our key demo).
3. **«Бублик»** — beloved cute dog name. Playful.
4. **«Тоша»** — soft diminutive dog name.

App title pattern (mirrors Finch's store line): **«Дружок — питомец заботы о себе»**.

### 1.2 Renamed concepts (same mechanics, dog-flavored RU naming)
| Finch concept | Ours |
|---|---|
| Birb | Щенок (the puppy; user names it at onboarding) |
| Adventure | **Прогулка** (walk — perfect dog fit) |
| Rainbow Stones | **Радужные косточки** (rainbow bones; single soft currency) |
| Energy | Энергия |
| Tree Town (friends) | **Дворик** (the courtyard; big tree visual kept 1:1) |
| Birbhouse | **Домик** (one room, slot-based decor) |
| Finchie Forest | **Щенячий лес** (starting location) |
| Micropets | Микропитомцы (62, original designs/names) |
| Mr. Prickles' Shop (clothing) | Original NPC: ёж-портной **«Колюч»** |
| Finkea Furnishings | **«БУДКЕА»** (будка × IKEA pun), NPC сорока **«Соро́ка»** |
| The Color Studio | **«Студия окраса»**, NPC хамелеон **«Тео»** |
| Travel with Sass | **«Турбюро „Хвост-трэвел“»**, NPC кошка **«Сасси»** |
| Professor Oat's Lab | **«Лаборатория профессора Овса»** (козлик-профессор) |
| First Aid Kit | **Аптечка** |
| Good Vibes | **Тёплые лучики** |
| Finch Plus | **«Дружок Плюс»** (dormant at launch) |

Dye body parts adapt bird→puppy: **уши, мордочка, щёчки, лапы, хвост, животик, шёрстка (тело)**
— 7 parts, same count as Finch's 7 (beak/headpatch/wings/cheeks/feet/tummy/body), same
price keying and stage-gating.

---

## 2. Architecture

### 2.1 Topology (single deployable artifact)
```
repo/
├── server/            Node 22 + Hono — one process:
│   ├── api/           REST API for the mini app (JWT sessions)
│   ├── bot/           grammY — webhook: /start, referral attribution,
│   │                  pre_checkout_query, successful_payment, write-access
│   ├── jobs/          node-cron schedulers: per-user reminders (sharded ≤25 msg/s),
│   │                  day-reset processing, walk completion, shop rotation,
│   │                  newsletter generation, event ticks
│   ├── db/            better-sqlite3 + migrations (WAL mode; /data volume on Railway)
│   └── content/       RU content library as typed JSON (goals, prompts, quests,
│                      items, micropets, locations, stories, quizzes, i18n strings)
├── app/               Vite + React + TS SPA (the mini app)
│   ├── telegram/      @telegram-apps/sdk: initData auth, fullscreen+portrait lock,
│   │                  safe areas, BackButton, haptics, theme, CloudStorage prefs
│   ├── art/           SVG component library (puppy rig, items, scenes, NPCs)
│   └── screens/       see §3 screen map
└── railway.json       build + volume + env wiring
```

### 2.2 Auth & sessions
- Client sends raw `initData` → server validates HMAC-SHA256 (`WebAppData` + bot token),
  rejects `auth_date` > 1h → issues JWT (7d) bound to `telegram_user_id`.
- No registration screens at all (Telegram replaces Finch's phone-number account system).
  Cloud backup/restore features are moot — server is source of truth. "Экспорт записей"
  (journal export) kept as JSON/text download via `downloadFile`.

### 2.3 Time model (critical, copied exactly)
- The game day resets at **wake-up time − 2h** per user (not midnight). Wake/sleep times set
  in settings («Режим дня»). All daily resets key off it: energy→0, daily quests, Goal of the
  Day, shop rotations, daily shop gift, first-vibe rewards, streak tick, event day credit.
- Server stores user TZ (IANA, from a one-time onboarding picker defaulted by Telegram
  language/locale; changeable in settings). A minute-cron finds users crossing their reset
  boundary and processes their day.
- Walks/flights run in real time server-side (continue while app closed — research gap #3).

### 2.4 Data model (SQLite, ~30 tables — key ones)
`users` (tg_id, name, tz, wake, sleep, streak fields, pause_until, plus_until, settings JSON) ·
`pets` (name, pronouns, stage, walks_total, friendship_pts, color JSON, trait, hatchday) ·
`goals` (title, emoji, sca_id, schedule JSON, times_per_day≤100, linked_exercise, archived/paused) ·
`goal_completions` (goal_id, day, count) · `scas` (self-care areas) · `moods` ·
`reflections` (encrypted-at-rest) · `walks` (location_id, start, end, story_id, discovery_id) ·
`discoveries` · `items` + `inventory` (unique item+color) · `shop_rotations` ·
`micropet_species` + `micropets` (owned: name, pronouns, stage, walks, nature) + `egg` state ·
`locations` + `location_progress` · `friendships` + `vibes` + `gifts` + `shared_goals` ·
`quests_daily` + `quests_special_progress` + `weekly_milestones` + `challenges` ·
`events` + `event_progress` · `mail` · `notifications_prefs` · `payments` (Stars ledger).

---

## 3. Screen map (1:1 with Finch)

Bottom tab bar, 6 tabs: **Дом · Задания · Магазин · Друзья · Сумка · Щенок**.

1. **Дом** — puppy in current location/room scene (double-tap toggles), energy bar (or walk
   progress bar with countdown), mood icon top-right, hamburger menu top-left, Goal-of-the-Day
   star, today's goal checklist, «+ Добавить цель», Walk button at full energy, «Поговорить со
   щенком» post-walk (1/day), pet-by-dragging → floating hearts + sound (~15 pats = 1
   friendship pt).
2. **Задания** — top-to-bottom: seasonal event calendar banner → monthly Goal Challenge bar →
   seasonal location invite → Daily quests (3–4 × 25🦴) → Weekly milestones per SCA
   (2/4/6 days → 20/50/100🦴) → Special quests (6 tracks × 100🦴/tier) → pet friendship
   progress strip.
3. **Магазин** — 4-way chooser (Одежда / Мебель / Окрас / Путешествия), shared shop engine:
   12 rotating slots (6 free / 12 Plus), location slot #1, Plus 50%-off banner slot, daily
   gift 65–80🦴 (clothing shop), Everyday collection (pick-any-color), catalog try-on,
   sell-back 50%, refresh ladder 0/10/35/60/85/110/135/160, travel shop = no refresh,
   3 (free) / 9 (Plus) destinations.
4. **Друзья (Дворик)** — tree, own puppy center, 8 friends/page + page dots, hug-request
   puppy on top, heart inbox (vibes grouped by sender), Add friend (invite new / enter code /
   share my link), friend page (vibes, gift, buddy-up, shared-goal streaks, last-4-events
   feed, ❤ friendship level, ⋯ rename/mute/emoji/unfriend±block), referral banner («Получи
   микропитомца — позови друзей»).
5. **Сумка** — Почта (mail/newsletters/friend requests/gifts) · Одежда (equip, 2 free saved
   outfits / ∞ Plus) · Мебель (14 fixed slots: bed, rug, doormat, 2 door items, wall item,
   clock, lamp, dresser, dresser item + floor/wall/door/window) · Окрас (owned dyes, apply) ·
   Микропитомцы (playland scene ≤10 roaming, grid+list, egg w/ progress, Лаборатория,
   Микропедия with ?-silhouettes).
6. **Щенок (profile)** — header card (avatar, name, pronouns, FRIEND CODE + copy), tabs
   ABOUT / DETAILS / TRAITS, streak card («N дней подряд» + repair/longest/calendar/intensity
   presets Baby steps→On fire), collections: Микропитомцы 0/62 → Локации 1/27 (% each) →
   Открытия logbook (likes blue / dislikes red, categories) → challenge badges. Share + edit
   buttons top-right (matches screenshots).
7. **Hamburger menu** — Активности (Идеи целей, Размышления, Дыхание, Звуки, Движение,
   Викторины, Таймеры, Доброе дело, Аптечка) · Мои цели (+архив) · Сферы заботы · Инсайты ·
   Газеты · История · Сообщества · «Дружок Плюс» banner · Настройки (профиль/режим дня,
   данные, предпочтения, уведомления) · Пауза.
8. **Onboarding** (exact Finch order): entry → 6 egg colors → hatch → pronouns (он/она/они) →
   name puppy (+ randomize) → starting trait (6 personality dims) → user's name → first
   resonance question → walkthrough + mini-survey → pre-seeded starter goals → reminder
   opt-in (`requestWriteAccess`) → «Тебя пригласили?» referral field (48h window) →
   home-screen shortcut nudge later (day 2).

---

## 4. Core mechanics — constants (all copied exactly)

| Constant | Value |
|---|---|
| Goal completion | 5⚡ + 3🦴 (low-mood day: 7⚡ + 4🦴) |
| Energy to full (Baby→Adult) | 15 / 20 / 25 / 30 / 35 |
| Stage thresholds (cumulative walks) | Toddler 7 · Child 22 · Teen 42 · Adult 67 |
| Walk duration | ~8h baby → ~6h adult; −2 min per extra ⚡; 1 walk/day max |
| Walk chat | once/day post-walk; custom reply = no discovery saved |
| Pet friendship | 10 levels @ 1/2/4/8/15/30/80/165/340/730 pts; walk bonus +2→+75; ~15 pats=1pt; 100🦴/level |
| Streak | counts on app-open; repair: 1 free per 3 walks, bank 2, buyable with 🦴; intensity presets; pause 1–7d (default 3) freezes |
| Daily quests | 3–4/day × 25🦴 (pool incl. pet/outfit/vibe/breathing/gratitude/emotion/walk/interior + «Ответь с друзьями») |
| Weekly milestones | per SCA: 2/4/6 days → 20/50/100🦴 |
| Special quests | 6 tracks (clothing/furniture ladders 1→10000, micropets 1→150, locations 2→27, stages, friendship) × 100🦴 |
| Goal Challenges | monthly, 14 goals, 1/day, join by ~16th, badge + wall-badge furniture |
| Seasonal events | monthly; unlock after 3 days of use; 1 reward/energized-day; chests (orange=clothing, purple=furniture, black=88% item/12%🦴, 4 colors free / 10 Plus); micropet day 25 free / 20 Plus; 14-day post-claim window |
| Item prices | 300/500/900🦴 grid; plushies 15k/20k; dyes keyed to body part (300/500/900); sell-back 50% |
| Travel | unlocks at Child; first flight free; 300🦴 (back to Щенячий лес 200); 27 locations + seasonal; ~2%/walk (~50 days; forest 67); 4 excl. clothing + 4 excl. furniture per location |
| Gifting | item + 200🦴 fee; 1 gift/friend/day; dyes not giftable; gift-before-buy rule |
| Good Vibes | first/friend/day = +3⚡ +2🦴; 14 free + 4 Plus types; 1h friend-visit invite; 3-day unanswered nudge; hug broadcast ~1/day |
| Micropets | egg linked to a goal, 7 completions hatches random (3 color variants, dupes allowed); adult at 15 walks; 62 species; sources: eggs / event d25(20) / 3 invites / invitee gift / co-op |
| Referrals | ladder: 1) 🦴+hood 2) plushie 3) micropet «Корова Печенька»; invitee picks-up inviter-chosen egg; cap 3; 48h attribution |
| Mood logger | manual, top-right; 5-point scale; Save or Reflect (+factor tags); low mood → Аптечка pinned + boosted rewards |
| Quizzes | opt-in (default OFF); 8 self-assessments, non-diagnostic disclaimer |
| Newsletters | 4 weekly papers (Mon/Wed/Fri/Sat); free = latest Monday paper only |
| Day reset | wake-time − 2h |

Activities energy: movements 6/18/30/60⚡ by 1/3/5/10 min; meditation timer 6+⚡
(3/5/10 free → 60 Plus); focus timer 10+⚡; breathing ~7 free patterns @1/3min (+Plus
patterns/durations); soundscapes 7 free sets @10/30min (Plus: all + 1h/8h); reflections show
reward up front.

---

## 5. «Дружок Плюс» (built 1:1, DORMANT at launch)

Gating copied exactly (no member-exclusive items — Plus = throughput/convenience):
12 vs 6 shop slots + daily 50% item · 9 vs 3 travel slots · event: deterministic 2nd reward
column, 10-color choice, micropet d20, guaranteed set · 4 extra vibes · extra
reflection/quiz/breathing/soundscape/movement/timer content+durations · any goal emoji + SCA
colors · ∞ saved outfit/room/color combos (free: 2/2/2) · 4 newsletters + archive (free: 1).

**Launch state:** every gate evaluates `hasPlus(user)`; flag `PLUS_ENFORCED=false` → everyone
passes, paywall screens exist and render «скоро» state. **Stars wiring (ready, off):**
30-day subscription via `createInvoiceLink(currency:XTR, subscription_period:2592000)`
(suggested 350⭐/mo) + one-off 365-day SKU (~2500⭐); `openInvoice` in-app;
`pre_checkout_query` answered <10s; entitlement from `successful_payment.
subscription_expiration_date` + expiry checks; `refundStarPayment` admin command. Stars-only
per Telegram ToS; no paid randomness anywhere (chests stay earned-only — gacha-legal-safe).

---

## 6. Telegram adaptations (the only deliberate deltas)

| Finch (iOS/Android) | Ours (Telegram) |
|---|---|
| Push notifications | Bot DMs from the puppy (first person, warm): morning greet @wake, midday supportive (pool), evening mood check ~19–20:00, bedtime wind-down @sleep−30m, walk-return ping, mail day pings, streak-saver @reset−2h if unopened, per-goal reminders, social events (vibes/gifts/buddy). Each type toggleable + global off; Pause mode silences all. Deep-link buttons reopen the right screen. Sharded sender ≤25 msg/s with 429 backoff |
| Home-screen widget | `addToHomeScreen()` nudge (day 2) + the daily bot message acts as the widget surface |
| Phone-number account | Telegram identity (initData) — zero-friction |
| OS share sheet invites | `t.me/<bot>?startapp=ref_<code>` deep links + `shareMessage` prepared cards + `shareToStory` milestone cards |
| Friend code | kept: 10-char code (manual entry parity) AND the startapp link |
| Movement videos (real person) | Animated SVG puppy demonstrates each move (original, no video licensing) |
| Soundscapes audio | CC0 ambient loops (sourced, attribution file) + Web Audio synth cues for UI/pet voices |
| Apple/Google IAP | Telegram Stars (dormant) |
| Helpline link | RU crisis resources (8-800-2000-122 детский; 8-495-989-50-50; findahelpline.com fallback) |

Mini-app hygiene: fullscreen + portrait lock, safe-area padding, `disableVerticalSwipes`,
BackButton-driven nav, `enableClosingConfirmation` while journaling, haptics on
complete/claim/pet, dark-mode aware system surfaces, CloudStorage for prefs only.

---

## 7. Art plan (all original, flat-vector SVG)

- **Puppy rig**: layered SVG (body/ears/muzzle/cheeks/paws/tail/tummy as tintable layers +
  clothing anchor slots head/face/neck/top/bottom/feet/held/back) × 5 growth stages × states
  (idle, sleepy, asleep, happy, walking, petting hearts, wave). CSS/SMIL micro-animations.
- **62 micropet species** × 3 variants (tint-based) × baby/adult, idle/walk anims + synth voice.
- **27 location scenes** (parallax background + walk strip) + 1 seasonal scene template.
- **Item catalog v1**: ~220 clothing + ~180 furniture originals across 300/500/900 tiers,
  10-color tint palette; 5 plushies; 235 dye bottles (palette data, one bottle sprite).
- **NPC cast**: 5 shopkeepers/professor, greeting poses.
- **UI kit**: warm cream/butter palette as in the reference screenshots; rounded cards,
  sticker-style tabs; the user's rendered puppy image = bot avatar + loading screen only.

## 8. RU content plan (original copy, same tone: gentle, anti-hustle, «ты»)

~150 suggested goals across 7 categories (micro-goals: «выпить воды», «3 глубоких вдоха») ·
9 pre-designed SCAs · 60+ reflection prompts incl. 4 multi-part deep-dives · ~8 breathing
patterns · 10 movement sets · 8 opt-in quizzes (non-diagnostic, disclaimer) · ~160-word
emotion taxonomy · 5 grounding exercises · Аптечка full set · daily-quest pool (~15) ·
2 monthly challenges (14 goals each) ready · 1 full seasonal event («Летний дворик», 30 days,
item set + micropet) · walk-story library: ~120 generic + 6–10 per location stories with
multiple-choice replies mapped to 6 personality dims + ~300 discovery entries (food/drinks/
music/books/films, location-bound where apt) · 4 newsletter templates · all UI strings via
i18n keys (ru.json now, en.json stub).

## 9. Build & delivery plan (one continuous build, internal order)

1. Scaffold: repo, server+bot+SPA, initData auth, CI typecheck, Railway config.
2. Engine: time/day-reset, goals/SCAs, energy/walks/stages, streaks+pause, mood, currency.
3. Content systems: activities suite, first-aid, quests/milestones/challenges, insights,
   newsletters, history.
4. Economy: 4 shops engine, inventory/bag, dyes, travel/locations, discoveries, mail.
5. Pets: micropet lab/playland/micropedia; pet profile tab; collections.
6. Social: дворик, vibes, gifts, buddies, referrals, friend codes.
7. Events + seasonal location; Plus gates (dormant) + Stars wiring (flagged off).
8. Reminder engine + all bot copy; share cards.
9. Art & content pass to full counts; polish, haptics, sounds.
10. E2E test against a private test bot → deploy to Railway → handover.

**Definition of done:** every row in §4 implemented at the stated numbers; all 6 tabs + menu
screens present; reminder engine live; deployed on Railway; opens from a real bot.

## 10. What I need from you (only at the very end)
1. Name pick from §1.1 (default: «Дружок»).
2. @BotFather: create bot (I provide exact paste-script), send me the token → goes into
   Railway env, never the repo.
3. Railway: connect the GitHub repo (two clicks) — or give me a Railway API token and I do it.
4. GitHub account to own the repo: `bobthescienceskeleton-del` (active) or `kenwhite1`?

## 11. Risks & open questions
- **Verify-in-app numbers** (sources conflicted): weekly milestone 3rd tier 100 vs 150🦴 →
  shipping 100; paid streak-repair price → shipping 100🦴 ×1.5/use (tunable); daily-quest
  count → 3; free saved-combo count → 2. All in a `constants.ts` for 1-line tuning.
- **Audio**: only asset class not produced by me — CC0 loops curated, list provided for review.
- **Scale ceilings**: SQLite+volume fine to ~50–100k MAU; Postgres migration path documented.
  Free bot tier = 30 msg/s broadcast → reminder sharding built in; paid broadcasts later.
- **Legal**: original art/copy throughout; mechanics and layout are not copyright-protected,
  but expect Finch could still complain — naming, mascot, and all assets are distinct on
  purpose. No paid loot boxes; Stars-only when monetization flips on.

---

## 12. Design-fidelity contract (how close it looks and feels)

Target: a user who knows Finch opens this app and feels **"this is the same app"** within the
first minute — same screens, same order of elements on every screen, same navigation, same
interactions, same warmth. Built screen-by-screen against the reference screenshots.

**Guaranteed identical (structural level):**
- Screen inventory and bottom-tab order (Home · Quests · Shop · Friends · Bag · Pet); the
  element order inside every screen mirrored from the references — e.g. Pet tab: profile card
  (avatar, name, pronouns, FRIEND CODE + copy) → ABOUT/DETAILS/TRAITS tabs → streak card →
  collection ledgers (Micropets 0/62 → Locations 1/27 with % labels) with brown count-footer
  «1/27 ›»; Bag: Mail full-width, then Outfits/Furniture, then locked Colors/Micropets with
  «?»; Friends: tree, nest center, «???» signposts, green Add friend pill, referral micropet
  banner with chevron.
- Interaction grammar: tap-goal→checkmark→reward toast; Claim buttons; drag-to-pet with
  floating hearts; double-tap home↔location; ?-silhouettes for undiscovered collection items;
  page dots; 4-color choice chips on chests; share/edit header buttons; hamburger top-left,
  mood icon top-right.
- Visual mood: warm cream/butter/brown palette, soft rounded cards with bottom shadow lips,
  notebook-binding tabs on collection cards, sticker-style tab-bar icons, chunky friendly
  headings — the same design family as the references, rendered as our own original assets.
- Copy voice: gentle first-person pet voice, celebratory micro-toasts — written natively in
  Russian to read the way Finch reads in English.

**Where an attentive side-by-side user could still tell (all agreed or unavoidable):**
1. The mascot and every illustration: original drawings in the same flat-cozy genre — the
   agreed difference, and originals can't be pixel-identical to another artist's files.
2. Language: Russian (the entire point of the product).
3. Launch content depth: deep starter library vs Finch's 4 years of accumulated catalog;
   structures and counts converge over time (62 micropet slots, 27 locations exist from
   day one — later entries marked «скоро» until their art/content lands).
4. Movements: animated puppy demonstrations instead of Finch's real-person videos.
5. Ambient soundscape recordings differ (CC0-sourced).
6. Platform chrome: Telegram's header/close button instead of a native iOS status bar.
