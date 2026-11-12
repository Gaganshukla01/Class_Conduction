import { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { DownloadCloud, Loader2, Search } from "lucide-react";
import Avatar from "../ui/Avatar";

// People you can see in the Community: teachers see everyone, students only see the teachers.
export default function MembersList({ members, me, isAdmin, backend_url, onMigrated }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const list = members?.list || [];
  const shown = useMemo(() => list.filter((m) => `${m.name} ${m.email || ""}`.toLowerCase().includes(q.toLowerCase())), [list, q]);
  const groups = [["Teachers & admins", shown.filter((m) => m.role === "admin")], ["Students", shown.filter((m) => m.role !== "admin")]];

  const migrate = async () => {
    if (!window.confirm("Import the old Common Area messages into the chat and set everyone up? It is safe to run more than once.")) return;
    setBusy(true);
    try {
      const { data } = await axios.post(`${backend_url}/api/chat/migrate`);
      const r = data.result;
      toast.success(`Done: ${r.users} users ready, ${r.legacyImported} old message(s) imported${r.welcomePosted ? ", welcome message posted" : ""}.`);
      onMigrated?.();
    } catch (e) { toast.error(e.response?.data?.message || "Migration failed"); } finally { setBusy(false); }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 p-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 ring-cyan-400 select-text" />
        </div>
        {members?.counts && <p className="text-xs text-gray-400 mt-2">{members.counts.admins + members.counts.students} members · <span className="text-emerald-300">{members.counts.online} online</span></p>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3 space-y-4">
        {list.length === 0 && <p className="text-sm text-gray-400 px-1">Loading members…</p>}
        {groups.map(([title, people]) => people.length > 0 && (
          <div key={title}>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1.5 px-1">{title} ({people.length})</p>
            <ul className="space-y-0.5">
              {people.map((m) => (
                <li key={m._id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5">
                  <Avatar name={m.name} src={m.avatar} size={36} online={m.online} id={m._id} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white truncate">{m.name}{m._id === me && <span className="text-gray-400"> (you)</span>}</span>
                    {m.email && <span className="block text-[11px] text-gray-400 truncate">{m.email}</span>}
                  </span>
                  {m.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-semibold">Teacher</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {isAdmin && (
        <div className="shrink-0 p-3 border-t border-white/10">
          <button onClick={migrate} disabled={busy} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-gray-200 disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />} Set up chat for existing users & import old Common Area messages
          </button>
        </div>
      )}
    </div>
  );
}
