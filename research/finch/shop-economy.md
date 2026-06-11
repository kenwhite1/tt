# Finch Teardown — Shop & In-Game Economy

Area: currencies, the four shops, item pricing, rotation/refresh, gifting, the Bag (inventory) structure, and the Mail system. All mechanics below are documented as observed in the live app (research date: 2026-06-11). Source URLs cited inline. "Plus" = the Finch Plus subscription; everything else is free-tier behavior.

---

## 1. Currencies & Economic Model

### 1.1 Rainbow Stones (the only spendable currency)
- **Rainbow Stones** are Finch's single soft currency. They are spent in all four in-app shops, on shop refreshes, on the 200-stone gifting surcharge, and (per the wiki) on streak fixing. Source: https://finch.fandom.com/wiki/Rainbow_Stones
- **There is no premium/hard currency and no way to buy stones with real money.** Finch's only monetization is the Finch Plus subscription (plus a real-world merch store that sells no virtual items). Community sources frequently call stones "gems" colloquially — same currency. Sources: https://finch.fandom.com/wiki/Rainbow_Stones , https://finch.fandom.com/wiki/Shops
- Stone balance is displayed at the **top-left corner of the Shop interface**. Source: https://finch.fandom.com/wiki/Shops

### 1.2 Adjacent resources (not shop currencies, but economy-relevant)
- **Energy** — daily self-care meter (resets each birb-day). Full bar = 15/20/25/30 points depending on growth stage (Baby→Teen). Full energy triggers an Adventure; adventures are a stone source. A typical goal grants ~5 energy. Source: https://finch.fandom.com/wiki/Energy
- **Streak Repair Hammers** — limited streak-restore items; users hold a max of **2 repairs**. Source: https://finch.fandom.com/wiki/Streaks
- **Micropet eggs** — earned, not bought (see §8.5).

### 1.3 Stone faucets (earning) — exact values
| Source | Amount | Cadence / condition |
|---|---|---|
| Mr. Prickles' daily gift | **65–80 stones** | Once/day, claimed by opening the Outfit shop |
| Daily Quests | **25 stones each** | Per completed daily quest |
| Weekly Milestones | **20 / 50 / 100 stones** | Goal done in a Self-care Area on 2 / 4 / 6 days that week; claimable **per Self-care Area** |
| Special Quests | **100 stones** per tier | Long-term collection/progression ladders (e.g., own 1, 5, 10, 20, 50… pieces of clothing) |
| First Good Vibe to a friend each day | **2 stones + 3 energy** | Per friend, per day; later vibes give nothing |
| Completing goals / clicks | small per-click amounts | Boosted by "Goal of the Day" (random boosted per-click value); lower mood selection yields more stones per click |
| Full energy / adventure start | scales with birb **Friendship level** and streak length | Per adventure |
| Seasonal event chests | Black chest: **12% chance** stones (88% item) | During monthly events |
| Selling items back | **50% of purchase price** | Any time |
| Inviting new users | Stones + animal hood (1st invite); plushie (2nd); Cookie the Cow micropet (3rd) | Per new-user invite, max 3 reward tiers |
| Reflections / activities | small amounts | Per activity |

Sources: https://finch.fandom.com/wiki/Rainbow_Stones , https://finch.fandom.com/wiki/Quests , https://finch.fandom.com/wiki/Good_Vibes , https://finch.fandom.com/wiki/Seasonal_Events , https://finch.fandom.com/wiki/Invite , https://finch.fandom.com/wiki/Streaks

### 1.4 Stone sinks (spending) — exact values
| Sink | Cost |
|---|---|
| Clothing items | mostly **300 / 500 / 900** (see §4) |
| Furniture items | mostly **300 / 500 / 900** |
| Color dyes | **300 / 500 / 900** by body part |
| Travel ticket | **300** per flight (Finchie Forest **200**; first-ever flight **free**) |
| Legendary Plushies | **20,000** (birb plushie) / **15,000** (NPC plushies) |
| Shop refresh | 1 free/day, then **10, 35, 60, 85, 110, 135, 160** (cumulative 595/day if maxed) |
| Gift surcharge | **+200 stones** on top of item price, per gift |
| Streak fix | stones (exact amount not documented publicly; Repair Hammers capped at 2) |

