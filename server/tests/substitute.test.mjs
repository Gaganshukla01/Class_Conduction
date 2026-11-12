// Run: node tests/substitute.test.mjs   (stubbed models - no MongoDB needed)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test";
process.env.FRONTEND_URL = "https://app.test";

const { default: transporter } = await imp("config/nodeMailer.js");
const { default: userModel } = await imp("model/userModel.js");
const { default: classSchedule } = await imp("model/classesScheduleDetails.js");
const { default: ExtraClass } = await imp("model/extraClassModel.js");
const { ChatMessage, ChatThread, ChatReadState } = await imp("model/chatModel.js");
const ec = await imp("controller/extraClassController.js");
const sched = await imp("controller/classScheduleController.js");
const chat = await imp("controller/chatController.js");

const sent = [];
transporter.sendMail = async (m) => { sent.push(m); return {}; };
const oid = (n) => `64b${String(n).padStart(21, "0")}`;
const T1 = oid(9), T2 = oid(8), A = oid(1), B = oid(2), C = oid(3);
const users = [
  { _id: T1, name: "Mr Sharma", email: "t1@x.com", userType: "admin" },
  { _id: T2, name: "Ms Rao", email: "t2@x.com", userType: "admin" },
  { _id: A, name: "Asha", email: "a@x.com", userType: "student" },
  { _id: B, name: "Ravi", email: "r@x.com", userType: "student" },
  { _id: C, name: "Meera", email: "m@x.com", userType: "student" },
];
function query(get) { const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => get(), then: (a, b) => Promise.resolve(get()).then(a, b) }; return q; }
userModel.find = (f = {}) => query(() => users.filter((u) => (!f._id?.$in || f._id.$in.includes(String(u._id))) && (!f.userType || u.userType === f.userType)));
userModel.findById = (id) => query(() => users.find((u) => String(u._id) === String(id)) || null);
const res = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };

// ---- helpers: dates in the future (UTC midnight, like the app stores them)
const day = (offset) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + offset); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
const iso = (d) => d.toISOString().slice(0, 10);

// ---- in-memory scheduled classes
const mkClass = (id, over = {}) => {
  const c = { _id: oid(id), className: "Python", classDate: day(5), classTime: "10:00", classDuration: "1", classLink: "https://meet.test/old", instructorId: T1, studentsEnrolled: [A, B], attendance: "Absent", reminderSentAt: new Date(), ...over };
  c.toObject = () => ({ ...c }); c.save = async () => c; return c;
};
let classes = [];
classSchedule.find = (f = {}) => query(() => classes.filter((c) =>
  (!f.studentsEnrolled?.$all || f.studentsEnrolled.$all.every((s) => c.studentsEnrolled.includes(s))) &&
  (!f.classDate?.$gte || c.classDate >= f.classDate.$gte) &&
  (!("substitution.extraClassId" in f) || !c.substitution?.extraClassId) &&
  (!f._id?.$in || f._id.$in.includes(String(c._id)))));
classSchedule.findById = (id) => { const c = classes.find((x) => String(x._id) === String(id)); const q = query(() => c || null); return q; };

// ---- in-memory extra classes + chat
let extras = [];
ExtraClass.create = async (d) => { const doc = { _id: oid(500 + extras.length), status: "scheduled", ...d, attendance: [], toObject() { return { ...this }; }, async save() { return this; }, async deleteOne() { extras = extras.filter((x) => x !== this); } }; extras.push(doc); return doc; };
ExtraClass.findById = async (id) => extras.find((x) => String(x._id) === String(id)) || null;
ExtraClass.find = () => query(() => extras);
ExtraClass.updateOne = async (f, u) => { const e = extras.find((x) => String(x._id) === String(f._id) && (!f.status || x.status === f.status)); if (e) Object.assign(e, u); };
let messages = []; let threads = [];
ChatMessage.create = async (d) => { const doc = { ...d, _id: oid(700 + messages.length), createdAt: new Date(), toObject() { return { ...this }; } }; messages.push(doc); return doc; };
ChatThread.findOneAndUpdate = async (f, u) => { let t = threads.find((x) => x.room === f.room); if (!t) { t = { room: f.room, studentUnread: 0, teacherUnread: 0 }; threads.push(t); } Object.assign(t, u.$set); return t; };
ChatThread.updateOne = async (f, u) => { const t = threads.find((x) => x.room === f.room); if (t) Object.assign(t, u.$set); };
ChatReadState.find = () => query(() => []); ChatReadState.updateOne = () => Promise.resolve(); ChatReadState.bulkWrite = async () => {};
ChatMessage.countDocuments = async () => 0;

