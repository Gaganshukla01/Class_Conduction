import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { CalendarClock, Clock, Video } from "lucide-react";
import { AppContent } from "../../context/Context";
import { classStartDate } from "../../utils/classTime";

const fmt = (c) => { const d = classStartDate(c); return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`; };

// Upcoming (and recent) extra / substitute classes for the logged-in student.
export default function ExtraClassesStudent() {
  const { backend_url } = useContext(AppContent);
  const [list, setList] = useState(null);
  useEffect(() => { axios.get(`${backend_url}/api/extra-classes/mine`).then((r) => setList(r.data.data)).catch(() => setList([])); }, [backend_url]);
  if (!list || list.length === 0) return null;

  const now = Date.now();
  const upcoming = list.filter((c) => c.status === "scheduled" && classStartDate(c).getTime() + (parseFloat(c.classDuration) || 1) * 3600000 > now).sort((a, b) => classStartDate(a) - classStartDate(b));
  const recent = list.filter((c) => !upcoming.includes(c)).slice(0, 5);
  if (upcoming.length === 0 && recent.length === 0) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg p-5 sm:p-6 rounded-3xl border border-white/20 mb-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3"><CalendarClock className="text-amber-300" size={20} /> Extra & substitute classes</h3>
      <ul className="space-y-2">
        {upcoming.map((c) => (
          <li key={c._id} className="flex flex-wrap items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-white font-medium">{c.title} <span className={`ml-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.type === "substitute" ? "bg-amber-500/25 text-amber-200" : "bg-indigo-500/25 text-indigo-200"}`}>{c.type}</span></span>
              <span className="block text-sm text-gray-300 flex items-center gap-1.5"><Clock size={13} /> {fmt(c)} · {c.classDuration}h{c.substituteFor ? ` · for ${c.substituteFor}` : ""}</span>
              {c.replaces && <span className="block text-xs text-amber-200 mt-0.5">Replaces your {c.replaces.className} class on {fmt(c.replaces)}</span>}
            </span>
            <a href={c.classLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-sm font-semibold"><Video size={15} /> Join now</a>
          </li>
        ))}
        {recent.map((c) => (
          <li key={c._id} className="flex flex-wrap items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 opacity-80">
            <span className="min-w-0 flex-1"><span className="block text-gray-200">{c.title}</span><span className="block text-xs text-gray-400">{fmt(c)}</span></span>
            {c.status === "cancelled" ? <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300">Cancelled</span>
              : c.myAttendance ? <span className={`text-xs px-2.5 py-1 rounded-full ${c.myAttendance === "Present" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{c.myAttendance}</span>
              : <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300">Held</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
