import mongoose from "mongoose";

export const QUESTION_LANGUAGES = ["javascript", "python", "java", "cpp", "html"];
export const DIFFICULTIES = ["easy", "medium", "hard"];

const imageSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    resourceType: { type: String, default: "image" },
    format: String,
    bytes: Number,
    originalName: String,
  },
  { _id: false }
);

// A reusable question in the admin's question bank.
const codeQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 8000 },
    language: { type: String, required: true, enum: QUESTION_LANGUAGES },
    difficulty: { type: String, enum: DIFFICULTIES, default: "easy" },
    starterCode: { type: String, default: "", maxlength: 20000 },
    sampleInput: { type: String, default: "", maxlength: 5000 },
    // The "desired result": text, an image, or both.
    expectedOutputText: { type: String, default: "", maxlength: 10000 },
    expectedImage: { type: imageSchema, default: undefined },
    tags: [{ type: String, trim: true }],
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);
codeQuestionSchema.index({ createdAt: -1 });

const submissionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, maxlength: 65536 },
    language: { type: String },
    output: { type: String, default: "", maxlength: 20000 },
    screenshot: { type: imageSchema, default: undefined },
    // Advisory only: the output is produced in the student's browser.
    // true/false = compared with the expected text, null = nothing to compare.
    outputMatches: { type: Boolean, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// One question assigned to one student. The same question can be assigned to
// any number of students (one row each), now or later.
const questionAssignmentSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "codeQuestion", required: true, index: true },
    studentId: { type: String, required: true, index: true },
    assignedBy: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["assigned", "submitted", "accepted", "needs_work"],
      default: "assigned",
    },
    submissions: { type: [submissionSchema], default: [] },
    feedback: { type: String, default: "", maxlength: 2000 },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);
questionAssignmentSchema.index({ questionId: 1, studentId: 1 }, { unique: true });

export const CodeQuestion =
  mongoose.models.codeQuestion || mongoose.model("codeQuestion", codeQuestionSchema);
export const QuestionAssignment =
  mongoose.models.questionAssignment ||
  mongoose.model("questionAssignment", questionAssignmentSchema);
