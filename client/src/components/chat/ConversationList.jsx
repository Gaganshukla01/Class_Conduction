import { useMemo, useState } from "react";
import { Megaphone, Search } from "lucide-react";
import Avatar from "../ui/Avatar";

const short = (d) => {
  if (!d) return "";
  const date = new Date(d); const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Left side of the messenger. Students: Community + their teachers. Teachers: Community + every student.
export default function ConversationList({ items, active, onSelect, isAdmin, me }) {
  const [q, setQ] = useState("");
  const community = items?.find((i) => i.type === "community");
  const people = useMemo(() => (items || []).filter((i) => i.type === "dm" && i.peer.name.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const active_ = people.filter((i) => i.lastMessageAt);
  const rest = people.filter((i) => !i.lastMessageAt);

  const row = (i) => {
    const isActive = active === i.room;
    const dm = i.type === "dm";
    return (
      <li key={i.room}>
        <button onClick={() => onSelect(i.room)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${isActive ? "bg-white/20" : "hover:bg-white/10"}`}>
          {dm ? <Avatar name={i.peer.name} src={i.peer.avatar} size={44} online={i.peer.online} id={i.peer._id} />
              : <span className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center"><Megaphone size={20} /></span>}
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-white truncate">{dm ? i.peer.name : "Community"}</span>
              <span className={`text-[11px] shrink-0 ${i.unread ? "text-emerald-300" : "text-gray-400"}`}>{short(i.lastMessageAt)}</span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className={`text-xs truncate ${i.unread ? "text-gray-100" : "text-gray-400"}`}>
                {i.lastMessagePreview ? (i.lastSenderId === me ? `You: ${i.lastMessagePreview}` : i.lastMessagePreview) : (dm ? (isAdmin ? "Tap to start a chat" : "Say hello") : "Announcements")}
              </span>
              {i.unread > 0 && <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-[11px] font-bold leading-5 text-center">{i.unread > 99 ? "99+" : i.unread}</span>}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 p-3 border-b border-white/10">
        <h2 className="text-lg font-bold px-1 mb-2">Chats</h2>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAdmin ? "Search students…" : "Search teachers…"} className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 ring-cyan-400 select-text" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-3">
        {!items && <p className="text-sm text-gray-400 px-2 py-4">Loading chats…</p>}
        {community && !q && <ul>{row(community)}</ul>}
        {active_.length > 0 && (
          <div><p className="text-[11px] uppercase tracking-wider text-gray-400 px-3 mb-1">{isAdmin ? "Recent chats" : "Your teachers"}</p><ul>{active_.map(row)}</ul></div>
        )}
        {rest.length > 0 && (
          <div><p className="text-[11px] uppercase tracking-wider text-gray-400 px-3 mb-1">{isAdmin ? `Start a new chat (${rest.length})` : active_.length ? "More teachers" : "Your teachers"}</p><ul>{rest.map(row)}</ul></div>
        )}
        {items && people.length === 0 && <p className="text-sm text-gray-400 px-3 py-4">{q ? "No one matches your search." : isAdmin ? "No students yet." : "No teachers available yet."}</p>}
      </div>
    </div>
  );
}
