import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Code2 } from "lucide-react";
import { AppContent } from "../../context/Context";
import QuestionSolver from "./QuestionSolver";
import { DifficultyBadge, LanguageBadge, StatusBadge, day } from "../questions/questionKit";

const FILTERS = [
  ["all", "All"],
  ["assigned", "To do"],
  ["needs_work", "Needs work"],
  ["submitted", "Submitted"],
  ["accepted", "Accepted"],
];

export default function StudentQuestions() {
  const { backend_url } = useContext(AppContent);
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    axios.get(`${backend_url}/api/questions/assignments/mine`)
      .then((r) => setItems(r.data.data))
      .catch((e) => { setItems([]); toast.error(e.response?.data?.message || "Could not load your questions"); });
  }, [backend_url]);

  const counts = useMemo(() => {
    const c = { all: items?.length || 0 };
    (items || []).forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [items]);

  const shown = (items || []).filter((a) => filter === "all" || a.status === filter);
  const open = items?.find((a) => a._id === openId);

  if (open) {
    return (
      <QuestionSolver
        key={open._id}
        assignment={open}
        onBack={() => setOpenId(null)}
        onUpdated={(updated) => setItems((list) => list.map((a) => (a._id === updated._id ? updated : a)))}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Code2 className="text-cyan-300" /> Code Questions</h2>
        <p className="text-gray-300 text-sm">Questions your instructor assigned to you. Open one, write your solution, run it and submit.</p>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${filter === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
              {label} <span className="opacity-70">({counts[id] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {items === null ? <p className="text-gray-300">Loading…</p> : shown.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20 text-center">
          <Code2 size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{items.length === 0 ? "No questions yet" : "Nothing here"}</h3>
          <p className="text-gray-300">{items.length === 0 ? "When your instructor assigns a coding question it will show up here (you'll get an email too)." : "No questions match this filter."}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((a) => {
            const overdue = a.dueDate && new Date(a.dueDate) < new Date() && ["assigned", "needs_work"].includes(a.status);
            return (
              <button key={a._id} onClick={() => setOpenId(a._id)} className="text-left bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{a.question.title}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">{a.question.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <LanguageBadge language={a.question.language} /> <DifficultyBadge difficulty={a.question.difficulty} />
                  {a.dueDate && <span className={`text-xs ${overdue ? "text-rose-300" : "text-gray-400"}`}>Due {day(a.dueDate)}{overdue ? " · overdue" : ""}</span>}
                  {a.submissions.length > 0 && <span className="text-xs text-gray-400">{a.submissions.length} attempt{a.submissions.length === 1 ? "" : "s"}</span>}
                </div>
                {a.status === "needs_work" && a.feedback && <p className="mt-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2 line-clamp-2">Feedback: {a.feedback}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
