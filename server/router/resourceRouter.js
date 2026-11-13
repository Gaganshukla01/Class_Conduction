import express from "express";
import { staffOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
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
resourceRouter.post("/folders", staffOnly, createFolder);
resourceRouter.put("/folders/:id", staffOnly, updateFolder);
resourceRouter.delete("/folders/:id", staffOnly, deleteFolder);

// Files
resourceRouter.get("/", anyUser, listResources);
resourceRouter.post("/", staffOnly, createResource);
resourceRouter.post("/:id/download", anyUser, trackResourceDownload);
resourceRouter.put("/:id", staffOnly, updateResource);
resourceRouter.delete("/:id", staffOnly, deleteResource);
