// Run: node tests/chatmail.test.mjs   (stubbed models - no MongoDB needed)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test";
process.env.FRONTEND_URL = "https://app.test";

const { default: transporter } = await imp("config/nodeMailer.js");
const { default: userModel } = await imp("model/userModel.js");
const { default: legacy } = await imp("model/CommonEditor.js");
const { ChatMessage, ChatReadState } = await imp("model/chatModel.js");
const svc = await imp("services/notificationService.js");
const chat = await imp("controller/chatController.js");
const { migrateChat } = await imp("services/chatMigration.js");

const sent = [];
transporter.sendMail = async (m) => { sent.push(m); return {}; };
const oid = (n) => `64b${String(n).padStart(21, "0")}`;
const T1 = oid(9), T2 = oid(8), S1 = oid(1), S2 = oid(2), S3 = oid(3);
const users = [
  { _id: T1, name: "Mr Sharma", email: "t1@x.com", userType: "admin" },
  { _id: T2, name: "Ms Rao", email: "t2@x.com", userType: "admin" },
  { _id: S1, name: "Asha", email: "a@x.com", userType: "student" },
  { _id: S2, name: "Ravi", email: "r@x.com", userType: "student" },
  { _id: S3, name: "Meera", email: "m@x.com", userType: "student" },
];
function query(get) { const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => get(), then: (a, b) => Promise.resolve(get()).then(a, b) }; return q; }
userModel.find = (f = {}) => query(() => users.filter((u) => !f.userType || u.userType === f.userType));
const res = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };
const minutesAgo = (m) => new Date(Date.now() - m * 60000);

let states = [];
let bulk = [];
ChatReadState.find = () => query(() => states);
ChatReadState.bulkWrite = async (ops) => { bulk = ops; };
ChatMessage.countDocuments = async () => 4;
const msg = (over) => ({ _id: "m1", room: "community", senderId: T1, senderName: "Mr Sharma", senderRole: "admin", type: "text", text: "Tomorrow's class moves to 6 PM", audience: [], ...over });

// ---- teacher -> students
sent.length = 0;
let r = await svc.notifyChatMessage(msg());
assert.equal(r.sent, 3); assert.deepEqual(sent.map((m) => m.to).sort(), ["a@x.com", "m@x.com", "r@x.com"]); ok("admin message → every student gets an email");
assert.ok(sent[0].subject.includes("Mr Sharma (Teacher)") && sent[0].subject.includes("(4 new)")); ok("subject names the teacher and how many are waiting");
assert.ok(sent[0].html.includes("Tomorrow&#39;s class moves to 6 PM") && sent[0].html.includes("https://app.test/studentdash?tab=chat")); ok("body has the (escaped) message and a link that opens the student chat tab");
assert.equal(bulk.length, 3); assert.ok(bulk.every((o) => o.updateOne.update.$set.lastEmailedAt)); ok("cool-down timestamp saved for everyone emailed");

// ---- student -> mentors
sent.length = 0;
r = await svc.notifyChatMessage(msg({ senderId: S1, senderName: "Asha", senderRole: "student", text: "Sir, I have a doubt in loops" }));
assert.deepEqual(sent.map((m) => m.to).sort(), ["t1@x.com", "t2@x.com"]); assert.ok(sent[0].html.includes("https://app.test/admin?tab=chat") && !sent[0].subject.includes("(Teacher)")); ok("student message → all mentors/admins get an email (link opens the admin chat tab)");

// ---- who is skipped
sent.length = 0;
states = [{ userId: S1, lastSeenAt: minutesAgo(0.5) }, { userId: S2, lastReadAt: minutesAgo(1) }, { userId: S3, lastEmailedAt: minutesAgo(5), lastReadAt: minutesAgo(60) }];
r = await svc.notifyChatMessage(msg()); assert.equal(sent.length, 0); ok("no email to people active in the chat (<2 min) or emailed in the last 15 min");
states = [{ userId: S3, lastEmailedAt: minutesAgo(20), lastReadAt: minutesAgo(60) }, { userId: S1, lastSeenAt: minutesAgo(10) }];
sent.length = 0; r = await svc.notifyChatMessage(msg()); assert.equal(sent.length, 3); ok("after the cool-down / when inactive they are emailed again");
states = [];
sent.length = 0; await svc.notifyChatMessage(msg({ senderRole: "student", senderId: S1, audience: [S2] })); assert.equal(sent.length, 0); ok("targeted messages are not emailed by the chat notifier");
await svc.notifyChatMessage(msg({ senderRole: "system", senderId: "system" })); assert.equal(sent.length, 0); ok("system cards (extra class) are not emailed here - they have their own email");
process.env.CHAT_EMAIL_ENABLED = "false"; await svc.notifyChatMessage(msg()); assert.equal(sent.length, 0); delete process.env.CHAT_EMAIL_ENABLED; ok("CHAT_EMAIL_ENABLED=false switches chat emails off");
sent.length = 0; await svc.notifyChatMessage(msg({ text: "", file: { kind: "pdf", originalName: "n.pdf" } })); assert.ok(sent[0].html.includes("shared a PDF")); ok("file-only message → 'shared a PDF'");
sent.length = 0; await svc.notifyChatMessage(msg({ text: "<script>alert(1)</script>" })); assert.ok(!sent[0].html.includes("<script>alert(1)")); ok("message text is HTML-escaped");
transporter.sendMail = async () => { throw new Error("SMTP down"); };
r = await svc.notifyChatMessage(msg()); assert.equal(r.failed, 3); ok("SMTP failure never throws (chat keeps working)");
transporter.sendMail = async (m) => { sent.push(m); return {}; };

