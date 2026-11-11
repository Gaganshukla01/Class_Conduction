// Run:  node tests/newfeatures.test.mjs     (uses stubbed models - no MongoDB needed)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test";
process.env.CLOUDINARY_CLOUD_NAME = "democloud"; process.env.CLOUDINARY_API_KEY = "k"; process.env.CLOUDINARY_API_SECRET = "s";

const { default: transporter } = await imp("config/nodeMailer.js");
const { default: userModel } = await imp("model/userModel.js");
const { default: classSchedule } = await imp("model/classesScheduleDetails.js");
const { ChatMessage, ChatReadState } = await imp("model/chatModel.js");
const { QuestionFolder } = await imp("model/questionFolderModel.js");
const { CodeQuestion, QuestionAssignment } = await imp("model/codeQuestionModel.js");
const { default: ExtraClass } = await imp("model/extraClassModel.js");
const chat = await imp("controller/chatController.js");
const folders = await imp("controller/questionFolderController.js");
const qc = await imp("controller/questionController.js");
const ec = await imp("controller/extraClassController.js");

const sent = [];
transporter.sendMail = async (m) => { sent.push(m); return {}; };
const oid = (n) => `64b${String(n).padStart(21, "0")}`;
const A = oid(1), B = oid(2), ADMIN = oid(9);
const users = {
  [A]: { _id: A, name: "Asha", email: "a@x.com", userType: "student" },
  [B]: { _id: B, name: "Ravi", email: "r@x.com", userType: "student" },
  [ADMIN]: { _id: ADMIN, name: "Teacher", email: "t@x.com", userType: "admin" },
};
userModel.find = (q) => query(() => (q._id?.$in || Object.keys(users)).map((i) => users[i]).filter(Boolean).filter((u) => !q.userType || u.userType === q.userType));
userModel.findById = (id) => query(() => users[id]);

// chainable query stub: .select/.sort/.limit/.lean all return itself; awaiting returns the value
function query(get) {
  const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => get(), then: (res, rej) => Promise.resolve(get()).then(res, rej) };
  return q;
}
const res = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };
const imgFile = (folder, name = "a", format = "png") => ({ url: `https://res.cloudinary.com/democloud/image/upload/v1/${folder}/${name}.${format}`, publicId: `${folder}/${name}`, format, bytes: 1000, originalName: `${name}.${format}` });