const req = (u, extra = {}) => ({ userId: String(u._id), user: u, body: {}, query: {}, params: {}, ...extra });
const teacher = users[0];
const newSub = (over = {}) => ({ type: "substitute", date: iso(day(6)), time: "17:30", duration: 1.5, classLink: "https://meet.test/new", note: "Bring your laptop", ...over });
const reset = () => { classes = [mkClass(1), mkClass(2, { classDate: day(12), classTime: "11:00" })]; extras = []; messages = []; threads = []; sent.length = 0; };

// ====================================================== which class can be replaced?
reset();
classes.push(mkClass(3, { studentsEnrolled: [C] }), mkClass(4, { classDate: day(-3) }), mkClass(5, { substitution: { extraClassId: "x" } }), mkClass(6, { classDate: day(8), attendanceMarkedAt: new Date() }));
let r = res(); await ec.replaceableClasses(req(teacher, { query: { studentIds: `${A}` } }), r);
assert.deepEqual(r.body.data.map((c) => String(c._id)), [oid(1), oid(2)]); ok("lists the selected student's UPCOMING scheduled classes (not past, not already replaced, not attendance-marked, not other students' classes)");
assert.equal(r.body.data[0].students.length, 2); assert.equal(r.body.data[0].students[0].name, "Asha"); ok("each class says who is in it (so the admin sees who else is affected)");
r = res(); await ec.replaceableClasses(req(teacher, { query: { studentIds: `${A},${B}` } }), r); assert.equal(r.body.data.length, 2);
r = res(); await ec.replaceableClasses(req(teacher, { query: { studentIds: `${A},${C}` } }), r); assert.equal(r.body.data.length, 0); ok("several students → only classes ALL of them share");
r = res(); await ec.replaceableClasses(req(teacher, { query: {} }), r); assert.deepEqual(r.body.data, []);

// ====================================================== validations
reset();
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ studentIds: [A] }) }), r); assert.equal(r.code, 400); assert.match(r.body.message, /Choose which scheduled class/); ok("substitute without a class to replace → 400");
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(99), studentIds: [A] }) }), r); assert.equal(r.code, 404);
classes[0].substitution = { extraClassId: "other" };
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A] }) }), r); assert.equal(r.code, 400); assert.match(r.body.message, /already been replaced/); ok("a class can only be replaced once");
reset(); classes[0].attendanceMarkedAt = new Date();
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A] }) }), r); assert.equal(r.code, 400); assert.match(r.body.message, /Attendance is already marked/); ok("a class whose attendance is marked cannot be replaced");
reset(); classes[0].classDate = day(-2);
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A] }) }), r); assert.equal(r.code, 400); assert.match(r.body.message, /Only upcoming/); ok("only upcoming classes can be replaced");
reset();
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [C] }) }), r); assert.equal(r.code, 400); assert.match(r.body.message, /not part of that scheduled class/); ok("a student who is not in that scheduled class → 400");
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A], date: "bad" }) }), r); assert.equal(r.code, 400); assert.equal(extras.length, 0); assert.equal(classes[0].substitution, undefined); ok("a bad date leaves the scheduled class untouched");

