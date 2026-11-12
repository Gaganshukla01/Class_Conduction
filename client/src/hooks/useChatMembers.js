import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContent } from "../context/Context";

// Everyone you may see in the Community side panel (students only ever see teachers).
export default function useChatMembers(enabled = true) {
  const { backend_url } = useContext(AppContent);
  const [members, setMembers] = useState({ list: [], counts: null });
  const load = useCallback(
    () => axios.get(`${backend_url}/api/chat/members`).then(({ data }) => setMembers({ list: data.data, counts: data.counts })).catch(() => {}),
    [backend_url]
  );
  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), 60000);
    return () => clearInterval(id);
  }, [enabled, load]);
  return { members, loadMembers: load };
}
