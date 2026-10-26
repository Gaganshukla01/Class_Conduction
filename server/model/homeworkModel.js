import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    resourceType: { type: String, default: "image" },
    format: String,
    bytes: Number,
    originalName: String,
  },
  { _id: false }
);

const homeworkSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    classScheduleId: { type: String, required: true, trim: true },
    homeworkTitle: { type: String, required: true, trim: true },
    homeworkDescription: { type: String, required: true, trim: true },
    homeworkType: {
      type: String,
      required: true,
      enum: ["assignment", "reading", "practice", "project"],
      default: "assignment",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    additionalNotes: { type: String, trim: true, default: "" },
    // "submitted" was already used by the student UI but missing from the enum.
    status: {
      type: String,
      enum: ["pending", "submitted", "completed", "overdue"],
      default: "pending",
    },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date },

    // Student submission
    submittedAt: { type: Date },
    submissionNote: { type: String, trim: true, default: "" },
    submissionLink: { type: String, trim: true, default: "" },
    submissionFile: { type: fileSchema, default: undefined },

    // Instructor review
    feedback: { type: String, trim: true, default: "" },
    reviewedAt: { type: Date },

    // Alert bookkeeping (so the daily job never double-sends)
    dueSoonNotifiedAt: { type: Date },
    overdueNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

const homeworkModel =
  mongoose.models.homeWork || mongoose.model("homeWork", homeworkSchema);
export default homeworkModel;
