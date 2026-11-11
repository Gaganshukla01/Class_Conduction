import mongoose from "mongoose";
import ExtraClass from "../model/extraClassModel.js";
import userModel from "../model/userModel.js";
import classSchedule from "../model/classesScheduleDetails.js";
import { createChatMessage } from "./chatController.js";
import { notifyExtraClass, summaryText } from "../services/notificationService.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const validIds = (ids) => [...new Set((Array.isArray(ids) ? ids : []).map(String))].filter((i) => mongoose.Types.ObjectId.isValid(i));
const SYSTEM = { id: "system", name: "ClassWave", role: "system" };

// Students picked directly + everyone enrolled in picked classes
async function resolveStudents(studentIds, classScheduleIds) {
  let ids = validIds(studentIds);
  const classIds = validIds(classScheduleIds);
  if (classIds.length) {
    const classes = await classSchedule.find({ _id: { $in: classIds } }).select("studentsEnrolled").lean();
    classes.forEach((c) => (c.studentsEnrolled || []).forEach((s) => ids.push(String(s))));
  }
  ids = validIds(ids);
  if (!ids.length) return [];
  const users = await userModel.find({ _id: { $in: ids }, userType: "student" }).select("_id").lean();
  return users.map((u) => String(u._id));
}

const readFields = (body) => {
  const title = String(body.title || "").trim();
  if (!title) throw new Error("Enter the class name.");
  if (!DATE_RE.test(String(body.date || ""))) throw new Error("Pick a valid date.");
  if (!TIME_RE.test(String(body.time || ""))) throw new Error("Pick a valid time.");
  const link = String(body.classLink || "").trim();
  if (!/^https?:\/\//i.test(link)) throw new Error("The class link must start with http:// or https://");
  const duration = Number(body.duration ?? 1);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 12) throw new Error("Duration must be between 0 and 12 hours.");
  return {
    type: body.type === "substitute" ? "substitute" : "extra",
    title: title.slice(0, 120),
    topic: String(body.topic || "").trim().slice(0, 200),
    classDate: new Date(body.date),
    classTime: String(body.time),
    classDuration: String(duration),
    classLink: link,
    substituteFor: String(body.substituteFor || "").trim().slice(0, 120),
    note: String(body.note || "").trim().slice(0, 1000),
  };
};

// The rich message that lands in the students' chat (with a "Join Now" button).
const buildCard = (extra, instructorName, extraFlags = {}) => ({
  kind: "extra_class",
  extraClassId: String(extra._id),
  classType: extra.type,
  title: extra.title,
  topic: extra.topic,
  classDate: extra.classDate,
  classTime: extra.classTime,
  duration: extra.classDuration,
  joinUrl: extra.classLink,
  note: extra.note,
  substituteFor: extra.substituteFor,
  instructorName,
  ...extraFlags,
});

const instructorNameOf = async (id) => {
  if (!id) return "";
  const u = await userModel.findById(id).select("name").lean();
  return u?.name || "";
};

