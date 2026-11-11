import mongoose from "mongoose";
import { ChatMessage, ChatReadState } from "../model/chatModel.js";
import {
  validateUploadedFile,
  withImageUrls,
  buildDownloadUrl,
  destroyAsset,
  ROOT_FOLDER,
} from "../services/cloudinaryService.js";
import userModel from "../model/userModel.js";
import { emitToAudience, onlineCount, isUserOnline } from "../services/socketHub.js";
import { notifyChatMessage } from "../services/notificationService.js";
import { migrateChat } from "../services/chatMigration.js";

const ROOM = "community";
const isAdmin = (req) => req.user?.userType === "admin";

// ---- who can see what -------------------------------------------------------
// Everyone sees public messages (audience = []). Targeted messages (e.g. an
// extra-class card) are visible to the audience and to every admin only.
export const visibleTo = (user) =>
  user?.userType === "admin"
    ? { room: ROOM }
    : { room: ROOM, $or: [{ audience: { $size: 0 } }, { audience: String(user?._id ?? user?.id) }] };

const serializeFile = (file) => {
  if (!file?.url) return undefined;
  const f = typeof file.toObject === "function" ? file.toObject() : { ...file };
  if (f.kind === "image") return withImageUrls(f, 900);
  return { ...f, viewUrl: f.url, downloadUrl: buildDownloadUrl(f.url, String(f.originalName || "document").replace(/\.pdf$/i, "")) };
};

export const serializeMessage = (m) => {
  const o = typeof m.toObject === "function" ? m.toObject() : { ...m };
  if (o.file) o.file = serializeFile(o.file);
  return o;
};

// ---- helper used by other modules (extra classes, ...) ------------------------
export async function createChatMessage({ sender, type = "text", text = "", file, card, audience = [] }) {
  const msg = await ChatMessage.create({
    room: ROOM,
    senderId: String(sender.id),
    senderName: sender.name,
    senderRole: sender.role,
    type,
    text,
    file,
    card,
    audience: audience.map(String),
  });
  const payload = serializeMessage(msg);
  emitToAudience("message:new", payload, payload.audience);

  // Email the other side (admin -> students, student -> mentors). It is awaited, but
  // capped, because on serverless hosting work after the response can be frozen.
  if (type === "text" || type === "file") {
    await Promise.race([
      notifyChatMessage(payload),
      new Promise((resolve) => setTimeout(resolve, 6000)),
    ]).catch(() => {});
  }
  return payload;
}

// ---- REST -----------------------------------------------------------------
// ?before=<iso>  older page      ?after=<iso>  everything newer (used by polling)
export const listMessages = async (req, res) => {
  try {
    // presence without sockets: remember when this user last looked at the chat
    ChatReadState.updateOne({ userId: String(req.userId), room: ROOM }, { $set: { lastSeenAt: new Date() } }, { upsert: true }).catch(() => {});
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);
    const filter = visibleTo(req.user);
    if (req.query.after) {
      const after = new Date(req.query.after);
      if (Number.isNaN(after.getTime())) return res.status(400).json({ success: false, message: "Invalid date." });
      filter.createdAt = { $gt: after };
      const fresh = await ChatMessage.find(filter).sort({ createdAt: 1 }).limit(200).lean();
      return res.status(200).json({ success: true, data: fresh.map(serializeMessage), online: onlineCount() });
    }
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (Number.isNaN(before.getTime())) return res.status(400).json({ success: false, message: "Invalid date." });
      filter.createdAt = { $lt: before };
    }
    const page = await ChatMessage.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
    const hasMore = page.length > limit;
    const data = page.slice(0, limit).reverse().map(serializeMessage);
    res.status(200).json({ success: true, data, hasMore, online: onlineCount() });
  } catch (error) {
    console.error("listMessages:", error);
    res.status(500).json({ success: false, message: "Could not load messages." });
  }
};

