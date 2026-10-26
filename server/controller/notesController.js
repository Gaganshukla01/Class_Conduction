import Note from "../model/notesModel.js";
import { escapeRegex } from "../utils/time.js";

const isAdmin = (req) => req.user?.userType === "admin";
const ownsOrAdmin = (req, studentId) =>
  isAdmin(req) || String(studentId) === String(req.userId);

export const getAllNotes = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!ownsOrAdmin(req, studentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    const notes = await Note.find({ studentId }).sort({ lastModified: -1 });

    res.status(200).json({
      success: true,
      data: notes,
      message: "Notes retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving notes",
      error: error.message,
    });
  }
};

// Create a new note
export const createNote = async (req, res) => {
  try {
    const { title, content, subject, tags } = req.body;
    // Students can only create notes for themselves
    const studentId = isAdmin(req) && req.body.studentId ? req.body.studentId : req.userId;

    // Validate required fields
    if (!title || !content || !subject || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Title, content, subject, and studentId are required",
      });
    }

    // Create new note
    const newNote = new Note({
      title,
      content,
      subject,
      tags: tags || [],
      studentId,
      lastModified: new Date(),
    });

    const savedNote = await newNote.save();

    res.status(201).json({
      success: true,
      data: savedNote,
      message: "Note created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating note",
      error: error.message,
    });
  }
};

// Update a note
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, subject, tags } = req.body;

    const existing = await Note.findById(id).select("studentId");
    if (!existing) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    if (!ownsOrAdmin(req, existing.studentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    // Find and update the note
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      {
        title,
        content,
        subject,
        tags,
        lastModified: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedNote,
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating note",
      error: error.message,
    });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Note.findById(id).select("studentId");
    if (!existing) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    if (!ownsOrAdmin(req, existing.studentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting note",
      error: error.message,
    });
  }
};

// Search notes
export const searchNotes = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { q } = req.query;
    if (!ownsOrAdmin(req, studentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Escape user input: a raw regex from the query string allows ReDoS.
    const safeQ = escapeRegex(q);
    const notes = await Note.find({
      studentId,
      $or: [
        { title: { $regex: safeQ, $options: "i" } },
        { content: { $regex: safeQ, $options: "i" } },
        { subject: { $regex: safeQ, $options: "i" } },
        { tags: { $in: [new RegExp(safeQ, "i")] } },
      ],
    }).sort({ lastModified: -1 });

    res.status(200).json({
      success: true,
      data: notes,
      message: "Search completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching notes",
      error: error.message,
    });
  }
};
