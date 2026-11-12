import mongoose from "mongoose";
import userModel from "../model/userModel.js";
import classSchedule from "../model/classesScheduleDetails.js";
import { QuestionFolder } from "../model/questionFolderModel.js";
import {
  CodeQuestion,
  QuestionAssignment,
  QUESTION_LANGUAGES,
  DIFFICULTIES,
} from "../model/codeQuestionModel.js";
import {
  destroyAsset,
  validateUploadedFile,
  withImageUrls,
  avatarOf,
  ROOT_FOLDER,
} from "../services/cloudinaryService.js";
import {
  notifyQuestionsAssigned,
  notifyQuestionBundle,
  notifyQuestionSubmitted,
  notifyQuestionReviewed,
  summaryText,
} from "../services/notificationService.js";
import { escapeRegex } from "../utils/time.js";

const isAdmin = (req) => req.user?.userType === "admin";
const MAX_ATTEMPTS = 20;
const QUESTION_FOLDER = `${ROOT_FOLDER}/questions`;

// ---------------------------------------------------------------- helpers
// Compare outputs the way a judge would: ignore \r and trailing whitespace.
export const normalizeOutput = (text) =>
  String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .trim();

export const checkOutput = (output, expected) =>
  expected && expected.trim() ? normalizeOutput(output) === normalizeOutput(expected) : null;

const serializeQuestion = (q) => {
  const o = typeof q.toObject === "function" ? q.toObject() : { ...q };
  if (o.expectedImage?.url) o.expectedImage = withImageUrls(o.expectedImage);
  return o;
};

const serializeAssignment = (a) => {
  const o = typeof a.toObject === "function" ? a.toObject() : { ...a };
  o.submissions = (o.submissions || []).map((s) => ({
    ...s,
    screenshot: s.screenshot?.url ? withImageUrls(s.screenshot) : undefined,
  }));
  return o;
};

const cleanTags = (tags) =>
  (Array.isArray(tags) ? tags : String(tags || "").split(","))
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 8);

const validObjectIds = (ids) =>
  [...new Set((Array.isArray(ids) ? ids : []).map(String))].filter((i) => mongoose.Types.ObjectId.isValid(i));

// ---------------------------------------------------------------- folders
// A question may only live in a SESSION folder (level 2) or be unfiled (null).
const resolveFolderId = async (value) => {
  if (value === undefined || value === null || value === "" || value === "unfiled") return null;
  if (!mongoose.Types.ObjectId.isValid(value)) throw new Error("Invalid folder.");
  const folder = await QuestionFolder.findById(value).lean();
  if (!folder) throw new Error("Folder not found.");
  if (folder.level !== 2) throw new Error("Questions go inside a session folder (category > session > question).");
  return folder._id;
};

// session ids under any folder (a session returns itself, a category its sessions)
const sessionIdsFor = async (folderIds) => {
  const ids = validObjectIds(folderIds);
  if (ids.length === 0) return [];
  const folders = await QuestionFolder.find({ _id: { $in: ids } }).lean();
  const out = new Set(folders.filter((f) => f.level === 2).map((f) => String(f._id)));
  const catIds = folders.filter((f) => f.level === 1).map((f) => f._id);
  if (catIds.length) {
    const kids = await QuestionFolder.find({ parentId: { $in: catIds } }).select("_id").lean();
    kids.forEach((k) => out.add(String(k._id)));
  }
  return [...out];
};

// ------------------------------------------------------- question bank (admin)
export const listQuestions = async (req, res) => {
  try {
    const filter = {};
    if (QUESTION_LANGUAGES.includes(req.query.language)) filter.language = req.query.language;
    if (DIFFICULTIES.includes(req.query.difficulty)) filter.difficulty = req.query.difficulty;
    if (req.query.folderId === "unfiled") filter.folderId = null;
    else if (req.query.folderId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.folderId)) return res.status(400).json({ success: false, message: "Invalid folder." });
      filter.folderId = { $in: await sessionIdsFor([req.query.folderId]) };
    }
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }
    const [questions, counts] = await Promise.all([
      CodeQuestion.find(filter).sort({ createdAt: -1 }).limit(500).lean(),
      QuestionAssignment.aggregate([
        {
          $group: {
            _id: "$questionId",
            assigned: { $sum: 1 },
            submitted: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
          },
        },
      ]),
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c]));
    res.status(200).json({
      success: true,
      data: questions.map((qq) => {
        const c = map.get(String(qq._id)) || {};
        return {
          ...serializeQuestion(qq),
          stats: { assigned: c.assigned || 0, submitted: c.submitted || 0, accepted: c.accepted || 0 },
        };
      }),
    });
  } catch (error) {
    console.error("listQuestions:", error);
    res.status(500).json({ success: false, message: "Could not load questions." });
  }
};

