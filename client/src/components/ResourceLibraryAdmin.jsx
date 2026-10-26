import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Eye, FileText, Folder, FolderPlus, Loader2, Trash2, Upload, Library } from "lucide-react";
import { AppContent } from "../context/Context";
import { uploadPdf, formatBytes } from "../utils/uploadPdf";
import PdfUploadField from "./PdfUploadField";
import PdfViewerModal from "./PdfViewerModal";

export const FOLDER_COLORS = {
  indigo: "from-indigo-500 to-blue-600", violet: "from-violet-500 to-fuchsia-600", blue: "from-sky-500 to-blue-600",
  emerald: "from-emerald-500 to-teal-600", amber: "from-amber-500 to-orange-600", rose: "from-rose-500 to-pink-600",
  cyan: "from-cyan-500 to-sky-600", slate: "from-slate-500 to-gray-600",
};
const input = "w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

export default function ResourceLibraryAdmin() {
  const { backend_url } = useContext(AppContent);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [active, setActive] = useState(null); // folder id
  const [loading, setLoading] = useState(true);
  const [newFolder, setNewFolder] = useState({ name: "", color: "indigo", description: "" });
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", tags: "" });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(null);

  const folder = useMemo(() => folders.find((f) => f._id === active), [folders, active]);

  const loadFolders = async (keep) => {
    try {
      const { data } = await axios.get(`${backend_url}/api/resources/folders`);
      setFolders(data.data);
      setActive((cur) => keep && data.data.some((f) => f._id === cur) ? cur : data.data[0]?._id || null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load folders");
    } finally {
      setLoading(false);
    }
  };
  const loadFiles = async (id) => {
    if (!id) return setFiles([]);
    try {
      const { data } = await axios.get(`${backend_url}/api/resources`, { params: { folderId: id } });
      setFiles(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load files");
    }
  };
  useEffect(() => { loadFolders(true); }, []);
  useEffect(() => { loadFiles(active); }, [active]);

  const createFolder = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${backend_url}/api/resources/folders`, newFolder);
      toast.success(data.message);
      setNewFolder({ name: "", color: "indigo", description: "" });
      setShowNew(false);
      setFolders((f) => [...f, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setActive(data.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create folder");
    }
  };

  const deleteFolder = async (f) => {
    if (!window.confirm(`Delete folder “${f.name}”?`)) return;
    try {
      await axios.delete(`${backend_url}/api/resources/folders/${f._id}`);
    } catch (err) {
      if (err.response?.status === 409) {
        if (!window.confirm(`${err.response.data.message}\n\nDelete the folder AND all ${err.response.data.resourceCount} file(s)?`)) return;
        try { await axios.delete(`${backend_url}/api/resources/folders/${f._id}`, { params: { force: true } }); }
        catch (e2) { return toast.error(e2.response?.data?.message || "Could not delete"); }
      } else return toast.error(err.response?.data?.message || "Could not delete");
    }
    toast.success("Folder deleted");
    loadFolders(false);
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!folder) return toast.error("Create or select a folder first");
    if (!form.title.trim()) return toast.error("Enter a title");
    if (!file) return toast.error("Choose a PDF");
    setBusy(true); setProgress(0);
    try {
      const uploaded = await uploadPdf({ file, purpose: "resource", folderId: folder._id, onProgress: setProgress });
      const { data } = await axios.post(`${backend_url}/api/resources`, {
        folderId: folder._id, title: form.title, description: form.description, tags: form.tags, file: uploaded,
      });
      toast.success(data.message);
      setForm({ title: "", description: "", tags: "" }); setFile(null);
      loadFiles(folder._id);
      setFolders((fs) => fs.map((f) => f._id === folder._id ? { ...f, resourceCount: f.resourceCount + 1 } : f));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setBusy(false); setProgress(null); }
  };

  const removeFile = async (r) => {
    if (!window.confirm(`Delete “${r.title}”?`)) return;
    try {
      await axios.delete(`${backend_url}/api/resources/${r._id}`);
      setFiles((x) => x.filter((i) => i._id !== r._id));
      setFolders((fs) => fs.map((f) => f._id === r.folderId ? { ...f, resourceCount: Math.max(0, f.resourceCount - 1) } : f));
      toast.success("Deleted");
    } catch (err) { toast.error(err.response?.data?.message || "Could not delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Library className="text-cyan-300" /> Resource Library</h2>
          <p className="text-gray-300 text-sm mt-1">Organise study PDFs into subject folders (Python, Web Dev…). Every student can view and download them anytime.</p>
        </div>
        <button onClick={() => setShowNew((s) => !s)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20">
          <FolderPlus size={18} /> New folder
        </button>
      </div>

      {showNew && (
        <form onSubmit={createFolder} className="bg-white/10 border border-white/20 rounded-2xl p-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] items-end">
          <input className={input} placeholder="Folder name (e.g. Python)" value={newFolder.name} onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })} maxLength={60} autoFocus />
          <input className={input} placeholder="Short description (optional)" value={newFolder.description} onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })} maxLength={300} />
          <div className="flex gap-1.5 flex-wrap">
            {Object.keys(FOLDER_COLORS).map((c) => (
              <button type="button" key={c} onClick={() => setNewFolder({ ...newFolder, color: c })} aria-label={c}
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${FOLDER_COLORS[c]} ${newFolder.color === c ? "ring-2 ring-white" : ""}`} />
            ))}
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold">Create</button>
        </form>
      )}

      {loading ? <p className="text-gray-300">Loading…</p> : folders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">
          <Folder className="mx-auto mb-3 text-gray-400" size={36} />
          No folders yet. Click <strong>New folder</strong> to create your first subject folder.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            {folders.map((f) => (
              <div key={f._id} onClick={() => setActive(f._id)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${active === f._id ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${FOLDER_COLORS[f.color] || FOLDER_COLORS.indigo} flex items-center justify-center`}><Folder size={20} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.resourceCount} file{f.resourceCount === 1 ? "" : "s"}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteFolder(f); }} className="p-1.5 rounded-lg text-rose-300 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20" aria-label="Delete folder"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <form onSubmit={upload} className="bg-white/10 border border-white/20 rounded-2xl p-4 grid gap-3 md:grid-cols-2">
              <p className="md:col-span-2 text-sm text-gray-300">Upload to <strong className="text-white">{folder?.name}</strong></p>
              <input className={input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} disabled={busy} />
              <input className={input} placeholder="Tags: beginner, loops, cheatsheet" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} disabled={busy} />
              <input className={`${input} md:col-span-2`} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} disabled={busy} />
              <div className="md:col-span-2"><PdfUploadField file={file} onChange={setFile} progress={progress} disabled={busy} /></div>
              <div className="md:col-span-2 flex justify-end">
                <button disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">
                  {busy ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} {busy ? "Uploading…" : "Upload PDF"}
                </button>
              </div>
            </form>

            {files.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-300">This folder is empty.</div>
            ) : (
              <div className="grid gap-2">
                {files.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">
                    <FileText className="text-rose-300 shrink-0" size={22} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 truncate">{formatBytes(r.file.bytes)} · {r.downloads} downloads{r.tags?.length ? ` · ${r.tags.join(", ")}` : ""}</p>
                    </div>
                    <button onClick={() => setViewing(r)} className="p-2 rounded-lg hover:bg-white/10" aria-label="View"><Eye size={18} /></button>
                    <button onClick={() => removeFile(r)} className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-300" aria-label="Delete"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <PdfViewerModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
