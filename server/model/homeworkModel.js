import mongoose from "mongoose";

const homeworkSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    classScheduleId: {
      type: String,
      required: true,
      trim: true,
    },
    homeworkTitle: {
      type: String,
      required: true,
      trim: true,
    },
    homeworkDescription: {
      type: String,
      required: true,
      trim: true,
    },
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
    additionalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "overdue"],
      default: "pending",
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const homeworkModel =
  mongoose.model.homeWork || mongoose.model("homeWork", homeworkSchema);
export default homeworkModel;
