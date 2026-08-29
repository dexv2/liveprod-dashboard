# Telegram integration foundation

This integration uses Telegram HTTPS webhooks. It does not use long polling or a
persistent process. MongoDB retains update IDs for 14 days to deduplicate retries.

Volunteer linking and assignment response callbacks are not implemented in this pass.

## Environment variables

Configure these locally and in Vercel. Never commit real values and never use a
`NEXT_PUBLIC_` prefix for Telegram secrets.

```text
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_BOT_USERNAME=
APP_BASE_URL=https://your-app.example.com
```

Generate a strong webhook secret locally, for example with
`openssl rand -hex 32`, and store the result directly in environment configuration.

## Create the bot

1. Open `@BotFather` in Telegram.
2. Send `/newbot`.
3. Choose the bot display name.
4. Choose a unique username ending in `bot`.
5. Receive the token from BotFather.
6. Store it directly in local/Vercel environment configuration.
7. Never commit, paste into logs, or share the token.

Telegram usernames are display metadata and are not trusted as account identity.

## Configure and verify the webhook

After setting the environment variables, run these commands manually:

```bash
node scripts/telegram/setupWebhook.mjs
node scripts/telegram/checkTelegram.mjs
```

The setup script registers:

- `<APP_BASE_URL>/api/integrations/telegram/webhook`
- the `TELEGRAM_WEBHOOK_SECRET` as Telegram's `secret_token`
- only `message` and `callback_query` updates

Neither script runs during build, deployment, or application startup. The health
script safely reports bot identity, webhook URL, pending update count, and the last
webhook error without printing credentials.

## Current webhook behavior

- Requests must include the matching `X-Telegram-Bot-Api-Secret-Token` header.
- `/start` receives a neutral online response.
- `/start <parameter>` receives a linking-disabled response. The parameter is not
  stored, echoed, or logged.
- Callback queries are acknowledged with a neutral disabled response.
- Unknown valid updates are acknowledged and ignored.
- Malformed supported updates are acknowledged and ignored to prevent retry storms.
- Failed transient processing releases the update claim so Telegram can retry.

The webhook is authenticated by the Telegram webhook secret, not by the app's
Admin session. Future account-link token issuance must add rate limiting and its
own identity validation.

For local testing, Telegram still needs a publicly reachable HTTPS URL. Use a
trusted tunnel and set `APP_BASE_URL` to that temporary HTTPS origin before running
the setup script.
