import { CalendarClock, Clock, ExternalLink, GraduationCap, RefreshCw, UserRound, Video, XCircle } from "lucide-react";
import useNow from "../../hooks/useNow";
import { classStartDate } from "../../utils/classTime";

const fmtDate = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (d) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function when(start, end, now) {
  if (now >= start && now <= end) return { text: "Live now", tone: "bg-emerald-400 text-emerald-950 animate-pulse" };
  if (now > end) return { text: "Ended", tone: "bg-white/20 text-white" };
  const mins = Math.round((start - now) / 60000);
  if (mins < 60) return { text: `Starts in ${Math.max(mins, 1)} min`, tone: "bg-amber-300 text-amber-950" };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `Starts in ${hrs}h ${mins % 60}m`, tone: "bg-amber-300 text-amber-950" };
  return { text: `In ${Math.round(hrs / 24)} day${Math.round(hrs / 24) === 1 ? "" : "s"}`, tone: "bg-white/25 text-white" };
}

// Rich card that appears in chat when an extra / substitute class is created.
export default function ExtraClassCard({ card }) {
  const now = useNow(30000);
  const substitute = card.classType === "substitute";
  const start = classStartDate({ classDate: card.classDate, classTime: card.classTime });
  const hrs = parseFloat(card.duration) || 1;
  const end = new Date(start.getTime() + hrs * 3600000);
  const status = when(start, end, now);

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-slate-900/80 text-left">
      <div className={`px-4 py-3 flex items-center justify-between gap-2 ${substitute ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-gradient-to-r from-indigo-500 to-violet-600"}`}>
        <span className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-white">
          {substitute ? <RefreshCw size={14} /> : <CalendarClock size={14} />}
          {substitute ? "Substitute class" : "Extra class"}{card.updated ? " · updated" : ""}
        </span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status.tone}`}>{status.text}</span>
      </div>

      <div className="p-4 space-y-3">
        {card.replaces && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-400/15 border border-amber-300/30 px-3 py-2 text-sm text-amber-50">
            <RefreshCw size={16} className="shrink-0 mt-0.5 text-amber-300" />
            <span>This replaces your <strong>{card.replaces.className}</strong> class on <strong>{fmtDate(classStartDate({ classDate: card.replaces.classDate, classTime: card.replaces.classTime }))}, {fmtTime(classStartDate({ classDate: card.replaces.classDate, classTime: card.replaces.classTime }))}</strong>.</span>
          </div>
        )}
        <div>
          <h4 className="text-lg font-bold text-white leading-snug">{card.title}</h4>
          {card.topic && <p className="text-sm text-gray-300 mt-0.5">{card.topic}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2"><CalendarClock size={16} className="text-cyan-300 shrink-0" /><span className="text-white">{fmtDate(start)}</span></div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2"><Clock size={16} className="text-cyan-300 shrink-0" /><span className="text-white">{fmtTime(start)} · {hrs}h</span></div>
        </div>

        {(card.instructorName || card.substituteFor) && (
          <div className="text-sm text-gray-300 space-y-1">
            {card.instructorName && <p className="flex items-center gap-2"><GraduationCap size={15} className="text-gray-400" /> Instructor: <span className="text-white font-medium">{card.instructorName}</span></p>}
            {card.substituteFor && <p className="flex items-center gap-2"><UserRound size={15} className="text-gray-400" /> Substituting for: <span className="text-white font-medium">{card.substituteFor}</span></p>}
          </div>
        )}
        {card.note && <p className="text-sm text-amber-100 bg-amber-500/10 border border-amber-400/25 rounded-xl px-3 py-2 whitespace-pre-wrap">{card.note}</p>}

        <a
          href={card.joinUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white text-base bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 active:scale-[0.99] transition shadow-lg shadow-emerald-900/30"
        >
          <Video size={20} /> Join Now <ExternalLink size={15} className="opacity-80" />
        </a>
      </div>
    </div>
  );
}

export function CancelledCard({ card }) {
  const start = classStartDate({ classDate: card.classDate, classTime: card.classTime });
  return (
    <div className="max-w-sm rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 flex items-start gap-3">
      <XCircle className="text-rose-300 shrink-0 mt-0.5" size={20} />
      <div>
        <p className="text-sm font-semibold text-rose-100">Class cancelled</p>
        <p className="text-sm text-gray-200">{card.title}</p>
        {card.restored?.classDate
          ? <p className="text-xs text-emerald-200 mt-0.5">Your regular class stays as scheduled: {fmtDate(classStartDate({ classDate: card.restored.classDate, classTime: card.restored.classTime }))}, {fmtTime(classStartDate({ classDate: card.restored.classDate, classTime: card.restored.classTime }))}.</p>
          : <p className="text-xs text-gray-400 mt-0.5">Was scheduled for {fmtDate(start)}, {fmtTime(start)}</p>}
      </div>
    </div>
  );
}
