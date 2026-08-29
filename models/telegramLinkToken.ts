import mongoose, { Schema } from "mongoose";

export const TELEGRAM_LINK_TOKEN_TTL_MINUTES = 20;
export const TELEGRAM_LINK_TOKEN_STATES = ["UNUSED", "PROCESSING", "USED"] as const;

const telegramLinkTokenSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  volunteer: { type: Schema.Types.ObjectId, ref: "Volunteer", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  state: { type: String, enum: TELEGRAM_LINK_TOKEN_STATES, required: true, default: "UNUSED" },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  processingAt: Date,
  processingTelegramUserId: String,
  processingTelegramChatId: String,
  usedAt: Date,
  usedByTelegramUserId: String,
  invalidatedAt: Date
}, { strict: true, versionKey: false });

telegramLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
telegramLinkTokenSchema.index({ volunteer: 1, state: 1, expiresAt: 1 });
telegramLinkTokenSchema.index({ createdBy: 1, createdAt: 1 });

const TelegramLinkToken = mongoose.models.TelegramLinkToken ||
  mongoose.model("TelegramLinkToken", telegramLinkTokenSchema);

export default TelegramLinkToken;
