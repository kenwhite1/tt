# Finch: Self Care Widget Pet — Teardown: Monetization, Notifications, Settings & Widgets

Research date: 2026-06-11. App: "Finch: Self-Care Pet" by Finch Care Public Benefit Corporation.
Latest iOS version at research time: v3.73.176 (App Store), ~486.3 MB, age rating 9+ (Apple) / PEGI 3 (EU).
Primary sources: official help center (help.finchcare.com, 56 articles pulled via Zendesk API), Apple App Store listing, finch.fandom.com community wiki, press/review coverage. Each claim cites its source URL. Items marked **[unverified]** are community-reported and should be confirmed in-app before implementation.

---

## 1. Monetization Overview

Finch is free to download with a single optional subscription ("Finch Plus"), an optional donation subscription ("Guardians"), and no ads anywhere in the product. Official positioning: all core self-care features are free forever; Plus adds customization, faster progress, and bonus content ([Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus)). There are **no member-exclusive items** — Plus makes items easier/faster to obtain but never exclusive ([Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus)).

### 1.1 Finch Plus pricing (exact)

| Plan | Price (USD) | Source |
|---|---|---|
| Yearly | **$69.99** | [Finch Plus Pricing](https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing) |
| Monthly | **$9.99** | same |

- Regional example: UK yearly ≈ **£70.99** ([Internet Matters profile](https://www.internetmatters.org/advice/apps-and-platforms/wellbeing/finch/)).
- Apple App Store in-app purchase tiers visible on the listing (these are the discounted/regional/offer SKUs actually wired up): Finch Plus at **$5.99, $9.99, $34.99, $39.99 (×2), $41.99, $49.99, $59.99, $69.99**, plus **Guardian Program $7.99** ([App Store listing](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748)). Interpretation: $9.99 = monthly, $69.99 = full yearly, and the $34.99–$59.99 tiers are discount-offer yearly SKUs (intro offers, loyalty discounts, hardship pricing); $5.99 is likely a discounted monthly.
- Billing is handled entirely by Apple/Google; subscribe flow: Menu (top-left) → tap the blue **Finch Plus banner** → choose monthly or yearly → confirm via app store ([How to Subscribe](https://help.finchcare.com/hc/en-us/articles/37780175015693-How-to-Subscribe-to-Finch-Plus)).
- **No family plan exists** ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs)).

### 1.2 Trials and previews (three distinct mechanisms)

1. **Finch Plus Preview** — after **3 days** of app use, every user automatically receives a temporary gifted Plus subscription. No payment method, no charge when it ends, nothing to cancel ([Finch Plus Preview Explained](https://help.finchcare.com/hc/en-us/articles/38087066022285-Finch-Plus-Preview-Explained)).
2. **3-day free Plus trial** — ends automatically, does not convert to a subscription ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs)).
3. **7-day free trial** — converts into a paid subscription unless manually canceled; limited to one trial per account/email; if a trial was already consumed, a charge can occur immediately (support offers refunds for this case) ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs)).

### 1.3 Dynamic discounts (loyalty / win-back)

