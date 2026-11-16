// Run: node tests/roles.test.mjs   (stubbed models - no MongoDB needed)
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(path.join(root, p));
process.env.SMTP_USER = "u"; process.env.SMTP_PASSWORD = "p"; process.env.SENDER_EMAIL = "n@c.test";
process.env.FRONTEND_URL = "https://app.test"; process.env.JWT_SECRET = "test-secret";

const { default: transporter } = await imp("config/nodeMailer.js");
const { default: userModel } = await imp("model/userModel.js");
const { default: classSchedule } = await imp("model/classesScheduleDetails.js");
const { default: ExtraClass } = await imp("model/extraClassModel.js");
const { default: homeworkModel } = await imp("model/homeworkModel.js");
const { CodeQuestion, QuestionAssignment } = await imp("model/codeQuestionModel.js");
const { ChatThread, ChatMessage, ChatReadState, ChatSettings } = await imp("model/chatModel.js");
const { QuestionFolder } = await imp("model/questionFolderModel.js");
const roles = await imp("config/roles.js");
const mw = await imp("middlewares/userAuthMiddleware.js");
const auth = await imp("controller/authController.js");
const uc = await imp("controller/userController.js");
const sched = await imp("controller/classScheduleController.js");
const hw = await imp("controller/homeWorkAssign.js");
const qc = await imp("controller/questionController.js");
const ec = await imp("controller/extraClassController.js");
const cn = await imp("controller/classNoteController.js");
const chat = await imp("controller/chatController.js");
const rooms = await imp("services/chatRooms.js");
const scope = await imp("services/scope.js");

const sent = [];
transporter.sendMail = async (m) => { sent.push(m); return {}; };
const oid = (n) => `64b${String(n).padStart(21, "0")}`;
const [ADMIN, MGR, T1, T2, S1, S2, S3] = [oid(1), oid(2), oid(3), oid(4), oid(11), oid(12), oid(13)];
let db = [];
const mkUser = (id, name, userType, extra = {}) => ({ _id: id, name, email: `${name.toLowerCase().replace(/\W/g, "")}@x.com`, userType, password: "x", ...extra });
const reset = () => {
  db = [mkUser(ADMIN, "Admin Boss", "admin"), mkUser(MGR, "Manager Mo", "manager"), mkUser(T1, "Teacher One", "teacher"), mkUser(T2, "Teacher Two", "teacher"),
    mkUser(S1, "Asha", "student"), mkUser(S2, "Ravi", "student"), mkUser(S3, "Meera", "student")];
  sent.length = 0;
};
reset();
const decorate = (u) => { if (u && !u.save) { u.save = async function () { return this; }; u.toObject = function () { return { ...this }; }; } return u; };
const typeOk = (u, t) => t === undefined || (typeof t === "string" ? u.userType === t : t.$in ? t.$in.includes(u.userType) : t.$ne ? u.userType !== t.$ne : true);
const statusOk = (u, s) => s === undefined || !s.$nin || !s.$nin.includes(u.accountStatus);
const matches = (u, f = {}) =>
  (!f._id || (f._id.$in ? f._id.$in.map(String).includes(String(u._id)) : String(f._id) === String(u._id))) && typeOk(u, f.userType) && statusOk(u, f.accountStatus) &&
  (!f.$or || f.$or.some((c) => matches(u, c))) && (f.accountStatus === undefined || typeof f.accountStatus !== "string" || u.accountStatus === f.accountStatus);
function query(get) { const q = { select: () => q, sort: () => q, limit: () => q, lean: async () => get(), then: (a, b) => Promise.resolve(get()).then(a, b) }; return q; }
userModel.find = (f = {}) => query(() => db.filter((u) => matches(u, f)).map(decorate));
userModel.findById = (id) => query(() => decorate(db.find((u) => String(u._id) === String(id)) || null));
userModel.findOne = (f = {}) => query(() => {
  if (f.email instanceof RegExp) return decorate(db.find((u) => f.email.test(u.email)) || null);
  return decorate(db.find((u) => matches(u, f)) || null);
});
userModel.exists = async (f) => (db.some((u) => matches(u, f)) ? { _id: 1 } : null);
userModel.countDocuments = async (f = {}) => db.filter((u) => matches(u, f)).length;
let created = [];
userModel.prototype.save = async function () { if (!db.includes(this)) { this.accountStatus = this.accountStatus; db.push(this); created.push(this); } return this; };
const res = () => { const r = { code: 200, body: null, cookies: [], status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; }, cookie(...a) { r.cookies.push(a); return r; } }; return r; };
let n = 0; const ok = (m) => { console.log("✓ " + m); n++; };
const as = (u, extra = {}) => ({ userId: String(u._id), user: u, body: {}, query: {}, params: {}, ...extra });
const U = (id) => db.find((u) => u._id === id);