export const createExtraClass = async (req, res) => {
  try {
    const fields = readFields(req.body);
    const students = await resolveStudents(req.body.studentIds, req.body.classScheduleIds);
    if (students.length === 0) return res.status(400).json({ success: false, message: "Select at least one student or class." });

    const instructorId = validIds([req.body.instructorId])[0] || String(req.userId);
    const extra = await ExtraClass.create({ ...fields, instructorId, studentsEnrolled: students, createdBy: String(req.userId) });
    const instructorName = await instructorNameOf(instructorId);
    const label = extra.type === "substitute" ? "Substitute class" : "Extra class";

    // 1) rich chat card for the targeted students (admins can see it too)
    let chat = null;
    try {
      chat = await createChatMessage({
        sender: SYSTEM,
        type: "extra_class",
        text: `${label} scheduled: ${extra.title}`,
        card: buildCard(extra, instructorName),
        audience: students,
      });
      extra.chatMessageId = chat._id;
      await extra.save();
    } catch (e) {
      console.error("extra class chat message failed:", e.message);
    }
    // 2) email
    const email = await notifyExtraClass(extra.toObject());

    res.status(201).json({
      success: true,
      message: `${label} scheduled for ${students.length} student${students.length === 1 ? "" : "s"}${chat ? " and posted in the chat" : ""}.`,
      email,
      emailMessage: summaryText(email),
      data: extra,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listExtraClasses = async (req, res) => {
  try {
    const list = await ExtraClass.find().sort({ classDate: -1, classTime: -1 }).limit(100).lean();
    const ids = validIds([...new Set(list.flatMap((c) => [...c.studentsEnrolled, c.instructorId]))]);
    const users = await userModel.find({ _id: { $in: ids } }).select("name email").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    res.status(200).json({
      success: true,
      data: list.map((c) => ({
        ...c,
        students: c.studentsEnrolled.map((id) => ({ _id: id, name: byId.get(id)?.name || "Unknown", email: byId.get(id)?.email })),
        instructorName: byId.get(c.instructorId)?.name || "",
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load extra classes." });
  }
};

export const myExtraClasses = async (req, res) => {
  try {
    const list = await ExtraClass.find({ studentsEnrolled: String(req.userId) }).sort({ classDate: -1, classTime: -1 }).limit(50).lean();
    res.status(200).json({
      success: true,
      data: list.map((c) => ({
        _id: c._id, type: c.type, title: c.title, topic: c.topic, classDate: c.classDate, classTime: c.classTime,
        classDuration: c.classDuration, classLink: c.status === "cancelled" ? "" : c.classLink,
        substituteFor: c.substituteFor, note: c.note, status: c.status,
        myAttendance: c.attendance.find((a) => a.studentId === String(req.userId))?.status || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load your extra classes." });
  }
};

export const markExtraAttendance = async (req, res) => {
  try {
    const extra = await ExtraClass.findById(req.params.id);
    if (!extra) return res.status(404).json({ success: false, message: "Class not found." });
    if (extra.status === "cancelled") return res.status(400).json({ success: false, message: "This class was cancelled." });
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    if (records.length === 0) return res.status(400).json({ success: false, message: "Mark at least one student." });

    const enrolled = new Set(extra.studentsEnrolled);
    const next = new Map(extra.attendance.map((a) => [a.studentId, a.status]));
    for (const r of records) {
      if (!enrolled.has(String(r.studentId))) return res.status(400).json({ success: false, message: "A selected student is not part of this class." });
      if (!["Present", "Absent"].includes(r.status)) return res.status(400).json({ success: false, message: "Status must be Present or Absent." });
      next.set(String(r.studentId), r.status);
    }
    extra.attendance = [...next].map(([studentId, status]) => ({ studentId, status }));
    extra.attendanceMarkedAt = new Date();
    extra.status = "completed";
    await extra.save();
    const present = extra.attendance.filter((a) => a.status === "Present").length;
    res.status(200).json({ success: true, message: `Attendance saved (${present} present, ${extra.attendance.length - present} absent).`, data: extra });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateExtraClass = async (req, res) => {
  try {
    const extra = await ExtraClass.findById(req.params.id);
    if (!extra) return res.status(404).json({ success: false, message: "Class not found." });
    const wasCancelled = extra.status === "cancelled";

    if (req.body.status === "cancelled" && !wasCancelled) {
      extra.status = "cancelled";
      await extra.save();
      const label = extra.type === "substitute" ? "Substitute class" : "Extra class";
      await createChatMessage({
        sender: SYSTEM, type: "system", text: `❌ ${label} cancelled: ${extra.title}`,
        card: { kind: "extra_class_cancelled", title: extra.title, classDate: extra.classDate, classTime: extra.classTime },
        audience: extra.studentsEnrolled,
      }).catch(() => {});
      const email = await notifyExtraClass(extra.toObject(), { cancelled: true });
      return res.status(200).json({ success: true, message: "Class cancelled and students notified.", email, emailMessage: summaryText(email), data: extra });
    }

    const fields = readFields({ ...extra.toObject(), date: req.body.date ?? extra.classDate.toISOString().slice(0, 10), time: req.body.time ?? extra.classTime, duration: req.body.duration ?? extra.classDuration, ...req.body });
    const changedSchedule = fields.classDate.getTime() !== extra.classDate.getTime() || fields.classTime !== extra.classTime || fields.classLink !== extra.classLink;
    Object.assign(extra, fields);
    if (wasCancelled && req.body.status === "scheduled") extra.status = "scheduled";
    await extra.save();

    let email = null;
    if (changedSchedule && extra.status !== "cancelled") {
      const instructorName = await instructorNameOf(extra.instructorId);
      await createChatMessage({
        sender: SYSTEM, type: "extra_class", text: `Updated: ${extra.title}`,
        card: buildCard(extra, instructorName, { updated: true }), audience: extra.studentsEnrolled,
      }).catch(() => {});
      email = await notifyExtraClass(extra.toObject());
    }
    res.status(200).json({ success: true, message: changedSchedule ? "Updated and students notified." : "Updated.", email, emailMessage: summaryText(email), data: extra });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExtraClass = async (req, res) => {
  try {
    const extra = await ExtraClass.findByIdAndDelete(req.params.id);
    if (!extra) return res.status(404).json({ success: false, message: "Class not found." });
    res.status(200).json({ success: true, message: "Deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete." });
  }
};
