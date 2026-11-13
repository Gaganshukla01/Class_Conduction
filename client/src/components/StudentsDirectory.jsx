import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CalendarPlus, CalendarClock, Loader2, MessageSquare, Search, Wallet } from "lucide-react";
import { AppContent } from "../context/Context";
import Avatar from "./ui/Avatar";
import { dayLabel, inr, timeLabel } from "../utils/money";

const rateColor = (r) => (r === null ? "text-gray-400" : r >= 75 ? "text-emerald-300" : r >= 50 ? "text-amber-300" : "text-rose-300");

// "My students" (teacher) / "Students" (admin, manager): who they are and how they are doing.
export default function StudentsDirectory({ title, onMessage, onExtraClass, onPayments }) {
  const { backend_url, userData } = useContext(AppContent);
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const isTeacher = userData?.userType === "teacher";

  useEffect(() => {
    let alive = true;
    axios.get(`${backend_url}/api/user/my-students`).then(({ data }) => alive && setList(data.data)).catch((e) => { toast.error(e.response?.data?.message || "Could not load students"); alive && setList([]); });
    return () => { alive = false; };
  }, [backend_url]);

  const shown = useMemo(() => (list || []).filter((s) => `${s.name} ${s.email} ${s.courses.join(" ")}`.toLowerCase().includes(q.toLowerCase())), [list, q]);
  if (!list) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="text-sm text-gray-300">{isTeacher ? "Students enrolled in the classes you teach." : "Every approved student."} <strong className="text-white">{list.length}</strong> in total.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, e-mail or course…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-gray-300">
          {list.length === 0 ? (isTeacher ? <><p className="font-medium text-white">No students yet</p><p className="text-sm mt-1">Students show up here once an admin or manager schedules a class with you as the teacher.</p></> : "No students yet.") : "No student matches your search."}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <li key={s._id} className="rounded-2xl bg-white/10 border border-white/15 p-4 flex flex-col">
              <div className="flex items-center gap-3">
                <Avatar name={s.name} src={s.avatar} size={48} id={s._id} />
                <div className="min-w-0"><p className="font-semibold truncate">{s.name}</p><p className="text-xs text-gray-400 truncate">{s.email}</p></div>
              </div>
              {s.courses.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{s.courses.slice(0, 4).map((c) => <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200">{c}</span>)}</div>}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="rounded-xl bg-black/20 py-2"><p className="text-[10px] text-gray-400">Attendance</p><p className={`font-bold ${rateColor(s.attendanceRate)}`}>{s.attendanceRate === null ? "-" : `${s.attendanceRate}%`}</p></div>
                <div className="rounded-xl bg-black/20 py-2"><p className="text-[10px] text-gray-400">Classes held</p><p className="font-bold">{s.heldClasses}</p></div>
                <div className="rounded-xl bg-black/20 py-2"><p className="text-[10px] text-gray-400">Fees due</p><p className={`font-bold ${s.pendingAmount > 0 ? "text-rose-300" : "text-emerald-300"}`}>{s.pendingAmount > 0 ? inr(s.pendingAmount) : "Clear"}</p></div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-gray-300 mt-3"><CalendarClock size={13} className="shrink-0" />{s.nextClass ? <>Next: <strong className="text-white">{s.nextClass.className}</strong>, {dayLabel(s.nextClass.at, { weekday: "short", day: "numeric", month: "short" })}</> : "No upcoming class"}</p>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
                <button onClick={() => onMessage?.(s)} className="flex-1 min-w-[96px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-sm font-semibold"><MessageSquare size={15} /> Message</button>
                <button onClick={() => onExtraClass?.(s)} className="flex-1 min-w-[96px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"><CalendarPlus size={15} /> Extra class</button>
                <button onClick={() => onPayments?.(s)} className="flex-1 min-w-[96px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"><Wallet size={15} /> Payments</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