Sources: https://finch.fandom.com/wiki/Rainbow_Stones , https://finch.fandom.com/wiki/Travel_with_Sass , https://finch.fandom.com/wiki/Legendary_Plushie_Collection , https://finch.fandom.com/wiki/Mr._Prickles%27_Shop

---

## 2. Shop Tab — Global Structure

- Shop is the **3rd of 6 bottom tabs** (Home, Quests, Shop, Friends/Tree Town, Bag, Birb profile). Source: https://finch.fandom.com/wiki/Finch_App
- Opening the tab shows a **4-way chooser popup**: Outfit / Furniture / Color / Travel. Once inside, a bottom bar switches between the four shops. Source: https://finch.fandom.com/wiki/Shops
- The four shops (each fronted by an NPC shopkeeper with a greeting window):
  1. **Mr. Prickles' Shop** — clothing (NPC: Mr. Prickles, a hedgehog)
  2. **Finkea Furnishings** — furniture/interior (NPC: Robin)
  3. **The Color Studio** — birb color dyes (NPC: Da Finci)
  4. **Travel with Sass / "The Travel Agency"** — destination flights (NPC: Sassafras)
- **Shared top-right icons** (clothing/furniture/color shops):
  - **Catalog** (book + magnifying glass): browse and *try on* every item in the game, all color variants, with reference prices shown — but nothing is purchasable from the catalog. You must wait for an item to rotate into the shop (Everyday Collection excepted).
  - **Sell** (pouch icon): sell owned items back at **exactly 50%** of purchase price (500 → 250; 900 → 450; 300 → 150). Sold items are fully removed from inventory and from saved outfits/favorites. Currently-worn dyes cannot be sold.
- **Auto-refresh:** every shop's stock fully rotates every **24 hours**, synced to the birb's day; an "Items refresh" countdown timer is displayed.
- **Manual refresh (cycle 🔄 icon):** first refresh of the day free; subsequent refreshes cost **10, 35, 60, 85, 110, 135, 160** stones (steps of 25, cap 160). All 7 paid refreshes in a day total **595 stones**. Refreshing is irreversible — prior offerings are gone. **The Travel Agency cannot be refreshed.**
- Official overview article: https://help.finchcare.com/hc/en-us/articles/37935977276813-Shops-in-Finch-Outfits-Travel-and-More (help center); wiki: https://finch.fandom.com/wiki/Shops

---

## 3. The Four Shops in Detail

### 3.1 Mr. Prickles' Shop (Outfits / Clothing)
Source: https://finch.fandom.com/wiki/Mr._Prickles%27_Shop

- **Daily stone gift:** opening this shop once per day grants **65–80 free Rainbow Stones** from Mr. Prickles.
- **Rare item slots: 12 rotating slots.**
  - **Free users can buy from the first 6 slots only**; the back 6 are visible but locked.
  - **Plus members buy from all 12**, plus a 13th **daily 50%-off discount item** shown on a banner at the top. Non-Plus users see a join-Plus banner there instead.
  - **No member-exclusive items exist anywhere** — Plus only widens selection and discounts.
- **Slot 1 = Location item slot**: marked with a map-pin icon and distinct background tint; offers one of the current location's **4 unique clothing items** (each location also has 4 unique furniture items).
- **Fixed colors:** each rotated item appears in one specific color (color is part of the item name, e.g. "Green Cozy Crafter Top") and cannot be changed. Wanting a specific color means waiting for that exact roll.
- **Rotation weighting:**
  - Month after a seasonal event: that event's items appear *very often*.
  - Anniversary months: items from events held in that calendar month in prior years appear *more often*.
  - **October and December event items are exclusive** — they only appear during their month plus the two weeks before it; never the rest of the year.
- **Legendary Plushies** occasionally appear in rotation: birb plushie **20,000 stones**; NPC plushies (Mr. Prickles, Sassafras, Da Finci, Robin, Professor Oat) **15,000 stones** each; random color variant each appearance. Source: https://finch.fandom.com/wiki/Legendary_Plushie_Collection
- **Everyday Collection** (below the rotating slots): a permanent catalog of basics, purchasable **in any color** via a color picker at the bottom of the item sheet. The shop hides colors already owned. Source: https://finch.fandom.com/wiki/Everyday_Collection
- **Duplicates rule:** you can never own two of the same item+color. After buying, that item is greyed out and labeled **"SOLD"** for the day, and store-gifting of it is disabled. To both gift and keep an item: gift from the store first (to any number of friends), then buy your own copy. The same color only reappears in rotation if you sell or gift away your copy.

