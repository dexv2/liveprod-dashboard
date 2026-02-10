import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema({
  password: {
    type: String,
    required: true
  },
  username: {
    required: true,
    type: String,
    unique: true
  },
  tier: {
    required: true,
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  permissions: {
    type: [String],
    default: []
  },
  superAdmin: {
    type: Boolean,
    default: false
  },
  registeredBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin"
  }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
