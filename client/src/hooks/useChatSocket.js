import { useContext, useEffect, useState } from "react";
import { AppContent } from "../context/Context";

// One Socket.io connection for the whole messenger. `socket` is null when the server has no
// WebSocket support (e.g. API on Vercel serverless) - everything then falls back to polling.
export default function useChatSocket(enabled = true) {
  const { backend_url, userData } = useContext(AppContent);
  const [socket, setSocket] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!enabled || !userData?.userId) return undefined;
    let cancelled = false;
    let s;
    (async () => {
      let io;
      try { ({ io } = await import("socket.io-client")); } catch { return; }
      if (cancelled) return;
      s = io(backend_url, { withCredentials: true, reconnectionAttempts: 4, timeout: 6000 });
      s.on("connect", () => setLive(true));
      s.on("disconnect", () => setLive(false));
      s.on("connect_error", () => setLive(false));
      setSocket(s);
    })();
    return () => { cancelled = true; s?.disconnect(); setSocket(null); setLive(false); };
  }, [enabled, backend_url, userData?.userId]);

  return { socket, live };
}
