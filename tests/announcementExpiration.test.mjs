import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAnnouncementExpiresAt,
  endOfManilaCalendarDate,
  getAnnouncementStatus,
  getEffectiveAnnouncementExpiration,
  isAnnouncementVisible,
  normalizeAnnouncementExpiration
} from "../utils/announcementExpiration.ts";
import { authorizeAnnouncement } from "../utils/announcementPermissions.ts";
import { isValidAnnouncementObjectId } from "../utils/announcementValidation.ts";

const published = new Date("2026-09-01T07:00:00.000Z"); // 3:00 PM in Manila

test("normal announcement expires seven days after publication", () => {
  const expires = calculateAnnouncementExpiresAt({ expirationMode: "AFTER_DAYS", publishAt: published, expirationDays: 7 });
  assert.equal(expires?.toISOString(), "2026-09-08T15:59:59.999Z");
});

test("relevant-date announcement expires at end of its Manila calendar day", () => {
  const expires = calculateAnnouncementExpiresAt({ expirationMode: "EVENT_DATE", publishAt: published, relevantDate: "2026-09-05" });
  assert.equal(expires?.toISOString(), "2026-09-05T15:59:59.999Z");
});

test("event-linked announcement derives expiration from the event date", () => {
  const expires = calculateAnnouncementExpiresAt({ expirationMode: "EVENT_DATE", publishAt: published, eventDate: "2026-09-05T00:00:00.000Z" });
  assert.equal(expires?.toISOString(), "2026-09-05T15:59:59.999Z");
});

test("custom date expires at the end of the selected Manila date", () => {
  const expires = calculateAnnouncementExpiresAt({ expirationMode: "CUSTOM", publishAt: published, customDate: "2026-09-08" });
  assert.equal(expires?.toISOString(), "2026-09-08T15:59:59.999Z");
});

test("never-expiring announcement has no expiration", () => {
  assert.equal(calculateAnnouncementExpiresAt({ expirationMode: "NEVER", publishAt: published }), null);
});

test("expired announcement is excluded from volunteer visibility but retains admin status", () => {
  const announcement = { isActive: true, publishAt: published, expiresAt: "2026-09-02T00:00:00.000Z" };
  const now = new Date("2026-09-03T00:00:00.000Z");
  assert.equal(isAnnouncementVisible(announcement, now), false);
  assert.equal(getAnnouncementStatus(announcement, now), "EXPIRED");
});

test("pinned but expired announcement remains invisible", () => {
  const announcement = { isActive: true, isPinned: true, publishAt: published, expiresAt: "2026-09-02T00:00:00.000Z" };
  assert.equal(isAnnouncementVisible(announcement, new Date("2026-09-03T00:00:00.000Z")), false);
});

test("legacy announcement falls back to seven days after creation", () => {
  const expires = getEffectiveAnnouncementExpiration({ isActive: true, createdAt: published });
  assert.equal(expires?.toISOString(), "2026-09-08T15:59:59.999Z");
});

test("AFTER_DAYS remains visible through the expiration instant", () => {
  const expiresAt = calculateAnnouncementExpiresAt({ expirationMode: "AFTER_DAYS", publishAt: published, expirationDays: 7 });
  const announcement = { isActive: true, publishAt: published, expiresAt };
  assert.equal(isAnnouncementVisible(announcement, new Date("2026-09-08T15:59:59.999Z")), true);
  assert.equal(isAnnouncementVisible(announcement, new Date("2026-09-08T16:00:00.000Z")), false);
});

test("Manila midnight boundary keeps announcement visible through 11:59:59 PM", () => {
  const expiresAt = endOfManilaCalendarDate("2026-09-05");
  const announcement = { isActive: true, publishAt: published, expiresAt };
  assert.equal(isAnnouncementVisible(announcement, new Date("2026-09-05T15:59:59.999Z")), true);
  assert.equal(isAnnouncementVisible(announcement, new Date("2026-09-05T16:00:00.000Z")), false);
});

