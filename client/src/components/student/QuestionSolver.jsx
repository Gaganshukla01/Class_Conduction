import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Loader2, Play, RotateCcw, Send, Square } from "lucide-react";
import { AppContent } from "../../context/Context";
import { runJavaScript, runPython, runRemote, formatResult, cancelAll } from "../../utils/codeRunner";
import { uploadImage } from "../../utils/uploadPdf";
import CodeEditorBox from "./CodeEditorBox";
import ImageUploadField from "../ImageUploadField";
import { DifficultyBadge, ExpectedResult, LanguageBadge, MatchBadge, StatusBadge, day, when } from "../questions/questionKit";

const draftKey = (id) => `cw_draft_${id}`;
const readDraft = (id) => { try { return localStorage.getItem(draftKey(id)); } catch { return null; } };
const writeDraft = (id, v) => { try { localStorage.setItem(draftKey(id), v); } catch { /* storage full/blocked */ } };

export default function QuestionSolver({ assignment, onBack, onUpdated }) {
  const { backend_url } = useContext(AppContent);
  const q = assignment.question;
  const language = q.language;
  const isHtml = language === "html";
  const last = assignment.submissions[assignment.submissions.length - 1];
  const locked = assignment.status === "accepted";

  const [code, setCode] = useState(() => readDraft(assignment._id) ?? last?.code ?? q.starterCode ?? "");
  const [stdin, setStdin] = useState(q.sampleInput || "");
  const [output, setOutput] = useState("");
  const [outputIsError, setOutputIsError] = useState(false);
  const [stdout, setStdout] = useState("");
  const [ranCode, setRanCode] = useState(null);
  const [running, setRunning] = useState(false);
  const [previewCode, setPreviewCode] = useState(code);
  const [shot, setShot] = useState(null);
  const [progress, setProgress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // keep a draft so a refresh / closed tab never loses work
  useEffect(() => {
    const t = setTimeout(() => writeDraft(assignment._id, code), 500);
    return () => clearTimeout(t);
  }, [code, assignment._id]);

  useEffect(() => () => cancelAll(), []);

  const overdue = useMemo(
    () => assignment.dueDate && new Date(assignment.dueDate) < new Date() && ["assigned", "needs_work"].includes(assignment.status),
    [assignment]
  );

  const run = async () => {
    if (!code.trim()) return toast.error("Write some code first");
    if (isHtml) {
      setPreviewCode(code);
      setRanCode(code);
      return;
    }
    setRunning(true);
    setOutputIsError(false);
    setOutput("🚀 Running…");
    let result;
    try {
      if (language === "javascript") result = await runJavaScript(code, stdin);
      else if (language === "python") result = await runPython(code, stdin, { onStatus: (t) => setOutput(`⏳ ${t}`) });
      else result = await runRemote({ language, code, stdin, backendUrl: backend_url });
    } finally {
      setRunning(false);
    }
    if (result.cancelled) return setOutput("⏹ Stopped.");
    setStdout(result.stdout || "");
    setRanCode(code);
    setOutputIsError(!result.success);
    setOutput(`${formatResult(result, { language })}\n\n⏱️ ${result.ms}ms`);
  };

  const resetCode = () => {
    if (code !== (q.starterCode || "") && !window.confirm("Reset to the starter code? Your current code will be lost.")) return;
    setCode(q.starterCode || "");
  };

  const submit = async () => {
    if (!code.trim()) return toast.error("Write your solution first");
    if (!isHtml && ranCode !== code) return toast.error("Run your latest code first, so your output is submitted with it");
    setSubmitting(true);
    try {
      let screenshot;
      if (shot) {
        setProgress(0);
        screenshot = await uploadImage({ file: shot, purpose: "solution-image", onProgress: setProgress });
      }
      const { data } = await axios.post(`${backend_url}/api/questions/assignments/${assignment._id}/submit`, {
        code,
        output: isHtml ? "" : stdout,
        screenshot,
      });
      toast.success(data.message);
      setShot(null);
      onUpdated({ ...assignment, ...data.data });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const panel = "bg-white/10 backdrop-blur-lg p-5 sm:p-6 rounded-3xl border border-white/20";

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"><ArrowLeft size={16} /> All questions</button>

      <div className={`${panel} flex flex-wrap items-center gap-3 justify-between`}>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">{q.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <LanguageBadge language={language} /> <DifficultyBadge difficulty={q.difficulty} /> <StatusBadge status={assignment.status} />
            {assignment.dueDate && <span className={`text-xs ${overdue ? "text-rose-300" : "text-gray-400"}`}>Due {day(assignment.dueDate)}{overdue ? " · overdue" : ""}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {/* ---------------- question ---------------- */}
        <div className="space-y-5">
          <div className={panel}>
            <h3 className="font-semibold text-white mb-2">Question</h3>
            <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{q.description}</p>
            {q.sampleInput && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Sample input</p>
                <pre className="bg-black/40 text-gray-100 rounded-xl p-3 font-mono text-sm whitespace-pre-wrap">{q.sampleInput}</pre>
              </div>
            )}
            {q.tags?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{q.tags.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">#{t}</span>)}</div>}
          </div>

          <div className={panel}>
            <h3 className="font-semibold text-white mb-3">Expected result</h3>
            <ExpectedResult question={q} />
            {!isHtml && q.expectedOutputText?.trim() && <p className="text-xs text-gray-400 mt-3">Your program's output should look exactly like this.</p>}
          </div>

          {assignment.feedback && (
            <div className={`rounded-3xl p-5 border ${assignment.status === "accepted" ? "bg-emerald-500/10 border-emerald-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
              <p className="text-xs uppercase tracking-wide text-gray-300 mb-1">Instructor feedback{assignment.reviewedAt ? ` · ${when(assignment.reviewedAt)}` : ""}</p>
              <p className="text-white text-sm whitespace-pre-wrap">{assignment.feedback}</p>
            </div>
          )}

          {assignment.submissions.length > 0 && (
            <div className={panel}>
              <h3 className="font-semibold text-white mb-3">Your attempts</h3>
              <ul className="space-y-2">
                {[...assignment.submissions].reverse().map((s, i) => (
                  <li key={s._id || i} className="flex flex-wrap items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <span className="text-sm text-white">Attempt {assignment.submissions.length - i}</span>
                    <span className="text-xs text-gray-400">{when(s.submittedAt)}</span>
                    {!isHtml && <MatchBadge value={s.outputMatches} />}
                    {!locked && <button onClick={() => setCode(s.code)} className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20">Load this code</button>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ---------------- solution ---------------- */}
        <div className={`${panel} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-white">Your solution</h3>
            <div className="flex gap-2">
              <button onClick={resetCode} disabled={locked || running} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm disabled:opacity-50"><RotateCcw size={15} /> Reset</button>
              <button onClick={running ? cancelAll : run} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${running ? "bg-rose-600 hover:bg-rose-700" : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"}`}>
                {running ? <Square size={15} /> : <Play size={15} />} {running ? "Stop" : isHtml ? "Preview" : "Run"}
              </button>
            </div>
          </div>

          <CodeEditorBox value={code} onChange={setCode} language={language} disabled={locked} />
          {language === "java" && <p className="text-xs text-gray-400">Java: the public class must be named <code>Main</code>.</p>}

          {isHtml ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Live preview (put your CSS inside &lt;style&gt;)</p>
              <iframe title="preview" srcDoc={previewCode} sandbox="allow-scripts allow-modals allow-forms" className="w-full h-64 rounded-xl bg-white border border-white/20" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Input (stdin) - one value per line</label>
                <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2} disabled={locked}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 font-mono text-sm text-gray-100 outline-none resize-y" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Output</p>
                <pre className={`min-h-[6rem] max-h-64 overflow-auto rounded-xl p-3 font-mono text-sm whitespace-pre-wrap bg-black/50 ${outputIsError ? "text-red-400" : "text-green-400"}`}>{output || "Run your code to see the output here."}</pre>
              </div>
            </>
          )}

          {!locked && (
            <>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{isHtml ? "Screenshot of your result" : "Screenshot"} (optional)</p>
                <ImageUploadField file={shot} onChange={setShot} progress={progress} disabled={submitting} label="Add a screenshot" />
              </div>
              <button onClick={submit} disabled={submitting || running}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {submitting ? "Submitting…" : assignment.status === "needs_work" ? "Resubmit solution" : assignment.submissions.length ? "Submit again" : "Submit solution"}
              </button>
              <p className="text-xs text-gray-400 text-center">Your code is saved automatically in this browser while you work.</p>
            </>
          )}
          {locked && <p className="text-center text-emerald-300 text-sm">🎉 This question is accepted. Nice work!</p>}
        </div>
      </div>
    </div>
  );
}