// ================================================================== roles config
assert.ok(roles.isStaffRole("teacher") && roles.isStaffRole("manager") && roles.isStaffRole("admin") && !roles.isStaffRole("student")); ok("staff = admin, manager, teacher");
assert.ok(roles.isTeachingRole("teacher") && roles.isTeachingRole("admin") && !roles.isTeachingRole("manager")); ok("an admin is also a teacher (can be the instructor); a manager is not");
assert.equal(roles.accountStatusOf({}), "approved"); assert.equal(roles.accountStatusOf({ accountStatus: "pending" }), "pending"); ok("accounts that existed before approvals (no status) count as APPROVED - nobody is locked out");
assert.deepEqual([roles.dashboardPath("student"), roles.dashboardPath("teacher"), roles.dashboardPath("manager"), roles.dashboardPath("admin")], ["/studentdash", "/teacher", "/admin", "/admin"]); ok("each role has its own dashboard");

// ================================================================== middleware
{
  const run = async (user, token = true) => { const r = res(); let nxt = false; const orig = userModel.findById; await mw.loadUser({ userId: user ? String(user._id) : oid(999) }, r, () => { nxt = true; }); return { r, nxt }; };
  db.push(mkUser(oid(50), "Pending Pat", "student", { accountStatus: "pending" }), mkUser(oid(51), "Rejected Ron", "student", { accountStatus: "rejected" }), mkUser(oid(52), "Legacy Lou", "student"));
  let out = await run(U(oid(50))); assert.equal(out.r.code, 403); assert.equal(out.r.body.code, "ACCOUNT_PENDING"); assert.equal(out.nxt, false); ok("PENDING account is blocked from the API (403 ACCOUNT_PENDING)");
  out = await run(U(oid(51))); assert.equal(out.r.body.code, "ACCOUNT_REJECTED"); ok("REJECTED account is blocked (403 ACCOUNT_REJECTED)");
  out = await run(U(oid(52))); assert.equal(out.nxt, true); ok("an old account with no status passes");
  out = await run(null); assert.equal(out.r.code, 401); ok("unknown user → 401");
  const check = (roleList, user) => { const r = res(); let nxt = false; mw.requireRole(...roleList)({ user }, r, () => { nxt = true; }); return { r, nxt }; };
  assert.equal(check(["admin", "manager"], U(T1)).r.code, 403); ok("a TEACHER cannot use admin/manager-only actions (e.g. create a schedule)");
  assert.ok(check(["admin", "manager", "teacher"], U(T1)).nxt && check(["admin", "manager"], U(MGR)).nxt && !check(["admin"], U(MGR)).nxt); ok("manager passes ops routes but not admin-only routes");
  assert.equal(check(["admin", "manager", "teacher"], U(S1)).r.code, 403); ok("a student cannot use staff routes");
  assert.equal(mw.opsOnly.length, 3); assert.equal(mw.staffOnly.length, 3); assert.equal(mw.adminOnly.length, 3); ok("every role guard also checks the account is approved (userAuth + loadUser + role)");
  reset();
}

// ================================================================== register
{
  created = [];
  let r = res(); await auth.register({ body: { name: "Nina", email: "Nina@Mail.com", password: "secret1", requestedRole: "teacher" } }, r);
  assert.equal(r.body.sucess, true); assert.equal(r.body.accountStatus, "pending"); const nina = created[0];
  assert.equal(nina.accountStatus, "pending"); assert.equal(nina.requestedRole, "teacher"); assert.equal(nina.userType, "student"); assert.notEqual(nina.password, "secret1"); ok("new account is PENDING, role 'student' until an admin approves; the role it asked for is kept");
  assert.equal(r.cookies.length, 1); ok("the person is logged in, so they see the 'in review' screen");
  assert.equal(sent.find((m) => m.to === "nina@mail.com".replace("nina@mail.com", nina.email)).subject.includes("account is in review"), true); ok("the person gets an 'Your account is in review' e-mail");
  const adminMail = sent.filter((m) => m.subject.includes("New Teacher account to approve")); assert.deepEqual(adminMail.map((m) => m.to), ["adminboss@x.com"]); assert.ok(adminMail[0].html.includes("/admin?tab=approvals") && adminMail[0].html.includes("Nina")); ok("every ADMIN is e-mailed 'new account to approve' with a link to Account Approvals");
  r = res(); await auth.register({ body: { name: "X", email: "NINA@mail.COM", password: "secret1" } }, r); assert.equal(r.body.sucess, false); assert.match(r.body.message, /Already Found/); ok("duplicate e-mail is detected case-insensitively");
  r = res(); await auth.register({ body: { name: "X", email: "a@b.com", password: "123" } }, r); assert.equal(r.body.sucess, false); assert.match(r.body.message, /at least 6/); ok("short password rejected");
  r = res(); await auth.register({ body: { name: "X", email: "" } }, r); assert.equal(r.body.sucess, false);
  r = res(); await auth.register({ body: { name: "Sneaky", email: "sneaky@x.com", password: "secret1", requestedRole: "admin" } }, r); assert.equal(created.at(-1).requestedRole, "student"); ok("asking to be an 'admin' at sign-up is ignored (student/teacher/manager only)");
  transporter.sendMail = async () => { throw new Error("SMTP down"); };
  r = res(); await auth.register({ body: { name: "Quiet", email: "quiet@x.com", password: "secret1" } }, r); assert.equal(r.body.sucess, true); ok("a failing e-mail never fails the registration");
  transporter.sendMail = async (m) => { sent.push(m); return {}; };
  // first account ever
  db = []; created = [];
  r = res(); await auth.register({ body: { name: "Founder", email: "founder@x.com", password: "secret1" } }, r);
  assert.equal(created[0].userType, "admin"); assert.equal(created[0].accountStatus, "approved"); ok("on a brand-new installation the FIRST account becomes the (approved) admin - nobody could approve it otherwise");
  reset();
}

