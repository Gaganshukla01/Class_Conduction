import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AppContent } from "../context/Context";

const POLL_MS = 6000;

const mergeUnique = (list, incoming) => {
  const seen = new Set(list.map((m) => m._id));
  const fresh = incoming.filter((m) => !seen.has(m._id));
  return fresh.length ? [...list, ...fresh].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : list;
};

// Community chat state. REST is the source of truth; Socket.io (when the server
// supports it) pushes messages instantly, and if the socket is unavailable
// (e.g. API hosted on Vercel serverless) the hook polls every few seconds.
export default function useChat(enabled = true) {
  const { backend_url, userData } = useContext(AppContent);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [online, setOnline] = useState(null);
  const [live, setLive] = useState(false); // true = socket connected
  const [typing, setTyping] = useState({}); // userId -> name
  const [error, setError] = useState("");
  const [members, setMembers] = useState({ list: [], counts: null });
  const messagesRef = useRef([]);
  const socketRef = useRef(null);
  messagesRef.current = messages;

  const markRead = useCallback(() => axios.post(`${backend_url}/api/chat/read`).catch(() => {}), [backend_url]);

  // ---- first page (also used by reload() after the old-message import)
  const loadFirstPage = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/chat/messages`);
      setMessages(data.data);
      setHasMore(data.hasMore);
      setOnline(data.online || null);
      markRead();
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not load the chat.");
    } finally {
      setLoading(false);
    }
  }, [backend_url, markRead]);
  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    loadFirstPage();
  }, [enabled, loadFirstPage]);

  // ---- everyone who can use the chat (all existing accounts) + who is online
  const loadMembers = useCallback(
    () => axios.get(`${backend_url}/api/chat/members`).then(({ data }) => setMembers({ list: data.data, counts: data.counts })).catch(() => {}),
    [backend_url]
  );
  useEffect(() => {
    if (!enabled) return undefined;
    loadMembers();
    const id = setInterval(() => document.visibilityState === "visible" && loadMembers(), 60000);
    return () => clearInterval(id);
  }, [enabled, loadMembers]);

  // ---- real-time socket (optional)
  useEffect(() => {
    if (!enabled || !userData?.userId) return undefined;
    let cancelled = false;
    (async () => {
      let io;
      try { ({ io } = await import("socket.io-client")); } catch { return; }
      if (cancelled) return;
      const socket = io(backend_url, { withCredentials: true, reconnectionAttempts: 4, timeout: 6000 });
      socketRef.current = socket;
      socket.on("connect", () => setLive(true));
      socket.on("disconnect", () => setLive(false));
      socket.on("connect_error", () => setLive(false));
      socket.on("message:new", (m) => {
        setMessages((list) => mergeUnique(list, [m]));
        if (document.visibilityState === "visible") markRead();
      });
      socket.on("message:deleted", ({ _id }) => setMessages((list) => list.filter((m) => m._id !== _id)));
      socket.on("presence", ({ online: n }) => setOnline(n));
      socket.on("typing", ({ userId, name, typing: t }) =>
        setTyping((cur) => { const next = { ...cur }; if (t) next[userId] = name; else delete next[userId]; return next; }));
    })();
    return () => { cancelled = true; socketRef.current?.disconnect(); socketRef.current = null; setLive(false); };
  }, [enabled, backend_url, userData?.userId, markRead]);

  // ---- polling fallback while the socket is not connected
  useEffect(() => {
    if (!enabled || live) return undefined;
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      const last = messagesRef.current[messagesRef.current.length - 1];
      try {
        const { data } = await axios.get(`${backend_url}/api/chat/messages`, { params: last ? { after: last.createdAt } : {} });
        if (data.data.length) { setMessages((list) => mergeUnique(list, data.data)); markRead(); }
        setOnline(data.online || null);
      } catch { /* keep trying */ }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, live, backend_url, markRead]);

  const loadOlder = useCallback(async () => {
    const first = messagesRef.current[0];
    if (!first) return;
    const { data } = await axios.get(`${backend_url}/api/chat/messages`, { params: { before: first.createdAt } });
    setMessages((list) => mergeUnique(list, data.data));
    setHasMore(data.hasMore);
  }, [backend_url]);

  const send = useCallback(async ({ text, file }) => {
    const { data } = await axios.post(`${backend_url}/api/chat/messages`, { text, file });
    setMessages((list) => mergeUnique(list, [data.data])); // the socket echo is de-duplicated by _id
    return data.data;
  }, [backend_url]);

  const remove = useCallback(async (id) => {
    await axios.delete(`${backend_url}/api/chat/messages/${id}`);
    setMessages((list) => list.filter((m) => m._id !== id));
  }, [backend_url]);

  const sendTyping = useCallback((t) => socketRef.current?.emit("typing", t), []);

  return { messages, loading, hasMore, online, live, typing, error, members, loadMembers, reload: loadFirstPage, send, remove, loadOlder, sendTyping };
}