// ====================================================== the happy path
reset();
const original = { classDate: classes[0].classDate, classTime: "10:00", classLink: "https://meet.test/old" };
r = res(); await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A] }) }), r);
assert.equal(r.code, 201); const extra = extras[0]; const cls = classes[0];
assert.equal(extra.title, "Python"); assert.equal(extra.type, "substitute"); assert.equal(extra.replacesClassId, oid(1)); ok("substitute created; the class name defaults to the replaced class");
assert.equal(iso(cls.classDate), iso(day(6))); assert.equal(cls.classTime, "17:30"); assert.equal(cls.classLink, "https://meet.test/new"); assert.equal(cls.classDuration, "1.5"); ok("THE SCHEDULED CLASS IS UPDATED with the new date, time, link and duration");
assert.equal(cls.substitution.extraClassId, String(extra._id)); assert.equal(cls.substitution.originalTime, "10:00"); assert.equal(cls.substitution.originalLink, "https://meet.test/old"); assert.equal(iso(cls.substitution.originalDate), iso(original.classDate)); ok("the original date/time/link are remembered (so it can be undone)");
assert.equal(cls.reminderSentAt, undefined); ok("the 24-hour reminder is re-armed for the NEW time");
assert.equal(classes[1].classTime, "11:00"); ok("other sessions of the course are not touched");
assert.deepEqual(extra.studentsEnrolled.sort(), [A, B]); ok("everyone enrolled in that session is notified - including Ravi, who was not picked");
assert.equal(messages.length, 2); assert.deepEqual(messages.map((m) => m.room).sort(), [`dm:${A}:${T1}`, `dm:${B}:${T1}`].sort()); ok("a chat card lands in EACH student's private chat with the teacher");
const card = messages[0].card; assert.equal(card.classType, "substitute"); assert.equal(card.joinUrl, "https://meet.test/new"); assert.equal(card.replaces.className, "Python"); assert.equal(card.replaces.classTime, "10:00"); assert.equal(iso(new Date(card.replaces.classDate)), iso(original.classDate)); ok("the card says WHICH class it replaces (original date + time) and has the new Join link");
assert.equal(sent.length, 3); const mail = sent.find((m) => m.to === "a@x.com"); assert.ok(mail.html.includes("has been <strong>replaced</strong>") && mail.html.includes("Replaces your class") && mail.html.includes("10:00 AM") && mail.html.includes("Join now")); ok("e-mail: 'your class … has been replaced', shows the original slot and the new Join button");

// ====================================================== attendance
r = res(); await ec.markExtraAttendance(req(teacher, { params: { id: String(extra._id) }, body: { records: [{ studentId: A, status: "Present" }] } }), r);
assert.equal(r.code, 400); assert.match(r.body.message, /scheduled class/); ok("substitute attendance is NOT kept separately - it is marked on the scheduled class");
const ok2 = res(); const prevUpdate = classSchedule.findByIdAndUpdate;
classSchedule.findByIdAndUpdate = async (id, upd) => { Object.assign(cls, upd); return cls; };
classSchedule.findById = (id) => { const c = classes.find((x) => String(x._id) === String(id)); const q = query(() => c || null); q.then = (a, b) => Promise.resolve(c).then(a, b); return q; };
await sched.markAttendance(req(teacher, { body: { id: oid(1), attendance: "Present", topicCovered: "Loops" } }), ok2);
assert.equal(ok2.code, 200); assert.equal(cls.attendance, "Present"); await new Promise((r2) => setTimeout(r2, 10)); assert.equal(extra.status, "completed"); ok("marking the scheduled class present also completes the substitute record");
classSchedule.findByIdAndUpdate = prevUpdate;

// ---- after attendance is marked the substitute is locked
cls.attendanceMarkedAt = new Date();
r = res(); await ec.updateExtraClass(req(teacher, { params: { id: String(extra._id) }, body: { status: "cancelled" } }), r); assert.equal(r.code, 400); assert.match(r.body.message, /Attendance is already marked/); ok("cancel is blocked once attendance is marked");
r = res(); await ec.updateExtraClass(req(teacher, { params: { id: String(extra._id) }, body: { time: "19:00" } }), r); assert.equal(r.code, 400); ok("…and so is rescheduling");

// ====================================================== student view
ExtraClass.find = () => query(() => extras.map((e) => ({ ...e })));
r = res(); await ec.myExtraClasses(req(users[2]), r); const mine = r.body.data[0];
assert.equal(mine.replaces.classTime, "10:00"); assert.equal(mine.myAttendance, "Present"); ok("student sees what was replaced and their attendance (taken from the scheduled class)");

// ====================================================== reschedule / cancel / delete
reset(); messages = []; extras = [];
await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A] }) }), res());
const e2 = extras[0]; messages = []; sent.length = 0;
r = res(); await ec.updateExtraClass(req(teacher, { params: { id: String(e2._id) }, body: { time: "19:00", date: iso(day(7)) } }), r);
assert.equal(r.code, 200); assert.equal(classes[0].classTime, "19:00"); assert.equal(iso(classes[0].classDate), iso(day(7))); assert.ok(classes[0].substitution.extraClassId); ok("rescheduling the substitute moves the scheduled class too");
assert.equal(messages.length, 2); assert.equal(messages[0].card.updated, true); assert.equal(messages[0].card.replaces.classTime, "10:00"); ok("students get an 'updated' card that still says which class it replaces");

