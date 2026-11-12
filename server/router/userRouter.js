import express from "express";
import userAuth, { adminOnly } from "../middlewares/userAuthMiddleware.js";
import {
  userData,
  updateUserTypeAlt,
  getAllUsers,
  setAvatar,
  removeAvatar,
} from "../controller/userController.js";

export const userRoutes = express.Router();

userRoutes.get("/data", userAuth, userData);
// SECURITY FIX: this route used to have no auth at all, so anyone could make
// any account an admin with a single request.
userRoutes.put("/usertypeupdate", adminOnly, updateUserTypeAlt);
userRoutes.get("/getalluser", adminOnly, getAllUsers);
userRoutes.put("/avatar", userAuth, setAvatar);
userRoutes.delete("/avatar", userAuth, removeAvatar);
