// Run: node tests/payments.test.mjs   (stubbed models - no MongoDB needed)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test"; process.env.FRONTEND_URL = "https://app.test";

const { default: transporter } = await imp("config/nodeMailer.js");
const { default: userModel } = await imp("model/userModel.js");
const { default: classSchedule } = await imp("model/classesScheduleDetails.js");
const { default: ExtraClass } = await imp("model/extraClassModel.js");
const { Payment, Counter, nextReceiptNo } = await imp("model/paymentModel.js");
const pc = await imp("controller/paymentController.js");
const uc = await imp("controller/userController.js");

const sent = [];
transporter.sendMail = async (m) => { sent.push(m); return {}; };
const oid = (n) => `64b${String(n).padStart(21, "0")}`;
const [ADMIN, ADMIN2, MGR, T1, T2, S1, S2, S3] = [oid(1), oid(2), oid(3), oid(4), oid(5), oid(11), oid(12), oid(13)];
const mk = (id, name, userType, extra = {}) => ({ _id: id, name, email: `${name.toLowerCase().replace(/\W/g, "")}@x.com`, userType, ...extra });
const users = [mk(ADMIN, "Admin One", "admin"), mk(ADMIN2, "Admin Two", "admin"), mk(MGR, "Manager Mo", "manager"), mk(T1, "Teacher One", "teacher"), mk(T2, "Teacher Two", "teacher"), mk(S1, "Asha", "student"), mk(S2, "Ravi", "student"), mk(S3, "Meera", "student")];
const U = (id) => users.find((u) => u._id === id);
function query(get) { const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => get(), then: (a, b) => Promise.resolve(get()).then(a, b) }; return q; }
const typeOk = (u, t) => t === undefined || (typeof t === "string" ? u.userType === t : t.$in ? t.$in.includes(u.userType) : true);
userModel.find = (f = {}) => query(() => users.filter((u) => typeOk(u, f.userType) && (!f._id?.$in || f._id.$in.includes(String(u._id)))));
userModel.findById = (id) => query(() => users.find((u) => String(u._id) === String(id)) || null);
userModel.findOne = (f = {}) => query(() => users.find((u) => (!f._id || String(u._id) === String(f._id)) && typeOk(u, f.userType)) || null);
const res = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
const as = (u, extra = {}) => ({ userId: String(u._id), user: u, body: {}, query: {}, params: {}, ...extra });
let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };

// ---- time helpers: classes in the past / future (UTC midnight like the app stores them)
const day = (offset) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + offset); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
let classes = [];
const mkClass = (id, instr, students, over = {}) => ({ _id: oid(id), className: "Python", classDate: day(-5), classTime: "10:00", classDuration: "1", instructorId: instr, studentsEnrolled: students, classRate: 500, paid: false, ...over });
const resetClasses = () => {
  classes = [
    mkClass(100, T1, [S1], { classDate: day(-10) }), mkClass(101, T1, [S1], { classDate: day(-3) }), mkClass(102, T1, [S1], { classDate: day(4) }),
    mkClass(103, T1, [S1], { classDate: day(-20), paid: true, paymentId: "old", paymentUpdatedAt: new Date() }),
    mkClass(104, T2, [S1, S2], { classDate: day(-2), className: "Java", classRate: 700 }),
    mkClass(105, T2, [S3], { classDate: day(-4), classRate: 300 }),
  ];
  sent.length = 0;
};
resetClasses();
const matchClass = (c, f = {}) =>
  (!f._id?.$in || f._id.$in.includes(String(c._id))) && (!f.instructorId || c.instructorId === f.instructorId) &&
  (!f.studentsEnrolled || (typeof f.studentsEnrolled === "string" ? c.studentsEnrolled.includes(f.studentsEnrolled) : f.studentsEnrolled.$in ? c.studentsEnrolled.some((s) => f.studentsEnrolled.$in.includes(s)) : true));
