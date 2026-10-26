import mongoose from "mongoose";
import {
  cloudinaryConfigured,
  createUploadSignature,
  ROOT_FOLDER,
} from "../services/cloudinaryService.js";
import { ResourceFolder } from "../model/resourceModel.js";

// Returns a short-lived signature so the browser can upload a PDF straight to
// Cloudinary. The folder is decided HERE (never by the client), so a student
// cannot write into the notes/library folders.
export const signUpload = async (req, res) => {
  try {
    if (!cloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "File storage is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the server .env file.",
      });
    }

    const { purpose, folderId } = req.body;
    const admin = req.user?.userType === "admin";
    let folder;
    let kind = "pdf";

    if (purpose === "class-note") {
      if (!admin) return res.status(403).json({ success: false, message: "Admin access required." });
      folder = `${ROOT_FOLDER}/class-notes`;
    } else if (purpose === "resource") {
      if (!admin) return res.status(403).json({ success: false, message: "Admin access required." });
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return res.status(400).json({ success: false, message: "A valid folderId is required." });
      }
      const f = await ResourceFolder.findById(folderId).lean();
      if (!f) return res.status(404).json({ success: false, message: "Folder not found." });
      folder = `${ROOT_FOLDER}/library/${f.slug}`;
    } else if (purpose === "question-image") {
      if (!admin) return res.status(403).json({ success: false, message: "Admin access required." });
      folder = `${ROOT_FOLDER}/questions`;
      kind = "image";
    } else if (purpose === "solution-image") {
      folder = `${ROOT_FOLDER}/solutions/${req.userId}`;
      kind = "image";
    } else if (purpose === "homework") {
      folder = `${ROOT_FOLDER}/homework/${req.userId}`;
    } else {
      return res.status(400).json({ success: false, message: "Unknown upload purpose." });
    }

    res.status(200).json({ success: true, data: createUploadSignature(folder, kind) });
  } catch (error) {
    console.error("signUpload error:", error);
    res.status(500).json({ success: false, message: "Could not prepare the upload." });
  }
};
