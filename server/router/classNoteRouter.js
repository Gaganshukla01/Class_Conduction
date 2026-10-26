import express from "express";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  listClassNotes,
  createClassNote,
  updateClassNote,
  deleteClassNote,
  trackClassNoteDownload,
} from "../controller/classNoteController.js";

export const classNoteRouter = express.Router();

classNoteRouter.get("/", anyUser, listClassNotes);
classNoteRouter.post("/", adminOnly, createClassNote);
classNoteRouter.post("/:id/download", anyUser, trackClassNoteDownload);
classNoteRouter.put("/:id", adminOnly, updateClassNote);
classNoteRouter.delete("/:id", adminOnly, deleteClassNote);
