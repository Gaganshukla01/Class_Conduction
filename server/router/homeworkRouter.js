import express from "express";
import {
  getAllHomework,
  getHomeworkById,
  getHomeworkByStudentId,
  createHomework,
  updateHomework,
  submitHomework,
  deleteHomework,
} from "../controller/homeWorkAssign.js";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";

export const homeworkRouter = express.Router();

homeworkRouter.get("/", adminOnly, getAllHomework);
homeworkRouter.get("/student/:studentId", anyUser, getHomeworkByStudentId);
homeworkRouter.post("/add", adminOnly, createHomework);
homeworkRouter.put("/:id/submit", anyUser, submitHomework);
homeworkRouter.get("/:id", anyUser, getHomeworkById);
homeworkRouter.put("/:id", adminOnly, updateHomework);
homeworkRouter.delete("/:id", adminOnly, deleteHomework);
