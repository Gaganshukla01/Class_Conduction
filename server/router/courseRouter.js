import express from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controller/courseController.js";
import { opsOnly } from "../middlewares/userAuthMiddleware.js";

export const courseRouter = express.Router();

// Reading courses stays public (the landing page lists them).
courseRouter.get("/", getAllCourses);
courseRouter.get("/:id", getCourseById);
courseRouter.post("/add", opsOnly, createCourse);
courseRouter.put("/:id", opsOnly, updateCourse);
courseRouter.delete("/:id", opsOnly, deleteCourse);