const readQuestionBody = (body) => {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  if (!title) throw new Error("Title is required.");
  if (!description) throw new Error("Describe the question for the student.");
  if (!QUESTION_LANGUAGES.includes(body.language)) throw new Error("Choose a valid language.");
  const difficulty = DIFFICULTIES.includes(body.difficulty) ? body.difficulty : "easy";
  return {
    title: title.slice(0, 140),
    description: description.slice(0, 8000),
    language: body.language,
    difficulty,
    starterCode: String(body.starterCode || "").slice(0, 20000),
    sampleInput: String(body.sampleInput || "").slice(0, 5000),
    expectedOutputText: String(body.expectedOutputText || "").slice(0, 10000),
    tags: cleanTags(body.tags),
  };
};

export const createQuestion = async (req, res) => {
  try {
    const data = readQuestionBody(req.body);
    data.folderId = await resolveFolderId(req.body.folderId);
    if (req.body.expectedImage) {
      data.expectedImage = validateUploadedFile(req.body.expectedImage, QUESTION_FOLDER, "image");
    }
    const question = await CodeQuestion.create({ ...data, createdBy: req.userId });
    res.status(201).json({
      success: true,
      message: "Question saved to your question bank.",
      data: { ...serializeQuestion(question), stats: { assigned: 0, submitted: 0, accepted: 0 } },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await CodeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    Object.assign(question, readQuestionBody({ ...question.toObject(), ...req.body }));
    if ("folderId" in req.body) question.folderId = await resolveFolderId(req.body.folderId);

    let oldImage = null;
    if (req.body.expectedImage) {
      oldImage = question.expectedImage;
      question.expectedImage = validateUploadedFile(req.body.expectedImage, QUESTION_FOLDER, "image");
    } else if (req.body.removeImage) {
      oldImage = question.expectedImage;
      question.expectedImage = undefined;
    }
    await question.save();
    if (oldImage?.publicId) destroyAsset(oldImage.publicId, oldImage.resourceType).catch(() => {});
    res.status(200).json({ success: true, message: "Question updated.", data: serializeQuestion(question) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await CodeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    const assignments = await QuestionAssignment.find({ questionId: question._id }).select("submissions").lean();
    if (assignments.length > 0 && req.query.force !== "true") {
      return res.status(409).json({
        success: false,
        message: `This question is assigned to ${assignments.length} student(s). Deleting it also deletes their submissions.`,
        assignedCount: assignments.length,
      });
    }
    await QuestionAssignment.deleteMany({ questionId: question._id });
    await question.deleteOne();
    const assets = [
      question.expectedImage,
      ...assignments.flatMap((a) => (a.submissions || []).map((s) => s.screenshot)),
    ].filter((f) => f?.publicId);
    assets.forEach((f) => destroyAsset(f.publicId, f.resourceType).catch(() => {}));
    res.status(200).json({ success: true, message: "Question deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the question." });
  }
};

// ------------------------------------------------------------- assigning
export const assignQuestion = async (req, res) => {
  try {
    const question = await CodeQuestion.findById(req.params.id).lean();
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });

    const ids = validObjectIds(req.body.studentIds);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one student." });
    }
    let dueDate;
    if (req.body.dueDate) {
      dueDate = new Date(req.body.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid due date." });
      }
    }

    const students = await userModel.find({ _id: { $in: ids }, userType: "student" }).select("_id").lean();
    const studentIds = students.map((s) => String(s._id));
    if (studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "None of the selected users are students." });
    }

    const existing = await QuestionAssignment.find({ questionId: question._id, studentId: { $in: studentIds } })
      .select("studentId")
      .lean();
    const already = new Set(existing.map((e) => e.studentId));
    const fresh = studentIds.filter((id) => !already.has(id));

    if (fresh.length > 0) {
      await QuestionAssignment.insertMany(
        fresh.map((studentId) => ({
          questionId: question._id,
          studentId,
          assignedBy: req.userId,
          dueDate,
        })),
        { ordered: false }
      );
    }
    const email = fresh.length ? await notifyQuestionsAssigned(question, fresh, dueDate) : null;

    res.status(200).json({
      success: true,
      message:
        fresh.length === 0
          ? "All selected students already have this question."
          : `Assigned to ${fresh.length} student${fresh.length === 1 ? "" : "s"}${already.size ? ` (${already.size} already had it)` : ""}.`,
      created: fresh.length,
      skipped: already.size,
      email,
      emailMessage: summaryText(email),
    });
  } catch (error) {
    console.error("assignQuestion:", error);
    res.status(500).json({ success: false, message: "Could not assign the question." });
  }
};

