import express from "express";
import { adminOnly, anyUser } from "../middlewares/userAuthMiddleware.js";
import { listMessages, sendMessage, deleteMessage, markRead, unreadCount, listMembers, runMigration } from "../controller/chatController.js";

export const chatRouter = express.Router();
chatRouter.get("/messages", anyUser, listMessages);
chatRouter.post("/messages", anyUser, sendMessage);
chatRouter.delete("/messages/:id", anyUser, deleteMessage);
chatRouter.post("/read", anyUser, markRead);
chatRouter.get("/unread", anyUser, unreadCount);
chatRouter.get("/members", anyUser, listMembers);
chatRouter.post("/migrate", adminOnly, runMigration);
