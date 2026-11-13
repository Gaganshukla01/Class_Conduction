import express from "express";
import { staffOnly } from "../middlewares/userAuthMiddleware.js";
import { listFolders, createFolder, updateFolder, deleteFolder } from "../controller/questionFolderController.js";

export const questionFolderRouter = express.Router();
questionFolderRouter.get("/", staffOnly, listFolders);
questionFolderRouter.post("/", staffOnly, createFolder);
questionFolderRouter.put("/:id", staffOnly, updateFolder);
questionFolderRouter.delete("/:id", staffOnly, deleteFolder);
