import { useState } from "react";
import { CheckCircle2, Clock, Send, RotateCcw, X } from "lucide-react";

export const LANGUAGES = {
  javascript: { label: "JavaScript", color: "bg-yellow-500/20 text-yellow-300" },
  python: { label: "Python", color: "bg-blue-500/20 text-blue-300" },
  java: { label: "Java", color: "bg-orange-500/20 text-orange-300" },
  cpp: { label: "C++", color: "bg-purple-500/20 text-purple-300" },
  html: { label: "HTML / CSS", color: "bg-pink-500/20 text-pink-300" },
};
export const DIFFICULTY = {
  easy: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  hard: "bg-rose-500/20 text-rose-300",
};
export const STATUS = {
  assigned: { label: "To do", cls: "bg-gray-500/25 text-gray-200", Icon: Clock },
  submitted: { label: "Submitted", cls: "bg-cyan-500/20 text-cyan-300", Icon: Send },
  accepted: { label: "Accepted", cls: "bg-emerald-500/20 text-emerald-300", Icon: CheckCircle2 },
  needs_work: { label: "Needs work", cls: "bg-amber-500/20 text-amber-300", Icon: RotateCcw },
};

export const LanguageBadge = ({ language }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${LANGUAGES[language]?.color || "bg-white/10 text-gray-200"}`}>
    {LANGUAGES[language]?.label || language}
  </span>
);
export const DifficultyBadge = ({ difficulty }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${DIFFICULTY[difficulty] || ""}`}>{difficulty}</span>
);
export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.assigned;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
      <s.Icon size={12} /> {s.label}
    </span>
  );
};
export const MatchBadge = ({ value }) =>
  value === true ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">Output matches expected</span>
  : value === false ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">Output differs from expected</span>
  : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">No text result to compare</span>;

export const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
export const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

// The "desired result": text, image, or both. Click the image to enlarge.
export function ExpectedResult({ question, compact = false }) {
  const [zoom, setZoom] = useState(false);
  const hasText = question.expectedOutputText?.trim();
  const img = question.expectedImage;
  if (!hasText && !img) return <p className="text-sm text-gray-400">No expected result was provided for this question.</p>;
  return (
    <div className="space-y-3">
      {hasText && (
        <pre className={`bg-black/40 text-emerald-300 rounded-xl p-3 font-mono text-sm whitespace-pre-wrap overflow-auto ${compact ? "max-h-40" : "max-h-72"}`}>{question.expectedOutputText}</pre>
      )}
      {img && (
        <>
          <img src={img.thumbUrl || img.url} alt="Expected result" onClick={() => setZoom(true)}
            className="rounded-xl border border-white/20 max-h-72 cursor-zoom-in bg-white" />
          {zoom && (
            <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoom(false)}>
              <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" aria-label="Close"><X size={22} /></button>
              <img src={img.url} alt="Expected result (full size)" className="max-h-full max-w-full rounded-lg bg-white" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect } from "react";

// Simple modal: ESC / backdrop click closes, body scroll locked.
export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-slate-900 border border-white/15 rounded-2xl w-full ${wide ? "max-w-5xl" : "max-w-2xl"} my-auto shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
