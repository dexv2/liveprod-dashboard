import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  status: {
    type: String,
    enum: ["confirmed", "tentative", "cancelled"],
    required: true,
    default: "confirmed"
  },
  date: {
    type: Date,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: false
  },
  callTime: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  praiseAndWorship: {
    type: Boolean,
    required: true,
    default: false
  },
  otherDetails: {
    type: String,
    default: ""
  },
  volunteersNeeded: {
    foh: { type: Boolean, default: false },
    assistantFoh: { type: Boolean, default: false },
    bcMix: { type: Boolean, default: false },
    assistantBcMix: { type: Boolean, default: false },
    monMix: { type: Boolean, default: false },
    rfTech: { type: Boolean, default: false }
  },
  assignedVolunteers: {
    foh: { type: Schema.Types.Mixed },
    assistantFoh: { type: Schema.Types.Mixed },
    bcMix: { type: Schema.Types.Mixed },
    assistantBcMix: { type: Schema.Types.Mixed },
    monMix: { type: Schema.Types.Mixed },
    rfTech: { type: Schema.Types.Mixed }
  },
  googleCalendarEventId: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Force schema refresh
if (mongoose.models.Event) {
  delete mongoose.models.Event;
}
const Event = mongoose.model("Event", eventSchema);

export default Event;