export const listQuestionAssignments = async (req, res) => {
  try {
    const list = await QuestionAssignment.find({ questionId: req.params.id }).sort({ assignedAt: -1 }).lean();
    const users = await userModel
      .find({ _id: { $in: validObjectIds(list.map((a) => a.studentId)) } })
      .select("name email")
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    res.status(200).json({
      success: true,
      data: list.map((a) => ({
        ...serializeAssignment(a),
        student: byId.get(a.studentId) || { name: "Unknown student" },
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load assignments." });
  }
};

export const unassign = async (req, res) => {
  try {
    const a = await QuestionAssignment.findByIdAndDelete(req.params.aid);
    if (!a) return res.status(404).json({ success: false, message: "Assignment not found." });
    (a.submissions || [])
      .map((s) => s.screenshot)
      .filter((f) => f?.publicId)
      .forEach((f) => destroyAsset(f.publicId, f.resourceType).catch(() => {}));
    res.status(200).json({ success: true, message: "Removed from the student." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not remove the assignment." });
  }
};

// ------------------------------------------------------------- student side
export const myAssignments = async (req, res) => {
  try {
    const list = await QuestionAssignment.find({ studentId: String(req.userId) }).sort({ assignedAt: -1 }).lean();
    const questions = await CodeQuestion.find({ _id: { $in: list.map((a) => a.questionId) } }).lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    // Only the folders that contain this student's questions (and their categories)
    const sessionIds = [...new Set(questions.map((q) => q.folderId && String(q.folderId)).filter(Boolean))];
    const sessions = sessionIds.length ? await QuestionFolder.find({ _id: { $in: sessionIds } }).lean() : [];
    const catIds = [...new Set(sessions.map((s) => String(s.parentId)))];
    const cats = catIds.length ? await QuestionFolder.find({ _id: { $in: catIds } }).lean() : [];
    res.status(200).json({
      success: true,
      folders: [...cats, ...sessions],
      data: list
        .filter((a) => qMap.has(String(a.questionId)))
        .map((a) => ({ ...serializeAssignment(a), question: serializeQuestion(qMap.get(String(a.questionId))) })),
    });
  } catch (error) {
    console.error("myAssignments:", error);
    res.status(500).json({ success: false, message: "Could not load your questions." });
  }
};

export const getAssignment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.aid)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }
    const a = await QuestionAssignment.findById(req.params.aid).lean();
    if (!a) return res.status(404).json({ success: false, message: "Assignment not found." });
    if (!isAdmin(req) && a.studentId !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed." });
    }
    const [question, student] = await Promise.all([
      CodeQuestion.findById(a.questionId).lean(),
      userModel.findById(a.studentId).select("name email").lean(),
    ]);
    res.status(200).json({
      success: true,
      data: { ...serializeAssignment(a), question: question ? serializeQuestion(question) : null, student },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load the assignment." });
  }
};

export const submitSolution = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.aid)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }
    const assignment = await QuestionAssignment.findById(req.params.aid);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    if (assignment.studentId !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "This question is not assigned to you." });
    }
    if (assignment.status === "accepted") {
      return res.status(400).json({ success: false, message: "This question is already accepted." });
    }
    if (assignment.submissions.length >= MAX_ATTEMPTS) {
      return res.status(400).json({ success: false, message: `You have reached the limit of ${MAX_ATTEMPTS} attempts.` });
    }
    const question = await CodeQuestion.findById(assignment.questionId);
    if (!question) return res.status(404).json({ success: false, message: "The question no longer exists." });

    const code = String(req.body.code ?? "");
    if (!code.trim()) return res.status(400).json({ success: false, message: "Write your solution first." });
    if (code.length > 65536) return res.status(413).json({ success: false, message: "Code is too long (max 64 KB)." });

    const output = String(req.body.output ?? "").slice(0, 20000);
    const submission = {
      code,
      language: question.language,
      output,
      outputMatches: checkOutput(output, question.expectedOutputText),
      submittedAt: new Date(),
    };
    if (req.body.screenshot) {
      submission.screenshot = validateUploadedFile(
        req.body.screenshot,
        `${ROOT_FOLDER}/solutions/${req.userId}`,
        "image"
      );
    }

    assignment.submissions.push(submission);
    assignment.status = "submitted";
    await assignment.save();

    const student = await userModel.findById(req.userId).select("name email").lean();
    const email = await notifyQuestionSubmitted(question.toObject(), assignment.toObject(), student);
    res.status(200).json({
      success: true,
      message: "Solution submitted! Your instructor has been notified.",
      email,
      data: { ...serializeAssignment(assignment), question: serializeQuestion(question) },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------- review
export const reviewSubmission = async (req, res) => {
  try {
    const { status, feedback = "" } = req.body;
    if (!["accepted", "needs_work"].includes(status)) {
      return res.status(400).json({ success: false, message: "Choose Accepted or Needs work." });
    }
    if (status === "needs_work" && !String(feedback).trim()) {
      return res.status(400).json({ success: false, message: "Tell the student what to fix (feedback is required)." });
    }
    const assignment = await QuestionAssignment.findById(req.params.aid);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    if (assignment.submissions.length === 0) {
      return res.status(400).json({ success: false, message: "The student has not submitted anything yet." });
    }
    assignment.status = status;
    assignment.feedback = String(feedback).trim().slice(0, 2000);
    if (req.body.score !== undefined && req.body.score !== null && req.body.score !== "") {
      const score = Number(req.body.score);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        return res.status(400).json({ success: false, message: "Score must be between 0 and 100." });
      }
      assignment.score = Math.round(score);
    }
    assignment.reviewedAt = new Date();
    await assignment.save();

    const question = await CodeQuestion.findById(assignment.questionId).lean();
    const email = question ? await notifyQuestionReviewed(question, assignment.toObject()) : null;
    res.status(200).json({
      success: true,
      message: status === "accepted" ? "Accepted." : "Sent back for more work.",
      email,
      emailMessage: summaryText(email),
      data: serializeAssignment(assignment),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------- bulk operations
// Assign several questions and/or whole folders to several students and/or
// whole classes in one go. Existing (question, student) pairs are skipped.
const MAX_PAIRS = 5000;

export const assignBulk = async (req, res) => {
  try {
    const { questionIds = [], folderIds = [], studentIds = [], classScheduleIds = [], dueDate } = req.body;

    let due;
    if (dueDate) {
      due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) return res.status(400).json({ success: false, message: "Invalid due date." });
    }

    // 1) questions = picked questions + everything inside picked folders
    const fromFolders = folderIds.length
      ? await CodeQuestion.find({ folderId: { $in: await sessionIdsFor(folderIds) } }).select("_id").lean()
      : [];
    const qIds = [...new Set([...validObjectIds(questionIds), ...fromFolders.map((q) => String(q._id))])];
    if (qIds.length === 0) return res.status(400).json({ success: false, message: "Select at least one question or a folder that contains questions." });
    const questions = await CodeQuestion.find({ _id: { $in: qIds } }).select("title language difficulty createdBy").lean();

    // 2) students = picked students + everyone enrolled in picked classes
    let sIds = validObjectIds(studentIds);
    const classIds = validObjectIds(classScheduleIds);
    if (classIds.length) {
      const classes = await classSchedule.find({ _id: { $in: classIds } }).select("studentsEnrolled").lean();
      classes.forEach((c) => (c.studentsEnrolled || []).forEach((id) => sIds.push(String(id))));
    }
    sIds = validObjectIds(sIds);
    if (sIds.length === 0) return res.status(400).json({ success: false, message: "Select at least one student or class." });
    const students = await userModel.find({ _id: { $in: sIds }, userType: "student" }).select("_id").lean();
    const studentList = students.map((s) => String(s._id));
    if (studentList.length === 0) return res.status(400).json({ success: false, message: "No students found in your selection." });

    if (questions.length * studentList.length > MAX_PAIRS) {
      return res.status(400).json({ success: false, message: `That is too many at once (${questions.length} questions x ${studentList.length} students). Please assign in smaller batches (max ${MAX_PAIRS}).` });
    }

    // 3) skip pairs that already exist
    const existing = await QuestionAssignment.find({ questionId: { $in: questions.map((q) => q._id) }, studentId: { $in: studentList } })
      .select("questionId studentId").lean();
    const have = new Set(existing.map((e) => `${e.questionId}:${e.studentId}`));
    const rows = [];
    const newByStudent = new Map();
    for (const q of questions) {
      for (const sid of studentList) {
        if (have.has(`${q._id}:${sid}`)) continue;
        rows.push({ questionId: q._id, studentId: sid, assignedBy: req.userId, dueDate: due });
        if (!newByStudent.has(sid)) newByStudent.set(sid, []);
        newByStudent.get(sid).push(q);
      }
    }
    if (rows.length) {
      try {
        await QuestionAssignment.insertMany(rows, { ordered: false });
      } catch (error) {
        if (error.code !== 11000 && !error.writeErrors) throw error; // duplicates from a race are fine
      }
    }

    // 4) one email per student listing everything new (not one per question)
    const email = rows.length ? await notifyQuestionBundle(newByStudent, due) : null;
    const total = questions.length * studentList.length;
    res.status(200).json({
      success: true,
      message: rows.length === 0
        ? "Everyone already has these questions."
        : `Assigned ${rows.length} question${rows.length === 1 ? "" : "s"} to ${newByStudent.size} student${newByStudent.size === 1 ? "" : "s"}${total - rows.length ? ` (${total - rows.length} already assigned, skipped)` : ""}.`,
      created: rows.length,
      skipped: total - rows.length,
      students: studentList.length,
      questions: questions.length,
      email,
      emailMessage: summaryText(email),
    });
  } catch (error) {
    console.error("assignBulk:", error);
    res.status(500).json({ success: false, message: "Could not assign the questions." });
  }
};

// Move several questions into a session folder (or back to Unfiled).
export const moveQuestions = async (req, res) => {
  try {
    const ids = validObjectIds(req.body.questionIds);
    if (ids.length === 0) return res.status(400).json({ success: false, message: "Select at least one question." });
    const folderId = await resolveFolderId(req.body.folderId);
    const result = await CodeQuestion.updateMany({ _id: { $in: ids } }, { folderId });
    res.status(200).json({ success: true, message: `Moved ${result.modifiedCount ?? ids.length} question(s).` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// "Submissions to Review" dashboard: everything waiting for the admin.
export const reviewQueue = async (req, res) => {
  try {
    const status = ["submitted", "needs_work", "accepted"].includes(req.query.status) ? req.query.status : req.query.status === "all" ? null : "submitted";
    const filter = {};
    if (status) filter.status = status;
    else filter.status = { $in: ["submitted", "needs_work", "accepted"] };

    // optional folder filter (category or session)
    let questionFilter = null;
    if (req.query.folderId) {
      const sids = await sessionIdsFor([req.query.folderId]);
      const qs = await CodeQuestion.find({ folderId: { $in: sids } }).select("_id").lean();
      questionFilter = qs.map((q) => q._id);
      filter.questionId = { $in: questionFilter };
    }
    // optional student-name search
    const search = String(req.query.q || "").trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const us = await userModel.find({ userType: "student", $or: [{ name: rx }, { email: rx }] }).select("_id").lean();
      filter.studentId = { $in: us.map((u) => String(u._id)) };
    }

    const [list, counts] = await Promise.all([
      QuestionAssignment.find(filter).sort({ updatedAt: status === "submitted" ? 1 : -1 }).limit(200).lean(),
      QuestionAssignment.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    const [questions, students, folders] = await Promise.all([
      CodeQuestion.find({ _id: { $in: list.map((a) => a.questionId) } }).select("title language difficulty folderId").lean(),
      userModel.find({ _id: { $in: validObjectIds(list.map((a) => a.studentId)) } }).select("name email avatar").lean(),
      QuestionFolder.find().select("name level parentId").lean(),
    ]);
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    const uMap = new Map(students.map((u) => [String(u._id), u]));
    const fMap = new Map(folders.map((f) => [String(f._id), f]));
    const pathOf = (folderId) => {
      const s = folderId && fMap.get(String(folderId));
      if (!s) return "Unfiled";
      const c = s.parentId && fMap.get(String(s.parentId));
      return c ? `${c.name} / ${s.name}` : s.name;
    };
    res.status(200).json({
      success: true,
      counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
      data: list.map((a) => {
        const q = qMap.get(String(a.questionId));
        const last = a.submissions?.[a.submissions.length - 1];
        return {
          _id: a._id,
          status: a.status,
          score: a.score,
          attempts: a.submissions?.length || 0,
          lastSubmittedAt: last?.submittedAt,
          outputMatches: last?.outputMatches ?? null,
          updatedAt: a.updatedAt,
          student: uMap.get(a.studentId) ? { ...uMap.get(a.studentId), avatar: avatarOf(uMap.get(a.studentId)) } : { name: "Unknown student" },
          question: q ? { _id: q._id, title: q.title, language: q.language, difficulty: q.difficulty, path: pathOf(q.folderId) } : { title: "(deleted question)", path: "" },
        };
      }),
    });
  } catch (error) {
    console.error("reviewQueue:", error);
    res.status(500).json({ success: false, message: "Could not load submissions." });
  }
};
