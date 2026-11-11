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
            <Portal>
              <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoom(false)}>
                <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" aria-label="Close"><X size={22} /></button>
                <img src={img.url} alt="Expected result (full size)" className="max-h-full max-w-full rounded-lg bg-white" />
              </div>
            </Portal>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import useScrollLock from "../../hooks/useScrollLock";
import Portal from "../ui/Portal";

// Modal: rendered in <body> above the Navbar. The header stays visible and only the
// body scrolls, so long forms (extra class, question editor) are always reachable.
// On phones it is a full-width bottom sheet.
export function Modal({ title, onClose, children, wide = false }) {
  useScrollLock(true);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`bg-slate-900 border border-white/15 w-full ${wide ? "sm:max-w-5xl" : "sm:max-w-2xl"} max-h-[94dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-white`}
        >
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-white/10 bg-slate-900">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 shrink-0" aria-label="Close"><X size={20} /></button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
