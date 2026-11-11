import userModel from "../model/userModel.js";
import chatLegacy from "../model/CommonEditor.js";
import { ChatMessage, ChatReadState } from "../model/chatModel.js";

const ROOM = "community";

// Safe to run any number of times. It
//  1. gives every EXISTING user a chat read-marker (so unread badges start at 0 instead of
//     flagging the whole history),
//  2. imports the old "Common Area" posts into the new chat. Each old post was written for ONE
//     student, so it is imported as a TARGETED message: only that student and the admins can
//     see it (nothing private becomes public),
//  3. posts a single welcome message.
// Existing users need no other migration: access to the chat depends only on their role.
export async function migrateChat({ dryRun = false } = {}) {
  const result = { users: 0, readStatesCreated: 0, legacyFound: 0, legacyImported: 0, welcomePosted: false, dryRun };

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
    const done = new Set((await ChatMessage.find({ legacyId: { $in: legacy.map((l) => String(l._id)) } }).select("legacyId").lean()).map((m) => m.legacyId));
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const rows = legacy
      .filter((l) => !done.has(String(l._id)))
      .map((l) => {
        const author = l.createdBy && byId.get(String(l.createdBy));
        return {
          room: ROOM,
          senderId: author ? String(author._id) : "system",
          senderName: author?.name || "ClassWave",
          senderRole: author ? (author.userType === "admin" ? "admin" : "student") : "system",
          type: "text",
          text: [l.heading, l.chat].filter(Boolean).join("\n").slice(0, 4000),
          audience: [String(l.userId)],
          legacyId: String(l._id),
          createdAt: l.createdAt, // keep the original date (Mongoose only sets createdAt when it is missing)
        };
      });
    result.legacyImported = rows.length;
    if (!dryRun && rows.length) await ChatMessage.insertMany(rows, { ordered: false });
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
