# Telegram integration foundation

This integration uses Telegram HTTPS webhooks. It does not use long polling or a
persistent process. MongoDB retains update IDs for 14 days to deduplicate retries.

## Volunteer account linking

An administrator with the Update Volunteer Profile permission can generate a connection link from a Volunteer profile. Links contain a 192-bit opaque token, expire after 20 minutes, and are single-use. Only the SHA-256 token hash is stored. Generating a replacement invalidates prior unused links.

Linking is accepted only from a private Telegram chat. Telegram numeric user and chat IDs—not usernames—form the identity. A Telegram user already owned by another Volunteer cannot be transferred. An Admin-generated reconnect link may replace the Telegram identity on the intended Volunteer and increments its `linkVersion`.

Issuance is limited to five links for the same Volunteer/Admin pair per ten minutes. The token state is recoverable: a failed Volunteer update leaves the token in `PROCESSING`, and the same Telegram user/chat can retry without incrementing `linkVersion` twice.

Manual UX verification:

1. Open a Volunteer profile and select **Connect Telegram**.
2. Open the generated Telegram deep link and press **Start**.
3. Confirm the bot reports that the account is connected.
4. Return to the profile and verify polling changes the status to **Connected**.
5. Generate a reconnect link and, where a test account is available, connect a different Telegram account.
6. Confirm the previous identity is no longer authoritative.
7. Select **Disconnect** and confirm the profile returns to **Not connected**.

This manual check is optional when real Telegram credentials are unavailable.

Assignment notifications and assignment response callbacks are not implemented in this pass.

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
