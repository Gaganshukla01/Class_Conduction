import express from "express";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  listResources,
  createResource,
  updateResource,
  deleteResource,
  trackResourceDownload,
} from "../controller/resourceController.js";

export const resourceRouter = express.Router();

// Folders
resourceRouter.get("/folders", anyUser, listFolders);
resourceRouter.post("/folders", adminOnly, createFolder);
resourceRouter.put("/folders/:id", adminOnly, updateFolder);
resourceRouter.delete("/folders/:id", adminOnly, deleteFolder);

// Files
resourceRouter.get("/", anyUser, listResources);
resourceRouter.post("/", adminOnly, createResource);
resourceRouter.post("/:id/download", anyUser, trackResourceDownload);
resourceRouter.put("/:id", adminOnly, updateResource);
resourceRouter.delete("/:id", adminOnly, deleteResource);
