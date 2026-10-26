import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BookOpen, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { AppContent } from "../context/Context";
import { buildBatches } from "../utils/classSessions";
import { formatClassDate, formatClassTime } from "../utils/classTime";
import { uploadPdf, formatBytes } from "../utils/uploadPdf";
import PdfUploadField from "./PdfUploadField";
import PdfViewerModal from "./PdfViewerModal";

const input = "w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";
const label = "block text-sm text-gray-300 mb-1.5";

export default function ClassNotesAdmin() {
  const { backend_url, allSchedule, allUserData } = useContext(AppContent);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchKey, setBatchKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notify, setNotify] = useState(true);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(null);

  const batches = useMemo(() => buildBatches(allSchedule), [allSchedule]);
  const batch = batches.find((b) => b.key === batchKey);
  const session = batch?.sessions.find((s) => s._id === sessionId);
  const users = allUserData?.data || [];
  const nameOf = (id) => users.find((u) => u._id === id)?.name || "student";

  const load = async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/classnotes`);
      setNotes(data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load class notes");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Suggest a title when a session is picked
  useEffect(() => {
    if (session && !title) setTitle(`Class ${session.classNumber} Notes`);
  }, [sessionId]); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault();
    if (!session) return toast.error("Select the class session first");
    if (!title.trim()) return toast.error("Enter a title");
    if (!file) return toast.error("Choose a PDF");
    setBusy(true);
    setProgress(0);
    try {
      const uploaded = await uploadPdf({ file, purpose: "class-note", onProgress: setProgress });
      const { data } = await axios.post(`${backend_url}/api/classnotes`, {
        classScheduleId: session._id, title, description, file: uploaded, notify,
      });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      setTitle(""); setDescription(""); setFile(null); setSessionId("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const remove = async (note) => {
    if (!window.confirm(`Delete “${note.title}”? Students will lose access.`)) return;
    try {
      await axios.delete(`${backend_url}/api/classnotes/${note._id}`);
      setNotes((n) => n.filter((x) => x._id !== note._id));
      toast.success("Notes deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const grouped = useMemo(() => {
    const m = new Map();
    notes.forEach((n) => {
      const k = n.className;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(n);
    });
    return [...m.entries()];
  }, [notes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="text-cyan-300" /> Class Notes</h2>
        <p className="text-gray-300 text-sm mt-1">Attach PDF notes to a specific class (e.g. “Class No. 3 Notes”). Only students enrolled in that class can see them.</p>
      </div>

      <form onSubmit={submit} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>Class / batch</label>
          <select className={input} value={batchKey} onChange={(e) => { setBatchKey(e.target.value); setSessionId(""); }} disabled={busy}>
            <option value="" className="text-black">{allSchedule === false ? "Loading classes…" : "Select class"}</option>
            {batches.map((b) => (
              <option key={b.key} value={b.key} className="text-black">
                {b.className} — {b.studentsEnrolled.map(nameOf).slice(0, 2).join(", ")}{b.studentsEnrolled.length > 2 ? ` +${b.studentsEnrolled.length - 2}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Class number</label>
          <select className={input} value={sessionId} onChange={(e) => setSessionId(e.target.value)} disabled={!batch || busy}>
            <option value="" className="text-black">Select session</option>
            {batch?.sessions.map((s) => (
              <option key={s._id} value={s._id} className="text-black">
                Class {s.classNumber} — {formatClassDate(s)}, {formatClassTime(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Title</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Class 1 Notes" maxLength={120} disabled={busy} />
        </div>
        <div>
          <label className={label}>Description (optional)</label>
          <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Variables, loops, practice sheet" maxLength={500} disabled={busy} />
        </div>
        <div className="md:col-span-2">
          <PdfUploadField file={file} onChange={setFile} progress={progress} disabled={busy} />
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-cyan-400 w-4 h-4" />
            Email the enrolled students
          </label>
          <button disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} {busy ? "Uploading…" : "Upload notes"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-300">Loading…</p>
        ) : grouped.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-300">No class notes uploaded yet.</div>
        ) : (
          grouped.map(([className, list]) => (
            <div key={className} className="bg-white/10 border border-white/20 rounded-2xl p-4">
              <h3 className="font-semibold text-lg mb-3">{className}</h3>
              <div className="grid gap-2">
                {list.map((n) => (
                  <div key={n._id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200">Class {n.classNumber}</span>
                    <FileText size={18} className="text-rose-300 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{n.title}</p>
                      <p className="text-xs text-gray-400">{formatBytes(n.file.bytes)} · {n.downloads} download{n.downloads === 1 ? "" : "s"}</p>
                    </div>
                    <button onClick={() => setViewing(n)} className="p-2 rounded-lg hover:bg-white/10" aria-label="View"><Eye size={18} /></button>
                    <button onClick={() => remove(n)} className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-300" aria-label="Delete"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <PdfViewerModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