// ================================================================== login
{
  const bcrypt = (await import(path.join(root, "node_modules/bcryptjs/index.js"))).default;
  const hash = await bcrypt.hash("pw12345", 4);
  db.push(mkUser(oid(60), "Pend", "student", { password: hash, accountStatus: "pending", email: "pend@x.com" }), mkUser(oid(61), "Rej", "student", { password: hash, accountStatus: "rejected", rejectedReason: "Not a student of ours", email: "rej@x.com" }), mkUser(oid(62), "Old", "student", { password: hash, email: "Old@x.com" }));
  let r = res(); await auth.login({ body: { email: "pend@x.com", password: "pw12345" } }, r); assert.equal(r.body.sucess, true); assert.equal(r.body.accountStatus, "pending"); assert.equal(r.cookies.length, 1); ok("pending account CAN log in (to see the 'in review' page)");
  r = res(); await auth.login({ body: { email: "rej@x.com", password: "pw12345" } }, r); assert.equal(r.body.sucess, false); assert.match(r.body.message, /not approved.*Not a student of ours/); assert.equal(r.cookies.length, 0); ok("rejected account cannot log in and sees the reason");
  r = res(); await auth.login({ body: { email: "old@X.com", password: "pw12345" } }, r); assert.equal(r.body.sucess, true); assert.equal(r.body.accountStatus, "approved"); ok("an existing account logs in as before (e-mail case does not matter)");
  r = res(); await auth.login({ body: { email: "old@x.com", password: "wrong" } }, r); assert.equal(r.body.sucess, false);
  reset();
}

// ================================================================== approvals
{
  db.push(mkUser(oid(70), "Tina", "student", { accountStatus: "pending", requestedRole: "teacher" }), mkUser(oid(71), "Sam", "student", { accountStatus: "pending", requestedRole: "student" }), mkUser(oid(72), "Mia", "student", { accountStatus: "pending", requestedRole: "manager" }), mkUser(oid(73), "Gone", "student", { accountStatus: "rejected" }));
  let r = res(); await uc.listAccounts(as(U(ADMIN), { query: {} }), r); assert.deepEqual(r.body.data.map((a) => a.name).sort(), ["Mia", "Sam", "Tina"]); assert.deepEqual(r.body.counts, { pending: 3, rejected: 1 }); assert.equal(r.body.data.find((a) => a.name === "Tina").requestedRole, "teacher"); ok("approvals list: pending requests with the role each asked for + counters");
  r = res(); await uc.listAccounts(as(U(ADMIN), { query: { status: "rejected" } }), r); assert.deepEqual(r.body.data.map((a) => a.name), ["Gone"]);
  sent.length = 0; r = res(); await uc.approveAccount(as(U(ADMIN), { params: { id: oid(70) }, body: { role: "teacher" } }), r);
  assert.equal(r.code, 200); assert.equal(U(oid(70)).userType, "teacher"); assert.equal(U(oid(70)).accountStatus, "approved"); assert.equal(U(oid(70)).approvedBy, ADMIN); ok("admin approves as TEACHER: role set, status approved, who/when saved");
  assert.equal(sent.length, 1); assert.ok(sent[0].subject.includes("approved") && sent[0].subject.includes("Teacher") && sent[0].html.includes("/teacher") && sent[0].html.includes("Record payments")); ok("the person gets an 'approved - you are now a Teacher' e-mail with a link to the teacher dashboard");
  sent.length = 0; r = res(); await uc.approveAccount(as(U(ADMIN), { params: { id: oid(71) }, body: {} }), r); assert.equal(U(oid(71)).userType, "student"); assert.ok(sent[0].html.includes("/studentdash")); ok("no role given → the role they asked for (student) and the student dashboard link");
  sent.length = 0; r = res(); await uc.approveAccount(as(U(ADMIN), { params: { id: oid(72) }, body: { role: "manager" } }), r); assert.equal(U(oid(72)).userType, "manager"); assert.ok(sent[0].html.includes("/admin") && sent[0].html.includes("Create schedules")); ok("approve as MANAGER");
  r = res(); await uc.approveAccount(as(U(ADMIN), { params: { id: oid(70) }, body: {} }), r); assert.equal(r.code, 400); ok("an already approved account cannot be approved again");
  db.push(mkUser(oid(74), "Eve", "student", { accountStatus: "pending" }));
  r = res(); await uc.approveAccount(as(U(ADMIN), { params: { id: oid(74) }, body: { role: "admin" } }), r); assert.equal(r.code, 400); assert.equal(U(oid(74)).accountStatus, "pending"); ok("approval can only make a student, teacher or manager (not admin)");
  sent.length = 0; r = res(); await uc.rejectAccount(as(U(ADMIN), { params: { id: oid(74) }, body: { reason: "Unknown person" } }), r);
  assert.equal(U(oid(74)).accountStatus, "rejected"); assert.equal(U(oid(74)).rejectedReason, "Unknown person"); assert.ok(sent[0].html.includes("Unknown person") && sent[0].html.includes("not approved")); ok("reject: status + reason saved, the person is e-mailed the reason");
  r = res(); await uc.rejectAccount(as(U(ADMIN), { params: { id: ADMIN }, body: {} }), r); assert.equal(r.code, 400); ok("an admin account cannot be rejected");
  reset();
}