classSchedule.find = (f = {}) => query(() => classes.filter((c) => matchClass(c, f)));
classSchedule.updateMany = async (f, upd) => {
  let m = 0;
  for (const c of classes) {
    if (f._id?.$in && !f._id.$in.includes(String(c._id))) continue;
    if (f.paymentId && c.paymentId !== f.paymentId) continue;
    if (f.paid?.$ne === true && c.paid) continue;
    Object.assign(c, Object.fromEntries(Object.entries(upd).filter(([k]) => k !== "$unset"))); if (upd.$unset) for (const k of Object.keys(upd.$unset)) delete c[k]; m++;
  }
  return { modifiedCount: m };
};
ExtraClass.find = () => query(() => []);
classSchedule.countDocuments = async (f = {}) => classes.filter((c) => matchClass(c, f)).length;

// ---- Payment / Counter in memory
let payments = []; let seq = 0;
Counter.findOneAndUpdate = async () => ({ seq: ++seq });
Payment.create = async (d) => { const p = { _id: oid(900 + payments.length), createdAt: new Date(), status: "paid", ...d, toObject() { return { ...this }; }, async save() { return this; } }; payments.push(p); return p; };
Payment.deleteOne = async ({ _id }) => { payments = payments.filter((p) => p._id !== _id); };
Payment.find = (f = {}) => query(() => payments.filter((p) => (!f.studentId || p.studentId === f.studentId)).sort((a, b) => b.createdAt - a.createdAt));
Payment.findById = (id) => { const p = payments.find((x) => x._id === id) || null; const q = query(() => p); q.then = (a, b) => Promise.resolve(p).then(a, b); return q; };

// ============================================================== receipt numbers
assert.match(await nextReceiptNo(new Date("2026-03-01")), /^CW-2026-00001$/); assert.match(await nextReceiptNo(new Date("2026-03-01")), /^CW-2026-00002$/); seq = 0; payments = []; ok("receipt numbers run CW-2026-00001, 00002 …");

// ============================================================== overview (summary)
let r = res(); await pc.summary(as(U(ADMIN)), r);
const s1 = r.body.data.students.find((s) => s.name === "Asha");
assert.deepEqual([s1.pendingAmount, s1.pendingCount, s1.upcomingAmount, s1.upcomingCount, s1.paidAmount, s1.paidCount], [500 + 500 + 700, 3, 500, 1, 500, 1]); ok("per student: PENDING = classes already held and unpaid; UPCOMING = future unpaid; PAID");
assert.equal(r.body.data.students[0].name, "Asha"); ok("students with the biggest dues come first");
assert.equal(r.body.data.totals.pendingAmount, 500 + 500 + 700 + 700 + 300); assert.equal(r.body.data.totals.studentsWithDues, 3); assert.ok(r.body.data.totals.collectedThisMonth >= 500); ok("totals: pending, upcoming, collected this month, students with dues");
r = res(); await pc.summary(as(U(T1)), r);
assert.deepEqual(r.body.data.students.map((s) => s.name), ["Asha"]); assert.equal(r.body.data.students[0].pendingAmount, 1000); ok("a TEACHER sees only their own students, and only the classes THEY teach (Java with Teacher Two is not counted)");
r = res(); await pc.summary(as(U(MGR)), r); assert.equal(r.body.data.students.length, 3); ok("manager sees everyone");

// ============================================================== ledgers
r = res(); await pc.studentLedger(as(U(T1), { params: { studentId: S3 } }), r); assert.equal(r.code, 403); ok("a teacher cannot open another teacher's student");
r = res(); await pc.studentLedger(as(U(T1), { params: { studentId: S1 } }), r);
assert.equal(r.code, 200); assert.equal(r.body.data.classes.length, 4); assert.deepEqual([r.body.data.totals.pendingAmount, r.body.data.totals.paidAmount], [1000, 500]); ok("teacher's ledger of a student: only their classes");
r = res(); await pc.studentLedger(as(U(ADMIN), { params: { studentId: S1 } }), r); assert.equal(r.body.data.classes.length, 5); ok("admin's ledger: all of the student's classes");
r = res(); await pc.myLedger(as(U(S1)), r); assert.equal(r.body.data.classes.length, 5); assert.equal(r.body.data.totals.pendingAmount, 1700); ok("a student sees their own ledger (all classes)");
assert.equal(r.body.data.classes[0].held, false); assert.equal(r.body.data.classes[0].paid, false); ok("newest first; each class knows if it is held / paid");

