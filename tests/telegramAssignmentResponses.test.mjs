import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  hashTelegramAssignmentActionToken,
  issueAssignmentActionTokens,
  respondToAssignmentAction,
  telegramAssignmentActionDependencies
} from "../services/telegram/telegramAssignmentActionService.ts";
import {
  handleTelegramUpdate,
  telegramWebhookDependencies
} from "../services/telegram/telegramWebhookService.ts";
import TelegramAssignmentAction from "../models/telegramAssignmentAction.ts";

const ids = {
  assignment: new mongoose.Types.ObjectId(),
  volunteer: new mongoose.Types.ObjectId(),
  schedule: new mongoose.Types.ObjectId()
};

function matches(document, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = document[key];
    if (expected && typeof expected === "object" && !(expected instanceof mongoose.Types.ObjectId) && !(expected instanceof Date)) {
      if ("$exists" in expected && (actual !== undefined) !== expected.$exists) return false;
      if ("$gt" in expected && !(actual > expected.$gt)) return false;
      if ("$ne" in expected && actual?.toString() === expected.$ne?.toString()) return false;
      return true;
    }
    return actual?.toString() === expected?.toString();
  });
}

function responseHarness(options = {}) {
  const now = new Date("2026-08-29T04:00:00.000Z");
  const assignment = {
    _id: ids.assignment,
    sourceType: "SCHEDULE",
    schedule: ids.schedule,
    volunteer: ids.volunteer,
    role: "FOH",
    status: options.status || "PENDING",
    version: options.version || 1,
    responseHistory: [{ action: "ASSIGNED" }]
  };
  const volunteer = {
    _id: ids.volunteer,
    telegram: options.unlinked ? undefined : { userId: options.userId || "9001", linkVersion: options.linkVersion ?? 4 }
  };
  const schedule = {
    _id: ids.schedule,
    volunteer: options.sourceVolunteer || ids.volunteer,
    date: options.date || new Date("2026-08-29T00:00:00.000Z")
  };
  const actions = [];
  let counter = 0;
  let cleanupFails = false;
  const actionModel = {
    async insertMany(documents) {
      for (const document of documents) actions.push({ _id: new mongoose.Types.ObjectId(), ...document });
      return documents;
    },
    async findOne(filter) { return actions.find(action => matches(action, filter)) || null; },
    async updateOne(filter, update) {
      if (cleanupFails) throw new Error("injected cleanup failure");
      const action = actions.find(item => matches(item, filter));
      if (!action) return { modifiedCount: 0 };
      Object.assign(action, update.$set);
      return { modifiedCount: 1 };
    },
    async updateMany(filter, update) {
      if (cleanupFails) throw new Error("injected cleanup failure");
      let modifiedCount = 0;
      for (const action of actions.filter(item => matches(item, filter))) {
        Object.assign(action, update.$set);
        modifiedCount += 1;
      }
      return { modifiedCount };
    }
  };
  Object.assign(telegramAssignmentActionDependencies, {
    TelegramAssignmentAction: actionModel,
    Assignment: { async findById() { return assignment; } },
    Volunteer: { async findById() { return volunteer; } },
    Schedule: { async findById() { return schedule; } },
    Event: { async findById() { return null; } },
    now: () => now,
    randomBytes() {
      counter += 1;
      return Buffer.alloc(24, counter);
    },
    async transitionAssignment(input) {
      if (assignment.status !== "PENDING" || assignment.version !== input.expectedVersion ||
          assignment.volunteer.toString() !== input.volunteerId) return null;
      assignment.status = input.nextStatus;
      assignment.version += 1;
      assignment.respondedAt = input.at;
      assignment.responseChannel = "TELEGRAM";
      assignment.responseHistory.push({
        action: input.nextStatus,
        actorType: "VOLUNTEER",
        actorId: new mongoose.Types.ObjectId(input.volunteerId),
        channel: "TELEGRAM",
        at: input.at
      });
      return assignment;
    },
    logger: { error() {} }
  });
  const issue = () => issueAssignmentActionTokens({
    assignment,
    volunteer,
    source: schedule,
    notificationAttemptId: `attempt-${counter + 1}`
  });
  return { assignment, volunteer, schedule, actions, issue, setCleanupFailure(value) { cleanupFails = value; } };
}

