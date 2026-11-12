// Run: node tests/dm.test.mjs   (stubbed models - no MongoDB needed)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test";
process.env.FRONTEND_URL = "https://app.test";
process.env.CLOUDINARY_CLOUD_NAME = "democloud"; process.env.CLOUDINARY_API_KEY = "k"; process.env.CLOUDINARY_API_SECRET = "s";

const { default: transporter } = await imp("config/nodeMailer.js");
const { default: userModel } = await imp("model/userModel.js");
const { default: classSchedule } = await imp("model/classesScheduleDetails.js");
const { default: ExtraClass } = await imp("model/extraClassModel.js");
const { ChatMessage, ChatReadState, ChatThread, ChatSettings } = await imp("model/chatModel.js");
const rooms = await imp("services/chatRooms.js");
const chat = await imp("controller/chatController.js");
const uc = await imp("controller/userController.js");
const ec = await imp("controller/extraClassController.js");

const sent = [];
transporter.sendMail = async (m) => { sent.push(m); return {}; };
const oid = (n) => `64b${String(n).padStart(21, "0")}`;
const T1 = oid(9), T2 = oid(8), S1 = oid(1), S2 = oid(2);
const users = [
  { _id: T1, name: "Mr Sharma", email: "t1@x.com", userType: "admin", avatar: { url: "https://res.cloudinary.com/democloud/image/upload/v1/classwave/avatars/t1/a.png", publicId: "classwave/avatars/t1/a" } },
  { _id: T2, name: "Ms Rao", email: "t2@x.com", userType: "admin" },
  { _id: S1, name: "Asha", email: "a@x.com", userType: "student" },
  { _id: S2, name: "Ravi", email: "r@x.com", userType: "student" },
];
function query(get) { const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => get(), then: (a, b) => Promise.resolve(get()).then(a, b) }; return q; }
const match = (u, f) => Object.entries(f).every(([k, v]) => (k === "_id" ? (v.$in ? v.$in.includes(String(u._id)) : String(u._id) === String(v)) : k === "userType" ? (v.$ne ? u.userType !== v.$ne : u.userType === v) : true));
userModel.find = (f = {}) => query(() => users.filter((u) => match(u, f)));
userModel.findById = (id) => query(() => users.find((u) => String(u._id) === String(id)) || null);
const res = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };
const req = (u, extra = {}) => ({ userId: String(u._id), user: u, body: {}, query: {}, params: {}, ...extra });
const student = users[2], teacher = users[0], student2 = users[3], teacher2 = users[1];

// --- in-memory ChatThread + stubs
let threads = []; let settings = null; let messages = []; let states = [];
ChatThread.findOneAndUpdate = async (f, u) => {
  let t = threads.find((x) => x.room === f.room);
  if (!t) { t = { room: f.room, studentUnread: 0, teacherUnread: 0 }; threads.push(t); }
  Object.assign(t, u.$set || {}); Object.entries(u.$inc || {}).forEach(([k, v]) => { t[k] += v; }); return t;
};
ChatThread.updateOne = async (f, u) => { const t = threads.find((x) => x.room === f.room); if (t) Object.assign(t, u.$set); };
ChatThread.find = (f = {}) => query(() => threads.filter((t) => (!f.studentId || t.studentId === f.studentId) && (!f.teacherId || t.teacherId === f.teacherId) && (!f.studentUnread || t.studentUnread > 0) && (!f.teacherUnread || t.teacherUnread > 0)));
ChatSettings.findOne = () => query(() => settings);
ChatSettings.findOneAndUpdate = async (f, u) => { settings = { ...(settings || {}), ...u.$set }; return settings; };
ChatMessage.create = async (d) => { const doc = { ...d, _id: oid(300 + messages.length), createdAt: new Date(), toObject() { return { ...this }; } }; messages.push(doc); return doc; };
ChatMessage.find = (f) => query(() => messages.filter((m) => m.room === f.room));
ChatMessage.findOne = () => query(() => messages.filter((m) => m.room === "community").slice(-1)[0] || null);
ChatMessage.countDocuments = async () => 0;
ChatReadState.find = () => query(() => states);
ChatReadState.findOne = () => query(() => ({ lastReadAt: new Date(0) }));
ChatReadState.updateOne = () => Promise.resolve();
ChatReadState.findOneAndUpdate = async () => {};
ChatReadState.bulkWrite = async () => {};

