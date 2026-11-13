import express from "express";
import { staffOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
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
  assignBulk,
  moveQuestions,
  reviewQueue,
} from "../controller/questionController.js";

export const questionRouter = express.Router();

// Student
questionRouter.get("/assignments/mine", anyUser, myAssignments);
questionRouter.get("/assignments/:aid", anyUser, getAssignment);
questionRouter.post("/assignments/:aid/submit", anyUser, submitSolution);

// Admin
questionRouter.put("/assignments/:aid/review", staffOnly, reviewSubmission);
questionRouter.delete("/assignments/:aid", staffOnly, unassign);
questionRouter.get("/review-queue", staffOnly, reviewQueue);
questionRouter.post("/assign-bulk", staffOnly, assignBulk);
questionRouter.put("/move", staffOnly, moveQuestions);
questionRouter.get("/", staffOnly, listQuestions);
questionRouter.post("/", staffOnly, createQuestion);
questionRouter.put("/:id", staffOnly, updateQuestion);
questionRouter.delete("/:id", staffOnly, deleteQuestion);
questionRouter.post("/:id/assign", staffOnly, assignQuestion);
questionRouter.get("/:id/assignments", staffOnly, listQuestionAssignments);
