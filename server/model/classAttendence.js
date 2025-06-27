import mongoose from "mongoose";

const classAttendanceSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    className: { type: String },
    classStartAt: { type: Date },
    classEndAt: { type: Date },
    topicCovered: { type: String },
    additionalNotes: { type: String },
}, { timestamps: true });

const classAttendanceModel = mongoose.models.classAttendance || mongoose.model('classAttendance', classAttendanceSchema);

export default classAttendanceModel;