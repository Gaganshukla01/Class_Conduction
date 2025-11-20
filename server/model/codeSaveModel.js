import mongoose from "mongoose";

const codeProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "html", "css", "cpp", "java"],
    },
    filename: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

codeProjectSchema.index({ userId: 1, createdAt: -1 });
codeProjectSchema.index({ language: 1 });

const codeModel =
  mongoose.model.code || mongoose.model("code", codeProjectSchema);

export default codeModel;
