import test from "node:test";
import assert from "node:assert/strict";
import TelegramUpdateModel, { TELEGRAM_UPDATE_RETENTION_SECONDS } from "../models/telegramUpdate.ts";
import { createTelegramApi, TelegramApiError } from "../utils/telegram/telegramApi.ts";
import { verifyTelegramWebhookSecret } from "../utils/telegram/telegramValidation.ts";
import {
  processTelegramWebhook,
  telegramWebhookDependencies,
  TELEGRAM_FOUNDATION_MESSAGES
} from "../services/telegram/telegramWebhookService.ts";

const secret = "test-webhook-secret-0123456789";

function messageUpdate(updateId, text = "hello") {
  return {
    update_id: updateId,
    message: {
      message_id: 100 + updateId,
      from: { id: 1234, username: "display_only", first_name: "Test" },
      chat: { id: -5678, type: "private" },
      text
    }
  };
}

function harness() {
  process.env.TELEGRAM_WEBHOOK_SECRET = secret;
  const claims = new Map();
  const sentMessages = [];
  const callbackAnswers = [];
  const logs = [];
  let handlerApiCreations = 0;
  const model = {
    async create(document) {
      await Promise.resolve();
      if (claims.has(document.updateId)) {
        const error = new Error("duplicate");
        error.code = 11000;
        throw error;
      }
      claims.set(document.updateId, { ...document });
      return claims.get(document.updateId);
    },
    async updateOne(filter, update) {
      Object.assign(claims.get(filter.updateId), update.$set);
      return { modifiedCount: 1 };
    },
    async deleteOne(filter) {
      claims.delete(filter.updateId);
      return { deletedCount: 1 };
    }
  };
  Object.assign(telegramWebhookDependencies, {
    async connectMongoDB() {},
    TelegramUpdateModel: model,
    createTelegramApi() {
      handlerApiCreations += 1;
      return {
        async sendMessage(chatId, text) { sentMessages.push({ chatId, text }); return true; },
        async answerCallbackQuery(id, text) { callbackAnswers.push({ id, text }); return true; }
      };
    },
    logger: {
      info(...values) { logs.push(["info", ...values]); },
      warn(...values) { logs.push(["warn", ...values]); },
      error(...values) { logs.push(["error", ...values]); }
    }
  });
  const invoke = (raw, suppliedSecret = secret) => processTelegramWebhook({
    secretHeader: suppliedSecret,
    parseJson: async () => raw
  });
  return { claims, sentMessages, callbackAnswers, logs, invoke, apiCreations: () => handlerApiCreations };
}

test("missing and incorrect webhook secrets are rejected before parsing", async () => {
  const h = harness();
  let parsed = false;
  for (const suppliedSecret of [null, "wrong-secret"]) {
    const result = await processTelegramWebhook({
      secretHeader: suppliedSecret,
      parseJson: async () => { parsed = true; return messageUpdate(1); }
    });
    assert.equal(result.status, 401);
  }
  assert.equal(parsed, false);
  assert.equal(verifyTelegramWebhookSecret(secret, secret), true);
  assert.equal(verifyTelegramWebhookSecret("short", secret), false);
});

test("valid message update is claimed and processed", async () => {
  const h = harness();
  const result = await h.invoke(messageUpdate(2));
  assert.equal(result.status, 200);
  assert.ok(h.claims.get("2").processedAt instanceof Date);
});

test("plain /start sends neutral online response", async () => {
  const h = harness();
  await h.invoke(messageUpdate(3, "/start"));
  assert.deepEqual(h.sentMessages, [{ chatId: "-5678", text: TELEGRAM_FOUNDATION_MESSAGES.START_ONLINE_MESSAGE }]);
});

test("/start parameter is neither echoed nor logged", async () => {
  const h = harness();
  const opaqueParameter = "TOP-SECRET-LINK-PARAMETER";
  await h.invoke(messageUpdate(4, `/start   ${opaqueParameter}`));
  assert.equal(h.sentMessages[0].text, TELEGRAM_FOUNDATION_MESSAGES.START_LINKING_DISABLED_MESSAGE);
  assert.equal(JSON.stringify(h.sentMessages).includes(opaqueParameter), false);
  assert.equal(JSON.stringify(h.logs).includes(opaqueParameter), false);
});

