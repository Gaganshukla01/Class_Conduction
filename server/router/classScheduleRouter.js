import express from "express";
import {
  classCreate,
  getAllClasses,
  markAttendance,
  updatePaymentStatus,
} from "../controller/classScheduleController.js";
export const classScheduleRouter = express.Router();

classScheduleRouter.post("/add", classCreate);
classScheduleRouter.get("/getallclasses", getAllClasses);
classScheduleRouter.put("/markattendence", markAttendance);
classScheduleRouter.put("/updatePayment", updatePaymentStatus);
