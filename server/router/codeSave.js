import express from "express";
import {
  saveCodeProject,
  getUserCodeProjects,
  getCodeProjectById,
  updateCodeProject,
  deleteCodeProject,
} from "../controller/CodeSave.js";
export const codeSaveRouter = express.Router();

codeSaveRouter.post("/save", saveCodeProject); // POST /api/projects/save
codeSaveRouter.get("/user/:userId", getUserCodeProjects); // GET /api/projects/user/:userId
codeSaveRouter.get("/user/:userId/:projectId", getCodeProjectById); // GET /api/projects/user/:userId/:projectId
codeSaveRouter.put("/user/:userId/:projectId", updateCodeProject); // PUT /api/projects/user/:userId/:projectId
codeSaveRouter.delete("/user/:userId/:projectId", deleteCodeProject); // DELETE /api/projects/user/:userId/:projectId
