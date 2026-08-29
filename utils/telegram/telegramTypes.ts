export interface TelegramUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface TelegramChat {
  id: string;
  type: string;
}

export interface TelegramMessage {
  messageId: string;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  updateId: string;
  message?: TelegramMessage;
  callbackQuery?: TelegramCallbackQuery;
}

export type TelegramUpdateType = "message" | "callback_query" | "unknown";

export interface ParsedTelegramUpdate {
  update: TelegramUpdate;
  type: TelegramUpdateType;
}
