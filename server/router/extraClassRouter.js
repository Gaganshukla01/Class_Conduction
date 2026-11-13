import express from "express";
import { staffOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  replaceableClasses, createExtraClass, listExtraClasses, myExtraClasses, markExtraAttendance, updateExtraClass, deleteExtraClass,
} from "../controller/extraClassController.js";

export const extraClassRouter = express.Router();
extraClassRouter.get("/mine", anyUser, myExtraClasses);
extraClassRouter.get("/replaceable", staffOnly, replaceableClasses);
extraClassRouter.get("/", staffOnly, listExtraClasses);
extraClassRouter.post("/", staffOnly, createExtraClass);
extraClassRouter.put("/:id/attendance", staffOnly, markExtraAttendance);
extraClassRouter.put("/:id", staffOnly, updateExtraClass);
extraClassRouter.delete("/:id", staffOnly, deleteExtraClass);
