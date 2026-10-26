import express from "express";
import { adminOnly } from "../middlewares/userAuthMiddleware.js";
import { dailyJob } from "../controller/jobsController.js";

export const jobsRouter = express.Router();

// Called by Vercel Cron (it sends `Authorization: Bearer <CRON_SECRET>`) or by
// any external scheduler (cron-job.org, GitHub Actions...) with the same header.
const cronAuth = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({
      success: false,
      message: "Automated alerts are disabled: set CRON_SECRET in the server .env.",
    });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

jobsRouter.get("/daily", cronAuth, dailyJob);
// Admins can also trigger it by hand from the panel.
jobsRouter.post("/run", adminOnly, dailyJob);
