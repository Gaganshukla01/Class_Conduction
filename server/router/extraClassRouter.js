import express from "express";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  createExtraClass, listExtraClasses, myExtraClasses, markExtraAttendance, updateExtraClass, deleteExtraClass,
} from "../controller/extraClassController.js";

export const extraClassRouter = express.Router();
extraClassRouter.get("/mine", anyUser, myExtraClasses);
extraClassRouter.get("/", adminOnly, listExtraClasses);
extraClassRouter.post("/", adminOnly, createExtraClass);
extraClassRouter.put("/:id/attendance", adminOnly, markExtraAttendance);
extraClassRouter.put("/:id", adminOnly, updateExtraClass);
extraClassRouter.delete("/:id", adminOnly, deleteExtraClass);
