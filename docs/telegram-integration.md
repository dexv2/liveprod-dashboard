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

## Assignment notifications

New Schedule and Event assignment lifecycles automatically attempt one Telegram message after the authoritative Schedule/Event and Assignment lifecycle have converged. The message is generated from server-side Schedule/Event data, contains no internal IDs, and offers **Accept**, **Decline**, and **Request Change** buttons. Successful delivery does not itself change the Assignment response status; a new Assignment remains `PENDING` until a valid response wins.

Delivery behavior:

- Linked Volunteer with notifications enabled: Telegram delivery is attempted.
- No current Telegram link: the Assignment records `SKIPPED_NO_LINK` and remains valid.
- Notifications disabled: the Assignment records `SKIPPED_DISABLED` and remains valid.
- Telegram failure: the Assignment records a normalized `FAILED` code and remains valid.
- An Admin with the appropriate Schedule/Event permission may intentionally retry using `POST /api/assignments/<assignmentId>/notify`.

Automatic delivery uses `ASSIGNMENT_CREATED:<assignmentId>:<version>` and a persisted `PROCESSING` claim. A successfully notified Assignment/version is not automatically resent. Telegram does not accept an application idempotency key, so if Telegram accepts a message but the subsequent metadata write fails, delivery outcome is uncertain. Automatic retry remains suppressed; after a ten-minute safety window, an administrator may decide to retry manually. This minimizes duplicate messages but cannot provide strict exactly-once delivery.

Each distinct Assignment lifecycle currently sends its own message. A Volunteer assigned to multiple AM/PM or whole-day slots may receive multiple messages; bundling is deferred.

## Assignment responses

Each notification gets a fresh set of three 192-bit opaque action tokens. Only SHA-256 hashes are stored. Every token is bound to the exact Assignment, Assignment version, Volunteer, current Volunteer `linkVersion`, and one action. Callback data uses the compact `a:<opaque-token>` form and never embeds application or Telegram identity IDs.

The webhook requires its existing Telegram secret and durable update claim, then independently checks the callback sender against the Volunteer’s current Telegram user ID and `linkVersion`. It also checks Assignment ownership, `PENDING` status, optimistic version, authoritative Schedule/Event ownership, and source date. Responses are accepted through the Schedule/Event calendar date in Asia/Manila; older buttons cannot modify historical assignments.

The first valid response atomically increments the Assignment version and maps:

- Accept → `CONFIRMED`
- Decline → `DECLINED`
- Request Change → `CHANGE_REQUESTED`

The response history records the Volunteer ObjectId as actor, `VOLUNTEER` actor type, and `TELEGRAM` channel. Request Change does not collect a free-text reason in v1.1. Competing or repeated buttons cannot replace the first final response. Relinking, unlinking, reassignment, cancellation, version changes, expiration, and passed source dates make old buttons unusable.

After success, sibling tokens are invalidated and Telegram message buttons are removed while the assignment details remain. A Telegram message-edit failure never rolls back the Assignment transition. Manual notification retries invalidate the previous unused token set and issue a fresh set; a failed message send retires its token set. No scheduler Telegram notification is implemented yet.

Manual live test procedure:

1. Link a test Volunteer to Telegram.
2. Assign the Volunteer to a Schedule and confirm the message arrives.
3. Confirm the Assignment remains `PENDING`.
4. Repeat the same assignment request and confirm no duplicate automatic message.
5. Reassign the slot to another linked Volunteer and confirm only the new Volunteer receives the new-assignment message.
6. Disable Telegram notifications, create another assignment, and confirm no message is sent.
7. Use the authenticated manual notify route and verify the sanitized delivery result.
8. Confirm a new assignment message displays all three response buttons.
9. Press **Accept** and verify the message displays Confirmed and the Assignment is `CONFIRMED`.
10. Press the old button again and verify the response is harmless.
11. Create separate test lifecycles and verify **Decline** produces `DECLINED` and **Request Change** produces `CHANGE_REQUESTED`.
12. Reassign a Volunteer and confirm the old message button is rejected.
13. Relink the Volunteer and confirm the former Telegram identity cannot use an old button.

This live procedure is optional when real Telegram credentials are unavailable.

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
- `/start <token>` performs private-chat Volunteer linking using a short-lived,
  single-use opaque token. The token is not stored in plaintext, echoed, or logged.
- Assignment callback queries validate an opaque action token and current Telegram identity before performing an optimistic, atomic Assignment transition. Unsupported callback prefixes receive a neutral response.
- Unknown valid updates are acknowledged and ignored.
- Malformed supported updates are acknowledged and ignored to prevent retry storms.
- Failed transient processing releases the update claim so Telegram can retry.

The webhook is authenticated by the Telegram webhook secret, not by the app's
Admin session. Account-link issuance has separate Admin authorization, database-backed
issuance limits, and token identity validation.

For local testing, Telegram still needs a publicly reachable HTTPS URL. Use a
trusted tunnel and set `APP_BASE_URL` to that temporary HTTPS origin before running
the setup script.