// ================================================================== role changes (the old userId bug)
{
  let r = res(); await uc.updateUserTypeAlt(as(U(ADMIN), { body: { userId: ADMIN, targetUserId: S1, userType: "teacher" } }), r);
  assert.equal(U(S1).userType, "teacher"); assert.equal(U(ADMIN).userType, "admin"); ok("BUG FIX: the role of the SELECTED user changes (the auth middleware overwrites body.userId with the admin's own id, which used to change the admin's own role)");
  r = res(); await uc.updateUserTypeAlt(as(U(ADMIN), { body: { targetUserId: ADMIN, userType: "student" } }), r); assert.equal(r.code, 400); assert.equal(U(ADMIN).userType, "admin"); ok("you cannot change your own role");
  r = res(); await uc.updateUserTypeAlt(as(U(ADMIN), { body: { targetUserId: S2, userType: "superuser" } }), r); assert.equal(r.code, 400); ok("unknown roles are rejected");
  db.push(mkUser(oid(5), "Second Admin", "admin"));
  r = res(); await uc.updateUserTypeAlt(as(U(ADMIN), { body: { targetUserId: oid(5), userType: "teacher" } }), r); assert.equal(r.code, 200);
  r = res(); await uc.updateUserTypeAlt(as(U(oid(5)), { body: { targetUserId: ADMIN, userType: "teacher" } }), r); assert.equal(r.code, 400); assert.match(r.body.message, /at least one admin/); ok("the LAST admin cannot be demoted");
  reset();
}

