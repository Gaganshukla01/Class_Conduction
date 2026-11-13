import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, Search } from "lucide-react";
import { AppContent } from "../context/Context";
import Avatar from "./ui/Avatar";
import { ROLE_LABEL } from "../utils/roles";

const ROLES = ["student", "teacher", "manager", "admin"];
const roleColor = { admin: "bg-rose-500/20 text-rose-200", manager: "bg-amber-500/20 text-amber-200", teacher: "bg-violet-500/20 text-violet-200", student: "bg-sky-500/20 text-sky-200" };

// Admin: change what somebody can do. (New people are approved in "Account approvals".)
export default function UserRoles() {
  const { backend_url, allUserData, getAllUserData, userData } = useContext(AppContent);
  const [q, setQ] = useState("");
  const [role, setRole] = useState({}); // id -> chosen role
  const [busy, setBusy] = useState(null);
  const users = allUserData?.data || [];
  const shown = useMemo(() => users.filter((u) => `${u.name} ${u.email} ${u.userType}`.toLowerCase().includes(q.toLowerCase())), [users, q]);

  const save = async (u) => {
    setBusy(u._id);
    try {
      // `targetUserId`, NOT `userId`: the server always replaces `userId` with the id of whoever is logged in
      const { data } = await axios.put(`${backend_url}/api/user/usertypeupdate`, { targetUserId: u._id, userType: role[u._id] });
      toast.success(`${u.name} is now ${ROLE_LABEL[role[u._id]]}`);
      setRole((r) => { const n = { ...r }; delete n[u._id]; return n; });
      await getAllUserData();
    } catch (e) { toast.error(e.response?.data?.message || "Could not change the role"); } finally { setBusy(null); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">User roles</h1>
        <p className="text-sm text-gray-300">Change what a person can do. <strong className="text-white">Student</strong> learns; <strong className="text-white">Teacher</strong> sees only their own students; <strong className="text-white">Manager</strong> runs schedules, courses and payments; <strong className="text-white">Admin</strong> can do everything, including approving accounts.</p>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a person…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
      </div>
      <ul className="space-y-2">
        {shown.map((u) => {
          const me = u._id === userData?.userId;
          const changed = role[u._id] && role[u._id] !== u.userType;
          return (
            <li key={u._id} className="rounded-2xl bg-white/10 border border-white/15 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar name={u.name} src={u.avatar} size={42} id={u._id} />
                <div className="min-w-0"><p className="font-semibold truncate">{u.name}{me && <span className="text-gray-400 font-normal"> (you)</span>}</p><p className="text-xs text-gray-400 truncate">{u.email}</p></div>
                <span className={`ml-auto sm:ml-2 text-[11px] px-2 py-0.5 rounded-full shrink-0 ${roleColor[u.userType]}`}>{ROLE_LABEL[u.userType]}</span>
              </div>
              <div className="flex items-center gap-2">
                <select disabled={me} value={role[u._id] || u.userType} onChange={(e) => setRole((r) => ({ ...r, [u._id]: e.target.value }))} className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50" aria-label={`Role of ${u.name}`}>
                  {ROLES.map((r) => <option key={r} value={r} className="text-black">{ROLE_LABEL[r]}</option>)}
                </select>
                <button onClick={() => save(u)} disabled={!changed || busy === u._id} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-40">{busy === u._id && <Loader2 size={14} className="animate-spin" />} Save</button>
              </div>
            </li>
          );
        })}
        {shown.length === 0 && <li className="text-center text-gray-300 py-10">No one matches.</li>}
      </ul>
    </div>
  );
}
