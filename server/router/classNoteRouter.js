import express from "express";
import { staffOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  listClassNotes,
  createClassNote,
  updateClassNote,
  deleteClassNote,
  trackClassNoteDownload,
} from "../controller/classNoteController.js";

export const classNoteRouter = express.Router();

classNoteRouter.get("/", anyUser, listClassNotes);
classNoteRouter.post("/", staffOnly, createClassNote);
classNoteRouter.post("/:id/download", anyUser, trackClassNoteDownload);
classNoteRouter.put("/:id", staffOnly, updateClassNote);
classNoteRouter.delete("/:id", staffOnly, deleteClassNote);
