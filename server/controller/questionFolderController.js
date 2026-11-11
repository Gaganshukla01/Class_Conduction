import mongoose from "mongoose";
import { QuestionFolder } from "../model/questionFolderModel.js";
import { CodeQuestion } from "../model/codeQuestionModel.js";

const COLORS = ["indigo", "violet", "blue", "emerald", "amber", "rose", "cyan", "slate"];
const sameName = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Category > Session tree with question counts (admin).
export const listFolders = async (req, res) => {
  try {
    const [folders, counts, unfiled] = await Promise.all([
      QuestionFolder.find().sort({ order: 1, name: 1 }).lean(),
      CodeQuestion.aggregate([{ $match: { folderId: { $ne: null } } }, { $group: { _id: "$folderId", n: { $sum: 1 } } }]),
      CodeQuestion.countDocuments({ folderId: null }),
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
    const sessions = folders.filter((f) => f.level === 2).map((f) => ({ ...f, questionCount: countMap.get(String(f._id)) || 0 }));
    const tree = folders
      .filter((f) => f.level === 1)
      .map((cat) => {
        const kids = sessions.filter((s) => String(s.parentId) === String(cat._id));
        return { ...cat, sessions: kids, questionCount: kids.reduce((n, s) => n + s.questionCount, 0) };
      });
    res.status(200).json({ success: true, data: { tree, unfiledCount: unfiled } });
  } catch (error) {
    console.error("listFolders:", error);
    res.status(500).json({ success: false, message: "Could not load folders." });
  }
};

export const createFolder = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Folder name is required." });

    let level = 1;
    let parentId = null;
    if (req.body.parentId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.parentId)) return res.status(400).json({ success: false, message: "Invalid parent folder." });
      const parent = await QuestionFolder.findById(req.body.parentId).lean();
      if (!parent) return res.status(404).json({ success: false, message: "Parent folder not found." });
      if (parent.level !== 1) {
        return res.status(400).json({ success: false, message: "Sessions can only be created inside a category (3 levels: category > session > questions)." });
      }
      level = 2;
      parentId = parent._id;
    }
    const siblings = await QuestionFolder.find({ parentId }).select("name").lean();
    if (siblings.some((s) => sameName(s.name, name))) {
      return res.status(409).json({ success: false, message: `“${name}” already exists here.` });
    }
    const folder = await QuestionFolder.create({
      name: name.slice(0, 80),
      description: String(req.body.description || "").trim().slice(0, 300),
      parentId,
      level,
      color: COLORS.includes(req.body.color) ? req.body.color : "indigo",
      order: siblings.length,
      createdBy: req.userId,
    });
    res.status(201).json({ success: true, message: level === 1 ? "Category created." : "Session created.", data: folder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const folder = await QuestionFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found." });
    if (typeof req.body.name === "string" && req.body.name.trim()) {
      const name = req.body.name.trim().slice(0, 80);
      const siblings = await QuestionFolder.find({ parentId: folder.parentId, _id: { $ne: folder._id } }).select("name").lean();
      if (siblings.some((s) => sameName(s.name, name))) return res.status(409).json({ success: false, message: `“${name}” already exists here.` });
      folder.name = name;
    }
    if (typeof req.body.description === "string") folder.description = req.body.description.trim().slice(0, 300);
    if (COLORS.includes(req.body.color)) folder.color = req.body.color;
    await folder.save();
    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// A folder can only be deleted when it is empty, so nobody loses questions by accident.
export const deleteFolder = async (req, res) => {
  try {
    const folder = await QuestionFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found." });
    const [children, questions] = await Promise.all([
      QuestionFolder.countDocuments({ parentId: folder._id }),
      CodeQuestion.countDocuments({ folderId: folder._id }),
    ]);
    if (children > 0) return res.status(409).json({ success: false, message: `This category still has ${children} session(s). Delete or move them first.` });
    if (questions > 0) return res.status(409).json({ success: false, message: `This session still has ${questions} question(s). Move or delete them first.` });
    await folder.deleteOne();
    res.status(200).json({ success: true, message: "Folder deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the folder." });
  }
};