### 3.2 Finkea Furnishings (Furniture & Interior)
Source: https://finch.fandom.com/wiki/Finkea_Furnishings

- **Rare item slots:** 6 items purchasable by everyone + **6 additional slots for Plus members** (12 total), plus the Plus-only **50%-off daily item** banner. Items in fixed colors, 24-hour availability.
- **Location slot:** one slot for the current location's exclusive furniture (lighter background + globe/map card marker).
- **Seasonal slots:** October/December seasonal furniture appears in dedicated top slots only during those windows.
- **Everyday Collection:** permanent basics with free color choice. Notably the collection ends with:
  - **Basic wallpaper** in **12 colors**;
  - **Floor** item exposing **all 50+ floor colors** in the game (floors shipped with the Simple Collection, Aug 2022). Source: https://finch.fandom.com/wiki/Floors
- Refresh/sell/catalog identical to the clothing shop (same fee ladder, 50% sell-back).

### 3.3 The Color Studio (Dyes)
Sources: https://finch.fandom.com/wiki/The_Color_Studio , https://finch.fandom.com/wiki/Colors

- Sells **single-use dye bottles**, each = one specific color for one specific body part. **235 dyes** total: Headpatch (38), Cheeks (32), Beak (24), Body (36), Wings (39), Belly/Tummy (32), Feet (34).
- **Fixed dye prices by body part:**
  - **300 stones:** Beak, Cheeks, Feet
  - **500 stones:** Headpatch, Wings, Tummy
  - **900 stones:** Body
- **12 slots per day; 6 locked for free users** (Plus unlocks all 12). Plus members also get a **daily 50%-off dye** in a banner above Da Finci.
- Dye access gates on **birb growth stage**: body+beak dyes from Toddler; headpatch+wings from Child; cheeks+feet from Teen; tummy from Adult.
- **Colors cannot be gifted** (unique among shop goods).
- Sell-back at 50%; the dyes the birb is currently wearing are not sellable. Catalog try-on supported; no catalog purchases.
- Same refresh ladder: free, then 10/35/60/85/110/135/160.

### 3.4 Travel with Sass (The Travel Agency)
Source: https://finch.fandom.com/wiki/Travel_with_Sass

- **Unlocks when the birb reaches Child stage** (= 22 full-energy days).
- **Prices:** first flight **free**; thereafter **300 stones per one-way trip**; **Finchie Forest is 200**.
- **Daily destination offers (random):** free users see **3 choices/day** (formerly 2); **Plus members see 9**. (A former Plus 50%-off travel slot was retired.)
- **No manual refresh** for this shop.
- Buying a ticket commits you; the flight runs like an Adventure (requires full energy; same duration; ends with a Discovery at the destination). If bought after the day's adventure, the trip starts next full-energy day.
- Destination popups show: completion % per location, special-discovery counts, and previews of the location's **4 exclusive clothing + 4 exclusive furniture items** (only sold in the other shops while you're there).
- **Logbook** (notes menu): grid of all locations incl. seasonal/limited story locations (e.g., Midnight Manor), per-location % progress, undiscovered entries masked with "?", art turns colorful at 100%.

---

## 4. Item Price Architecture (typical values)

Scraped from the wiki's full item tables (Clothing: ~859 priced entries; Furniture: ~708 priced entries). Sources: https://finch.fandom.com/wiki/Clothing , https://finch.fandom.com/wiki/Furniture

| Price (stones) | Clothing count | Furniture count |
|---|---|---|
| 150 | 1 | — |
| 250 | 3 | — |
| 300 | 102 | 13 |
| 450 | 2 | — |
| 500 | 275 | 291 |
| 900 | 476 | 404 |
| 15,000 | NPC plushies | — |
| 20,000 | birb plushie | — |

Practical takeaway for the rebuild: a **three-tier 300/500/900 price grid** covers ~99% of the catalog (small accessories/held items ≈300, mid pieces ≈500, hero pieces/full-body outfits and large furniture ≈900), with plushies as ultra-luxury stone sinks. Dyes reuse the same three tiers keyed to body part. Sell-back is always exactly half.

