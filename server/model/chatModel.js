import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    resourceType: { type: String, default: "image" },
    kind: { type: String, enum: ["image", "pdf"] },
    format: String,
    bytes: Number,
    originalName: String,
  },
  { _id: false }
);

// One message in the community group chat (every student + every teacher/admin).
const chatMessageSchema = new mongoose.Schema(
  {
    room: { type: String, default: "community", index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["admin", "student", "system"], required: true },
    type: { type: String, enum: ["text", "file", "extra_class", "system"], default: "text" },
    text: { type: String, default: "", maxlength: 4000 },
    file: { type: fileSchema, default: undefined },
    // Rich card (e.g. the "Extra class" card with a Join Now button)
    card: { type: mongoose.Schema.Types.Mixed, default: undefined },
    // Empty = visible to everyone. Otherwise only these users (+ all admins) can see it.
    audience: { type: [String], default: [] },
    // set on messages imported from the old Common Area, so the import can be re-run safely
    legacyId: { type: String, index: true },
  },
  { timestamps: true }
);
chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ audience: 1, createdAt: -1 });

// Per-user "last read" marker, used for the unread badge.
const chatReadStateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  room: { type: String, default: "community" },
  lastReadAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date }, // last time the user polled / opened the chat (presence without sockets)
  lastEmailedAt: { type: Date }, // last "new chat message" email (cool-down)
});
chatReadStateSchema.index({ userId: 1, room: 1 }, { unique: true });

export const ChatMessage =
  mongoose.models.chatMessage || mongoose.model("chatMessage", chatMessageSchema);
export const ChatReadState =
  mongoose.models.chatReadState || mongoose.model("chatReadState", chatReadStateSchema);

// One private 1-to-1 conversation between ONE student and ONE teacher/admin.
// Room id = "dm:<studentId>:<teacherId>". Students can never message each other.
const chatThreadSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, index: true },
    teacherId: { type: String, required: true, index: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
    lastSenderId: { type: String, default: "" },
    studentUnread: { type: Number, default: 0 },
    teacherUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);
chatThreadSchema.index({ teacherId: 1, lastMessageAt: -1 });
chatThreadSchema.index({ studentId: 1, lastMessageAt: -1 });

// Admin-controlled chat rules (single document).
const chatSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  // false = the Community channel is read-only for students (teachers announce, students talk to
  // teachers privately). true = students may also post in Community.
  studentsCanPost: { type: Boolean, default: false },
});

export const ChatThread =
  mongoose.models.chatThread || mongoose.model("chatThread", chatThreadSchema);
export const ChatSettings =
  mongoose.models.chatSettings || mongoose.model("chatSettings", chatSettingsSchema);
