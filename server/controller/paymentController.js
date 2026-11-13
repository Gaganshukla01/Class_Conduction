import mongoose from "mongoose";
import classSchedule from "../model/classesScheduleDetails.js";
import userModel from "../model/userModel.js";
import { Payment, nextReceiptNo } from "../model/paymentModel.js";
import { notifyPaymentReceipt, notifyPaymentVoided } from "../services/notificationService.js";
import { avatarOf } from "../services/cloudinaryService.js";
import { isStaffRole } from "../config/roles.js";
import { studentScope, inScope, classFilterFor, teachesClass } from "../services/scope.js";
import { classStart } from "../utils/time.js";

const METHODS = ["cash", "upi", "bank", "card", "other"];
const valid = (id) => mongoose.Types.ObjectId.isValid(id);
const APPROVED = { accountStatus: { $nin: ["pending", "rejected"] } };
const CLASS_FIELDS = "className classDate classTime classDuration classRate paid paymentId paymentUpdatedAt instructorId studentsEnrolled";

// What a student owes / has paid. `classFilter` narrows a teacher to the classes they teach.
async function ledgerFor(studentId, classFilter = {}) {
  const docs = await classSchedule.find({ studentsEnrolled: String(studentId), ...classFilter }).select(CLASS_FIELDS).lean();
  const now = new Date();
  const classes = docs
    .map((c) => {
      const start = classStart(c);
      return {
        classId: String(c._id),
        className: c.className,
        classDate: c.classDate,
        classTime: c.classTime,
        duration: c.classDuration,
        amount: Number(c.classRate) || 0,
        paid: Boolean(c.paid),
        paidAt: c.paymentUpdatedAt,
        paymentId: c.paymentId || null,
        held: start <= now,
        start,
      };
    })
    .sort((a, b) => b.start - a.start);

  const sum = (list) => list.reduce((n, c) => n + c.amount, 0);
  const pending = classes.filter((c) => c.held && !c.paid);
  const upcoming = classes.filter((c) => !c.held && !c.paid);
  const paid = classes.filter((c) => c.paid);

  const visible = new Set(classes.map((c) => c.classId));
  const receipts = (await Payment.find({ studentId: String(studentId) }).sort({ createdAt: -1 }).limit(200).lean()).filter(
    (p) => Object.keys(classFilter).length === 0 || p.items.some((i) => visible.has(i.classId))
  );
  return {
    totals: { pendingAmount: sum(pending), pendingCount: pending.length, upcomingAmount: sum(upcoming), upcomingCount: upcoming.length, paidAmount: sum(paid), paidCount: paid.length },
    classes,
    receipts,
  };
}

