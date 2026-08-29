import { timingSafeEqual } from "node:crypto";
import type {
  ParsedTelegramUpdate,
  TelegramCallbackQuery,
  TelegramChat,
  TelegramMessage,
  TelegramUser
} from "./telegramTypes";

export class TelegramUpdateValidationError extends Error {}

export function verifyTelegramWebhookSecret(received: string | null | undefined, expected = process.env.TELEGRAM_WEBHOOK_SECRET) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function numericId(value: unknown, field: string): string {
  if ((typeof value !== "number" || !Number.isSafeInteger(value)) && typeof value !== "string") {
    throw new TelegramUpdateValidationError(`${field} is invalid`);
  }
  if (typeof value === "string" && !/^\d+$/.test(value)) {
    throw new TelegramUpdateValidationError(`${field} is invalid`);
  }
  return String(value);
}

function telegramUser(value: any): TelegramUser {
  if (!value || typeof value !== "object") throw new TelegramUpdateValidationError("Telegram user is invalid");
  return {
    id: numericId(value.id, "Telegram user ID"),
    ...(typeof value.username === "string" ? { username: value.username } : {}),
    ...(typeof value.first_name === "string" ? { firstName: value.first_name } : {}),
    ...(typeof value.last_name === "string" ? { lastName: value.last_name } : {})
  };
}

function telegramChat(value: any): TelegramChat {
  if (!value || typeof value !== "object" || typeof value.type !== "string") {
    throw new TelegramUpdateValidationError("Telegram chat is invalid");
  }
  return { id: numericId(value.id, "Telegram chat ID"), type: value.type };
}

function telegramMessage(value: any): TelegramMessage {
  if (!value || typeof value !== "object") throw new TelegramUpdateValidationError("Telegram message is invalid");
  return {
    messageId: numericId(value.message_id, "Telegram message ID"),
    chat: telegramChat(value.chat),
    ...(value.from === undefined ? {} : { from: telegramUser(value.from) }),
    ...(typeof value.text === "string" ? { text: value.text } : {})
  };
}

function callbackQuery(value: any): TelegramCallbackQuery {
  if (!value || typeof value !== "object" || typeof value.id !== "string" || !value.id) {
    throw new TelegramUpdateValidationError("Telegram callback query is invalid");
  }
  return {
    id: value.id,
    from: telegramUser(value.from),
    ...(value.message === undefined ? {} : { message: telegramMessage(value.message) }),
    ...(typeof value.data === "string" ? { data: value.data } : {})
  };
}

export function parseTelegramUpdate(value: unknown): ParsedTelegramUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TelegramUpdateValidationError("Telegram update must be an object");
  }
  const raw = value as any;
  const updateId = numericId(raw.update_id, "Telegram update ID");
  if (raw.message !== undefined) {
    return { update: { updateId, message: telegramMessage(raw.message) }, type: "message" };
  }
  if (raw.callback_query !== undefined) {
    return { update: { updateId, callbackQuery: callbackQuery(raw.callback_query) }, type: "callback_query" };
  }
  return { update: { updateId }, type: "unknown" };
}
