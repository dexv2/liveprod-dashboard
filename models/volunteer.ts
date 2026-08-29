import { category } from "@/utils/constants";
import mongoose, { Schema } from "mongoose";

const volunteerSchema = new Schema({
  volunteerId: {
    type: String,
    unique: true,
    sparse: true
  },
  nickName: String,
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: category.STATUS,
    required: true
  },
  segment: {
    type: String,
    enum: category.SEGMENTS,
    required: true
  },
  roles: [{
    type: String,
    enum: category.ROLES,
  }],
  schedules: [{
    type: Schema.Types.ObjectId,
    ref: "Schedule"
  }],
  active: {
    type: Boolean,
    default: true
  },
  gender: {
    type: String,
    enum: category.GENDER,
  },
  phone: {
    type: String,
    required: false,
  },
  trainingsAttended: [{
    type: Schema.Types.ObjectId,
    ref: "Training"
  }],
  telegram: {
    userId: { type: String },
    chatId: { type: String },
    linkedAt: { type: Date },
    notificationsEnabled: { type: Boolean, default: false },
    linkVersion: { type: Number, default: 0, min: 0 }
  }
}, { timestamps: true, strict: true });

volunteerSchema.index({ schedules: 1 });
volunteerSchema.index(
  { "telegram.userId": 1 },
  { unique: true, partialFilterExpression: { "telegram.userId": { $type: "string" } } }
);

const Volunteer = mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);

export default Volunteer;
