import mongoose from "mongoose";

export function isValidAnnouncementObjectId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}
