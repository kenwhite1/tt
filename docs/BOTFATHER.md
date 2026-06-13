# Creating the bot in @BotFather (≈ 2 minutes)

Everything here happens in your Telegram account — it needs you, not the server. Copy-paste
each line to [@BotFather](https://t.me/BotFather).

## 1. Create the bot
```
/newbot
```
- **Name** (shown in chats): `Дружок`
- **Username** (must end in `bot`, must be unique): try `druzhok_pet_bot`, or
  `druzhok_care_bot`, `moy_druzhok_bot`… BotFather tells you if it's taken.

BotFather replies with a **token** like `7123456789:AAH...`. Keep it secret — paste it into
Railway as `BOT_TOKEN` (never into the repo). Set `BOT_USERNAME` to whatever username you got.

## 2. Turn the bot into a Mini App
After deploying to Railway you'll have a URL like `https://druzhok-production.up.railway.app`.
```
/newapp
```
- Pick your bot.
- Title: `Дружок`
- Short description: `Питомец, который растёт, когда ты заботишься о себе 🐶`
- Photo / GIF: upload the golden-puppy icon.
- **Web App URL**: your Railway `APP_URL`.
- Short name: `play` (gives a direct link `t.me/<bot>/play`).

## 3. Menu button (the big "open app" button in the chat)
```
/mybots → (pick bot) → Bot Settings → Menu Button → Configure menu button
```
- URL: your `APP_URL`
- Text: `Открыть Дружка`

## 4. Niceties (optional but recommended)
```
/setdescription   → Дружок — твой щенок заботы о себе. Гуляй, дыши, веди дневник — и расти вместе с ним.
/setabouttext     → Самочувствие как тамагочи 🐶
/setuserpic       → upload the puppy icon
```
For payments (only when you flip `PLUS_ENFORCED=1`): Telegram Stars need no provider token —
the bot is ready. Test purchases are free in Telegram's test environment.

## 5. Done
Open your bot, tap **Открыть Дружка**, and the mini app loads. The server registers its own
webhook on boot from `APP_URL`, so there's nothing else to wire.