// =================================================================== CHAT
{
  assert.deepEqual(chat.visibleTo({ userType: "admin" }), { room: "community" });
  const f = chat.visibleTo({ userType: "student", _id: A });
  assert.deepEqual(f.$or, [{ audience: { $size: 0 } }, { audience: A }]); ok("chat visibility: admins see all, students see public + messages targeted at them");

  // sending a chat message also runs the e-mail notifier, which reads these models
  ChatReadState.find = () => query(() => []);
  ChatReadState.bulkWrite = async () => {};
  ChatReadState.updateOne = () => Promise.resolve();
  ChatMessage.countDocuments = async () => 0;
  const store = [];
  ChatMessage.create = async (d) => { const doc = { ...d, _id: oid(100 + store.length), createdAt: new Date(), toObject() { return { ...this }; } }; store.push(doc); return doc; };
  const student = { _id: A, name: "Asha", userType: "student" };
  let r = res(); await chat.sendMessage({ userId: A, user: student, body: { text: "  " } }, r); assert.equal(r.code, 400); ok("empty message rejected");
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { text: "x".repeat(4001) } }, r); assert.equal(r.code, 400); ok("4000-char limit");
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { text: "Hello everyone" } }, r);
  assert.equal(r.code, 201); assert.equal(store[0].senderRole, "student"); assert.equal(store[0].senderName, "Asha"); assert.deepEqual(store[0].audience, []); ok("text message saved with sender name/role, public audience");
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { file: imgFile("classwave/chat", "pic") } }, r);
  assert.equal(r.code, 201); assert.equal(store[1].type, "file"); assert.equal(store[1].file.kind, "image"); assert.ok(r.body.data.file.thumbUrl.includes("w_900")); ok("image share: kind=image + thumbnail URL");
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { file: imgFile("classwave/chat", "notes", "pdf"), text: "Class 3 notes" } }, r);
  assert.equal(store[2].file.kind, "pdf"); assert.ok(r.body.data.file.downloadUrl.includes("fl_attachment")); ok("PDF share: kind=pdf + download URL with fl_attachment");
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { file: imgFile("classwave/chat", "x", "exe") } }, r); assert.equal(r.code, 400);
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { file: { ...imgFile("classwave/chat"), url: "https://evil.com/a.png" } } }, r); assert.equal(r.code, 400);
  r = res(); await chat.sendMessage({ userId: A, user: student, body: { file: imgFile("classwave/homework/" + A) } }, r); assert.equal(r.code, 400); ok("rejects .exe, foreign URLs and files from other folders");
  const id = oid(55); let last;
  for (let i = 0; i < 25; i++) { last = res(); await chat.sendMessage({ userId: id, user: { ...student, _id: id }, body: { text: "spam " + i } }, last); }
  assert.equal(last.code, 429); ok("rate limit: 20 messages/minute per user");

  // list + pagination + polling filter
  let seen;
  ChatMessage.find = (f) => { seen = f; const rows = Array.from({ length: 41 }, (_, i) => ({ _id: oid(200 + i), text: "m" + i, createdAt: new Date(2026, 0, 1, 0, 41 - i) })); return query(() => rows); };
  r = res(); await chat.listMessages({ query: {}, user: student }, r);
  assert.equal(r.body.data.length, 40); assert.equal(r.body.hasMore, true); assert.ok(seen.$or); assert.ok(new Date(r.body.data[0].createdAt) < new Date(r.body.data[39].createdAt)); ok("history: newest page, oldest-first order, hasMore flag, student visibility filter applied");
  r = res(); await chat.listMessages({ query: { after: "2026-01-01T00:00:00Z" }, user: student }, r); assert.ok(seen.createdAt.$gt instanceof Date); ok("polling: ?after= returns newer messages only");
  r = res(); await chat.listMessages({ query: { before: "nope" }, user: student }, r); assert.equal(r.code, 400);

  // delete permissions
  const mine = { senderId: A, audience: [], deleteOne: async () => {}, file: null };
  ChatMessage.findById = async () => mine;
  r = res(); await chat.deleteMessage({ params: { id: oid(1) }, userId: B, user: { userType: "student" } }, r); assert.equal(r.code, 403);
  r = res(); await chat.deleteMessage({ params: { id: oid(1) }, userId: A, user: { userType: "student" } }, r); assert.equal(r.code, 200);
  r = res(); await chat.deleteMessage({ params: { id: oid(1) }, userId: ADMIN, user: { userType: "admin" } }, r); assert.equal(r.code, 200); ok("delete: own message or admin only");

  // unread
  const states = [];
  ChatReadState.findOne = () => query(() => states[0] || null);
  ChatReadState.create = async (d) => { states.push({ ...d, lastReadAt: new Date() }); };
  r = res(); await chat.unreadCount({ userId: A, user: student }, r); assert.equal(r.body.unread, 0); assert.equal(states.length, 1); ok("first visit: unread starts at 0 (history is not flagged)");
  let cf; ChatMessage.countDocuments = async (f) => { cf = f; return 3; };
  r = res(); await chat.unreadCount({ userId: A, user: student }, r); assert.equal(r.body.unread, 3); assert.deepEqual(cf.senderId, { $ne: A }); assert.ok(cf.$or); ok("unread count: only visible messages from others after last read");
}

