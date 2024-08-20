import { category } from "@/utils/constants";
import mongoose, { Schema } from "mongoose";

const volunteerSchema = new Schema({
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