// ============================================================== record a payment
sent.length = 0;
r = res(); await pc.recordPayment(as(U(T1), { body: { studentId: S1, classIds: [oid(100), oid(101)], method: "upi", reference: "UPI-7788", note: "Paid for November" } }), r);
assert.equal(r.code, 201); const pay = payments[0];
assert.equal(pay.receiptNo, "CW-2026-00001".replace("2026", String(new Date().getUTCFullYear()))); assert.equal(pay.amount, 1000); assert.equal(pay.items.length, 2); assert.equal(pay.method, "upi"); assert.equal(pay.recordedBy, T1); assert.equal(pay.recordedByRole, "teacher"); ok("TEACHER records a payment: receipt number, total, items, method, who recorded it");
assert.ok(classes[0].paid && classes[1].paid && classes[0].paymentId === pay._id && !classes[2].paid); ok("the classes are marked paid and linked to the receipt");
const to = sent.map((m) => m.to).sort(); assert.deepEqual(to, ["adminone@x.com", "admintwo@x.com", "asha@x.com", "teacherone@x.com"]); ok("receipt is e-mailed to the STUDENT, EVERY ADMIN and the teacher who recorded it (each once)");
const stuMail = sent.find((m) => m.to === "asha@x.com");
assert.ok(stuMail.subject.includes(pay.receiptNo) && stuMail.subject.includes("₹1,000")); assert.ok(stuMail.html.includes("PAYMENT RECEIVED") && stuMail.html.includes("₹1,000") && stuMail.html.includes("UPI-7788") && stuMail.html.includes("Paid for November") && stuMail.html.includes("Teacher One (Teacher)") && stuMail.html.includes("/studentdash?tab=payment")); ok("student's e-mail: receipt card, amount, receipt no, method, reference, note, who received it, link to their payments");
const admMail = sent.find((m) => m.to === "adminone@x.com"); assert.ok(admMail.subject.includes("Payment recorded: Asha") && admMail.html.includes("recorded a payment from") && admMail.html.includes("/admin?tab=paymentUpdate")); ok("admin's e-mail: 'Teacher One recorded a payment from Asha' with a link to the payments page");
assert.equal((stuMail.html.match(/>Python</g) || []).length, 2); ok("the receipt lists every class paid for");

// guards
sent.length = 0;
r = res(); await pc.recordPayment(as(U(T1), { body: { studentId: S1, classIds: [oid(100)] } }), r); assert.equal(r.code, 409); assert.match(r.body.message, /already paid/); assert.equal(payments.length, 1); ok("a class that is already paid cannot be paid twice");
r = res(); await pc.recordPayment(as(U(T1), { body: { studentId: S1, classIds: [oid(104)] } }), r); assert.equal(r.code, 403); assert.match(r.body.message, /classes you teach/); ok("a teacher cannot record payment for another teacher's class");
r = res(); await pc.recordPayment(as(U(T1), { body: { studentId: S3, classIds: [oid(105)] } }), r); assert.equal(r.code, 403); ok("…or for another teacher's student");
r = res(); await pc.recordPayment(as(U(ADMIN), { body: { studentId: S2, classIds: [oid(101)] } }), r); assert.equal(r.code, 400); assert.match(r.body.message, /not enrolled/); ok("the student must be enrolled in the class");
r = res(); await pc.recordPayment(as(U(ADMIN), { body: { studentId: S1, classIds: [oid(999)] } }), r); assert.equal(r.code, 404);
r = res(); await pc.recordPayment(as(U(ADMIN), { body: { studentId: S1, classIds: [] } }), r); assert.equal(r.code, 400); r = res(); await pc.recordPayment(as(U(ADMIN), { body: { studentId: "bad", classIds: [oid(102)] } }), r); assert.equal(r.code, 400); ok("empty / invalid input rejected");
assert.equal(sent.length, 0); ok("failed attempts send no e-mail");

