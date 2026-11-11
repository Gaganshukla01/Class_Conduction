import mongoose from "mongoose";

// A one-off "Extra class" or "Substitute class". Kept separate from the 30-week
// recurring schedule (and from the attendance % maths) on purpose.
const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    status: { type: String, enum: ["Present", "Absent"], required: true },
  },
  { _id: false }
);

const extraClassSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["extra", "substitute"], default: "extra" },
    title: { type: String, required: true, trim: true, maxlength: 120 }, // class / course name
    topic: { type: String, trim: true, default: "", maxlength: 200 },
    classDate: { type: Date, required: true }, // UTC midnight of the picked day (same convention as classSchedule)
    classTime: { type: String, required: true }, // "HH:mm" institute time
    classDuration: { type: String, default: "1" }, // hours
    classLink: { type: String, required: true },
    instructorId: { type: String },
    substituteFor: { type: String, trim: true, default: "", maxlength: 120 }, // original teacher / class
    note: { type: String, trim: true, default: "", maxlength: 1000 },
    studentsEnrolled: [{ type: String, index: true }],
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
    attendance: { type: [attendanceSchema], default: [] },
    attendanceMarkedAt: { type: Date },
    createdBy: { type: String, required: true },
    chatMessageId: { type: String },
  },
  { timestamps: true }
);
extraClassSchema.index({ classDate: -1 });

export default mongoose.models.extraClass || mongoose.model("extraClass", extraClassSchema);
