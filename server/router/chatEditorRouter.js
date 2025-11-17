import express from "express";
import {
  deleteChat,
  updateChat,
  markAsRead,
  getAllChats,
  getStudentChats,
  createChat,
} from "../controller/chateditorController.js";

export const chatEditorRouter = express.Router();

chatEditorRouter.post("/chats", createChat);

chatEditorRouter.get("/chats/student/:userId", getStudentChats);

chatEditorRouter.get("/chats", getAllChats);

chatEditorRouter.patch("/chats/:chatId/read", markAsRead);

chatEditorRouter.put("/chats/:chatId", updateChat);

chatEditorRouter.delete("/chats/:chatId", deleteChat);
