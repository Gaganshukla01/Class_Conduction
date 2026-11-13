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
import { staffOnly, anyUser } from "../middlewares/userAuthMiddleware.js";

export const homeworkRouter = express.Router();

homeworkRouter.get("/", staffOnly, getAllHomework);
homeworkRouter.get("/student/:studentId", anyUser, getHomeworkByStudentId);
homeworkRouter.post("/add", staffOnly, createHomework);
homeworkRouter.put("/:id/submit", anyUser, submitHomework);
homeworkRouter.get("/:id", anyUser, getHomeworkById);
homeworkRouter.put("/:id", staffOnly, updateHomework);
homeworkRouter.delete("/:id", staffOnly, deleteHomework);
