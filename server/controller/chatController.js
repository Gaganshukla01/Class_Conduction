import mongoose from "mongoose";
import { ChatMessage, ChatReadState, ChatThread, ChatSettings } from "../model/chatModel.js";
import userModel from "../model/userModel.js";
import {
  validateUploadedFile,
  withImageUrls,
  buildDownloadUrl,
  destroyAsset,
  avatarOf,
  ROOT_FOLDER,
} from "../services/cloudinaryService.js";
import { emitToAudience, emitToUsers, onlineCount, isUserOnline } from "../services/socketHub.js";
import { notifyChatMessage } from "../services/notificationService.js";
import { migrateChat } from "../services/chatMigration.js";
import { COMMUNITY, parseRoom, checkRoomAccess, touchThread, markThreadRead, validId } from "../services/chatRooms.js";
import { STAFF_ROLES, isStaffRole } from "../config/roles.js";
import { studentScope } from "../services/scope.js";

// only people whose account is approved can be seen / reached in the chat
const ACTIVE = { accountStatus: { $nin: ["pending", "rejected"] } };

const isAdmin = (req) => isStaffRole(req.user?.userType); // "staff": admin, manager or teacher
const myId = (req) => String(req.userId);

// ---- who can see what in the COMMUNITY room -----------------------------------
// Everyone sees public messages (audience = []). Targeted messages are visible to the
// audience and to every admin only. (Private 1-to-1 chats live in their own rooms.)
export const visibleTo = (user, room = COMMUNITY) =>
  isStaffRole(user?.userType)
    ? { room }
    : { room, $or: [{ audience: { $size: 0 } }, { audience: String(user?._id ?? user?.id) }] };

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

// Adds `senderAvatar` (a small square thumbnail) so every bubble can show a profile photo.
async function withAvatars(list) {
  const ids = [...new Set(list.map((m) => m.senderId).filter(validId))];
  if (!ids.length) return list;
  const users = await userModel.find({ _id: { $in: ids } }).select("avatar").lean();
  const map = new Map(users.map((u) => [String(u._id), avatarOf(u)]));
  return list.map((m) => ({ ...m, senderAvatar: map.get(m.senderId) || null }));
}

const previewOf = (m) =>
  m.type === "extra_class" ? `📌 ${m.text || "Extra class"}` :
  m.file ? (m.file.kind === "pdf" ? "📄 PDF" : "🖼️ Photo") + (m.text ? ` · ${m.text}` : "") :
  m.text || "";

// ---- used by other modules (extra classes, ...) -------------------------------
export async function createChatMessage({ sender, room = COMMUNITY, type = "text", text = "", file, card, audience = [] }) {
  const msg = await ChatMessage.create({
    room,
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
  payload.senderAvatar = sender.avatar !== undefined ? sender.avatar : (await withAvatars([payload]))[0].senderAvatar;

  const parsed = parseRoom(room);
  if (parsed?.type === "dm") {
    emitToUsers("message:new", payload, [parsed.studentId, parsed.teacherId]);
    await touchThread(room, sender, previewOf(payload)).catch((e) => console.error("touchThread:", e.message));
  } else {
    emitToAudience("message:new", payload, payload.audience);
  }

  // E-mail the other side (teacher -> student, student -> teacher). Awaited but capped: on
  // serverless hosting work after the response can be frozen.
  if (type === "text" || type === "file") {
    await Promise.race([notifyChatMessage(payload), new Promise((resolve) => setTimeout(resolve, 6000))]).catch(() => {});
  }
  return payload;
}

// ---- messages ---------------------------------------------------------------
// ?room=community | dm:<student>:<teacher>   ?before=<iso> older page   ?after=<iso> newer (polling)
export const listMessages = async (req, res) => {
  try {
    const room = req.query.room || COMMUNITY;
    const access = await checkRoomAccess(req.user, room);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });

    // presence without sockets: remember when this user last looked at this chat
    ChatReadState.updateOne({ userId: myId(req), room }, { $set: { lastSeenAt: new Date() } }, { upsert: true }).catch(() => {});

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);
    const filter = access.parsed.type === "community" ? visibleTo(req.user) : { room };
    if (req.query.after) {
      const after = new Date(req.query.after);
      if (Number.isNaN(after.getTime())) return res.status(400).json({ success: false, message: "Invalid date." });
      filter.createdAt = { $gt: after };
      const fresh = await ChatMessage.find(filter).sort({ createdAt: 1 }).limit(200).lean();
      return res.status(200).json({ success: true, data: (await withAvatars(fresh)).map(serializeMessage), online: onlineCount() });
    }
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (Number.isNaN(before.getTime())) return res.status(400).json({ success: false, message: "Invalid date." });
      filter.createdAt = { $lt: before };
    }
    const page = await ChatMessage.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
    const hasMore = page.length > limit;
    const data = (await withAvatars(page.slice(0, limit).reverse())).map(serializeMessage);
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
    const room = req.body.room || COMMUNITY;
    const access = await checkRoomAccess(req.user, room, { forSend: true });
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });

    const text = String(req.body.text ?? "").trim();
    if (text.length > 4000) return res.status(400).json({ success: false, message: "Message is too long (max 4000 characters)." });
    let file;
    if (req.body.file) file = validateUploadedFile(req.body.file, `${ROOT_FOLDER}/chat`, "chat");
    if (!text && !file) return res.status(400).json({ success: false, message: "Type a message or attach a file." });

    const message = await createChatMessage({
      sender: { id: req.userId, name: req.user.name, role: isStaffRole(req.user.userType) ? req.user.userType : "student", avatar: avatarOf(req.user) },
      room,
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
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id." });
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found." });
    const access = await checkRoomAccess(req.user, msg.room);
    if (!access.ok) return res.status(403).json({ success: false, message: "Not allowed." });
    if (!isAdmin(req) && msg.senderId !== myId(req)) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages." });
    }
    await msg.deleteOne();
    if (msg.file?.publicId) destroyAsset(msg.file.publicId, msg.file.resourceType).catch(() => {});
    const parsed = parseRoom(msg.room);
    if (parsed?.type === "dm") {
      // the conversation list must not keep showing a deleted message
      const latest = await ChatMessage.findOne({ room: msg.room }).sort({ createdAt: -1 }).lean();
      await ChatThread.updateOne(
        { room: msg.room },
        { $set: { lastMessagePreview: latest ? previewOf(latest) : "", lastSenderId: latest?.senderId || "", ...(latest ? { lastMessageAt: latest.createdAt } : {}) } }
      ).catch(() => {});
      emitToUsers("message:deleted", { _id: String(msg._id), room: msg.room }, [parsed.studentId, parsed.teacherId]);
    } else emitToAudience("message:deleted", { _id: String(msg._id), room: msg.room }, msg.audience);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete the message." });
  }
};

