# SPEC — Viral features (Telegram-native growth layer)

Add-on to `SPEC.md` and `SPEC-COOP-PUPPY.md`. Six features that out-Telegram Finch on things a
single-player iOS app structurally can't do. Each is sourced from a proven viral mechanic, then
re-cut for the anti-hustle / no-punishment tone. Shared conventions (from `docs/ARCHITECTURE.md`):
`ensureFresh(user)` before mutating, `addStones()` for 🦴, derive cross-module state lazily, all
copy RU на «ты», all numbers in `shared/constants.ts`, every gate honours `PLUS_ENFORCED!=='1'`.

Migrations: co-op took `003_coop.sql`; everything here lands in **`004_viral.sql`** (deltas
collected in §7). New client Telegram bridges (shareToStory / shareMessage) are added to
`app/src/telegram.ts` (§1).

**Cross-feature guardrails (apply to all six):**
- No paid randomness ever; daily/earned randomness only (ToS-safe, matches main spec §5).
- Anonymous text is **preset-only** — never free-text (kills the NGL abuse vector).
- Every share / invite is **opt-in**; no shaming, no "streak lost" auto-cards, no empty-state-as-negative.
- Every external invite surface (compliment link, dig brag, freeze gift to a non-user) routes
  through the existing `pending_referrals → referrals` ladder, so growth compounds into the
  Корова Печенька reward you already built.

---

## 1. «Витрина» — premium milestone share cards  ⭐ build first
**Source:** Duolingo redesigned share cards into beautiful IG/Twitter-ratio artifacts →
5–10× organic sharing, ~6M streak-shares/day. **Why first:** it's the share surface every other
feature here (and co-op) renders through. Today you share a plain `t.me/share/url` link.

**What it is:** every emotional peak produces a genuinely post-worthy card (your puppy art + the
moment + a join link), sharable to a **Telegram Story** or **forwarded into a chat**.

**Triggers:** pet hatch · each stage-up (toddler/child/teen/adult) · streak 7/30/100/365 ·
micropet hatched (esp. rare variant) · location 100% · seasonal event completed · friendship
level-up · co-op milestones (from co-op spec §6.3).

**Render path (reuses your in-code SVG art):** client composes an offscreen SVG card (Puppy rig
with current `dyes`/outfit + headline + pet name + small «Заведи своего щенка» CTA + deep-link
QR), rasterises via `canvas` → PNG. Two destinations:
- **Story:** `tg.shareToStory(mediaUrl, { text, widget_link:{ url, name } })` (Bot API 7.8+).
  Needs a hosted image URL → `POST /api/share/card` uploads the PNG, returns a URL under
  `/data/cards/<hash>.png` (served static).
- **Chat:** server `savePreparedInlineMessage(user_id, result, { allow_user_chats:true })` →
  `prepared_message_id`; client `tg.shareMessage(id, cb)` (Bot API 8.0+).
- **Fallback (old clients):** existing `t.me/share/url` link.

**Add to `app/src/telegram.ts`** (currently missing): `shareToStory?`, `shareMessage?`,
`isVersionAtLeast` gating, wrappers `shareStory(url,text)` / `shareCard(prepId)` with link fallback.

**Schema (analytics only):**
```sql
CREATE TABLE share_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, kind TEXT NOT NULL,   -- hatch|stage|streak|micropet|location|event|coop|dig
  ref TEXT, surface TEXT NOT NULL,                 -- story|message|link
  ts INTEGER NOT NULL
);
```
**Constants:** `SHARE_REWARD_STONES: 5` (once per distinct milestone, anti-spam via
`share_events` uniqueness on (user_id,kind,ref)); `SHARE_MILESTONES` = trigger config.

**Routes:** `POST /api/share/card { kind, ref }` → render+host, return `{ url, preparedId }`,
log `share_events`, grant first-time reward.

**UX:** milestone toast gains a «Поделиться» button → preview sheet → [В историю][Отправить другу]
[Сохранить]. The «Щенок» profile tab share button uses the same renderer for a stats card.

