# Finch Teardown — Onboarding & Core Pet Loop

Research area: first-run flow, growth stages, energy mechanic, adventures/travel, daily check-in
rhythm, Rainbow Stones earning, hatching/multiple pets, pet aging.
Compiled 2026-06-11 for a 1:1 mechanics rebuild (original art/text) as a Telegram Mini App.

App: "Finch: Self-Care Pet" by Finch Care Public Benefit Corporation. iOS version at research
time: 3.73.176 (released 2026-06-09), 4.95 avg rating / 711k ratings, Health & Fitness, 4+
(iTunes lookup API, app id 1528595748).

Primary sources:
- Official help center: https://help.finchcare.com (Zendesk; article URLs cited inline)
- Fan wiki: https://finch.fandom.com (pages cited inline; numbers are community-measured)
- App Store listing: https://apps.apple.com/us/app/finch-self-care-pet/id1528595748
- Onboarding walkthrough: https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/
- Reddit r/finch and TikTok corroboration where noted

Confidence markers: [OFFICIAL] = from Finch's own help center / store listing. [WIKI] =
community wiki (usually accurate, occasionally stale). [3P] = third-party review/teardown.

---

## 1. First-Run Flow (Onboarding)

Source of record: "Creating Your Birb" — https://help.finchcare.com/hc/en-us/articles/37779580853005-Creating-Your-Birb [OFFICIAL]
plus the Pratt design critique (screen-by-screen) and wiki "Birb" page (https://finch.fandom.com/wiki/Birb).

Step order:

1. **Launch / entry screen.** Two paths: "Hatch a New Pet" (new user) or "Log In" (returning —
   phone number + verification code for newer accounts, or email+password for legacy Cloud
   Backup accounts, or manual backup file import).
   (FAQs: https://help.finchcare.com/hc/en-us/articles/41672084300557-FAQs [OFFICIAL])
2. **Egg / color selection.** Choose one of **6 colored eggs**: Blue, Orange, Pink, Green,
   Purple, Gray. The hatched baby birb is that color. More colors unlock later via dyes.
   (Creating Your Birb [OFFICIAL]; wiki Stages_of_Growth [WIKI])
3. **Egg hatches into the baby birb** (the only time hatching happens for the main pet).
4. **Pronouns.** Pick she/her, he/him, or they/them. Changeable later in settings. [OFFICIAL + WIKI]
5. **Name the birb.** Free text; a "randomize" option exists for the indecisive; renameable
   later. [WIKI Birb page; OFFICIAL confirms changeable later]
6. **Choose a main trait.** The birb "starts with a boost" in the chosen area. [OFFICIAL]
   Trait options observed by reviewers include curious, brave, silly, compassionate
   ([3P] https://dishabhatia.substack.com/p/the-self-care-bird-app-finch ;
   https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/).
   The birb's tracked personality dimensions (which adventure-chat answers later feed) are:
   **confidence, curiosity, security, resilience, compassion, logic**
   (wiki Birb page [WIKI]) — the starting trait maps onto one of these.
7. **Enter the user's own name** (birb addresses you by it; changeable later). [OFFICIAL]
8. **Birb asks a short question**; user picks the answer that resonates. [OFFICIAL]
9. **Quick walkthrough** of how Finch works + optional short survey ("Have you used Finch
   before?" etc.). Progression is via a persistent green CTA button at the bottom of each
   onboarding screen; a progress bar appears in the second onboarding section. [OFFICIAL + 3P Pratt]
10. **Starter goals are pre-seeded.** "When you first join Finch, you will automatically start
    with a few goals" to teach the loop; completing them energizes the birb toward its **first
    adventure**. (New User Guide — https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide [OFFICIAL])
11. **Widget prompt.** App settings prompt the user to add the home-screen widget as a check-in
    reminder. [OFFICIAL New User Guide]
12. **Account creation** is by phone-number verification at join time (or later via
    Settings > Profile > Create Account). Data is otherwise local; cloud backup syncs every
    24h in background once an account exists.
    (Accounts and Cloud Backups — https://help.finchcare.com/hc/en-us/articles/41834952026381 [OFFICIAL])
13. **Invite attribution window:** a new user can enter an inviter's friend code / referral link
    in a "Did someone invite you?" section within **48 hours** of account creation; the invitee
    receives a micropet chosen by the inviter.
    (Invite Rewards — https://help.finchcare.com/hc/en-us/articles/37780423805069 [OFFICIAL])
14. **Trials:** new users get a **3-day free Finch Plus trial that ends automatically** (no
    subscription) and there is a separate **7-day trial that auto-converts** unless canceled;
    one trial per account/email. (FAQs [OFFICIAL])
15. **Seasonal events unlock after 3 days** of app use — deliberately hidden from brand-new
    users. (New User Guide [OFFICIAL])

Free vs Plus: the entire onboarding flow is free. Plus is only pitched via banners/trial after
the core loop is established.

---

## 2. The Finch "Day" (Waking Hours) and Daily Check-In Rhythm

### Day reset
- Finch does **not** reset at midnight. The Finch day resets **~2 hours before the user's set
  wake-up time** (e.g. wake time 7:00 AM → reset ~5:00 AM). Configured in Settings > Profile >
  Waking Hours.
  (Waking Hours — https://help.finchcare.com/hc/en-us/articles/37937593248909 [OFFICIAL])
- A separate **"Sleep time"** setting controls when the birb visually winds down / falls asleep
  on screen; it does NOT affect the day reset. [OFFICIAL same article]
- **Energy resets to zero** at the start of each Finch day. (wiki Energy —
  https://finch.fandom.com/wiki/Energy [WIKI])
- Missing a day on the seasonal calendar = a day with no completed adventure; the calendar is
  day-indexed, not real-time-synced. (FAQs [OFFICIAL])

### Daily rhythm (target loop)
Per the App Store description [OFFICIAL]: mornings = quick mood check + energize the pet to go
exploring; evenings = the pet is back from its adventure to share stories, plus gratitude/
reflection exercises before bed.

Concretely, one ideal day:
1. **Morning:** open app → birb greets you → log mood (see below) → review today's goal list →
   start checking off goals (each gives Energy + Rainbow Stones).
2. **Midday:** energy bar fills → at full energy the **Adventure button** appears → birb departs
   for a multi-hour adventure → continued goal completions now shorten the adventure and pay
   stones instead of energy.
3. **Evening:** birb returns → **"Chat with Your Birb"** becomes available (**once per day,
   only after the daily adventure**) → birb tells an adventure story, possibly with a
   Discovery → user answers → personality grows → evening reflection prompts (Night category) →
   birb gets visibly sleepy near the set sleep time.
   (Exploring the Finch Home Page — https://help.finchcare.com/hc/en-us/articles/37780000231309 [OFFICIAL])
4. **Streak** ticks up just from opening the app/checking in that day. (Understanding Streaks —
   https://help.finchcare.com/hc/en-us/articles/37780736136205 [OFFICIAL])

### Mood check-in (mood logger)
- Current behavior: the mood logger does **not** auto-pop on open; it sits in the upper-right
  corner of the home screen (tap mood face → "Save", confirmation toast "Your mood is logged!").
  No stones are awarded for logging mood anymore (was previously rewarded).
  (wiki Mood logger — https://finch.fandom.com/wiki/Mood_logger [WIKI])
- Optional "Reflect" step after picking a mood: write thoughts and/or tag causes from category
  chips (people & pets, activities, body & health, environment; "Other" → add custom). [WIKI]
- **Low-mood buff:** picking a mood below "okay" (meh/bad) adds a dismissible **First Aid Kit**
  link to the top of the goal list AND boosts rewards: goals pay **7 energy (instead of 5)**
  and **4 stones (instead of 3)** for the rest of the day. [WIKI Mood logger — key tuning value]
- Mood history feeds the Insights calendar (red = negative days, white = neutral, green =
  positive) and a motivation (start-of-day outlook) vs satisfaction (end-of-day) breakdown. [WIKI]

### Streaks (check-in retention layer)
- Streak counts any day the app is opened. [OFFICIAL Understanding Streaks]
- **Streak Repair:** missing a day can be repaired. Users earn **1 free Streak Repair Saver per
  3 adventures**, capped at **2 stored repairs**; repairs can also be bought with Rainbow
  Stones. [OFFICIAL Understanding Streaks; wiki Streaks https://finch.fandom.com/wiki/Streaks]
- Streak intensity presets when (re)starting: Baby steps / Normal / Intermediate / On fire.
  Higher streaks grant more Rainbow Stones from adventures. Streaks can be toggled off
  entirely. [WIKI Streaks]
- **Pause Mode** (Settings > Account): freezes the streak, hides widgets, stops notifications,
  blocks incoming Good Vibes/Goal Buddy requests; duration selectable 1–7 days (default 3) with
  optional return reminder. (wiki Pause mode — https://finch.fandom.com/wiki/Pause_mode [WIKI];
  official article exists: https://help.finchcare.com/hc/en-us/articles/37936144770701)

---

## 3. Energy Mechanic

Sources: wiki Energy page [WIKI]; "Energy vs. Rainbow Stones" —
https://help.finchcare.com/hc/en-us/articles/37780134479757 [OFFICIAL];
"Going on an Adventure" — https://help.finchcare.com/hc/en-us/articles/37779979512845 [OFFICIAL].

- Energy is the daily progress resource; it resets to 0 at each Finch-day start. [WIKI]
- **Earning energy:** completing goals (custom or suggested), and doing Activities directly
  (Reflections, Breathing, Soundscapes, Movements, Timers, Acts of Kindness, First Aid,
  Quizzes). Nearly everything in the Activities catalog grants some energy. [WIKI Energy]
- **Standard values:** a typical goal completion = **5 energy + 3 Rainbow Stones**
  (boosted to **7 energy + 4 stones** on a logged low-mood day). [WIKI Mood logger]
- **Good Vibes:** first Good Vibe sent to each Tree Town friend per day = **+3 energy +2
  stones** (subsequent vibes to the same friend that day give friendship progress only).
  (wiki Good_Vibes — https://finch.fandom.com/wiki/Good_Vibes [WIKI])
- Reflections display the energy amount they will award before you start. [WIKI Reflections]
- **Energy bar** sits above the goal list on the Home tab and shows progress since day start.
  Full-bar threshold depends on growth stage: **15 / 20 / 25 / 30 / 35** (Baby → Adult). [WIKI Energy + Stages]
- **Full energy → Adventure.** Current app behavior: an **Adventure Button appears on the home
  screen when fully energized; the user taps it to start** the adventure timer. [OFFICIAL Going
  on an Adventure] (Older behavior per wiki: adventure auto-started at full power — if cloning,
  prefer the current explicit button.) Exception: if a travel ticket was bought, the flight
  departs automatically at full energy. [WIKI Energy/Travel]
- **Post-full energy:** the energy bar is replaced by an adventure progress bar. Further energy
  earned (a) shortens the adventure at **2 minutes per energy point** (a 5-energy goal = -10
  minutes) and (b) goal completions now pay Rainbow Stones. [WIKI Energy + Stages_of_Growth;
  OFFICIAL Energy vs. Rainbow Stones confirms "completing goals after your birb has returned
  from / during its daily adventure" pays stones]
- Energizing the birb daily is also the progress driver for **Seasonal Events** (one event day
  of progress per energized day). (Seasonal Event Overview —
  https://help.finchcare.com/hc/en-us/articles/37780438941965 [OFFICIAL])

Free vs Plus: energy earning is identical for free users. Plus only widens the catalog of
activities/durations that can be used to earn it.

---

## 4. Adventures (Core Reward Event) and Travel

Sources: wiki Adventuring — https://finch.fandom.com/wiki/Adventuring [WIKI];
Going on an Adventure [OFFICIAL]; Discoveries — https://help.finchcare.com/hc/en-us/articles/37944252634125 [OFFICIAL];
wiki Travel_with_Sass — https://finch.fandom.com/wiki/Travel_with_Sass [WIKI];
wiki Finchie_Forest — https://finch.fandom.com/wiki/Finchie_Forest [WIKI].

### Adventure lifecycle
1. Reach full energy → tap Adventure button → birb departs with a timer.
2. **Base duration by stage:** Baby ~8h, Toddler ~6–7h, Child/Teen/Adult ~6h. [WIKI Stages table]
3. While away: birb walks through location scenery on the home screen; can still be petted
   (recent update). Goals completed during the adventure shorten it (2 min/energy) and pay
   stones. [WIKI]
4. On return: **adventure chat** ("Chat with Your Birb", once/day). Birb shares a short story;
   user picks one of the multiple-choice replies **or writes a custom reply**. Personality
   grows based on the answer. [OFFICIAL Going on an Adventure]
5. **Discoveries:** some adventures (not all) produce a Discovery — the birb forms a **like or
   dislike** (recorded in the logbook on the birb-profile tab, categorized: Food, Drinks,
   Music, Shows, Movies, etc.). Likes/dislikes are generated by the birb itself — the user's
   chat answer does NOT determine like vs dislike. **A custom (write-your-own) reply skips the
   discovery entirely and the story is not saved** — official opt-out for content that doesn't
   resonate. [OFFICIAL Discoveries + FAQs + Going on an Adventure]
6. Rewards on adventure completion: Energy + Rainbow Stones. [OFFICIAL Going on an Adventure]
   Stones at adventure start scale with **birb friendship level** (+2 at level 1 up to +75 at
   level 10 — full table below) and with streak length. (wiki Friendship —
   https://finch.fandom.com/wiki/Friendship [WIKI]; wiki Streaks [WIKI])
7. The user can optionally write a Reflection about the discovery; doing so suppresses future
   mentions/dreams of it. [WIKI Discoveries/Reflections]

### Adventure counting = pet aging clock
- "Adventure days" are the aging unit: each completed full-energy day/adventure advances stage
  progress (see §5). The birb profile tab shows **hatchday and age**. [OFFICIAL Exploring the
  Finch Home Page; WIKI Stages]

### Locations & Travel ("Travel with Sass" travel agency)
- Starting location for everyone: **Finchie Forest**. All adventures happen there until the
  birb reaches **Child** stage (22 adventures), which unlocks the **Travel with Sass** shop. [WIKI]
- **First flight free; afterwards 300 Rainbow Stones per one-way trip (200 to return to
  Finchie Forest)**. No return tickets — a location must rotate back into the shop to revisit. [WIKI Travel_with_Sass]
- Daily destination offering is a random rotation: **free users see 3 destination choices/day;
  Finch Plus members see 9**. The travel shop cannot be refreshed. [WIKI Travel_with_Sass —
  notes free tier was formerly 2; Plus formerly had a 50%-off slot, retired]
- Travel counts as the day's adventure (same full-energy requirement, same duration; flight
  starts automatically at full energy; if bought after today's adventure, departs tomorrow).
  Buying a ticket is a commitment. [WIKI]
- **27 permanent locations + 3 seasonal** as of May 2026 (wiki Locations —
  https://finch.fandom.com/wiki/Locations). Each location has 4 exclusive clothing + 4
  exclusive furniture items only purchasable while there, and location-specific discoveries.
  Location progress ≈ **2% per adventure** (≈50 adventures to 100%); Finchie Forest is slower
  (67 days). A Logbook screen lists visited locations, % progress, and per-location
  discoveries. [WIKI Travel_with_Sass + Finchie_Forest]
- FAQ confirms destination rotation is random and includes discounted prices on some days.
  [OFFICIAL FAQs]

---

## 5. Growth Stages & Pet Aging

Source of record: wiki Stages_of_Growth — https://finch.fandom.com/wiki/Stages_of_Growth [WIKI]
(corroborated by official Special Quests thresholds in
https://help.finchcare.com/hc/en-us/articles/37943131828749 and wiki Quests page).

Stage advancement is driven purely by **cumulative completed adventures** (full-energy days),
not calendar time. The egg is pre-Baby and hatches during onboarding.

| Stage   | Reached at adventure # | Stage length | Full-energy bar | Adventure duration | Unlocks at this stage |
|---------|------------------------|--------------|-----------------|--------------------|------------------------|
| Egg     | (onboarding only)      | —            | —               | —                  | Color choice (6 eggs) |
| Baby    | 1                      | 7 adventures | 15 energy       | ~8 h               | Mr. Prickles' Shop (clothing), Finkea Furnishings (furniture). No appearance edits; Finchie Forest only |
| Toddler | 8                      | 15 adventures| 20 energy       | ~6–7 h             | Birb grows; headpatch/wings turn gray; random beak color assigned; **Color Studio opens** (beak + body dyes) |
| Child   | 23                     | 20 adventures| 25 energy       | ~6 h               | Random headpatch+wings color; Color Studio adds headpatch + wing dyes; **Travel with Sass unlocks** |
| Teen    | 43                     | 25 adventures| 30 energy       | ~6 h               | Random cheeks+feet color; Color Studio adds cheek + feet dyes |
| Adult   | 68                     | terminal     | 35 energy       | ~6 h               | Random tummy color; Color Studio completes (tummy dyes) |

- Official Special Quest "Evolve your birb" milestones match: Toddler (7), Child (22), Teen
  (42), Adult (67) completed adventures. [WIKI Quests, mirroring in-app quest tracker]
- Each stage-up: birb gets physically larger; user is prompted with a randomly assigned color
  for the newly unlocked body part, then can buy dyes to change it. [WIKI]
- **Adult is final — the birb never dies and never stops being playable**; aging continues only
  as a day counter on the profile (hatchday + age shown on the birb profile tab).
  ([OFFICIAL Exploring the Finch Home Page]; corroborated by community content, e.g.
  https://www.tiktok.com/@bokari.the.birb/video/7291696735724899615 "Does your birb die?")
- Growth pacing fast-track: any number of goals can be done in a day but only **one adventure
  per day** counts, so minimum real time to Adult = 67 days of full-energy play.

---

## 6. Rainbow Stones — Earning (Core-Loop Side)

Sources: wiki Rainbow_Stones — https://finch.fandom.com/wiki/Rainbow_Stones [WIKI];
Energy vs. Rainbow Stones [OFFICIAL]; wiki Quests + Self-care Areas + Friendship pages [WIKI];
Daily and Special Quests — https://help.finchcare.com/hc/en-us/articles/37943131828749 [OFFICIAL].

Earning table (all free-tier accessible):

| Source | Amount | Notes |
|---|---|---|
| Goal completion | 3 stones (4 on low-mood day) | plus 5 (7) energy pre-full-bar [WIKI Mood logger] |
| Goal of the Day | randomized bonus stones per tap | user-selected, 1 per day, star icon, resets at day end (official: https://help.finchcare.com/hc/en-us/articles/37780061122957) |
| Full energy / adventure start | base + friendship bonus | friendship bonus by level: +2/+4/+6/+8/+10/+14/+22/+35/+50/+75 (levels 1–10) [WIKI Friendship]; higher streaks also raise adventure stones [WIKI Streaks] |
| Daily Quests | 25 each | small daily tasks; "Claim" button [WIKI Quests; OFFICIAL confirms stones] |
| Weekly Milestones (per Self-care Area) | 20 (2 days) / 50 (4 days) / 100–150 (6 days) | wiki Quests says top tier 100; wiki Self-care Areas says 150 — verify in-app [WIKI] |
| Special Quests (long-term: clothing count, decorations, micropets met, locations visited, stage evolution, friendship level) | 100 per tier | progressive thresholds [WIKI Quests] |
| Friendship level-up (special quest) | 100 | + permanent adventure bonus above [WIKI Friendship] |
| Mr. Prickles daily shop visit | 65–80 free stones once/day | granted on opening the outfit shop [WIKI Rainbow_Stones] |
| First Good Vibe to a friend per day | 2 stones (+3 energy) | [WIKI Good_Vibes] |
| Reflections / activities | varies; shown on each prompt | [WIKI Reflections] |
| Seasonal event daily rewards, chests | varies | event track [OFFICIAL Seasonal Event Overview] |
| Selling items back to shops | half purchase price | [WIKI Journey/Rainbow_Stones] |
| Inviting friends | rewards capped at 3 successful invites; 3 invites → exclusive invite micropet | [OFFICIAL Invite Rewards] |
| Mood logging | 0 (removed; previously rewarded) | [WIKI Mood logger] |

Core-loop spends (detailed in the shops/customization teardown): clothing, furniture, dyes,
travel tickets (300 / 200 to Finchie Forest), streak repairs, daily shop refreshes, 200-stone
fee to send a gift to a Tree Town friend. [WIKI Rainbow_Stones]

Goal "weighting" exploit-adjacent mechanics worth replicating faithfully: each goal can require
1–100 taps/day (counter), and Goal of the Day bonus applies per tap until the goal is fully
completed. [WIKI Rainbow_Stones + Self-care Areas]

---

## 7. Hatching & Multiple Pets

- **Exactly one main birb per account.** There is no rebirth/second-birb mechanic; multiple
  birbs require separate accounts/save files. (FAQs [OFFICIAL]; community confirmations, e.g.
  TikTok "How to have more than 1 bird on Finch" guides all conclude one per account.)
- The multi-pet collection layer is **Micropets** — small companions that walk beside the birb,
  with unique idle/walk/sleep animations and voices; **62 exist as of June 2026**.
  (wiki Micropets — https://finch.fandom.com/wiki/Micropets [WIKI])
- **Hatching micropets (Professor Oat's Lab / Micropet Lab,** in Bag tab > Micropets > Lab
  icon): link a random micropet egg to one of your goals; **completing that goal 7 times
  hatches the egg into a random micropet** (commons + past-event rares; duplicates possible —
  duplicates can be kept as baby + adult variants). Changing the linked goal resets progress
  to zero. Only one linked egg at a time; a new egg is available after each hatch.
  (Using the Micropet Lab — https://help.finchcare.com/hc/en-us/articles/37780505907469
  [OFFICIAL]; wiki Micropets [WIKI])
- **Micropet aging:** micropets hatch as babies and become **fully grown adults after 15
  adventure days**. [WIKI Micropets]
- Other micropet sources: seasonal event reward (**Day 25 free track / Day 20 Finch Plus
  track**) [OFFICIAL Seasonal Event Overview]; inviting 3 friends (exclusive invite micropet,
  Cookie the Cow per wiki); being invited (gifted micropet chosen by inviter, once);
  co-op egg hatching with friends (newer feature). [WIKI Micropets; OFFICIAL Invite Rewards]
- Each micropet has its own settings (rename, pronouns); equip/unequip from Bag > Micropets;
  unequipped pets live in the "Micropet Playland". [WIKI Micropets; OFFICIAL FAQs]

---

## 8. Home Screen / Navigation Map (for screen-flow parity)

(Exploring the Finch Home Page — https://help.finchcare.com/hc/en-us/articles/37780000231309 [OFFICIAL];
wiki Finch_App — https://finch.fandom.com/wiki/Finch_App [WIKI])

- **Top-left menu (hamburger):** Activities, My Goals, Self-care Areas, Insights, Newsletters,
  History, communities, Guardians raffle, Settings (incl. Waking Hours, Pause Mode, Profile/
  account, Your Data backups).
- **Top-right:** mood logger entry point.
- **Home tab:** birb in current location/birbhouse; energy bar (or adventure progress bar);
  Goal of the Day star; daily goal checklist; "+ Add a goal"; Adventure button (when full);
  Chat with Your Birb (post-adventure, 1/day); pet-by-dragging on the birb (floating hearts +
  burble/cheep audio; ~15 pets = 1 friendship point [WIKI Quests]).
- **Bottom tab bar (6 tabs):** Home / Quests (seasonal event + daily quests + weekly milestones
  + special quests) / Shop (clothing, furniture, dyes, travel) / Friends (Tree Town) / Bag
  (outfits, furniture, colors, micropets, mailbox) / Birb profile (face+name tab: hatchday,
  age, friend code, streak info, personality, discoveries logbook, locations logbook,
  micropedia).
- Goal completion flow: tap goal → checkmark → reward toast (energy/stones); goals can be
  paused, snoozed, edited, completed retroactively via History.
  (Creating and Completing Goals — https://help.finchcare.com/hc/en-us/articles/37779940291213 [OFFICIAL])

---

## 9. Free vs Finch Plus (gating relevant to onboarding/core loop)

(Benefits of Finch Plus — https://help.finchcare.com/hc/en-us/articles/37780200600589 [OFFICIAL];
Finch Plus Pricing — https://help.finchcare.com/hc/en-us/articles/38755205001869 [OFFICIAL];
wiki Finch_Plus — https://finch.fandom.com/wiki/Finch_Plus [WIKI])

- **Everything in the core loop is free:** birb creation, goals, energy, adventures, growth
  stages, discoveries, streaks, mood logging, quests, seasonal events, micropet lab, friends.
  No paid items exist — Plus only adds convenience/options.
- **Pricing:** $9.99/month or $69.99/year USD. Trials: 3-day (auto-ends) + 7-day
  (auto-converts). Loyalty discounts on the yearly plan at 25/50/75/100 lifetime adventures:
  19%→$78.99, 32%→$65.99, 39%→$58.99, 45%→$52.99 (wiki-recorded ladder, base appears to be a
  higher legacy yearly price; verify current in-app). Guardians raffle grants free sponsored
  months for those who can't pay.
- Plus deltas touching this area: 9 vs 3 travel destinations/day; seasonal micropet at Day 20
  vs 25 + extra daily event reward + guaranteed event outfits; all Good Vibes types (18 vs 14);
  all activity durations/content (breathing/soundscapes/movements/timers); extra reflection
  prompts and quizzes; custom goal emojis + Self-care Area colors; 5 newsletters/week vs 1;
  extra rare-item shop slots + daily discount item; unlimited saved outfit/decor/color combos.

---

## 10. Rebuild Notes / Open Questions

1. **Adventure start:** implement as explicit button (current official behavior), with
   auto-start only for purchased travel. Decide whether off-app elapsed time counts (it does in
   Finch — timers run in real time while app is closed).
2. **Verify in-app:** weekly milestone top tier (100 vs 150 stones); base stones at adventure
   start (friendship bonus table is known, base is not documented); exact onboarding question
   text and trait list; exact energy values for each activity type.
3. **One adventure per day** is the pacing governor — energy beyond the bar converts to stones
   + time reduction, never to a second adventure.
4. **Custom chat replies must suppress discovery persistence** (safety/consent feature, called
   out repeatedly in official docs).
5. **Day boundary:** all daily resets (energy, daily quests, Goal of the Day, Mr. Prickles
   gift, good-vibe energy caps, streak tick) key off the user-defined waking-hours reset
   (wake time minus 2h), not midnight — critical for a Telegram Mini App backend.
6. Telegram-specific: Finch leans on iOS/Android home-screen widgets for re-engagement; the
   Mini App analog would be bot push messages timed to the user's waking hours / birb return.
