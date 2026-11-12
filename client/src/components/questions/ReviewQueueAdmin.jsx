import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, ClipboardCheck, Clock, Loader2, RotateCcw, Search } from "lucide-react";
import { AppContent } from "../../context/Context";
import { DifficultyBadge, LanguageBadge, MatchBadge, Modal, StatusBadge, when } from "./questionKit";
import ReviewPanel from "./ReviewPanel";
import Avatar from "../ui/Avatar";

const TABS = [
  ["submitted", "To review", Clock, "text-cyan-300"],
  ["needs_work", "Needs work", RotateCcw, "text-amber-300"],
  ["accepted", "Approved", CheckCircle2, "text-emerald-300"],
];

// Dedicated "Submissions to Review" dashboard: every student's submitted coding
// question in one queue. Click one to read the code, compare output and approve / grade.
export default function ReviewQueueAdmin() {
  const { backend_url } = useContext(AppContent);
  const [status, setStatus] = useState("submitted");
  const [list, setList] = useState(null);
  const [counts, setCounts] = useState({});
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState([]);
  const [open, setOpen] = useState(null); // { loading, assignment, question, index }

  useEffect(() => {
    axios.get(`${backend_url}/api/question-folders`).then((r) => setFolders(r.data.data.tree)).catch(() => {});
  }, [backend_url]);

  const load = async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/questions/review-queue`, { params: { status, q: q || undefined, folderId: folderId || undefined } });
      setList(data.data); setCounts(data.counts || {});
      return data.data;
    } catch (e) { setList([]); toast.error(e.response?.data?.message || "Could not load submissions"); return []; }
  };
  useEffect(() => { setList(null); const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [status, q, folderId]); // eslint-disable-line

  const openFrom = async (items, index) => {
    setOpen({ loading: true, index });
    try {
      const { data } = await axios.get(`${backend_url}/api/questions/assignments/${items[index]._id}`);
      setOpen({ loading: false, index, assignment: data.data, question: data.data.question });
    } catch (e) { setOpen(null); toast.error(e.response?.data?.message || "Could not open the submission"); }
  };

  // After a review, refresh the queue and jump straight to the next waiting submission.
  const onSaved = async (updated) => {
    const idx = open.index;
    const fresh = await load();
    if (status === "submitted") {
      if (fresh[idx]) openFrom(fresh, idx); // the reviewed item left the queue, so the next one sits at the same index
      else { setOpen(null); toast.info("All caught up - nothing left to review."); }
    } else setOpen((o) => ({ ...o, assignment: { ...o.assignment, ...updated } }));
  };

  const catOptions = useMemo(() => folders.flatMap((c) => [{ id: c._id, label: c.name }, ...c.sessions.map((s) => ({ id: s._id, label: `${c.name} / ${s.name}` }))]), [folders]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="text-cyan-300" /> Submissions to Review</h2>
        <p className="text-gray-300 text-sm mt-1">Every submitted coding question, oldest first. Open one to read the code, compare the output and approve or send it back.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TABS.map(([id, label, Icon, tone]) => (
          <button key={id} onClick={() => setStatus(id)} className={`rounded-2xl p-3 sm:p-4 text-left border transition ${status === id ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
            <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wide text-gray-300">{label}</span><Icon size={18} className={tone} /></div>
            <p className={`text-3xl font-bold mt-1 ${tone}`}>{counts[id] || 0}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student name or email…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>
        <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white max-w-full">
          <option value="" className="text-black">All categories & sessions</option>
          {catOptions.map((o) => <option key={o.id} value={o.id} className="text-black">{o.label}</option>)}
        </select>
      </div>

      {list === null ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div> : list.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">
          {status === "submitted" ? "🎉 Nothing is waiting for review." : "Nothing here yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((a, i) => (
            <li key={a._id}>
              <button onClick={() => openFrom(list, i)} className="w-full text-left bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl px-4 py-3 transition flex flex-wrap items-center gap-x-4 gap-y-2">
                <Avatar name={a.student.name} src={a.student.avatar} size={40} />
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block font-semibold text-white truncate">{a.student.name}</span>
                  <span className="block text-sm text-gray-200 truncate">{a.question.title}</span>
                  <span className="block text-xs text-cyan-300 truncate">{a.question.path}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {a.question.language && <LanguageBadge language={a.question.language} />}
                  {a.question.difficulty && <DifficultyBadge difficulty={a.question.difficulty} />}
                  {a.question.language !== "html" && a.status === "submitted" && <MatchBadge value={a.outputMatches} />}
                </span>
                <span className="text-xs text-gray-400 text-right ml-auto">
                  {a.attempts} attempt{a.attempts === 1 ? "" : "s"}<br />{when(a.lastSubmittedAt)}
                </span>
                <span className="flex items-center gap-2">{a.score != null && <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-200">{a.score}/100</span>}<StatusBadge status={a.status} /></span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal wide title={open.assignment ? `${open.assignment.student?.name} · ${open.question?.title}` : "Loading…"} onClose={() => setOpen(null)}>
          {open.loading || !open.assignment ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div> : (
            <ReviewPanel backend_url={backend_url} assignment={open.assignment} question={open.question} onSaved={onSaved} />
          )}
        </Modal>
      )}
    </div>
  );
}
