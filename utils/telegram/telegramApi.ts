export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

export class TelegramApiError extends Error {
  method: string;
  httpStatus?: number;
  telegramErrorCode?: number;

  constructor(message: string, details: { method: string; httpStatus?: number; telegramErrorCode?: number }) {
    super(message);
    this.name = "TelegramApiError";
    this.method = details.method;
    this.httpStatus = details.httpStatus;
    this.telegramErrorCode = details.telegramErrorCode;
  }
}

export interface TelegramApiOptions {
  token?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
}

export interface TelegramMessageOptions {
  replyMarkup?: TelegramInlineKeyboardMarkup;
}

function safeDescription(value: unknown, token: string) {
  if (typeof value !== "string") return "Telegram API request failed";
  return value.replaceAll(token, "[REDACTED]").replace(/https?:\/\/\S+/gi, "[URL_REDACTED]").slice(0, 300);
}

export function createTelegramApi(options: TelegramApiOptions = {}) {
  const configuredToken = options.token || process.env.TELEGRAM_BOT_TOKEN;
  if (!configuredToken) throw new TelegramApiError("Telegram bot token is not configured", { method: "configuration" });
  const token: string = configuredToken;
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 8_000;

  async function call<T>(method: string, body: Record<string, unknown> = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (error) {
      throw new TelegramApiError(
        error instanceof Error && error.name === "AbortError" ? "Telegram API request timed out" : "Telegram API request failed",
        { method }
      );
    } finally {
      clearTimeout(timeout);
    }

    let payload: TelegramApiResponse<T>;
    try {
      payload = await response.json();
    } catch {
      throw new TelegramApiError("Telegram API returned an invalid response", { method, httpStatus: response.status });
    }
    if (!payload || typeof payload.ok !== "boolean") {
      throw new TelegramApiError("Telegram API returned an invalid response", { method, httpStatus: response.status });
    }
    if (!response.ok || !payload.ok || payload.result === undefined) {
      throw new TelegramApiError(safeDescription(payload.description, token), {
        method,
        httpStatus: response.status,
        telegramErrorCode: payload.error_code
      });
    }
    return payload.result;
  }

  return {
    sendMessage: (chatId: string, text: string, options: TelegramMessageOptions = {}) => call("sendMessage", {
      chat_id: chatId,
      text,
      ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {})
    }),
    answerCallbackQuery: (callbackQueryId: string, text?: string) => call("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {})
    }),
    editMessageText: (chatId: string, messageId: string, text: string, options: TelegramMessageOptions = {}) => call("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {})
    }),
    getMe: () => call<any>("getMe"),
    getWebhookInfo: () => call<any>("getWebhookInfo")
  };
}

export const telegramApi = () => createTelegramApi();
