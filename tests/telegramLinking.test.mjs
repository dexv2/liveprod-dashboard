import test from "node:test";
import assert from "node:assert/strict";
import TelegramLinkToken, { TELEGRAM_LINK_TOKEN_TTL_MINUTES } from "../models/telegramLinkToken.ts";
import Volunteer from "../models/volunteer.ts";
import {
  generateTelegramLink,
  getTelegramLinkStatus,
  hashTelegramLinkToken,
  linkVolunteerFromTelegram,
  TelegramLinkError,
  telegramLinkDependencies,
  unlinkVolunteerTelegram
} from "../services/telegram/telegramLinkService.ts";
import { readFile } from "node:fs/promises";
import { processTelegramWebhook, telegramWebhookDependencies, TELEGRAM_FOUNDATION_MESSAGES } from "../services/telegram/telegramWebhookService.ts";

const volunteerA = "64b000000000000000000001";
const volunteerB = "64b000000000000000000002";
const adminId = "64a000000000000000000001";
const fixedNow = new Date("2026-08-29T00:00:00.000Z");

function matchesValue(actual, expected) {
  if (expected && typeof expected === "object" && !(expected instanceof Date)) {
    if ("$ne" in expected && String(actual) === String(expected.$ne)) return false;
    if ("$gt" in expected && !(actual > expected.$gt)) return false;
    if ("$exists" in expected && (actual !== undefined) !== expected.$exists) return false;
    if ("$in" in expected && !expected.$in.includes(actual)) return false;
    return true;
  }
  return String(actual) === String(expected);
}

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function matches(object, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === "$or") return expected.some(option => matches(object, option));
    return matchesValue(getPath(object, key), expected);
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
  for (const [path, value] of Object.entries(update.$inc || {})) {
    const keys = path.split(".");
    let target = object;
    for (const key of keys.slice(0, -1)) target = target[key] ||= {};
    target[keys.at(-1)] = (target[keys.at(-1)] || 0) + value;
  }
  return object;
}

function harness() {
  process.env.TELEGRAM_BOT_USERNAME = "ccf_test_bot";
  const volunteers = new Map([
    [volunteerA, { _id: volunteerA, name: "Volunteer A", telegram: { notificationsEnabled: false, linkVersion: 0 } }],
    [volunteerB, { _id: volunteerB, name: "Volunteer B", telegram: { notificationsEnabled: false, linkVersion: 0 } }]
  ]);
  const tokens = [];
  let failVolunteerUpdate = false;
  const VolunteerModel = {
    async findById(id) { return volunteers.get(String(id)) || null; },
    async findOne(query) { return [...volunteers.values()].find(item => matches(item, query)) || null; },
    async findOneAndUpdate(query, update) {
      if (failVolunteerUpdate) {
        failVolunteerUpdate = false;
        throw new Error("injected volunteer update failure");
      }
      const volunteer = [...volunteers.values()].find(item => matches(item, query));
      return volunteer ? applyUpdate(volunteer, update) : null;
    },
    async findByIdAndUpdate(id, update) {
      const volunteer = volunteers.get(String(id));
      return volunteer ? applyUpdate(volunteer, update) : null;
    }
  };
  const TokenModel = {
    async countDocuments(query) { return tokens.filter(item => matches(item, query)).length; },
    async create(document) {
      const saved = { _id: `token-${tokens.length + 1}`, ...document };
      tokens.push(saved);
      return saved;
    },
    async updateMany(query, update) {
      const found = tokens.filter(item => matches(item, query));
      found.forEach(item => applyUpdate(item, update));
      return { modifiedCount: found.length };
    },
    async findOneAndUpdate(query, update) {
      const token = tokens.find(item => matches(item, query));
      return token ? applyUpdate(token, update) : null;
    },
    async findOne(query) { return tokens.find(item => matches(item, query)) || null; },
    async updateOne(query, update) {
      const token = tokens.find(item => matches(item, query));
      if (token) applyUpdate(token, update);
      return { modifiedCount: token ? 1 : 0 };
    }
  };
  Object.assign(telegramLinkDependencies, {
    Volunteer: VolunteerModel,
    TelegramLinkToken: TokenModel,
    randomBytes: () => Buffer.alloc(24, tokens.length + 1),
    now: () => fixedNow
  });
  return {
    volunteers,
    tokens,
    failNextVolunteerUpdate() { failVolunteerUpdate = true; },
    async issue(id = volunteerA) { return generateTelegramLink({ volunteerId: id, createdBy: adminId }); },
    tokenFrom(link) { return new URL(link).searchParams.get("start"); }
  };
}

