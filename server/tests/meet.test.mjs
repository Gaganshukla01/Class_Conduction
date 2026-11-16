// Run: node tests/meet.test.mjs   (fake Google API + stubbed models - no network, no MongoDB)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test"; process.env.FRONTEND_URL = "https://app.test";

const { default: transporter } = await imp("config/nodeMailer.js");
transporter.sendMail = async () => ({});
const { default: userModel } = await imp("model/userModel.js");
const { default: classSchedule } = await imp("model/classesScheduleDetails.js");
const { default: ExtraClass } = await imp("model/extraClassModel.js");
const { ChatMessage, ChatThread, ChatReadState } = await imp("model/chatModel.js");
const meet = await imp("services/googleMeet.js");
const sched = await imp("controller/classScheduleController.js");
const ec = await imp("controller/extraClassController.js");

let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };
const res = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };

// ---------------- fake Google
let calls = []; let failCreate = false; let events = {};
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url); const body = opts.body && typeof opts.body === "string" && opts.body.startsWith("{") ? JSON.parse(opts.body) : opts.body;
  calls.push({ url: u, method: opts.method || "GET", body });
  const j = (code, data) => ({ ok: code < 400, status: code, json: async () => data });
  if (u.includes("oauth2.googleapis.com")) return j(200, { access_token: "tok", expires_in: 3600 });
  if (opts.method === "POST" && u.includes("/events")) {
    if (failCreate) return j(403, { error: { message: "Calendar API has not been used" } });
    const id = `ev${Object.keys(events).length + 1}`; events[id] = { ...body };
    return j(200, { id, hangoutLink: `https://meet.google.com/aaa-${id}-zzz` });
  }
  if (opts.method === "PATCH") return j(200, { id: u.split("/events/")[1].split("?")[0], hangoutLink: "https://meet.google.com/aaa-ev1-zzz" });
  if (opts.method === "DELETE") return u.includes("gone") ? j(404, { error: { message: "nf" } }) : { ok: true, status: 204, json: async () => ({}) };
  return j(200, {});
};

// ================= service
assert.equal(meet.isMeetConfigured(), false); ok("not configured without the three env values");
process.env.GOOGLE_CLIENT_ID = "id"; process.env.GOOGLE_CLIENT_SECRET = "sec"; process.env.GOOGLE_REFRESH_TOKEN = "ref";
assert.equal(meet.isMeetConfigured(), true);
const d = new Date(Date.UTC(2026, 10, 20)); // 20 Nov 2026 (UTC midnight, like the app stores it)
const ev = await meet.createMeetEvent({ title: "Python", classDate: d, classTime: "17:30", durationHours: 1.5, emails: ["A@x.com", "a@x.com", "bad", "b@x.com"], weeks: 30 });
assert.equal(ev.meetLink, "https://meet.google.com/aaa-ev1-zzz"); ok("returns the Meet link + event id");
const post = calls.find((c) => c.method === "POST" && c.url.includes("/events"));
assert.match(post.url, /conferenceDataVersion=1/); assert.match(post.url, /sendUpdates=all/);
assert.equal(post.body.conferenceData.createRequest.conferenceSolutionKey.type, "hangoutsMeet"); ok("asks Google for a Meet room");
assert.deepEqual(post.body.attendees.map((a) => a.email), ["a@x.com", "b@x.com"]); ok("students' e-mails become guests (deduped, lower-cased, invalid dropped)");
assert.equal(post.body.start.dateTime, "2026-11-20T17:30:00"); assert.equal(post.body.end.dateTime, "2026-11-20T19:00:00"); assert.equal(post.body.start.timeZone, "Asia/Kolkata"); ok("start/end are in the institute time zone (17:30 IST, 1.5 h)");
assert.deepEqual(post.body.recurrence, ["RRULE:FREQ=WEEKLY;COUNT=30"]); ok("weekly class = ONE recurring event (same link every week)");
await meet.updateMeetEvent("ev1", { title: "Python", classDate: d, classTime: "18:00", durationHours: 1, emails: ["a@x.com"] });
assert.ok(calls.some((c) => c.method === "PATCH")); ok("reschedule updates the same event");
await meet.deleteMeetEvent("ev1"); await meet.deleteMeetEvent("gone-1"); await meet.deleteMeetEvent(""); ok("delete works; an already-deleted event is fine");

