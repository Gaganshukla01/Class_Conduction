import classSchedule from "../model/classesScheduleDetails.js";
import homeworkModel from "../model/homeworkModel.js";
import alertLog from "../model/alertLogModel.js";
import userModel from "../model/userModel.js";
import mongoose from "mongoose";
import {
  notifyClassReminder,
  notifyHomeworkDeadline,
  notifyLowAttendance,
  ATTENDANCE_ALERT_THRESHOLD,
} from "../services/notificationService.js";
import { classStart } from "../utils/time.js";

const DAY = 24 * 3600 * 1000;
const MIN_CLASSES_FOR_ALERT = 3;

const isoWeekKey = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

// Returns true the first time a (type,key) pair is seen, false afterwards.
const claim = async (type, key) => {
  try {
    await alertLog.create({ type, key });
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
};

export async function runAlerts(now = new Date()) {
  const result = {
    classReminders: 0,
    homeworkDueSoon: 0,
    homeworkOverdue: 0,
    lowAttendance: 0,
    errors: [],
  };

  // 1. Classes starting within the next 24 hours -------------------------
  try {
    const horizon = new Date(now.getTime() + DAY);
    const candidates = await classSchedule
      .find({
        classDate: { $gte: new Date(now.getTime() - 2 * DAY), $lte: new Date(now.getTime() + 3 * DAY) },
        reminderSentAt: null,
      })
      .limit(300)
      .lean();
    for (const cls of candidates) {
      const start = classStart(cls);
      if (start <= now || start > horizon) continue;
      await notifyClassReminder(cls);
      await classSchedule.updateOne({ _id: cls._id }, { reminderSentAt: new Date() });
      result.classReminders += 1;
    }
  } catch (e) {
    result.errors.push(`class reminders: ${e.message}`);
  }

  // 2. Homework deadlines ------------------------------------------------
  try {
    const open = await homeworkModel
      .find({ dueDate: { $ne: null }, status: { $in: ["pending", "overdue"] } })
      .limit(500)
      .lean();
    for (const hw of open) {
      const due = new Date(hw.dueDate);
      if (due <= now) {
        if (hw.status !== "overdue") {
          await homeworkModel.updateOne({ _id: hw._id }, { status: "overdue" });
        }
        if (!hw.overdueNotifiedAt) {
          await notifyHomeworkDeadline(hw, "overdue");
          await homeworkModel.updateOne({ _id: hw._id }, { overdueNotifiedAt: new Date() });
          result.homeworkOverdue += 1;
        }
      } else if (due - now <= DAY && !hw.dueSoonNotifiedAt) {
        await notifyHomeworkDeadline(hw, "soon");
        await homeworkModel.updateOne({ _id: hw._id }, { dueSoonNotifiedAt: new Date() });
        result.homeworkDueSoon += 1;
      }
    }
  } catch (e) {
    result.errors.push(`homework: ${e.message}`);
  }

  // 3. Low attendance (max one email per student per week) ---------------
  try {
    const docs = await classSchedule
      .find({ classDate: { $lte: new Date(now.getTime() + DAY) } })
      .select("classDate classTime classDuration attendance studentsEnrolled")
      .lean();
    const stats = new Map();
    for (const cls of docs) {
      if (classStart(cls) > now) continue;
      for (const sid of cls.studentsEnrolled || []) {
        const s = stats.get(sid) || { held: 0, present: 0 };
        s.held += 1;
        if (cls.attendance === "Present") s.present += 1;
        stats.set(sid, s);
      }
    }
    const week = isoWeekKey(now);
    let processed = 0;
    for (const [sid, s] of stats) {
      if (processed >= 200) break;
      const rate = Math.round((s.present / s.held) * 100);
      if (s.held < MIN_CLASSES_FOR_ALERT || rate >= ATTENDANCE_ALERT_THRESHOLD) continue;
      if (!mongoose.Types.ObjectId.isValid(sid)) continue;
      if (!(await claim("low-attendance", `${sid}:${week}`))) continue;
      const student = await userModel.findById(sid).select("name email").lean();
      if (!student) continue;
      await notifyLowAttendance(student, { ...s, rate });
      result.lowAttendance += 1;
      processed += 1;
    }
  } catch (e) {
    result.errors.push(`attendance: ${e.message}`);
  }

  return result;
}

export const dailyJob = async (req, res) => {
  const result = await runAlerts();
  res.status(result.errors.length ? 207 : 200).json({ success: result.errors.length === 0, ...result });
};
