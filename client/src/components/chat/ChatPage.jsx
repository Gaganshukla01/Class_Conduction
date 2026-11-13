import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AppContent } from "../../context/Context";
import useChatSocket from "../../hooks/useChatSocket";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import { isStaff } from "../../utils/roles";

// The messenger: conversation list (Community + private chats) on the left, the open
// conversation on the right. On phones it shows the list first, then the chat full-screen.
//  * students: Community (read-only unless a teacher allows posting) + private chat with each teacher
//  * teachers: Community + a private chat with every student
//  * students can NEVER message each other
export default function ChatPage() {
  const { backend_url, userData } = useContext(AppContent);
  const isAdmin = isStaff(userData?.userType); // admin, manager or teacher
  const me = userData?.userId;
  const { socket, live } = useChatSocket(true);

  const deepLink = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("room") : null;
  const [items, setItems] = useState(null);
  const [settings, setSettings] = useState({ studentsCanPost: false });
  const [room, setRoom] = useState(deepLink || "community");
  const [showList, setShowList] = useState(!deepLink);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/chat/conversations`);
      setItems(data.data);
      setSettings(data.settings);
    } catch { setItems((cur) => cur || []); }
  }, [backend_url]);
  // debounced so a burst of events triggers a single refresh
  const refresh = useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(load, 400); }, [load]);

  useEffect(() => { load(); return () => clearTimeout(timer.current); }, [load]);
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && load(), live ? 60000 : 15000);
    return () => clearInterval(id);
  }, [load, live]);
  useEffect(() => {
    if (!socket) return undefined;
    socket.on("message:new", refresh); socket.on("message:deleted", refresh);
    return () => { socket.off("message:new", refresh); socket.off("message:deleted", refresh); };
  }, [socket, refresh]);

  const select = (r) => { setRoom(r); setShowList(false); };
  const active = items?.find((i) => i.room === room);
  // a deep-linked / just-opened private chat may not be in the list yet
  const peer = active?.peer || null;
  const firstTeacher = () => { const t = items?.find((i) => i.type === "dm"); if (t) select(t.room); else setShowList(true); };

  return (
    <div className="h-full min-h-0 flex rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-slate-900/50 backdrop-blur-lg shadow-2xl text-white">
      <div className={`${showList ? "flex" : "hidden"} lg:flex flex-col w-full lg:w-80 xl:w-96 shrink-0 min-h-0 lg:border-r border-white/10 bg-slate-900/30`}>
        <ConversationList items={items} active={room} onSelect={select} isAdmin={isAdmin} me={me} />
      </div>
      <div className={`${showList ? "hidden" : "flex"} lg:flex flex-col flex-1 min-w-0 min-h-0`}>
        <ChatView
          key={room}
          room={room}
          peer={peer}
          settings={settings}
          socket={socket}
          live={live}
          onBack={() => setShowList(true)}
          onRead={refresh}
          onSent={refresh}
          onSettingsChange={setSettings}
          onOpenList={firstTeacher}
        />
      </div>
    </div>
  );
}