export const markRead = async (req, res) => {
  try {
    const room = req.body?.room || COMMUNITY;
    const access = await checkRoomAccess(req.user, room);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });
    await ChatReadState.findOneAndUpdate({ userId: myId(req), room }, { lastReadAt: new Date() }, { upsert: true });
    await markThreadRead(room, req.user);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not update read state." });
  }
};

// ---- unread counters --------------------------------------------------------
async function communityUnread(req) {
  const state = await ChatReadState.findOne({ userId: myId(req), room: COMMUNITY }).lean();
  if (!state) {
    // first visit: start counting from now, do not flag the whole history
    await ChatReadState.create({ userId: myId(req), room: COMMUNITY }).catch(() => {});
    return 0;
  }
  return ChatMessage.countDocuments({
    ...visibleTo(req.user),
    createdAt: { $gt: state.lastReadAt },
    senderId: { $ne: myId(req) },
  });
}

async function threadUnread(req) {
  const field = isAdmin(req) ? "teacherUnread" : "studentUnread";
  const key = isAdmin(req) ? "teacherId" : "studentId";
  const rows = await ChatThread.find({ [key]: myId(req), [field]: { $gt: 0 } }).select(field).lean();
  return rows.reduce((n, r) => n + (r[field] || 0), 0);
}

