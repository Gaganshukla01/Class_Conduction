import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ChevronRight, Code2, Copy, Folder, FolderInput, FolderPlus, Inbox, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { AppContent } from "../../context/Context";
import { buildBatches } from "../../utils/classSessions";
import { folderPath } from "../../utils/questionTree";
import { FOLDER_COLORS } from "../ResourceLibraryAdmin";
import { DifficultyBadge, LANGUAGES, LanguageBadge, Modal } from "./questionKit";
import QuestionForm from "./QuestionForm";
import FolderForm from "./FolderForm";
import BulkAssignModal from "./BulkAssignModal";
import SubmissionsModal from "./SubmissionsModal";

const UNFILED = "unfiled";
const btn = "flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition";
const input = "px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

export default function QuestionBankAdmin() {
  const { backend_url, allUserData, allSchedule } = useContext(AppContent);
  const [tree, setTree] = useState(null); // { tree, unfiledCount }
  const [questions, setQuestions] = useState(null);
  const [nav, setNav] = useState({ cat: null, ses: null }); // cat: id | "unfiled" | null
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("");
  const [diff, setDiff] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [form, setForm] = useState(null); // question form
  const [folderForm, setFolderForm] = useState(null); // { parent?, folder? }
  const [bulk, setBulk] = useState(null); // { title, questionIds, folders }
  const [moving, setMoving] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  const students = useMemo(() => (allUserData?.data || []).filter((u) => u.userType === "student"), [allUserData]);
  const batches = useMemo(() => buildBatches(allSchedule), [allSchedule]);
  const cats = tree?.tree || [];
  const flatFolders = useMemo(() => cats.flatMap((c) => [c, ...c.sessions]), [cats]);
  const cat = nav.cat === UNFILED ? null : cats.find((c) => c._id === nav.cat);
  const ses = cat?.sessions.find((s) => s._id === nav.ses);
  const searching = q.trim() !== "" || lang !== "" || diff !== "";
  const inQuestionView = searching || nav.cat === UNFILED || Boolean(ses);

  const loadTree = async () => {
    try { const { data } = await axios.get(`${backend_url}/api/question-folders`); setTree(data.data); }
    catch (e) { setTree({ tree: [], unfiledCount: 0 }); toast.error(e.response?.data?.message || "Could not load folders"); }
  };
  const loadQuestions = async () => {
    if (!inQuestionView) return setQuestions([]);
    try {
      const params = { q: q || undefined, language: lang || undefined, difficulty: diff || undefined };
      if (!searching) params.folderId = nav.cat === UNFILED ? UNFILED : nav.ses;
      const { data } = await axios.get(`${backend_url}/api/questions`, { params });
      setQuestions(data.data);
    } catch (e) { setQuestions([]); toast.error(e.response?.data?.message || "Could not load questions"); }
  };
  useEffect(() => { loadTree(); }, []); // eslint-disable-line
  useEffect(() => { const t = setTimeout(loadQuestions, q ? 250 : 0); return () => clearTimeout(t); }, [nav, q, lang, diff]); // eslint-disable-line
  useEffect(() => setSelected(new Set()), [nav, q, lang, diff]);

  const refresh = () => { loadTree(); loadQuestions(); };
  const go = (next) => { setQ(""); setLang(""); setDiff(""); setNav(next); };

  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const removeQuestion = async (question) => {
    if (!window.confirm(`Delete “${question.title}”?`)) return;
    try { await axios.delete(`${backend_url}/api/questions/${question._id}`); }
    catch (error) {
      if (error.response?.status !== 409) return toast.error(error.response?.data?.message || "Could not delete");
      if (!window.confirm(`${error.response.data.message}\n\nDelete anyway?`)) return;
      try { await axios.delete(`${backend_url}/api/questions/${question._id}`, { params: { force: true } }); }
      catch (e2) { return toast.error(e2.response?.data?.message || "Could not delete"); }
    }
    toast.success("Question deleted"); refresh();
  };
  const removeFolder = async (f) => {
    if (!window.confirm(`Delete the ${f.level === 1 ? "category" : "session"} “${f.name}”?`)) return;
    try { await axios.delete(`${backend_url}/api/question-folders/${f._id}`); toast.success("Folder deleted"); if (nav.ses === f._id) setNav({ cat: nav.cat, ses: null }); if (nav.cat === f._id) setNav({ cat: null, ses: null }); loadTree(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not delete"); }
  };
  const moveSelected = async (folderId) => {
    try { const { data } = await axios.put(`${backend_url}/api/questions/move`, { questionIds: [...selected], folderId }); toast.success(data.message); setMoving(false); setSelected(new Set()); refresh(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not move"); }
  };

  const assignFolder = (f) => setBulk({ title: `Assign “${f.name}”`, questionIds: [], folders: [{ _id: f._id, name: f.name, questionCount: f.questionCount }] });
  const defaultFolderId = ses?._id || "";

  // ---------------------------------------------------------------- views
  const crumb = () => (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-300">
      <button onClick={() => go({ cat: null, ses: null })} className={`hover:text-white ${!nav.cat ? "text-white font-semibold" : ""}`}>All categories</button>
      {nav.cat === UNFILED && <><ChevronRight size={14} /><span className="text-white font-semibold">Unfiled</span></>}
      {cat && <><ChevronRight size={14} /><button onClick={() => go({ cat: cat._id, ses: null })} className={`hover:text-white ${!ses ? "text-white font-semibold" : ""}`}>{cat.name}</button></>}
      {ses && <><ChevronRight size={14} /><span className="text-white font-semibold">{ses.name}</span></>}
    </nav>
  );

  const folderCard = ({ f, onOpen, sub, canAssign = true }) => (
    <div className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition flex flex-col">
      <button onClick={onOpen} className="flex items-start gap-3 text-left">
        <span className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${FOLDER_COLORS[f.color] || FOLDER_COLORS.indigo} flex items-center justify-center`}><Folder size={24} /></span>
        <span className="min-w-0"><span className="block font-semibold text-white truncate">{f.name}</span><span className="block text-xs text-gray-300 mt-0.5">{sub}</span>{f.description && <span className="block text-xs text-gray-400 mt-1 line-clamp-2">{f.description}</span>}</span>
      </button>
      <div className="flex gap-2 mt-4 pt-3 border-t border-white/10 text-sm">
        {canAssign && <button onClick={() => assignFolder(f)} disabled={!f.questionCount} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 font-semibold disabled:opacity-40" title="Assign every question in this folder"><UserPlus size={14} /> Assign all</button>}
        <button onClick={() => setFolderForm({ folder: f })} className="p-2 rounded-lg hover:bg-white/10 text-gray-300" aria-label="Rename"><Pencil size={14} /></button>
        <button onClick={() => removeFolder(f)} className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-300 ml-auto" aria-label="Delete"><Trash2 size={14} /></button>
      </div>
    </div>
  );

  const questionCard = (x) => {
    const on = selected.has(x._id);
    return (
      <div className={`bg-white/10 backdrop-blur-lg border rounded-2xl p-5 flex flex-col transition ${on ? "border-cyan-400 ring-1 ring-cyan-400/50" : "border-white/20"}`}>
        <div className="flex items-start gap-3">
          <input type="checkbox" checked={on} onChange={() => toggleSel(x._id)} className="mt-1.5 w-4 h-4 accent-cyan-400 shrink-0" aria-label="Select question" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{x.title}</h3>
              <div className="flex gap-1.5 shrink-0"><LanguageBadge language={x.language} /><DifficultyBadge difficulty={x.difficulty} /></div>
            </div>
            {searching && <p className="text-xs text-cyan-300 mt-0.5">{folderPath(x.folderId, flatFolders)}</p>}
            <p className="text-sm text-gray-300 mt-2 line-clamp-3 whitespace-pre-wrap">{x.description}</p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {x.expectedOutputText?.trim() && <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">Text result</span>}
              {x.expectedImage && <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">Image result</span>}
              {(x.tags || []).map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300">#{t}</span>)}
            </div>
          </div>
        </div>
        <button onClick={() => setReviewing(x)} className="mt-4 grid grid-cols-3 text-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 transition" title="View submissions">
          {[["Assigned", x.stats.assigned, "text-white"], ["To review", x.stats.submitted, x.stats.submitted ? "text-cyan-300" : "text-gray-400"], ["Accepted", x.stats.accepted, "text-emerald-300"]].map(([l, v, c]) => (
            <span key={l}><span className={`block text-xl font-bold ${c}`}>{v}</span><span className="block text-xs text-gray-400">{l}</span></span>
          ))}
        </button>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
          <button onClick={() => setBulk({ title: `Assign “${x.title}”`, questionIds: [x._id], folders: [] })} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-sm font-semibold"><UserPlus size={15} /> Assign</button>
          <button onClick={() => setForm({ mode: "edit", question: x })} className={btn}><Pencil size={15} /> Edit</button>
          <button onClick={() => setForm({ mode: "duplicate", question: x })} className={btn}><Copy size={15} /> Duplicate</button>
          <button onClick={() => removeQuestion(x)} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/20 text-sm"><Trash2 size={15} /> Delete</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Code2 className="text-cyan-300" /> Code Questions</h2>
          <p className="text-gray-300 text-sm mt-1">Category → Session → Questions. Build once, assign to any students or a whole class, any time.</p>
        </div>
        <div className="flex gap-2">
          {!inQuestionView && !cat && <button onClick={() => setFolderForm({})} className={btn}><FolderPlus size={16} /> New category</button>}
          {cat && !ses && !searching && <button onClick={() => setFolderForm({ parent: cat })} className={btn}><FolderPlus size={16} /> New session</button>}
          <button onClick={() => setForm({ mode: "create" })} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold"><Plus size={18} /> New question</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all questions…" className={`${input} w-full pl-9`} />
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

      {!searching && crumb()}
      {searching && <p className="text-sm text-gray-300">Showing results from all folders. <button className="text-cyan-300 underline" onClick={() => { setQ(""); setLang(""); setDiff(""); }}>Clear search</button></p>}

      {/* ---------- level 1: categories ---------- */}
      {!inQuestionView && !cat && (tree === null ? <p className="text-gray-300">Loading…</p> : cats.length === 0 && !tree.unfiledCount ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">
          <Inbox className="mx-auto mb-3 text-gray-400" size={36} />
          Start by creating a <strong>category</strong> (e.g. “Python WebDev”), then add <strong>sessions</strong> (e.g. “Session 01”) and your questions inside them.
          <div className="mt-4"><button onClick={() => setFolderForm({})} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold">Create first category</button></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => <Fragment key={c._id}>{folderCard({ f: c, onOpen: () => go({ cat: c._id, ses: null }), sub: `${c.sessions.length} session${c.sessions.length === 1 ? "" : "s"} · ${c.questionCount} question${c.questionCount === 1 ? "" : "s"}` })}</Fragment>)}
          {tree.unfiledCount > 0 && (
            <button onClick={() => go({ cat: UNFILED, ses: null })} className="text-left bg-white/5 border border-dashed border-white/25 rounded-2xl p-4 hover:bg-white/10 transition flex items-start gap-3">
              <span className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center"><Inbox size={24} /></span>
              <span><span className="block font-semibold text-white">Unfiled</span><span className="block text-xs text-gray-300 mt-0.5">{tree.unfiledCount} question{tree.unfiledCount === 1 ? "" : "s"} not in a session yet</span></span>
            </button>
          )}
        </div>
      ))}

      {/* ---------- level 2: sessions ---------- */}
      {!inQuestionView && cat && !ses && (
        cat.sessions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">No sessions in “{cat.name}” yet. <button onClick={() => setFolderForm({ parent: cat })} className="text-cyan-300 underline">Create one</button></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.sessions.map((s) => <Fragment key={s._id}>{folderCard({ f: { ...s, color: cat.color }, onOpen: () => go({ cat: cat._id, ses: s._id }), sub: `${s.questionCount} question${s.questionCount === 1 ? "" : "s"}` })}</Fragment>)}
          </div>
        )
      )}

      {/* ---------- level 3: questions ---------- */}
      {inQuestionView && (
        <>
          <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-cyan-400" checked={Boolean(questions?.length) && selected.size === questions.length} onChange={(e) => setSelected(e.target.checked ? new Set(questions.map((x) => x._id)) : new Set())} /> Select all
            </label>
            <span className="text-sm text-gray-400">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button disabled={selected.size === 0} onClick={() => setBulk({ title: `Assign ${selected.size} question${selected.size === 1 ? "" : "s"}`, questionIds: [...selected], folders: [] })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-sm font-semibold disabled:opacity-40"><Users size={14} /> Assign selected</button>
              <button disabled={selected.size === 0} onClick={() => setMoving(true)} className={`${btn} disabled:opacity-40`}><FolderInput size={14} /> Move to…</button>
              {ses && <button disabled={!questions?.length} onClick={() => assignFolder({ ...ses, questionCount: ses.questionCount })} className={`${btn} disabled:opacity-40`}><UserPlus size={14} /> Assign whole session</button>}
            </div>
          </div>
          {questions === null ? <p className="text-gray-300">Loading…</p> : questions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300"><Inbox className="mx-auto mb-3 text-gray-400" size={36} />{searching ? "No questions match your search." : <>No questions here yet. <button onClick={() => setForm({ mode: "create" })} className="text-cyan-300 underline">Add the first one</button></>}</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">{questions.map((x) => <Fragment key={x._id}>{questionCard(x)}</Fragment>)}</div>
          )}
        </>
      )}

      {form && <QuestionForm backend_url={backend_url} mode={form.mode} question={form.question} folders={cats} defaultFolderId={defaultFolderId} onClose={() => setForm(null)} onSaved={(saved, { another }) => { refresh(); if (!another) setForm(null); }} />}
      {folderForm && <FolderForm backend_url={backend_url} parent={folderForm.parent} folder={folderForm.folder} onClose={() => setFolderForm(null)} onSaved={loadTree} />}
      {bulk && <BulkAssignModal backend_url={backend_url} title={bulk.title} questionIds={bulk.questionIds} folders={bulk.folders} students={students} batches={batches} onClose={() => setBulk(null)} onDone={refresh} />}
      {reviewing && <SubmissionsModal backend_url={backend_url} question={reviewing} onClose={() => setReviewing(null)} onChanged={refresh} />}
      {moving && (
        <Modal title={`Move ${selected.size} question${selected.size === 1 ? "" : "s"} to…`} onClose={() => setMoving(false)}>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <button onClick={() => moveSelected("")} className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200">Unfiled (no folder)</button>
            {cats.map((c) => (
              <div key={c._id}>
                <p className="text-xs uppercase tracking-wide text-gray-400 mt-3 mb-1">{c.name}</p>
                {c.sessions.length === 0 && <p className="text-xs text-gray-500 px-1">No sessions</p>}
                {c.sessions.map((s) => <button key={s._id} onClick={() => moveSelected(s._id)} className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 text-white mb-1.5">{s.name} <span className="text-xs text-gray-400">({s.questionCount})</span></button>)}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
