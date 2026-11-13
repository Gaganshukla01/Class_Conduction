import bcrypt from "bcryptjs";
import { jwtTokenGenrate } from "../config/jwtToken.js";
import userModel from "../model/userModel.js";
import transporter from "../config/nodeMailer.js";
import { PASSWORD_RESET_TEMPLATE, EMAIL_VERIFY_TEMPLATE } from "../config/emailTemplate.js";
import { SIGNUP_ROLES, accountStatusOf } from "../config/roles.js";
import { notifyRegistrationReceived, notifyAdminsNewSignup } from "../services/notificationService.js";

// The existing front end reads `sucess` (sic). Every reply below carries BOTH spellings.
const ok = (res, extra = {}) => res.json({ sucess: true, success: true, ...extra });
const fail = (res, message, extra = {}) => res.json({ sucess: false, success: false, message, ...extra });

const OTP_RESEND_SECONDS = 60; // a second request inside this window does NOT send a second e-mail
const MAX_OTP_ATTEMPTS = 5;

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cleanEmail = (email) => String(email || "").trim();
// e-mails are matched case-insensitively (Asha@x.com == asha@x.com)
const findByEmail = (email) => userModel.findOne({ email: new RegExp(`^${escapeRegex(cleanEmail(email))}$`, "i") });

const otpWait = (sentAt) => Math.max(0, Math.ceil((OTP_RESEND_SECONDS * 1000 - (Date.now() - (sentAt || 0))) / 1000));

// ---------------------------------------------------------------------------
// register: the account is created as PENDING and an admin approves it
// ---------------------------------------------------------------------------
export const register = async (req, res) => {
  const { name, password } = req.body;
  const email = cleanEmail(req.body.email);

  if (!name || !email || !password) return fail(res, "Missing Details");
  if (String(password).length < 6) return fail(res, "Password must be at least 6 characters.");

  try {
    if (await findByEmail(email)) return fail(res, "User Already Found..");

    const requestedRole = SIGNUP_ROLES.includes(req.body.requestedRole) ? req.body.requestedRole : "student";
    // a brand-new installation has nobody to approve the first account: it becomes the admin
    const firstEver = !(await userModel.exists({ userType: "admin" }));

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name: String(name).trim(),
      email,
      password: hashedPassword,
      requestedRole,
      ...(firstEver ? { userType: "admin", accountStatus: "approved", approvedAt: new Date() } : { userType: "student", accountStatus: "pending" }),
    });
    await user.save();

    jwtTokenGenrate(user, res); // logged in straight away - a pending account just sees the "in review" screen

    if (!firstEver) {
      // e-mails never fail the registration
      await notifyRegistrationReceived(user);
      await notifyAdminsNewSignup(user);
    }
    return ok(res, { message: firstEver ? "Registered as the first admin" : "Registered", accountStatus: accountStatusOf(user) });
  } catch (error) {
    return fail(res, error.message);
  }
};

// googleLogin
export const googleAuth = async (req, res) => {
  try {
    const { name, Validuser } = req.body;
    const email = cleanEmail(req.body.email);
    if (!name || !email || !Validuser) return fail(res, "Cred not fetched");

    const existingUser = await findByEmail(email);
    if (existingUser) {
      if (accountStatusOf(existingUser) === "rejected") return fail(res, "Your account request was not approved.");
      jwtTokenGenrate(existingUser, res);
      return ok(res, { message: "Login Successfull", accountStatus: accountStatusOf(existingUser) });
    }

    const requestedRole = SIGNUP_ROLES.includes(req.body.requestedRole) ? req.body.requestedRole : "student";
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);
    const firstEver = !(await userModel.exists({ userType: "admin" }));

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      isAccountVerified: true, // Google already verified the address
      requestedRole,
      ...(firstEver ? { userType: "admin", accountStatus: "approved", approvedAt: new Date() } : { userType: "student", accountStatus: "pending" }),
    });
    await newUser.save();
    jwtTokenGenrate(newUser, res);

    if (!firstEver) {
      await notifyRegistrationReceived(newUser);
      await notifyAdminsNewSignup(newUser);
    }
    return ok(res, { message: "User Created.", accountStatus: accountStatusOf(newUser) });
  } catch (error) {
    return fail(res, error.message);
  }
};

// for login user
export const login = async (req, res) => {
  const { password } = req.body;
  const email = cleanEmail(req.body.email);
  if (!email || !password) return fail(res, "Fill email and password..");

  try {
    const user = await findByEmail(email);
    if (!user) return fail(res, "email is  not valid.");

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) return fail(res, "Invalid password");

    const status = accountStatusOf(user);
    if (status === "rejected") {
      return fail(res, user.rejectedReason ? `Your account request was not approved: ${user.rejectedReason}` : "Your account request was not approved.");
    }

    jwtTokenGenrate(user, res);
    return ok(res, { message: status === "pending" ? "Your account is in review" : "Login Sucessfull", accountStatus: status });
  } catch (error) {
    return fail(res, error.message);
  }
};

