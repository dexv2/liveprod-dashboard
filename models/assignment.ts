import mongoose, { Schema } from "mongoose";

export const ASSIGNMENT_SOURCE_TYPES = ["SCHEDULE", "EVENT"] as const;
export const ASSIGNMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CHANGE_REQUESTED",
  "CANCELLED"
] as const;

export const ACTIVE_ASSIGNMENT_STATUSES = ASSIGNMENT_STATUSES.filter(
  status => status !== "CANCELLED"
);

export const EVENT_ASSIGNMENT_ROLES = [
  "foh",
  "assistantFoh",
  "bcMix",
  "assistantBcMix",
  "monMix",
  "rfTech"
] as const;

const responseHistorySchema = new Schema({
  action: { type: String, required: true },
  actorType: {
    type: String,
    enum: ["VOLUNTEER", "ADMIN", "SYSTEM"],
    required: true
  },
  actorId: { type: Schema.Types.ObjectId },
  channel: { type: String, required: true },
  at: { type: Date, required: true }
}, { _id: false, strict: true });

const assignmentSchema = new Schema({
  sourceType: {
    type: String,
    enum: ASSIGNMENT_SOURCE_TYPES,
    required: true
  },
  schedule: { type: Schema.Types.ObjectId, ref: "Schedule" },
  event: { type: Schema.Types.ObjectId, ref: "Event" },
  slotKey: { type: String, required: true },
  activeSlotKey: {
    type: String,
    set: (value: unknown) => value === null || value === "" ? undefined : value
  },
  volunteer: {
    type: Schema.Types.ObjectId,
    ref: "Volunteer",
    required: true
  },
  role: { type: String, required: true },
  status: {
    type: String,
    enum: ASSIGNMENT_STATUSES,
    required: true,
    default: "PENDING"
  },
  scheduledBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  scheduledAt: { type: Date, required: true },
  version: { type: Number, required: true, min: 1, default: 1 },
  respondedAt: Date,
  responseChannel: {
    type: String,
    enum: ["TELEGRAM", "WEB", "ADMIN"]
  },
  cancelledAt: Date,
  cancelledBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  responseHistory: {
    type: [responseHistorySchema],
    default: []
  }
}, { timestamps: true, strict: true });

assignmentSchema.pre("validate", function(next) {
  const hasSchedule = Boolean(this.schedule);
  const hasEvent = Boolean(this.event);
  if (hasSchedule === hasEvent) {
    return next(new Error("Assignment must reference exactly one source"));
  }
  if (this.sourceType === "SCHEDULE" && !hasSchedule) {
    return next(new Error("Schedule assignments must reference a schedule"));
  }
  if (this.sourceType === "EVENT" && !hasEvent) {
    return next(new Error("Event assignments must reference an event"));
  }
  const expectedSlotKey = hasSchedule
    ? `schedule:${this.schedule}`
    : `event:${this.event}:${this.role}`;
  if (this.slotKey !== expectedSlotKey) {
    return next(new Error("Assignment slotKey does not match its source"));
  }
  if (this.status === "CANCELLED") {
    if (!this.cancelledAt || !this.cancelledBy) {
      return next(new Error("Cancelled assignments require cancellation metadata"));
    }
    if (this.activeSlotKey) {
      return next(new Error("Cancelled assignments cannot retain an activeSlotKey"));
    }
  } else {
    if (this.cancelledAt || this.cancelledBy) {
      return next(new Error("Active assignments cannot contain cancellation metadata"));
    }
    if (this.activeSlotKey !== this.slotKey) {
      return next(new Error("Active assignments require their slotKey as activeSlotKey"));
    }
  }
  if (this.sourceType === "EVENT" && !EVENT_ASSIGNMENT_ROLES.includes(this.role as any)) {
    return next(new Error("Event assignment role is not supported"));
  }
  if (this.isNew) {
    const source = this.$locals.assignmentSource as any;
    if (!source || source._id?.toString() !== (this.schedule || this.event)?.toString()) {
      return next(new Error("Assignment source must be loaded and validated before creation"));
    }
    if (this.sourceType === "SCHEDULE" && source.role !== this.role) {
      return next(new Error("Schedule assignment role must match Schedule.role"));
    }
  }
  if (this.isNew && !this.responseHistory.some(entry => entry.action === "ASSIGNED")) {
    return next(new Error("New assignments require initial ASSIGNED history"));
  }
  next();
});

assignmentSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function(next) {
  const update = (this.getUpdate() || {}) as any;
  const set = update.$set || {};
  const unset = update.$unset || {};
  const immutable = ["sourceType", "schedule", "event", "slotKey", "volunteer", "role", "scheduledBy", "scheduledAt"];
  if (immutable.some(field => field in set || field in unset)) {
    return next(new Error("Assignment identity fields are immutable"));
  }
  if (set.status === "CANCELLED") {
    if (!set.cancelledAt || !set.cancelledBy || !("activeSlotKey" in unset)) {
      return next(new Error("Cancellation updates require metadata and must release activeSlotKey"));
    }
  } else if ("cancelledAt" in set || "cancelledBy" in set || "activeSlotKey" in unset) {
    return next(new Error("Cancellation metadata may only be changed by a cancellation update"));
  }
  next();
});

assignmentSchema.index({ activeSlotKey: 1 }, { unique: true, sparse: true });
assignmentSchema.index({ slotKey: 1, createdAt: -1 });
assignmentSchema.index({ schedule: 1, status: 1 });
assignmentSchema.index({ event: 1, role: 1, status: 1 });
assignmentSchema.index({ volunteer: 1, status: 1, scheduledAt: -1 });

const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
