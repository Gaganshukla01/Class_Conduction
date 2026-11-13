import mongoose from "mongoose";
import userModel from "../model/userModel.js";
import classSchedule from "../model/classesScheduleDetails.js";
import { avatarOf, destroyAsset, validateUploadedFile, ROOT_FOLDER } from "../services/cloudinaryService.js";
import { ROLES, SIGNUP_ROLES, accountStatusOf, isStaffRole } from "../config/roles.js";
import { studentScope, classFilterFor } from "../services/scope.js";
import { notifyAccountDecision } from "../services/notificationService.js";
import { classStart } from "../utils/time.js";

// Works for pending / rejected accounts too: the front end needs it to show the "in review" screen.
export const userData = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ sucess: false, message: "user not found.." });
    }

    return res.json({
      sucess: true,
      message: {
        name: user.name,
        email: user.email,
        isAccountVerifed: user.isAccountVerified,
        userId: userId,
        userType: user.userType,
        accountStatus: accountStatusOf(user),
        requestedRole: user.requestedRole || "student",
        rejectedReason: user.rejectedReason || "",
        avatarUrl: avatarOf(user, 200),
      },
    });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

const APPROVED = { accountStatus: { $nin: ["pending", "rejected"] } }; // also matches accounts created before approvals existed

// ---------------------------------------------------------------------------
// Change a user's role (admin only).
// NOTE: the target is `targetUserId`. `userId` cannot be used - the auth middleware always overwrites it
// with the id of the person who is logged in (which used to make this change the ADMIN's own role).
// ---------------------------------------------------------------------------
export const updateUserTypeAlt = async (req, res) => {
  try {
    const targetUserId = req.body.targetUserId;
    const userType = req.body.userType;
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId) || !userType) {
      return res.status(400).json({ success: false, message: "Choose a user and a role." });
    }
    if (!ROLES.includes(userType)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${ROLES.join(", ")}.` });
    }
    if (String(targetUserId) === String(req.userId)) {
      return res.status(400).json({ success: false, message: "You cannot change your own role. Ask another admin." });
    }
    const target = await userModel.findById(targetUserId);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (target.userType === "admin" && userType !== "admin") {
      const admins = await userModel.countDocuments({ userType: "admin" });
      if (admins <= 1) return res.status(400).json({ success: false, message: "There must always be at least one admin." });
    }
    target.userType = userType;
    await target.save();
    return res.json({
      success: true,
      message: "User type updated successfully",
      data: { name: target.name, email: target.email, userType: target.userType, isAccountVerified: target.isAccountVerified },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// All approved users. A teacher only gets their own students (plus the staff).
export const getAllUsers = async (req, res) => {
  try {
    const scope = await studentScope(req.user);
    const filter =
      scope === null
        ? { ...APPROVED }
        : { ...APPROVED, $or: [{ userType: { $ne: "student" } }, { _id: { $in: scope.filter((id) => mongoose.Types.ObjectId.isValid(id)) } }] };
    const users = await userModel
      .find(filter)
      .select("-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt -resetOtpSentAt -resetOtpAttempts -verifyOtpSentAt");

    res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Account approvals (admin only)
// ---------------------------------------------------------------------------
const publicAccount = (u) => ({
  _id: String(u._id),
  name: u.name,
  email: u.email,
  requestedRole: u.requestedRole || "student",
  userType: u.userType,
  accountStatus: accountStatusOf(u),
  isAccountVerified: u.isAccountVerified,
  rejectedReason: u.rejectedReason || "",
  registeredAt: typeof u._id?.getTimestamp === "function" ? u._id.getTimestamp() : undefined,
  approvedAt: u.approvedAt,
  avatar: avatarOf(u),
});

export const listAccounts = async (req, res) => {
  try {
    const status = ["pending", "rejected"].includes(req.query.status) ? req.query.status : "pending";
    const [users, pending, rejected] = await Promise.all([
      userModel.find({ accountStatus: status }).sort({ _id: -1 }).limit(300),
      userModel.countDocuments({ accountStatus: "pending" }),
      userModel.countDocuments({ accountStatus: "rejected" }),
    ]);
    res.status(200).json({ success: true, data: users.map(publicAccount), counts: { pending, rejected } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load the requests." });
  }
};

export const approveAccount = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (accountStatusOf(user) === "approved") return res.status(400).json({ success: false, message: "This account is already approved." });
    // the admin decides the role; it defaults to what the person asked for
    const role = req.body.role || user.requestedRole || "student";
    if (!SIGNUP_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Approve as a student, a teacher or a manager." });
    }
    user.userType = role;
    user.accountStatus = "approved";
    user.approvedAt = new Date();
    user.approvedBy = String(req.userId);
    user.rejectedReason = "";
    await user.save();
    const email = await notifyAccountDecision(user, { approved: true });
    res.status(200).json({
      success: true,
      message: `${user.name} is now a ${role}. ${email.sent ? "An e-mail was sent." : email.skipped ? "(E-mail not configured.)" : "The e-mail could not be sent."}`,
      data: publicAccount(user),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectAccount = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.userType === "admin") return res.status(400).json({ success: false, message: "An admin account cannot be rejected." });
    const reason = String(req.body.reason || "").trim().slice(0, 500);
    user.accountStatus = "rejected";
    user.rejectedReason = reason;
    await user.save();
    await notifyAccountDecision(user, { approved: false, reason });
    res.status(200).json({ success: true, message: `${user.name}'s request was rejected.`, data: publicAccount(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// "My students" (teacher) / "Students" (admin, manager) with the numbers that matter
// ---------------------------------------------------------------------------
export const myStudents = async (req, res) => {
  try {
    const scope = await studentScope(req.user);
    const studentFilter = { userType: "student", ...APPROVED };
    if (scope !== null) studentFilter._id = { $in: scope.filter((id) => mongoose.Types.ObjectId.isValid(id)) };
    const students = await userModel.find(studentFilter).select("name email avatar").sort({ name: 1 }).lean();
    const ids = students.map((s) => String(s._id));
    if (ids.length === 0) return res.status(200).json({ success: true, data: [] });

    const classes = await classSchedule
      .find({ studentsEnrolled: { $in: ids }, ...classFilterFor(req.user) })
      .select("className classDate classTime classDuration studentsEnrolled attendance classRate paid")
      .lean();
    const now = new Date();
    const stats = new Map(ids.map((id) => [id, { courses: new Set(), total: 0, held: 0, present: 0, upcoming: 0, next: null, pendingAmount: 0, pendingCount: 0 }]));
    for (const c of classes) {
      const start = classStart(c);
      for (const sid of c.studentsEnrolled || []) {
        const st = stats.get(String(sid));
        if (!st) continue;
        st.courses.add(c.className);
        st.total += 1;
        if (start <= now) {
          st.held += 1;
          if (c.attendance === "Present") st.present += 1;
          if (!c.paid) { st.pendingAmount += Number(c.classRate) || 0; st.pendingCount += 1; }
        } else {
          st.upcoming += 1;
          if (!st.next || start < st.next.start) st.next = { start, className: c.className };
        }
      }
    }
    res.status(200).json({
      success: true,
      data: students.map((s) => {
        const st = stats.get(String(s._id));
        return {
          _id: String(s._id),
          name: s.name,
          email: s.email,
          avatar: avatarOf(s),
          courses: [...st.courses],
          totalClasses: st.total,
          heldClasses: st.held,
          upcomingClasses: st.upcoming,
          attendanceRate: st.held ? Math.round((st.present / st.held) * 100) : null,
          nextClass: st.next ? { className: st.next.className, at: st.next.start } : null,
          pendingAmount: st.pendingAmount,
          pendingCount: st.pendingCount,
        };
      }),
    });
  } catch (error) {
    console.error("myStudents:", error);
    res.status(500).json({ success: false, message: "Could not load your students." });
  }
};

// ---- profile photo (stored on Cloudinary; every avatar in the app uses this) ----
export const setAvatar = async (req, res) => {
  try {
    const file = validateUploadedFile(req.body.file, `${ROOT_FOLDER}/avatars/${req.userId}`, "image");
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const old = user.avatar?.publicId;
    user.avatar = { url: file.url, publicId: file.publicId };
    await user.save();
    if (old && old !== file.publicId) destroyAsset(old, "image").catch(() => {});
    res.status(200).json({ success: true, message: "Profile photo updated.", avatarUrl: avatarOf(user, 200) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const old = user.avatar?.publicId;
    user.avatar = undefined;
    await user.save();
    if (old) destroyAsset(old, "image").catch(() => {});
    res.status(200).json({ success: true, message: "Profile photo removed.", avatarUrl: null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not remove the photo." });
  }
};

export { isStaffRole };