messages = []; sent.length = 0;
r = res(); await ec.updateExtraClass(req(teacher, { params: { id: String(e2._id) }, body: { status: "cancelled" } }), r);
assert.equal(r.code, 200); assert.equal(classes[0].classTime, "10:00"); assert.equal(classes[0].classLink, "https://meet.test/old"); assert.equal(iso(classes[0].classDate), iso(day(5))); assert.equal(classes[0].classDuration, "1"); assert.equal(classes[0].substitution, undefined); ok("CANCELLING restores the scheduled class to its ORIGINAL date, time, link and duration");
assert.equal(messages.length, 2); assert.ok(messages[0].text.includes("stays as originally scheduled")); assert.ok(messages[0].card.restored); ok("students are told in chat that their regular class is back");
assert.ok(sent.find((m) => m.to === "a@x.com").html.includes("is back as originally scheduled")); ok("…and by e-mail");

reset(); extras = [];
await ec.createExtraClass(req(teacher, { body: newSub({ replacesClassId: oid(1), studentIds: [A] }) }), res());
r = res(); await ec.deleteExtraClass(req(teacher, { params: { id: String(extras[0]._id) } }), r);
assert.equal(r.code, 200); assert.equal(extras.length, 0); assert.equal(classes[0].classTime, "10:00"); assert.equal(classes[0].substitution, undefined); ok("deleting a substitute that has not happened yet also restores the scheduled class");

// the extra (non-substitute) flow is unchanged
reset(); extras = [];
r = res(); await ec.createExtraClass(req(teacher, { body: { type: "extra", title: "Doubt session", date: iso(day(4)), time: "18:00", duration: 1, classLink: "https://meet.test/x", studentIds: [A, C] } }), r);
assert.equal(r.code, 201); assert.equal(classes[0].classTime, "10:00"); assert.equal(extras[0].replacesClassId, undefined); assert.deepEqual(extras[0].studentsEnrolled.sort(), [A, C]); ok("a normal EXTRA class still works as before and never touches the scheduled classes");

// ====================================================== chat: deleting a message keeps the list correct
{
  messages = []; threads = [];
  const room = `dm:${A}:${T1}`;
  let uid = 800; const mk = (text, mins, who) => ({ _id: oid(uid++), room, senderId: who, senderName: "x", senderRole: "student", type: "text", text, createdAt: new Date(Date.now() - mins * 60000), audience: [], deleteOne: async function () { messages = messages.filter((m) => m !== this); } });
  messages.push(mk("first", 10, A), mk("second", 5, A));
  threads.push({ room, lastMessagePreview: "second", lastSenderId: A, studentUnread: 0, teacherUnread: 1 });
  ChatMessage.findById = async (id) => messages.find((m) => String(m._id) === String(id)) || null;
  ChatMessage.findOne = () => query(() => [...messages].sort((a, b) => b.createdAt - a.createdAt)[0] || null);
  let rr = res(); await chat.deleteMessage(req(users[2], { params: { id: messages[1]._id } }), rr);
  assert.equal(rr.code, 200); assert.equal(threads[0].lastMessagePreview, "first"); ok("deleting the newest message in a private chat updates the conversation preview to the one before");
  rr = res(); await chat.deleteMessage(req(users[2], { params: { id: messages[0]._id } }), rr); assert.equal(threads[0].lastMessagePreview, ""); ok("deleting the last remaining message clears the preview");
  messages.push(mk("mine", 1, B)); messages[0].senderId = B;
  rr = res(); await chat.deleteMessage(req(users[2], { params: { id: messages[0]._id } }), rr); assert.equal(rr.code, 403); ok("a student cannot delete someone else's message");
  rr = res(); await chat.deleteMessage(req(users[1], { params: { id: messages[0]._id } }), rr); assert.equal(rr.code, 403); ok("…and a teacher cannot delete in a private chat that is not theirs");
}
console.log(`\n${n} substitute-class checks passed`);
