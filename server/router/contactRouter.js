import express from "express";

import {
  getAllContactInquiries,
  createContactInquiry,
} from "../controller/contactController.js";

export const contactRouter = express.Router();

contactRouter.post("/contact", createContactInquiry);
contactRouter.get("/contact", getAllContactInquiries);
