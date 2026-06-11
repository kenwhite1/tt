# Finch Teardown — Quests, Streaks & Progression

Research area: Daily/Special Quests, Goal Challenges, streaks, weekly milestones, pet growth stages, friendship levels, the adventure/travel map (locations), discovery percentages, and discovery/treasure collection. Compiled 2026-06-11 for a 1:1 Telegram Mini App rebuild (original art/text, identical mechanics).

Primary sources: official Finch Help Center (help.finchcare.com, Zendesk), the community-maintained Finch Fandom wiki (finch.fandom.com), the official App Store listing, and third-party reviews. Wiki numbers are player-measured and should be treated as "best community data" where the official help center is silent; conflicts are flagged inline.

---

## 1. The Quests Tab — Structure & Screen Order

The Quests tab is the 2nd tab in the bottom tab bar (Home / Quests / Shop / Friends / Bag / Birb). Per the official home-page guide, it contains "the monthly seasonal event, daily quests, special quests, and Self-Care Area rewards" ([Exploring the Finch Home Page](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page)).

Top-to-bottom order of the Quests tab (per [wiki: Quests](https://finch.fandom.com/wiki/Quests)):

1. **Monthly section** — banner image for the current Seasonal Event + button to claim today's event rewards; below it the current month's **Goal Challenge** join/progress bar (if any); below that an invitation bar for the current **seasonal location** (if any, e.g. "Go to Midnight Manor" / "Return to…").
2. **Daily Quests** — each pays **25 Rainbow Stones**.
3. **Weekly Milestones** (Self-Care Area rewards) — pay **20 / 50 / 100** stones (see §4 for a 150-stone conflict).
4. **Special Quests** — each completed tier pays **100 stones**.
5. At the very bottom of the Special Quests list: the **birb Friendship points** tracker (current points / points to next level) ([wiki: Friendship](https://finch.fandom.com/wiki/Friendship)).

Reward-claim pattern used everywhere: when a quest's condition is met, the row shows a **"Claim" button**; tapping it grants the stones with a small animation. Activities done *before* opening the tab are credited retroactively — but stones are only granted on tap of Claim ([wiki: Quests](https://finch.fandom.com/wiki/Quests)).

---

## 2. Daily Quests

Source of record: [Help Center — Daily and Special Quests](https://help.finchcare.com/hc/en-us/articles/37943131828749-Daily-and-Special-Quests), [wiki: Quests](https://finch.fandom.com/wiki/Quests).

- **Refresh**: a brand-new set every Finch day. (Note: the "day" does NOT reset at midnight — it resets ~2 hours before the user's configured wake-up time; see §6 Waking Hours.)
- **Count per day**: not stated officially; third-party review reports **4 short quests per day** ([instapv review](https://instapv.co.uk/finch-app-review/)); wiki screenshots show 3–4. Build target: 3–4/day.
- **Reward**: **25 Rainbow Stones per daily quest**, individually claimed.
- **Design intent**: short tasks that tour the app's features ("Quests introduce you to more features of the app" — [New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide)).
- **Documented example quests** (pool, randomly served):
  - "Pet your birb" — swipe a finger across the birb on the home screen; hearts float up the first time each day (official bonus tip in the help article).
  - "Complete a goal" — check off any goal from the Home list.
  - "Send [birb name] on an Adventure" — auto-satisfied when energy bar fills.
  - "Repeat an affirmation 3 times" — deep-links to an affirmation exercise.
  - "Practice Gratitude" — opens a Reflection (journaling) prompt.
  - "Name Your Emotion" — opens the emotion-labeling activity.
  - A Breathing exercise quest — deep-links to guided breathing.
  - "Change one interior item" (furniture swap in the birbhouse).
  - "Change [birb]'s outfit".
  - "Send Good Vibes to a friend".
  - "Answer with friends" — a multiple-choice question; after claiming, the row stays tappable to reveal how friends answered ([wiki: Quests](https://finch.fandom.com/wiki/Quests)).
- **Gating**: Daily Quests are fully free. No Plus-only quests are documented.

---

## 3. Special Quests (long-term progression tracks)

Source: [Help Center — Daily and Special Quests](https://help.finchcare.com/hc/en-us/articles/37943131828749-Daily-and-Special-Quests); numeric tiers from [wiki: Quests](https://finch.fandom.com/wiki/Quests).

- Persistent (never rotate). Each track shows a **progress slider toward the current tier goal**; completing a tier pays **100 Rainbow Stones** via Claim and immediately reveals the next, larger tier.
- There are **six concurrent Special Quest tracks**:

| # | Track | Tier targets (community-collected; "…" = gaps in wiki data) |
|---|-------|-------------------------------------------------------------|
| 1 | Collect (#) pieces of clothing | 1, 5, 10, 20, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 10000 |
| 2 | Obtain (#) decorations (furniture) | same ladder as clothing: 1 … 10000 |
| 3 | Meet (#) Micropets | 1, 3, 5, 8, 11, 15, 20, 40, 60, 100, 125, …, 150 |
| 4 | Visit (#) Locations | 2, 3, 5, 7, …, 13, …, 20, …, 25, **27 (current max — equals total location count)** |
| 5 | Evolve your birb to the next Stage of Growth | tiers at cumulative adventures: Toddler (7), Child (22), Teen (42), Adult (67) — see §7 |
| 6 | Become (friendship level) with your birb | friendship-point thresholds: 2, 4, 8, 15, 30, 40*, 80, 165, 340, 730 — see §8 (*wiki Quests page lists 40; the Friendship page table omits it — treat the Friendship table in §8 as canonical) |

- Petting → friendship points: roughly **15 pats ≈ 1 friendship point** ([wiki: Quests](https://finch.fandom.com/wiki/Quests)).
- **Gating**: all Special Quests are free.

---

## 4. Weekly Milestones (Self-Care Area stars)

Sources: [Help Center — Claiming Weekly Milestones](https://help.finchcare.com/hc/en-us/articles/37945230049677-Claiming-Weekly-Milestones-for-Self-Care-Areas), [Help Center — Self-Care Areas](https://help.finchcare.com/hc/en-us/articles/37780731973133-Self-Care-Areas), [wiki: Self-care Areas](https://finch.fandom.com/wiki/Self-care_Areas), [wiki: Quests](https://finch.fandom.com/wiki/Quests).

- Self-Care Areas (SCAs) are user-defined goal categories (pre-designed options: Productivity, Gratitude, Self-kindness, Calm, Sleep, Hygiene, Movement, Nutrition, Connection). SCAs replaced the legacy "Journeys" system for all users on **May 12, 2025** ([wiki: Journey](https://finch.fandom.com/wiki/Journey)).
- Mechanic: per SCA, per week, count the number of **distinct days** on which the user completed **at least one** goal belonging to that SCA (any goal; doesn't have to be the same one).
- **Star thresholds & payouts** (per SCA, per week — every SCA earns independently):
  - **2 days → 1 star → 20 Rainbow Stones**
  - **4 days → 2 stars → 50 Rainbow Stones**
  - **6 days → 3 stars → 100 Rainbow Stones** per the wiki Quests page; the wiki Self-care Areas page says **150** for 3 stars. ⚠️ Conflict — verify in-app; the Quests-page value (100) is the more recently edited.
- Rewards accumulate in the Quests tab → "Weekly Milestones" section, claimed per star with a small animation.
- **Gating**: free. (Finch Plus adds cosmetic SCA customization only: custom area colors and emojis — [wiki: Self-care Areas](https://finch.fandom.com/wiki/Self-care_Areas).)
- Per official copy, milestones grant "Stars and Rainbow Stones" ([Self-Care Areas](https://help.finchcare.com/hc/en-us/articles/37780731973133-Self-Care-Areas)).

---

## 5. Goal Challenges (monthly 14-day opt-in challenges → profile badges)

Sources: [Help Center — Goal Challenges](https://help.finchcare.com/hc/en-us/articles/43790983772941-Goal-Challenges), [Help Center — June 2026 Goal Challenge](https://help.finchcare.com/hc/en-us/articles/45450409820173-June-2026-Goal-Challenge), [wiki: Goal Challenges](https://finch.fandom.com/wiki/Goal_Challenges), [wiki: March 2026 Spring Clean Challenge](https://finch.fandom.com/wiki/March_2026_Spring_Clean_Challenge).

- **Format**: opt-in, **14 fixed themed goals**, completable across the full calendar month. Joined from the Quests tab (between the seasonal-event rewards and Daily Quests).
- **Join cutoff**: around the **16th** of the month (must leave ≥14 days to finish).
- **Pacing rule**: exactly **one challenge goal can be checked off per day**. Originally strictly in listed order; as of an April 2026 partial rollout, goals may be completed in any order (still 1/day) — including tapping future goals in the full schedule list.
- **No skip option**; all 14 must be completed for the award.
- The next challenge goal is injected into the user's Home goal list after joining; a progress bar ("4 of 14") sits under the seasonal event banner with a tappable full schedule.
- **Reward**: an exclusive **achievement badge displayed on the Birb (profile) tab** — not wearable. Since June 2026 also a **furniture wall-badge item** (cannot be sold, gifted, or shop-purchased) and unlock of a real-money **Seasonal Shop** (collectible IRL pin + stickers; pins made-to-order, ~3–4 weeks to ship; region-limited). The digital badge is free; the pin is optional paid merch.
- **Failure**: if the month ends unfinished, the challenge simply disappears from the home screen; no partial reward.
- **Known challenges**: Mar 2026 "Spring Cleaning" (badge: spring cleaning); Apr 2026 "Friends of Oz" (connect with friends); May 2026 "Good Vibrations" (music); Jun 2026 "Helping Hand" (compassion/helping others).
- Example goal list (March 2026 Spring Cleaning, in order): open windows to air out; wipe light switches/door handles; toss expired pantry/fridge food; wipe fridge drawers/shelves; clean stovetop; wipe desk; declutter one drawer; vacuum under couch; clean a mirror; toss expired toiletries; clean the toilet; change bedsheets; do laundry; remove unworn closet items ([wiki](https://finch.fandom.com/wiki/March_2026_Spring_Clean_Challenge)).
- **Gating**: free for everyone.

---

## 6. Streaks — Full Mechanics

Sources: [Help Center — Understanding Streaks](https://help.finchcare.com/hc/en-us/articles/37780736136205-Understanding-Streaks), [Help Center — New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide), [Help Center — Pause Mode](https://help.finchcare.com/hc/en-us/articles/37936144770701-Pause-Mode), [Help Center — Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909-When-time-does-the-app-reset-Waking-Hours), [wiki: Streaks](https://finch.fandom.com/wiki/Streaks), [wiki: Pause mode](https://finch.fandom.com/wiki/Pause_mode).

### What counts
- **Opening the app once per Finch day is sufficient** — "just checking in is enough." No goal completion required. The streak increments each day the app is opened.

### Day boundary (critical implementation detail)
- A "day" is defined by **Waking Hours**, not midnight. The Finch day resets **~2 hours before the user's set wake-up time** (wake-up 7:00 AM → reset ~5:00 AM). Wake-up time is set under Menu → Profile → Waking Hours. A separate "Sleep time" setting only controls when the birb visually gets sleepy; it does NOT affect the reset ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909-When-time-does-the-app-reset-Waking-Hours)).

### What breaks it
- Failing to open the app for one full Finch day.

### Repair / freeze economy
- **Streak Repair Savers** (wiki calls the consumable a "Streak Repair Hammer"): earn **1 free repair per 3 adventures**, stockpile **capped at 2**. Applying one restores a broken streak ([Understanding Streaks](https://help.finchcare.com/hc/en-us/articles/37780736136205-Understanding-Streaks)).
- **Paid repair**: Rainbow Stones can be spent to repair a streak ([Understanding Streaks](https://help.finchcare.com/hc/en-us/articles/37780736136205-Understanding-Streaks); [wiki: Rainbow Stones](https://finch.fandom.com/wiki/Rainbow_Stones)). The exact stone price is not published in any official doc; the legacy official FAQ ([befinch.notion.site](https://befinch.notion.site/Finch-FAQ-474652d0123d4883ac7a0cd6c8f5aa70)) states the **first streak repair is free**, with stones thereafter. ⚠️ Verify exact stone cost in-app before building.
- **Pause Mode** (freeze): Settings → Account → Pause Mode. Choose **1–7 days (default 3)**, optional check-in reminder. While paused: streak frozen and preserved; most features incl. goals hidden; widgets hidden, notifications stopped; friends can't send Good Vibes or create Goal Buddy links; a dedicated Pause screen shows days remaining; **First Aid Kit remains accessible**; can be ended early from that screen ([Pause Mode help](https://help.finchcare.com/hc/en-us/articles/37936144770701-Pause-Mode); [wiki](https://finch.fandom.com/wiki/Pause_mode)).

### Streak goal tiers (re-engagement)
- Returning/new streak users pick one of **4 streak intensity goals**: **Baby steps, Normal, Intermediate, On fire** ([wiki: Streaks](https://finch.fandom.com/wiki/Streaks)). (Exact day-counts per tier not documented — verify in-app.)

### Streak perks & UI
- **Higher streak ⇒ more Rainbow Stones from each adventure** (scaling bonus; exact curve undocumented) ([wiki: Streaks](https://finch.fandom.com/wiki/Streaks)).
- Rewards are granted for maintaining streaks (milestone rewards exist but values are undocumented; surface in streak detail screen).
- **Streak calendar** view: shows streak start date and days a Repair was used.
- Tracks and displays **current streak** and **longest-ever streak** (persists after a break).
- **Streaks can be toggled off entirely** (streak screen → top-right menu) and shared via a share button.
- Streak info lives on the **Birb profile tab** (hatchday, age, friend code, streak info — [Home Page guide](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page)).
- **Gating**: streak system entirely free; no Plus-only streak features documented.

---

## 7. Pet Levels — Stages of Growth

Source: [wiki: Stages of Growth](https://finch.fandom.com/wiki/Stages_of_Growth) (community-measured, stable for years); corroborated by [wiki: Adventuring](https://finch.fandom.com/wiki/Adventuring).

The "level" unit is the **adventure day** (a day the birb reached full energy and adventured). The birb starts as an egg (user picks Blue/Orange/Pink/Green/Purple/Gray; egg color = baby color), hatches, then:

| Stage | Starts at adventure # | Stage length | Full-energy bar | Adventure duration | Unlocks at this stage |
|-------|----------------------|--------------|-----------------|--------------------|------------------------|
| Baby | 1 | 7 adventures | **15 energy** | ~8 h | Mr. Prickles' Shop (clothing), Finkea Furnishings (furniture) |
| Toddler | 8 | 15 adventures | **20 energy** | ~6–7 h | Color Studio (beak + body dyes); random beak color granted |
| Child | 23 | 20 adventures | **25 energy** | ~6 h | Color Studio (headpatch + wing dyes); **Travel Agency (Travel with Sass) unlocks** |
| Teen | 43 | 25 adventures | **30 energy** | ~6 h | Color Studio (cheeks + feet dyes) |
| Adult | 68 | terminal | **35 energy** | ~6 h | Color Studio (tummy dyes) — fully unlocked |

- Pattern: energy requirement rises +5 per stage; adventure duration falls with age.
- Each stage-up is also a Special Quest tier worth 100 stones (§3, track 5).
- There is no separate "user level" — user progression is expressed through streaks, special quests, badges, and the birb's growth/friendship.
- Related: **Micropets** (companion pets) hatch from eggs by linking the egg to a goal and completing that goal **7 times**; a micropet becomes an adult after **15 adventures** ([wiki: Micropets](https://finch.fandom.com/wiki/Micropets)). Micropet count feeds Special Quest track 3. 62 micropets exist as of June 2026.

---

## 8. Friendship Levels (birb bond — the 6th Special Quest)

Source: [wiki: Friendship](https://finch.fandom.com/wiki/Friendship).

Ten named levels. Points come passively from adventures/time and actively from petting (~15 pats ≈ 1 point). Each level-up pays **100 Rainbow Stones** (as a Special Quest tier) plus a **permanent increase to stones earned per adventure**:

| Pts required | Lvl | Name | Adventure stone bonus |
|---|---|---|---|
| 1 | 1 | Pals 🤍 | +2 |
| 2 | 2 | Play Palz 💗 | +4 |
| 4 | 3 | Buddies ❤ | +6 |
| 8 | 4 | Best Budz ❤ | +8 |
| 15 | 5 | Friendzies 💜 | +10 |
| 30 | 6 | Besties 💜 | +14 |
| 80 | 7 | Uber Besties 💙 | +22 |
| 165 | 8 | Twinzies 💙 | +35 |
| 340 | 9 | Soulmates 💛 | +50 |
| 730 | 10 | Uber Soulmates 💛 | +75 |

(Separate, parallel friendship levels exist with each Tree Town friend, raised by exchanging Good Vibes — same 10 names; only the first Good Vibe per friend per day pays stones/energy.)

---

## 9. Adventures & Energy (the daily loop feeding everything above)

Sources: [Help Center — Going on an Adventure](https://help.finchcare.com/hc/en-us/articles/37779979512845-Going-on-an-Adventure), [Help Center — Energy vs. Rainbow Stones](https://help.finchcare.com/hc/en-us/articles/37780134479757-Energy-vs-Rainbow-Stones), [wiki: Energy](https://finch.fandom.com/wiki/Energy), [wiki: Adventuring](https://finch.fandom.com/wiki/Adventuring).

- Energy resets to **0** at the start of each Finch day. Goals, activities (Reflections, Breathing, Soundscapes, Movement, Timers, Acts of Kindness, First Aid) and sending Good Vibes all grant energy; a typical goal grants **5 energy**.
- When the bar hits the stage's full-energy value (§7), the **adventure starts automatically** (help center says an Adventure Button appears — both describe an immediate transition) and the bar becomes an adventure countdown.
- **During the adventure, additional energy shortens the remaining time at 2 minutes per energy point** (a 5-energy goal = −10 minutes) and also yields Rainbow Stones.
- Reaching full energy / starting the adventure pays Rainbow Stones, scaled up by friendship level (§8) and streak height (§6).
- On return, the birb tells a short story; the user answers via multiple-choice or a custom write-in. Answers shape birb personality; there are "no wrong answers" — like/dislike outcomes are NOT determined by the reply. **Custom replies are not saved and void that session's story/discovery** ([Going on an Adventure](https://help.finchcare.com/hc/en-us/articles/37779979512845-Going-on-an-Adventure)).
- "Chat with Your Birb" becomes available after the daily adventure — **once per day** ([Home Page guide](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page)).
- One adventure per day maximum (a second full bar in a day does nothing until tomorrow).

---

## 10. The Adventure Map — Locations & Travel

Sources: [wiki: Locations](https://finch.fandom.com/wiki/Locations), [wiki: Travel with Sass](https://finch.fandom.com/wiki/Travel_with_Sass), [wiki: Finchie Forest](https://finch.fandom.com/wiki/Finchie_Forest), [Help Center — Shops in Finch](https://help.finchcare.com/hc/en-us/articles/37935977276813-Shops-in-Finch-Outfits-Travel-and-More).

### Inventory: 27 permanent locations (as of May 2026) + 3 retired seasonal locations

| Released | Location(s) |
|---|---|
| Default (launch) | **Finchie Forest** (starting location) |
| Oct 2021 | Alps (Europe); Bali (Indonesia); Tokyo (Japan) |
| Dec 2021 | Paro (Bhutan); Sonoran Desert (North America) |
| Apr 2022 | Maui (Hawaii); Paris (France); Serengeti (Tanzania) |
| Jan 2023 | São Paulo (Brazil); Taipei (Taiwan) |
| Aug 2023 | Reykjavik (Iceland) |
| Dec 2023 | New York City (New York) |
| Feb 2024 | London (England) |
| Mar 2024 | Rome (Italy); Vancouver (Canada) |
| Jul 2024 | Cairo (Egypt); Edinburgh (Scotland) |
| Oct 2024 | Amazon Rainforest (South America); Sydney (Australia) |
| Jan 2025 | Bergen (Norway) |
| Jun 2025 | Delhi (India) |
| Jul 2025 | Galápagos Islands (Ecuador) |
| Aug 2025 | Chicago (Illinois) |
| Sep 2025 | Chiang Mai (Thailand) |
| Oct 2025 | Dubrovnik (Croatia) |
| Dec 2025 | Buenos Aires (Argentina) |

(= 27 total; cadence roughly one new city every 1–3 months.)

### Travel rules (Travel with Sass / "Travel Agency", run by NPC Sassafras)
- Unlocks when the birb reaches **Child** stage (22 adventures). Found under Shop tab → Travel.
- **First flight ever is free.** After that: **300 Rainbow Stones per flight**; flying back to **Finchie Forest costs only 200**.
- The agency offers a **random daily rotation of destinations**: **3 choices/day for free users, 9 choices/day for Finch Plus** (historical note: free was once 2; Plus once included a 50%-off slot, now retired). The rotation **cannot** be refreshed with stones.
- Flights are **one-way**; you can't return anywhere (incl. Finchie Forest) until it reappears in the rotation. Buying a ticket is a commitment.
- **The flight replaces that day's adventure** (same duration, no walking scenery). If today's adventure already happened, the flight queues for tomorrow's full-energy moment. Landing yields a discovery at the new location.
- Each destination's popup shows: completion %, special discoveries found-count, and its 4 exclusive clothing + 4 exclusive furniture items (these only appear in Mr. Prickles'/Finkea shop slots while you're at that location; e.g. Finchie Forest: Squirrel Costume 900 stones, Squirrel Hood 900, Mushroom Cap 500, Acorn Cap 500; Maui: Beach Shirt 900, Lei 900, Ukulele, Shave Ice).

### Discovery percentage per location
- **Each adventure adds ~2% location progress → ~50 full-energy days to 100% a location** ([wiki: Locations](https://finch.fandom.com/wiki/Locations)).
- **Finchie Forest is the outlier: ~67 days to 100%** ([wiki: Finchie Forest](https://finch.fandom.com/wiki/Finchie_Forest)).
- Progress is persistent: leaving mid-way keeps the %, and it resumes on revisit.
- Each location holds **15–20 location-specific discoveries** (e.g. **Maui: 21 unique, 8 of which are "special" logged discoveries**; Maui's encounter order is random, unlike most locations which are sequential — [wiki: Maui](https://finch.fandom.com/wiki/Maui,_Hawaii)).
- By 100%, all location-bound discoveries have been found; afterwards daily adventures continue and yield generic personality discoveries.
- At **100%**, the location's logbook picture turns colorful (visual completion state).
- **Location Logbook** (on Birb tab → "Locations"): lists all locations with total count, per-location %, question marks for unvisited/unfound, filter All vs Seasonal, and per-location discovery lists ([wiki: Travel with Sass](https://finch.fandom.com/wiki/Travel_with_Sass)).

### Seasonal (limited-time) locations
Source: [wiki: Seasonal locations](https://finch.fandom.com/wiki/Seasonal_locations).
- Released alongside a seasonal event; live only that month, then removed.
- Invitation bar appears on the **Quests tab** (below event rewards, above Daily Quests): "Go to / Return to (location)".
- **14 unique story Adventure days**, each ending in a story Discovery (not permanently logged; log shows only name + %).
- Entry animation doesn't consume an adventure; adventures start on full energy as usual.
- **Leaving is instant and free** via Travel with Sass (does not count as a flight); the entry shows adventures completed there. Staying past day 14 yields normal discoveries.
- To date: The Midnight Manor (Oct 2025), Wonderland (Feb 2026), Oz (Apr 2026), Cosmic Rest Stop (Jun 2026).

---

## 11. Discoveries (the "treasure" collection from traveling)

Sources: [Help Center — Discoveries](https://help.finchcare.com/hc/en-us/articles/37944252634125-Discoveries), [wiki: Discoveries](https://finch.fandom.com/wiki/Discoveries), [wiki: Unlogged discoveries](https://finch.fandom.com/wiki/Unlogged_discoveries).

- After an adventure the birb may make a **discovery**; not every adventure produces one. Where it does, the birb forms a **like or dislike**, recorded permanently in the logbook (Birb tab → Discovery). Likes display blue, dislikes red; extra intensity can be flagged with a star or fire icon.
- Two classes:
  1. **Logged ("special") discoveries** — like/dislike items in fixed categories. Community-counted category sizes: **Food 122, Drinks 30, Books 55, Music 49**, plus Shows, Movies, Desserts, Activities, etc. Many entries are location-bound (e.g. Croissant→Paris, Deep Dish Pizza→Chicago, Yerba Mate→Buenos Aires, Stinky Tofu→Taipei, Vegemite→Sydney); blank-location entries can be found anywhere.
  2. **Unlogged discoveries** — personality-influencing one-offs that don't enter the logbook; friends can see one's last 4 days of discoveries via Tree Town.
- Custom chat responses skip and discard the discovery (nothing saved) — official behavior for content that doesn't resonate.
- Discoveries categorize into tabs in the Birb profile; viewing is free.
- Personality: replies to adventure chats grow the birb's personality; like/dislike outcomes are predetermined, not reply-driven.

---

## 12. Seasonal Events inside the Quests tab (progression-relevant summary)

Sources: [wiki: Seasonal Events](https://finch.fandom.com/wiki/Seasonal_Events), [Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus), [New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide).

- Monthly themed events; **unlock after 3 days of app use** for new users. 43 events have run as of April 2026.
- Sits at the top of the Quests tab as a day-by-day reward calendar; **each day the birb is fully energized = 1 reward day**.
- Free rewards: mystery chests or stones — orange chest = random clothing, purple = random furniture, black = 88% event item / 12% stones; chest items offer 4 color choices. **Event micropet at day 25 (free) / day 20 (Plus)**.
- Plus rewards: a second daily column with deterministic items (10 color choices), guaranteeing the full event set if played daily.
- After the event: 2-week claim window for earned-but-unclaimed rewards.

---

## 13. Badges / Achievements inventory

Finch has no generic achievements wall; "achievements" are:
1. **Goal Challenge badges** on the Birb profile tab (one per completed monthly challenge; §5), plus the hangable furniture badge (June 2026+).
2. **Special Quest tiers** (§3) — function as incremental achievements with stone payouts.
3. **Weekly Milestone stars** (§4) — repeating weekly achievements.
4. **Streak records** — current + longest streak on profile (§6).
5. **Collection completion** — location % / discovery counts / micropet index (§10–11).
6. **Invite rewards** ([wiki: Invite](https://finch.fandom.com/wiki/Invite); [Invite Rewards help](https://help.finchcare.com/hc/en-us/articles/37780423805069-Invite-Rewards)): 1st accepted new-user invite → Rainbow Stones + animal hood; 2nd → plushie (held item); 3rd → micropet **Cookie the Cow**. Invitee receives a chosen micropet egg (one-time). Rewards only for genuinely new users.

---

## 14. Free vs Finch Plus — for this research area

Source: [Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus). "All of our core self-care features are (and will always be) free."

| Feature | Free | Finch Plus |
|---|---|---|
| Daily Quests, Special Quests, Weekly Milestones | ✅ full | same |
| Goal Challenges + badges | ✅ full | same |
| Streaks, repairs, Pause Mode | ✅ full | same |
| Stages of Growth / friendship levels | ✅ full | same |
| Adventures & discoveries | ✅ full | same |
| Travel Agency destination slots/day | **3** | **9** |
| Seasonal event | 1 chest-or-stones reward/day; micropet day 25 | +1 deterministic reward/day (10 colors); micropet day 20; guaranteed full outfit set |
| SCA cosmetics | default color/emoji | custom colors + any emoji |
| Goal emojis | keyword-assigned icons | any emoji |
| Plus preview | auto-granted free temporary Plus after 3 days of use, no charge, no cancellation needed ([Finch Plus Preview](https://help.finchcare.com/hc/en-us/articles/38087066022285-Finch-Plus-Preview-Explained)) | — |

App Store subscription price points observed: $5.99, $9.99, $34.99, $39.99, $41.99, $49.99, $59.99, $69.99 (+ $7.99 Guardian program) — ([App Store listing](https://apps.apple.com/us/app/finch-self-care-widget-pet/id1528595748)).

---

## 15. Key economy constants cheat-sheet (for implementation)

| Constant | Value | Source |
|---|---|---|
| Daily quest reward | 25 stones | help center + wiki |
| Daily quests per day | 3–4 (verify) | instapv review / wiki screenshots |
| Special quest tier reward | 100 stones | wiki: Quests |
| Weekly milestone rewards | 20 / 50 / 100 stones at 2 / 4 / 6 days per SCA (⚠️ 150 alt value) | wiki: Quests, Self-care Areas |
| Goal Challenge length | 14 goals, 1/day, month window, join by ~16th | help center + wiki |
| Streak repair earn rate | 1 per 3 adventures, max 2 banked | help center |
| Pause Mode duration | 1–7 days, default 3 | wiki: Pause mode |
| Day reset | wake-up time − 2 h | help center: Waking Hours |
| Energy to adventure | 15/20/25/30/35 by stage | wiki: Stages of Growth |
| Adventure duration | ~8h baby → ~6h adult; −2 min per extra energy | wiki: Energy/Stages |
| Stage thresholds | 7 / 22 / 42 / 67 cumulative adventures | wiki: Stages of Growth |
| Friendship levels | 10 levels; pts 1→730; adventure bonus +2→+75; ~15 pats/pt | wiki: Friendship |
| Locations | 27 permanent (+3 retired seasonal), ~2%/adventure, ~50 days to 100% (Finchie Forest 67) | wiki: Locations |
| Location discoveries | 15–20 each (Maui 21, 8 special) | wiki: Locations/Maui |
| Flight cost | 300 stones (Finchie Forest 200), first free; 3 free / 9 Plus daily choices | wiki: Travel with Sass |
| Typical goal energy | 5 energy (= −10 min adventure time) | wiki: Energy |
| Gift fee to friend | 200 stones | wiki: Rainbow Stones |
| Daily shop-visit stones | 65–80 free from Mr. Prickles (outfit shop open) | wiki: Rainbow Stones |
| Micropet egg hatch | linked goal × 7 completions; adult at 15 adventures; 62 micropets | wiki: Micropets |
| Seasonal event micropet | day 25 free / day 20 Plus; black chest 88% item / 12% stones | wiki: Seasonal Events |

### Open questions to verify in-app before build
1. Exact stone cost of a paid streak repair (and whether it scales with streak length).
2. Exact daily quest count (3 vs 4) and the full quest pool.
3. Streak tier definitions (Baby steps / Normal / Intermediate / On fire day targets).
4. Weekly milestone 3-star payout: 100 vs 150 stones.
5. Streak milestone reward schedule (which day-counts grant rewards, and what).
6. Stone payout formula at adventure start (base + friendship bonus + streak bonus).