**Tone:** opt-in only; never auto-post; no negative-event cards.

---

## 2. «Косточка дня» — one shared daily moment
**Source:** Wordle (one puzzle/day → 90→3M in two months; emoji grid shows result without
spoiling) + Hamster Kombat daily cipher (same secret for everyone → morning compare-and-share).
**Why it fits:** once-a-day, no-binge scarcity is the most anti-hustle daily hook that exists.

**What it is:** once per game-day the puppy digs up the **day's** card — the *table is global and
deterministic by date*, so everyone shares the same odds/pool that day and compares results.

**Loop:** Home shows «Раскопать косточку дня» (1/day, resets at wake−2h). Tap → dig animation →
roll from that day's deterministic table (`seed = hash(day)` selects the table; `hash(user_id+day)`
selects the user's result, so it's stable on re-read). Tiers: common (small 🦴) · uncommon
(a discovery / cosmetic shard) · rare (micropet-egg progress / dye sample). All **earned & free**
— no purchase, no "dig again" for money → ToS-safe and grind-free.

**Social spark:** a «Что выкопал щенок сегодня» card (renders via §1); in Дворик a row
«сегодня друзья выкопали:» from friends' records → conversation starter. A gentle separate counter
«N дней подряд раскапываю» (NOT the main streak; no penalty for missing).

**Complementary soft variant (optional):** «Вопрос дня» — same daily reflection prompt for
everyone, optional one-line shared answer. Use instead of the dig for a calmer skin, or rotate.

**Schema:**
```sql
CREATE TABLE daily_dig (
  user_id INTEGER NOT NULL, day TEXT NOT NULL,
  result TEXT NOT NULL,            -- JSON {tier, kind, ref}
  shared INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
```
Day's pool lives in `server/content/daily_pool.json` (seasonal swap); no global table to store —
determinism comes from the `day` seed.

**Constants:** `DAILY_DIG_WEIGHTS` (tier odds) · `DAILY_DIG_STONES: [3, 8, 20]` by tier ·
`DIG_SHARE_REWARD: 5`.