// ================================================================== OTP e-mails
{
  const bcrypt = (await import(path.join(root, "node_modules/bcryptjs/index.js"))).default;
  const u = db.find((x) => x._id === S1);
  sent.length = 0;
  let r = res(); await auth.resetPasswordOtp({ body: { email: "ASHA@x.com" } }, r);
  assert.equal(r.body.sucess, true); assert.equal(sent.length, 1); const first = u.resetOtp; assert.match(first, /^\d{6}$/); ok("forgot password: ONE e-mail with a 6-digit OTP");
  r = res(); await auth.resetPasswordOtp({ body: { email: "asha@x.com" } }, r); await auth.resetPasswordOtp({ body: { email: "asha@x.com" } }, res());
  assert.equal(sent.length, 1); assert.equal(u.resetOtp, first); assert.equal(r.body.alreadySent, true); assert.ok(r.body.retryAfter > 0); ok("BUG FIX: a double click / second request inside 60 s sends NO second e-mail and keeps the same OTP valid");
  u.resetOtpSentAt = Date.now() - 61000;
  r = res(); await auth.resetPasswordOtp({ body: { email: "asha@x.com" } }, r); assert.equal(sent.length, 2); assert.notEqual(u.resetOtp, undefined); ok("after 60 s a new OTP can be requested (resend)");
  const good = u.resetOtp;
  r = res(); await auth.verifyResetOtp({ body: { email: "asha@x.com", otp: "000000" } }, r); assert.equal(r.body.sucess, false); assert.match(r.body.message, /4 attempts left/); ok("wrong OTP is reported at the OTP step (not after choosing a password), with attempts left");
  r = res(); await auth.verifyResetOtp({ body: { email: "asha@x.com", otp: good } }, r); assert.equal(r.body.sucess, true); assert.equal(u.resetOtp, good); ok("correct OTP passes the check and is NOT consumed yet");
  r = res(); await auth.resetPassword({ body: { email: "asha@x.com", otp: good, newPassword: "123" } }, r); assert.equal(r.body.sucess, false); ok("new password must be at least 6 characters");
  r = res(); await auth.resetPassword({ body: { email: "asha@x.com", otp: good, newPassword: "brandnew1" } }, r);
  assert.equal(r.body.sucess, true); assert.ok(await bcrypt.compare("brandnew1", u.password)); assert.equal(u.resetOtp, ""); ok("password reset works and the OTP is used up");
  r = res(); await auth.resetPassword({ body: { email: "asha@x.com", otp: good, newPassword: "again123" } }, r); assert.equal(r.body.sucess, false); ok("the same OTP cannot be used twice");
  // brute force
  u.resetOtp = "123456"; u.resetOtpExpireAt = Date.now() + 60000; u.resetOtpAttempts = 0;
  for (let i = 0; i < 5; i++) await auth.verifyResetOtp({ body: { email: "asha@x.com", otp: "999999" } }, res());
  r = res(); await auth.verifyResetOtp({ body: { email: "asha@x.com", otp: "123456" } }, r); assert.equal(r.body.sucess, false); assert.match(r.body.message, /Too many wrong attempts/); ok("after 5 wrong guesses even the right OTP is refused (brute-force protection)");
  r = res(); await auth.resetPasswordOtp({ body: { email: "nobody@x.com" } }, r); assert.equal(r.body.sucess, false);
  // verification OTP
  sent.length = 0; u.verifyOtp = ""; u.verifyOtpSentAt = 0; u.isAccountVerified = false;
  r = res(); await auth.sendVerifyOtp({ body: { userId: S1 } }, r); await auth.sendVerifyOtp({ body: { userId: S1 } }, res()); assert.equal(sent.length, 1); ok("e-mail verification OTP is also sent only once for a double click");
  reset();
}

