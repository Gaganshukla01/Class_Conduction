import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import { accountStatusOf } from "../config/roles.js";

// Verifies the JWT cookie. The user id always comes from the token and
// overwrites any `userId` the client may have put in the body.
// NOTE: this does NOT check that the account is approved - use `anyUser` / `staffOnly` / ... for that.
const userAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Please log in again." });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode.id) {
      return res.status(401).json({ success: false, message: "Not Authorized. Please log in again." });
    }
    req.userId = String(tokenDecode.id);
    req.body = req.body || {};
    req.body.userId = req.userId; // kept for the existing controllers
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

// Loads the user and lets ONLY approved accounts through. A pending / rejected account can log in
// and see its "in review" screen (GET /api/user/data) but nothing else.
export const loadUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.userId).select("name email userType avatar accountStatus");
    if (!user) return res.status(401).json({ success: false, message: "User no longer exists." });
    const status = accountStatusOf(user);
    if (status !== "approved") {
      return res.status(403).json({
        success: false,
        code: status === "rejected" ? "ACCOUNT_REJECTED" : "ACCOUNT_PENDING",
        message: status === "rejected" ? "Your account request was not approved." : "Your account is still in review.",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load user." });
  }
};

// Use AFTER loadUser.
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.userType)) {
      return res.status(403).json({ success: false, message: "You do not have permission to do that." });
    }
    next();
  };

export const requireAdmin = [loadUser, requireRole("admin")]; // kept for old imports (after userAuth)

export const adminOnly = [userAuth, loadUser, requireRole("admin")];
// admin + manager: running the institute (create schedules, courses, change payments, ...)
export const opsOnly = [userAuth, loadUser, requireRole("admin", "manager")];
// admin + manager + teacher: everything a teacher may do (controllers narrow a teacher to their own students)
export const staffOnly = [userAuth, loadUser, requireRole("admin", "manager", "teacher")];
export const anyUser = [userAuth, loadUser];

export default userAuth;
