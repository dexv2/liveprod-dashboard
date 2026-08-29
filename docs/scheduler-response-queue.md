# Scheduler response queue

The **My Assignment Responses** page at `/admin/responses` shows Assignment lifecycle responses owned by the currently authenticated Admin. Ownership always comes from the server session and `Assignment.scheduledBy`; the API does not accept a scheduler identity from the browser. A team-wide or SuperAdmin “All Responses” view is intentionally deferred until the application has an explicit shared permission for it.

The default operational window is the previous 7 days through the next 60 days, based on the authoritative Schedule or Event date. The API caps candidate lifecycle records at 500 and returns only a small response DTO. Missing or deleted source records remain visible as unavailable instead of breaking the queue. Legacy Schedule/Event assignments without an Assignment lifecycle do not appear because rollout remains forward-only.

Queue priority is predictable:

1. Change Requested
2. Declined
3. Pending
4. Confirmed
5. Cancelled, when explicitly requested

Within a status, the nearest source date appears first; ties use the most recent response or scheduling timestamp. The default **Needs Attention** view includes Change Requested, Declined, and Pending. Summary cards are derived from the same authenticated, date-bounded query.

Pending rows show only a sanitized delivery condition: Telegram sent, not connected, disabled, failed, or not attempted. Authorized schedulers can use **Send Again**, which calls the existing secured `POST /api/assignments/<id>/notify` route. Message content and recipient are never browser-controlled.

The page refreshes every 15 seconds while mounted and stops polling on unmount. It also provides a manual Refresh button. No WebSocket, scheduler Telegram notification, Admin Telegram linking, response-state changes, or Request Change reason workflow is introduced.

## Manual verification

1. Log in as Admin A.
2. Assign Volunteer X and confirm the Assignment appears as Pending in My Responses.
3. Have Volunteer X accept in Telegram and confirm the next poll changes the row to Confirmed.
4. Assign another Volunteer, have them decline, and confirm Declined appears prominently.
5. Trigger Request Change and confirm Change Requested appears first.
6. Log in as Admin B and confirm Admin A’s assignments do not appear.
7. Test Send Again for an appropriate Pending or failed delivery and verify its sanitized result.
8. Open the page at a narrow viewport and verify cards, filters, rows, and actions remain usable.