test("invalid expiration settings are rejected", () => {
  assert.throws(() => calculateAnnouncementExpiresAt({ expirationMode: "AFTER_DAYS", publishAt: published, expirationDays: 0 }), /positive/);
  assert.throws(() => calculateAnnouncementExpiresAt({ expirationMode: "CUSTOM", publishAt: published }), /custom/);
  assert.throws(() => calculateAnnouncementExpiresAt({ expirationMode: "EVENT_DATE", publishAt: published }), /event or relevant/);
  assert.throws(() => calculateAnnouncementExpiresAt({ expirationMode: "CUSTOM", publishAt: published, customDate: "2026-02-31" }), /valid calendar/);
});

test("mode normalization removes stale event fields", () => {
  const common = { publishAt: published, relatedEvent: "507f1f77bcf86cd799439011", relevantDate: "2026-09-05" };
  const custom = normalizeAnnouncementExpiration({ ...common, expirationMode: "CUSTOM", customDate: "2026-09-10" });
  assert.equal("relatedEvent" in custom, false);
  assert.equal("relevantDate" in custom, false);
  assert.equal("expirationDays" in custom, false);

  const afterDays = normalizeAnnouncementExpiration({ ...common, expirationMode: "AFTER_DAYS", expirationDays: 3 });
  assert.equal("relatedEvent" in afterDays, false);
  assert.equal("relevantDate" in afterDays, false);
  assert.equal(afterDays.expirationDays, 3);

  const never = normalizeAnnouncementExpiration({ ...common, expirationMode: "NEVER", expirationDays: 3 });
  assert.equal("relatedEvent" in never, false);
  assert.equal("expiresAt" in never, false);
  assert.equal("expirationDays" in never, false);
});

test("switching from NEVER to AFTER_DAYS creates a concrete expiration", () => {
  const normalized = normalizeAnnouncementExpiration({ expirationMode: "AFTER_DAYS", publishAt: published, expirationDays: 7 });
  assert.equal(normalized.expiresAt?.toISOString(), "2026-09-08T15:59:59.999Z");
});

test("announcement permissions require authentication, admin, and the requested permission", () => {
  assert.deepEqual(authorizeAnnouncement(null, "VIEW_ANNOUNCEMENTS"), { allowed: false, status: 401 });
  assert.deepEqual(authorizeAnnouncement({ user: { isAdmin: false, permissions: ["VIEW_ANNOUNCEMENTS"] } }, "VIEW_ANNOUNCEMENTS"), { allowed: false, status: 403 });
  assert.deepEqual(authorizeAnnouncement({ user: { isAdmin: true, permissions: [] } }, "VIEW_ANNOUNCEMENTS"), { allowed: false, status: 403 });
  assert.deepEqual(authorizeAnnouncement({ user: { isAdmin: true, permissions: ["VIEW_ANNOUNCEMENTS"] } }, "VIEW_ANNOUNCEMENTS"), { allowed: true });
  assert.deepEqual(authorizeAnnouncement({ user: { isAdmin: true, permissions: ["UPDATE_ANNOUNCEMENTS"] } }, "UPDATE_ANNOUNCEMENTS"), { allowed: true });
});

test("public visibility excludes scheduled, archived, inactive, and expired announcements", () => {
  const now = new Date("2026-09-03T00:00:00.000Z");
  assert.equal(isAnnouncementVisible({ isActive: true, publishAt: "2026-09-04T00:00:00.000Z", expiresAt: "2026-09-10T00:00:00.000Z" }, now), false);
  assert.equal(isAnnouncementVisible({ isActive: true, isArchived: true, publishAt: published, expirationMode: "NEVER" }, now), false);
  assert.equal(isAnnouncementVisible({ isActive: false, publishAt: published, expirationMode: "NEVER" }, now), false);
  assert.equal(isAnnouncementVisible({ isActive: true, publishAt: published, expiresAt: "2026-09-02T00:00:00.000Z" }, now), false);
});

test("public visibility includes a published active NEVER announcement", () => {
  assert.equal(isAnnouncementVisible({ isActive: true, publishAt: published, expirationMode: "NEVER" }, new Date("2026-09-03T00:00:00.000Z")), true);
});

test("announcement and event IDs reject malformed MongoDB object IDs", () => {
  assert.equal(isValidAnnouncementObjectId("not-an-object-id"), false);
  assert.equal(isValidAnnouncementObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isValidAnnouncementObjectId(null), false);
});