// ============================================================== rooms
assert.deepEqual(rooms.parseRoom("community"), { type: "community", room: "community" });
assert.deepEqual(rooms.parseRoom(`dm:${S1}:${T1}`), { type: "dm", room: `dm:${S1}:${T1}`, studentId: S1, teacherId: T1 });
assert.equal(rooms.parseRoom("dm:abc:def"), null); assert.equal(rooms.parseRoom("hacker"), null); ok("room ids: community or dm:<student>:<teacher> only");
let a = await rooms.checkRoomAccess(student, rooms.dmRoom(S1, T1)); assert.equal(a.ok, true); ok("a student can open their own chat with a teacher");
a = await rooms.checkRoomAccess(teacher, rooms.dmRoom(S1, T1)); assert.equal(a.ok, true); ok("…and the teacher can open it");
a = await rooms.checkRoomAccess(student2, rooms.dmRoom(S1, T1)); assert.equal(a.status, 403); ok("another student cannot open it");
a = await rooms.checkRoomAccess(teacher2, rooms.dmRoom(S1, T1)); assert.equal(a.status, 403); ok("another teacher cannot read it either (private 1-to-1)");
a = await rooms.checkRoomAccess(student, rooms.dmRoom(S1, S2)); assert.equal(a.status, 403); assert.match(a.message, /only chat privately with teachers/); ok("STUDENT ↔ STUDENT is blocked even with a hand-crafted room id (dm:S1:S2)");
a = await rooms.checkRoomAccess(student2, rooms.dmRoom(S1, S2)); assert.equal(a.status, 403); ok("…from either side");
a = await rooms.checkRoomAccess(student, "dm:zzz:yyy"); assert.equal(a.status, 400);
a = await rooms.checkRoomAccess(student, "community", { forSend: true }); assert.equal(a.status, 403); assert.match(a.message, /Only teachers can post/); ok("default: Community is read-only for students");
settings = { studentsCanPost: true }; a = await rooms.checkRoomAccess(student, "community", { forSend: true }); assert.equal(a.ok, true); settings = null; ok("…unless the admin allows student posts");
a = await rooms.checkRoomAccess(teacher, "community", { forSend: true }); assert.equal(a.ok, true); a = await rooms.checkRoomAccess(student, "community"); assert.equal(a.ok, true); ok("teachers can always post; students can always READ the community");

// ============================================================== sending
sent.length = 0;
let r = res(); await chat.sendMessage(req(student, { body: { room: "community", text: "hi all" } }), r); assert.equal(r.code, 403); ok("student posting in Community → 403 with a helpful message");
r = res(); await chat.sendMessage(req(student, { body: { room: rooms.dmRoom(S1, S2), text: "psst" } }), r); assert.equal(r.code, 403); assert.equal(messages.length, 0); ok("student → student message is rejected and nothing is stored");
r = res(); await chat.sendMessage(req(student, { body: { room: rooms.dmRoom(S1, T1), text: "Sir, doubt in loops" } }), r);
assert.equal(r.code, 201); assert.equal(messages[0].room, `dm:${S1}:${T1}`); assert.equal(messages[0].senderRole, "student"); ok("student → teacher private message saved in their DM room");
let th = threads.find((t) => t.room === `dm:${S1}:${T1}`);
assert.equal(th.teacherUnread, 1); assert.equal(th.studentUnread, 0); assert.equal(th.lastMessagePreview, "Sir, doubt in loops"); assert.equal(th.studentId, S1); assert.equal(th.teacherId, T1); ok("conversation list entry: teacher unread +1, preview saved");
assert.deepEqual(sent.map((m) => m.to), ["t1@x.com"]); assert.ok(sent[0].subject.includes("Asha sent you a message") && sent[0].html.includes(`/admin?tab=chat&amp;room=${encodeURIComponent(`dm:${S1}:${T1}`)}`)); ok("only THAT teacher is e-mailed (not every teacher), with a link that opens the thread");
sent.length = 0; r = res(); await chat.sendMessage(req(teacher, { body: { room: rooms.dmRoom(S1, T1), text: "Check chapter 3" } }), r);
th = threads.find((t) => t.room === `dm:${S1}:${T1}`); assert.equal(th.studentUnread, 1); assert.deepEqual(sent.map((m) => m.to), ["a@x.com"]); assert.ok(sent[0].subject.includes("Mr Sharma (Teacher) sent you a message") && sent[0].html.includes("/studentdash?tab=chat&amp;room=")); ok("teacher → student: student unread +1 and only that student is e-mailed");
sent.length = 0; r = res(); await chat.sendMessage(req(teacher, { body: { room: "community", text: "Holiday tomorrow" } }), r); assert.equal(r.code, 201); assert.equal(messages.at(-1).room, "community"); ok("teacher can still post announcements in Community");
r = res(); await chat.sendMessage(req(teacher2, { body: { room: rooms.dmRoom(S1, T1), text: "intrude" } }), r); assert.equal(r.code, 403); ok("a different teacher cannot write into someone else's private chat");