---

## 5. Refresh Economics (per shop, per day)

| Refresh # | Cost (stones) | Running total |
|---|---|---|
| 1 | Free | 0 |
| 2 | 10 | 10 |
| 3 | 35 | 45 |
| 4 | 60 | 105 |
| 5 | 85 | 190 |
| 6 | 110 | 300 |
| 7 | 135 | 435 |
| 8 | 160 | 595 |

Pattern: free, then 10, +25 per step, capped at 160. Applies independently to the Outfit, Furniture and Color shops; Travel is exempt. Sources: https://finch.fandom.com/wiki/Shops , https://finch.fandom.com/wiki/Mr._Prickles%27_Shop

---

## 6. Gifting Between Friends

Sources: https://finch.fandom.com/wiki/Tree_Towns , https://finch.fandom.com/wiki/Mr._Prickles%27_Shop , https://finch.fandom.com/wiki/Gift_Request

- **What can be gifted:** clothing, furniture, **micropets**. **Colors/dyes cannot be gifted.**
- **Fee:** item price **+ 200 Rainbow Stones** surcharge per gift.
- **Limits:** unlimited gifts per day overall, but **max 1 gift per day to the same friend**. Both parties must be Tree Town friends (friend request accepted — requests arrive in the recipient's Mail).
- **Flow from shop:** tap item → choose "Send Gift" → friend list opens. Friends already owning the item are flagged **"Owned"**; friends you already gifted today are flagged **"Gifted"**. The same store item can be gifted to multiple friends in one day while it remains in stock.
- **Gift wrapping:** sender chooses the gift-box color after picking the item.
- **Seasonal-item warning:** gifting a seasonal item triggers an in-app warning that it's limited and not repurchasable (true only for Oct/Dec exclusives).
- **Recipient experience:** notified that "<user> sent you a gift"; unwanted gifts can be sold for **half price**.
- **Duplicates interplay:** if you own an item+color, the store blocks gifting it from the shelf (item shows SOLD) — gift first, buy after; alternatively send your own copy from inventory, then re-buy.
- Community layer: the wiki runs a "Gift Request" wishlist exchange where users post friend codes + wanted items — evidence that gifting is a major social loop worth replicating. Source: https://finch.fandom.com/wiki/Gift_Request

---

## 7. The Bag (Inventory Hub)

The **Bag is the 5th bottom tab**. It is the single inventory hub with five sections: **Clothing/Outfits, Furniture, Colors, Micropets, and the Mailbox**. Source: https://finch.fandom.com/wiki/Finch_App

### 7.1 Outfits (Clothing) section
- All owned clothing, grouped by category (hats/head, face, neck, tops, bottoms, full-body, feet, held items, etc. — mirroring the Catalog's type sections).
- Dressing room: equip/unequip pieces on the birb; save outfit combinations. **Free users have a limited number of saved outfit presets; Plus = unlimited saved combinations.** Source: https://finch.fandom.com/wiki/Finch_Plus
- Items can be gifted from inventory to a friend (see §6) or sold via the shop's Sell screen.

### 7.2 Furniture section
- All owned furniture grouped by type (walls, floors, wallpaper, beds, tables, rugs, windows, doors, lamps, plants, wall items...). Used to decorate the **birbhouse**.
- Saved decor combinations: limited for free users; **unlimited for Plus**. Source: https://finch.fandom.com/wiki/Finch_Plus

### 7.3 Colors section
- All owned dye bottles, by body part; apply to recolor the birb. Saved color combos limited / **unlimited with Plus**.
- Worn dyes cannot be sold; others sell at 50%.

### 7.4 Micropets section (= "Micropet Playland")
Sources: https://finch.fandom.com/wiki/Micropet_Playland , https://finch.fandom.com/wiki/Micropets , https://finch.fandom.com/wiki/Professor_Oat%27s_Lab

- Opens onto a **grassy playland scene** showing the birb plus **10 of your micropets** idling with unique animations (walk/hop/fly/peek from bushes); tapping a pet plays its unique sound.
- Below the scene: a **grid of all owned micropets** (green tiles) including the currently-incubating **egg with a progress bar**. Grid can toggle to a **list view** showing name, growth state (baby/adult), and adventure count.
- Detail view per pet: name, growth stage, pronouns, adventures count, **Nature** (random trait: Cheerful, Gentle, Quiet, Loyal, Playful, Brave...), description; **Equip** button to bring it on adventures; **settings gear** (rename, pronouns, "growable to adult" toggle, release pet).
- **"Lab" icon (Professor Oat's head, top right)** → Professor Oat's Lab: get a new egg immediately after hatching, or check egg progress.
- **Egg mechanic:** an egg must be **linked to one repeat goal**; completing that goal **7 times** hatches a **random micropet** (one of 3 color variants). Unlinking/relinking resets progress to zero. Duplicates are possible and unlimited.
- **Growth:** baby → adult after **15 adventures** together; "forever baby" toggle available until adulthood.
- **Micropedia** (paw + magnifying-glass icon): collection index per species showing which of the **3 color variants** you own and counts; missing pets show as "?".
- **62 micropets exist as of June 2026.** Acquisition: random eggs (main), monthly seasonal event pet (day 25 free / day 20 Plus), 3-invite reward (Cookie the Cow), starter egg for invited new users, and co-op egg hatching with friends (new/experimental).

### 7.5 Mailbox (Mail) section
See §8.

---

## 8. Mail System

Sources: https://finch.fandom.com/wiki/Finch_App , https://finch.fandom.com/wiki/Newsletters , https://finch.fandom.com/wiki/Tree_Towns , https://finch.fandom.com/wiki/Finch_Plus

- The **Mailbox lives in the Bag tab** and receives: **Newsletters** (weekly insight digests), achievement summaries, **friend requests** (must be accepted there before gifting/vibing is possible), and gift/notification mail.
- **Newsletters — 4 weekly publications**, each on a fixed weekday:
  | Newsletter | Day | Content focus |
  |---|---|---|
  | **The Weekly Feels** | Monday | check-in counts (this week vs last vs 2 weeks ago), daily mood log recap, tags that lifted you up/down |
  | **The <birb-name> Times** | Wednesday | birb's energy gained per week, affection gained, personality growth %, logged explorations/discoveries |
  | **The Progress Post** | Friday | mindful exercises per week, reflection words, "Categorical Wins" (goals vs quizzes/reflections/breathing), top exercises |
  | **The Resolve Tribune** | Saturday | goals set per week, goals completed, completed and skipped goal tags |
- **Unread state:** red badge counter on the Newsletters button; unread mail has a blue background, read mail white.
- **Settings:** bell icon toggles newsletters on/off globally or per-publication. While a newsletter is off, its insights are not tracked (and the gap is not backfilled on re-enable).
- **Feedback prompt** at the bottom of each newsletter asking which insights interest the reader.
- **Free vs Plus gating:** free users can read **only the latest Weekly Feels**; **Plus unlocks all four newsletters plus the full back-archive since account creation** (marketed as the "Bonus Weekly Mail 💌" Plus benefit).

---

## 9. Free vs Finch Plus — Economy Feature Matrix

Sources: https://finch.fandom.com/wiki/Finch_Plus , https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing , https://apps.apple.com/us/app/finch-self-care-pet/id1528595748

| Feature | Free | Finch Plus |
|---|---|---|
| Outfit shop rare slots | first 6 of 12 | all 12 + daily 50%-off item |
| Furniture shop rare slots | 6 | 12 + daily 50%-off item |
| Color Studio slots | 6 of 12 | all 12 + daily 50%-off dye |
| Travel destinations/day | 3 | 9 |
| Seasonal event rewards | 1 chest/stone reward per energized day; chest items in 1 of 4 preset colors; micropet on day 25 | extra reward column (specific items, **10 color choices**); micropet on day 20; guaranteed full item set |
| Good Vibes | 14 types | +4 exclusive (Comfort, Dance, Flowers, Kudos) |
| Saved outfit/decor/color combos | limited | unlimited |
| Newsletters (Mail) | latest Weekly Feels only | all 4 weekly papers + full history |
| Exclusive items | none — there are **no member-only items**; Plus widens access only | same pool |
| Goal emoji / SCA color / friend-tag emoji customization | — | yes |
| Activity duration options (timers, soundscapes, breathing, movements) | limited set | all durations |

**Pricing:** **$9.99/month or $69.99/year USD** (regional/store variation applies); App Store IAP range shown as $5.99–$69.99. A loyalty discount ladder on the annual plan is offered at 25/50/75/100 adventure-days (wiki-recorded examples: 19% → $78.99, 32% → $65.99, 39% → $58.99, 45% → $52.99 — figures reflect a higher regional base price; US help-center base is $69.99/yr). 7-day free trial offered; a monthly "Guardians" raffle sponsors free Plus months for users in financial hardship, with hardship pricing afterwards. Sources: https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing , https://finch.fandom.com/wiki/Finch_Plus , https://finch.fandom.com/wiki/Guardians

---

## 10. Seasonal Event Economy (shop-adjacent)

Source: https://finch.fandom.com/wiki/Seasonal_Events

- Monthly themed events (43 events as of April 2026) sit atop the Quests tab; each day the user fully energizes the birb, they claim that day's reward from a calendar track.
- **Free reward track:** mystery chests or raw stones. **Orange chest** = random event clothing; **purple chest** = random event furniture; **black chest** = 88% random event item / **12% Rainbow Stones**. Chest items come in 1 of 4 preset event colors (chooseable); duplicates possible.
- **Plus track:** first ~25 rewards are deterministic items (full set guaranteed) with **10 color choices**, then chests. Event **micropet at day 20 (Plus) / day 25 (free)**.
- **Post-event:** 2-week claim window for earned-but-unclaimed rewards; event items then flood the shop rotation for a month, then become rare-rotation items (anniversary-boosted; Oct/Dec exclusive-windowed). This is the single biggest driver of shop-rotation demand.

---

## 11. Rebuild Notes (Telegram Mini App)

1. **Single-currency design** is load-bearing: no stone IAP keeps the economy non-pay-to-win; the subscription sells *throughput* (more slots, more color choice, earlier pets), never exclusives. Replicate exactly.
2. Implement shops as one component with four configs: `slots` (12 with `freeVisible=6`), `locationSlot` (bool), `discountSlot` (plus-only, 50%), `refreshable` (false for Travel), `giftable` (false for Colors), shared refresh fee ladder `[0,10,35,60,85,110,135,160]` resetting daily.
3. Rotation weighting model: base-random over historical pool, with multipliers for (a) last month's event, (b) anniversary month, and hard gating for Oct/Dec pools (month + 14 preceding days).
4. Price book: 300/500/900 tiers + 15k/20k plushies; sell-back = floor(price/2); dye prices keyed to body part; travel flat 300 (200 for the starter forest, first free).
5. Inventory invariant: unique (item, color) ownership; "SOLD" state per shop-day; gift-before-buy ordering rule must be preserved or simplified deliberately.
6. Bag = 5 sections (Outfits, Furniture, Colors, Micropets, Mail); Mail doubles as the friend-request and weekly-digest inbox — in Telegram this maps naturally to bot-push messages mirrored into the in-app Mailbox.

---

## Source Index

- Official help center: https://help.finchcare.com/hc/en-us/articles/37935977276813-Shops-in-Finch-Outfits-Travel-and-More ; https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing
- Official FAQ: https://befinch.notion.site/Finch-FAQ-474652d0123d4883ac7a0cd6c8f5aa70
- App Store listing: https://apps.apple.com/us/app/finch-self-care-pet/id1528595748
- Fan wiki (finch.fandom.com): /wiki/Rainbow_Stones , /wiki/Shops , /wiki/Mr._Prickles%27_Shop , /wiki/Finkea_Furnishings , /wiki/The_Color_Studio , /wiki/Travel_with_Sass , /wiki/Colors , /wiki/Clothing , /wiki/Furniture , /wiki/Floors , /wiki/Everyday_Collection , /wiki/Legendary_Plushie_Collection , /wiki/Tree_Towns , /wiki/Good_Vibes , /wiki/Gift_Request , /wiki/Micropets , /wiki/Micropet_Playland , /wiki/Professor_Oat%27s_Lab , /wiki/Seasonal_Events , /wiki/Quests , /wiki/Streaks , /wiki/Newsletters , /wiki/Finch_App , /wiki/Finch_Plus , /wiki/Invite , /wiki/Energy
- Screen-flow map: https://revyl.com/atlas/finch/
- Subreddit (rotation/earning tips referenced by wiki): https://www.reddit.com/r/finch/
