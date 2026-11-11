import express from "express";
import { adminOnly } from "../middlewares/userAuthMiddleware.js";
import { listFolders, createFolder, updateFolder, deleteFolder } from "../controller/questionFolderController.js";

export const questionFolderRouter = express.Router();
questionFolderRouter.get("/", adminOnly, listFolders);
questionFolderRouter.post("/", adminOnly, createFolder);
questionFolderRouter.put("/:id", adminOnly, updateFolder);
questionFolderRouter.delete("/:id", adminOnly, deleteFolder);
