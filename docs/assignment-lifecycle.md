# Assignment lifecycle foundation

`Schedule.volunteer`, `Volunteer.schedules`, and `Event.assignedVolunteers[role]`
remain the primary compatibility structures in version 1.1 pass 1. `Assignment`
adds durable response state and audit history for assignments changed after this
feature is deployed.

## Invariants

- A Schedule slot has at most one non-`CANCELLED` lifecycle.
- An Event role has at most one non-`CANCELLED` lifecycle.
- De-assignment, reassignment, Event cancellation, and Event deletion cancel
  lifecycle records; they never delete them.
- A new assignee receives a new `PENDING` record. Cancellation increments the
  cancelled record's version and appends an admin/Web history entry.
- Active records hold a deterministic `activeSlotKey` (`schedule:<id>` or
  `event:<id>:<role>`). A unique sparse database index prevents competing active
  records; cancellation unsets that key so historical rows can coexist.
- Reconciliation always rereads the stored Schedule/Event as authoritative,
  repairs reverse references, and retries duplicate-key races before returning.

The active-slot invariant is database-enforced. Schedule reconciliation removes
the Schedule from every incorrect Volunteer using the indexed `schedules` field,
then adds it to the authoritative Volunteer. This makes a retry repair failures
that occurred after the primary Schedule write.

## Consistency and failure behavior

The current MongoDB connection does not declare a replica set or transaction
support. This pass does not assume transactions are available. The primary
Schedule/Event representation is written first, related Volunteer references and
Assignment history follow, and Google Sheets/Calendar calls occur last.

- A failed primary write cannot create a lifecycle that falsely reports success.
- If a reverse-reference or lifecycle write fails, the API returns an error.
  Retrying rereads authoritative state and repairs reverse references and the
  active lifecycle without creating a duplicate.
- Google Calendar failures retain the existing behavior: they are logged and the
  successful database update remains. The operation can be retried later.
- Google Sheets helpers retain their existing best-effort behavior and log their
  own failures. Assignment history remains consistent with the database even if
  the external sheet is temporarily stale.
- There is no queue in this pass. Google cleanup failures are logged with the
  captured Calendar event ID and reported as pending without resurrecting the
  deleted Event.

## Version semantics

`version` is the optimistic-concurrency version of one lifecycle record. It
starts at 1 and increments on cancellation or any material response transition.
Reassignment creates a distinct lifecycle beginning at 1. Future asynchronous
handlers must atomically match `_id`, the expected `version`, and expected current
status, update state/history, and increment `version`. A stale match returns no
record and must not be retried as an unconditional update.

## Existing data and backfill

Rollout is forward-only by default. No migration runs at application startup.
Existing untouched Schedule and Event assignments may have no lifecycle record.
An idempotent edit through the changed routes creates a missing `PENDING`
lifecycle. Telegram work must skip any legacy assignment without a lifecycle.

A production backfill script is not included in pass 1 because the correct
historical `scheduledBy` Admin cannot be inferred safely from existing Schedule
or Event documents. A later standalone backfill must require an explicit Admin
actor, default to dry-run, create only missing active records, and never delete or
rewrite existing lifecycle history.

No backfill script is included because historical scheduler identity cannot be
inferred. Backfill remains an explicit later operation, never an application
startup behavior.

The feature-specific authenticated-Admin helper is intentionally narrow. It must
eventually converge with the shared authorization helper from the security work;
this pass does not introduce a parallel RBAC policy.
