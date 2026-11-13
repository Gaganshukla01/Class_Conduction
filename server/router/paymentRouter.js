import express from "express";
import { anyUser, opsOnly, staffOnly } from "../middlewares/userAuthMiddleware.js";
import { summary, studentLedger, myLedger, recordPayment, getReceipt, voidPayment } from "../controller/paymentController.js";

export const paymentRouter = express.Router();

paymentRouter.get("/summary", staffOnly, summary); // teachers: their own students only
paymentRouter.get("/mine", anyUser, myLedger); // the student's own page
paymentRouter.get("/student/:studentId", staffOnly, studentLedger);
paymentRouter.post("/record", staffOnly, recordPayment); // teacher / manager / admin
paymentRouter.get("/receipt/:id", anyUser, getReceipt);
paymentRouter.post("/:id/void", opsOnly, voidPayment); // admin / manager only
