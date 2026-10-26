import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Copy, Inbox, Pencil, Plus, Search, Trash2, UserPlus, Code2 } from "lucide-react";
import { AppContent } from "../../context/Context";
import { DifficultyBadge, LANGUAGES, LanguageBadge } from "./questionKit";
import QuestionForm from "./QuestionForm";
import AssignModal from "./AssignModal";
import SubmissionsModal from "./SubmissionsModal";

export default function QuestionBankAdmin() {
  const { backend_url, allUserData } = useContext(AppContent);
  const [questions, setQuestions] = useState(null);
  const [form, setForm] = useState(null); // { mode, question }
  const [assigning, setAssigning] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("");
  const [diff, setDiff] = useState("");

  const students = useMemo(() => (allUserData?.data || []).filter((u) => u.userType === "student"), [allUserData]);

  const load = async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/questions`);
      setQuestions(data.data);
    } catch (error) {
      setQuestions([]);
      toast.error(error.response?.data?.message || "Could not load questions");
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const shown = (questions || []).filter((x) =>
    (!lang || x.language === lang) && (!diff || x.difficulty === diff) &&
    `${x.title} ${x.description} ${(x.tags || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())
  );

  const remove = async (question) => {
    if (!window.confirm(`Delete “${question.title}”?`)) return;
    try {
      await axios.delete(`${backend_url}/api/questions/${question._id}`);
    } catch (error) {
      if (error.response?.status !== 409) return toast.error(error.response?.data?.message || "Could not delete");
      if (!window.confirm(`${error.response.data.message}\n\nDelete anyway?`)) return;
      try { await axios.delete(`${backend_url}/api/questions/${question._id}`, { params: { force: true } }); }
      catch (e2) { return toast.error(e2.response?.data?.message || "Could not delete"); }
    }
    toast.success("Question deleted");
    load();
  };

  const input = "px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Code2 className="text-cyan-300" /> Code Questions</h2>
          <p className="text-gray-300 text-sm mt-1">Build a question bank once, then assign any question to any students, any time.</p>
        </div>
        <button onClick={() => setForm({ mode: "create" })} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold"><Plus size={18} /> New question</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" className={`${input} w-full pl-9`} />
        </div>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className={input}>
          <option value="" className="text-black">All languages</option>
          {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k} className="text-black">{v.label}</option>)}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)} className={input}>
          <option value="" className="text-black">Any difficulty</option>
          {["easy", "medium", "hard"].map((d) => <option key={d} value={d} className="text-black">{d[0].toUpperCase() + d.slice(1)}</option>)}
        </select>
      </div>

      {questions === null ? <p className="text-gray-300">Loading…</p> : shown.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">
          <Inbox className="mx-auto mb-3 text-gray-400" size={36} />
          {questions.length === 0 ? <>Your question bank is empty. Click <strong>New question</strong> to create the first one.</> : "No questions match your filters."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((x) => (
            <div key={x._id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{x.title}</h3>
                <div className="flex gap-1.5 shrink-0"><LanguageBadge language={x.language} /><DifficultyBadge difficulty={x.difficulty} /></div>
              </div>
              <p className="text-sm text-gray-300 mt-2 line-clamp-3 whitespace-pre-wrap">{x.description}</p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {x.expectedOutputText?.trim() && <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">Text result</span>}
                {x.expectedImage && <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">Image result</span>}
                {(x.tags || []).map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300">#{t}</span>)}
              </div>
              <button onClick={() => setReviewing(x)} className="mt-4 grid grid-cols-3 text-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 transition" title="View submissions">
                {[["Assigned", x.stats.assigned, "text-white"], ["To review", x.stats.submitted, x.stats.submitted ? "text-cyan-300" : "text-gray-400"], ["Accepted", x.stats.accepted, "text-emerald-300"]].map(([l, v, c]) => (
                  <span key={l}><span className={`block text-xl font-bold ${c}`}>{v}</span><span className="block text-xs text-gray-400">{l}</span></span>
                ))}
              </button>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                <button onClick={() => setAssigning(x)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-sm font-semibold"><UserPlus size={15} /> Assign</button>
                <button onClick={() => setForm({ mode: "edit", question: x })} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"><Pencil size={15} /> Edit</button>
                <button onClick={() => setForm({ mode: "duplicate", question: x })} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"><Copy size={15} /> Duplicate</button>
                <button onClick={() => remove(x)} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/20 text-sm"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <QuestionForm backend_url={backend_url} mode={form.mode} question={form.question} onClose={() => setForm(null)}
          onSaved={(saved, { another }) => { load(); if (!another) setForm(null); }} />
      )}
      {assigning && <AssignModal backend_url={backend_url} question={assigning} students={students} onClose={() => setAssigning(null)} onAssigned={load} />}
      {reviewing && <SubmissionsModal backend_url={backend_url} question={reviewing} onClose={() => setReviewing(null)} onChanged={load} />}
    </div>
  );
}