// ================================================================== teacher scope
{
  const day = (d) => new Date(Date.UTC(2026, 11, d));
  const cls = (id, instr, students, over = {}) => ({ _id: oid(id), className: "Python", classDate: day(20), classTime: "10:00", classDuration: "1", instructorId: instr, studentsEnrolled: students, classRate: 500, attendance: "Absent", ...over });
  let classes = [cls(100, T1, [S1, S2]), cls(101, T2, [S3])];
  let extras = [{ instructorId: T1, createdBy: T1, studentsEnrolled: [S1] }, { instructorId: T2, createdBy: T2, studentsEnrolled: [S3] }];
  classSchedule.find = (f = {}) => query(() => classes.filter((c) => (!f.instructorId || c.instructorId === f.instructorId) && (!f.studentsEnrolled?.$in || c.studentsEnrolled.some((s) => f.studentsEnrolled.$in.includes(s)))));
  ExtraClass.find = (f = {}) => query(() => extras.filter((e) => !f.$or || f.$or.some((c) => Object.entries(c).every(([k, v]) => e[k] === v))));
  classSchedule.findById = (id) => query(() => { const c = classes.find((x) => String(x._id) === String(id)); if (c) { c.save = async () => c; } return c || null; });

  assert.deepEqual((await scope.studentScope(U(T1))).sort(), [S1, S2]); assert.deepEqual(await scope.studentScope(U(T2)), [S3]); ok("a teacher's students = the students in classes they teach");
  assert.equal(await scope.studentScope(U(ADMIN)), null); assert.equal(await scope.studentScope(U(MGR)), null); ok("admin and manager see every student (no scope)");
  extras.push({ instructorId: T1, createdBy: ADMIN, studentsEnrolled: [S3] });
  assert.deepEqual((await scope.studentScope(U(T1))).sort(), [S1, S2, S3]); extras.pop(); ok("…students of extra / substitute classes they teach count too");

  // users list
  let seen; const orig = userModel.find;
  userModel.find = (f) => { seen = f; return orig(f); };
  let r = res(); await uc.getAllUsers(as(U(T1)), r);
  const names = r.body.data.map((x) => x.name).sort();
  assert.ok(!names.includes("Meera") && names.includes("Asha") && names.includes("Ravi") && names.includes("Admin Boss")); ok("teacher's user list: their own students + staff, NOT other teachers' students");
  r = res(); await uc.getAllUsers(as(U(ADMIN)), r); assert.ok(r.body.data.map((x) => x.name).includes("Meera")); ok("admin's user list: everyone");
  db.push(mkUser(oid(80), "Pending Pete", "student", { accountStatus: "pending" })); r = res(); await uc.getAllUsers(as(U(ADMIN)), r); assert.ok(!r.body.data.some((x) => x.name === "Pending Pete")); ok("pending accounts are not in the normal user lists");
  userModel.find = orig;

  // classes
  let filt; classSchedule.find = (f) => { filt = f; return query(() => []); };
  const sortable = () => ({ sort: () => ({ lean: async () => [] }) }); classSchedule.find = (f) => { filt = f; return sortable(); };
  r = res(); await sched.getAllClasses(as(U(T1)), r); assert.deepEqual(filt, { instructorId: T1 }); ok("teacher sees only the classes THEY teach");
  r = res(); await sched.getAllClasses(as(U(S1)), r); assert.deepEqual(filt, { studentsEnrolled: S1 }); r = res(); await sched.getAllClasses(as(U(MGR)), r); assert.deepEqual(filt, {}); ok("student: own classes; manager/admin: all");
  classSchedule.find = (f = {}) => query(() => classes.filter((c) => (!f.instructorId || c.instructorId === f.instructorId) && (!f.studentsEnrolled?.$in || c.studentsEnrolled.some((s) => f.studentsEnrolled.$in.includes(s)))));

  // schedule creation: the instructor must be a teacher / admin
  classSchedule.insertMany = async (docs) => docs;
  const body = { className: "Py", studentsEnrolled: [S1], classLink: "https://m.t", classDuration: "1", classRate: 500, weeklySchedule: [{ date: "2026-12-20", time: "10:00" }] };
  r = res(); await sched.classCreate(as(U(ADMIN), { body: { ...body, instructorId: S2 } }), r); assert.equal(r.code, 400); assert.match(r.body.message, /teacher/); ok("the instructor of a new schedule must be a teacher or admin (not a student)");
  r = res(); await sched.classCreate(as(U(ADMIN), { body: { ...body, instructorId: MGR } }), r); assert.equal(r.code, 400); ok("…nor a manager");
  r = res(); await sched.classCreate(as(U(ADMIN), { body: { ...body, instructorId: T1 } }), r); assert.equal(r.code, 201); ok("a teacher can be set as the instructor");

  // attendance
  classSchedule.findByIdAndUpdate = async (id, upd) => ({ ...classes[0], ...upd, toObject() { return this; } });
  const prevFind = classSchedule.findById;
  classSchedule.findById = (id) => query(() => classes.find((c) => String(c._id) === String(id)) || null);
  r = res(); await sched.markAttendance(as(U(T2), { body: { id: oid(100), attendance: "Present" } }), r); assert.equal(r.code, 403); ok("a teacher cannot mark attendance for ANOTHER teacher's class");
  r = res(); await sched.markAttendance(as(U(T1), { body: { id: oid(100), attendance: "Present" } }), r); assert.equal(r.code, 200); ok("…but can for their own");
  r = res(); await sched.markAttendance(as(U(MGR), { body: { id: oid(100), attendance: "Present" } }), r); assert.equal(r.code, 200); ok("manager / admin can mark any class");
  classSchedule.findById = prevFind;

  // homework
  const hws = [{ _id: oid(200), studentId: S1, status: "pending" }, { _id: oid(201), studentId: S3, status: "pending" }];
  let hFilter; homeworkModel.find = (f) => { hFilter = f; return { sort: () => ({ lean: async () => hws.filter((h) => !f.studentId?.$in || f.studentId.$in.includes(h.studentId)) }) }; };
  r = res(); await hw.getAllHomework(as(U(T1)), r); assert.deepEqual(r.body.map((h) => h.studentId), [S1]); ok("teacher sees homework of their students only");
  r = res(); await hw.getAllHomework(as(U(ADMIN)), r); assert.equal(r.body.length, 2);
  r = res(); await hw.createHomework(as(U(T1), { body: { studentId: S3, studentName: "Meera", classScheduleId: "c", homeworkTitle: "t", homeworkDescription: "d" } }), r); assert.equal(r.code, 403); ok("a teacher cannot assign homework to someone else's student");
  homeworkModel.findById = (id) => query(() => hws.find((h) => String(h._id) === String(id)) || null);
  r = res(); await hw.updateHomework(as(U(T1), { params: { id: oid(201) }, body: { status: "completed" } }), r); assert.equal(r.code, 403);
  r = res(); await hw.deleteHomework(as(U(T1), { params: { id: oid(201) } }), r); assert.equal(r.code, 403); ok("…nor edit or delete it");
  r = res(); await hw.getHomeworkByStudentId(as(U(T1), { params: { studentId: S3 } }), r); assert.equal(r.code, 403);

  // coding questions
  QuestionAssignment.find = () => query(() => []);
  let inserted = []; QuestionAssignment.insertMany = async (rows) => { inserted = rows; return rows; };
  CodeQuestion.findById = () => query(() => ({ _id: oid(300), title: "Q", language: "python", difficulty: "easy", createdBy: T1 }));
  r = res(); await qc.assignQuestion(as(U(T1), { params: { id: oid(300) }, body: { studentIds: [S1, S3] } }), r);
  assert.deepEqual(inserted.map((x) => x.studentId), [S1]); ok("a teacher assigning a question to [own student, someone else's] → only their own student gets it");
  inserted = []; r = res(); await qc.assignQuestion(as(U(T1), { params: { id: oid(300) }, body: { studentIds: [S3] } }), r); assert.equal(r.code, 400); assert.match(r.body.message, /your own students/); ok("…and if none are theirs: a clear error");
  const asg = { _id: oid(400), studentId: S3, status: "submitted", submissions: [{}], async save() { return this; }, toObject() { return { ...this }; }, questionId: oid(300) };
  QuestionAssignment.findById = () => query(() => asg); const prevQA = QuestionAssignment.findById; QuestionAssignment.findById = (id) => { const p = Promise.resolve(asg); p.lean = async () => asg; return p; };
  r = res(); await qc.reviewSubmission(as(U(T1), { params: { aid: oid(400) }, body: { status: "accepted" } }), r); assert.equal(r.code, 403); ok("a teacher cannot review/approve another teacher's student");
  r = res(); await qc.getAssignment(as(U(T1), { params: { aid: oid(400) } }), r); assert.equal(r.code, 403);
  QuestionAssignment.findById = prevQA;
  let qFilter; QuestionAssignment.find = (f) => { qFilter = f; return { sort: () => ({ limit: () => ({ lean: async () => [] }) }) }; }; QuestionAssignment.aggregate = async () => []; CodeQuestion.find = () => query(() => []); QuestionFolder.find = () => query(() => []);
  r = res(); await qc.reviewQueue(as(U(T1), { query: {} }), r); assert.deepEqual(qFilter.studentId, { $in: [S1, S2] }); ok("the 'Submissions to Review' queue is limited to the teacher's students");

  // extra classes
  ExtraClass.create = async (d) => ({ _id: oid(500), status: "scheduled", ...d, attendance: [], toObject() { return { ...this }; }, async save() { return this; } });
  const good = { type: "extra", title: "Doubt", date: "2026-12-22", time: "17:00", duration: 1, classLink: "https://m.t/x" };
  r = res(); await ec.createExtraClass(as(U(T1), { body: { ...good, studentIds: [S3] } }), r); assert.equal(r.code, 403); assert.match(r.body.message, /own students/); ok("a teacher cannot schedule an extra class for another teacher's student");
  ChatThread.findOneAndUpdate = async () => ({}); ChatMessage.create = async (d) => ({ ...d, _id: oid(600), toObject() { return { ...this }; } }); ChatReadState.find = () => query(() => []); ChatReadState.bulkWrite = async () => {}; ChatMessage.countDocuments = async () => 0;
  r = res(); await ec.createExtraClass(as(U(T1), { body: { ...good, studentIds: [S1], instructorId: T2 } }), r); assert.equal(r.code, 201); assert.equal(r.body.data.instructorId, T1); ok("a teacher can create it for their own student - and always teaches it themselves (the 'instructor' field is ignored)");
  ExtraClass.findById = async () => ({ _id: oid(501), instructorId: T2, createdBy: T2, status: "scheduled", studentsEnrolled: [S3], attendance: [], toObject() { return { ...this }; }, async save() { return this; } });
  r = res(); await ec.updateExtraClass(as(U(T1), { params: { id: oid(501) }, body: { status: "cancelled" } }), r); assert.equal(r.code, 403); r = res(); await ec.deleteExtraClass(as(U(T1), { params: { id: oid(501) } }), r); assert.equal(r.code, 403); ok("…and cannot cancel / delete another teacher's extra class");
  let rf; classSchedule.find = (f) => { rf = f; return query(() => []); };
  r = res(); await ec.replaceableClasses(as(U(T1), { query: { studentIds: S1 } }), r); assert.equal(rf.instructorId, T1); ok("substitute: a teacher can only replace classes they teach");
  const subBody = { type: "substitute", date: "2026-12-23", time: "17:00", classLink: "https://m.t/s", replacesClassId: oid(101), studentIds: [S3] };
  classSchedule.findById = (id) => { const c = classes.find((x) => String(x._id) === String(id)); return { then: (a, b) => Promise.resolve(c ? { ...c, classDate: day(25), save: async () => {} } : null).then(a, b) }; };
  r = res(); await ec.createExtraClass(as(U(T1), { body: subBody }), r); assert.equal(r.code, 403); assert.match(r.body.message, /classes that you teach/); ok("…a substitute for another teacher's class is refused");

  // class notes
  const prev = classSchedule.findById;
  classSchedule.findById = () => query(() => ({ _id: oid(101), className: "Py", instructorId: T2, studentsEnrolled: [S3], classDate: day(20), classTime: "10:00" }));
  r = res(); await cn.createClassNote(as(U(T1), { body: { classScheduleId: oid(101), title: "n", file: {} } }), r); assert.equal(r.code, 403); ok("a teacher cannot attach notes to another teacher's class");
  classSchedule.findById = prev;
}

