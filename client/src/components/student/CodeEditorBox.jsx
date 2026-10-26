import { useRef } from "react";

// A small code editor: line numbers, Tab inserts spaces, monospace, no deps.
export default function CodeEditorBox({ value, onChange, language, disabled = false, minRows = 14 }) {
  const gutter = useRef(null);
  const lines = Math.max(value.split("\n").length, minRows);
  const indent = language === "python" || language === "java" || language === "cpp" ? "    " : "  ";

  const onKeyDown = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target;
    const { selectionStart: s, selectionEnd: end } = el;
    const next = value.slice(0, s) + indent + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + indent.length; });
  };

  return (
    <div className="flex rounded-xl overflow-hidden border border-white/15 bg-slate-950/70 font-mono text-sm leading-6">
      {/* absolute inner box: the gutter never makes the editor taller than the textarea */}
      <div aria-hidden className="relative shrink-0 bg-black/30 select-none" style={{ width: 48 }}>
        <div ref={gutter} className="absolute inset-0 overflow-hidden py-3 px-3 text-right text-gray-500">
          {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
      </div>
      <textarea
        value={value}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.target.scrollTop; }}
        rows={minRows}
        className="flex-1 py-3 px-3 bg-transparent text-gray-100 outline-none resize-y overflow-auto whitespace-pre"
        style={{ tabSize: 4, minHeight: `${minRows * 1.5}rem`, maxHeight: "32rem" }}
      />
    </div>
  );
}
