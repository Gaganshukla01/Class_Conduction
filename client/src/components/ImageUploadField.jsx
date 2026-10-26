import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { formatBytes, validateImage } from "../utils/uploadPdf";

// Pick an image (click, drag & drop or paste a screenshot with Ctrl+V).
// `existingUrl` shows the already-saved image when editing.
export default function ImageUploadField({ file, onChange, existingUrl, onRemoveExisting, progress = null, disabled = false, label = "Add image" }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    const problem = validateImage(f);
    setError(problem || "");
    if (!problem) onChange(f);
  };

  const shown = preview || existingUrl;

  return (
    <div
      onPaste={(e) => {
        const item = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith("image/"));
        if (item && !disabled) { e.preventDefault(); pick(item); }
      }}
    >
      <div
        tabIndex={0}
        onClick={() => !disabled && !shown && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) pick(e.dataTransfer.files?.[0]); }}
        className={`rounded-xl border-2 border-dashed p-4 text-center transition outline-none focus:border-cyan-400 ${
          dragging ? "border-cyan-400 bg-cyan-400/10" : "border-white/20 bg-white/5"
        } ${!shown && !disabled ? "cursor-pointer hover:border-white/40" : ""} ${disabled ? "opacity-60" : ""}`}
      >
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {shown ? (
          <div className="relative inline-block max-w-full">
            <img src={shown} alt="Selected" className="max-h-48 rounded-lg border border-white/20 mx-auto" />
            {!disabled && (
              <button type="button" aria-label="Remove image"
                onClick={(e) => { e.stopPropagation(); if (file) onChange(null); else onRemoveExisting?.(); }}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow"><X size={14} /></button>
            )}
            {file && <p className="text-xs text-gray-400 mt-2">{file.name} · {formatBytes(file.size)}</p>}
          </div>
        ) : (
          <>
            <ImagePlus className="mx-auto text-cyan-300 mb-1.5" size={28} />
            <p className="text-sm text-gray-200">{label}: click, drag &amp; drop, or paste (Ctrl+V)</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF or WebP · max 5 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-rose-300 mt-2">{error}</p>}
      {progress !== null && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