// admin records: no duplicate "copy" mail, other admins still informed
sent.length = 0;
r = res(); await pc.recordPayment(as(U(ADMIN), { body: { studentId: S1, classIds: [oid(104)], method: "weird" } }), r);
assert.equal(r.code, 201); assert.equal(payments[1].method, "cash"); assert.equal(payments[1].amount, 700); ok("admin can record any class; an unknown method falls back to cash");
assert.deepEqual(sent.map((m) => m.to).sort(), ["adminone@x.com", "admintwo@x.com", "asha@x.com"]); ok("when an ADMIN records: student + both admins, no extra copy");
sent.length = 0; r = res(); await pc.recordPayment(as(U(MGR), { body: { studentId: S3, classIds: [oid(105)] } }), r);
assert.equal(r.code, 201); assert.deepEqual(sent.map((m) => m.to).sort(), ["adminone@x.com", "admintwo@x.com", "managermo@x.com", "meera@x.com"]); ok("a MANAGER can record too (and gets a copy)");

// race: another person pays a class between the check and the update
const racing = mkClass(110, T1, [S1], { classDate: day(-1) }); classes.push(racing);
const realUpdate = classSchedule.updateMany; classSchedule.updateMany = async (f, upd) => { if (f._id?.$in?.includes(oid(110))) { return { modifiedCount: 0 }; } return realUpdate(f, upd); };
const before = payments.length; sent.length = 0; r = res(); await pc.recordPayment(as(U(T1), { body: { studentId: S1, classIds: [oid(110)] } }), r);
assert.equal(r.code, 409); assert.equal(payments.length, before); assert.equal(sent.length, 0); classSchedule.updateMany = realUpdate; ok("race: if someone else paid the class a moment earlier the attempt is undone completely (no receipt, no e-mail)");

// ============================================================== receipts
r = res(); await pc.getReceipt(as(U(S1), { params: { id: pay._id } }), r); assert.equal(r.code, 200); assert.equal(r.body.data.student.name, "Asha"); ok("a student can open their own receipt");
r = res(); await pc.getReceipt(as(U(S2), { params: { id: pay._id } }), r); assert.equal(r.code, 403); ok("…but not another student's");
r = res(); await pc.getReceipt(as(U(T2), { params: { id: pay._id } }), r); assert.equal(r.code, 403); r = res(); await pc.getReceipt(as(U(T1), { params: { id: pay._id } }), r); assert.equal(r.code, 200); ok("a teacher sees a receipt only if they recorded it or one of its classes is theirs");
r = res(); await pc.studentLedger(as(U(ADMIN), { params: { studentId: S1 } }), r); assert.ok(r.body.data.receipts.length >= 2); ok("receipts are listed in the student's ledger");

// ============================================================== void
sent.length = 0;
r = res(); await pc.voidPayment(as(U(ADMIN), { params: { id: pay._id }, body: { reason: "Entered by mistake" } }), r);
assert.equal(r.code, 200); assert.equal(pay.status, "voided"); assert.ok(!classes[0].paid && !classes[1].paid && classes[0].paymentId === undefined); ok("voiding a receipt makes its classes unpaid again");
assert.deepEqual(sent.map((m) => m.to).sort(), ["adminone@x.com", "admintwo@x.com", "asha@x.com"]); assert.ok(sent[0].subject.includes("was cancelled") && sent[0].html.includes("Entered by mistake")); ok("student and admins are told, with the reason");
r = res(); await pc.voidPayment(as(U(ADMIN), { params: { id: pay._id }, body: {} }), r); assert.equal(r.code, 400); ok("a receipt can only be cancelled once");
// ============================================================== "My students"
r = res(); await uc.myStudents(as(U(T1)), r);
assert.equal(r.body.data.length, 1); const st = r.body.data[0];
assert.deepEqual([st.name, st.courses, st.heldClasses, st.upcomingClasses, st.attendanceRate, st.pendingAmount], ["Asha", ["Python"], 4, 1, 0, 1500]); assert.equal(st.nextClass.className, "Python"); ok("a teacher's 'My students': only their students, with classes held, attendance %, next class and fees due (for THEIR classes)");
r = res(); await uc.myStudents(as(U(ADMIN)), r); assert.deepEqual(r.body.data.map((x) => x.name).sort(), ["Asha", "Meera", "Ravi"]); ok("admin / manager: every student");
console.log(`\n${n} payment checks passed`);
