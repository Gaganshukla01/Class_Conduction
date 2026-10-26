import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { ExpectedResult, MatchBadge, Modal, StatusBadge, when } from "./questionKit";

// Everyone this question is assigned to, with a review screen per student.
export default function SubmissionsModal({ backend_url, question, onClose, onChanged }) {
  const [list, setList] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    axios.get(`${backend_url}/api/questions/${question._id}/assignments`)
      .then((r) => setList(r.data.data))
      .catch(() => { setList([]); toast.error("Could not load submissions"); });
  useEffect(() => { load(); }, [question._id]); // eslint-disable-line

  const open = list?.find((a) => a._id === openId);
  const openAssignment = (a) => {
    setOpenId(a._id);
    setAttempt(Math.max(0, a.submissions.length - 1));
    setFeedback(a.feedback || "");
  };

  const review = async (status) => {
    setBusy(true);
    try {
      const { data } = await axios.put(`${backend_url}/api/questions/assignments/${open._id}/review`, { status, feedback });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      await load();
      onChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save the review");
    } finally { setBusy(false); }
  };

  const unassign = async (a) => {
    if (!window.confirm(`Remove this question from ${a.student?.name}? Their submissions will be deleted.`)) return;
    try {
      await axios.delete(`${backend_url}/api/questions/assignments/${a._id}`);
      toast.success("Removed");
      setOpenId(null);
      await load();
      onChanged();
    } catch (error) { toast.error(error.response?.data?.message || "Could not remove"); }
  };

  const sub = open?.submissions[attempt];

  return (
    <Modal wide title={open ? `${open.student?.name} · ${question.title}` : `Submissions · ${question.title}`} onClose={onClose}>
      {list === null ? <p className="text-gray-300">Loading…</p> : !open ? (
        list.length === 0 ? <p className="text-gray-300">This question has not been assigned to anyone yet.</p> : (
          <ul className="space-y-2">
            {list.map((a) => (
              <li key={a._id}>
                <button onClick={() => openAssignment(a)} className="w-full flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
                  <span className="min-w-0 flex-1"><span className="block text-white font-medium truncate">{a.student?.name}</span><span className="block text-xs text-gray-400 truncate">{a.student?.email}</span></span>
                  <span className="text-xs text-gray-400">{a.submissions.length} attempt{a.submissions.length === 1 ? "" : "s"}</span>
                  {a.submissions.length > 0 && <span className="text-xs text-gray-400">last {when(a.submissions[a.submissions.length - 1].submittedAt)}</span>}
                  <StatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button onClick={() => setOpenId(null)} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"><ArrowLeft size={16} /> All students</button>
            <div className="flex items-center gap-3"><StatusBadge status={open.status} /><button onClick={() => unassign(open)} className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"><Trash2 size={14} /> Unassign</button></div>
          </div>

          {open.submissions.length === 0 ? <p className="text-gray-300">Nothing submitted yet.</p> : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {open.submissions.map((s, i) => (
                  <button key={s._id || i} onClick={() => setAttempt(i)} className={`px-3 py-1.5 rounded-lg text-sm ${attempt === i ? "bg-cyan-500/30 text-cyan-100 border border-cyan-400/50" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>Attempt {i + 1}</button>
                ))}
                <span className="text-xs text-gray-400 ml-1">{when(sub.submittedAt)}</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Student's code</p>
                  <pre className="bg-slate-950 border border-white/10 rounded-xl p-3 font-mono text-sm text-gray-100 overflow-auto max-h-96 whitespace-pre">{sub.code}</pre>
                </div>
                <div className="space-y-4">
                  {question.language !== "html" && (
                    <div>
                      <div className="flex items-center justify-between mb-1"><p className="text-xs uppercase tracking-wide text-gray-400">Student's output</p><MatchBadge value={sub.outputMatches} /></div>
                      <pre className="bg-black/50 text-green-400 rounded-xl p-3 font-mono text-sm overflow-auto max-h-40 whitespace-pre-wrap">{sub.output || "(no output)"}</pre>
                      <p className="text-xs text-gray-500 mt-1">The output comes from the student's browser - re-run the code if you need certainty.</p>
                    </div>
                  )}
                  {sub.screenshot && (
                    <div><p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Student's screenshot</p>
                      <a href={sub.screenshot.url} target="_blank" rel="noreferrer"><img src={sub.screenshot.thumbUrl || sub.screenshot.url} alt="Student's result" className="rounded-xl border border-white/20 max-h-56 bg-white" /></a></div>
                  )}
                  <div><p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Expected result</p><ExpectedResult question={question} compact /></div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Feedback to the student (they get an email)</label>
                <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={busy}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="What was good? What should they fix?" />
                <div className="flex flex-wrap justify-end gap-3 mt-3">
                  <button onClick={() => review("needs_work")} disabled={busy} className="px-5 py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500 font-semibold disabled:opacity-60">Needs work</button>
                  <button onClick={() => review("accepted")} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Accept</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