// ---- members
{
  ChatReadState.find = () => query(() => [{ userId: S2, lastSeenAt: new Date() }, { userId: S3, lastSeenAt: minutesAgo(30) }]);
  let rr = res(); await chat.listMembers({ userId: S1, user: { userType: "student" } }, rr);
  assert.equal(rr.body.data.length, 5); assert.deepEqual(rr.body.counts, { admins: 2, students: 3, online: 2 }); ok("members = ALL existing accounts (2 teachers + 3 students)");
  assert.equal(rr.body.data[0].role, "admin"); ok("teachers listed first");
  const ravi = rr.body.data.find((m) => m.name === "Ravi"); const meera = rr.body.data.find((m) => m.name === "Meera");
  assert.equal(ravi.online, true); assert.equal(meera.online, false); assert.equal(rr.body.data.find((m) => m.name === "Asha").online, true); ok("online = seen in the last 90 s (or yourself)");
  assert.ok(!("email" in rr.body.data[0])); ok("students do NOT receive anyone's email address");
  rr = res(); await chat.listMembers({ userId: T1, user: { userType: "admin" } }, rr); assert.ok(rr.body.data.every((m) => m.email)); ok("admins do see emails");
}

// ---- migration
{
  const created = { states: [], msgs: [] };
  ChatReadState.find = () => query(() => [{ userId: S1 }]); // only Asha has a marker
  ChatReadState.insertMany = async (rows) => { created.states.push(...rows); };
  legacy.find = () => query(() => [
    { _id: "L1", userId: S2, heading: "Homework", chat: "Do chapter 3", createdBy: T1, createdAt: new Date("2026-01-05") },
    { _id: "L2", userId: S3, heading: "", chat: "Welcome", createdBy: null, createdAt: new Date("2026-01-06") },
    { _id: "L3", userId: S2, heading: "Old", chat: "Already imported", createdBy: T2, createdAt: new Date("2026-01-07") },
  ]);
  ChatMessage.find = () => query(() => [{ legacyId: "L3" }]);
  ChatMessage.findOne = () => query(() => null);
  ChatMessage.insertMany = async (rows) => { created.msgs.push(...rows); };
  const welcome = []; ChatMessage.create = async (d) => { welcome.push(d); return d; };

  let out = await migrateChat({ dryRun: true });
  assert.deepEqual([out.users, out.readStatesCreated, out.legacyFound, out.legacyImported, out.welcomePosted], [5, 4, 3, 2, true]);
  assert.equal(created.states.length + created.msgs.length + welcome.length, 0); ok("dry run reports 5 users, 4 markers to create, 2 of 3 old posts to import - and writes nothing");
  out = await migrateChat();
  assert.deepEqual(created.states.map((s) => s.userId).sort(), [T1, T2, S2, S3].sort()); ok("every EXISTING user without a read marker gets one (unread starts at 0)");
  assert.equal(created.msgs.length, 2); assert.deepEqual(created.msgs[0].audience, [S2]); assert.equal(created.msgs[0].senderName, "Mr Sharma"); assert.equal(created.msgs[0].text, "Homework\nDo chapter 3"); assert.equal(created.msgs[0].legacyId, "L1"); ok("old Common Area posts imported as TARGETED messages (only that student + admins), author and text kept");
  assert.equal(created.msgs[1].senderRole, "system"); assert.equal(created.msgs[1].text, "Welcome"); ok("posts without an author become system messages");
  assert.ok(created.msgs.every((m) => m.createdAt instanceof Date)); ok("original dates are passed through");
  assert.equal(welcome.length, 1); assert.equal(welcome[0].legacyId, "welcome-v1"); ok("welcome message posted once");
  ChatMessage.findOne = () => query(() => ({ _id: "w" })); created.msgs.length = 0; welcome.length = 0; ChatMessage.find = () => query(() => [{ legacyId: "L1" }, { legacyId: "L2" }, { legacyId: "L3" }]); ChatReadState.find = () => query(() => users.map((u) => ({ userId: String(u._id) })));
  out = await migrateChat(); assert.equal(out.legacyImported, 0); assert.equal(out.readStatesCreated, 0); assert.equal(out.welcomePosted, false); assert.equal(created.msgs.length + welcome.length, 0); ok("running it again changes nothing (idempotent)");
}
console.log(`\n${n} chat-email / members / migration checks passed`);
