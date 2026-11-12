import mongoose from "mongoose";
import ExtraClass from "../model/extraClassModel.js";
import userModel from "../model/userModel.js";
import classSchedule from "../model/classesScheduleDetails.js";
import { createChatMessage } from "./chatController.js";
import { dmRoom } from "../services/chatRooms.js";
import { notifyExtraClass, summaryText } from "../services/notificationService.js";
import { classStart } from "../utils/time.js";

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
// For a substitute it also says WHICH class it replaces.
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
  replaces: extra.original?.classDate
    ? { className: extra.original.className || extra.title, classDate: extra.original.classDate, classTime: extra.original.classTime }
    : undefined,
  instructorName,
  ...extraFlags,
});

// One-to-one platform: the card goes into EACH student's private chat with the teacher
// (not into a shared channel). Returns the first message id.
async function postToPrivateChats(extra, teacherId, { type, text, card }) {
  let first = null;
  for (const studentId of extra.studentsEnrolled) {
    try {
      const m = await createChatMessage({ sender: SYSTEM, room: dmRoom(studentId, teacherId), type, text, card });
      first = first || m._id;
    } catch (e) {
      console.error("extra class chat message failed for", studentId, e.message);
    }
  }
  return first;
}

// The teacher must be an admin; fall back to the person creating the class.
const teacherIdFor = async (instructorId, fallback) => {
  const u = instructorId && (await userModel.findById(instructorId).select("userType").lean());
  return u && u.userType === "admin" ? String(instructorId) : String(fallback);
};

const instructorNameOf = async (id) => {
  if (!id) return "";
  const u = await userModel.findById(id).select("name").lean();
  return u?.name || "";
};

// ---------------------------------------------------------------- substitute <-> scheduled class
// A substitute REPLACES one scheduled session: that session's date / time / link / duration (and
// teacher) are overwritten with the substitute's, so attendance is marked for it exactly like for
// any other class. The original values are kept in `substitution` so it can be undone.
async function applySubstitution(cls, extra, instructorId) {
  cls.substitution = {
    extraClassId: String(extra._id),
    originalDate: cls.classDate,
    originalTime: cls.classTime,
    originalLink: cls.classLink,
    originalInstructorId: cls.instructorId,
    originalDuration: cls.classDuration,
    substitutedAt: new Date(),
  };
  cls.classDate = extra.classDate;
  cls.classTime = extra.classTime;
  cls.classLink = extra.classLink;
  cls.classDuration = extra.classDuration;
  if (instructorId) cls.instructorId = instructorId;
  cls.reminderSentAt = undefined; // the 24-hour reminder must go out for the NEW time
  await cls.save();
}

// Keep the scheduled session in step when the substitute is rescheduled.
async function syncSubstitution(extra) {
  const cls = extra.replacesClassId && (await classSchedule.findById(extra.replacesClassId));
  if (!cls || cls.substitution?.extraClassId !== String(extra._id)) return;
  cls.classDate = extra.classDate;
  cls.classTime = extra.classTime;
  cls.classLink = extra.classLink;
  cls.classDuration = extra.classDuration;
  cls.reminderSentAt = undefined;
  await cls.save();
}

// Undo: the scheduled class goes back to its original date / time / link.
async function revertSubstitution(extra) {
  const cls = extra.replacesClassId && (await classSchedule.findById(extra.replacesClassId));
  if (!cls || cls.substitution?.extraClassId !== String(extra._id)) return false;
  const s = cls.substitution;
  cls.classDate = s.originalDate;
  cls.classTime = s.originalTime;
  cls.classLink = s.originalLink;
  cls.classDuration = s.originalDuration;
  if (s.originalInstructorId) cls.instructorId = s.originalInstructorId;
  cls.substitution = undefined;
  cls.reminderSentAt = undefined;
  await cls.save();
  return true;
}

const attendanceLocked = async (extra) => {
  if (extra.type !== "substitute" || !extra.replacesClassId) return false;
  const cls = await classSchedule.findById(extra.replacesClassId).select("attendanceMarkedAt substitution").lean();
  return Boolean(cls?.attendanceMarkedAt) && cls.substitution?.extraClassId === String(extra._id);
};

// GET /replaceable?studentIds=a,b  -> upcoming scheduled classes these students are all part of
export const replaceableClasses = async (req, res) => {
  try {
    const ids = validIds(String(req.query.studentIds || "").split(","));
    if (ids.length === 0) return res.status(200).json({ success: true, data: [] });
    const since = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    const docs = await classSchedule
      .find({ studentsEnrolled: { $all: ids }, classDate: { $gte: since }, "substitution.extraClassId": null })
      .select("className classDate classTime classDuration classLink instructorId studentsEnrolled attendance attendanceMarkedAt")
      .limit(300)
      .lean();
    const now = new Date();
    const upcoming = docs.filter((c) => classStart(c) >= now && !c.attendanceMarkedAt).sort((a, b) => classStart(a) - classStart(b)).slice(0, 80);
    const users = await userModel.find({ _id: { $in: validIds(upcoming.flatMap((c) => c.studentsEnrolled)) } }).select("name").lean();
    const names = new Map(users.map((u) => [String(u._id), u.name]));
    res.status(200).json({
      success: true,
      data: upcoming.map((c) => ({ ...c, students: c.studentsEnrolled.map((id) => ({ _id: id, name: names.get(String(id)) || "Student" })) })),
    });
  } catch (error) {
    console.error("replaceableClasses:", error);
    res.status(500).json({ success: false, message: "Could not load the scheduled classes." });
  }
};

