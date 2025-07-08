import express from "express";
export const noteRouter = express.Router();
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
} from "../controller/notesController.js";

// Get all notes for a student
noteRouter.get("/student/:studentId", getAllNotes);

// Search notes
noteRouter.get("/student/:studentId/search", searchNotes);

// Create a new note
noteRouter.post("/", createNote);

// Update a note
noteRouter.put("/:id", updateNote);

// Delete a note
noteRouter.delete("/:id", deleteNote);
