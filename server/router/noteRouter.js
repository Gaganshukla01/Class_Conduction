import express from "express";
import { anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
} from "../controller/notesController.js";

export const noteRouter = express.Router();

// Every route requires a logged-in user; the controller checks ownership.
noteRouter.get("/student/:studentId", anyUser, getAllNotes);
noteRouter.get("/student/:studentId/search", anyUser, searchNotes);
noteRouter.post("/", anyUser, createNote);
noteRouter.put("/:id", anyUser, updateNote);
noteRouter.delete("/:id", anyUser, deleteNote);