// ============================================================== listing / read / unread
r = res(); await chat.listMessages(req(student, { query: { room: rooms.dmRoom(S1, T1) } }), r); assert.equal(r.code, 200); assert.equal(r.body.data.length, 2); ok("student reads their private thread (2 messages)");
r = res(); await chat.listMessages(req(student2, { query: { room: rooms.dmRoom(S1, T1) } }), r); assert.equal(r.code, 403); ok("another student cannot read it");
r = res(); await chat.listMessages(req(student, { query: { room: rooms.dmRoom(S1, S2) } }), r); assert.equal(r.code, 403); ok("student cannot open a student↔student room");
r = res(); await chat.markRead(req(student, { body: { room: rooms.dmRoom(S1, T1) } }), r); th = threads.find((t) => t.room === `dm:${S1}:${T1}`); assert.equal(th.studentUnread, 0); assert.equal(th.teacherUnread, 1); ok("opening the chat clears MY unread only");
r = res(); await chat.unreadCount(req(teacher), r); assert.equal(r.body.direct, 1); assert.equal(r.body.unread, r.body.community + 1); ok("sidebar badge = community unread + private unread");

// ============================================================== conversations
r = res(); await chat.listConversations(req(student), r);
assert.equal(r.body.data[0].type, "community"); const peers = r.body.data.slice(1);
assert.deepEqual(peers.map((p) => p.peer.name).sort(), ["Mr Sharma", "Ms Rao"]); assert.ok(peers.every((p) => p.peer.role === "admin")); ok("student's list = Community + ALL teachers - no students at all");
assert.ok(peers.every((p) => !("email" in p.peer))); ok("students never get teachers' e-mail addresses");
assert.equal(peers[0].peer.name, "Mr Sharma"); assert.ok(peers[0].peer.avatar.includes("w_160,h_160,c_fill")); assert.equal(peers[1].peer.avatar, null); ok("threads with activity first; avatars are square thumbnails (null when none)");
assert.equal(r.body.settings.studentsCanPost, false); ok("settings travel with the list (students can't post in Community by default)");
r = res(); await chat.listConversations(req(teacher), r);
assert.deepEqual(r.body.data.slice(1).map((p) => p.peer.name), ["Asha", "Ravi"]); assert.equal(r.body.data[1].unread, 1); assert.ok(r.body.data.slice(1).every((p) => p.peer.role === "student" && p.peer.email)); ok("teacher's list = Community + every student (active chats first), unread counts, e-mails visible");
r = res(); await chat.listMembers(req(student), r); assert.deepEqual(r.body.data.map((m) => m.name).sort(), ["Mr Sharma", "Ms Rao"]); ok("Members panel for students shows only teachers (students cannot see each other)");
r = res(); await chat.listMembers(req(teacher), r); assert.equal(r.body.data.length, 4); ok("…teachers see everyone");

// ============================================================== settings
r = res(); await chat.getSettings(req(student), r); assert.equal(r.body.data.studentsCanPost, false);
r = res(); await chat.updateSettings(req(teacher, { body: { studentsCanPost: "yes" } }), r); assert.equal(r.code, 400);
r = res(); await chat.updateSettings(req(teacher, { body: { studentsCanPost: true } }), r); assert.equal(r.body.data.studentsCanPost, true);
r = res(); await chat.sendMessage(req(student, { body: { room: "community", text: "now allowed" } }), r); assert.equal(r.code, 201); settings = null; ok("admin switch: students may post in Community (off by default)");

