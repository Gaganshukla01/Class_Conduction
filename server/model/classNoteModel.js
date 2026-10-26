import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, default: "image" },
    format: String,
    bytes: Number,
    originalName: String,
  },
  { _id: false }
);

// PDF notes attached to one specific class session ("Class No. 3 Notes").
const classNoteSchema = new mongoose.Schema(
  {
    classScheduleId: { type: String, required: true, index: true },
    className: { type: String, required: true, trim: true },
    classNumber: { type: Number, required: true }, // 1-based session number
    classDate: { type: Date },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    file: { type: fileSchema, required: true },
    uploadedBy: { type: String, required: true },
    // Denormalised from the class session so students can be filtered in one query.
    studentsEnrolled: [{ type: String, index: true }],
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

classNoteSchema.index({ className: 1, classNumber: 1 });

export default mongoose.models.classNote ||
  mongoose.model("classNote", classNoteSchema);
