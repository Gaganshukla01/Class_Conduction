import mongoose from "mongoose";

// 3-tier hierarchy:  Category (level 1)  >  Session (level 2)  >  Questions
//   e.g. "Python WebDev" > "Session 01" > "Sum of two numbers"
// Categories have parentId = null. Sessions point at their category.
const questionFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, default: "", maxlength: 300 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "questionFolder", default: null, index: true },
    level: { type: Number, enum: [1, 2], required: true },
    color: { type: String, default: "indigo" },
    order: { type: Number, default: 0 },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const QuestionFolder =
  mongoose.models.questionFolder || mongoose.model("questionFolder", questionFolderSchema);
