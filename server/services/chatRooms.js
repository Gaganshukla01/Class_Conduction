import mongoose from "mongoose";
import userModel from "../model/userModel.js";
import { ChatThread, ChatSettings } from "../model/chatModel.js";
import { isStaffRole } from "../config/roles.js";

export const COMMUNITY = "community";
export const dmRoom = (studentId, teacherId) => `dm:${studentId}:${teacherId}`;

// "community"  ->  { type: "community" }
// "dm:<student>:<teacher>"  ->  { type: "dm", studentId, teacherId }
export function parseRoom(room) {
  if (!room || room === COMMUNITY) return { type: "community", room: COMMUNITY };
  const m = /^dm:([0-9a-f]{24}):([0-9a-f]{24})$/i.exec(String(room));
  return m ? { type: "dm", room: String(room), studentId: m[1], teacherId: m[2] } : null;
}

const fail = (status, message) => ({ ok: false, status, message });

// Who may read / write a room.
//  * community: everyone can read; whether students may post is an admin setting.
//  * dm: ONLY the one student and the one teacher it belongs to. The student side must really be
//    a student and the teacher side a teacher/admin - this is what stops student <-> student chats
//    even if somebody crafts a room id by hand.
export async function checkRoomAccess(user, room, { forSend = false } = {}) {
  const parsed = parseRoom(room);
  if (!parsed) return fail(400, "Unknown chat.");
  const uid = String(user?._id ?? user?.id);
  const admin = isStaffRole(user?.userType); // admin, manager and teacher are all "the teacher side"

  if (parsed.type === "community") {
    if (forSend && !admin) {
      const settings = await ChatSettings.findOne({ key: "main" }).lean();
      if (!settings?.studentsCanPost) {
        return fail(403, "Only teachers can post in the Community channel. Open a teacher from the list to send a private message.");
      }
    }
    return { ok: true, parsed };
  }

  const isMine = admin ? uid === parsed.teacherId : uid === parsed.studentId;
  if (!isMine) return fail(403, "You are not part of this conversation.");
  const [student, teacher] = await Promise.all([
    userModel.findById(parsed.studentId).select("userType").lean(),
    userModel.findById(parsed.teacherId).select("userType").lean(),
  ]);
  if (!student || student.userType !== "student") return fail(403, "Private chats are only between a student and a teacher.");
  if (!teacher || !isStaffRole(teacher.userType)) return fail(403, "Students can only chat privately with teachers.");
  return { ok: true, parsed };
}

// Update the conversation list entry + the recipient's unread counter.
export async function touchThread(room, sender, preview) {
  const parsed = parseRoom(room);
  if (parsed?.type !== "dm") return;
  const fromTeacher = isStaffRole(sender.role);
  const fromStudent = sender.role === "student";
  const inc = fromStudent ? { teacherUnread: 1 } : { studentUnread: 1 }; // teacher or system -> student
  await ChatThread.findOneAndUpdate(
    { room: parsed.room },
    {
      $set: { studentId: parsed.studentId, teacherId: parsed.teacherId, lastMessageAt: new Date(), lastMessagePreview: String(preview || "").slice(0, 140), lastSenderId: String(sender.id) },
      $inc: inc,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return fromTeacher;
}

export async function markThreadRead(room, user) {
  const parsed = parseRoom(room);
  if (parsed?.type !== "dm") return;
  const field = isStaffRole(user.userType) ? "teacherUnread" : "studentUnread";
  await ChatThread.updateOne({ room: parsed.room }, { $set: { [field]: 0 } });
}

export const validId = (id) => mongoose.Types.ObjectId.isValid(id);