export const createExtraClass = async (req, res) => {
  try {
    const isSub = req.body.type === "substitute";
    let cls = null;
    let students;

    if (isSub) {
      // ---- which scheduled class is being replaced?
      const classId = validIds([req.body.replacesClassId])[0];
      if (!classId) return res.status(400).json({ success: false, message: "Choose which scheduled class this substitute replaces." });
      cls = await classSchedule.findById(classId);
      if (!cls) return res.status(404).json({ success: false, message: "That scheduled class was not found." });
      if (cls.substitution?.extraClassId) return res.status(400).json({ success: false, message: "That class has already been replaced by a substitute class." });
      if (cls.attendanceMarkedAt) return res.status(400).json({ success: false, message: "Attendance is already marked for that class, so it can no longer be replaced." });
      if (classStart(cls) < new Date()) return res.status(400).json({ success: false, message: "Only upcoming classes can be replaced." });

      const enrolled = (cls.studentsEnrolled || []).map(String);
      const picked = await resolveStudents(req.body.studentIds, []);
      if (picked.some((id) => !enrolled.includes(id))) return res.status(400).json({ success: false, message: "One of the selected students is not part of that scheduled class." });
      // the replaced session belongs to everyone enrolled in it, so everyone is told
      students = await resolveStudents(enrolled, []);
      if (students.length === 0) return res.status(400).json({ success: false, message: "That class has no students." });
    } else {
      students = await resolveStudents(req.body.studentIds, req.body.classScheduleIds);
      if (students.length === 0) return res.status(400).json({ success: false, message: "Select at least one student or class." });
    }

    const fields = readFields(
      isSub ? { ...req.body, title: req.body.title || cls.className, duration: req.body.duration ?? cls.classDuration, classLink: req.body.classLink || cls.classLink } : req.body
    );
    const instructorId = await teacherIdFor(validIds([req.body.instructorId])[0], req.userId);

    const extra = await ExtraClass.create({
      ...fields,
      instructorId,
      studentsEnrolled: students,
      createdBy: String(req.userId),
      ...(isSub
        ? {
            replacesClassId: String(cls._id),
            original: { className: cls.className, classDate: cls.classDate, classTime: cls.classTime, classLink: cls.classLink, instructorId: cls.instructorId, classDuration: cls.classDuration },
          }
        : {}),
    });

    // 1) the scheduled class takes the new details (so attendance can be marked for it)
    if (isSub) await applySubstitution(cls, extra, instructorId);

    // 2) rich card (with a Join Now button) in each student's private chat with the teacher
    const label = extra.type === "substitute" ? "Substitute class" : "Extra class";
    const instructorName = await instructorNameOf(instructorId);
    const chatId = await postToPrivateChats(extra, instructorId, {
      type: "extra_class",
      text: isSub ? `${label}: your ${extra.title} class is replaced` : `${label} scheduled: ${extra.title}`,
      card: buildCard(extra, instructorName),
    });
    extra.chatMessageId = chatId ? String(chatId) : undefined;
    await extra.save();

    // 3) e-mail
    const email = await notifyExtraClass(extra.toObject());

    res.status(201).json({
      success: true,
      message: isSub
        ? `The scheduled class was replaced. ${students.length} student${students.length === 1 ? "" : "s"} notified in their chat${chatId ? "" : " (chat failed)"} and by e-mail. Mark attendance for it as usual.`
        : `${label} scheduled for ${students.length} student${students.length === 1 ? "" : "s"}${chatId ? " and sent to their chats" : ""}.`,
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
    const [users, docs] = await Promise.all([
      userModel.find({ _id: { $in: ids } }).select("name email avatar").lean(),
      classSchedule.find({ _id: { $in: validIds(list.map((c) => c.replacesClassId)) } }).select("attendance attendanceMarkedAt topicCovered notes").lean(),
    ]);
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const docBy = new Map(docs.map((d) => [String(d._id), d]));
    res.status(200).json({
      success: true,
      data: list.map((c) => ({
        ...c,
        students: c.studentsEnrolled.map((id) => ({ _id: id, name: byId.get(id)?.name || "Unknown", email: byId.get(id)?.email, avatar: byId.get(id)?.avatar?.url })),
        instructorName: byId.get(c.instructorId)?.name || "",
        // attendance of a substitute lives on the scheduled class it replaced
        scheduledClass: c.replacesClassId ? docBy.get(c.replacesClassId) || null : undefined,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load extra classes." });
  }
};

export const myExtraClasses = async (req, res) => {
  try {
    const list = await ExtraClass.find({ studentsEnrolled: String(req.userId) }).sort({ classDate: -1, classTime: -1 }).limit(50).lean();
    const docs = await classSchedule.find({ _id: { $in: validIds(list.map((c) => c.replacesClassId)) } }).select("attendance attendanceMarkedAt").lean();
    const docBy = new Map(docs.map((d) => [String(d._id), d]));
    res.status(200).json({
      success: true,
      data: list.map((c) => {
        const doc = c.replacesClassId ? docBy.get(c.replacesClassId) : null;
        return {
          _id: c._id, type: c.type, title: c.title, topic: c.topic, classDate: c.classDate, classTime: c.classTime,
          classDuration: c.classDuration, classLink: c.status === "cancelled" ? "" : c.classLink,
          substituteFor: c.substituteFor, note: c.note, status: c.status,
          replaces: c.original?.classDate ? { className: c.original.className, classDate: c.original.classDate, classTime: c.original.classTime } : undefined,
          myAttendance: doc ? (doc.attendanceMarkedAt ? doc.attendance : null) : c.attendance.find((a) => a.studentId === String(req.userId))?.status || null,
        };
      }),
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
    if (extra.type === "substitute") {
      return res.status(400).json({ success: false, message: "A substitute class replaces a scheduled class - mark its attendance with the scheduled class (Class Attendance, or the Mark attendance button on this card)." });
    }
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
    const isSub = extra.type === "substitute";

    if (req.body.status === "cancelled" && !wasCancelled) {
      if (isSub && (await attendanceLocked(extra))) {
        return res.status(400).json({ success: false, message: "Attendance is already marked for this class, so it can no longer be cancelled." });
      }
      const restored = isSub ? await revertSubstitution(extra) : false;
      extra.status = "cancelled";
      await extra.save();
      const label = isSub ? "Substitute class" : "Extra class";
      await postToPrivateChats(extra, await teacherIdFor(extra.instructorId, req.userId), {
        type: "system",
        text: isSub && restored ? `❌ Substitute class cancelled - your ${extra.title} class stays as originally scheduled` : `❌ ${label} cancelled: ${extra.title}`,
        card: {
          kind: "extra_class_cancelled",
          title: extra.title,
          classDate: extra.classDate,
          classTime: extra.classTime,
          restored: restored ? { classDate: extra.original?.classDate, classTime: extra.original?.classTime } : undefined,
        },
      });
      const email = await notifyExtraClass(extra.toObject(), { cancelled: true });
      return res.status(200).json({
        success: true,
        message: restored ? "Substitute cancelled. The scheduled class is back to its original time and students are notified." : "Class cancelled and students notified.",
        email, emailMessage: summaryText(email), data: extra,
      });
    }

    if (isSub && (await attendanceLocked(extra))) {
      return res.status(400).json({ success: false, message: "Attendance is already marked for this class, so it can no longer be changed." });
    }
    const fields = readFields({ ...extra.toObject(), date: req.body.date ?? extra.classDate.toISOString().slice(0, 10), time: req.body.time ?? extra.classTime, duration: req.body.duration ?? extra.classDuration, ...req.body });
    const changedSchedule = fields.classDate.getTime() !== extra.classDate.getTime() || fields.classTime !== extra.classTime || fields.classLink !== extra.classLink;
    Object.assign(extra, fields);
    if (wasCancelled && req.body.status === "scheduled") extra.status = "scheduled";
    await extra.save();
    if (isSub && changedSchedule && extra.status !== "cancelled") await syncSubstitution(extra);

    let email = null;
    if (changedSchedule && extra.status !== "cancelled") {
      const instructorName = await instructorNameOf(extra.instructorId);
      await postToPrivateChats(extra, await teacherIdFor(extra.instructorId, req.userId), {
        type: "extra_class",
        text: `Updated: ${extra.title}`,
        card: buildCard(extra, instructorName, { updated: true }),
      });
      email = await notifyExtraClass(extra.toObject());
    }
    res.status(200).json({ success: true, message: changedSchedule ? "Updated and students notified." : "Updated.", email, emailMessage: summaryText(email), data: extra });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExtraClass = async (req, res) => {
  try {
    const extra = await ExtraClass.findById(req.params.id);
    if (!extra) return res.status(404).json({ success: false, message: "Class not found." });
    // Deleting a substitute that has not happened yet must not leave the scheduled class on the new time
    if (extra.type === "substitute" && extra.status === "scheduled" && !(await attendanceLocked(extra))) await revertSubstitution(extra);
    await extra.deleteOne();
    res.status(200).json({ success: true, message: "Deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete." });
  }
};