test("link generation returns an opaque token but stores only its SHA-256 hash and server actor", async () => {
  const h = harness();
  const result = await h.issue();
  const token = h.tokenFrom(result.link);
  assert.equal(token.length, 32);
  assert.equal(h.tokens[0].tokenHash, hashTelegramLinkToken(token));
  assert.equal(JSON.stringify(h.tokens).includes(token), false);
  assert.equal(h.tokens[0].createdBy, adminId);
  assert.equal(result.expiresAt.getTime() - fixedNow.getTime(), TELEGRAM_LINK_TOKEN_TTL_MINUTES * 60000);
});

test("generation rejects malformed and nonexistent volunteers and missing bot configuration", async () => {
  harness();
  await assert.rejects(generateTelegramLink({ volunteerId: "bad", createdBy: adminId }), error => error.code === "INVALID_VOLUNTEER_ID");
  await assert.rejects(generateTelegramLink({ volunteerId: "64b000000000000000000099", createdBy: adminId }), error => error.code === "VOLUNTEER_NOT_FOUND");
  delete process.env.TELEGRAM_BOT_USERNAME;
  await assert.rejects(generateTelegramLink({ volunteerId: volunteerA, createdBy: adminId }), error => error.code === "BOT_NOT_CONFIGURED");
});

test("a new issue invalidates the prior unused link", async () => {
  const h = harness();
  await h.issue();
  await h.issue();
  assert.ok(h.tokens[0].invalidatedAt instanceof Date);
  assert.equal(h.tokens[1].invalidatedAt, undefined);
});

test("issuance restriction limits rapid repeated generation", async () => {
  const h = harness();
  for (let index = 0; index < 5; index += 1) await h.issue();
  await assert.rejects(h.issue(), error => error.code === "RATE_LIMITED" && error.status === 429);
});

test("valid token links once and an identical retry is idempotent", async () => {
  const h = harness();
  const token = h.tokenFrom((await h.issue()).link);
  const input = { token, telegramUserId: "1001", telegramChatId: "1001", chatType: "private" };
  await linkVolunteerFromTelegram(input);
  const retry = await linkVolunteerFromTelegram(input);
  assert.equal(retry.idempotent, true);
  assert.equal(h.volunteers.get(volunteerA).telegram.linkVersion, 1);
  assert.equal(h.tokens[0].state, "USED");
});

test("expired, invalid, used-by-another-user, and non-private tokens are rejected", async () => {
  const h = harness();
  const token = h.tokenFrom((await h.issue()).link);
  h.tokens[0].expiresAt = new Date(fixedNow.getTime() - 1);
  await assert.rejects(linkVolunteerFromTelegram({ token, telegramUserId: "1", telegramChatId: "1", chatType: "private" }), error => error.code === "TOKEN_UNAVAILABLE");
  await assert.rejects(linkVolunteerFromTelegram({ token: "x".repeat(32), telegramUserId: "1", telegramChatId: "1", chatType: "private" }), error => error.code === "TOKEN_UNAVAILABLE");
  h.tokens[0].expiresAt = new Date(fixedNow.getTime() + 60000);
  await linkVolunteerFromTelegram({ token, telegramUserId: "1", telegramChatId: "1", chatType: "private" });
  await assert.rejects(linkVolunteerFromTelegram({ token, telegramUserId: "2", telegramChatId: "2", chatType: "private" }), error => error.code === "TOKEN_UNAVAILABLE");
  await assert.rejects(linkVolunteerFromTelegram({ token, telegramUserId: "1", telegramChatId: "1", chatType: "group" }), error => error.code === "PRIVATE_CHAT_REQUIRED");
});

test("Telegram identity collision cannot transfer ownership", async () => {
  const h = harness();
  h.volunteers.get(volunteerB).telegram = { userId: "2002", chatId: "2002", linkVersion: 1 };
  const token = h.tokenFrom((await h.issue()).link);
  await assert.rejects(
    linkVolunteerFromTelegram({ token, telegramUserId: "2002", telegramChatId: "2002", chatType: "private" }),
    error => error.code === "TELEGRAM_ACCOUNT_COLLISION"
  );
  assert.equal(h.volunteers.get(volunteerB).telegram.userId, "2002");
  assert.equal(h.volunteers.get(volunteerA).telegram.userId, undefined);
});

test("fresh admin link can relink a volunteer and increments linkVersion", async () => {
  const h = harness();
  let token = h.tokenFrom((await h.issue()).link);
  await linkVolunteerFromTelegram({ token, telegramUserId: "old", telegramChatId: "old", chatType: "private" });
  token = h.tokenFrom((await h.issue()).link);
  await linkVolunteerFromTelegram({ token, telegramUserId: "new", telegramChatId: "new", chatType: "private" });
  const telegram = h.volunteers.get(volunteerA).telegram;
  assert.equal(telegram.userId, "new");
  assert.equal(telegram.linkVersion, 2);
  assert.notEqual(telegram.userId, "old");
});

