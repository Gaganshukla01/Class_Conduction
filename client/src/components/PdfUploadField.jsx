import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { formatBytes, validatePdf } from "../utils/uploadPdf";

// Drag & drop / click PDF picker with validation and an upload progress bar.
export default function PdfUploadField({ file, onChange, progress = null, disabled = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const pick = (f) => {
    const problem = validatePdf(f);
    setError(problem || "");
    onChange(problem ? null : f);
  };

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) pick(e.dataTransfer.files?.[0]); }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
          dragging ? "border-cyan-400 bg-cyan-400/10" : "border-white/20 hover:border-white/40 bg-white/5"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="text-rose-300 shrink-0" size={28} />
            <div className="text-left min-w-0">
              <p className="text-white font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
            </div>
            {!disabled && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-1 rounded-lg hover:bg-white/10 text-gray-300" aria-label="Remove file">
                <X size={18} />
              </button>
            )}
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto text-cyan-300 mb-2" size={30} />
            <p className="text-sm text-gray-200">Drag a PDF here or <span className="text-cyan-300 underline">browse</span></p>
            <p className="text-xs text-gray-400 mt-1">PDF only · max 10 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-rose-300 mt-2">{error}</p>}
      {progress !== null && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progress < 100 ? `Uploading… ${progress}%` : "Saving…"}</p>
        </div>
      )}
    </div>
  );
}
