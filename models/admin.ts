import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema({
  password: String,
  username: {
    type: String,
    unique: true
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
