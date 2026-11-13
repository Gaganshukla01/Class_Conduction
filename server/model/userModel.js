import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verifyOtp: { type: String, default: "" },
  verifyOtpExpireAt: { type: Number, default: 0 },
  isAccountVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: "" },
  resetOtpExpireAt: { type: Number, default: 0 },
  userType: { type: String, enum: ["student", "teacher", "manager", "admin"], default: "student" },
  // Account approval. NO default on purpose: accounts that already exist have no value and are
  // treated as approved (see config/roles.js). New sign-ups are saved as "pending" explicitly.
  accountStatus: { type: String, enum: ["pending", "approved", "rejected"] },
  requestedRole: { type: String, enum: ["student", "teacher", "manager"], default: "student" },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  rejectedReason: { type: String, default: "" },
  // OTP throttling (a double click must not send two e-mails; wrong guesses are limited)
  resetOtpSentAt: { type: Number, default: 0 },
  resetOtpAttempts: { type: Number, default: 0 },
  verifyOtpSentAt: { type: Number, default: 0 },
  // profile photo (Cloudinary)
  avatar: {
    url: { type: String },
    publicId: { type: String },
  },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
