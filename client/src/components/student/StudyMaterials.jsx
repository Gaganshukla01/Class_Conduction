import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, BookOpen, Download, Eye, FileText, Folder, Library, Search } from "lucide-react";
import { AppContent } from "../../context/Context";
import { formatBytes } from "../../utils/uploadPdf";
import { FOLDER_COLORS } from "../ResourceLibraryAdmin";
import PdfViewerModal from "../PdfViewerModal";

const when = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function StudyMaterials() {
  const { backend_url } = useContext(AppContent);
  const [view, setView] = useState("class"); // class | library
  const [notes, setNotes] = useState(null);
  const [folders, setFolders] = useState(null);
  const [files, setFiles] = useState([]);
  const [folder, setFolder] = useState(null);
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    axios.get(`${backend_url}/api/classnotes`).then((r) => setNotes(r.data.data)).catch(() => { setNotes([]); toast.error("Could not load class notes"); });
    axios.get(`${backend_url}/api/resources/folders`).then((r) => setFolders(r.data.data)).catch(() => { setFolders([]); toast.error("Could not load library"); });
  }, [backend_url]);

  useEffect(() => {
    if (view !== "library") return;
    const t = setTimeout(() => {
      axios.get(`${backend_url}/api/resources`, { params: { folderId: folder?._id, q: q || undefined } })
        .then((r) => setFiles(r.data.data)).catch(() => toast.error("Could not load files"));
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [view, folder, q, backend_url]);

  const grouped = useMemo(() => {
    const m = new Map();
    (notes || []).forEach((n) => { if (!m.has(n.className)) m.set(n.className, []); m.get(n.className).push(n); });
    return [...m.entries()];
  }, [notes]);

  // Counts the download for stats and returns the fresh attachment URL
  const track = (kind) => async (item) => {
    try { await axios.post(`${backend_url}/api/${kind}/${item._id}/download`); } catch { /* counting must never block a download */ }
  };

  const Row = ({ item, badge, kind }) => (
    <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-3 py-3 hover:bg-white/15 transition">
      {badge}
      <FileText className="text-rose-300 shrink-0" size={22} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white truncate">{item.title}</p>
        <p className="text-xs text-gray-400 truncate">{item.description || ""}{item.description ? " · " : ""}{formatBytes(item.file.bytes)} · {when(item.createdAt)}</p>
      </div>
      <button onClick={() => setViewing({ ...item, kind })} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"><Eye size={15} /><span className="hidden sm:inline">View</span></button>
      <a href={item.file.downloadUrl} onClick={() => track(kind)(item)} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600"><Download size={15} /><span className="hidden sm:inline">Download</span></a>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
        <h2 className="text-xl font-bold text-white mb-1">Study Materials</h2>
        <p className="text-gray-300 text-sm">Class notes from your instructor and a library of PDFs you can open or download anytime.</p>
        <div className="flex gap-2 mt-4">
          {[["class", "Class Notes", BookOpen], ["library", "Resource Library", Library]].map(([id, text, Icon]) => (
            <button key={id} onClick={() => setView(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${view === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
              <Icon size={16} /> {text}
            </button>
          ))}
        </div>
      </div>

      {view === "class" && (
        notes === null ? <p className="text-gray-300">Loading…</p> :
        grouped.length === 0 ? <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">No class notes yet. Your instructor will add them after each class.</div> :
        grouped.map(([name, list]) => (
          <div key={name} className="space-y-2">
            <h3 className="text-white font-semibold text-lg">{name}</h3>
            {list.map((n) => <Row key={n._id} item={n} kind="classnotes" badge={<span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200">Class {n.classNumber}</span>} />)}
          </div>
        ))
      )}

      {view === "library" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {folder && <button onClick={() => setFolder(null)} className="flex items-center gap-1 text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"><ArrowLeft size={16} /> All folders</button>}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={folder ? `Search in ${folder.name}…` : "Search all resources…"}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            </div>
          </div>

          {!folder && !q && (folders === null ? <p className="text-gray-300">Loading…</p> : folders.length === 0 ?
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">The library is empty for now.</div> :
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((f) => (
                <button key={f._id} onClick={() => setFolder(f)} className="text-left p-4 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 transition">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${FOLDER_COLORS[f.color] || FOLDER_COLORS.indigo} flex items-center justify-center mb-3`}><Folder size={24} className="text-white" /></div>
                  <p className="font-semibold text-white">{f.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{f.description || `${f.resourceCount} file${f.resourceCount === 1 ? "" : "s"}`}</p>
                  {f.description && <p className="text-xs text-cyan-300 mt-2">{f.resourceCount} file{f.resourceCount === 1 ? "" : "s"}</p>}
                </button>
              ))}
            </div>)}

          {(folder || q) && (files.length === 0 ? <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-300">{q ? "Nothing matches your search." : "No files in this folder yet."}</div> :
            <div className="grid gap-2">{files.map((r) => <Row key={r._id} item={r} kind="resources" badge={!folder && <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{folders?.find((f) => f._id === r.folderId)?.name}</span>} />)}</div>)}
        </div>
      )}
      <PdfViewerModal item={viewing} onClose={() => setViewing(null)} onDownload={(i) => track(i.kind)(i)} />
    </div>
  );
}
