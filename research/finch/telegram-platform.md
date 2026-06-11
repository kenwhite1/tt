# Telegram Mini App Platform Mapping (for the Finch 1:1 Clone)

> Scope: this document is NOT about Finch mechanics. It maps the Telegram Mini App platform
> (2025–2026 state) onto the needs of a self-care-pet app: auth, theming, viewport, native UI
> controls, storage, payments/subscriptions (Telegram Stars), push reminders, home-screen
> shortcuts, deep links/referrals, sharing, discoverability, and ToS constraints.
>
> Primary sources: https://core.telegram.org/bots/webapps , https://core.telegram.org/bots/api ,
> https://core.telegram.org/bots/payments-stars , https://core.telegram.org/api/subscriptions ,
> https://telegram.org/tos/bot-developers , https://telegram.org/tos/mini-apps ,
> https://core.telegram.org/bots/faq , https://telegram.org/blog/fullscreen-miniapps-and-more ,
> https://core.telegram.org/api/links , https://docs.telegram-mini-apps.com/platform/start-parameter

Platform baseline: "Mini Apps 2.0" shipped with Bot API 8.0 (Nov 2024) and added fullscreen,
home-screen shortcuts, Stars subscriptions for mini apps, geolocation, sensors, gifts, and
`shareMessage` (https://telegram.org/blog/fullscreen-miniapps-and-more). Bot API 9.0 (2025)
added DeviceStorage/SecureStorage; later 9.x releases added `hideKeyboard()` (9.1) and
`requestChat` dialogs (9.6). The Bot API page reported Bot API 10.0 as current as of May 2026
(https://core.telegram.org/bots/api). Always gate features with
`Telegram.WebApp.isVersionAtLeast(version)`.

---

## 1. Authentication: `initData` validation

Source: https://core.telegram.org/bots/webapps (section "Validating data received via the Mini App").

Every launch injects `window.Telegram.WebApp.initData` — a query-string of launch fields
(`user`, `auth_date`, `hash`, `signature`, `start_param`, `chat_type`, `chat_instance`, ...).
The client-parsed object is `initDataUnsafe`; NEVER trust it server-side. Send the raw
`initData` string to your backend on session start and validate:

### HMAC-SHA256 (classic, requires bot token on server)
1. Parse all key=value pairs except `hash`.
2. Build `data_check_string`: fields sorted alphabetically, joined with `\n`, each as `key=<value>`.
3. `secret_key = HMAC_SHA256(key="WebAppData", message=<bot_token>)`.
4. Valid iff `hex(HMAC_SHA256(data_check_string, secret_key)) == hash`.
5. Check `auth_date` freshness (recommend rejecting > 1 hour old; issue your own session JWT after).

### Ed25519 (third-party validation, Bot API 8.0+, no bot token needed)
- The `signature` field is a base64url Ed25519 signature over
  `"<bot_id>:WebAppData\n" + sorted fields` (excluding `hash` and `signature`).
- Telegram public keys: production `e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d`,
  test env `40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec`.
- Useful if validation must happen in an edge worker that should not hold the bot token.

**Clone implication:** Telegram gives you stable `user.id`, `first_name`, `language_code`,
`is_premium`, and photo — you get account creation "for free" (no email/Apple/Google sign-in
screens from the iOS app need to be rebuilt). Map `telegram_user_id` to the player record.

## 2. Theming: `themeParams`

Source: https://core.telegram.org/bots/webapps.

- Colors arrive as `#RRGGBB` in `Telegram.WebApp.themeParams` and as CSS vars
  `var(--tg-theme-<field>)`: `bg_color`, `text_color`, `hint_color`, `link_color`,
  `button_color`, `button_text_color`, `secondary_bg_color` (6.1+), `header_bg_color` (7.0+),
  `bottom_bar_bg_color` (7.10+), `accent_text_color`, `section_bg_color`,
  `section_header_text_color`, `section_separator_color` (7.6+), `subtitle_text_color`,
  `destructive_text_color`.
- `themeChanged` event fires on dark/light switch; `colorScheme` is `light`/`dark`.
- You can override chrome: `setHeaderColor()`, `setBackgroundColor()`, `setBottomBarColor()`.

**Clone implication:** a Finch-style app has its own pastel art direction; you will mostly set
your own header/background colors rather than inherit Telegram's, but you MUST still react to
`colorScheme` for system surfaces (popups, sheets) and test on dark mode clients.

## 3. Viewport & fullscreen

Source: https://core.telegram.org/bots/webapps.

- Default launch is a bottom sheet ~50% height; call `expand()` to go to full height, and
  `disableVerticalSwipes()` so swipe gestures don't minimize the app mid-interaction
  (critical for any drag/scroll gameplay).
- `viewportHeight` / `viewportStableHeight` (+ CSS vars) with `viewportChanged` event
  (`isStateStable` flag) — use stable height for layout to avoid keyboard jitter.
- **Fullscreen (Bot API 8.0+):** `requestFullscreen()` / `exitFullscreen()`, `isFullscreen`,
  events `fullscreenChanged` / `fullscreenFailed`. Works portrait and landscape;
  `lockOrientation()` / `unlockOrientation()` to pin portrait (recommended for the pet home
  screen).
- **Safe areas (8.0+):** `safeAreaInset` and `contentSafeAreaInset` objects
  (`top/bottom/left/right`, px) + CSS vars `var(--tg-safe-area-inset-*)`, events
  `safeAreaChanged` / `contentSafeAreaChanged`. In fullscreen you render under the system
  status bar and Telegram's close/more buttons — pad the top with contentSafeAreaInset.
- Launch modes in links: `&mode=compact` or `&mode=fullscreen` can be requested in direct
  links (https://docs.telegram-mini-apps.com/platform/start-parameter,
  https://core.telegram.org/api/links).

## 4. Native controls: BackButton, MainButton, haptics

Source: https://core.telegram.org/bots/webapps.

- **BackButton:** `show()/hide()/onClick()/offClick()`, `isVisible`. Use for the in-app
  navigation stack (journal -> entry -> home). Also `enableClosingConfirmation()` to prevent
  accidental swipe-down close with unsaved journal text.
- **MainButton / SecondaryButton** (BottomButton): `setText()`, `show()/hide()`,
  `enable()/disable()`, `showProgress()/hideProgress()`, `setParams({text, color, text_color,
  is_active, is_visible, has_shine_effect, position})`. `hasShineEffect` and the secondary
  button (position `left/right/top/bottom`) need Bot API 7.10+. Natural fit for "Complete
  goal" / "Save entry" CTAs; the shine effect suits the subscription upsell button.
- **SettingsButton (7.0+):** a native "Settings" item in the kebab menu — wire it to the
  clone's settings screen.
- **HapticFeedback:** `impactOccurred('light'|'medium'|'heavy'|'rigid'|'soft')`,
  `notificationOccurred('error'|'success'|'warning')`, `selectionChanged()`. Use to replicate
  the iOS app's tactile feedback on task completion, pet petting, reward claims.

## 5. Client-side storage

Source: https://core.telegram.org/bots/webapps.

| Store | Limits | Persistence | Use for |
|---|---|---|---|
| `CloudStorage` (6.9+) | **1024 keys/user/bot; key 1–128 chars `[A-Za-z0-9_-]`; value 0–4096 chars** | Synced across the user's devices via Telegram cloud | Settings, onboarding flags, last-seen state, small caches |
| `DeviceStorage` (9.0+) | **5 MB per user per bot** | Local to device | Asset/state cache, offline queue |
| `SecureStorage` (9.0+) | **10 items per user per bot** (Keychain/Keystore) | Local, encrypted | Session token |

All methods are callback-based (`setItem`, `getItem`, `getItems`, `removeItem`, `removeItems`,
`getKeys`; DeviceStorage adds `clear`). **Do NOT use CloudStorage as the game database** — a
Finch-class app (pet state, currencies, journeys, journal, friends) needs a real backend;
4 KB values and 1024 keys are only enough for preferences. localStorage is unreliable across
Telegram clients; treat the server as the source of truth.

## 6. Payments: Telegram Stars (one-off + subscriptions)

Sources: https://core.telegram.org/bots/payments-stars , https://core.telegram.org/bots/api ,
https://core.telegram.org/api/subscriptions , https://gramio.dev/guides/telegram-stars.

### One-off purchases (gem packs, item bundles)
- `sendInvoice` or (better for mini apps) `createInvoiceLink` with `currency: "XTR"`,
  `provider_token` empty string, `prices` = single `LabeledPrice` in whole Stars.
- In the mini app, open with `Telegram.WebApp.openInvoice(link, callback)`; callback status:
  `paid` / `cancelled` / `failed` / `pending`.
- Server flow: receive `pre_checkout_query` -> MUST `answerPreCheckoutQuery` within
  **10 seconds** -> receive `successful_payment` with `telegram_payment_charge_id` (store it),
  `total_amount`, `invoice_payload`.
- Refunds: `refundStarPayment(user_id, telegram_payment_charge_id)`. Ledger:
  `getStarTransactions`. Test everything in the **test environment** (test Stars are free).

### Stars subscriptions (the Finch Plus analogue)
- Same invoice flow plus `subscription_period` — **only allowed value is 2592000 seconds
  (30 days)** (https://core.telegram.org/api/subscriptions). No native annual/weekly tiers —
  an "annual plan" must be modeled as a one-off purchase granting 365 days of entitlement.
- Subscription invoices must contain exactly one price item; max price capped by the server
  config `stars_subscription_amount_max` (config key; check `help.getAppConfig`, commonly
  reported as 2500 Stars).
- Renewal: Telegram auto-charges every 30 days, pushing `subscription_expiration_date`
  forward. `successful_payment` carries `is_recurring`, `is_first_recurring`,
  `subscription_expiration_date` — drive entitlement off these updates plus your own expiry
  check; there are no webhooks for "expired", you infer it from the date.
- Cancel/restore from bot side: `editUserStarSubscription(user_id, telegram_payment_charge_id,
  is_canceled)`. Users can also cancel in Telegram settings. If balance is insufficient at
  renewal, Telegram nags the user to top up (`STARS_SUBSCRIPTION_LOW_BALANCE` flow); treat
  lapsed date = lapsed entitlement, restore on later payment.
- Users buy Stars via in-app purchase (Apple/Google take ~30% on mobile-acquired Stars) or
  via @PremiumBot / Fragment at better rates.

### Developer payout
- Reward rate: **$0.013 USD-equivalent per Star**; withdrawal via Fragment in TON,
  **minimum 1000 Stars**, after a **21-day hold** per payment
  (https://telegram.org/tos/bot-developers §6.2.4, https://telestars.io/blog/telegram-stars-payouts,
  https://ton.org/en/telegram-stars-and-ton-ecosystem). Unused earned Stars expire after
  3 years (ToS §6.2.4). Stars can also fund Telegram Ads at +30% value, or paid broadcasts.
- Bot API 9.x adds an affiliate program (`AffiliateInfo` on transactions): you can set a
  commission so other bots/channels earn Stars for referring paying users — usable as a
  growth lever.

### Pricing mapping for the clone
- Finch's USD IAPs must be re-priced in Stars (e.g., $9.99/mo tier ≈ 500–750 Stars/mo
  depending on margin strategy; remember Telegram's effective take vs. Apple's 30%).
- Consumable currency packs = one-off XTR invoices; "Finch Plus" = 30-day Stars subscription
  + a separate one-off "12 months" SKU.

## 7. Push reminders via bot messages (+ rate limits)

Sources: https://core.telegram.org/bots/faq , https://core.telegram.org/bots/webapps.

- There is **no Web-Push inside mini apps**. Reminders = your bot sending normal Telegram
  messages (`sendMessage`, optionally with an inline button `web_app`/`url` deep link that
  reopens the app on the right screen).
- **Permission:** a bot may only message users who started it. Users arriving via a direct
  mini-app link may not have started the bot — call `Telegram.WebApp.requestWriteAccess()`
  (6.9+) during onboarding, or funnel first launch through the bot's main app button. If the
  user blocks the bot you get a 403; mark them unreachable.
- **Rate limits** (https://core.telegram.org/bots/faq): max ~**1 message/second per chat**
  (bursts -> 429 with `retry_after`), **20 messages/minute per group**, and ~**30 messages/
  second overall** for broadcasts. **Paid broadcasts** (enable in @BotFather; requires
  ≥10,000 Stars balance and ~10k MAU) raise the ceiling to **1000 msgs/sec** at
  **0.1 Stars per message above the free 30/sec**.
- Design: schedule per-user reminder crons server-side (daily check-in, streak-at-risk,
  journey-complete); shard sends to stay under 30/sec; use `allow_sending_without_reply`,
  exponential backoff on 429.
- ToS §5.2 (https://telegram.org/tos/bot-developers): no spam/harassment — reminders must be
  user-configurable and respect opt-out, mirroring Finch's reminder settings screen.

## 8. Home-screen shortcuts

Source: https://core.telegram.org/bots/webapps (Bot API 8.0+),
https://telegram.org/blog/fullscreen-miniapps-and-more.

- `Telegram.WebApp.addToHomeScreen()` prompts the user to add a launcher icon for the mini
  app on their device home screen (Android; iOS via profile shortcut flow).
- `checkHomeScreenStatus(cb)` returns `unsupported | unknown | added | missed`; events
  `homeScreenAdded`, `homeScreenChecked`.
- **Clone implication:** Finch's identity is "self care widget pet on your home screen."
  A true iOS-style widget is impossible in Telegram; the closest equivalents are
  (a) home-screen shortcut icon, (b) bot pinned chat with daily pet-status message
  (photo of pet + buttons), (c) emoji-status flex (`setEmojiStatus`, 8.0+). Offer the
  shortcut prompt after day-2 retention, like an "add widget" nudge.

## 9. Deep links, invites, referrals (`startapp`)

Sources: https://core.telegram.org/api/links ,
https://docs.telegram-mini-apps.com/platform/start-parameter.

- Main Mini App: `https://t.me/<bot>?startapp[=payload][&mode=compact|fullscreen]`.
- Direct-link app (named): `https://t.me/<bot>/<short_name>?startapp=payload`.
- Payload rules: up to **512 chars**, charset `[A-Za-z0-9_-]` — base64url-encode anything
  structured. Delivered as `initDataUnsafe.start_param` (and `tgWebAppStartParam` GET param);
  it is inside signed initData, so it survives validation server-side.
- Referral flow: generate `startapp=ref_<userId>` links; on first validated launch, credit
  the referrer (Finch's "invite a friend / Tree Town friends" analogue). Same mechanism for
  "join my Tree Town" friend codes and shareable journal cards.
- Also `?profile` / attachment-menu links exist, but `startapp` is the canonical entry.

## 10. Sharing APIs

Source: https://core.telegram.org/bots/webapps.

- **`shareMessage(msg_id, cb)` (8.0+):** server first calls Bot API
  `savePreparedInlineMessage` to build a `PreparedInlineMessage` (an inline-bot result the
  user is allowed to send), then the mini app triggers the native share-to-chat picker.
  Perfect for "share my pet's adventure / streak card" with a deep-link button back into the
  app.
- **`shareToStory(media_url, params)` (7.8+):** post an image/video to the user's Telegram
  Story with caption (0–200 chars; 0–2048 for Premium users) and a `widget_link` back to the
  app — viral surface for milestone cards.
- **`switchInlineQuery(query, chat_types)` (6.7+):** open chat picker pre-filled with an
  inline query (requires inline mode enabled).
- Simple fallback: `openTelegramLink('https://t.me/share/url?url=...&text=...')`.
- `sendData(...)` (≤4096 bytes) only works for keyboard-button-launched apps — irrelevant
  for a main-app architecture; use your own HTTPS API instead.
- `downloadFile(params)` (8.0+) lets users save generated images (journal exports) — server
  must send `Content-Disposition: attachment` and
  `Access-Control-Allow-Origin: https://web.telegram.org`.

## 11. Discoverability / Mini App Store

Sources: https://core.telegram.org/bots/webapps , https://tapps.center/ ,
https://www.findmini.app/ , https://t.me/trendingapps.

- In-client surfaces: the **Apps tab in Telegram search** (popular + recently used mini
  apps), global username search, the attachment-menu browser, and channel/group link sharing.
- Official docs state that successful bots with a **Main Mini App enabled** that **accept
  Telegram Stars** may be **featured in the Telegram Mini App Store** — requirements include
  high-quality media on the bot profile (photos/video demos) and following Telegram's design
  guidelines (https://core.telegram.org/bots/webapps).
- BotFather setup checklist: enable Main Mini App, set short description, profile photo,
  `/setuserpic`, demo video/screenshots, inline mode (for sharing), menu button, and
  privacy policy link (mandatory per Bot ToS since July 2024).
- Third-party catalogs matter for crypto-adjacent traffic: Telegram Apps Center
  (tapps.center, TON-ecosystem), FindMini.app, @trendingapps channel. A wellness app is a
  category outlier there — in-Telegram virality (referrals, stories, shares) is the realistic
  growth channel.

## 12. ToS / policy constraints relevant to the clone

Sources: https://telegram.org/tos/bot-developers , https://telegram.org/tos/mini-apps.

1. **Digital goods MUST use Stars** (Bot Developer ToS §6.2): "all transactions pertaining to
   digital goods and services must be executed exclusively through the exchange of Telegram
   Stars"; third-party processors (incl. crypto for digital goods) prohibited since
   Feb 1, 2025. The entire Finch Plus + currency economy must be Stars-only. No Stripe, no
   TON-native checkout for in-app perks.
2. **Physical goods** (§6.1) may use third-party providers — irrelevant here unless you sell
   merch.
3. **Subscriptions**: allowed via Stars; 30-day period only (see §6); honor cancellation;
   Telegram may debit Stars back for refunds/violations (§6.2.4).
4. **Gambling/gacha**: Telegram's developer ToS prohibits scams/Ponzi/MLM (§5.2) and Telegram
   has banned real-money casino bots (e.g., TG.Casino,
   https://www.gamblingnews.com/news/telegram-bans-tg-casino-amid-gambling-concerns/); the
   Google Play build of Telegram filters gambling bots. Real-money games of chance are
   legally risky and inconsistently enforced — avoid entirely. **Finch-style mechanics are
   safe**: its "random reward" elements (e.g., random discovery items, micropet hatching) are
   non-paid or soft-currency-driven, not paid loot boxes. To stay clean: never sell a
   randomized outcome directly for Stars; sell currency, spend currency on deterministic
   items; keep any randomness free/earned. Note loot-box laws in some countries treat paid
   random rewards as gambling (disclosure/odds rules), so deterministic Stars SKUs are the
   conservative design.
5. **Privacy**: a privacy policy is mandatory; mini apps automatically receive IP, user id,
   username, photo, language, premium status, theme (Mini App ToS §4); journaling/mood data
   is sensitive-adjacent — store encrypted, document it.
6. **No spam** (§5.2): reminder messages must be opted into and easily disabled.
7. **Enforcement** (§10): violations -> bot ban/removal, possible "SCAM" label, withheld
   Stars, no compensation.

## 13. Architecture sketch for the clone

- **Client:** React/Svelte SPA served over HTTPS; `@telegram-apps/sdk` (telegram-mini-apps
  community SDK) or raw `telegram-web-app.js`; portrait-locked fullscreen; safe-area-padded
  custom UI; BackButton-driven navigation; haptics on every reward.
- **Server:** validates initData -> issues session JWT; authoritative game state (pet,
  energy, currencies, goals, journeys, journal, friends); cron scheduler for reminder sends
  (sharded ≤30 msg/sec); Bot API webhook for `pre_checkout_query`, `successful_payment`,
  `/start` referral attribution.
- **Payments:** `createInvoiceLink` (XTR) for packs; `subscription_period=2592000` for the
  Plus tier; `editUserStarSubscription` + expiry-date checks for entitlement.
- **Growth:** `startapp` referral payloads, `shareMessage` prepared cards, `shareToStory`
  milestones, `addToHomeScreen` nudge, affiliate program for channel partners.