test("notification action tokens are opaque, hashed, action-bound, and form three compact buttons", async () => {
  const h = responseHarness();
  const result = await h.issue();
  assert.deepEqual(result.buttons.map(button => button.text), ["✅ Accept", "❌ Decline", "🔄 Request Change"]);
  assert.equal(h.actions.length, 3);
  for (const button of result.buttons) {
    assert.match(button.callbackData, /^a:[A-Za-z0-9_-]{32}$/);
    assert.equal(button.callbackData.includes(ids.assignment.toString()), false);
    assert.equal(button.callbackData.includes(ids.volunteer.toString()), false);
    const plaintext = button.callbackData.slice(2);
    assert.ok(h.actions.some(action => action.tokenHash === hashTelegramAssignmentActionToken(plaintext)));
    assert.equal(JSON.stringify(h.actions).includes(plaintext), false);
  }
});

test("response action schema enforces unique hashes and expiration cleanup", () => {
  const indexes = TelegramAssignmentAction.schema.indexes();
  assert.equal(indexes.find(([fields]) => fields.tokenHash === 1)?.[1].unique, true);
  assert.equal(indexes.find(([fields]) => fields.expiresAt === 1)?.[1].expireAfterSeconds, 0);
});

test("a final response receives no fresh action buttons on a later manual notification", async () => {
  const h = responseHarness({ status: "CONFIRMED" });
  assert.deepEqual((await h.issue()).buttons, []);
  assert.equal(h.actions.length, 0);
});

for (const [action, expectedStatus, expectedHistory] of [
  ["ACCEPT", "CONFIRMED", "CONFIRMED"],
  ["DECLINE", "DECLINED", "DECLINED"],
  ["REQUEST_CHANGE", "CHANGE_REQUESTED", "CHANGE_REQUESTED"]
]) {
  test(`${action} atomically transitions PENDING and records Telegram volunteer history`, async () => {
    const h = responseHarness();
    const issued = await h.issue();
    const button = issued.buttons[["ACCEPT", "DECLINE", "REQUEST_CHANGE"].indexOf(action)];
    const result = await respondToAssignmentAction({ token: button.callbackData.slice(2), telegramUserId: "9001" });
    assert.equal(result.outcome, "SUCCESS");
    assert.equal(h.assignment.status, expectedStatus);
    assert.equal(h.assignment.version, 2);
    assert.equal(h.assignment.responseChannel, "TELEGRAM");
    assert.deepEqual(h.assignment.responseHistory.at(-1), {
      action: expectedHistory,
      actorType: "VOLUNTEER",
      actorId: ids.volunteer,
      channel: "TELEGRAM",
      at: new Date("2026-08-29T04:00:00.000Z")
    });
    assert.equal(h.actions.filter(item => item.invalidatedAt).length, 2);
    assert.equal(h.actions.filter(item => item.usedAt).length, 1);
  });
}

test("double click and competing buttons allow only the first final response", async () => {
  const h = responseHarness();
  const issued = await h.issue();
  const [accept, decline] = issued.buttons.map(button => button.callbackData.slice(2));
  const [first, second] = await Promise.all([
    respondToAssignmentAction({ token: accept, telegramUserId: "9001" }),
    respondToAssignmentAction({ token: decline, telegramUserId: "9001" })
  ]);
  assert.equal([first, second].filter(result => result.outcome === "SUCCESS").length, 1);
  assert.equal(h.assignment.version, 2);
  assert.ok(["CONFIRMED", "DECLINED"].includes(h.assignment.status));
  const replay = await respondToAssignmentAction({ token: accept, telegramUserId: "9001" });
  assert.ok(["UNAVAILABLE", "RESPONDED"].includes(replay.outcome));
});

