import express from "express";
import { anyUser } from "../middlewares/userAuthMiddleware.js";
import { executeCode, runStatus } from "../controller/codeRunController.js";

export const codeRunRouter = express.Router();
codeRunRouter.get("/status", anyUser, runStatus);
codeRunRouter.post("/run", anyUser, executeCode);