// for logout user
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
  } catch (error) {
    return fail(res, "Error");
  }
  return ok(res, { message: "LoggedOut" });
};

// ---------------------------------------------------------------------------
// e-mail verification OTP
// ---------------------------------------------------------------------------
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) return fail(res, "User not found");

    if (user.isAccountVerified) return ok(res, { message: "Account is already verified", alreadyVerified: true });

    // a double click / second tab must not send a second OTP (the second would overwrite the first)
    const wait = otpWait(user.verifyOtpSentAt);
    if (user.verifyOtp && user.verifyOtpExpireAt > Date.now() && wait > 0) {
      return ok(res, { message: "An OTP was already sent to your e-mail.", alreadySent: true, retryAfter: wait });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    user.verifyOtpSentAt = Date.now();
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Verification OTP",
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
    });
    return ok(res, { message: "OTP SENDED", retryAfter: OTP_RESEND_SECONDS });
  } catch (error) {
    return fail(res, "Could not send the OTP. Please try again.");
  }
};

// take otp from user and verify that
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return fail(res, "Missing Deatils");

  try {
    const user = await userModel.findById(userId);
    if (!user) return fail(res, "User Not Found!!");

    if (user.verifyOtp === "" || user.verifyOtp !== String(otp)) return fail(res, "Invalid OTP");
    if (user.verifyOtpExpireAt < Date.now()) return fail(res, "OTP Expired..");

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();
    return ok(res, { message: "Account is verified.." });
  } catch (error) {
    return fail(res, "error");
  }
};

// user is verified or not ..
export const isAuthenticated = async (req, res) => {
  try {
    return ok(res, { message: "User is Autheticated" });
  } catch (error) {
    return fail(res, "Login Again User is not authenticated.");
  }
};

// ---------------------------------------------------------------------------
// forgot password: send OTP -> check OTP -> set new password
// ---------------------------------------------------------------------------
export const resetPasswordOtp = async (req, res) => {
  const email = cleanEmail(req.body.email);
  if (!email) return fail(res, "Email required.");

  try {
    const user = await findByEmail(email);
    if (!user) return fail(res, "user not found");

    // Idempotent: a double click, a slow connection or a second tab inside 60 seconds does NOT send another
    // e-mail (it would replace the OTP the person is already typing).
    const wait = otpWait(user.resetOtpSentAt);
    if (user.resetOtp && user.resetOtpExpireAt > Date.now() && wait > 0) {
      return ok(res, { message: "We already sent an OTP to your e-mail. Check your inbox (and Spam).", alreadySent: true, retryAfter: wait });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    user.resetOtpSentAt = Date.now();
    user.resetOtpAttempts = 0;
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Password Reset  OTP",
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
    });
    return ok(res, { message: "OTP sended to your registered mail id", retryAfter: OTP_RESEND_SECONDS });
  } catch (error) {
    return fail(res, "Could not send the OTP. Please try again.");
  }
};

// shared by "check OTP" and "reset": returns an error message, or "" when the OTP is right
const checkResetOtp = async (user, otp) => {
  if (!user.resetOtp) return "Please request a new OTP.";
  if (user.resetOtpExpireAt < Date.now()) return "Otp expired";
  if ((user.resetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    user.resetOtp = "";
    await user.save();
    return "Too many wrong attempts. Please request a new OTP.";
  }
  if (user.resetOtp !== String(otp)) {
    user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
    await user.save();
    const left = MAX_OTP_ATTEMPTS - user.resetOtpAttempts;
    return left > 0 ? `Otp does not match (${left} attempt${left === 1 ? "" : "s"} left)` : "Too many wrong attempts. Please request a new OTP.";
  }
  return "";
};

// step 2: the person typed the 6 digits - tell them NOW if it is wrong (not after choosing a password)
export const verifyResetOtp = async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { otp } = req.body;
  if (!email || !otp) return fail(res, "Empty Field is not allowed");
  try {
    const user = await findByEmail(email);
    if (!user) return fail(res, "user not found");
    const problem = await checkResetOtp(user, otp);
    return problem ? fail(res, problem) : ok(res, { message: "OTP verified" });
  } catch (error) {
    return fail(res, "Error Occured");
  }
};

// step 3: set the new password
export const resetPassword = async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return fail(res, "Empty Field is not allowed");
  if (String(newPassword).length < 6) return fail(res, "Password must be at least 6 characters.");
  try {
    const user = await findByEmail(email);
    if (!user) return fail(res, "user not found");
    const problem = await checkResetOtp(user, otp);
    if (problem) return fail(res, problem);

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    user.resetOtpAttempts = 0;
    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Your Password Changed Sucesfully",
        text: `Password Reset Sucessfully for emailId:${user.email}`,
      });
    } catch (e) { /* the password IS changed - a failing confirmation e-mail must not say otherwise */ }
    return ok(res, { message: "Password Changed Sucesfully." });
  } catch (error) {
    return fail(res, "Error Occured");
  }
};