test("duplicate update returns success without reprocessing", async () => {
  const h = harness();
  await h.invoke(messageUpdate(5, "/start"));
  const duplicate = await h.invoke(messageUpdate(5, "/start"));
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(h.sentMessages.length, 1);
});

test("duplicate-key race allows one processing execution", async () => {
  const h = harness();
  const results = await Promise.all([
    h.invoke(messageUpdate(6, "/start")),
    h.invoke(messageUpdate(6, "/start"))
  ]);
  assert.equal(results.filter(result => result.body.duplicate).length, 1);
  assert.equal(h.sentMessages.length, 1);
});

test("transient handler failure releases claim for a later retry", async () => {
  const h = harness();
  let attempts = 0;
  telegramWebhookDependencies.createTelegramApi = () => ({
    async sendMessage(chatId, text) {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary network failure");
      h.sentMessages.push({ chatId, text });
      return true;
    }
  });
  const first = await h.invoke(messageUpdate(61, "/start"));
  assert.equal(first.status, 500);
  assert.equal(h.claims.has("61"), false);
  const retry = await h.invoke(messageUpdate(61, "/start"));
  assert.equal(retry.status, 200);
  assert.equal(h.sentMessages.length, 1);
});

test("unknown valid update is persisted, processed, and ignored without API calls", async () => {
  const h = harness();
  const result = await h.invoke({ update_id: 7, edited_channel_post: { ignored: true } });
  assert.equal(result.status, 200);
  assert.equal(result.body.ignored, true);
  assert.equal(h.apiCreations(), 0);
  assert.ok(h.claims.get("7").processedAt instanceof Date);
});

test("callback query is acknowledged neutrally without assignment behavior", async () => {
  const h = harness();
  const result = await h.invoke({
    update_id: 8,
    callback_query: {
      id: "callback-opaque-id",
      from: { id: 222, first_name: "Callback" },
      data: "UNTRUSTED_ACCEPT_TOKEN"
    }
  });
  assert.equal(result.status, 200);
  assert.deepEqual(h.callbackAnswers, [{
    id: "callback-opaque-id",
    text: TELEGRAM_FOUNDATION_MESSAGES.CALLBACK_DISABLED_MESSAGE
  }]);
  assert.equal(JSON.stringify(h.logs).includes("UNTRUSTED_ACCEPT_TOKEN"), false);
});

test("malformed JSON and malformed update receive controlled responses", async () => {
  harness();
  const badJson = await processTelegramWebhook({
    secretHeader: secret,
    parseJson: async () => { throw new SyntaxError("private raw payload"); }
  });
  assert.deepEqual(badJson, { status: 400, body: { ok: false, error: "Invalid JSON" } });
  const malformed = await processTelegramWebhook({
    secretHeader: secret,
    parseJson: async () => ({ message: { text: "missing IDs" } })
  });
  assert.deepEqual(malformed, { status: 200, body: { ok: true, ignored: true } });
});

test("Telegram API errors never expose the bot token or full API URL", async () => {
  const token = "123456:super-secret-token";
  const api = createTelegramApi({
    token,
    fetchImpl: async () => new Response(JSON.stringify({
      ok: false,
      error_code: 400,
      description: `bad token ${token} at https://api.telegram.org/bot${token}/sendMessage`
    }), { status: 400, headers: { "Content-Type": "application/json" } })
  });
  await assert.rejects(
    api.sendMessage("1", "hello"),
    error => error instanceof TelegramApiError &&
      !error.message.includes(token) &&
      !error.message.includes("api.telegram.org") &&
      error.method === "sendMessage" && error.httpStatus === 400
  );
});

test("TelegramUpdate schema has unique update ID and 14-day TTL indexes", () => {
  const indexes = TelegramUpdateModel.schema.indexes();
  const unique = indexes.find(([fields]) => fields.updateId === 1);
  const ttl = indexes.find(([fields]) => fields.receivedAt === 1);
  assert.equal(unique?.[1].unique, true);
  assert.equal(ttl?.[1].expireAfterSeconds, TELEGRAM_UPDATE_RETENTION_SECONDS);
  assert.equal(TELEGRAM_UPDATE_RETENTION_SECONDS, 14 * 24 * 60 * 60);
});