// ================================================================ FOLDERS
{
  const db = [];
  let nextId = 1000;
  const mk = (d) => ({ _id: oid(nextId++), ...d, toObject() { return { ...this }; }, async save() { return this; }, async deleteOne() { db.splice(db.indexOf(this), 1); } });
  QuestionFolder.create = async (d) => { const f = mk(d); db.push(f); return f; };
  QuestionFolder.findById = (id) => query(() => db.find((f) => String(f._id) === String(id)) || null);
  QuestionFolder.find = (f = {}) => query(() => db.filter((x) => !("parentId" in f) || String(x.parentId ?? null) === String(f.parentId ?? null)).filter((x) => !f._id || (f._id.$ne ? String(x._id) !== String(f._id.$ne) : true)));
  QuestionFolder.countDocuments = async (f) => db.filter((x) => String(x.parentId) === String(f.parentId)).length;
  CodeQuestion.countDocuments = async () => 0;

  let r = res(); await folders.createFolder({ userId: ADMIN, body: { name: "Python WebDev" } }, r);
  const cat = r.body.data; assert.equal(r.code, 201); assert.equal(cat.level, 1); assert.equal(cat.parentId, null); ok("category (level 1) created");
  r = res(); await folders.createFolder({ userId: ADMIN, body: { name: "Session 01", parentId: String(cat._id) } }, r);
  const ses = r.body.data; assert.equal(ses.level, 2); assert.equal(String(ses.parentId), String(cat._id)); ok("session (level 2) created inside a category");
  r = res(); await folders.createFolder({ userId: ADMIN, body: { name: "Too deep", parentId: String(ses._id) } }, r); assert.equal(r.code, 400); ok("a 4th level is refused (exactly 3 tiers)");
  r = res(); await folders.createFolder({ userId: ADMIN, body: { name: " python webdev " } }, r); assert.equal(r.code, 409); ok("duplicate name in the same place → 409 (case-insensitive)");
  r = res(); await folders.createFolder({ userId: ADMIN, body: { name: "" } }, r); assert.equal(r.code, 400);
  QuestionFolder.countDocuments = async (f) => (String(f.parentId) === String(cat._id) ? 1 : 0);
  r = res(); await folders.deleteFolder({ params: { id: String(cat._id) } }, r); assert.equal(r.code, 409); assert.match(r.body.message, /session/); ok("category with sessions cannot be deleted");
  QuestionFolder.countDocuments = async () => 0; CodeQuestion.countDocuments = async (f) => (String(f.folderId) === String(ses._id) ? 4 : 0);
  r = res(); await folders.deleteFolder({ params: { id: String(ses._id) } }, r); assert.equal(r.code, 409); assert.match(r.body.message, /4 question/); ok("session with questions cannot be deleted (no accidental loss)");
  CodeQuestion.countDocuments = async () => 0;
  r = res(); await folders.deleteFolder({ params: { id: String(ses._id) } }, r); assert.equal(r.code, 200); ok("empty folder deletes fine");

  // ------------------------------------------------ question <-> folder + bulk
  const cat2 = (await (async () => { const rr = res(); await folders.createFolder({ userId: ADMIN, body: { name: "Python 01" } }, rr); return rr.body.data; })());
  const s1 = (await (async () => { const rr = res(); await folders.createFolder({ userId: ADMIN, body: { name: "Session 01", parentId: String(cat2._id) } }, rr); return rr.body.data; })());
  const s2 = (await (async () => { const rr = res(); await folders.createFolder({ userId: ADMIN, body: { name: "Session 02", parentId: String(cat2._id) } }, rr); return rr.body.data; })());

  let created; CodeQuestion.create = async (d) => { created = d; return { ...d, _id: "q", toObject() { return { ...d, _id: "q" }; } }; };
  const base = { title: "Sum", description: "d", language: "python" };
  r = res(); await qc.createQuestion({ userId: ADMIN, body: { ...base, folderId: String(cat2._id) } }, r); assert.equal(r.code, 400); assert.match(r.body.message, /session/); ok("a question cannot be put directly in a category");
  r = res(); await qc.createQuestion({ userId: ADMIN, body: { ...base, folderId: String(s1._id) } }, r); assert.equal(r.code, 201); assert.equal(String(created.folderId), String(s1._id)); ok("question saved inside a session folder");
  r = res(); await qc.createQuestion({ userId: ADMIN, body: { ...base } }, r); assert.equal(created.folderId, null); ok("no folder = Unfiled");

  // bulk assign
  const questionsInSession = { [String(s1._id)]: [oid(301), oid(302)], [String(s2._id)]: [oid(303)] };
  CodeQuestion.find = (f) => query(() => {
    if (f.folderId?.$in) return f.folderId.$in.flatMap((id) => (questionsInSession[String(id)] || []).map((q) => ({ _id: q })));
    return (f._id.$in || []).map((id) => ({ _id: id, title: "Q" + id.slice(-3), language: "python", difficulty: "easy", createdBy: ADMIN }));
  });
  classSchedule.find = () => query(() => [{ studentsEnrolled: [A, B] }]);
  const existing = [{ questionId: oid(301), studentId: A }];
  QuestionAssignment.find = () => query(() => existing);
  let inserted = []; QuestionAssignment.insertMany = async (rows) => { inserted = rows; return rows; };
  sent.length = 0;
  r = res(); await qc.assignBulk({ userId: ADMIN, body: { folderIds: [String(cat2._id)], classScheduleIds: [oid(7)] } }, r);
  assert.equal(r.code, 200); assert.equal(r.body.questions, 3); assert.equal(r.body.students, 2);
  assert.equal(inserted.length, 5); assert.equal(r.body.skipped, 1); ok("assigning a whole CATEGORY to a whole CLASS: 3 questions x 2 students = 6, 1 already assigned → 5 created");
  assert.equal(sent.length, 2); assert.ok(sent.every((m) => m.subject.includes("new coding question"))); assert.ok(sent.find((m) => m.to === "a@x.com").subject.startsWith("💻 2")); ok("one digest email per student (not one per question): Asha gets 2, Ravi gets 3");
  inserted = []; r = res(); await qc.assignBulk({ userId: ADMIN, body: { questionIds: [oid(301)], studentIds: [A] } }, r); assert.equal(inserted.length, 0); assert.equal(r.body.created, 0); ok("re-assigning does nothing and says so");
  r = res(); await qc.assignBulk({ userId: ADMIN, body: { questionIds: [oid(301)] } }, r); assert.equal(r.code, 400);
  r = res(); await qc.assignBulk({ userId: ADMIN, body: { studentIds: [A] } }, r); assert.equal(r.code, 400);
  r = res(); await qc.assignBulk({ userId: ADMIN, body: { questionIds: [oid(301)], studentIds: [A], dueDate: "nope" } }, r); assert.equal(r.code, 400); ok("validation: needs questions + students, valid due date");
  r = res(); await qc.assignBulk({ userId: ADMIN, body: { folderIds: [String(s2._id)], studentIds: [ADMIN] } }, r); assert.equal(r.code, 400); ok("admins in the selection are ignored (students only)");

  // review queue
  QuestionAssignment.find = () => query(() => [{ _id: "a1", questionId: oid(301), studentId: A, status: "submitted", submissions: [{ submittedAt: new Date(), outputMatches: true }], updatedAt: new Date() }]);
  QuestionAssignment.aggregate = async () => [{ _id: "submitted", n: 4 }, { _id: "accepted", n: 9 }];
  CodeQuestion.find = (f) => query(() => (f.folderId ? [{ _id: oid(301) }] : [{ _id: oid(301), title: "Sum", language: "python", difficulty: "easy", folderId: s1._id }]));
  QuestionFolder.find = () => query(() => db);
  r = res(); await qc.reviewQueue({ query: {} }, r);
  assert.equal(r.body.data[0].question.path, "Python 01 / Session 01"); assert.equal(r.body.data[0].student.name, "Asha"); assert.equal(r.body.counts.submitted, 4); ok("review queue: shows 'Category / Session' path, student, attempts and status counts");

  // review with score
  const asg = { status: "submitted", submissions: [{}], async save() { return this; }, toObject() { return { ...this }; }, questionId: "q" };
  QuestionAssignment.findById = async () => asg; CodeQuestion.findById = () => query(() => ({ title: "Sum" }));
  r = res(); await qc.reviewSubmission({ params: { aid: "x" }, body: { status: "accepted", score: 101 } }, r); assert.equal(r.code, 400);
  r = res(); await qc.reviewSubmission({ params: { aid: "x" }, body: { status: "accepted", score: 85.4, feedback: "Great" } }, r); assert.equal(asg.score, 85); assert.equal(asg.status, "accepted"); ok("approve with an optional 0-100 score");
}

