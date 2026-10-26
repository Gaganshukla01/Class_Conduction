import mongoose from "mongoose";

// One row per (type, key) so automated alerts are never sent twice.
const alertLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    key: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
alertLogSchema.index({ type: 1, key: 1 }, { unique: true });
// Keep the collection small: entries expire after 90 days.
alertLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.models.alertLog ||
  mongoose.model("alertLog", alertLogSchema);
