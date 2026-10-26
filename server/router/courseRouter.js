import express from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controller/courseController.js";
import { adminOnly } from "../middlewares/userAuthMiddleware.js";

export const courseRouter = express.Router();

// Reading courses stays public (the landing page lists them).
courseRouter.get("/", getAllCourses);
courseRouter.get("/:id", getCourseById);
courseRouter.post("/add", adminOnly, createCourse);
courseRouter.put("/:id", adminOnly, updateCourse);
courseRouter.delete("/:id", adminOnly, deleteCourse);