// ================================================================== chat with roles
{
  const room = (s, t) => `dm:${s}:${t}`;
  let a = await rooms.checkRoomAccess(U(T1), room(S1, T1)); assert.equal(a.ok, true); ok("a TEACHER can open a private chat with a student");
  a = await rooms.checkRoomAccess(U(MGR), room(S1, MGR)); assert.equal(a.ok, true); ok("…and so can a manager");
  a = await rooms.checkRoomAccess(U(S1), room(S1, T2)); assert.equal(a.ok, true); ok("a student can chat with ANY teacher");
  a = await rooms.checkRoomAccess(U(S1), room(S1, S2)); assert.equal(a.status, 403); a = await rooms.checkRoomAccess(U(S2), room(S1, S2)); assert.equal(a.status, 403); ok("student ↔ student stays blocked");
  a = await rooms.checkRoomAccess(U(T2), room(S1, T1)); assert.equal(a.status, 403); ok("another teacher cannot read it");
  a = await rooms.checkRoomAccess(U(T1), room(T2, T1)); assert.equal(a.status, 403); ok("a 'student' side that is really a teacher is refused");

  ChatSettings.findOne = () => query(() => null); ChatThread.findOneAndUpdate = async () => ({}); ChatReadState.find = () => query(() => []); ChatReadState.bulkWrite = async () => {}; ChatMessage.countDocuments = async () => 0;
  const stored = []; ChatMessage.create = async (d) => { const x = { ...d, _id: oid(700 + stored.length), toObject() { return { ...this }; } }; stored.push(x); return x; };
  let r = res(); await chat.sendMessage(as(U(T1), { body: { room: room(S1, T1), text: "hello" } }), r); assert.equal(stored[0].senderRole, "teacher"); ok("a teacher's message is stored with the role 'teacher' (not 'student')");
  r = res(); await chat.sendMessage(as(U(MGR), { body: { room: "community", text: "notice" } }), r); assert.equal(stored[1].senderRole, "manager"); assert.equal(r.code, 201); ok("manager can post in Community");
  r = res(); await chat.sendMessage(as(U(S1), { body: { room: "community", text: "hi" } }), r); assert.equal(r.code, 403); ok("student still cannot post in Community by default");
  assert.ok(sent.some((m) => m.to === "asha@x.com" && m.subject.includes("Teacher One (Teacher) sent you a message"))); ok("the student is e-mailed 'Teacher One (Teacher) sent you a message'");

  const chatClasses = [{ instructorId: T1, studentsEnrolled: [S1, S2] }, { instructorId: T2, studentsEnrolled: [S3] }];
  classSchedule.find = (f = {}) => query(() => chatClasses.filter((c) => !f.instructorId || c.instructorId === f.instructorId));
  ExtraClass.find = () => query(() => []);
  ChatThread.find = () => query(() => []); ChatReadState.findOne = () => query(() => ({ lastReadAt: new Date(0) })); ChatMessage.findOne = () => query(() => null);
  r = res(); await chat.listConversations(as(U(S1)), r);
  assert.deepEqual(r.body.data.slice(1).map((c) => c.peer.name).sort(), ["Admin Boss", "Manager Mo", "Teacher One", "Teacher Two"]); assert.deepEqual([...new Set(r.body.data.slice(1).map((c) => c.peer.role))].sort(), ["admin", "manager", "teacher"]); ok("a student's chat list = every teacher, manager and admin (with their role)");
  r = res(); await chat.listConversations(as(U(T1)), r); assert.deepEqual(r.body.data.slice(1).map((c) => c.peer.name).sort(), ["Asha", "Ravi"]); ok("a teacher's chat list = only THEIR students");
  r = res(); await chat.listConversations(as(U(ADMIN)), r); assert.equal(r.body.data.slice(1).length, 3); ok("admin's chat list = all students");
  r = res(); await chat.listMembers(as(U(S1)), r); assert.ok(r.body.data.every((m) => roles.isStaffRole(m.role))); ok("students only see staff in the Members panel");
}
console.log(`\n${n} roles / approvals / auth / scope checks passed`);
