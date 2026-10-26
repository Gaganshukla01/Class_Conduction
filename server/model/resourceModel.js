import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, default: "image" },
    format: String,
    bytes: Number,
    originalName: String,
  },
  { _id: false }
);

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, default: "", maxlength: 300 },
    color: { type: String, default: "indigo" },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const resourceSchema = new mongoose.Schema(
  {
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "resourceFolder",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    tags: [{ type: String, trim: true }],
    file: { type: fileSchema, required: true },
    uploadedBy: { type: String, required: true },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

resourceSchema.index({ title: "text", description: "text", tags: "text" });

export const ResourceFolder =
  mongoose.models.resourceFolder ||
  mongoose.model("resourceFolder", folderSchema);
export const Resource =
  mongoose.models.resource || mongoose.model("resource", resourceSchema);
