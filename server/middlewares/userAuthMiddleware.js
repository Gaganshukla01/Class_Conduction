import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";

// Verifies the JWT cookie. The user id always comes from the token and
// overwrites any `userId` the client may have put in the body.
const userAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Please log in again.",
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode.id) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Please log in again.",
      });
    }
    req.userId = String(tokenDecode.id);
    req.body = req.body || {};
    req.body.userId = req.userId; // kept for the existing controllers
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

// Use AFTER userAuth. Loads the user and makes sure they are an admin.
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .select("name email userType");
    if (!user || user.userType !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Could not verify permissions." });
  }
};

// Use AFTER userAuth. Loads the user (any role) into req.user.
export const loadUser = async (req, res, next) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .select("name email userType");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Could not load user." });
  }
};

export const adminOnly = [userAuth, requireAdmin];
export const anyUser = [userAuth, loadUser];

export default userAuth;