// ============================================================ EXTRA CLASS
{
  const db = [];
  ExtraClass.create = async (d) => { const doc = { _id: oid(500 + db.length), ...d, attendance: [], toObject() { return { ...this }; }, async save() { return this; } }; db.push(doc); return doc; };
  const msgs = []; ChatMessage.create = async (d) => { const doc = { ...d, _id: oid(700 + msgs.length), toObject() { return { ...this }; } }; msgs.push(doc); return doc; };
  classSchedule.find = () => query(() => [{ studentsEnrolled: [A, B] }]);
  const good = { type: "substitute", title: "Python Basics", date: "2026-11-20", time: "17:30", duration: 1.5, classLink: "https://meet.test/abc", substituteFor: "Mr. Sharma", note: "Bring laptop", classScheduleIds: [oid(7)] };

  for (const [patch, why] of [[{ title: "" }, "title"], [{ date: "20-11-2026" }, "date"], [{ time: "25:00" }, "time"], [{ classLink: "meet.test" }, "link"], [{ duration: 0 }, "duration"], [{ classScheduleIds: [] }, "no students"]]) {
    const r = res(); await ec.createExtraClass({ userId: ADMIN, body: { ...good, ...patch } }, r); assert.equal(r.code, 400, why);
  } ok("create validation: title, date, time, link, duration and at least one student");

  sent.length = 0; let r = res(); await ec.createExtraClass({ userId: ADMIN, body: good }, r);
  assert.equal(r.code, 201); assert.deepEqual(db[0].studentsEnrolled, [A, B]); assert.equal(db[0].classTime, "17:30"); ok("substitute class created for a whole class (students resolved from the class)");
  const m = msgs[0]; assert.equal(m.type, "extra_class"); assert.equal(m.senderRole, "system"); assert.deepEqual(m.audience, [A, B]);
  assert.equal(m.card.kind, "extra_class"); assert.equal(m.card.joinUrl, "https://meet.test/abc"); assert.equal(m.card.classType, "substitute"); assert.equal(m.card.substituteFor, "Mr. Sharma"); assert.equal(m.card.instructorName, "Teacher"); ok("rich chat card pushed to the targeted students only, containing the Join link");
  assert.equal(db[0].chatMessageId, m._id); assert.equal(sent.length, 3); assert.ok(sent[0].html.includes("Join now") && sent[0].subject.includes("Substitute class")); ok("email sent as well (2 students + instructor) with a Join now button");

  // attendance
  r = res(); await ec.markExtraAttendance({ params: { id: "x" }, body: { records: [{ studentId: oid(8), status: "Present" }] } }, r); // not found path below
  ExtraClass.findById = async () => db[0];
  r = res(); await ec.markExtraAttendance({ params: { id: "x" }, body: { records: [{ studentId: oid(8), status: "Present" }] } }, r); assert.equal(r.code, 400); ok("attendance: a student who is not in the class is rejected");
  r = res(); await ec.markExtraAttendance({ params: { id: "x" }, body: { records: [{ studentId: A, status: "Maybe" }] } }, r); assert.equal(r.code, 400);
  r = res(); await ec.markExtraAttendance({ params: { id: "x" }, body: { records: [{ studentId: A, status: "Present" }, { studentId: B, status: "Absent" }] } }, r);
  assert.equal(r.code, 200); assert.equal(db[0].status, "completed"); assert.deepEqual(db[0].attendance, [{ studentId: A, status: "Present" }, { studentId: B, status: "Absent" }]); assert.match(r.body.message, /1 present, 1 absent/); ok("attendance saved per student; class marked completed");
  r = res(); await ec.markExtraAttendance({ params: { id: "x" }, body: { records: [{ studentId: B, status: "Present" }] } }, r);
  assert.equal(db[0].attendance.find((a) => a.studentId === B).status, "Present"); assert.equal(db[0].attendance.length, 2); ok("attendance can be corrected later (updates, does not duplicate)");

  // student view + cancel
  ExtraClass.find = () => query(() => [{ ...db[0], attendance: db[0].attendance }]);
  r = res(); await ec.myExtraClasses({ userId: A }, r); assert.equal(r.body.data[0].myAttendance, "Present"); assert.ok(r.body.data[0].classLink); ok("student sees their own attendance + join link");
  db[0].status = "scheduled"; msgs.length = 0; sent.length = 0;
  r = res(); await ec.updateExtraClass({ params: { id: "x" }, body: { status: "cancelled" } }, r);
  assert.equal(db[0].status, "cancelled"); assert.equal(msgs[0].type, "system"); assert.ok(msgs[0].text.includes("cancelled")); assert.ok(sent[0].subject.includes("Cancelled")); ok("cancelling posts a chat notice and emails everyone");
  ExtraClass.find = () => query(() => [{ ...db[0] }]);
  r = res(); await ec.myExtraClasses({ userId: A }, r); assert.equal(r.body.data[0].classLink, ""); ok("cancelled class no longer exposes the Join link to students");
  db[0].status = "scheduled"; msgs.length = 0;
  r = res(); await ec.updateExtraClass({ params: { id: "x" }, body: { time: "18:00" } }, r);
  assert.equal(r.code, 200); assert.equal(db[0].classTime, "18:00"); assert.equal(msgs[0].card.updated, true); ok("rescheduling re-posts an 'updated' card");
}
console.log(`\n${n} new-feature checks passed`);
