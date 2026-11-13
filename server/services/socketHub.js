import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import { isApproved, isStaffRole } from "../config/roles.js";

// Real-time push for the community chat (Socket.io).
//
// IMPORTANT: Socket.io needs a long-running Node process. Vercel serverless
// functions cannot keep WebSocket connections open, so on Vercel this module
// stays inactive and the chat falls back to short polling over the REST API
// (which always works). Host the API on Render / Railway / Fly.io / a VPS to get
// instant delivery.
let io = null;
const online = new Map(); // userId -> open sockets

const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );

export const getIo = () => io;
export const onlineCount = () => online.size;
export const isUserOnline = (id) => online.has(String(id));

export async function initSocket(httpServer, origins = []) {
  let Server;
  try {
    ({ Server } = await import("socket.io"));
  } catch {
    console.warn("[socket] 'socket.io' is not installed - chat will use polling. Run: npm install");
    return null;
  }

  io = new Server(httpServer, {
    serveClient: false,
    cors: { origin: origins.filter(Boolean), credentials: true },
  });

  // Auth: same JWT cookie the REST API uses
  io.use(async (socket, next) => {
    try {
      const { token } = parseCookies(socket.handshake.headers.cookie);
      if (!token) return next(new Error("unauthorized"));
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(id).select("name userType accountStatus").lean();
      if (!user || !isApproved(user)) return next(new Error("unauthorized"));
      socket.data.user = { id: String(user._id), name: user.name, role: user.userType };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { id, name, role } = socket.data.user;
    socket.join("community");
    socket.join(`user:${id}`);
    if (isStaffRole(role)) socket.join("admins");

    online.set(id, (online.get(id) || 0) + 1);
    io.to("community").emit("presence", { online: online.size });

    socket.on("typing", (typing) => {
      socket.to("community").emit("typing", { userId: id, name, typing: Boolean(typing) });
    });

    socket.on("disconnect", () => {
      const left = (online.get(id) || 1) - 1;
      if (left <= 0) online.delete(id);
      else online.set(id, left);
      io.to("community").emit("presence", { online: online.size });
    });
  });

  console.log("[socket] Socket.io is running");
  return io;
}

// Private (1-to-1) message -> just those users.
export function emitToUsers(event, payload, userIds = []) {
  if (!io) return;
  let target = null;
  userIds.forEach((id) => { target = (target || io).to(`user:${id}`); });
  target?.emit(event, payload);
}

// Public message -> everyone. Targeted message -> the audience + all admins.
export function emitToAudience(event, payload, audience = []) {
  if (!io) return;
  if (!audience || audience.length === 0) {
    io.to("community").emit(event, payload);
    return;
  }
  let target = io.to("admins");
  audience.forEach((id) => (target = target.to(`user:${id}`)));
  target.emit(event, payload);
}
