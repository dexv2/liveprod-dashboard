import connectMongoDB from "@/libs/mongodb";
import TelegramUpdateModel from "@/models/telegramUpdate";
import { createTelegramApi, TelegramApiError } from "@/utils/telegram/telegramApi";
import type { ParsedTelegramUpdate } from "@/utils/telegram/telegramTypes";
import {
  parseTelegramUpdate,
  TelegramUpdateValidationError,
  verifyTelegramWebhookSecret
} from "@/utils/telegram/telegramValidation";

const START_ONLINE_MESSAGE = "CCF Live Production bot is online.";
const START_LINKING_DISABLED_MESSAGE = "Connection request received. Account linking is not enabled yet.";
const CALLBACK_DISABLED_MESSAGE = "This action is not enabled yet.";

export const telegramWebhookDependencies: any = {
  connectMongoDB,
  TelegramUpdateModel,
  createTelegramApi,
  logger: console
};

export interface TelegramWebhookResult {
  status: number;
  body: { ok: boolean; duplicate?: boolean; ignored?: boolean; error?: string };
}

function duplicateKey(error: any) {
  return error?.code === 11000;
}

function logProcessingError(error: unknown, updateId?: string, updateType?: string) {
  if (error instanceof TelegramApiError) {
    telegramWebhookDependencies.logger.error("Telegram API operation failed", {
      updateId,
      updateType,
      method: error.method,
      httpStatus: error.httpStatus,
      telegramErrorCode: error.telegramErrorCode,
      description: error.message
    });
    return;
  }
  telegramWebhookDependencies.logger.error("Telegram webhook processing failed", { updateId, updateType });
}

function parseStartCommand(text?: string) {
  if (!text) return null;
  const match = text.match(/^\/start(?:@\w+)?(?:\s+(\S[\s\S]*))?\s*$/i);
  return match ? { hasParameter: Boolean(match[1]) } : null;
}

export async function handleTelegramUpdate(parsed: ParsedTelegramUpdate) {
  if (parsed.type === "message" && parsed.update.message) {
    const start = parseStartCommand(parsed.update.message.text);
    if (start) {
      const api = telegramWebhookDependencies.createTelegramApi();
      await api.sendMessage(
        parsed.update.message.chat.id,
        start.hasParameter ? START_LINKING_DISABLED_MESSAGE : START_ONLINE_MESSAGE
      );
    }
    return;
  }
  if (parsed.type === "callback_query" && parsed.update.callbackQuery) {
    const api = telegramWebhookDependencies.createTelegramApi();
    await api.answerCallbackQuery(parsed.update.callbackQuery.id, CALLBACK_DISABLED_MESSAGE);
  }
}

export async function processTelegramWebhook(input: {
  secretHeader?: string | null;
  parseJson: () => Promise<unknown>;
}): Promise<TelegramWebhookResult> {
  if (!verifyTelegramWebhookSecret(input.secretHeader)) {
    return { status: 401, body: { ok: false, error: "Unauthorized" } };
  }

  let rawUpdate: unknown;
  try {
    rawUpdate = await input.parseJson();
  } catch {
    return { status: 400, body: { ok: false, error: "Invalid JSON" } };
  }

  let parsed: ParsedTelegramUpdate;
  try {
    parsed = parseTelegramUpdate(rawUpdate);
  } catch (error) {
    if (error instanceof TelegramUpdateValidationError) {
      telegramWebhookDependencies.logger.warn("Ignored malformed Telegram update");
      return { status: 200, body: { ok: true, ignored: true } };
    }
    return { status: 400, body: { ok: false, error: "Invalid update" } };
  }

  await telegramWebhookDependencies.connectMongoDB();
  try {
    await telegramWebhookDependencies.TelegramUpdateModel.create({
      updateId: parsed.update.updateId,
      updateType: parsed.type,
      receivedAt: new Date()
    });
  } catch (error) {
    if (duplicateKey(error)) return { status: 200, body: { ok: true, duplicate: true } };
    logProcessingError(error, parsed.update.updateId, parsed.type);
    return { status: 500, body: { ok: false, error: "Unable to claim update" } };
  }

  try {
    await handleTelegramUpdate(parsed);
  } catch (error) {
    logProcessingError(error, parsed.update.updateId, parsed.type);
    try {
      await telegramWebhookDependencies.TelegramUpdateModel.deleteOne({ updateId: parsed.update.updateId });
    } catch {
      telegramWebhookDependencies.logger.error("Telegram update claim release failed", {
        updateId: parsed.update.updateId,
        updateType: parsed.type
      });
    }
    return { status: 500, body: { ok: false, error: "Update processing failed" } };
  }

  try {
    await telegramWebhookDependencies.TelegramUpdateModel.updateOne(
      { updateId: parsed.update.updateId },
      { $set: { processedAt: new Date() } }
    );
  } catch (error) {
    logProcessingError(error, parsed.update.updateId, parsed.type);
  }
  telegramWebhookDependencies.logger.info("Telegram update processed", {
    updateId: parsed.update.updateId,
    updateType: parsed.type
  });
  return { status: 200, body: { ok: true, ...(parsed.type === "unknown" ? { ignored: true } : {}) } };
}

export const TELEGRAM_FOUNDATION_MESSAGES = {
  START_ONLINE_MESSAGE,
  START_LINKING_DISABLED_MESSAGE,
  CALLBACK_DISABLED_MESSAGE
};
