import mongoose from "mongoose";

const classScheduleSchema = new mongoose.Schema({
  className: { type: String, required: true },
  classDate: { type: Date, required: true },
  classTime: { type: String, required: true },
  instructorId: { type: String },
  studentsEnrolled: [{ type: String }],
  classLink: { type: String, required: true },
  classDuration: { type: String, required: true },
  attendance: { type: String, default: "Absent", enum: ["Present", "Absent"] },
  notes: { type: String, default: "" },
  topicCovered: { type: String, default: "" },
  classRate: { type: Number, required: true },
  paid: { type: Boolean, default: false },
});

const classSchedule =
  mongoose.model.classSchedule ||
  mongoose.model("classSchedule", classScheduleSchema);

export default classSchedule;