test("failure after token claim recovers without burning token or double increment", async () => {
  const h = harness();
  const token = h.tokenFrom((await h.issue()).link);
  const input = { token, telegramUserId: "3003", telegramChatId: "3003", chatType: "private" };
  h.failNextVolunteerUpdate();
  await assert.rejects(linkVolunteerFromTelegram(input), /injected/);
  assert.equal(h.tokens[0].state, "PROCESSING");
  await linkVolunteerFromTelegram(input);
  assert.equal(h.tokens[0].state, "USED");
  assert.equal(h.volunteers.get(volunteerA).telegram.linkVersion, 1);
});

test("unlink clears identity, disables notifications, increments version, and invalidates in-progress links", async () => {
  const h = harness();
  h.volunteers.get(volunteerA).telegram = { userId: "4004", chatId: "4004", notificationsEnabled: true, linkVersion: 3 };
  await h.issue();
  h.tokens[0].state = "PROCESSING";
  h.tokens[0].processingTelegramUserId = "pending-user";
  const result = await unlinkVolunteerTelegram(volunteerA);
  const telegram = h.volunteers.get(volunteerA).telegram;
  assert.equal(result.connected, false);
  assert.equal(telegram.userId, undefined);
  assert.equal(telegram.notificationsEnabled, false);
  assert.equal(telegram.linkVersion, 4);
  assert.ok(h.tokens[0].invalidatedAt instanceof Date);
});

test("status is sanitized and never exposes token hashes or Telegram IDs", async () => {
  const h = harness();
  h.volunteers.get(volunteerA).telegram = { userId: "secret-user", chatId: "secret-chat", linkedAt: fixedNow, notificationsEnabled: true, linkVersion: 1 };
  await h.issue();
  const status = await getTelegramLinkStatus(volunteerA);
  assert.deepEqual(Object.keys(status).sort(), ["connected", "linkedAt", "notificationsEnabled", "pendingLink"]);
  assert.equal(JSON.stringify(status).includes("tokenHash"), false);
  assert.equal(JSON.stringify(status).includes("secret-user"), false);
});

test("schemas enforce unique Telegram user and token hash with token expiry TTL", () => {
  const volunteerIndex = Volunteer.schema.indexes().find(([fields]) => fields["telegram.userId"] === 1);
  assert.equal(volunteerIndex?.[1].unique, true);
  assert.equal(volunteerIndex?.[1].partialFilterExpression["telegram.userId"].$type, "string");
  const tokenIndexes = TelegramLinkToken.schema.indexes();
  assert.equal(tokenIndexes.find(([fields]) => fields.tokenHash === 1)?.[1].unique, true);
  assert.equal(tokenIndexes.find(([fields]) => fields.expiresAt === 1)?.[1].expireAfterSeconds, 0);
});

test("link route derives createdBy from session and never reads browser actor identity", async () => {
  const source = await readFile(new URL("../app/api/volunteers/[id]/telegram-link/route.ts", import.meta.url), "utf8");
  assert.match(source, /requireTelegramLinkAdmin\(await auth\(\)\)/);
  assert.doesNotMatch(source, /request\.json|createdBy\s*[:=]\s*.*body|adminId/);
});

test("webhook /start delegates normalized private identity without logging the token", async () => {
  process.env.TELEGRAM_WEBHOOK_SECRET = "linking-webhook-secret";
  const token = "A".repeat(32);
  const logs = [];
  const calls = [];
  const claims = new Set();
  Object.assign(telegramWebhookDependencies, {
    async connectMongoDB() {},
    TelegramUpdateModel: {
      async create(document) { claims.add(document.updateId); },
      async updateOne() { return { modifiedCount: 1 }; },
      async deleteOne() { return { deletedCount: 1 }; }
    },
    async linkVolunteerFromTelegram(input) { calls.push(input); },
    async respondToAssignmentAction() {
      throw new Error("Assignment response must not run during linking tests");
    },
    createTelegramApi() {
      return { async sendMessage(chatId, text) { calls.push({ chatId, text }); } };
    },
    logger: {
      info(...args) { logs.push(args); },
      warn(...args) { logs.push(args); },
      error(...args) { logs.push(args); }
    }
  });
  const result = await processTelegramWebhook({
    secretHeader: "linking-webhook-secret",
    parseJson: async () => ({
      update_id: 900,
      message: {
        message_id: 901,
        from: { id: 902 },
        chat: { id: 903, type: "private" },
        text: `/start ${token}`
      }
    })
  });
  assert.equal(result.status, 200);
  assert.deepEqual(calls[0], { token, telegramUserId: "902", telegramChatId: "903", chatType: "private" });
  assert.deepEqual(calls[1], { chatId: "903", text: TELEGRAM_FOUNDATION_MESSAGES.START_LINKED_MESSAGE });
  assert.equal(JSON.stringify(logs).includes(token), false);
});
