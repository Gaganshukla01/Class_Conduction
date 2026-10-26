import mongoose from "mongoose";
import { Resource, ResourceFolder } from "../model/resourceModel.js";
import {
  destroyAsset,
  slugify,
  validateUploadedFile,
  withFileUrls,
  ROOT_FOLDER,
} from "../services/cloudinaryService.js";
import { escapeRegex } from "../utils/time.js";

const COLORS = ["indigo", "violet", "blue", "emerald", "amber", "rose", "cyan", "slate"];

// ---------------- folders ----------------
export const listFolders = async (req, res) => {
  try {
    const [folders, counts] = await Promise.all([
      ResourceFolder.find().sort({ name: 1 }).lean(),
      Resource.aggregate([{ $group: { _id: "$folderId", count: { $sum: 1 } } }]),
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    res.status(200).json({
      success: true,
      data: folders.map((f) => ({ ...f, resourceCount: countMap.get(String(f._id)) || 0 })),
    });
  } catch (error) {
    console.error("listFolders:", error);
    res.status(500).json({ success: false, message: "Could not load folders." });
  }
};

export const createFolder = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Folder name is required." });
    const slug = slugify(name);
    if (await ResourceFolder.findOne({ slug })) {
      return res.status(409).json({ success: false, message: `A folder named "${name}" already exists.` });
    }
    const folder = await ResourceFolder.create({
      name: name.slice(0, 60),
      slug,
      description: String(req.body.description || "").trim().slice(0, 300),
      color: COLORS.includes(req.body.color) ? req.body.color : "indigo",
      createdBy: req.userId,
    });
    res.status(201).json({ success: true, message: "Folder created.", data: { ...folder.toObject(), resourceCount: 0 } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "That folder already exists." });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.name === "string" && req.body.name.trim()) update.name = req.body.name.trim().slice(0, 60);
    if (typeof req.body.description === "string") update.description = req.body.description.trim().slice(0, 300);
    if (COLORS.includes(req.body.color)) update.color = req.body.color;
    // The slug is deliberately NOT changed: it is part of the Cloudinary path.
    const folder = await ResourceFolder.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found." });
    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const folder = await ResourceFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found." });
    const files = await Resource.find({ folderId: folder._id }).select("file").lean();
    if (files.length > 0 && req.query.force !== "true") {
      return res.status(409).json({
        success: false,
        message: `This folder has ${files.length} file(s). Delete them first or confirm deleting everything.`,
        resourceCount: files.length,
      });
    }
    await Resource.deleteMany({ folderId: folder._id });
    await folder.deleteOne();
    files.forEach((r) => destroyAsset(r.file.publicId, r.file.resourceType).catch(() => {}));
    res.status(200).json({ success: true, message: "Folder deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the folder." });
  }
};

// ---------------- resources ----------------
export const listResources = async (req, res) => {
  try {
    const filter = {};
    if (req.query.folderId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.folderId)) {
        return res.status(400).json({ success: false, message: "Invalid folder." });
      }
      filter.folderId = req.query.folderId;
    }
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }
    const items = await Resource.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    res.status(200).json({ success: true, data: items.map((r) => withFileUrls(r)) });
  } catch (error) {
    console.error("listResources:", error);
    res.status(500).json({ success: false, message: "Could not load resources." });
  }
};

export const createResource = async (req, res) => {
  try {
    const { folderId, title, description = "", tags = [], file } = req.body;
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ success: false, message: "Choose a folder." });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }
    const folder = await ResourceFolder.findById(folderId).lean();
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found." });

    const validFile = validateUploadedFile(file, `${ROOT_FOLDER}/library/${folder.slug}`);
    const cleanTags = (Array.isArray(tags) ? tags : String(tags).split(","))
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 8);

    const resource = await Resource.create({
      folderId: folder._id,
      title: title.trim().slice(0, 120),
      description: String(description).trim().slice(0, 500),
      tags: cleanTags,
      file: validFile,
      uploadedBy: req.userId,
    });
    res.status(201).json({ success: true, message: `Added to ${folder.name}`, data: withFileUrls(resource) });
  } catch (error) {
    console.error("createResource:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.title === "string" && req.body.title.trim()) update.title = req.body.title.trim().slice(0, 120);
    if (typeof req.body.description === "string") update.description = req.body.description.trim().slice(0, 500);
    if (Array.isArray(req.body.tags)) update.tags = req.body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8);
    const resource = await Resource.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });
    res.status(200).json({ success: true, data: withFileUrls(resource) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });
    destroyAsset(resource.file.publicId, resource.file.resourceType).catch((e) =>
      console.error("destroyAsset:", e.message)
    );
    res.status(200).json({ success: true, message: "Resource deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the resource." });
  }
};

export const trackResourceDownload = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });
    res.status(200).json({ success: true, data: withFileUrls(resource) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not start the download." });
  }
};