// ================= class schedule with auto Meet (weekday slots × weeks)
const oid = (k) => `64b${String(k).padStart(21, "0")}`;
const T = oid(9), A = oid(1), B = oid(2);
const users = [{ _id: T, userType: "teacher", email: "t@x.com", name: "Mr T" }, { _id: A, userType: "student", email: "a@x.com", name: "Arjun" }, { _id: B, userType: "student", email: "b@x.com", name: "Riya" }];
const q = (get) => { const o = { select: () => o, lean: async () => get(), then: (a, b) => Promise.resolve(get()).then(a, b) }; return o; };
userModel.findById = (id) => q(() => users.find((u) => String(u._id) === String(id)) || null);
userModel.find = (f = {}) => q(() => users.filter((u) => !f._id?.$in || f._id.$in.includes(String(u._id))));
let saved = []; classSchedule.insertMany = async (docs) => { saved = docs; return docs; };
const base = { className: "Python", instructorId: T, studentsEnrolled: [A, B], classDuration: "1", classRate: 500, weeklySchedule: [{ date: "2026-11-23", time: "17:00" }, { date: "2026-11-25", time: "18:00" }], autoMeet: true, weeks: 4, guestEmails: "parent@x.com" };
calls = []; events = {};
let r = res(); await sched.classCreate({ body: base, userId: T, user: users[0] }, r);
assert.equal(r.code, 201, JSON.stringify(r.body)); assert.equal(saved.length, 8); ok("2 weekdays × 4 weeks = 8 sessions (weeks is configurable)");
const links = [...new Set(saved.map((s) => s.classLink))]; assert.equal(links.length, 2); assert.ok(links.every((l) => l.startsWith("https://meet.google.com/"))); ok("each weekday slot gets its own Meet link, shared by all its weeks");
assert.ok(saved.every((s) => s.meetEventId)); ok("event id stored on every session");
const posts = calls.filter((c) => c.method === "POST" && c.url.includes("/events"));
assert.deepEqual(posts[0].body.attendees.map((a) => a.email).sort(), ["a@x.com", "b@x.com", "parent@x.com", "t@x.com"]); assert.equal(posts[0].body.recurrence[0], "RRULE:FREQ=WEEKLY;COUNT=4"); assert.equal(posts[0].body.summary, "Arjun & Riya - Python classes"); ok("calendar title is student name(s) - course; guests = students + teacher + typed-in e-mails; recurrence matches the weeks");
// manual link still works and does not call Google
calls = []; r = res(); await sched.classCreate({ body: { ...base, autoMeet: false, classLink: "https://zoom.test/1" }, userId: T, user: users[0] }, r);
assert.equal(r.code, 201); assert.equal(calls.length, 0); assert.ok(saved.every((s) => s.classLink === "https://zoom.test/1")); ok("pasting a link by hand still works (no Google call)");
r = res(); await sched.classCreate({ body: { ...base, autoMeet: false, classLink: "" }, userId: T, user: users[0] }, r); assert.equal(r.code, 400); ok("no link and no auto-Meet → 400");
// Google failure → nothing saved
failCreate = true; saved = []; r = res(); await sched.classCreate({ body: base, userId: T, user: users[0] }, r);
assert.equal(r.code, 502); assert.match(r.body.message, /Could not create the Meet link/); assert.equal(saved.length, 0); ok("Google error → clear message and NOTHING is saved"); failCreate = false;
delete process.env.GOOGLE_REFRESH_TOKEN; r = res(); await sched.classCreate({ body: base, userId: T, user: users[0] }, r); assert.equal(r.code, 400); assert.match(r.body.message, /not set up/); process.env.GOOGLE_REFRESH_TOKEN = "ref"; ok("not configured → friendly 400");

