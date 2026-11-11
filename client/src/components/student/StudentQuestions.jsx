import { useMemo, useState } from "react";
import { ChevronRight, Code2, Folder } from "lucide-react";
import QuestionSolver from "./QuestionSolver";
import { ProgressBar } from "./chartKit";
import { buildQuestionTree, UNFILED_ID } from "../../utils/questionTree";
import { DifficultyBadge, LanguageBadge, StatusBadge, day } from "../questions/questionKit";
import { FOLDER_COLORS } from "../ResourceLibraryAdmin";

const FILTERS = [["all", "All"], ["assigned", "To do"], ["needs_work", "Needs work"], ["submitted", "Submitted"], ["accepted", "Accepted"]];

// Student portal for coding questions, mirroring the admin hierarchy:
//   Category (e.g. "Python WebDev")  >  Session ("Session 01")  >  Questions
// Items come from the parent so the Progress tab and this tab always agree.
export default function StudentQuestions({ items, folders, loading, onUpdated }) {
  const [filter, setFilter] = useState("all");
  const [nav, setNav] = useState({ cat: null, ses: null });
  const [openId, setOpenId] = useState(null);

  const tree = useMemo(() => buildQuestionTree(items || [], folders || []), [items, folders]);
  const cat = tree.find((c) => String(c._id) === String(nav.cat));
  const ses = cat?.sessions.find((s) => String(s._id) === String(nav.ses));
  const open = (items || []).find((a) => a._id === openId);

  const counts = useMemo(() => {
    const c = { all: items?.length || 0 };
    (items || []).forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [items]);

  if (open) return <QuestionSolver key={open._id} assignment={open} onBack={() => setOpenId(null)} onUpdated={onUpdated} />;

  const pathLabel = (a) => {
    const s = tree.flatMap((c) => c.sessions.map((x) => ({ c, x }))).find(({ x }) => x.items.some((i) => i._id === a._id));
    return s ? (s.c._id === UNFILED_ID ? "Other questions" : `${s.c.name} / ${s.x.name}`) : "";
  };
  const flat = filter !== "all";
  const visible = ses ? ses.items : [];
  const questionList = (list, showPath) => (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((a) => {
        const overdue = a.dueDate && new Date(a.dueDate) < new Date() && ["assigned", "needs_work"].includes(a.status);
        return (
          <button key={a._id} onClick={() => setOpenId(a._id)} className="text-left bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition">
            <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold text-white">{a.question.title}</h3><StatusBadge status={a.status} /></div>
            {showPath && <p className="text-xs text-cyan-300 mt-0.5">{pathLabel(a)}</p>}
            <p className="text-sm text-gray-300 mt-2 line-clamp-2">{a.question.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <LanguageBadge language={a.question.language} /> <DifficultyBadge difficulty={a.question.difficulty} />
              {a.dueDate && <span className={`text-xs ${overdue ? "text-rose-300" : "text-gray-400"}`}>Due {day(a.dueDate)}{overdue ? " · overdue" : ""}</span>}
              {a.submissions.length > 0 && <span className="text-xs text-gray-400">{a.submissions.length} attempt{a.submissions.length === 1 ? "" : "s"}</span>}
              {a.score != null && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">{a.score}/100</span>}
            </div>
            {a.status === "needs_work" && a.feedback && <p className="mt-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2 line-clamp-2">Feedback: {a.feedback}</p>}
          </button>
        );
      })}
    </div>
  );

  const folderCard = (f, onOpen, subtitle) => (
    <button key={f._id} onClick={onOpen} className="text-left bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition">
      <div className="flex items-start gap-3">
        <span className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${FOLDER_COLORS[f.color] || FOLDER_COLORS.indigo} flex items-center justify-center`}><Folder size={24} /></span>
        <span className="min-w-0 flex-1"><span className="block font-semibold text-white truncate">{f.name}</span><span className="block text-xs text-gray-300 mt-0.5">{subtitle}</span></span>
        <span className="text-lg font-bold text-emerald-300">{f.rate}%</span>
      </div>
      <div className="mt-4"><ProgressBar value={f.rate} color="linear-gradient(90deg,#34d399,#22d3ee)" /></div>
      <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{f.accepted}/{f.total} accepted</span>
        {f.todo > 0 && <span className="px-2 py-0.5 rounded-full bg-gray-500/25 text-gray-200">{f.todo} to do</span>}
        {f.needsWork > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{f.needsWork} needs work</span>}
        {f.submitted > 0 && <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">{f.submitted} in review</span>}
        {f.overdue > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">{f.overdue} overdue</span>}
      </div>
    </button>
  );

  const goRoot = () => setNav({ cat: null, ses: null });

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Code2 className="text-cyan-300" /> Code Questions</h2>
        <p className="text-gray-300 text-sm">Questions your instructor assigned to you, organised by subject and session.</p>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${filter === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
              {label} <span className="opacity-70">({counts[id] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-300">Loading…</p> : (items || []).length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20 text-center">
          <Code2 size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No questions yet</h3>
          <p className="text-gray-300">When your instructor assigns coding questions they will show up here (you will get an email too).</p>
        </div>
      ) : flat ? (
        (items || []).filter((a) => a.status === filter).length === 0
          ? <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-300">Nothing here.</div>
          : questionList((items || []).filter((a) => a.status === filter), true)
      ) : (
        <>
          <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-300">
            <button onClick={goRoot} className={`hover:text-white ${!cat ? "text-white font-semibold" : ""}`}>All subjects</button>
            {cat && <><ChevronRight size={14} /><button onClick={() => setNav({ cat: cat._id, ses: null })} className={`hover:text-white ${!ses ? "text-white font-semibold" : ""}`}>{cat.name}</button></>}
            {ses && <><ChevronRight size={14} /><span className="text-white font-semibold">{ses.name}</span></>}
          </nav>
          {!cat && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tree.map((c) => folderCard(c, () => setNav({ cat: c._id, ses: c.sessions.length === 1 && c._id === UNFILED_ID ? c.sessions[0]._id : null }), `${c.sessions.length} session${c.sessions.length === 1 ? "" : "s"} · ${c.total} question${c.total === 1 ? "" : "s"}`))}</div>}
          {cat && !ses && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cat.sessions.map((s) => folderCard({ ...s, color: cat.color }, () => setNav({ cat: cat._id, ses: s._id }), `${s.total} question${s.total === 1 ? "" : "s"}`))}</div>}
          {ses && questionList(visible, false)}
        </>
      )}
    </div>
  );
}
