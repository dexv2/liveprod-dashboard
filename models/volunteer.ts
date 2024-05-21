import { category } from "@/utils/constants";
import mongoose, { Schema } from "mongoose";

const volunteerSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: category.TIERS,
    required: true
  },
  segment: {
    type: String,
    enum: category.SEGMENTS,
    required: true
  },
  schedules: [{
    type: Schema.Types.ObjectId,
    ref: "Schedule",
    unique: true
  }],
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true, strict: true });

const Volunteer = mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);

export default Volunteer;
