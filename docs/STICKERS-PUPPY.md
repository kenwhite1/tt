# «Дружок»-стикеры — passive-virality sticker pack (Viral Feature 5A)

Telegram sticker packs spread **passively** inside group chats, and every pack carries an
attribution link back to the bot. Near-zero cost, compounding, perfectly on-brand. This is an
**art + distribution task** (no app code) — created via [@Stickers](https://t.me/Stickers).

## The pack (16 stickers, reuse the Mascot rig states)

| # | State / caption | Emoji assoc. | Use moment |
|---|---|---|---|
| 1 | Happy bounce | 😄 | celebration |
| 2 | Sleepy / curled up | 😴 | bedtime, «спокойной ночи» |
| 3 | Proud / chest out | 😎 | streak, achievement |
| 4 | «Выпей воды» (holding cup) | 🥤 | self-care nudge |
| 5 | «Ты молодец» (thumbs/paws up) | 👏 | encouragement |
| 6 | Streak-on-fire | 🔥 | streak milestone |
| 7 | Hug / open arms | 🤗 | comfort |
| 8 | Crying-but-okay | 🥺 | hard day |
| 9 | Heart eyes / love | 😍 | vibes, compliments |
| 10 | Thinking / curious | 🤔 | reflection |
| 11 | Waving hello | 👋 | greeting |
| 12 | «Гуляем!» (on a walk) | 🐾 | walk |
| 13 | Eating treat / bone | 🦴 | reward |
| 14 | Breathing / calm (zen) | 🍃 | breathing exercise |
| 15 | Peeking / shy | 🙈 | «тайный лучик» |
| 16 | Sparkle / proud milestone | ✨ | share moment |

Optional +8 for a full 24-pack: seasonal hats (summer/winter), «доброе утро», «обнимашки»,
«я рядом», party, facepalm-cute, star-struck, sleeping with «zzz».

## Production
- Reuse the existing 3D mascot renders in `app/public/mascots/` + `app/public/pet.*` as the base
  poses; re-pose/re-express in the same cozy style. 512×512 PNG with transparent background
  (Telegram sticker spec).
- Default to the **dog** (Дружок) as the flagship pack; a later per-species pack is possible since
  the app already supports cat/owl/turtle/elephant/alpaca.

## Distribution (the actual virality)
1. Create the pack with @Stickers; **put the bot deep-link in the pack title/description**:
   `t.me/sharikrubot` — every use in any chat is an attributed ad.
2. Surface the pack link in: onboarding (final beat), the «Питомец» profile tab, and share cards.
3. Reuse the same art for the in-app emotion picker / vibe icons for visual consistency.

## Status
Art/distribution task — **not buildable in code**. Everything that *is* code (share cards that
carry the same art + deep-link, the attribution link plumbing) already ships in this build.