**Routes:** `GET /api/daily/today` (dug? what?) · `POST /api/daily/dig` (roll, persist, reward via
`addStones`/discovery/egg) · `GET /api/daily/friends` (friends' digs today).

**Tone:** strictly 1/day, no FOMO timer beyond «до завтра», no paid extra digs.

---

## 3. «Косточка-спасалочка» — giftable streak-freeze
**Source:** Duolingo — streaks retain ~2.4×; Streak Freeze cut churn 21% for at-risk users;
gifting a freeze reaches lapsing friends. **You already have the half of this you need:**
`users.repairs` (default 1), `walks_since_repair`, `STREAK_REPAIR_PER_WALKS:3`,
`STREAK_REPAIR_MAX:2`, `STREAK_REPAIR_STONES:150`.

**What's new:** make the save **giftable** and **loss-aversion-framed**.
- Send a banked repair (or buy one to gift for `STREAK_REPAIR_STONES`) to a friend → arrives in
  Почта/Дворик → claim = `users.repairs += 1` (allow temporary over-cap to
  `REPAIRS_GIFT_OVERCAP`). Reuse the `gifts` table with `kind='freeze', item_id='streak_freeze'`.
- **At-risk surfacing (gentle):** in Дворик, a soft marker «у [друга] серия под угрозой» when a
  friend hasn't opened near their own reset and `streak>0` → one-tap «подарить спасалочку». This is
  the viral hook: it pulls a *lapsing* friend back (retention of them) via a warm act (no shame).
- Keep the existing bot «streak-saver» DM at reset−2h; add «друг подарил тебе спасалочку 🦴» DM on gift.

**Schema:** none new — reuse `gifts`. (Claim path adds to `users.repairs`.)

**Constants:** `STREAK_FREEZE_GIFT_STONES: 150` · `FREEZE_GIFTS_PER_FRIEND_PER_DAY: 1` ·
`REPAIRS_GIFT_OVERCAP: 3`.

**Routes:** `POST /api/social/gift-freeze { friendId }` (consume banked repair or charge stones,
insert `gifts`, DM friend) · claim via existing gift-claim → `repairs += 1` · `GET` friend
streak-risk flags (derive: friend's `last_day` < today near their reset & `streak>0`).

**Tone:** the freeze only ever *prevents* loss; never auto-charges; at-risk marker is opt-out and
worded as care, not nag.

---

## 4. «Лучик от друга» — anonymous warmth (extends «Тёплые лучики»)
**Source:** Gas / NGL hit #1 App Store on anonymous *compliments* (self-esteem, feeling loved).
Fits a self-care app better than it fit them. **You already have** `vibes` (Good Vibes: preset
types, first/friend/day = +3⚡+2🦴, 14 free + 4 Plus).

**What's new:**
- A **compliment** vibe category — warmer, specific presets («ты добрее, чем думаешь», «ты
  справляешься», «рядом с тобой тепло»), delivered by the puppy in a sweet card (renders via §1).
- **Anonymity within friends:** sender picks «от [имени]» or «тайный лучик» (recipient knows it's
  one of their friends, not who). **Preset-only, positivity-only** → no free-text, no abuse vector.
- **Weekly appreciation:** «на этой неделе друзья прислали тебе N лучиков» digest + the messages →
  screenshot-worthy (and a re-engagement DM).
- **Receive-to-join:** send a warm message to a **non-user** friend via link («тебе прислали
  тёплый лучик — открой, чтобы получить») → recipient opens app to claim → routes through
  `pending_referrals`. Warmth becomes acquisition.

**Schema (delta on `vibes`):**
```sql
ALTER TABLE vibes ADD COLUMN anon INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vibes ADD COLUMN message_id TEXT;        -- preset compliment id
```
Compliment library in `server/content/compliments.json`.

**Constants:** `COMPLIMENT_REWARD_STONES: 2` (first/friend/day, mirrors vibe) ·
`COMPLIMENTS_FREE` / `COMPLIMENTS_PLUS` counts · `COMPLIMENT_ANON_ALLOWED: true`.

**Routes:** `POST /api/social/compliment { friendId | externalLink, messageId, anon }` (insert
vibe; external → create pending warm-link) · `GET /api/social/appreciation/week`.

**Tone/safety:** preset positivity only; mute/block still applies; "anonymous within friends," never
to strangers. This keeps the Gas upside without the NGL downside.

---

## 5. «Дружок»-стикеры и коллекционные подарки
**Source:** Telegram collectible Gifts ~$202M mcap and tradable stickers ~$26M in 2025 — a surface
Telegram actively promotes and that spreads natively inside chats. Two parts; ship A now.

**A. Sticker pack (passive virality, near-zero cost):** 16–24 puppy stickers (happy, sleepy,
proud, «выпей воды», «ты молодец», streak-on-fire). Reuse the Puppy rig states. Created via
@Stickers; the pack description carries the bot deep-link, so every use in any chat is an attributed
ad. Reuse the same art as the in-app emotion picker / vibe icons. **No schema** — it's an art +
distribution task. Surface the pack link in onboarding, the profile tab, and share cards.

**B. Collectible puppy items (earned/cosmetic; Stars optional later):** limited seasonal
puppy-themed items, giftable in-app via the existing gifting flow (item + 200🦴 fee). Transparent
supply, **no gambling, no paid randomness, no airdrop** (ToS + tone). When Plus flips on, a
collectible *could* be a Stars gift — but launch = earned-only.
```sql
ALTER TABLE items_owned ADD COLUMN edition INTEGER;            -- nullable serial for limited drops
CREATE TABLE collectible_supply (item_id TEXT PRIMARY KEY, minted INTEGER NOT NULL DEFAULT 0, cap INTEGER);
```
**Constants:** `COLLECTIBLE_DROPS` (seasonal ids + caps) · `COLLECTIBLE_GIFT_FEE: 200`.
**UX:** a «Коллекция» shelf in Сумка; gift-a-collectible reuses §gifting. **Tone:** cosmetic,
transparent counts.

---

## 6. «Вечерний сбор» — defanged BeReal (synchronized gentle moment)
**Source:** BeReal's daily *simultaneity* (20M+ DAU) — everyone doing it at once. **The fix:**
keep the togetherness, drop the random-alarm "drop everything in 2 min" pressure (anti-tone).

**What it is:** a user-chosen window (default ~20:00 local) when the app invites you + friends to
wind down together. In the window: friends' puppies show in «вечерний» mode (sleepy, lamp on), a
one-tap shared action (group breathing / «спокойной ночи» wave / mood log), and a soft presence
line «N друзей укладывают щенков». Natural home for the §2 «Косточка дня» drop.

**Schema:**
```sql
CREATE TABLE evening_checkin (user_id INTEGER NOT NULL, day TEXT NOT NULL, ts INTEGER NOT NULL,
  PRIMARY KEY (user_id, day));
```
`evening_hour` stored in `users.settings` JSON.
**Constants:** `EVENING_DEFAULT_HOUR: 20` · `EVENING_WINDOW_MIN: 90`.
**Routes:** `GET /api/evening/now` (who's around) · `POST /api/evening/checkin`. Gentle DM at the
chosen hour via `jobs.ts` (toggleable, respects Пауза).
**Tone:** opt-in, skippable, no streak, no countdown; presence is only ever encouraging — never
render emptiness as a negative. Lower priority; ship after 1–3.

---

## 7. `004_viral.sql` (all schema deltas in one migration)
```sql
-- Feature 1
CREATE TABLE share_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
  kind TEXT NOT NULL, ref TEXT, surface TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE UNIQUE INDEX idx_share_once ON share_events(user_id, kind, ref);
-- Feature 2
CREATE TABLE daily_dig (
  user_id INTEGER NOT NULL, day TEXT NOT NULL, result TEXT NOT NULL,
  shared INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL, PRIMARY KEY (user_id, day));
-- Feature 4
ALTER TABLE vibes ADD COLUMN anon INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vibes ADD COLUMN message_id TEXT;
-- Feature 5B
ALTER TABLE items_owned ADD COLUMN edition INTEGER;
CREATE TABLE collectible_supply (item_id TEXT PRIMARY KEY, minted INTEGER NOT NULL DEFAULT 0, cap INTEGER);
-- Feature 6
CREATE TABLE evening_checkin (user_id INTEGER NOT NULL, day TEXT NOT NULL, ts INTEGER NOT NULL,
  PRIMARY KEY (user_id, day));
-- Feature 3 reuses gifts; no DDL.
```

## 8. Build order (one pass, dependency-correct)
1. **Feature 1** (share renderer + `shareToStory`/`shareMessage` in `telegram.ts`) — unlocks
   sharing for everything, incl. co-op and the daily dig.
2. **Feature 2** «Косточка дня» — daily-open ritual; shares via #1.
3. **Feature 3** giftable freeze — tiny, reuses `gifts`; immediate retention + reactivation.
4. **Feature 4** «Лучик» — reuses `vibes`; on-tone acquisition.
5. **Feature 5A** sticker pack — parallel art task, independent of code.
6. **Feature 5B** collectibles + **Feature 6** «Вечерний сбор» — later, after the core four prove out.

**Out of scope (tone):** competitive ranked leagues. If any competition ever, only a *cooperative*
weekly pool — friends collectively fill a shared bar of kind acts → shared cosmetic. Never rank
individuals, never publish who did least.

**Definition of done (per feature):** triggers fire at the stated points; every external surface
attributes via `pending_referrals`; no path reduces a stat/streak or shames a user; all numbers
read from `shared/constants.ts`; gates honour `PLUS_ENFORCED!=='1'`.
