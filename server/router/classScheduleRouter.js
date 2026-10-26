import express from "express";
import {
  classCreate,
  getAllClasses,
  markAttendance,
  updatePaymentStatus,
  updateBatchPaymentStatus,
  getPaymentStats,
} from "../controller/classScheduleController.js";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";

export const classScheduleRouter = express.Router();

classScheduleRouter.post("/add", adminOnly, classCreate);
classScheduleRouter.get("/getallclasses", anyUser, getAllClasses);
classScheduleRouter.put("/markattendence", adminOnly, markAttendance);
classScheduleRouter.put("/updatePayment", adminOnly, updatePaymentStatus);
classScheduleRouter.put("/updatePaymentBatch", adminOnly, updateBatchPaymentStatus);
classScheduleRouter.get("/paymentStats", adminOnly, getPaymentStats);
