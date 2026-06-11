# Finch Teardown — Self-Care Content System

Research date: 2026-06-11. App: "Finch: Self-Care Pet" by Finch Care Public Benefit Corporation (iOS/Android). Latest iOS version at research time: 3.73.176, 4.9★ / 711K ratings, Health & Fitness, age 9+, ~486 MB ([App Store](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748)).

Primary sources: official help center (help.finchcare.com, fetched via Zendesk API), Finch fan wiki (finch.fandom.com, fetched via MediaWiki API), App Store / Google Play listings. All facts cited inline. "Plus" = the paid Finch Plus subscription; everything else is free.

> Positioning note: Finch's stated approach is that ALL core self-care features are free forever; Plus only adds customization, more content variants, and longer durations. There are no Plus-only items or features that block core use ([Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589), [Our Approach to Self-Care](https://help.finchcare.com/hc/en-us/articles/37935669335309)).

---

## 1. Core reward loop (context for all content below)

- Completing goals/exercises earns **Energy** (fills a bar that sends the pet bird on an Adventure) and **Rainbow Stones** (shop currency). Energy resets to 0 at the start of each Finch day ([Energy wiki](https://finch.fandom.com/wiki/Energy), [Energy vs. Rainbow Stones](https://help.finchcare.com/hc/en-us/articles/37780134479757)).
- **A typical self-care goal = 5 Energy + 3 Rainbow Stones.** If the user logged a negative mood that day, goals pay **7 Energy + 4 Rainbow Stones** instead ([Mood logger wiki](https://finch.fandom.com/wiki/Mood_logger)).
- Energy needed for full bar depends on bird growth stage: **15 / 20 / 25 / 30** from Baby→Teen. Adult adventures last 6 hours; each 5 Energy earned during an adventure shortens it by 10 minutes ([Energy wiki](https://finch.fandom.com/wiki/Energy)).
- Linked exercises (breathing, movement, timers, reflections) can pay MORE energy than a plain goal — see per-exercise values in sections below ([Goals wiki](https://finch.fandom.com/wiki/Goals)).
- **Day reset ("Waking Hours")**: the Finch day does NOT reset at midnight. It resets ~2 hours before the user's configured wake-up time (wake at 7:00 AM → reset ~5:00 AM). A separate "Sleep time" setting controls when the bird visually winds down/falls asleep but does not affect reset ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909)).

---

## 2. Goals / tasks system

### 2.1 Creating goals
Flow ([Creating and Completing Goals](https://help.finchcare.com/hc/en-us/articles/37779940291213)):
1. Home screen → "+ Add Goal" button below the current goal list.
2. Type a goal title (e.g. "Take a walk", "Drink water").
3. Optional: assign to a Self-Care Area.
4. Set frequency (daily, weekly, etc.).
5. "More options" → time of day, notifications, etc.
6. Save → appears on home screen and in Settings → My Goals.

- New users start with a few pre-seeded starter goals automatically ([New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693)).
- Custom goals get an auto-assigned icon, sometimes keyword-matched (e.g. "wash", "trash"). Suggested goals come with a fixed emoji; **only Plus members can change goal emojis freely** ([Goals wiki](https://finch.fandom.com/wiki/Goals), [Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589)).

### 2.2 Suggested-goal library (categories + examples)
Two entry points: Activities → "Goal Ideas", and Self-care Areas → goal suggestions. The Activities entry point is partially Plus-gated (the "Sleep goals", "Get active, be happy", "Connect with a loved one" packs show as Plus-locked there), but **the identical suggestions are all free via Self-care Areas** ([Goals wiki](https://finch.fandom.com/wiki/Goals), [Activities wiki](https://finch.fandom.com/wiki/Activities)).

Categories in the Goal Ideas browser: **Suggested** (randomized sampler), **Easy Wins** (formerly "Just survive the day"), **Sleep**, **Exercise/Movement**, **Loved Ones**, **Presence**, **Tidy Up** ([Goals wiki](https://finch.fandom.com/wiki/Goals)).

Representative suggested goals per category (from the wiki's in-game collection; useful as a spec for tone + difficulty):
- **Easy Wins**: get out of bed; drink water; brush teeth; change clothes; take a shower; wash face; take 3 deep breaths; stand up for 10 seconds; step outside once; literally survive the day; name one person who cares for me; just be.
- **Sleep**: avoid caffeine after 3 PM; dim lights before bed; hot shower one hour before sleep; stop using phone 1 hour before bed; airplane mode 30 min before bed; leave bed after 20 min if can't fall asleep; avoid snacking after 7 PM; don't nap; write tomorrow's goals before sleeping; make a gratitude list before sleeping; read something relaxing before bed; use blackout curtains; blue-light glasses; research CBT-I; listen to a SleepCove podcast episode.
- **Exercise**: 3 push-ups; 5 sit-ups; 5 squats; 5 lunges; 5 burpees; 10 crunches; 10 jumping jacks; 10-second plank; stretch; yoga / morning yoga; walk around the neighborhood; 10-minute stroll with a podcast. (Note the deliberately tiny rep counts — micro-goals are a core design principle.)
- **Loved Ones**: tell mom/dad I love them; express gratitude to mom/dad; reach out to a friend; tell an old friend I miss them; share a fond memory; cook a meal for family/a friend; plan a game night; thank someone who made life easier.
- **Presence**: enjoy lunch without multitasking; avoid social media during work; avoid mindlessly using YouTube/Twitter; uninstall apps that don't spark joy.
- **Tidy Up**: make my bed; laundry; wash bed sheets; take out the trash; pick clothes off the floor; organize my closet; clean kitchen countertops; put away one out-of-place item.
- **Kindness/community style suggestions** also surface in "Suggested": donate unused clothes; bake cookies for someone; leave quarters at the laundromat; let someone go ahead in line; buy a warm meal for someone in need; give my umbrella to a stranger; write a positive comment on the internet.
(Source for all: [Goals wiki](https://finch.fandom.com/wiki/Goals).)

### 2.3 Scheduling / repeats / notifications
Per-goal editor options ([Goals wiki](https://finch.fandom.com/wiki/Goals), [Self-care Areas wiki](https://finch.fandom.com/wiki/Self-care_Areas)):
- Repeat frequency: daily / specific cadence (how often), plus **times per day — max 100 completions/day** for a single goal.
- When the goal appears (time of day) and optional push notification per goal.
- Move between Self-care Areas (or leave uncategorized).
- Rename; change emoji (Plus only for arbitrary emoji).
- Share with a friend (Goal Buddies / Accountability Buddies — see §2.6).
- **Link an exercise** (see §2.5).
- Pause (stop scheduling, resume anytime), Archive (stop scheduling, keep history, restorable from Menu → My Goals → Archived), Delete (wipes that goal's history, irreversible).

### 2.4 Completing, skipping, snoozing
- Complete: tap goal → checkmark; earns Energy or Rainbow Stones (stones after the day's adventure has finished) ([Creating and Completing Goals](https://help.finchcare.com/hc/en-us/articles/37779940291213), [Energy vs. Rainbow Stones](https://help.finchcare.com/hc/en-us/articles/37780134479757)).
- **Retroactive completion**: History page → pick past date → mark goal complete ([Creating and Completing Goals](https://help.finchcare.com/hc/en-us/articles/37779940291213)).
- **Skip**: tap goal → kite icon (left) labeled Skip; undoable; app offers an optional reflection on why the goal was skipped ([Goals wiki](https://finch.fandom.com/wiki/Goals)).
- **Snooze**: tap goal → calendar icon (right); snooze for today or an arbitrary duration ([Goals wiki](https://finch.fandom.com/wiki/Goals)).
- **Undo a completion** via the "..." menu on a completed goal (also offers Reflect / Edit) ([Goals wiki](https://finch.fandom.com/wiki/Goals)).
- **Completion celebration setting** (Settings → Account → Preferences): "Quick Cheers" (banner) vs "Prompt to reflect" (popup with reflective questions after each completion) ([Goals wiki](https://finch.fandom.com/wiki/Goals)).

### 2.5 Goal of the Day + exercise linking + micropet link
- **Goal of the Day**: user stars exactly one goal per day; it pins above the list and pays bonus Rainbow Stones; the marker resets at day end ([Goal of the Day](https://help.finchcare.com/hc/en-us/articles/37780061122957)).
- **Link an exercise**: any goal can launch an Activity automatically when tapped (reflection, quiz, breathing, soundscape, timer, movement, send-good-vibes). Linked exercises generally yield more Energy than the flat 5 ([Goals wiki](https://finch.fandom.com/wiki/Goals), [Timers wiki](https://finch.fandom.com/wiki/Timers)).
- **Micropet egg link**: at Professor Oat's Lab, link any goal to an egg; completing that goal **7 times** hatches a random micropet ([Goals wiki](https://finch.fandom.com/wiki/Goals), [FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557)).

### 2.6 Social goal features (summary; full detail belongs to the friends-system teardown)
- **Goal Buddies** (added v3.73.0, Apr 3 2025): two friends share the SAME daily recurring goal, see each other's progress, get notified on the buddy's completion, send encouragement. One buddy per goal; goals with end dates are ineligible; buddied goals became endless in v3.73.52 (Aug 8 2025) ([Goal Buddies](https://help.finchcare.com/hc/en-us/articles/37936388919693), [2025 updates wiki](https://finch.fandom.com/wiki/2025_App_Update_Announcements)).
- **Accountability Buddies** (added Jun 5 2025): one-way goal sharing — only the owner does the goal; any number of friends can follow it, see progress under the Friends tab, and send encouragement; followers can unfollow/mute ([Accountability Buddies](https://help.finchcare.com/hc/en-us/articles/37943772406413)).

---

## 3. Self-care Areas (current goal-organization layer)

Self-care Areas (SCAs) replaced Journeys for all users on **May 12, 2025 (app v3.73.20)** ([Journey wiki](https://finch.fandom.com/wiki/Journey), [2025 updates wiki](https://finch.fandom.com/wiki/2025_App_Update_Announcements)).

- Access: hamburger menu (top-left) → "My Self-Care Areas", or the icon above the home goal list ([Self-Care Areas help](https://help.finchcare.com/hc/en-us/articles/37780731973133)).
- **Pre-designed areas** (each comes with matching goal suggestions): **Productivity, Gratitude, Self-kindness, Calm, Sleep, Hygiene, Movement, Nutrition, Connection** ([Self-care Areas wiki](https://finch.fandom.com/wiki/Self-care_Areas)).
- Users can also create fully custom areas ("Start a New Area"), but goal suggestions only attach to recognized pre-designed names — rename a custom area to a recognized name at any time and suggestions activate ([Journey wiki](https://finch.fandom.com/wiki/Journey)).
- Per-area progress views: how often goals in the area were completed, weekly and all-time progress ([Goals wiki](https://finch.fandom.com/wiki/Goals)).
- **Weekly Milestones (star rewards)**: complete at least one goal in an SCA on N days of the week. Wiki Quests page: 2 days = **20 stones**, 4 days = **50**, 6 days = **100** ([Quests wiki](https://finch.fandom.com/wiki/Quests)); the SCA wiki page lists the 3rd tier as **150** ([Self-care Areas wiki](https://finch.fandom.com/wiki/Self-care_Areas)) — verify in-app, likely 20/50/100 currently. Rewards are claimable per-area, every week, from the Quests tab ([Claiming Weekly Milestones](https://help.finchcare.com/hc/en-us/articles/37945230049677)).
- Areas can be paused / archived (keep progress) / deleted (lose progress, irreversible), same semantics as goals ([Self-care Areas wiki](https://finch.fandom.com/wiki/Self-care_Areas)).
- **Plus gating**: changing an area's color and emoji is Plus-only; renaming is free ([Self-care Areas wiki](https://finch.fandom.com/wiki/Self-care_Areas)).

---

## 4. Journeys (legacy multi-day programs — replaced May 2025)

Worth speccing because the orchestrating team asked for them; mechanics may inform a "programs" feature.

### 4.1 Regular ("My Journeys") — user-built programs
- Created via menu → "My Journeys" → pick a suggested journey topic (with prefab goal ideas) or "Create a new Journey" with custom goals. User chose per-goal cadence (daily / multiple times per day). Creating a journey granted bonus Energy that day ([Journey wiki](https://finch.fandom.com/wiki/Journey)).
- Known suggested-journey names that mapped to today's SCAs during migration: **"Start moving, get healthy" → Movement**, **"So fresh, so clean" → Hygiene** ([Journey wiki](https://finch.fandom.com/wiki/Journey)).
- Rewards: completing a goal N total times (days didn't need to be consecutive) opened **Treasure Boxes** containing Rainbow Stones or clothing items (color often selectable; unwanted clothing sellable for half price) ([Journey wiki](https://finch.fandom.com/wiki/Journey)).
- Journeys supported Pause / Archive / Delete with the same semantics later carried into SCAs ([Journey wiki](https://finch.fandom.com/wiki/Journey)).

### 4.2 Guided Journeys (fixed-curriculum programs, removed earlier)
Only **4** ever existed, each running **~2–4 weeks** with fixed goals, star self-ratings, and Rainbow Stone + clothing rewards ([Journey wiki](https://finch.fandom.com/wiki/Journey), [Guided Journeys - Obsolete wiki](https://finch.fandom.com/wiki/Guided_Journeys_-_Obsolete)):
1. **Boost my energy** — core tasks: splash water on face, high-intensity exercise, Energy Breathing.
2. **Manage anxiety** — core tasks: scheduled "Rant Zone" journaling, rain soundscapes, Anxiety Breathing, 3-3-3 grounding.
3. **Improve my focus** — core tasks: Focus Timer, Focus Breathing, water soundscapes, splash water on face.
4. **Feel more optimistic through gratitude** — gratitude journaling cadence over weeks 1–4, with a setup wizard (science explainer → pick goal → anticipate obstacles → plan to overcome them → self-rating → weekly schedule).
Each guided journey contained 1–4 essential repeating tasks ([Guided Journeys - Obsolete wiki](https://finch.fandom.com/wiki/Guided_Journeys_-_Obsolete)). No guided programs exist in the current SCA system.

---

## 5. Goal Challenges (current opt-in monthly programs)

The de-facto successor to guided journeys: **opt-in 14-goal themed challenges, one theme per month** ([Goal Challenges help](https://help.finchcare.com/hc/en-us/articles/43790983772941), [Goal Challenges wiki](https://finch.fandom.com/wiki/Goal_Challenges)).

- Join from the **Quests tab** (slot between seasonal-event rewards and Daily Quests). Join cutoff around the **16th** of the month so 14 days remain ([Goal Challenges wiki](https://finch.fandom.com/wiki/Goal_Challenges)).
- 14 themed goals; **max one challenge goal per day**; originally strictly sequential, since ~Apr 2026 partial rollout allows any order (still 1/day). The next due goal is injected at the top of the home goal list ([Goal Challenges wiki](https://finch.fandom.com/wiki/Goal_Challenges)).
- Completing all 14 within the month earns: a profile **badge** (non-wearable, shown on the Birb tab), and since June 2026 also a hangable furniture version of the badge + unlock of a real-money **Seasonal Shop** (collectible enamel pin / stickers; pins made-to-order, 3–4 weeks) ([June 2026 Goal Challenge](https://help.finchcare.com/hc/en-us/articles/45450409820173)).
- Known challenges: **Mar 2026 "Spring Cleaning"**, **Apr 2026 "Friends of Oz"** (connection), **May 2026 "Good Vibrations"** (music), **Jun 2026 "Helping Hand"** (compassion) ([Goal Challenges wiki](https://finch.fandom.com/wiki/Goal_Challenges), [June 2026 Goal Challenge](https://help.finchcare.com/hc/en-us/articles/45450409820173)).
- Free for everyone; no Plus gating documented.

---

## 6. Activities hub (exercise library)

Activities lives under the top-left settings menu (moved into Settings Aug 8, 2025, v3.73.52). Sections: **Goal Ideas, Reflections, Breathe, Quizzes, Soundscapes, Movements, Timers, Act of Kindness, First Aid** ([Activities wiki](https://finch.fandom.com/wiki/Activities), [2025 updates wiki](https://finch.fandom.com/wiki/2025_App_Update_Announcements)).

Cross-cutting mechanics:
- Every exercise can be **done immediately** or **linked to a goal** via its "..." menu ("create a linked goal") ([Timers wiki](https://finch.fandom.com/wiki/Timers)).
- **Muting**: any exercise can be muted from its "..." menu; muted exercises are managed in Preferences → Muted exercises. Users can also mute **tags** (words/phrases) in Preferences → App Experience → Muted tags to filter suggestions/prompts ([Muting Tags and Exercises](https://help.finchcare.com/hc/en-us/articles/37936910835341)).
- Sound is governed entirely by device ringer/volume; no in-app volume toggle ([Sound Settings](https://help.finchcare.com/hc/en-us/articles/39759518297229)).

### 6.1 Breathe (guided breathing)
Animated breath-by-breath guidance. **Free: ~7 exercises at 1 or 3 minutes. Plus: ~7 more exercises plus 5- and 10-minute durations** ([Activities wiki](https://finch.fandom.com/wiki/Activities), [Breathe wiki](https://finch.fandom.com/wiki/Breathe)).

Catalogue by mood tab (\* = Plus-only) ([Breathe wiki](https://finch.fandom.com/wiki/Breathe)):
- **Focus**: Focus Breathing; Unwind Breathing\*; Destress Breathing\*
- **Calm**: Calm Breathing; Anxiety Breathing; Relaxation Breathing\*
- **Morning**: Calm Breathing; Energy Breathing; Anxiety Breathing; Alert Breathing\*
- **Night**: Sleep Breathing; Dream Breathing\*; Unwind Breathing\*; Relaxation Breathing\*
- **Energize**: Energy Breathing; Destress Breathing\*; Alert Breathing\*; Stamina Breathing\*
(Unique exercises: Focus, Calm, Anxiety, Energy, Sleep free; Unwind, Destress, Relaxation, Alert, Dream, Stamina Plus. Panic Breathing additionally exists inside First Aid, free.)

### 6.2 Movements (follow-along video exercise)
Timed sets demonstrated by a real person on video; per-move demo first, timer pauses between moves, shuffle supported, body-parts-needed shown up front, early exit pays partial energy ([Movements wiki](https://finch.fandom.com/wiki/Movements)).

**Energy scale: 1 min (2 sets) = 6 ⚡ · 3 min (6 sets) = 18 ⚡ · 5 min (10 sets) = 30 ⚡ · 10 min (20 sets) = 60 ⚡** ([Movements wiki](https://finch.fandom.com/wiki/Movements)).

Free: 5 sets at 1 or 3 min; Plus adds more sets and 5/10-min durations ([Activities wiki](https://finch.fandom.com/wiki/Activities)). Catalogue: **Stretch** — Morning Stretches, Wind Down Stretches, Standing Stretches; **Yoga** — Morning Yoga, Wind Down Yoga, Standing Yoga, Chair Yoga; **Exercise** — Morning Exercise, Couch Exercise, Floor Exercise ([Movements wiki](https://finch.fandom.com/wiki/Movements)).

### 6.3 Timers (meditation + focus)
([Timers wiki](https://finch.fandom.com/wiki/Timers), [Activities wiki](https://finch.fandom.com/wiki/Activities))
- **Meditation Timer** — durations **3 / 5 / 10 / 15 / 20 / 30 / 45 / 60 min**; reward **6+ Energy**; bird sits center-screen; countdown visible; pause/exit allowed (exit forfeits energy).
- **Focus Timer** — durations **10 / 20 / 30 / 45 / 60 min**; reward **10+ Energy**; bird stands center-screen.
- Background sound options for both: mute / forest / rain / fire / ocean. (Activities overview states free tier = 3, 5, 10-min timers with none/rain/forest sounds; Plus unlocks increments up to 1 hour and 2 extra sound choices — i.e. long durations + fire/ocean are Plus.)
- Reflections can be written while the timer runs.

### 6.4 Soundscapes (ambient audio)
**Free: 7 sound sets, play timer 10 or 30 minutes. Plus: all remaining sets + 1-hour and 8-hour timers** ([Activities wiki](https://finch.fandom.com/wiki/Activities), [Soundscapes wiki](https://finch.fandom.com/wiki/Soundscapes)).

Free sets: Water (Alpine River, Forest River, Gentle Stream, Hidden Waterfall, Rushing Waterfall), Rain (Heavy/Medium/Soft/Urban Rain, Japanese Temple Rain, Rainy Leaves/Tent/Umbrella/Window), Boat (Cabin, Canoe, Carrier Ship, Wooden Boat, Wooden Ship), Forest (River/Temperate/Tropical Forest), Home (AC, Air Filter, Clothes Dryer, Clothes Washer, Dish Washer, Fan, Oscillating Fan, Sprinklers), Travel (Airplane Cabin, Boat Waves, Train Cabin), Shop Ambience (Coffee Shop, College Cafeteria, Convenience Store, Cozy Restaurant, Fast Food Restaurant, Home Depot, Music Store, Neighborhood Cafe, Pet Store, Shopping Mall, Street Market, Supermarket).

Plus-only sets (\*): Ocean, Beach, Fire, Jungle, Rustling Fields, Thunder, Wind, Land Animals (18 sounds incl. Cat Purr, Wolves, Crickets…), Bird Songs (10), Water Animals (Dolphins, Whales, Narwhals…), Traffic (Highway, India, London, LA, Netherlands, NYC), Computer Typing, Work Ambience, plus curated **Mixes** (Cozy Cuddles, Boat Voyage, Mystic Mountain, Midnight Reading, Jungle) where multiple sounds layer simultaneously ([Soundscapes wiki](https://finch.fandom.com/wiki/Soundscapes)).

### 6.5 Quizzes (self-assessments)
- **Disabled by default — user must enable**: Menu → Preferences → toggle "enable quizzes in Activities" ([How to Enable Quizzes](https://help.finchcare.com/hc/en-us/articles/37945062934029)). (Sensible default for a 9+ app.)
- Catalogue: **Anxiety Quiz** (recent anxiety levels), **Depression Quiz** (depressive-symptom monitoring), **Stress Quiz** (stress level + coping strategies), **PTSD Quiz**, **Pessimism Quiz** (outlook on future events), **Gratitude Quiz**, **Body Appreciation Quiz**, **Flourishing Quiz** (psychological well-being) ([Quizzes wiki](https://finch.fandom.com/wiki/Quizzes)). Explicit non-diagnostic disclaimer shown.
- Plus unlocks "all options" in quizzes (free tier has a subset) ([Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589)). The official app description says quizzes are "designed with the help of experts"; no public confirmation they are the literal PHQ-9/GAD-7 instruments.

### 6.6 Reflections (journaling)
([Reflections wiki](https://finch.fandom.com/wiki/Reflections), [Activities wiki](https://finch.fandom.com/wiki/Activities))
- **Free Form**: open journal, any length; "the more you write, the more rewards" (reward scales with writing). All entries browsable later via History (calendar view; can also write for past days).
- **Suggested (prompted) reflections** grouped into tabs: **SOS, Calm, Morning, Deep Dives, Night, Big Picture, Energize** (prompts can appear in several tabs). Each prompt displays its Energy reward up front; rewards are Energy or Rainbow Stones.
- Prompt names (build target — write original prompt copy for each):
  - SOS: Deep Dive: Managing Your Triggers; Deep Dive: What would you say to a loved one?; Regroup Time; A Step Toward Healing; Rant Zone; Processing Grief.
  - Calm: Thoughts Dump.
  - Morning: Morning Reflection; Sleep Reflection; Confidence Booster; Affirmation of the Day; Dream Diary.
  - Deep Dives (multi-part guided sequences): Managing Your Triggers; Savoring Pleasant Moments; What would you say to a loved one?; Loving-Kindness.
  - Night: Night Reflections; Today I Learned; Giving Kindness; Appreciating Kindness of Others; Value of Kindness; Deep Thoughts.
  - Big Picture: Memory Lane; Weekly/Monthly/Yearly Lookback; Weekly/Monthly/Yearly Look Forward.
  - Energize: Confidence Booster.
  - Cross-category pool (~30+): Hype Machine; Fun Times; Happiness Magnifier; **Gratitude Jar**; Friendships; Hypothetical Scenarios; Daily Habits; Nutrition; Hot Takes; Affection Practice; Honest Reviews; Growth Mindset; Life Values; Romantic Partners; Living to the Fullest; Opinions; Perspective; Family; Parenting; Spending Habits; Adulting; Meal Time; First Impressions; Feel Better; Moment of Vulnerability; Your Inner Voice; Childhood; Teen Years; Personal Mirror; Work Cooldown.
- **Plus gating**: free users get many prompts; Plus unlocks additional prompts (locked prompt TITLES remain visible to free users, who can answer them via Free Form) ([Activities wiki](https://finch.fandom.com/wiki/Activities), [Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589)).
- **Tags**: auto-tagging (default on, English-only, toggle in Preferences) + manual `#tag` / `#two_word` tags (any language). Tag color = category: Blue "People & Pet", Pink "Activity", Orange "Emotion", Purple "Other". Tag categories have subcategories (People: Family/Friends/Partner/Coworkers/Pet/Other; Activity: Work/Sleep/Exercise/Leisure/Mindfulness/Other). Tag category editable per tag; "Emotion" cannot be manually assigned ([Reflections wiki](https://finch.fandom.com/wiki/Reflections)).
- **Insights from tags**: "Explore your tags" (search/filter/sort) and "lifted you up most / weighed you down most" rankings over 2 weeks / 1 month / 3 months / All Time, computed by counting a tag's appearances in positive vs negative reflections ([Reflections wiki](https://finch.fandom.com/wiki/Reflections), [Insights wiki](https://finch.fandom.com/wiki/Insights)).
- **Privacy model**: journal text stored locally on device, never visible to staff or other users; uninstalling without a backup wipes it; encrypted cloud backups exist (optionally with user-held key that support cannot recover) ([Reflections wiki](https://finch.fandom.com/wiki/Reflections)).

### 6.7 Act of Kindness
Three tabs ([Act of Kindness wiki](https://finch.fandom.com/wiki/Act_of_Kindness)):
- **Friends**: suggestions parameterized with actual friend names (send good vibe; share a song; send a funny meme; remind them they matter; bring up a fond memory; plan a game night; plan lunch/dinner).
- **Community**: addable goals (smile at a stranger; pick up trash; donate clothes; make dinner for someone in need; bake cookies; compliment a stranger; thank a teacher with a gift; pay the toll for the car behind; become a Guardian; invite others to Finch).
- **Values**: kindness reflections (Giving Kindness; Appreciating Kindness of Others; Value of Kindness; Act of Kindness with \*friend\*; Your Story with \*friend\*).
- Only Plus extra: friend-specific suggestion variants ([Activities wiki](https://finch.fandom.com/wiki/Activities)). Each row's "..." = mute or create linked goal.

### 6.8 Gratitude (distributed feature, not one screen)
- Pre-designed **Gratitude** Self-care Area with goal suggestions ([Self-care Areas wiki](https://finch.fandom.com/wiki/Self-care_Areas)).
- **Gratitude Jar** reflection prompt; "Make a gratitude list before sleeping" goal; "Practice Gratitude" daily quest with journaling hook; **Gratitude Quiz**; legacy guided journey "Feel more optimistic through gratitude" ([Reflections wiki](https://finch.fandom.com/wiki/Reflections), [Quests wiki](https://finch.fandom.com/wiki/Quests), [Quizzes wiki](https://finch.fandom.com/wiki/Quizzes), [Journey wiki](https://finch.fandom.com/wiki/Journey)).

---

## 7. First Aid Kit (crisis/distress toolkit — 100% free)

Everything in First Aid is free to all users by design ([Activities wiki](https://finch.fandom.com/wiki/Activities)). Contents ([First Aid wiki](https://finch.fandom.com/wiki/First_Aid)):

- **Grounding exercises**: 3-3-3 Rule; 5 to 1 Technique (5-4-3-2-1 senses countdown); Rainbow Grounding; Name Your Emotion; Body Scan Butterfly (added ~Feb 2025).
- **Breathing**: Anxiety Breathing; Panic Breathing.
- **Reflection prompts**: Managing Your Triggers (Deep Dive); What would you say to a loved one? (Deep Dive); A Step Toward Healing; Rant Zone; Processing Grief; Regroup Time.
- **Other**: Repeat an Affirmation.
- **Helpline button**: red telephone icon (top-right) → findahelpline.com.
- Triggers/entry points: always in Activities; a First Aid Kit goal is **auto-inserted at the top of the home goal list when the user logs a low mood** (dismissable) ([Mood logger wiki](https://finch.fandom.com/wiki/Mood_logger)); First Aid remains accessible even in Pause Mode ([Pause Mode](https://help.finchcare.com/hc/en-us/articles/37936144770701)).

### Name Your Emotion (emotion-granularity exercise)
Three top-level valences → progressively specific emotion words ([Name Your Emotion wiki](https://finch.fandom.com/wiki/Name_Your_Emotion)):
- **Pleasant** (~38 terms: Optimistic, Content, Proud, Peaceful, Excited, Hopeful, Inspired, Loved, Joyful, Creative, Curious, Confident, Safe, Thankful, Energetic, Awe, …)
- **Neutral** (16: Content, Calm, Mellow, Balanced, Thoughtful, Bored, Meh, Indifferent, Tired, …)
- **Unpleasant**, subdivided into **Sad** (27: Lonely, Hurt, Guilty, Grief, Ashamed, …), **Angry** (23: Frustrated, Betrayed, Jealous, Annoyed, …), **Fearful** (22: Anxious, Overwhelmed, Panicked, Worried, FOMO, …), **Down** (16: Stressed, Burned out, Numb, Unfocused, …), **Surprised** (6), **Disgusted** (12).
Also appears as a Daily Quest. (~160 emotion words total — original wording needed for the rebuild.)

---

## 8. Mood check-ins (mood logger / "vibe check")

Current implementation ([Mood logger wiki](https://finch.fandom.com/wiki/Mood_logger)):
- Manual, not forced on app-open (changed in a 2025+ rollout; previously check-ins appeared on open and granted stones — **logging no longer pays Rainbow Stones**). Entry point: mood icon in the top-right of home; users are encouraged to make a goal like "log my mood".
- Emoji mood scale (bad ↔ meh ↔ okay ↔ good ↔ great; 5-point). Two paths after choosing:
  - **Save** — just log it ("Your mood is logged!" toast).
  - **Reflect** — deeper flow: free-text "what made you feel this way" + tappable contributing factors; "Other → Add" opens factor suggestions across categories: people & pets, activities, body & health, environment; multi-select allowed.
- **Low-mood behavior**: choosing a mood left of "okay" (meh/bad) (a) injects a First Aid Kit shortcut goal at the top of the goal list and (b) boosts the day's per-goal rewards to **7 Energy + 4 stones** (from 5 + 3).
- History: mood calendar (red shades = negative, white = neutral, green shades = positive), per-day drill-down with that day's goals (editable retroactively), and a **Mood Breakdown**: average mood by time-of-day filter (Overall/Morning/Afternoon/Evening/Night), average **morning motivation**, and average **end-of-day satisfaction**, over last week/current week/past month; shareable ([Mood logger wiki](https://finch.fandom.com/wiki/Mood_logger), [Insights wiki](https://finch.fandom.com/wiki/Insights)).
- Google Play marketing frames this as "quick mood checks with mood trends to understand what has been lifting you up or bringing you down" ([Play listing](https://play.google.com/store/apps/details?id=com.finch.finch)).

---

## 9. Insights & Newsletters (reporting layer on self-care data)

- **Insights** (menu → Insights): mood calendar + breakdown (§8), goals stats (total completed; most-completed; most-missed; filters 2 weeks / 1 month / 3 months / all time), reflections stats (count, positive vs negative split, same filters), Explore-your-tags ([Insights wiki](https://finch.fandom.com/wiki/Insights)).
- **Newsletters** — 4 weekly in-app digests ([Newsletters wiki](https://finch.fandom.com/wiki/Newsletters)):
  - *The Weekly Feels* (Mon): check-in counts (this vs last vs 2 weeks ago), per-day moods, tags up/down. **The only one free users get.**
  - *The \[Birb\] Times* (Wed): energy gained, affection, personality growth %, logged discoveries.
  - *The Progress Post* (Fri): mindful-exercise counts, reflected-on words, categorical wins (goals vs quizzes vs reflections vs breathing), top exercises.
  - *The Resolve Tribune* (Sat): goals set/completed week-over-week, completed + skipped goal tags.
  - **Plus**: all 4 newsletters (5 updates/week) + full newsletter history; free tier = latest Weekly Feels only ([Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589), [Newsletters wiki](https://finch.fandom.com/wiki/Newsletters)).

---

## 10. Sleep features

Finch has no alarm clock or sleep tracking; sleep support is composed of:
- **Waking Hours** day-reset (reset = wake time − ~2 h) + **Sleep time** setting (bird visibly winds down/sleeps at the set hour — ambient pressure to wind down) ([Waking Hours](https://help.finchcare.com/hc/en-us/articles/37937593248909)).
- **Sleep goal pack** (free via "Sleep" SCA): caffeine cutoff, screen cutoffs, dim lights, blackout curtains, CBT-I research, gratitude list before bed, etc. (§2.2).
- **Night breathing** (Sleep Breathing free; Dream/Unwind/Relaxation Plus) (§6.1).
- **Wind-down Movements** (Wind Down Stretches/Yoga) (§6.2).
- **Soundscapes** with 8-hour overnight timer (Plus) (§6.4).
- **Sleep Reflection** and **Dream Diary** morning prompts (§6.6).
- Evening **satisfaction** check-in feeding the mood breakdown (§8).

---

## 11. Quests layer touching self-care (for completeness)

([Quests wiki](https://finch.fandom.com/wiki/Quests), [Daily and Special Quests](https://help.finchcare.com/hc/en-us/articles/37943131828749))
- **Daily Quests**: rotating small tasks, **25 stones each**; mix of pet-care ("change outfit", "pet your birb") and self-care ("repeat an affirmation 3×", "practice gratitude" → reflection, "Name Your Emotion", breathing exercise, "complete a goal", "send good vibes"). Already-done actions auto-credit; user taps Claim.
- **Weekly Milestones**: the SCA star rewards (§3).
- **Special Quests**: long-term progression (collect N clothes/decor, meet N micropets, visit N locations, evolve bird, friendship levels), **100 stones** per tier.
- **Answer with friends**: daily multiple-choice question; after claiming, user can view friends' answers.

---

## 12. Streaks & Pause Mode (consistency mechanics)

- **Streak counts on app-open check-in** (not goal completion). Four selectable streak intensities when (re)starting: **Baby Steps, Normal, Intermediate, On Fire**. Higher streaks increase adventure stone payouts. Streaks can be toggled off entirely; longest-ever streak is remembered ([Streaks wiki](https://finch.fandom.com/wiki/Streaks), [Understanding Streaks](https://help.finchcare.com/hc/en-us/articles/37780736136205)).
- **Streak Repair**: missed days repairable with a Streak Repair (also purchasable with Rainbow Stones). **Earn 1 free repair per 3 adventures, hold max 2** ([Understanding Streaks](https://help.finchcare.com/hc/en-us/articles/37780736136205)).
- **Pause Mode** (added v3.73.5, Apr 17 2025): freezes/preserves streak, hides goals/widgets/most features, blocks incoming Good Vibes & Goal-Buddy invites, shows a countdown screen; duration **1–7 days (default 3)** + optional check-in reminder; can end early; **First Aid Kit stays reachable from the pause screen** ([Pause Mode](https://help.finchcare.com/hc/en-us/articles/37936144770701), [Pause mode wiki](https://finch.fandom.com/wiki/Pause_mode)).

---

## 13. Free vs Finch Plus — self-care content matrix

| Feature | Free | Finch Plus |
|---|---|---|
| Goals (create/edit/schedule, max 100×/day) | ✅ full | + custom emoji on any goal |
| Goal suggestion library | ✅ all (via SCAs) | same content; extra browse packs in Activities |
| Self-care Areas + weekly milestone stones | ✅ | + area color & emoji customization |
| Goal Challenges (14-day monthly) | ✅ | — |
| Breathing | 5 exercises × 1/3 min | all ~11 exercises × 1/3/5/10 min |
| Movements | 5 sets × 1/3 min | all sets × 1/3/5/10 min |
| Timers | 3/5/10 min, 3 sound options | up to 60 min, +2 sounds |
| Soundscapes | 7 sets, 10/30-min timer | all sets + mixes, 1 h/8 h timers |
| Reflections | free form + many prompts | + extra prompt packs |
| Quizzes (opt-in) | subset | all quizzes |
| First Aid Kit | ✅ everything | — (no gating) |
| Mood logging + insights | ✅ | — |
| Newsletters | Weekly Feels only | all 4/week + history |
| Mood/goal data, history, backups | ✅ | — |

Sources: [Benefits of Finch Plus](https://help.finchcare.com/hc/en-us/articles/37780200600589), [Activities wiki](https://finch.fandom.com/wiki/Activities), [Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus).

**Pricing**: $9.99/month, $69.99/year ([Finch Plus Pricing](https://help.finchcare.com/hc/en-us/articles/38755205001869)). Trials: 3-day free trial (auto-ends, no charge) and a 7-day trial that converts unless canceled; one trial per account ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557)). Loyalty discounts on the annual plan tied to adventure-day counts: 25 days → 19% off ($78.99→ note: wiki quotes a higher base annual price), 50 → 32% ($65.99), 75 → 39% ($58.99), 100 → 45% ($52.99) ([Finch Plus wiki](https://finch.fandom.com/wiki/Finch_Plus)). iOS IAP price points observed: $5.99–$69.99 + $7.99 Guardian tier ([App Store](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748)). Hardship paths: monthly Guardians raffle (sponsored free months) and post-raffle hardship pricing ([FAQs](https://help.finchcare.com/hc/en-us/articles/41672084300557)).

---

## 14. Rebuild notes for the Telegram Mini App (mechanics only)

1. **Content inventory to author (original copy/art needed)**: ~9 pre-designed SCA categories, ~150+ suggested goals across 7 browse categories, ~11 breathing patterns, 10 movement sets (video or animated equivalents), ~60+ reflection prompts incl. 4 multi-part Deep Dives, 8 quizzes, ~160-word emotion taxonomy, 5 grounding exercises, ~70 soundscape loops + 5 mixes, daily-quest pool, 14-goal monthly challenge plans.
2. **Key tunable constants**: goal = 5⚡/3🌈 (7⚡/4🌈 on low-mood days); energy-to-full 15/20/25/30 by stage; movement ⚡ = 6/18/30/60 by duration; meditation timer 6+⚡, focus timer 10+⚡; SCA weekly stars 20/50/100(or 150)🌈 at 2/4/6 days; daily quest 25🌈; special quest tier 100🌈; micropet hatch at 7 completions; goal repeats capped at 100/day; streak repairs max 2, +1 per 3 adventures; pause 1–7 days; day reset = wake − 2 h; challenge = 14 goals, 1/day, join by ~16th.
3. **Safety patterns worth copying**: quizzes opt-in by default; mute any exercise/tag; First Aid always free and surfaced on low mood + during pause; helpline deep-link; custom adventure replies excluded from saved "discoveries"; journals stored client-side/encrypted.
4. **Telegram-specific gaps to solve**: home-screen widget (no Telegram equivalent — consider pinned chat-bot daily message), push notifications via bot messages, local-storage privacy promise harder in a web app (consider client-side encryption), follow-along video movement content licensing.
