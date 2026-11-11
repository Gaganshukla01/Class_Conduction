import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContent } from "../context/Context";

// Unread-message badge for the sidebar. Not polled while the chat is open.
export default function useChatUnread(chatOpen) {
  const { backend_url, isLoggedIn } = useContext(AppContent);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    if (chatOpen) { setUnread(0); return undefined; }
    let alive = true;
    const load = () =>
      document.visibilityState === "visible" &&
      axios.get(`${backend_url}/api/chat/unread`).then(({ data }) => alive && setUnread(data.unread || 0)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [backend_url, isLoggedIn, chatOpen]);

  return unread;
}