// ============================================================== avatars
{
  const doc = { ...users[2], avatar: undefined, async save() { return this; } };
  userModel.findById = (id) => (String(id) === S1 ? doc : query(() => users.find((u) => String(u._id) === String(id)) || null));
  const file = (folder, name = "me", format = "png") => ({ url: `https://res.cloudinary.com/democloud/image/upload/v1/${folder}/${name}.${format}`, publicId: `${folder}/${name}`, format, bytes: 5000, originalName: `${name}.${format}` });
  let rr = res(); await uc.setAvatar({ userId: S1, body: { file: file(`classwave/avatars/${S1}`) } }, rr);
  assert.equal(rr.code, 200); assert.equal(doc.avatar.publicId, `classwave/avatars/${S1}/me`); assert.ok(rr.body.avatarUrl.includes("w_200,h_200,c_fill,g_auto")); ok("profile photo saved (Cloudinary URL) and a 200px thumbnail returned");
  rr = res(); await uc.setAvatar({ userId: S1, body: { file: file(`classwave/avatars/${S2}`) } }, rr); assert.equal(rr.code, 400); ok("cannot save a file from someone else's avatar folder");
  rr = res(); await uc.setAvatar({ userId: S1, body: { file: file(`classwave/avatars/${S1}`, "doc", "pdf") } }, rr); assert.equal(rr.code, 400); ok("PDFs are refused as profile photos (images only)");
  rr = res(); await uc.setAvatar({ userId: S1, body: { file: { ...file(`classwave/avatars/${S1}`), bytes: 6 * 1024 * 1024 } } }, rr); assert.equal(rr.code, 400); ok("5 MB image limit");
  rr = { json(b) { rr.body = b; return rr; } }; await uc.userData({ body: { userId: S1 } }, rr); assert.ok(rr.body.message.avatarUrl.includes("g_auto")); ok("GET /api/user/data now includes avatarUrl");
  rr = res(); await uc.removeAvatar({ userId: S1 }, rr); assert.equal(doc.avatar, undefined); assert.equal(rr.body.avatarUrl, null); ok("profile photo can be removed");
  userModel.findById = (id) => query(() => users.find((u) => String(u._id) === String(id)) || null);
}

// ============================================================== message avatars
{
  threads = []; messages = [];
  const r2 = res(); await chat.sendMessage(req(teacher, { body: { room: rooms.dmRoom(S1, T1), text: "hello" } }), r2);
  assert.ok(r2.body.data.senderAvatar.includes("w_160")); ok("every message carries the sender's avatar thumbnail");
  const r3 = res(); await chat.listMessages(req(student, { query: { room: rooms.dmRoom(S1, T1) } }), r3); assert.ok(r3.body.data[0].senderAvatar.includes("w_160")); ok("…also when loading history");
}

// ============================================================== extra class → private chats
{
  threads = []; messages = []; sent.length = 0;
  userModel.findById = (id) => query(() => users.find((u) => String(u._id) === String(id)) || null);
  const db = []; ExtraClass.create = async (d) => { const doc = { _id: oid(500), ...d, attendance: [], toObject() { return { ...this }; }, async save() { return this; } }; db.push(doc); return doc; };
  classSchedule.find = () => query(() => [{ studentsEnrolled: [S1, S2] }]);
  const good = { type: "extra", title: "Python Basics", date: "2026-11-20", time: "17:30", duration: 1, classLink: "https://meet.test/abc", classScheduleIds: [oid(7)], instructorId: T1 };
  const rr = res(); await ec.createExtraClass(req(teacher, { body: good }), rr);
  assert.equal(rr.code, 201); assert.equal(messages.length, 2); assert.deepEqual(messages.map((m) => m.room).sort(), [`dm:${S1}:${T1}`, `dm:${S2}:${T1}`].sort()); ok("extra class → a card in EACH student's own private chat with the teacher");
  assert.ok(messages.every((m) => m.type === "extra_class" && m.card.joinUrl === "https://meet.test/abc" && m.audience.length === 0 && m.senderRole === "system")); ok("each card has the Join Now link; nothing is posted in the shared Community");
  assert.equal(threads.length, 2); assert.ok(threads.every((t) => t.studentUnread === 1 && t.teacherUnread === 0)); assert.ok(threads[0].lastMessagePreview.includes("Extra class scheduled")); ok("each student gets an unread badge + 'Extra class scheduled' preview; the teacher's own list is not spammed with unread");
  assert.equal(sent.length, 3); assert.ok(sent.some((m) => m.to === "a@x.com" && m.subject.includes("Extra class"))); ok("students still get the e-mail (2 students + teacher)");
  // instructor who is not a teacher → falls back to the creator
  messages.length = 0; threads.length = 0;
  const rr2 = res(); await ec.createExtraClass(req(teacher, { body: { ...good, instructorId: S2 } }), rr2); assert.ok(messages.every((m) => m.room.endsWith(`:${T1}`))); ok("an invalid 'instructor' (a student) falls back to the teacher creating the class");
}
console.log(`\n${n} private-chat / avatar / settings checks passed`);
