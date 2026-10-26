import express from "express";
import userAuth from "../middlewares/userAuthMiddleware.js";
import { executeCode, runStatus } from "../controller/codeRunController.js";

export const codeRunRouter = express.Router();
codeRunRouter.get("/status", userAuth, runStatus);
codeRunRouter.post("/run", userAuth, executeCode);
