import mongoose, { Schema } from "mongoose";

export const TELEGRAM_ASSIGNMENT_ACTIONS = ["ACCEPT", "DECLINE", "REQUEST_CHANGE"] as const;

const telegramAssignmentActionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
  assignmentVersion: { type: Number, required: true, min: 1 },
  volunteer: { type: Schema.Types.ObjectId, ref: "Volunteer", required: true },
  volunteerLinkVersion: { type: Number, required: true, min: 0 },
  action: { type: String, enum: TELEGRAM_ASSIGNMENT_ACTIONS, required: true },
  notificationAttemptId: { type: String, required: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
  telegramUserId: String,
  invalidatedAt: Date
}, { strict: true, versionKey: false });

telegramAssignmentActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
telegramAssignmentActionSchema.index(
  { assignment: 1, assignmentVersion: 1, volunteer: 1, invalidatedAt: 1 }
);

const TelegramAssignmentAction = mongoose.models.TelegramAssignmentAction ||
  mongoose.model("TelegramAssignmentAction", telegramAssignmentActionSchema);

export default TelegramAssignmentAction;
