import mongoose, { Schema, Document, Types } from "mongoose";

export const ANNOUNCEMENT_EXPIRATION_MODES = ["EVENT_DATE", "AFTER_DAYS", "CUSTOM", "NEVER"] as const;
export type AnnouncementExpirationMode = typeof ANNOUNCEMENT_EXPIRATION_MODES[number];

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  theme: "info" | "success" | "warning" | "error" | "celebration";
  isActive: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  publishAt?: Date;
  expirationMode?: AnnouncementExpirationMode;
  expirationDays?: number;
  expiresAt?: Date;
  relevantDate?: Date;
  relatedEvent?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  theme: {
    type: String,
    enum: ["info", "success", "warning", "error", "celebration"],
    default: "info"
  },
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  publishAt: { type: Date, default: Date.now },
  expirationMode: { type: String, enum: ANNOUNCEMENT_EXPIRATION_MODES, default: "AFTER_DAYS" },
  expirationDays: { type: Number, min: 1 },
  expiresAt: { type: Date },
  relevantDate: { type: Date },
  relatedEvent: { type: Schema.Types.ObjectId, ref: "Event" }
}, {
  timestamps: true
});

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
