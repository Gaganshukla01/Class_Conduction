import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    hostedUrl: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    technologies: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ["web", "mobile", "portfolio", "game", "productivity", "other"],
      default: "web",
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ studentId: 1, createdAt: -1 });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });

const projectModel = mongoose.model("Project", projectSchema);

export default projectModel;