test("identity, link version, ownership, assignment version, cancellation, expiry and past-date checks reject stale buttons", async () => {
  const cases = [
    { mutate(h) {}, user: "wrong-user", outcome: "UNAVAILABLE" },
    { mutate(h) { h.volunteer.telegram.linkVersion += 1; }, user: "9001", outcome: "UNAVAILABLE" },
    { mutate(h) { delete h.volunteer.telegram; }, user: "9001", outcome: "UNAVAILABLE" },
    { mutate(h) { h.assignment.volunteer = new mongoose.Types.ObjectId(); }, user: "9001", outcome: "UNAVAILABLE" },
    { mutate(h) { h.assignment.version += 1; }, user: "9001", outcome: "CHANGED" },
    { mutate(h) { h.assignment.status = "CANCELLED"; }, user: "9001", outcome: "UNAVAILABLE" },
    { mutate(h) { h.actions.forEach(action => { action.expiresAt = new Date("2026-08-28T00:00:00Z"); }); }, user: "9001", outcome: "UNAVAILABLE" },
    { mutate(h) { h.schedule.date = new Date("2026-08-28T00:00:00Z"); }, user: "9001", outcome: "UNAVAILABLE" }
  ];
  for (const scenario of cases) {
    const h = responseHarness();
    const issued = await h.issue();
    scenario.mutate(h);
    const result = await respondToAssignmentAction({ token: issued.buttons[0].callbackData.slice(2), telegramUserId: scenario.user });
    assert.equal(result.outcome, scenario.outcome);
    assert.equal(h.assignment.responseHistory.length, 1);
  }
  assert.equal((await respondToAssignmentAction({ token: "Z".repeat(32), telegramUserId: "9001" })).outcome, "UNAVAILABLE");
});

test("a crash after transition cannot transition again even if action cleanup failed", async () => {
  const h = responseHarness();
  const issued = await h.issue();
  const token = issued.buttons[0].callbackData.slice(2);
  h.setCleanupFailure(true);
  assert.equal((await respondToAssignmentAction({ token, telegramUserId: "9001" })).outcome, "SUCCESS");
  h.setCleanupFailure(false);
  assert.equal((await respondToAssignmentAction({ token, telegramUserId: "9001" })).outcome, "RESPONDED");
  assert.equal(h.assignment.version, 2);
});

test("successful callback is acknowledged and message-edit failure does not undo Assignment response", async () => {
  const calls = [];
  Object.assign(telegramWebhookDependencies, {
    async respondToAssignmentAction(input) {
      calls.push({ kind: "response", input });
      return { outcome: "SUCCESS", acknowledgement: "Schedule confirmed.", messageStatus: "✅ Confirmed" };
    },
    createTelegramApi() {
      return {
        async answerCallbackQuery(id, text) { calls.push({ kind: "answer", id, text }); },
        async editMessageText() { throw new Error("injected edit failure"); }
      };
    },
    logger: { error(message, details) { calls.push({ kind: "log", message, details }); } }
  });
  await handleTelegramUpdate({
    type: "callback_query",
    update: {
      updateId: "77",
      callbackQuery: {
        id: "callback-id",
        from: { id: "9001" },
        data: `a:${"A".repeat(32)}`,
        message: { messageId: "12", chat: { id: "34", type: "private" }, text: "Assignment details" }
      }
    }
  });
  assert.deepEqual(calls[0], { kind: "response", input: { token: "A".repeat(32), telegramUserId: "9001" } });
  assert.equal(calls[1].kind, "answer");
  assert.equal(calls.at(-1).kind, "log");
  assert.equal(JSON.stringify(calls).includes("a:" + "A".repeat(32)), false);
});
