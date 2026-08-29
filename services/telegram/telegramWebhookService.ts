import connectMongoDB from "@/libs/mongodb";
import TelegramUpdateModel from "@/models/telegramUpdate";
import { createTelegramApi, TelegramApiError } from "@/utils/telegram/telegramApi";
import { linkVolunteerFromTelegram, TelegramLinkError } from "@/services/telegram/telegramLinkService";
import { respondToAssignmentAction } from "@/services/telegram/telegramAssignmentActionService";
import type { ParsedTelegramUpdate } from "@/utils/telegram/telegramTypes";
import {
  parseTelegramUpdate,
  TelegramUpdateValidationError,
  verifyTelegramWebhookSecret
} from "@/utils/telegram/telegramValidation";

const START_ONLINE_MESSAGE = "CCF Live Production bot is online.";
const START_LINKED_MESSAGE = "Your Telegram account is now connected to CCF Live Production.";
const START_LINK_FAILED_MESSAGE = "This connection link is invalid or no longer available. Please request a new link from an administrator.";
const CALLBACK_DISABLED_MESSAGE = "This action is not enabled yet.";

export const telegramWebhookDependencies: any = {
  connectMongoDB,
  TelegramUpdateModel,
  createTelegramApi,
  linkVolunteerFromTelegram,
  respondToAssignmentAction,
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
  if (!match) return null;
  const parameter = match[1]?.trim();
  return { parameter: parameter && /^[A-Za-z0-9_-]{32}$/.test(parameter) ? parameter : undefined, hasParameter: Boolean(parameter) };
}

export async function handleTelegramUpdate(parsed: ParsedTelegramUpdate) {
  if (parsed.type === "message" && parsed.update.message) {
    const start = parseStartCommand(parsed.update.message.text);
    if (start) {
      const api = telegramWebhookDependencies.createTelegramApi();
      if (!start.hasParameter) {
        await api.sendMessage(parsed.update.message.chat.id, START_ONLINE_MESSAGE);
        return;
      }
      if (!start.parameter || !parsed.update.message.from) {
        await api.sendMessage(parsed.update.message.chat.id, START_LINK_FAILED_MESSAGE);
        return;
      }
      try {
        await telegramWebhookDependencies.linkVolunteerFromTelegram({
          token: start.parameter,
          telegramUserId: parsed.update.message.from.id,
          telegramChatId: parsed.update.message.chat.id,
          chatType: parsed.update.message.chat.type
        });
        await api.sendMessage(parsed.update.message.chat.id, START_LINKED_MESSAGE);
      } catch (error) {
        if (!(error instanceof TelegramLinkError)) throw error;
        const message = error.code === "PRIVATE_CHAT_REQUIRED"
          ? error.message
          : error.code === "TELEGRAM_ACCOUNT_COLLISION"
            ? error.message
            : START_LINK_FAILED_MESSAGE;
        await api.sendMessage(parsed.update.message.chat.id, message);
      }
    }
    return;
  }
  if (parsed.type === "callback_query" && parsed.update.callbackQuery) {
    const api = telegramWebhookDependencies.createTelegramApi();
    const callback = parsed.update.callbackQuery;
    const match = callback.data?.match(/^a:([A-Za-z0-9_-]{32})$/);
    if (!match) {
      await api.answerCallbackQuery(callback.id, CALLBACK_DISABLED_MESSAGE);
      return;
    }
    const result = await telegramWebhookDependencies.respondToAssignmentAction({
      token: match[1],
      telegramUserId: callback.from.id
    });
    await api.answerCallbackQuery(callback.id, result.acknowledgement);
    if (result.outcome === "SUCCESS" && result.messageStatus && callback.message?.text) {
      try {
        await api.editMessageText(
          callback.message.chat.id,
          callback.message.messageId,
          `${callback.message.text}\n\n${result.messageStatus}`,
          { replyMarkup: { inline_keyboard: [] } }
        );
      } catch (error) {
        if (error instanceof TelegramApiError) {
          telegramWebhookDependencies.logger.error("Telegram assignment message update failed", {
            updateId: parsed.update.updateId,
            method: error.method,
            httpStatus: error.httpStatus,
            telegramErrorCode: error.telegramErrorCode
          });
        } else {
          telegramWebhookDependencies.logger.error("Telegram assignment message update failed", {
            updateId: parsed.update.updateId
          });
        }
      }
    }
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
  START_LINKED_MESSAGE,
  START_LINK_FAILED_MESSAGE,
  CALLBACK_DISABLED_MESSAGE
};
