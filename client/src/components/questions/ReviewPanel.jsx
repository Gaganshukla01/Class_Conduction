import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { ExpectedResult, MatchBadge, StatusBadge, when } from "./questionKit";

// Everything an admin needs to approve / grade one student's solution.
//   assignment: { _id, status, feedback, score, submissions[], student }   question: the question doc
export default function ReviewPanel({ backend_url, assignment, question, onSaved }) {
  const [attempt, setAttempt] = useState(Math.max(0, assignment.submissions.length - 1));
  const [feedback, setFeedback] = useState(assignment.feedback || "");
  const [score, setScore] = useState(assignment.score ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAttempt(Math.max(0, assignment.submissions.length - 1));
    setFeedback(assignment.feedback || "");
    setScore(assignment.score ?? "");
  }, [assignment._id]); // eslint-disable-line

  const sub = assignment.submissions[attempt];

  const review = async (status) => {
    setBusy(true);
    try {
      const { data } = await axios.put(`${backend_url}/api/questions/assignments/${assignment._id}/review`, { status, feedback, score: score === "" ? undefined : score });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      onSaved(data.data, status);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save the review");
    } finally { setBusy(false); }
  };

  if (assignment.submissions.length === 0) return <p className="text-gray-300">The student has not submitted anything yet.</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={assignment.status} />
        {assignment.score != null && <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-200">Score {assignment.score}/100</span>}
        <span className="mx-1 text-gray-600">|</span>
        {assignment.submissions.map((s, i) => (
          <button key={s._id || i} onClick={() => setAttempt(i)} className={`px-3 py-1.5 rounded-lg text-sm ${attempt === i ? "bg-cyan-500/30 text-cyan-100 border border-cyan-400/50" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>Attempt {i + 1}</button>
        ))}
        <span className="text-xs text-gray-400 ml-1">{when(sub.submittedAt)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Student's code</p>
          <pre className="bg-slate-950 border border-white/10 rounded-xl p-3 font-mono text-sm text-gray-100 overflow-auto max-h-96 whitespace-pre select-text">{sub.code}</pre>
        </div>
        <div className="space-y-4">
          {question.language !== "html" && (
            <div>
              <div className="flex items-center justify-between mb-1"><p className="text-xs uppercase tracking-wide text-gray-400">Student's output</p><MatchBadge value={sub.outputMatches} /></div>
              <pre className="bg-black/50 text-green-400 rounded-xl p-3 font-mono text-sm overflow-auto max-h-40 whitespace-pre-wrap select-text">{sub.output || "(no output)"}</pre>
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

      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Feedback to the student (they get an email)</label>
          <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 select-text" placeholder="What was good? What should they fix?" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Score (optional)</label>
          <div className="flex items-center gap-2"><input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} disabled={busy} className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="0-100" /></div>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <button onClick={() => review("needs_work")} disabled={busy} className="px-5 py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500 font-semibold disabled:opacity-60">Needs work</button>
        <button onClick={() => review("accepted")} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Approve</button>
      </div>
    </div>
  );
}
