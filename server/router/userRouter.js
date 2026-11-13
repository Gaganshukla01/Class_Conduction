import express from "express";
import userAuth, { adminOnly, staffOnly } from "../middlewares/userAuthMiddleware.js";
import {
  userData,
  updateUserTypeAlt,
  getAllUsers,
  setAvatar,
  removeAvatar,
  listAccounts,
  approveAccount,
  rejectAccount,
  myStudents,
} from "../controller/userController.js";

export const userRoutes = express.Router();

// open to a PENDING account as well: the front end needs it to show the "your account is in review" screen
userRoutes.get("/data", userAuth, userData);
userRoutes.put("/avatar", userAuth, setAvatar);
userRoutes.delete("/avatar", userAuth, removeAvatar);

// staff (teachers only get their own students)
userRoutes.get("/getalluser", staffOnly, getAllUsers);
userRoutes.get("/my-students", staffOnly, myStudents);

// admin only: change a role, approve / reject new accounts
userRoutes.put("/usertypeupdate", adminOnly, updateUserTypeAlt);
userRoutes.get("/accounts", adminOnly, listAccounts);
userRoutes.put("/accounts/:id/approve", adminOnly, approveAccount);
userRoutes.put("/accounts/:id/reject", adminOnly, rejectAccount);
