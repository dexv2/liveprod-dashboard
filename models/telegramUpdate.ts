import mongoose, { Schema } from "mongoose";

export const TELEGRAM_UPDATE_RETENTION_SECONDS = 14 * 24 * 60 * 60;

const telegramUpdateSchema = new Schema({
  updateId: { type: String, required: true, unique: true },
  updateType: { type: String, enum: ["message", "callback_query", "unknown"] },
  receivedAt: { type: Date, required: true, default: Date.now },
  processedAt: Date
}, { strict: true, versionKey: false });

telegramUpdateSchema.index({ receivedAt: 1 }, { expireAfterSeconds: TELEGRAM_UPDATE_RETENTION_SECONDS });

const TelegramUpdate = mongoose.models.TelegramUpdate || mongoose.model("TelegramUpdate", telegramUpdateSchema);

export default TelegramUpdate;