Community-documented loyalty discount ladder tied to lifetime **Adventure days** (off a higher base yearly list price than the current $69.99 — treat numbers as a mechanic template, **[unverified]** exact base): at 25 days → 19% off ($78.99), 50 days → 32% ($65.99), 75 days → 39% ($58.99), 100 days → 45% ($52.99), converging on the special one-time new-user price ([Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus)). New users also get a one-time intro offer; seasonal promos appear periodically. After winning a free raffle month (below), users in hardship may be offered a permanently reduced price ([Finch Secrets wiki](https://finch.fandom.com/wiki/Finch_Secrets)).

### 1.4 Guardians program (donation tier) + raffle

- **Guardians** is a separate donation subscription ($7.99 IAP tier on iOS; also purchasable on the website) whose proceeds gift Finch Plus to users who can't afford it. Guardians' birbs get **special sparkles** (only cosmetic differentiator in the entire app) ([Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus); [App Store](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748)).
- **Guardians Raffle**: entered in-app via Menu → **Become a Guardian** → Enter Raffle. Held near the start of each month; winners get an in-app notification and a free 1-month Plus subscription. One entry auto-re-enters every month until you win, as long as you stay active. Entry form hidden from current Plus members and existing entrants; entrants answer short financial-situation questions ([Entering the Guardians Raffle](https://help.finchcare.com/hc/en-us/articles/38108014451725-Entering-the-Guardians-Raffle); [Finch Secrets wiki](https://finch.fandom.com/wiki/Finch_Secrets)).
- **Fundraiser milestones**: when community fundraising milestones are hit, ALL users see a "There is a rainbow"/"What are we celebrating?" button and receive an in-game gift item (not Plus time) ([Guardians Fundraiser Milestones](https://help.finchcare.com/hc/en-us/articles/37942501388813-Guardians-Fundraiser-Milestones)).
- Website-purchased Guardian subs are managed by emailing guardians@befinch.com; in-app ones via the app stores ([Updating your Guardians Subscription](https://help.finchcare.com/hc/en-us/articles/37944953858445-Updating-your-Guardians-Subscription)).

### 1.5 Gifting Finch Plus

- 1-year gift subscription sold via a **Stripe checkout link** (web, outside app stores). Buyer receives an email with a link to submit the recipient's **Friend Code** (or forwards the email for self-redemption). On redemption the recipient gets an in-app notification ([How to Gift Finch Plus](https://help.finchcare.com/hc/en-us/articles/37972018284685-How-to-Gift-Finch-Plus)). Gifting support: gifts@befinch.com.

### 1.6 B2B / benefits channel

- **Wellhub**: employees whose employer plan includes Finch can activate Finch Plus at no extra cost (Wellhub app → Explore → Apps filter → Finch → Activate → link existing account by phone number or sign up). If the user already pays for Plus, Wellhub access starts only after the paid period ends; no proration/refunds; user must cancel the store subscription to avoid double billing. Losing Wellhub eligibility ends Plus access ([Wellhub FAQ](https://help.finchcare.com/hc/en-us/articles/43822620990989-Wellhub-FAQ)).

### 1.7 Cancel / restore / refunds

- **Cancel**: via device subscription settings only (iOS: Settings → Apple ID → Subscriptions → Finch; Android: Play Store → Menu → Subscriptions → Finch). Plus features persist until end of the paid period ([Canceling Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780209444365-Canceling-Finch-Plus)).
- **Restore**: in-app **"Restore Finch Plus Purchase"** button in Settings re-syncs entitlement with the store ([How to Restore](https://help.finchcare.com/hc/en-us/articles/38508647189389-How-to-Restore-Your-Finch-Plus-Subscription)).
- **Refunds**: handled by Apple/Google through purchase history; if Apple denies, Finch offers a workaround via Amazon or PayPal; accidental-subscription refunds via support@befinch.com ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs); [How to Subscribe](https://help.finchcare.com/hc/en-us/articles/37780175015693-How-to-Subscribe-to-Finch-Plus)).

---

## 2. COMPLETE Free vs Finch Plus gating list

### Always free (explicitly confirmed)
- Bird care, goal creation/tracking (unlimited custom goals), reflections/journaling, mood logging + Insights, sending Good Vibes (basic set), friends/Tree Town, seasonal events (free reward track), adventures, shops, micropets, quests, streaks, breathing/soundscapes/movements/timers (base durations & base content), First Aid Kit, widgets, backups. No ads for anyone. ([Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus); [New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide))

### Gated behind Finch Plus (complete list, with numbers)

| Area | Plus benefit | Free baseline | Source |
|---|---|---|---|
| Goals | Customize **all goal emojis** (any emoji) | Auto-assigned icon/emoji (keyword-based) | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus); [Goals wiki](https://finch.fandom.com/wiki/Goals) |
| Shops | **Daily discounted item** (clothing, furniture, color shops) | No daily discount | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus) |
| Shops | **Extra unlocked rare-item slots** in clothing/furniture/color shops + extra **location slots** in Travel Agency | Fewer rare slots/day | same |
| Seasonal events | **Extra reward(s) every day** (premium reward track shown side-by-side with free track) | Free track only | same; [Seasonal Event Overview](https://help.finchcare.com/hc/en-us/articles/37780438941965-Seasonal-Event-Overview) |
| Seasonal events | Event **micropet on Day 20** | Day **25** | same |
| Seasonal events | **Guaranteed all event outfits** if participating daily; **choose reward color** freely | Choice limited to 4 free colors/month | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus); [Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus) |
| Friends | Unlock **all Good Vibes options** (Plus-exclusive vibes) | Basic vibes set | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus) |
| Friends | Customize **friends' tag emojis** | — | [Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus) |
| Reflections | Additional reflection prompts | Base prompts | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus) |
| Soundscapes / Movement / Breathing | **All content options + all time durations**. Soundscapes: free = 10 or 30 min timers; Plus = **1 h and 8 h** timers; large share of soundscape categories Plus-only (Ocean, Beach, Fire, Jungle, Thunder, Wind, all Animal packs, Traffic, Typing, Work Ambience, all Mixes) | Free packs: Water, Rain, Boat, Forest, Home, Travel, Shop Ambience | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus); [Soundscapes wiki](https://finch.fandom.com/wiki/Soundscapes) |
| Timers | **All duration options** (Meditation: 3/5/10/15/20/30/45/60 min; Focus: 10/20/30/45/60 min — longer tiers gated) | Short durations only | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus); [Timers wiki](https://finch.fandom.com/wiki/Timers) |
| Newsletter | **5 newsletter issues/week** + **full newsletter history** | **1/week** (The Weekly Feels, latest issue only) | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus); [Newsletters wiki](https://finch.fandom.com/wiki/Newsletters) |
| Quizzes | Unlock **all quiz options** | Subset | [Benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus) |
| Self-Care Areas | Customize **area colors** | Default colors | same |
| Goal/exercise suggestions | Extra goal-suggestion packs in Activities ("Sleep goals", "Get active, be happy", "Connect with a loved one" tabs) — note the same suggestions are reachable free via Self-care Areas | Suggested/Easy-Wins tabs | [Goals wiki](https://finch.fandom.com/wiki/Goals) |
| Wardrobe/decor | **Unlimited saved combinations** of outfits, birbhouse decor, and bird colors | Limited save slots | [Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus) |

Newsletter detail (for rebuild): 4 newsletter types — **The Weekly Feels** (Mondays, mood/check-in insights; the one free users get), **The {birb name} Times** (Wednesdays, bird energy/affection/personality-% growth/discoveries), **The Progress Post** (Fridays, mindful-exercise counts, reflection word clouds, categorical wins, top exercises), **The Resolve Tribune** (Saturdays, goals set/completed, completed & skipped goal tags). Unread issues show a red badge; per-newsletter on/off toggles behind a bell icon, and disabled newsletters stop tracking insights (insights from disabled periods are not backfilled) ([Newsletters wiki](https://finch.fandom.com/wiki/Newsletters)).

---

## 3. Notifications & Reminders

Notification engineering note: Finch's pushes are mostly locally scheduled, warm/first-person from the pet, and time-anchored to the user's configured day. Observed live examples with timestamps ([Pushkeen notification archive](https://pushkeen.ai/apps/Finch)):

| Type | Example text | Observed timing / cadence |
|---|---|---|
| Morning wake / check-in | "Baby Pancake just woke up 🌞 Pancake is waiting for you" | At user's wake-up time (e.g., 8:00 AM), daily |
| Pet mood check-in (evening) | "I'm feeling hopeful. How did your day go?" | ~7–8 PM daily |
| Supportive pet messages | "You matter to me." / "You've got this." / "Thinking of you." / "I'm here if you need someone." | Scattered, ~12 PM–6 PM, several per week |
| Bedtime wind-down | "Unwind for Bedtime 🛌 Wind down for a good night's rest." | ~9:00 PM (tied to sleep-time setting) |
| Newsletter / mail | "Baby Pancake got mail! 💌 The Weekly Feels is here!" | Mondays ~9:00 AM (free cadence: 1/week; Plus: 5/week) |
| Friend visit / Good Vibes | "You have a visitor! A birb is waving over to you." | Event-driven, when a friend sends vibes/visits |
| Goal reminders | Per-goal reminder at the time chosen in the goal editor | User-set, per goal |
| Goal Buddy updates | Notified whenever your buddy completes the shared goal; reminders + encouragement both ways | Event-driven ([Goal Buddies](https://help.finchcare.com/hc/en-us/articles/37936388919693-Goal-Buddies)) |
| Accountability sharing | Friend gets notified you shared a goal with them | Event-driven ([Accountability Buddies](https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies)) |
| In-app-only notices | Raffle win notice, Plus gift received notice, fundraiser "There is a rainbow" button, red badge on Newsletters | In-app, event-driven |

### Notification controls (settings surface)

- **Per-goal**: goal editor (tap goal → pencil) includes when the goal appears (time of day) and a per-goal **notify on/off** ([Goals wiki](https://finch.fandom.com/wiki/Goals); [Creating and Completing Goals](https://help.finchcare.com/hc/en-us/articles/37779940291213-Creating-and-Completing-Goals)).
- **Global**: Settings menu contains a dedicated **Notifications** settings area (listed among "dozens of app Settings (notifications, preferences, etc.)" — [Finch App wiki](https://finch.fandom.com/wiki/Finch_App)). Granular per-type toggle layout **[unverified — verify in-app]**.
- **Newsletters**: per-newsletter toggles via bell icon on Newsletters screen ([Newsletters wiki](https://finch.fandom.com/wiki/Newsletters)).
- **Friends**: **mute a friend** to stop notifications about their shared goals without unfriending; unfollow individual shared goals via 3-dot menu ([Accountability Buddies](https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies)).
- **Quiet hours equivalent**: no explicit "quiet hours" feature documented; quiet time is implied by **Waking Hours** (notifications anchored inside the user's waking window; bird "sleeps" outside it). The app reset and notification window follow the wake-up time setting ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909-When-time-does-the-app-reset-Waking-Hours)).
- **Pause Mode** silences/hides most engagement (see §6).
- App can be used fully without notifications enabled (OS-level opt-out).

---

## 4. Widgets

- **What it is**: a home-screen widget showing **what state/activity the birb is currently in** (sleeping, adventuring, waiting, etc.) without opening the app — the app's marketing name literally includes "Widget Pet" ([The Finch Widget](https://help.finchcare.com/hc/en-us/articles/39758423780621-The-Finch-Widget); [Widgets wiki](https://finch.fandom.com/wiki/Widgets)).
- **iOS**: standard widget gallery; **small, medium, large** sizes, larger sizes show more info ([The Finch Widget](https://help.finchcare.com/hc/en-us/articles/39758423780621-The-Finch-Widget)).
- **Android**: added from launcher widget menu; may need manual resize (long-press → drag edges) ([The Finch Widget](https://help.finchcare.com/hc/en-us/articles/39758423780621-The-Finch-Widget)).
- **In-app setup shortcut**: Settings → **Customization** section → "**Add pet widget to homescreen**" (also surfaced as a prompt in settings for new users) ([MakeUseOf review](https://www.makeuseof.com/finch-self-care-widget-pet-app/); [Widgets wiki](https://finch.fandom.com/wiki/Widgets); [New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide)).
- **Refresh behavior**: widget can lag behind the app; opening the app forces a sync. Official troubleshooting for stuck widgets: re-add widget or restart device ([The Finch Widget](https://help.finchcare.com/hc/en-us/articles/39758423780621-The-Finch-Widget); [FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs)).
- **Lock screen**: no officially documented Finch lock-screen widget; users place the standard widget/iOS mechanisms there via OS features (TikTok how-tos exist) **[unverified as an official feature]**.
- Widgets are **free** (not Plus-gated).

Telegram Mini App mapping note: no widget surface exists in Telegram; nearest equivalents are the bot's pinned message/chat avatar updates, Telegram's home-screen shortcut, and scheduled bot messages mirroring widget states.

---

## 5. Alarm / Wake-up & Day-Cycle Features

Finch has **no alarm-clock feature**. The wake-up-adjacent mechanics are:

- **Waking Hours** (Settings → Account → Profile → Waking Hours): user sets a **Wake-up time**; the Finch day **resets ~2 hours before** that time (wake at 7:00 AM → day resets ~5:00 AM). Day boundaries, streak days, Goal-of-the-Day reset, and the seasonal-event calendar all key off this, not midnight ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909-When-time-does-the-app-reset-Waking-Hours); [FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs)).
- **Sleep time** setting: controls when the birb visibly winds down/falls asleep in-app; does **not** affect day reset ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909-When-time-does-the-app-reset-Waking-Hours)).
- **Morning notification** at wake time ("just woke up") and **bedtime wind-down notification** ~9 PM act as soft alarm/wind-down nudges ([Pushkeen](https://pushkeen.ai/apps/Finch)).
- Sleep-supporting content: sleep-type breathing exercises, sleep goal suggestions (e.g., "Avoid caffeine after 3PM", "Stop using phone 1 hour before bed") ([Goals wiki](https://finch.fandom.com/wiki/Goals)).

---

## 6. Full Settings Menu Structure (reconstructed from official docs + wiki)

Entry: **hamburger menu (three lines), top-left of Home** ([Exploring the Finch Home Page](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page)). Layout:

- **Header**: user/birb name + **Friend Code** (tap to copy) ([Adding Friends](https://help.finchcare.com/hc/en-us/articles/37780316582413-Adding-Friends))
- **Finch Plus banner** (blue; subscribe entry point) ([How to Subscribe](https://help.finchcare.com/hc/en-us/articles/37780175015693-How-to-Subscribe-to-Finch-Plus))
- **App features section**: Activities (Goal Ideas, Reflections, Breathing, Soundscapes, Movements, Quizzes, Timers, Act of Kindness, First Aid) · My Goals (incl. paused/archived) · My Self-care Areas · Insights (Mood Calendar, Mood Breakdown, Tags, Goals, Reflections stats) · Newsletters · History ([Finch App wiki](https://finch.fandom.com/wiki/Finch_App))
- **Transient items**: "Claim rewards from last event" (visible ≤14 days post-event); fundraiser celebration button ([Finch Secrets wiki](https://finch.fandom.com/wiki/Finch_Secrets); [Claiming Past Seasonal Event Rewards](https://help.finchcare.com/hc/en-us/articles/37780490760077-Claiming-Past-Seasonal-Event-Rewards))
- **Community section**: official communities links (Facebook group, Discord, subreddit) · **Become a Guardian** (incl. raffle entry) ([Finch App wiki](https://finch.fandom.com/wiki/Finch_App); [Get in Touch](https://help.finchcare.com/hc/en-us/articles/37780359337101-Get-in-Touch-Email-Options))
- **Customization section**: Add pet widget to home screen ([MakeUseOf](https://www.makeuseof.com/finch-self-care-widget-pet-app/))
- **Account section**:
  - **Profile** — Create Account / login state; **Waking Hours** (wake-up time, sleep time); birb name/pronouns ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909-When-time-does-the-app-reset-Waking-Hours); [Accounts and Cloud Backups](https://help.finchcare.com/hc/en-us/articles/41834952026381-Accounts-and-Cloud-Backups))
  - **Your data** — Cloud backup; Manual backup (Create/Load); **Export data** (writings only); **Data management tool** (prunes old data when writings exceed the **100 MB** backup limit); **Delete Data** ([Data Backup and Recovery](https://help.finchcare.com/hc/en-us/articles/37780313999757-Data-Backup-and-Recovery); [Backups wiki](https://finch.fandom.com/wiki/Backups))
  - **Preferences** — **Seasonal Events** (enable/disable events; claim last-season rewards) · **App Experience → Muted tags** (free-text word/phrase filter for suggestions, prompts, quotes) · **Muted exercises** manager · **Enable Quizzes** toggle · goal-completion **Celebration style**: "Quick Cheers" (banner) vs "Prompt to reflect" (popup) ([Seasonal Event Overview](https://help.finchcare.com/hc/en-us/articles/37780438941965-Seasonal-Event-Overview); [Muting Tags and Exercises](https://help.finchcare.com/hc/en-us/articles/37936910835341-Muting-Tags-and-Exercises); [How to Enable Quizzes](https://help.finchcare.com/hc/en-us/articles/37945062934029-How-to-Enable-Quizzes); [Goals wiki](https://finch.fandom.com/wiki/Goals))
  - **Notifications** — global notification settings ([Finch App wiki](https://finch.fandom.com/wiki/Finch_App); granular layout **[unverified]**)
- **Pause Mode** — choose number of days + optional reminder; streak frozen & preserved; most features (incl. goals) hidden; First Aid Kit stays accessible; countdown screen with early-exit button ([Pause Mode](https://help.finchcare.com/hc/en-us/articles/37936144770701-Pause-Mode))
- **Restore Finch Plus Purchase** ([How to Restore](https://help.finchcare.com/hc/en-us/articles/38508647189389-How-to-Restore-Your-Finch-Plus-Subscription))

Sound: **no in-app sound settings at all** — audio follows the device ringer/volume entirely ([Sound Settings](https://help.finchcare.com/hc/en-us/articles/39759518297229-Sound-Settings)).

Language: **English only**; no in-app language setting ([Language Availability](https://help.finchcare.com/hc/en-us/articles/39759326038029-Language-Availability)).

---

## 7. Accessibility & Content-Safety Options

- Apple listing: developer has not declared supported accessibility features ([App Store](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748)). No documented dark mode, text-size, or reduce-motion settings **[unverified — likely follows OS where applicable]**.
- Inclusivity options that function as accessibility/identity features: birb **pronouns changeable anytime**, **mobility-aid** cosmetic items, **pride flags**/Pride Collection items ([Internet Matters](https://www.internetmatters.org/advice/apps-and-platforms/wellbeing/finch/); search summary of MakeUseOf/wiki).
- **Content safety**: Muted Tags (free-text filtering of triggering words from all suggestions/prompts/quotes) and Mute Exercise (per-exercise, via 3-dot menu) ([Muting Tags and Exercises](https://help.finchcare.com/hc/en-us/articles/37936910835341-Muting-Tags-and-Exercises)); custom adventure responses are deliberately NOT saved as discoveries so unwanted topics never persist ([New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide)).
- **First Aid Kit**: crisis-support shortcut; auto-pinned to top of goal list after a negative mood log; always reachable from Pause Mode ([Mood logger wiki](https://finch.fandom.com/wiki/Mood_logger); [Pause Mode](https://help.finchcare.com/hc/en-us/articles/37936144770701-Pause-Mode)).
- No parental controls ([Internet Matters](https://www.internetmatters.org/advice/apps-and-platforms/wellbeing/finch/)).

---

## 8. Account, Data Export & Deletion

### Accounts
- Optional. Default = **all data local-only on the device**; uninstalling **wipes everything** ([Data Backup and Recovery](https://help.finchcare.com/hc/en-us/articles/37780313999757-Data-Backup-and-Recovery); [Backups wiki](https://finch.fandom.com/wiki/Backups)).
- Account creation: new users verify a **phone number**; legacy users have email+password "Cloud Backup" accounts (system later renamed Accounts). Existing users: Settings → Profile → Create Account ([Accounts and Cloud Backups](https://help.finchcare.com/hc/en-us/articles/41834952026381-Accounts-and-Cloud-Backups)).
- Password rule (community-observed): ~6+ chars incl. capital + number **[unverified]** ([Backups wiki](https://finch.fandom.com/wiki/Backups)).
- No Google/Facebook sign-in; Finch doesn't know user identities; reflections/writings stored on-device only, not on servers ([MakeUseOf](https://www.makeuseof.com/finch-self-care-widget-pet-app/); old Finch FAQ via search).

### Backups
- **Cloud Backup**: auto-generated, **encrypted**, synced **once every 24 h** in background while the app is used; Finch staff cannot read it; disabling Cloud Backup deletes the server file ([Accounts and Cloud Backups](https://help.finchcare.com/hc/en-us/articles/41834952026381-Accounts-and-Cloud-Backups); [Backups wiki](https://finch.fandom.com/wiki/Backups)).
- **Manual Backup**: Settings → Your data → Manual Backup → Create Backup File; produces a `.zip` named `finchBackup_<birbname>...`; user stores it anywhere; multiple generations possible. Load via first-launch "Log In → Manual Backup" or Your data ([Data Backup and Recovery](https://help.finchcare.com/hc/en-us/articles/37780313999757-Data-Backup-and-Recovery); [Backups wiki](https://finch.fandom.com/wiki/Backups)).
- Corrupted-save compensation: support can manually re-gift up to **30 items** + estimated rainbow stones; corrupted cloud file → fresh start + **5,000 rainbow stones** restitution ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs); [Backups wiki](https://finch.fandom.com/wiki/Backups)).
- Writings cap for backups: **100 MB** (Data management tool prunes) ([Backups wiki](https://finch.fandom.com/wiki/Backups)).

### Export & deletion
- **Export data**: downloads the user's writings only (explicitly *not* a backup) ([Backups wiki](https://finch.fandom.com/wiki/Backups)).
- **Delete**: Settings → Your data → **Delete Data** → type "DELETE" → confirm; server-side deletion completes **within 90 days**, usually faster (old official FAQ via [search](https://befinch.notion.site/Finch-FAQ-474652d0123d4883ac7a0cd6c8f5aa70); YouTube walkthroughs corroborate flow).
- Apple privacy label: linked data = User ID, Device ID (analytics/personalization/functionality); not-linked = purchase history, user content, product interaction, crash & performance data ([App Store](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748)). Privacy policy: https://www.iwantfinch.com/privacy-policy.

---

## 9. Adjacent monetization-relevant mechanics (quick reference)

- Dual currency: **Energy** (goal/activity completions → energizes bird for adventures; e.g., goals 5⚡ base, 7⚡ after negative mood log; meditation timer 6+⚡, focus timer 10+⚡) and **Rainbow Stones** (quests, event days, milestones, post-adventure goal completions; goals 3🌈 base, 4🌈 after negative mood log; spent in shops). ([Energy vs. Rainbow Stones](https://help.finchcare.com/hc/en-us/articles/37780134479757-Energy-vs-Rainbow-Stones); [Mood logger wiki](https://finch.fandom.com/wiki/Mood_logger))
- Sell-back: items resell for **50% of original stone cost** ([Selling Items](https://help.finchcare.com/hc/en-us/articles/37945437161229-Selling-Items)).
- Streak repairs: purchasable with Rainbow Stones; free Streak Repair Saver earned **every 3 adventures**, max **2 banked** ([Understanding Streaks](https://help.finchcare.com/hc/en-us/articles/37780736136205-Understanding-Streaks)).
- Seasonal events unlock after **3 days** of use; post-event claim window **14 days**; rewards claimable only for fully-energized days ([New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide); [Claiming Past Seasonal Event Rewards](https://help.finchcare.com/hc/en-us/articles/37780490760077-Claiming-Past-Seasonal-Event-Rewards)).
- Micropet egg hatches after **7 completions** of the linked goal ([Using the Micropet Lab](https://help.finchcare.com/hc/en-us/articles/37780505907469-Using-the-Micropet-Lab)).
- Invite rewards for referring new users via invite link ([Invite Rewards](https://help.finchcare.com/hc/en-us/articles/37780423805069-Invite-Rewards)).
- Support contact map: support@ (general/billing), community@, shop@ (merch), guardians@, gifts@, partnerships@, press@ — all @befinch.com ([Get in Touch](https://help.finchcare.com/hc/en-us/articles/37780359337101-Get-in-Touch-Email-Options)).

## 10. Open items to verify in-app before build

1. Exact layout/toggles of the global Notifications settings screen (per-type switches, time pickers).
2. Current base annual price behind the loyalty-discount ladder (wiki table implies an older/regional ~$97.99 base vs current $69.99 list).
3. Which trial (3-day vs 7-day) is shown to which cohort, and current intro-offer SKU mapping ($34.99/$39.99/$41.99/$49.99/$59.99).
4. Free save-slot counts for outfit/decor/color combinations (Plus = unlimited; free limit number undocumented).
5. Exact count of rare-item slots free vs Plus in each shop.
6. Whether an official iOS lock-screen widget exists in current builds.