// ================= extra class: create → reschedule (pick students) → cancel
let extras = [];
ExtraClass.create = async (dd) => { const doc = { _id: oid(500 + extras.length), status: "scheduled", ...dd, attendance: [], toObject() { return { ...this }; }, async save() { return this; }, async deleteOne() { extras = extras.filter((x) => x !== this); } }; extras.push(doc); return doc; };
ExtraClass.findById = async (id) => extras.find((x) => String(x._id) === String(id)) || null;
let msgs = []; ChatMessage.create = async (dd) => { const m = { ...dd, _id: oid(700 + msgs.length), createdAt: new Date(), toObject() { return { ...this }; } }; msgs.push(m); return m; };
ChatThread.findOneAndUpdate = async () => ({}); ChatThread.updateOne = async () => {}; ChatReadState.find = () => q(() => []); ChatReadState.updateOne = () => Promise.resolve(); ChatReadState.bulkWrite = async () => {}; ChatMessage.countDocuments = async () => 0;
const teacher = { ...users[0], userType: "admin" }; users[0].userType = "admin";
const future = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
calls = []; r = res(); await ec.createExtraClass({ userId: T, user: teacher, query: {}, params: {}, body: { type: "extra", title: "Doubt class", date: future, time: "19:00", duration: 1, studentIds: [A], autoMeet: true, guestEmails: "mom@x.com" } }, r);
assert.equal(r.code, 201, JSON.stringify(r.body)); const x = extras[0];
assert.match(x.classLink, /^https:\/\/meet\.google\.com\//); assert.ok(x.meetEventId); ok("extra class: link auto-generated and saved (so the chat card / Join Now button uses it)");
assert.equal(msgs[0].card.joinUrl, x.classLink); ok("the chat card's Join Now points at the generated Meet");
const p2 = calls.find((c) => c.method === "POST" && c.url.includes("/events")); assert.deepEqual(p2.body.attendees.map((a) => a.email).sort(), ["a@x.com", "mom@x.com", "t@x.com"]); assert.equal(p2.body.recurrence, undefined); assert.equal(p2.body.summary, "Arjun - Doubt class"); ok("guest = selected student + teacher + extra e-mail; single (non-recurring) event");
calls = []; r = res(); await ec.updateExtraClass({ userId: T, user: teacher, params: { id: String(x._id) }, query: {}, body: { time: "20:00", studentIds: [A, B] } }, r);
assert.equal(r.code, 200, JSON.stringify(r.body)); const patch = calls.find((c) => c.method === "PATCH"); assert.ok(patch); assert.deepEqual(patch.body.attendees.map((a) => a.email).sort(), ["a@x.com", "b@x.com", "mom@x.com", "t@x.com"]);
assert.deepEqual(x.studentsEnrolled.sort(), [A, B]); assert.equal(x.classTime, "20:00"); ok("reschedule: pick students → their e-mails become guests, the SAME Meet link is kept with the new time");
calls = []; r = res(); await ec.updateExtraClass({ userId: T, user: teacher, params: { id: String(x._id) }, query: {}, body: { status: "cancelled" } }, r);
assert.equal(r.code, 200); assert.ok(calls.some((c) => c.method === "DELETE")); assert.equal(x.meetEventId, undefined); ok("cancel deletes the Calendar event");
assert.equal(meet.meetTitle(["Arjun"], "Python"), "Arjun - Python classes");
assert.equal(meet.meetTitle(["A", "B", "C", "D", "E"], "Python classes"), "A, B +3 - Python classes");
assert.equal(meet.meetTitle([], "Python"), "Python classes"); ok("title helper: 1, 2, many students; no double 'classes'");
const { resolveDbName } = await imp("config/database.js");
assert.equal(resolveDbName("mongodb+srv://u:p@h.net/mydb?x=1", ""), "mydb");
assert.equal(resolveDbName("mongodb+srv://u:p@h.net/mydb?x=1", "other"), "other");
assert.equal(resolveDbName("mongodb+srv://u:p@h.net/?x=1", ""), ""); ok("DB name: env var wins, else the name inside the URI, else empty (server refuses to start) - nothing hard-coded");
console.log(`\n${n} checks passed`);
