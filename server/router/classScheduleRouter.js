import express from "express";
import {
  classCreate,
  getAllClasses,
  markAttendance,
  updatePaymentStatus,
  updateBatchPaymentStatus,
  getPaymentStats,
} from "../controller/classScheduleController.js";
import { opsOnly, staffOnly, anyUser } from "../middlewares/userAuthMiddleware.js";

export const classScheduleRouter = express.Router();

classScheduleRouter.post("/add", opsOnly, classCreate);
classScheduleRouter.get("/getallclasses", anyUser, getAllClasses);
classScheduleRouter.put("/markattendence", staffOnly, markAttendance);
classScheduleRouter.put("/updatePayment", opsOnly, updatePaymentStatus);
classScheduleRouter.put("/updatePaymentBatch", opsOnly, updateBatchPaymentStatus);
classScheduleRouter.get("/paymentStats", opsOnly, getPaymentStats);
