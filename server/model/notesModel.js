import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    studentId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model.Note || mongoose.model("Note", noteSchema);
export default Note;
