import express from "express";
import { anyUser } from "../middlewares/userAuthMiddleware.js";
import { signUpload } from "../controller/uploadController.js";

export const uploadRouter = express.Router();
uploadRouter.post("/sign", anyUser, signUpload);
