import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import {
  buildAssignmentMessage,
  notifyAssignment,
  notificationServiceDependencies
} from "../services/notifications/notificationService.ts";
import {
  NotificationProviderError,
  sendTelegramNotification,
  telegramProviderDependencies
} from "../services/notifications/providers/telegramProvider.ts";
import { TelegramApiError } from "../utils/telegram/telegramApi.ts";

const assignmentId = new mongoose.Types.ObjectId();
const volunteerId = new mongoose.Types.ObjectId();
const scheduleId = new mongoose.Types.ObjectId();
const eventId = new mongoose.Types.ObjectId();

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function matches(object, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some(option => matches(object, option));
    const actual = getPath(object, key);
    if (expected && typeof expected === "object" && !(expected instanceof mongoose.Types.ObjectId)) {
      if ("$ne" in expected) return actual !== expected.$ne;
      if ("$lt" in expected) return actual < expected.$lt;
    }
    return actual?.toString() === expected?.toString();
  });
}

function applyUpdate(object, update) {
  for (const [path, value] of Object.entries(update.$set || {})) {
    const keys = path.split(".");
    let target = object;
    for (const key of keys.slice(0, -1)) target = target[key] ||= {};
    target[keys.at(-1)] = value;
  }
  for (const path of Object.keys(update.$unset || {})) {
    const keys = path.split(".");
    const target = keys.slice(0, -1).reduce((value, key) => value?.[key], object);
    if (target) delete target[keys.at(-1)];
  }
  for (const [path, amount] of Object.entries(update.$inc || {})) {
    object[path] = (object[path] || 0) + amount;
  }
}

function harness(options = {}) {
  const assignment = {
    _id: assignmentId,
    sourceType: options.sourceType || "SCHEDULE",
    schedule: scheduleId,
    event: eventId,
    volunteer: volunteerId,
    role: options.role || "FOH",
    status: "PENDING",
    version: 1,
    slotKey: options.sourceType === "EVENT" ? `event:${eventId}:${options.role || "foh"}` : `schedule:${scheduleId}`,
    activeSlotKey: options.sourceType === "EVENT" ? `event:${eventId}:${options.role || "foh"}` : `schedule:${scheduleId}`,
    notificationAttempts: 0,
    notificationDeliveryState: "NONE"
  };
  const volunteer = {
    _id: volunteerId,
    active: true,
    telegram: options.telegram === null ? undefined : {
      userId: "telegram-user",
      chatId: options.chatId || "current-chat",
      notificationsEnabled: options.notificationsEnabled ?? true,
      linkVersion: 1
    }
  };
  const schedule = { _id: scheduleId, volunteer: volunteerId, date: new Date("2026-09-06T00:00:00Z"), service: "AM" };
  const event = {
    _id: eventId,
    status: "confirmed",
    eventName: "Worship Night",
    date: new Date("2026-09-07T00:00:00Z"),
    callTime: "5:00 PM",
    assignedVolunteers: { [options.role || "foh"]: volunteerId }
  };
  const sends = [];
  let failSentMetadata = false;
  let providerError;
  const Assignment = {
    async findById(id) { return id.toString() === assignmentId.toString() ? assignment : null; },
    async findOneAndUpdate(filter, update) {
      if (!matches(assignment, filter)) return null;
      applyUpdate(assignment, update);
      return assignment;
    },
    async updateOne(filter, update) {
      if (!matches(assignment, filter)) return { modifiedCount: 0 };
      if (failSentMetadata && update.$set?.lastNotificationStatus === "SENT") {
        failSentMetadata = false;
        throw new Error("injected metadata failure");
      }
      applyUpdate(assignment, update);
      return { modifiedCount: 1 };
    }
  };
  Object.assign(notificationServiceDependencies, {
    Assignment,
    Schedule: { async findById() { return schedule; } },
    Event: { async findById() { return event; } },
    Volunteer: { async findById() { return volunteer; } },
    now: () => new Date("2026-08-29T12:00:00Z"),
    randomUUID: () => `attempt-${assignment.notificationAttempts + 1}`,
    async sendTelegramNotification(chatId, message) {
      sends.push({ chatId, message });
      if (providerError) throw providerError;
      return { messageId: String(700 + sends.length) };
    },
    logger: { info() {}, warn() {}, error() {} }
  });
  return {
    assignment, volunteer, schedule, event, sends,
    failMetadataOnce() { failSentMetadata = true; },
    failProvider(error = new NotificationProviderError("TELEGRAM_FORBIDDEN")) { providerError = error; }
  };
}

test("linked Schedule assignment sends once, stores SENT metadata, and remains PENDING", async () => {
  const h = harness();
  const first = await notifyAssignment(assignmentId.toString());
  const retry = await notifyAssignment(assignmentId.toString());
  assert.equal(first.status, "SENT");
  assert.equal(retry.duplicate, true);
  assert.equal(h.sends.length, 1);
  assert.equal(h.sends[0].chatId, "current-chat");
  assert.match(h.sends[0].message, /Date:.*September 6, 2026/);
  assert.match(h.sends[0].message, /Service: AM/);
  assert.equal(h.assignment.status, "PENDING");
  assert.equal(h.assignment.lastNotificationStatus, "SENT");
  assert.equal(h.assignment.telegramMessageId, "701");
  assert.equal(h.assignment.notificationAttempts, 1);
});

