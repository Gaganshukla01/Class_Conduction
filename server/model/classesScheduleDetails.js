import mongoose from "mongoose";

const classScheduleSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    classDate: { type: Date, required: true },
    classTime: { type: String, required: true }, // "HH:mm" (24h)
    instructorId: { type: String },
    studentsEnrolled: [{ type: String }],
    classLink: { type: String, required: true },
    classDuration: { type: String, required: true },
    attendance: { type: String, default: "Absent", enum: ["Present", "Absent"] },
    notes: { type: String, default: "" },
    topicCovered: { type: String, default: "" },
    classRate: { type: Number, required: true },
    paid: { type: Boolean, default: false },

    // These fields were being written by the controller but were missing from
    // the schema, so Mongoose (strict mode) silently dropped them.
    weekNumber: { type: Number },
    seriesId: { type: String, index: true },
    originalDate: { type: String },
    paymentUpdatedAt: { type: Date },
    attendanceMarkedAt: { type: Date },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
);

classScheduleSchema.index({ classDate: -1 });
classScheduleSchema.index({ studentsEnrolled: 1, classDate: -1 });

const classSchedule =
  mongoose.models.classSchedule ||
  mongoose.model("classSchedule", classScheduleSchema);

export default classSchedule;
