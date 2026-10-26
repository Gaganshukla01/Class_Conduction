import express from "express";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  assignQuestion,
  listQuestionAssignments,
  unassign,
  myAssignments,
  getAssignment,
  submitSolution,
  reviewSubmission,
} from "../controller/questionController.js";

export const questionRouter = express.Router();

// Student
questionRouter.get("/assignments/mine", anyUser, myAssignments);
questionRouter.get("/assignments/:aid", anyUser, getAssignment);
questionRouter.post("/assignments/:aid/submit", anyUser, submitSolution);

// Admin
questionRouter.put("/assignments/:aid/review", adminOnly, reviewSubmission);
questionRouter.delete("/assignments/:aid", adminOnly, unassign);
questionRouter.get("/", adminOnly, listQuestions);
questionRouter.post("/", adminOnly, createQuestion);
questionRouter.put("/:id", adminOnly, updateQuestion);
questionRouter.delete("/:id", adminOnly, deleteQuestion);
questionRouter.post("/:id/assign", adminOnly, assignQuestion);
questionRouter.get("/:id/assignments", adminOnly, listQuestionAssignments);
