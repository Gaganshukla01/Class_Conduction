import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AppContent } from "../context/Context";

const POLL_MS = 6000;

const mergeUnique = (list, incoming) => {
  const seen = new Set(list.map((m) => m._id));
  const fresh = incoming.filter((m) => !seen.has(m._id));
  return fresh.length ? [...list, ...fresh].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : list;
};

// State of ONE conversation: "community" or "dm:<student>:<teacher>".
// REST is the source of truth; the shared socket pushes messages instantly, and when there is no
// socket the hook polls every few seconds.  onRead() fires after the room was marked read.
export default function useChat(room, { socket, live, onRead } = {}) {
  const { backend_url } = useContext(AppContent);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [online, setOnline] = useState(null);
  const [typing, setTyping] = useState({});
  const [error, setError] = useState("");
  const messagesRef = useRef([]);
  messagesRef.current = messages;
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const markRead = useCallback(
    () => axios.post(`${backend_url}/api/chat/read`, { room }).then(() => onReadRef.current?.()).catch(() => {}),
    [backend_url, room]
  );

  // ---- first page (reloads when the conversation changes)
  const loadFirstPage = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/chat/messages`, { params: { room } });
      setMessages(data.data);
      setHasMore(data.hasMore);
      setOnline(data.online || null);
      setError("");
      markRead();
    } catch (e) {
      setError(e.response?.data?.message || "Could not load the chat.");
    } finally {
      setLoading(false);
    }
  }, [backend_url, room, markRead]);
  useEffect(() => {
    setMessages([]); setHasMore(false); setTyping({}); setError(""); setLoading(true);
    loadFirstPage();
  }, [loadFirstPage]);

  // ---- real-time events for THIS room
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (m) => {
      if (m.room !== room) return;
      setMessages((list) => mergeUnique(list, [m]));
      if (document.visibilityState === "visible") markRead();
    };
    const onDeleted = ({ _id, room: r }) => { if (!r || r === room) setMessages((list) => list.filter((m) => m._id !== _id)); };
    const onPresence = ({ online: n }) => setOnline(n);
    const onTyping = ({ userId, name, typing: t }) => {
      if (room !== "community") return;
      setTyping((cur) => { const next = { ...cur }; if (t) next[userId] = name; else delete next[userId]; return next; });
    };
    socket.on("message:new", onNew); socket.on("message:deleted", onDeleted); socket.on("presence", onPresence); socket.on("typing", onTyping);
    return () => { socket.off("message:new", onNew); socket.off("message:deleted", onDeleted); socket.off("presence", onPresence); socket.off("typing", onTyping); };
  }, [socket, room, markRead]);

  // ---- polling fallback while the socket is not connected
  useEffect(() => {
    if (live) return undefined;
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      const last = messagesRef.current[messagesRef.current.length - 1];
      try {
        const { data } = await axios.get(`${backend_url}/api/chat/messages`, { params: { room, ...(last ? { after: last.createdAt } : {}) } });
        if (data.data.length) { setMessages((list) => mergeUnique(list, data.data)); markRead(); }
        setOnline(data.online || null);
      } catch { /* keep trying */ }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [live, backend_url, room, markRead]);

  const loadOlder = useCallback(async () => {
    const first = messagesRef.current[0];
    if (!first) return;
    const { data } = await axios.get(`${backend_url}/api/chat/messages`, { params: { room, before: first.createdAt } });
    setMessages((list) => mergeUnique(list, data.data));
    setHasMore(data.hasMore);
  }, [backend_url, room]);

  const send = useCallback(async ({ text, file }) => {
    const { data } = await axios.post(`${backend_url}/api/chat/messages`, { room, text, file });
    setMessages((list) => mergeUnique(list, [data.data])); // the socket echo is de-duplicated by _id
    return data.data;
  }, [backend_url, room]);

  const remove = useCallback(async (id) => {
    await axios.delete(`${backend_url}/api/chat/messages/${id}`);
    setMessages((list) => list.filter((m) => m._id !== id));
  }, [backend_url]);

  const sendTyping = useCallback((t) => { if (room === "community") socket?.emit("typing", t); }, [socket, room]);

  return { messages, loading, hasMore, online, typing, error, reload: loadFirstPage, send, remove, loadOlder, sendTyping };
}
