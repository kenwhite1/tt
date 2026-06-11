# Finch Teardown — Social / Tree Town

Research date: 2026-06-11. Sources: official Finch help center (help.finchcare.com), Finch FAQ, the Finch fan wiki (finch.fandom.com), App Store / Google Play listings, community write-ups. App version at time of research: iOS 3.73.176.

Scope: Tree Town friend system, friend codes, friend interactions (Good Vibes, hugs, gifts, birb visits), friendship levels, Goal Buddies / accountability, the invite/referral program (Cookie the Cow), leaderboards (or deliberate absence thereof), and privacy controls. Free vs. Finch Plus gating is flagged throughout.

---

## 1. Overview & Design Philosophy

- Finch's social layer lives in a single bottom-nav tab — the **Friends tab**, in-game called **Tree Town** — the 4th tab at the bottom of the screen. It renders a large tree; your birb sits in the middle and friends' birbs perch around it. (https://finch.fandom.com/wiki/Tree_Towns, https://finch.fandom.com/wiki/Invite)
- The entire social system is **support-only, never competitive**. There are **no leaderboards, no rankings, no comparison features** anywhere in the app. Reviewers explicitly call out the absence of competitive accountability as a design choice ("warm and supportive rather than competitive"). (https://calmevo.com/finch-app-review/)
- All friendships are **mutual**: adding/removing a friend syncs on both sides. (https://help.finchcare.com/hc/en-us/articles/37780316582413-Adding-Friends)
- The Friends section's official capability list: invite or add friends via friend code, send Good Vibes, view friends' progress, and track shared goals. (https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page)
- Core social features (adding friends, sending vibes, goal sharing, gifting, invites) are **all free**. Finch Plus only adds 4 extra Good Vibe types (see §4). (https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus, https://finch.fandom.com/wiki/Good_Vibes)

---

## 2. Friend Codes & Adding Friends

### Friend code
- Every account has a permanent **10-digit friend code**. (https://finch.fandom.com/wiki/Invite)
- Where to find it: open the settings/hamburger menu (top-left of the Home tab); the code is shown under your name / your birb's name and can be copied. (https://help.finchcare.com/hc/en-us/articles/37780316582413-Adding-Friends)
- The code doubles as the key for two other systems:
  - New users can enter someone's code in a **"Did someone invite you?"** field during onboarding to credit the referrer. (https://help.finchcare.com/hc/en-us/articles/37780423805069-Invite-Rewards)
  - **Gifting Finch Plus**: after buying a gift subscription you submit the recipient's friend code to apply it. (https://help.finchcare.com/hc/en-us/articles/37972018284685-How-to-Gift-Finch-Plus)

### Add-friend flow (Tree Town → "Add friend" button)
Tapping **Add friend** presents three options (https://finch.fandom.com/wiki/Invite, https://help.finchcare.com/hc/en-us/articles/37780316582413-Adding-Friends):
1. **Invite someone new** — referral flow for non-users; generates a share link via the OS share sheet (SMS, email, Discord, etc.). The link routes to the app store. Includes picking a gift micropet for the invitee (see §7).
2. **Find a friend** — type in another existing user's 10-digit friend code to connect immediately.
3. **Share your link** — shares your own 10-digit code plus an encoded web link via the OS share sheet, for the other person to enter under "Find a friend."

### Friend limits & pagination
- There is **no hard friend cap** — "generally an unlimited amount," though the app reportedly slows with very large lists. (https://finch.fandom.com/wiki/Tree_Towns)
- The tree shows **up to 8 friend birbs per page** around your own. With >8 friends, extra pages are added: a white oval page indicator near the tree trunk plus outlined circles for other pages; tap a circle and swipe to navigate. Friends can be manually rearranged across pages (see §9 settings). (https://finch.fandom.com/wiki/Tree_Towns)

### Finding people to add
- In-app links to **official communities** (Reddit r/finch, Discord discord.gg/finchfam, Facebook group, Instagram, TikTok) live in the settings menu under a "Join our Finch communities" entry; these are the sanctioned venues for code exchange. The fan wiki also runs a Friend Code Exchange page. (https://finch.fandom.com/wiki/Invite, https://finch.fandom.com/wiki/Friend_Code_Exchange, https://apps.apple.com/us/app/finch-self-care-widget-pet/id1528595748)

---

## 3. The Friend Page (tapping a friend's birb)

Tapping a friend's birb in Tree Town opens their **birbhouse view** — you see their birb in its decorated home. From this page (https://finch.fandom.com/wiki/Tree_Towns):

- **Heart icon (top right)** → your Friendship level with that person (see §5).
- **"..." overflow menu (top right)** →
  - Edit the friend's display name (local nickname)
  - **Unfriend** — with a sub-choice: *block future friend requests* or *allow future friend requests*. The unfriended person is **not notified**.
  - **Mute future Good Vibes** from this user
  - Change the emoji associated with the friend
- **Send Good Vibes** button (§4)
- **Send Gift** button (§6)
- **Buddy Up** button — invite them to a shared/joint goal (§8)
- **Goal accountability strip** — any goals the friend shares with you, with streak counts (§8)
- **Latest progress feed** — scrollable list of the friend's 4 most recent in-game events with timestamps: hatched a new micropet, discovered something, traveled to a new location, or birb advanced a growth stage. (https://finch.fandom.com/wiki/Tree_Towns)
- You can **pet a friend's birb** (cosmetic only; no reward). (https://finch.fandom.com/wiki/Tree_Towns)

---

## 4. Good Vibes (core interaction loop)

### Sending
- Flow: Friends tab → tap friend → **Send Good Vibes** → pick a sentiment card → send. Vibes cost nothing (no Rainbow Stones, no Energy). (https://help.finchcare.com/hc/en-us/articles/37780369483533-Sending-Good-Vibes)
- **Daily reward:** the **first** Good Vibe you send to each friend each day grants **+3 Energy and +2 Rainbow Stones**. Subsequent vibes to the same friend that day give no currency but still build Friendship level. (https://finch.fandom.com/wiki/Good_Vibes, https://finch.fandom.com/wiki/Tree_Towns)
- No documented cap on total vibes sent per day; you can send unlimited vibes for friendship/encouragement.
- The vibe menu shuffles its display order on each open. (https://finch.fandom.com/wiki/Good_Vibes)

### Vibe catalog — 14 free + 4 Finch Plus
Free for everyone (each shows a color theme, an emoji symbol, and an animation of your birb acting it out for the recipient) (https://finch.fandom.com/wiki/Good_Vibes):

| Vibe | Color | Symbol | Notes |
|---|---|---|---|
| Birdhouse Love | Yellow | (custom) | Only available if the friend shares their birdhouse |
| Calm | Blue | 🍃 | |
| Encouragement | Green | 🌟 | |
| Good Morning | Light blue | ☀️ | |
| Gratitude | Pink | 🥰 | |
| Hello | Green | 🫲 | |
| High Five | Orange | ✋ | |
| Hugs | Orange | ❤️ | |
| Outfit Love | Light green | 🤩 | Compliments the friend's birb outfit |
| Strength | Yellow | 💪 | |
| Stretch Break | Purple | 🤸 | Nudge to stretch |
| Sweet Dreams | Blue | 🌙 | Goodnight |
| Thoughts | Purple | 💭 | "Thinking of you" |
| Water | Light blue | 🥤 | Hydration nudge |

**Finch Plus–exclusive vibes (4):** Comfort (blue, 😌), Dance (orange, 🕺), Flowers (light blue, 🌻), Kudos (purple, 🙌 — friend's birb claps/cheers). (https://finch.fandom.com/wiki/Good_Vibes; Plus benefit "all available good vibe options" per https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus. Finch Plus pricing context: $9.99/mo or $69.99/yr — https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing)

### Receiving & replying
- Incoming vibes show as a **speech bubble with a red heart** over the sender's birb in your tree. Tapping that birb opens all vibes from that person. (https://finch.fandom.com/wiki/Tree_Towns)
- Alternatively, a **heart icon at the top-right of Tree Town** opens an inbox summarizing all incoming vibes grouped by person, with sender name, birb name, and timestamps; vibes can be answered or cleared (one or all) from here, with or without reading. (https://finch.fandom.com/wiki/Good_Vibes, https://finch.fandom.com/wiki/Tree_Towns)
- When reading a vibe there is a **checkbox to invite the sender's birb over**: the friend's birb then accompanies yours for **~1 hour** wherever it is (on an adventure, outdoors, or in the birbhouse). You can reply with a vibe or just close. (https://finch.fandom.com/wiki/Tree_Towns, https://finch.fandom.com/wiki/Good_Vibes)
- **Nudge mechanic:** if you leave a vibe unanswered for **3 days**, a reminder card appears under your tree and persists until you reply or delete it. (https://finch.fandom.com/wiki/Tree_Towns)
- Receiving also triggers an in-app message plus a short visit animation from the sender's birb. (https://help.finchcare.com/hc/en-us/articles/37780369483533-Sending-Good-Vibes)
- Goal-tie-in: Finch auto-suggests daily goals referencing friends (e.g., "tell <friend> you care about them"), and the Home tab's daily history records who you sent vibes to. (https://finch.fandom.com/wiki/Tree_Towns)

### Ask for a Hug (broadcast)
- At the top of Tree Town sits a birb holding a heart; tapping it sends an **"<user> asked for a hug"** notification to **all** your Tree Town friends, who can each respond with a hug. (https://finch.fandom.com/wiki/Tree_Towns)
- The action is **rate-limited** ("you can't ask for a hug extremely often"); the exact cooldown is not publicly documented — treat as a tunable, roughly on the order of once per day. (https://finch.fandom.com/wiki/Tree_Towns)

---

## 5. Friendship Levels (per-friend progression)

- Each Tree Town friendship has a level, raised by exchanging Good Vibes regularly. Viewed via the heart on the friend's page. (https://finch.fandom.com/wiki/Friendship)
- The **10 named tiers** (shared naming with the separate birb-bonding track): 1 Pals 🤍, 2 Play Palz 💗, 3 Buddies ❤, 4 Best Budz ❤, 5 Friendzies 💜, 6 Besties 💜, 7 Uber Besties 💙, 8 Twinzies 💕, 9 Soulmates 💛, 10 Uber Soulmates 💛. (https://finch.fandom.com/wiki/Friendship)
- For reference, the birb-bonding version of this track uses cumulative point thresholds 1 / 2 / 4 / 8 / 15 / 30 / 80 / 165 / 340 / 730 with per-level rewards; the Tree Town friend track reuses the tier names but its exact point math is not publicly documented — currency rewards remain capped at first-vibe-per-day. (https://finch.fandom.com/wiki/Friendship)

---

## 6. Gifting Items

- From a friend's page → **Send Gift**, or from the Outfit/Furniture shops via a gift option on an item. (https://help.finchcare.com/hc/en-us/articles/37780412676493-Gifting-Items)
- Giftable: **clothes, furniture, and micropets**. NOT giftable: color packs. (https://finch.fandom.com/wiki/Tree_Towns, https://help.finchcare.com/hc/en-us/articles/37780412676493-Gifting-Items)
- **Cost: item price + 200 Rainbow Stones gifting fee per gift.** (https://help.finchcare.com/hc/en-us/articles/37780412676493-Gifting-Items, https://finch.fandom.com/wiki/Tree_Towns)
- **Limit: 1 gift per friend per day**; multiple gifts/day allowed across different friends. (https://help.finchcare.com/hc/en-us/articles/37780412676493-Gifting-Items)
- Sender picks the **gift-box color**. Recipient gets a "<user> sent you a gift" notification. (https://finch.fandom.com/wiki/Tree_Towns)
- Gifting a **seasonal/limited item** triggers a warning that the sender can't repurchase it (seasonal shops recur ~October and December). (https://finch.fandom.com/wiki/Tree_Towns)
- Unwanted gifts can be **sold for 50% of original price**. (https://finch.fandom.com/wiki/Tree_Towns)
- Adjacent: **Finch Plus itself can be gifted**; buyer receives an email, then submits the recipient's friend code. (https://help.finchcare.com/hc/en-us/articles/37972018284685-How-to-Gift-Finch-Plus)

---

## 7. Invite / Referral Program (Cookie the Cow)

- Entry point: Tree Town → Add friend → **Invite someone new**. A rewards page shows the invite ladder. (https://finch.fandom.com/wiki/Invite)
- **Invitee gift:** before sharing, the inviter picks a **free micropet** the new user will receive on joining. Choices rotate; as of Feb 2025: Oatmeal the Llama, Talon the Gryphon, Pinecone the Hedgie, Boopty the Spoopty (ghost), Blizzard the Wizard (polar bear), Aurora the Arctic Fox. The share button is labeled with the pick (e.g., "Send Aurora"). (https://finch.fandom.com/wiki/Invite)
- Attribution: the new user either installs via the referral link or manually enters the inviter's friend code in the **"Did someone invite you?"** section. (https://help.finchcare.com/hc/en-us/articles/37780423805069-Invite-Rewards)
- **Eligibility:** rewards only trigger for genuinely **new** users (someone playing more than a few days won't count). Rewards are one-time per friend and **capped at 3 successful invites total**. (https://finch.fandom.com/wiki/Invite, https://help.finchcare.com/hc/en-us/articles/37780423805069-Invite-Rewards)
- **Inviter reward ladder** (advertised in-app; subject to rotation) (https://finch.fandom.com/wiki/Invite, https://finch.fandom.com/wiki/Legendary_Plushie_Collection, https://finch.fandom.com/wiki/Cookie_the_Cow):
  1. **1st invite:** Rainbow Stones + an animal hood cosmetic for your birb
  2. **2nd invite:** a plushie for your birb to carry (the Grey Finch Plushie, part of the Legendary Plushie Collection)
  3. **3rd invite:** the micropet **Cookie the Cow**
- **Cookie the Cow** specifics: micropet #23 in the micropedia; default pronouns they/them; color variants black & white (default), grey & black, dark brown & light brown; baby and adult forms. Not referral-exclusive — also hatchable at random from Professor Oat's Lab eggs; originally from the May 2024 "Barnyard Bash" seasonal event. Name and pronouns editable in settings. (https://finch.fandom.com/wiki/Cookie_the_Cow)

---

## 8. Goal Buddies / Accountability Features

Finch's accountability is friend-to-friend goal sharing — never public, never ranked. Two modes (https://finch.fandom.com/wiki/Goal_Buddies, https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies):

### A) Share goal progress ("Accountability Buddies")
- From a goal (in the goal editor or from a friend's page), choose a daily goal → **"Just share my goal progress"** → select one or more friends → confirm.
- Selected friends get notified and can then see that goal and its progress in two places: **under their tree on the Friends tab** and **on your profile/friend page** — including **which goal it is and the current streak day-count**. (https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies, https://finch.fandom.com/wiki/Tree_Towns)
- Friends can **encourage you to keep a streak** and, once you complete the goal that day, **praise/celebrate ("send kudos")** on it. (https://finch.fandom.com/wiki/Tree_Towns)
- Sharing has **no expiry** — it runs until the owner stops sharing or the follower unfollows. The owner manages the audience per-goal in the goal editor; followers can unfollow an individual goal, mute its notifications, or unfriend (which removes all visibility). (https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies)
- Only shared goals are visible; followers never see your other goals. (https://finch.fandom.com/wiki/Goal_Buddies)
- No documented limit on number of shared goals or followers. (https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies)

### B) Do a goal together (joint goals, "Buddy Up")
- On a friend's page, tap **Buddy Up** → pick a preset goal or write a **custom goal** (examples surfaced: drink water; step outside at least once; stretch or exercise). (https://finch.fandom.com/wiki/Goal_Buddies)
- The friend receives a **Goal Invitation with a 24-hour window to Accept or Decline**. (https://finch.fandom.com/wiki/Goal_Buddies)
- Both partners then track the same goal over the week; if **both** complete it by week's end they can exchange kudos and re-partner on the same or a new goal. (https://finch.fandom.com/wiki/Goal_Buddies)
- Note: the official help article frames even shared goals as individually-owned ("only one of you will display the goal on your homepage while the other offers encouragement") — implement joint goals as paired individual goals with mutual visibility rather than one shared object. (https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies)

### Leaderboards
- **None exist.** No XP comparisons, no streak rankings, no public profiles. The only "comparison" surface is voluntarily-shared goal streaks between mutuals. Replicate this absence deliberately. (https://calmevo.com/finch-app-review/, https://apps.apple.com/us/app/finch-self-care-widget-pet/id1528595748)

---

## 9. Privacy Controls

### Hard privacy guarantees
- **Personal writings (journal entries, reflections, mood check-ins, self-care data) are never visible to friends.** Only the "bird and game side" of the account is shared: birb, birbhouse, outfit, in-game milestones, and explicitly-shared goals. (https://finch.fandom.com/wiki/Tree_Towns, https://befinch.notion.site/Finch-FAQ-474652d0123d4883ac7a0cd6c8f5aa70, https://scienceinsights.org/what-is-the-finch-app-and-how-does-it-work/)

### Tree Town settings (gear icon, top-right of Tree Town)
(https://finch.fandom.com/wiki/Tree_Towns)
- **Edit tree town**: rearrange friend birbs across pages; unfriend from this UI (no notification sent to the removed friend)
- **Allow/disable Good Vibes** (global toggle)
- **Allow/disable push notifications** for Tree Town
- **Allow/disable friend requests** (also reachable via Menu → Preferences → **"Manage your visitors"** → "Disable friend requests" toggle; a common cause of failed friend-code adds) (https://finch.fandom.com/wiki/Invite)

### Per-friend controls (friend page "..." menu)
- Rename friend, **mute their future Good Vibes**, change their emoji, **unfriend with optional block** of future requests. (https://finch.fandom.com/wiki/Tree_Towns)

### Other privacy-relevant mechanics
- Birdhouse sharing is opt-in per user — the "Birdhouse Love" vibe only works toward friends who share their birdhouse. (https://finch.fandom.com/wiki/Good_Vibes)
- Incoming vibes can be cleared singly or in bulk without reading/responding. (https://finch.fandom.com/wiki/Good_Vibes)
- Unfriending/removals sync silently for both parties. (https://help.finchcare.com/hc/en-us/articles/37780316582413-Adding-Friends)

---

## 10. Rebuild Notes (Telegram Mini App mapping)

- **Friend code → Telegram-native**: the 10-digit code + share-link dual system maps cleanly to a `t.me/<bot>?startapp=<code>` deep link; keep a visible 10-char code for manual entry parity and for the "Did someone invite you?" onboarding field and Plus-gifting flow.
- **Economy hooks to preserve exactly**: +3 Energy / +2 Rainbow Stones on first vibe per friend per day; 200-stone gifting surcharge; 1 gift/friend/day; 50% sell-back; 3-invite referral cap with ladder (stones+hood → plushie → micropet); free invitee micropet chosen by inviter.
- **Gating to preserve**: 14 vibes free, 4 (Comfort, Dance, Flowers, Kudos) behind the subscription tier; everything else in the social system free.
- **Timers**: ~1h friend-birb visit; 3-day unanswered-vibe reminder; 24h joint-goal invite expiry; rate-limited hug broadcast (tunable, undocumented upstream).
- **UI surfaces**: tree with 8 friends/page + page dots; heart inbox (grouped by sender, timestamps, clear one/all); hug-request birb at top; gear settings; per-friend page with heart (friendship level), overflow menu, Send Good Vibes, Send Gift, Buddy Up, shared-goal streak strip, latest-progress feed (last 4 events).
- **Deliberate omissions**: no leaderboards, no public profiles, no stranger discovery in-app (community code-exchange happens off-platform), no visibility of any journal/self-care content.

---

## Source Index

- Official help center: Adding Friends — https://help.finchcare.com/hc/en-us/articles/37780316582413-Adding-Friends
- Official help center: Invite Rewards — https://help.finchcare.com/hc/en-us/articles/37780423805069-Invite-Rewards
- Official help center: Gifting Items — https://help.finchcare.com/hc/en-us/articles/37780412676493-Gifting-Items
- Official help center: Sending Good Vibes — https://help.finchcare.com/hc/en-us/articles/37780369483533-Sending-Good-Vibes
- Official help center: Accountability Buddies — https://help.finchcare.com/hc/en-us/articles/37943772406413-Accountability-Buddies
- Official help center: Benefits of Finch Plus — https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus
- Official help center: Finch Plus Pricing — https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing
- Official help center: How to Gift Finch Plus — https://help.finchcare.com/hc/en-us/articles/37972018284685-How-to-Gift-Finch-Plus
- Official help center: Friends and Social category — https://help.finchcare.com/hc/en-us/categories/37934405521933-Friends-and-Social
- Official Finch FAQ (Notion) — https://befinch.notion.site/Finch-FAQ-474652d0123d4883ac7a0cd6c8f5aa70
- Fan wiki: Tree Towns — https://finch.fandom.com/wiki/Tree_Towns
- Fan wiki: Good Vibes — https://finch.fandom.com/wiki/Good_Vibes
- Fan wiki: Friendship — https://finch.fandom.com/wiki/Friendship
- Fan wiki: Invite — https://finch.fandom.com/wiki/Invite
- Fan wiki: Goal Buddies — https://finch.fandom.com/wiki/Goal_Buddies
- Fan wiki: Cookie the Cow — https://finch.fandom.com/wiki/Cookie_the_Cow
- Fan wiki: Friend Code Exchange — https://finch.fandom.com/wiki/Friend_Code_Exchange
- App Store listing — https://apps.apple.com/us/app/finch-self-care-widget-pet/id1528595748
- Review (design philosophy / no leaderboards) — https://calmevo.com/finch-app-review/
- Background explainer — https://scienceinsights.org/what-is-the-finch-app-and-how-does-it-work/