// simple per-user limiter: 20 messages / minute
const hits = new Map();
const allowed = (id) => {
  const now = Date.now();
  const recent = (hits.get(id) || []).filter((t) => now - t < 60000);
  if (recent.length >= 20) { hits.set(id, recent); return false; }
  recent.push(now); hits.set(id, recent); return true;
};

export const sendMessage = async (req, res) => {
  try {
    if (!allowed(req.userId)) {
      return res.status(429).json({ success: false, message: "You are sending messages too fast. Please wait a moment." });
    }
    const text = String(req.body.text ?? "").trim();
    if (text.length > 4000) return res.status(400).json({ success: false, message: "Message is too long (max 4000 characters)." });

    let file;
    if (req.body.file) file = validateUploadedFile(req.body.file, `${ROOT_FOLDER}/chat`, "chat");
    if (!text && !file) return res.status(400).json({ success: false, message: "Type a message or attach a file." });

    const message = await createChatMessage({
      sender: { id: req.userId, name: req.user.name, role: req.user.userType },
      type: file ? "file" : "text",
      text,
      file,
    });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id." });
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found." });
    if (!isAdmin(req) && msg.senderId !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages." });
    }
    await msg.deleteOne();
    if (msg.file?.publicId) destroyAsset(msg.file.publicId, msg.file.resourceType).catch(() => {});
    emitToAudience("message:deleted", { _id: String(msg._id) }, msg.audience);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the message." });
  }
};

export const markRead = async (req, res) => {
  try {
    await ChatReadState.findOneAndUpdate(
      { userId: String(req.userId), room: ROOM },
      { lastReadAt: new Date() },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not update read state." });
  }
};

export const unreadCount = async (req, res) => {
  try {
    const state = await ChatReadState.findOne({ userId: String(req.userId), room: ROOM }).lean();
    if (!state) {
      // first visit: start counting from now, do not flag the whole history
      await ChatReadState.create({ userId: String(req.userId), room: ROOM }).catch(() => {});
      return res.status(200).json({ success: true, unread: 0 });
    }
    const unread = await ChatMessage.countDocuments({
      ...visibleTo(req.user),
      createdAt: { $gt: state.lastReadAt },
      senderId: { $ne: String(req.userId) },
    });
    res.status(200).json({ success: true, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not count unread messages." });
  }
};

// Everyone who can use the chat (all existing accounts) with an online dot.
export const listMembers = async (req, res) => {
  try {
    const [users, states] = await Promise.all([
      userModel.find().select("name email userType").sort({ name: 1 }).lean(),
      ChatReadState.find({ room: ROOM }).select("userId lastSeenAt").lean(),
    ]);
    const seen = new Map(states.map((s) => [s.userId, s.lastSeenAt]));
    const now = Date.now();
    const admin = isAdmin(req);
    const data = users
      .map((u) => {
        const id = String(u._id);
        const last = seen.get(id) ? new Date(seen.get(id)).getTime() : 0;
        return {
          _id: id,
          name: u.name,
          role: u.userType === "admin" ? "admin" : "student",
          online: isUserOnline(id) || now - last < 90 * 1000 || id === String(req.userId),
          ...(admin ? { email: u.email } : {}),
        };
      })
      .sort((a, b) => (a.role === b.role ? 0 : a.role === "admin" ? -1 : 1) || Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
    res.status(200).json({
      success: true,
      data,
      counts: { admins: data.filter((m) => m.role === "admin").length, students: data.filter((m) => m.role === "student").length, online: data.filter((m) => m.online).length },
    });
  } catch (error) {
    console.error("listMembers:", error);
    res.status(500).json({ success: false, message: "Could not load members." });
  }
};

// One-click, safe-to-repeat migration for existing data (admin only).
export const runMigration = async (req, res) => {
  try {
    const result = await migrateChat({ dryRun: req.query.dryRun === "true" });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("chat migration:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