export const unreadCount = async (req, res) => {
  try {
    const [community, direct] = await Promise.all([communityUnread(req), threadUnread(req)]);
    res.status(200).json({ success: true, unread: community + direct, community, direct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not count unread messages." });
  }
};

// ---- the conversation list (left side of the messenger) ----------------------
//  student: Community + every teacher         admin: Community + every student
export const listConversations = async (req, res) => {
  try {
    const admin = isAdmin(req);
    const me = myId(req);
    const threads = await ChatThread.find(admin ? { teacherId: me } : { studentId: me }).lean();
    const threadBy = new Map(threads.map((t) => [admin ? t.studentId : t.teacherId, t]));

    let peerFilter;
    if (!admin) peerFilter = { userType: { $in: STAFF_ROLES }, ...ACTIVE }; // students: every teacher / manager / admin
    else {
      const scope = await studentScope(req.user); // a teacher only gets their own students (+ anyone who already wrote to them)
      peerFilter = scope === null ? { userType: "student", ...ACTIVE } : { userType: "student", _id: { $in: [...new Set([...scope, ...threads.map((t) => t.studentId)])].filter(validId) }, ...ACTIVE };
    }
    const peers = await userModel.find(peerFilter).select("name email userType avatar").lean();
    const seenStates = await ChatReadState.find({ room: COMMUNITY, userId: { $in: peers.map((p) => String(p._id)) } }).select("userId lastSeenAt").lean();
    const seen = new Map(seenStates.map((s) => [s.userId, s.lastSeenAt ? new Date(s.lastSeenAt).getTime() : 0]));
    const now = Date.now();

    const items = peers
      .filter((p) => String(p._id) !== me)
      .map((p) => {
        const id = String(p._id);
        const t = threadBy.get(id);
        const studentId = admin ? id : me;
        const teacherId = admin ? me : id;
        return {
          type: "dm",
          room: `dm:${studentId}:${teacherId}`,
          peer: { _id: id, name: p.name, role: admin ? "student" : p.userType, avatar: avatarOf(p), ...(admin ? { email: p.email } : {}), online: isUserOnline(id) || now - (seen.get(id) || 0) < 90000 },
          lastMessageAt: t?.lastMessageAt || null,
          lastMessagePreview: t?.lastMessagePreview || "",
          lastSenderId: t?.lastSenderId || "",
          unread: t ? (admin ? t.teacherUnread : t.studentUnread) || 0 : 0,
        };
      })
      .sort((a, b) => (b.lastMessageAt ? 1 : 0) - (a.lastMessageAt ? 1 : 0) || new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0) || a.peer.name.localeCompare(b.peer.name));

    const [lastCommunity, communityUnreadCount, settings] = await Promise.all([
      ChatMessage.findOne(visibleTo(req.user)).sort({ createdAt: -1 }).lean(),
      communityUnread(req),
      ChatSettings.findOne({ key: "main" }).lean(),
    ]);
    res.status(200).json({
      success: true,
      settings: { studentsCanPost: Boolean(settings?.studentsCanPost) },
      data: [
        {
          type: "community",
          room: COMMUNITY,
          peer: null,
          lastMessageAt: lastCommunity?.createdAt || null,
          lastMessagePreview: lastCommunity ? `${lastCommunity.senderName}: ${previewOf(lastCommunity)}`.slice(0, 140) : "",
          unread: communityUnreadCount,
        },
        ...items,
      ],
    });
  } catch (error) {
    console.error("listConversations:", error);
    res.status(500).json({ success: false, message: "Could not load conversations." });
  }
};

// ---- admin-controlled rules -------------------------------------------------
export const getSettings = async (req, res) => {
  const s = await ChatSettings.findOne({ key: "main" }).lean();
  res.status(200).json({ success: true, data: { studentsCanPost: Boolean(s?.studentsCanPost) } });
};

export const updateSettings = async (req, res) => {
  try {
    if (typeof req.body.studentsCanPost !== "boolean") return res.status(400).json({ success: false, message: "studentsCanPost must be true or false." });
    const s = await ChatSettings.findOneAndUpdate({ key: "main" }, { $set: { studentsCanPost: req.body.studentsCanPost } }, { upsert: true, new: true });
    res.status(200).json({ success: true, data: { studentsCanPost: Boolean(s?.studentsCanPost) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not save the setting." });
  }
};

// ---- members (Community side panel) -------------------------------------------
// Teachers see everyone. Students only see the teachers - they cannot see (or reach) each other.
export const listMembers = async (req, res) => {
  try {
    const admin = isAdmin(req);
    let filter = { ...ACTIVE };
    if (!admin) filter = { userType: { $in: STAFF_ROLES }, ...ACTIVE };
    else {
      const scope = await studentScope(req.user); // teachers: other staff + their own students
      if (scope !== null) filter = { $or: [{ userType: { $in: STAFF_ROLES } }, { _id: { $in: scope.filter(validId) } }], ...ACTIVE };
    }
    const [users, states] = await Promise.all([
      userModel.find(filter).select("name email userType avatar").sort({ name: 1 }).lean(),
      ChatReadState.find({ room: COMMUNITY }).select("userId lastSeenAt").lean(),
    ]);
    const seen = new Map(states.map((s) => [s.userId, s.lastSeenAt]));
    const now = Date.now();
    const data = users
      .map((u) => {
        const id = String(u._id);
        const last = seen.get(id) ? new Date(seen.get(id)).getTime() : 0;
        return {
          _id: id,
          name: u.name,
          role: isStaffRole(u.userType) ? u.userType : "student",
          avatar: avatarOf(u),
          online: isUserOnline(id) || now - last < 90 * 1000 || id === myId(req),
          ...(admin ? { email: u.email } : {}),
        };
      })
      .sort((a, b) => (isStaffRole(a.role) === isStaffRole(b.role) ? 0 : isStaffRole(a.role) ? -1 : 1) || Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
    res.status(200).json({
      success: true,
      data,
      counts: { admins: data.filter((m) => isStaffRole(m.role)).length, students: data.filter((m) => m.role === "student").length, online: data.filter((m) => m.online).length },
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