// ---------------------------------------------------------------------------
// staff: overview of every (own) student
// ---------------------------------------------------------------------------
export const summary = async (req, res) => {
  try {
    const scope = await studentScope(req.user);
    const filter = { ...classFilterFor(req.user) };
    if (scope !== null) filter.studentsEnrolled = { $in: scope };
    const docs = await classSchedule.find(filter).select(CLASS_FIELDS).lean();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rows = new Map();
    const row = (sid) => {
      if (!rows.has(sid)) rows.set(sid, { studentId: sid, pendingAmount: 0, pendingCount: 0, upcomingAmount: 0, upcomingCount: 0, paidAmount: 0, paidCount: 0, lastPaidAt: null });
      return rows.get(sid);
    };
    let collectedThisMonth = 0;
    for (const c of docs) {
      const amount = Number(c.classRate) || 0;
      const held = classStart(c) <= now;
      for (const sid of c.studentsEnrolled || []) {
        if (!inScope(scope, sid)) continue;
        const r = row(String(sid));
        if (c.paid) {
          r.paidAmount += amount; r.paidCount += 1;
          if (c.paymentUpdatedAt && (!r.lastPaidAt || c.paymentUpdatedAt > r.lastPaidAt)) r.lastPaidAt = c.paymentUpdatedAt;
          if (c.paymentUpdatedAt && new Date(c.paymentUpdatedAt) >= monthStart) collectedThisMonth += amount;
        } else if (held) { r.pendingAmount += amount; r.pendingCount += 1; }
        else { r.upcomingAmount += amount; r.upcomingCount += 1; }
      }
    }
    const ids = [...rows.keys()].filter(valid);
    const users = await userModel.find({ _id: { $in: ids }, userType: "student", ...APPROVED }).select("name email avatar").lean();
    const students = users
      .map((u) => ({ ...rows.get(String(u._id)), name: u.name, email: u.email, avatar: avatarOf(u) }))
      .sort((a, b) => b.pendingAmount - a.pendingAmount || a.name.localeCompare(b.name));

    const totals = students.reduce(
      (t, s) => ({ pendingAmount: t.pendingAmount + s.pendingAmount, pendingCount: t.pendingCount + s.pendingCount, upcomingAmount: t.upcomingAmount + s.upcomingAmount, paidAmount: t.paidAmount + s.paidAmount, paidCount: t.paidCount + s.paidCount, studentsWithDues: t.studentsWithDues + (s.pendingAmount > 0 ? 1 : 0) }),
      { pendingAmount: 0, pendingCount: 0, upcomingAmount: 0, paidAmount: 0, paidCount: 0, studentsWithDues: 0 }
    );
    res.status(200).json({ success: true, data: { totals: { ...totals, collectedThisMonth }, students } });
  } catch (error) {
    console.error("payment summary:", error);
    res.status(500).json({ success: false, message: "Could not load the payments." });
  }
};

// staff: one student's classes + receipts
export const studentLedger = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!valid(studentId)) return res.status(400).json({ success: false, message: "Invalid student." });
    if (!inScope(await studentScope(req.user), studentId)) return res.status(403).json({ success: false, message: "That student is not yours." });
    const student = await userModel.findOne({ _id: studentId, userType: "student" }).select("name email avatar").lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    const ledger = await ledgerFor(studentId, classFilterFor(req.user));
    res.status(200).json({ success: true, data: { student: { _id: studentId, name: student.name, email: student.email, avatar: avatarOf(student) }, ...ledger } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load the student's payments." });
  }
};

// the logged-in student's own payments page
export const myLedger = async (req, res) => {
  try {
    const ledger = await ledgerFor(req.userId);
    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load your payments." });
  }
};

