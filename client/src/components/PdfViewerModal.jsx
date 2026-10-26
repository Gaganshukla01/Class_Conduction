import { useEffect } from "react";
import { Download, ExternalLink, X } from "lucide-react";

// In-app PDF viewer. `item` = { title, file: { viewUrl, downloadUrl } }
export default function PdfViewerModal({ item, onClose, onDownload }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  if (!item) return null;
  const { viewUrl, downloadUrl } = item.file;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold truncate flex-1">{item.title}</h3>
          <a href={viewUrl} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1 text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/10">
            <ExternalLink size={15} /> New tab
          </a>
          <a href={downloadUrl} onClick={() => onDownload?.(item)} className="flex items-center gap-1 text-sm text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600">
            <Download size={15} /> Download
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300" aria-label="Close"><X size={20} /></button>
        </div>
        <iframe title={item.title} src={viewUrl} className="flex-1 w-full bg-white" />
        <p className="text-xs text-gray-400 px-4 py-2 border-t border-white/10">
          PDF not showing? Use “New tab” or “Download”. (If you are the admin: enable “Allow delivery of PDF and ZIP files” in Cloudinary → Settings → Security.)
        </p>
      </div>
    </div>
  );
}
