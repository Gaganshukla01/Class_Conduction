import userModel from "../model/userModel.js";
import chatLegacy from "../model/CommonEditor.js";
import { ChatMessage, ChatReadState, ChatThread } from "../model/chatModel.js";
import { dmRoom } from "./chatRooms.js";

const ROOM = "community";

// Safe to run any number of times. It
//  1. gives every EXISTING user a chat read-marker (so unread badges start at 0 instead of
//     flagging the whole history),
//  2. imports the old "Common Area" posts. Each old post was written by a teacher for ONE
//     student, so it goes into that student's PRIVATE chat with the teacher (nothing private
//     becomes public). Posts without a known teacher become messages targeted at that student in
//     the Community room. Posts that an earlier run already put in Community are moved.
//  3. posts a single welcome message.
// Existing users need no other migration: access to the chat depends only on their role.
export async function migrateChat({ dryRun = false } = {}) {
  const result = { users: 0, readStatesCreated: 0, legacyFound: 0, legacyImported: 0, legacyMoved: 0, privateChats: 0, welcomePosted: false, dryRun };

  // 1) read markers
  const users = await userModel.find().select("name userType").lean();
  result.users = users.length;
  const have = new Set((await ChatReadState.find({ room: ROOM }).select("userId").lean()).map((s) => s.userId));
  const missing = users.filter((u) => !have.has(String(u._id)));
  result.readStatesCreated = missing.length;
  if (!dryRun && missing.length) {
    try {
      await ChatReadState.insertMany(missing.map((u) => ({ userId: String(u._id), room: ROOM, lastReadAt: new Date() })), { ordered: false });
    } catch (e) { if (e.code !== 11000 && !e.writeErrors) throw e; }
  }

  // 2) old Common Area posts
  const legacy = await chatLegacy.find().sort({ createdAt: 1 }).lean();
  result.legacyFound = legacy.length;
  if (legacy.length) {
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const existing = new Map(
      (await ChatMessage.find({ legacyId: { $in: legacy.map((l) => String(l._id)) } }).select("legacyId room").lean()).map((m) => [m.legacyId, m.room])
    );
    const plan = legacy.map((l) => {
      const author = l.createdBy && byId.get(String(l.createdBy));
      const teacher = author && author.userType === "admin" ? author : null;
      const room = teacher ? dmRoom(String(l.userId), String(teacher._id)) : ROOM;
      return { l, author, teacher, room };
    });

    const rows = plan
      .filter(({ l }) => !existing.has(String(l._id)))
      .map(({ l, author, teacher, room }) => ({
        room,
        senderId: author ? String(author._id) : "system",
        senderName: author?.name || "ClassWave",
        senderRole: author ? (author.userType === "admin" ? "admin" : "student") : "system",
        type: "text",
        text: [l.heading, l.chat].filter(Boolean).join("\n").slice(0, 4000),
        audience: teacher ? [] : [String(l.userId)],
        legacyId: String(l._id),
        createdAt: l.createdAt, // keep the original date (Mongoose only sets createdAt when it is missing)
      }));
    result.legacyImported = rows.length;

    const moves = plan.filter(({ l, room }) => existing.has(String(l._id)) && existing.get(String(l._id)) !== room && room !== ROOM);
    result.legacyMoved = moves.length;

    // conversation-list entries for every private chat we touch
    const latest = new Map();
    plan.filter(({ teacher }) => teacher).forEach(({ l, teacher, room }) => {
      const cur = latest.get(room);
      if (!cur || new Date(l.createdAt) > new Date(cur.at)) latest.set(room, { studentId: String(l.userId), teacherId: String(teacher._id), at: l.createdAt, preview: [l.heading, l.chat].filter(Boolean).join(" · ") });
    });
    result.privateChats = latest.size;

    if (!dryRun) {
      if (rows.length) await ChatMessage.insertMany(rows, { ordered: false });
      for (const { l, room } of moves) await ChatMessage.updateOne({ legacyId: String(l._id) }, { $set: { room, audience: [] } });
      for (const [room, t] of latest) {
        const thread = await ChatThread.findOne({ room }).lean();
        if (!thread || new Date(thread.lastMessageAt) < new Date(t.at)) {
          await ChatThread.updateOne(
            { room },
            { $set: { studentId: t.studentId, teacherId: t.teacherId, lastMessageAt: t.at, lastMessagePreview: t.preview.slice(0, 140) }, $setOnInsert: { studentUnread: 0, teacherUnread: 0 } },
            { upsert: true }
          );
        }
      }
    }
  }

  // 3) welcome message (once)
  const welcomed = await ChatMessage.findOne({ legacyId: "welcome-v1" }).select("_id").lean();
  if (!welcomed) {
    result.welcomePosted = true;
    if (!dryRun) {
      await ChatMessage.create({
        room: ROOM, senderId: "system", senderName: "ClassWave", senderRole: "system", type: "system",
        text: "👋 Welcome to the new Community Chat! Students, teachers and admins can now talk here and share PDFs and images.",
        legacyId: "welcome-v1",
      });
    }
  }
  return result;
}