// ---------------------------------------------------------------------------
// record a payment: marks the classes paid, issues a receipt and e-mails it
// ---------------------------------------------------------------------------
export const recordPayment = async (req, res) => {
  try {
    const { studentId } = req.body;
    const method = METHODS.includes(req.body.method) ? req.body.method : "cash";
    const classIds = [...new Set((Array.isArray(req.body.classIds) ? req.body.classIds : []).map(String))];
    if (!valid(studentId)) return res.status(400).json({ success: false, message: "Choose a student." });
    if (classIds.length === 0 || classIds.length > 100 || !classIds.every(valid)) {
      return res.status(400).json({ success: false, message: "Select the classes that were paid for (up to 100)." });
    }
    if (!inScope(await studentScope(req.user), studentId)) return res.status(403).json({ success: false, message: "You can only record payments for your own students." });

    const student = await userModel.findOne({ _id: studentId, userType: "student", ...APPROVED }).select("name email").lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    const docs = await classSchedule.find({ _id: { $in: classIds } }).select(CLASS_FIELDS).lean();
    if (docs.length !== classIds.length) return res.status(404).json({ success: false, message: "Some of the selected classes were not found." });
    for (const c of docs) {
      if (!(c.studentsEnrolled || []).map(String).includes(String(studentId))) return res.status(400).json({ success: false, message: `${student.name} is not enrolled in “${c.className}”.` });
      if (c.paid) return res.status(409).json({ success: false, message: `“${c.className}” on ${new Date(c.classDate).toISOString().slice(0, 10)} is already paid.` });
      if (!teachesClass(req.user, c)) return res.status(403).json({ success: false, message: "You can only record payments for classes you teach." });
    }

    const items = docs
      .sort((a, b) => classStart(a) - classStart(b))
      .map((c) => ({ classId: String(c._id), className: c.className, classDate: c.classDate, classTime: c.classTime, amount: Number(c.classRate) || 0 }));
    const payment = await Payment.create({
      receiptNo: await nextReceiptNo(),
      studentId: String(studentId),
      items,
      amount: items.reduce((n, i) => n + i.amount, 0),
      method,
      reference: String(req.body.reference || "").trim().slice(0, 120),
      note: String(req.body.note || "").trim().slice(0, 500),
      recordedBy: String(req.userId),
      recordedByName: req.user.name,
      recordedByRole: req.user.userType,
    });

    const result = await classSchedule.updateMany(
      { _id: { $in: classIds }, paid: { $ne: true } },
      { paid: true, paymentUpdatedAt: new Date(), paymentId: String(payment._id) }
    );
    if (result.modifiedCount !== classIds.length) {
      // somebody paid one of them a moment ago - undo this attempt completely
      await classSchedule.updateMany({ paymentId: String(payment._id) }, { paid: false, $unset: { paymentId: "" } });
      await Payment.deleteOne({ _id: payment._id });
      return res.status(409).json({ success: false, message: "Some of these classes were just marked paid by someone else. Please refresh and try again." });
    }

    // Receipt e-mail: the student, every admin, and the person who recorded it
    const email = await notifyPaymentReceipt(payment.toObject(), { student, recorder: req.user });
    res.status(201).json({
      success: true,
      message: `Payment of ₹${payment.amount.toLocaleString("en-IN")} recorded (receipt ${payment.receiptNo}).`,
      emailMessage: email.skipped ? "E-mails skipped (SMTP not configured)" : email.attempted ? `receipt e-mailed to ${email.sent} of ${email.attempted} people` : "",
      email,
      data: payment,
    });
  } catch (error) {
    console.error("recordPayment:", error);
    res.status(500).json({ success: false, message: "Could not record the payment." });
  }
};

// open one receipt: the student it belongs to, or staff who may see that student
export const getReceipt = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid receipt." });
    const payment = await Payment.findById(req.params.id).lean();
    if (!payment) return res.status(404).json({ success: false, message: "Receipt not found." });
    if (isStaffRole(req.user.userType)) {
      if (!inScope(await studentScope(req.user), payment.studentId)) return res.status(403).json({ success: false, message: "Not allowed." });
      // a teacher sees a receipt only if they recorded it or one of the classes on it is theirs
      if (req.user.userType === "teacher" && payment.recordedBy !== String(req.userId)) {
        const mine = await classSchedule.countDocuments({ _id: { $in: payment.items.map((i) => i.classId) }, instructorId: String(req.userId) });
        if (!mine) return res.status(403).json({ success: false, message: "Not allowed." });
      }
    } else if (payment.studentId !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed." });
    }
    const student = await userModel.findById(payment.studentId).select("name email").lean();
    res.status(200).json({ success: true, data: { ...payment, student: { name: student?.name, email: student?.email } } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load the receipt." });
  }
};

// admin / manager: cancel a receipt (the classes become unpaid again)
export const voidPayment = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid receipt." });
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Receipt not found." });
    if (payment.status === "voided") return res.status(400).json({ success: false, message: "This receipt is already cancelled." });
    payment.status = "voided";
    payment.voidedAt = new Date();
    payment.voidedBy = String(req.userId);
    payment.voidReason = String(req.body.reason || "").trim().slice(0, 300);
    await payment.save();
    await classSchedule.updateMany({ paymentId: String(payment._id) }, { paid: false, paymentUpdatedAt: new Date(), $unset: { paymentId: "" } });
    const student = await userModel.findById(payment.studentId).select("name email").lean();
    const email = await notifyPaymentVoided(payment.toObject(), { student, voidedBy: req.user });
    res.status(200).json({ success: true, message: "Receipt cancelled. The classes are unpaid again.", email, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not cancel the receipt." });
  }
};
