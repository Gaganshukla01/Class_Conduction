import mongoose from "mongoose";
import homeworkModel from "../model/homeworkModel.js";
import {
  notifyHomeworkAssigned,
  notifyHomeworkSubmitted,
  notifyHomeworkReviewed,
  summaryText,
} from "../services/notificationService.js";
import { validateUploadedFile, ROOT_FOLDER } from "../services/cloudinaryService.js";

const isAdmin = (req) => req.user?.userType === "admin";
const canAccess = (req, hw) => isAdmin(req) || String(hw.studentId) === String(req.userId);

// Never let the client overwrite server-controlled fields through the generic
// update endpoint.
const ADMIN_EDITABLE = [
  "homeworkTitle",
  "homeworkDescription",
  "homeworkType",
  "priority",
  "additionalNotes",
  "status",
  "dueDate",
  "feedback",
];

export const getAllHomework = async (req, res) => {
  try {
    const homework = await homeworkModel.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(homework);
  } catch (error) {
    res.status(500).json({ message: "Error fetching homework", error: error.message });
  }
};

export const getHomeworkById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid homework id" });
    }
    const homework = await homeworkModel.findById(req.params.id).lean();
    if (!homework) return res.status(404).json({ message: "Homework not found" });
    if (!canAccess(req, homework)) return res.status(403).json({ message: "Not allowed" });
    res.status(200).json(homework);
  } catch (error) {
    res.status(500).json({ message: "Error fetching homework", error: error.message });
  }
};

export const getHomeworkByStudentId = async (req, res) => {
  try {
    if (!isAdmin(req) && String(req.params.studentId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    // An empty list is a valid answer; it used to be a 404, which showed up as
    // an error in the browser console for every new student.
    const homework = await homeworkModel
      .find({ studentId: req.params.studentId })
      .sort({ assignedDate: -1 })
      .lean();
    res.status(200).json(homework);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching homework for student",
      error: error.message,
    });
  }
};

export const createHomework = async (req, res) => {
  const {
    studentId,
    studentName,
    classScheduleId,
    homeworkTitle,
    homeworkDescription,
    homeworkType,
    priority,
    additionalNotes,
    dueDate,
  } = req.body;

  try {
    const newHomework = new homeworkModel({
      studentId,
      studentName,
      classScheduleId,
      homeworkTitle,
      homeworkDescription,
      homeworkType,
      priority,
      additionalNotes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    const savedHomework = await newHomework.save();
    const email = await notifyHomeworkAssigned(savedHomework.toObject());

    res.status(201).json({
      success: true,
      message: "Homework assigned successfully",
      data: savedHomework,
      email,
      emailMessage: summaryText(email),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating homework",
      error: error.message,
    });
  }
};

export const updateHomework = async (req, res) => {
  try {
    const update = {};
    ADMIN_EDITABLE.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    if (update.dueDate === "") update.dueDate = null; // clear the due date

    const previous = await homeworkModel.findById(req.params.id).lean();
    if (!previous) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    const becameCompleted =
      update.status === "completed" && previous.status !== "completed";
    const newFeedback =
      typeof update.feedback === "string" &&
      update.feedback.trim() !== "" &&
      update.feedback !== previous.feedback;
    const reviewing = becameCompleted || newFeedback;
    if (reviewing) update.reviewedAt = new Date();

    const updatedHomework = await homeworkModel.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    const email = reviewing
      ? await notifyHomeworkReviewed(updatedHomework.toObject())
      : null;

    res.status(200).json({
      success: true,
      message: "Homework updated successfully",
      data: updatedHomework,
      email,
      emailMessage: summaryText(email),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating homework",
      error: error.message,
    });
  }
};

// Student hands in their work (note, link and/or PDF).
export const submitHomework = async (req, res) => {
  try {
    const homework = await homeworkModel.findById(req.params.id);
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });
    if (String(homework.studentId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "This homework is not assigned to you" });
    }
    if (homework.status === "completed") {
      return res.status(400).json({ success: false, message: "This homework is already completed" });
    }

    const { note = "", link = "", file } = req.body;
    if (!note.trim() && !link.trim() && !file) {
      return res.status(400).json({
        success: false,
        message: "Add a note, a link or a PDF before submitting",
      });
    }
    if (link && !/^https?:\/\//i.test(link.trim())) {
      return res.status(400).json({ success: false, message: "Link must start with http:// or https://" });
    }

    homework.submissionNote = note.trim().slice(0, 2000);
    homework.submissionLink = link.trim().slice(0, 500);
    if (file) {
      homework.submissionFile = validateUploadedFile(
        file,
        `${ROOT_FOLDER}/homework/${req.userId}`
      );
    }
    homework.status = "submitted";
    homework.submittedAt = new Date();
    await homework.save();

    const email = await notifyHomeworkSubmitted(homework.toObject());
    res.status(200).json({
      success: true,
      message: "Homework submitted successfully",
      data: homework,
      email,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteHomework = async (req, res) => {
  try {
    const deletedHomework = await homeworkModel.findByIdAndDelete(req.params.id);
    if (!deletedHomework) return res.status(404).json({ message: "Homework not found" });
    res.status(200).json({ message: "Homework deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting homework", error: error.message });
  }
};
