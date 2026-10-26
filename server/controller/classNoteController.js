import mongoose from "mongoose";
import ClassNote from "../model/classNoteModel.js";
import classSchedule from "../model/classesScheduleDetails.js";
import {
  destroyAsset,
  validateUploadedFile,
  withFileUrls,
  ROOT_FOLDER,
} from "../services/cloudinaryService.js";
import { notifyClassNoteUploaded, summaryText } from "../services/notificationService.js";
import { classStart } from "../utils/time.js";

const isAdmin = (req) => req.user?.userType === "admin";

// "Class No. N" = position of this session among all sessions of the same
// class (same name AND same set of students), ordered by real start time.
async function sessionNumber(cls) {
  const enrolled = cls.studentsEnrolled || [];
  const siblings = await classSchedule
    .find({
      className: cls.className,
      studentsEnrolled: { $all: enrolled, $size: enrolled.length },
    })
    .select("_id classDate classTime")
    .lean();
  siblings.sort((a, b) => classStart(a) - classStart(b));
  const index = siblings.findIndex((s) => String(s._id) === String(cls._id));
  return index === -1 ? 1 : index + 1;
}

export const listClassNotes = async (req, res) => {
  try {
    const filter = isAdmin(req) ? {} : { studentsEnrolled: String(req.userId) };
    if (req.query.classScheduleId) filter.classScheduleId = String(req.query.classScheduleId);
    const notes = await ClassNote.find(filter)
      .sort({ className: 1, classNumber: 1, createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: notes.map((n) => withFileUrls(n)) });
  } catch (error) {
    console.error("listClassNotes:", error);
    res.status(500).json({ success: false, message: "Could not load class notes." });
  }
};

export const createClassNote = async (req, res) => {
  try {
    const { classScheduleId, title, description = "", file, notify = true } = req.body;
    if (!mongoose.Types.ObjectId.isValid(classScheduleId)) {
      return res.status(400).json({ success: false, message: "Select a class first." });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const cls = await classSchedule.findById(classScheduleId).lean();
    if (!cls) return res.status(404).json({ success: false, message: "Class not found." });

    const validFile = validateUploadedFile(file, `${ROOT_FOLDER}/class-notes`);
    const classNumber = await sessionNumber(cls);

    const note = await ClassNote.create({
      classScheduleId: String(cls._id),
      className: cls.className,
      classNumber,
      classDate: cls.classDate,
      title: title.trim().slice(0, 120),
      description: String(description).trim().slice(0, 500),
      file: validFile,
      uploadedBy: req.userId,
      studentsEnrolled: cls.studentsEnrolled || [],
    });

    const email = notify ? await notifyClassNoteUploaded(note.toObject()) : null;
    res.status(201).json({
      success: true,
      message: `Notes added to ${cls.className} - Class ${classNumber}`,
      data: withFileUrls(note),
      email,
      emailMessage: summaryText(email),
    });
  } catch (error) {
    console.error("createClassNote:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateClassNote = async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.title === "string" && req.body.title.trim()) update.title = req.body.title.trim().slice(0, 120);
    if (typeof req.body.description === "string") update.description = req.body.description.trim().slice(0, 500);
    const note = await ClassNote.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    res.status(200).json({ success: true, data: withFileUrls(note) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteClassNote = async (req, res) => {
  try {
    const note = await ClassNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    // Best effort: a Cloudinary hiccup must not leave a broken DB row behind.
    destroyAsset(note.file.publicId, note.file.resourceType).catch((e) =>
      console.error("destroyAsset:", e.message)
    );
    res.status(200).json({ success: true, message: "Notes deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the notes." });
  }
};

// Counts a download and returns the attachment URL. Students can only download
// notes of classes they are enrolled in.
export const trackClassNoteDownload = async (req, res) => {
  try {
    const note = await ClassNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    if (!isAdmin(req) && !note.studentsEnrolled.includes(String(req.userId))) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this class." });
    }
    note.downloads += 1;
    await note.save();
    res.status(200).json({ success: true, data: withFileUrls(note) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not start the download." });
  }
};