test("unlinked and disabled Volunteers are skipped without Telegram calls", async () => {
  let h = harness({ telegram: null });
  assert.equal((await notifyAssignment(assignmentId.toString())).status, "SKIPPED_NO_LINK");
  assert.equal(h.sends.length, 0);
  assert.equal(h.assignment.status, "PENDING");
  h = harness({ notificationsEnabled: false });
  assert.equal((await notifyAssignment(assignmentId.toString())).status, "SKIPPED_DISABLED");
  assert.equal(h.sends.length, 0);
  h = harness();
  h.volunteer.active = false;
  assert.equal((await notifyAssignment(assignmentId.toString())).status, "SKIPPED_DISABLED");
  assert.equal(h.sends.length, 0);
});

test("Telegram failure stores only normalized FAILED metadata and preserves assignment", async () => {
  const h = harness();
  h.failProvider();
  const result = await notifyAssignment(assignmentId.toString());
  assert.deepEqual(result, { status: "FAILED", errorCode: "TELEGRAM_FORBIDDEN" });
  assert.equal(h.assignment.status, "PENDING");
  assert.equal(h.assignment.lastNotificationStatus, "FAILED");
  assert.equal(h.assignment.lastNotificationErrorCode, "TELEGRAM_FORBIDDEN");
  assert.equal(h.assignment.notificationAttempts, 1);
});

test("send success followed by metadata failure leaves a non-resending PROCESSING claim", async () => {
  const h = harness();
  h.failMetadataOnce();
  const first = await notifyAssignment(assignmentId.toString());
  const retry = await notifyAssignment(assignmentId.toString());
  assert.equal(first.outcomeUnknown, true);
  assert.equal(retry.status, "PROCESSING");
  assert.equal(h.sends.length, 1);
  assert.equal(h.assignment.notificationDeliveryState, "PROCESSING");
});

test("manual retry intentionally bypasses SENT but blocks an in-flight double submit", async () => {
  const h = harness();
  await notifyAssignment(assignmentId.toString());
  await notifyAssignment(assignmentId.toString(), { manual: true });
  assert.equal(h.sends.length, 2);
  h.assignment.notificationDeliveryState = "PROCESSING";
  assert.equal((await notifyAssignment(assignmentId.toString(), { manual: true })).status, "PROCESSING");
  assert.equal(h.sends.length, 2);
  h.assignment.notificationClaimedAt = new Date("2026-08-29T11:40:00Z");
  await notifyAssignment(assignmentId.toString(), { manual: true });
  assert.equal(h.sends.length, 3);
});

test("current Telegram chat is read at send time after relink", async () => {
  const h = harness({ chatId: "new-current-chat" });
  await notifyAssignment(assignmentId.toString());
  assert.equal(h.sends[0].chatId, "new-current-chat");
});

test("Event content uses authoritative event fields and idempotent retry does not resend", async () => {
  const h = harness({ sourceType: "EVENT", role: "foh" });
  await notifyAssignment(assignmentId.toString());
  await notifyAssignment(assignmentId.toString());
  assert.equal(h.sends.length, 1);
  assert.match(h.sends[0].message, /Event: Worship Night/);
  assert.match(h.sends[0].message, /Call Time: 5:00 PM/);
  assert.match(buildAssignmentMessage(h.assignment, h.event), /Role: foh/);
});

test("inactive and source-mismatched Assignments cannot be notified", async () => {
  let h = harness();
  h.assignment.status = "CANCELLED";
  delete h.assignment.activeSlotKey;
  await assert.rejects(notifyAssignment(assignmentId.toString()), error => error.code === "ASSIGNMENT_INACTIVE");
  h = harness();
  h.schedule.volunteer = new mongoose.Types.ObjectId();
  await assert.rejects(notifyAssignment(assignmentId.toString()), error => error.code === "SOURCE_MISMATCH");
  assert.equal(h.sends.length, 0);
});

test("Telegram provider normalizes errors without leaking token-bearing text", async () => {
  const token = "secret-bot-token";
  telegramProviderDependencies.createTelegramApi = () => ({
    async sendMessage() {
      throw new TelegramApiError(`forbidden ${token}`, { method: "sendMessage", httpStatus: 403, telegramErrorCode: 403 });
    }
  });
  await assert.rejects(
    sendTelegramNotification("unlogged-chat", "generated message"),
    error => error.code === "TELEGRAM_FORBIDDEN" && !error.message.includes(token)
  );
});

test("manual route accepts no browser recipient or message and requires server auth", async () => {
  const source = await readFile(new URL("../app/api/assignments/[id]/notify/route.ts", import.meta.url), "utf8");
  assert.match(source, /requireAssignmentAdmin\(session\)/);
  assert.match(source, /notifyAssignment\(params\.id, \{ manual: true \}\)/);
  assert.doesNotMatch(source, /request\.json|chatId|messageBody|recipient/);
});
