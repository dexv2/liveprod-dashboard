import { createTelegramApi, TelegramApiError } from "@/utils/telegram/telegramApi";

export interface TelegramDeliveryResult {
  messageId: string;
}

export class NotificationProviderError extends Error {
  code: "TELEGRAM_FORBIDDEN" | "TELEGRAM_CHAT_NOT_FOUND" | "TELEGRAM_TIMEOUT" | "TELEGRAM_API_ERROR";
  constructor(code: NotificationProviderError["code"]) {
    super(code);
    this.name = "NotificationProviderError";
    this.code = code;
  }
}

export const telegramProviderDependencies: any = { createTelegramApi };

function normalizedCode(error: unknown): NotificationProviderError["code"] {
  if (!(error instanceof TelegramApiError)) return "TELEGRAM_API_ERROR";
  if (error.httpStatus === 403 || error.telegramErrorCode === 403) return "TELEGRAM_FORBIDDEN";
  if (/chat not found/i.test(error.message)) return "TELEGRAM_CHAT_NOT_FOUND";
  if (/timed out/i.test(error.message)) return "TELEGRAM_TIMEOUT";
  return "TELEGRAM_API_ERROR";
}

export async function sendTelegramNotification(chatId: string, message: string): Promise<TelegramDeliveryResult> {
  try {
    const result = await telegramProviderDependencies.createTelegramApi().sendMessage(chatId, message);
    const messageId = result?.message_id;
    if (typeof messageId !== "number" && typeof messageId !== "string") {
      throw new NotificationProviderError("TELEGRAM_API_ERROR");
    }
    return { messageId: String(messageId) };
  } catch (error) {
    if (error instanceof NotificationProviderError) throw error;
    throw new NotificationProviderError(normalizedCode(error));
  }
}
