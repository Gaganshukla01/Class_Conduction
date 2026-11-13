import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, FolderUp, Files, Loader2, RotateCcw, Square, Upload, X, XCircle } from "lucide-react";
import { AppContent } from "../context/Context";
import { uploadPdf, formatBytes, MAX_PDF_BYTES } from "../utils/uploadPdf";

// ----------------------------------------------------------------------------------------
// Pure helpers (exported so they can be unit-tested without a browser)
// ----------------------------------------------------------------------------------------

// "Python Notes - Part 1.pdf"  ->  "Python Notes - Part 1"   (the title is the PDF's file name)
export const titleFromName = (name = "") => name.replace(/\.pdf$/i, "").trim().slice(0, 120);

const isPdf = (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const natural = (a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" });

// Turns the files the browser gives us (a whole folder, or a multi-selection) into rows.
// Non-PDF files are ignored; oversized / empty / duplicate-title files are listed but not ticked.
export function toBulkItems(fileList, existingTitles = []) {
  const files = Array.from(fileList || []);
  const have = new Set(existingTitles.map((t) => String(t).trim().toLowerCase()));
  const titlesInBatch = new Set();
  const paths = new Set();
  const items = [];
  let skippedNonPdf = 0;

  for (const file of files) {
    if (!isPdf(file)) { skippedNonPdf += 1; continue; }
    const path = file.webkitRelativePath || file.name;
    const key = `${path}|${file.size}`;
    if (paths.has(key)) continue;
    paths.add(key);

    const title = titleFromName(file.name) || "Untitled";
    const lower = title.toLowerCase();
    let status = "queued";
    let note = "";
    let selected = true;
    if (file.size === 0) { status = "invalid"; selected = false; note = "The file is empty"; }
    else if (file.size > MAX_PDF_BYTES) { status = "invalid"; selected = false; note = `Too large (${formatBytes(file.size)}). The limit is 10 MB`; }
    else if (have.has(lower)) { selected = false; note = "A file with this title is already in the folder"; }
    else if (titlesInBatch.has(lower)) { selected = false; note = "Another file in this batch has the same name"; }
    titlesInBatch.add(lower);

    // "Folder/a.pdf" -> depth 0, "Folder/sub/a.pdf" -> depth 1, a loose file -> depth 0
    const depth = Math.max(0, path.split("/").length - 2);
    items.push({ id: `${key}-${items.length}`, file, path, depth, title, size: file.size, selected, status, note, progress: 0, error: "" });
  }
  items.sort(natural);
  return { items, skippedNonPdf };
}

// Uploads the given rows ONE BY ONE. A failure never stops the rest. `upload` and `create` are
// injected, so the loop itself can be tested.
export async function runBulkUpload({ items, upload, create, onUpdate, shouldStop = () => false }) {
  const result = { ok: 0, failed: 0, stopped: false };
  for (const item of items) {
    if (shouldStop()) { result.stopped = true; break; }
    onUpdate(item.id, { status: "uploading", progress: 0, error: "" });
    try {
      const uploaded = await upload(item, (p) => onUpdate(item.id, { progress: p }));
      await create(item, uploaded);
      onUpdate(item.id, { status: "done", progress: 100, selected: false, error: "" });
      result.ok += 1;
    } catch (e) {
      onUpdate(item.id, { status: "error", error: e?.response?.data?.message || e?.message || "Upload failed" });
      result.failed += 1;
    }
  }
  return result;
}

// ----------------------------------------------------------------------------------------
// UI
// ----------------------------------------------------------------------------------------
const input = "w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

export default function ResourceBulkUpload({ folder, existingTitles = [], onDone }) {
  const { backend_url } = useContext(AppContent);
  const [items, setItems] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [includeSub, setIncludeSub] = useState(true);
  const [tags, setTags] = useState("");
  const [running, setRunning] = useState(false);
  const [runTotal, setRunTotal] = useState(0);
  const folderInput = useRef(null);
  const filesInput = useRef(null);
  const stopRef = useRef(false);

  // <input webkitdirectory> lets the admin pick a whole folder; set it as a real attribute
  useEffect(() => { folderInput.current?.setAttribute("webkitdirectory", ""); folderInput.current?.setAttribute("directory", ""); }, []);
  useEffect(() => () => { stopRef.current = true; }, []); // leaving the page stops after the current file

  const update = (id, patch) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const visible = useMemo(() => items.filter((i) => includeSub || i.depth === 0), [items, includeSub]);
  const pending = visible.filter((i) => i.selected && i.status !== "done" && i.status !== "invalid");
  const done = visible.filter((i) => i.status === "done").length;
  const failed = visible.filter((i) => i.status === "error").length;
  const doneThisRun = visible.filter((i) => i.status === "done" || i.status === "error").length;

  const pick = (fileList) => {
    if (!fileList?.length) return;
    const { items: fresh, skippedNonPdf } = toBulkItems(fileList, existingTitles);
    setSkipped((n) => n + skippedNonPdf);
    setItems((cur) => {
      const known = new Set(cur.map((i) => `${i.path}|${i.size}`));
      return [...cur, ...fresh.filter((i) => !known.has(`${i.path}|${i.size}`))].sort(natural);
    });
    if (fresh.length === 0) toast.info("No PDF files found in your selection");
  };

  const start = async () => {
    const todo = pending;
    if (!folder || todo.length === 0) return;
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8);
    stopRef.current = false;
    setRunning(true);
    setRunTotal(todo.length);
    const result = await runBulkUpload({
      items: todo,
      shouldStop: () => stopRef.current,
      onUpdate: update,
      upload: (item, onProgress) => uploadPdf({ file: item.file, purpose: "resource", folderId: folder._id, onProgress }),
      create: (item, file) =>
        axios.post(`${backend_url}/api/resources`, { folderId: folder._id, title: item.title.trim() || titleFromName(item.file.name) || "Untitled", description: "", tags: tagList, file }),
    });
    setRunning(false);
    if (result.ok) onDone?.(result.ok);
    if (result.stopped) toast.info(`Stopped. ${result.ok} uploaded, ${todo.length - result.ok - result.failed} not started.`);
    else if (result.failed) toast.warn(`${result.ok} uploaded, ${result.failed} failed - fix them and press Upload again to retry only those.`);
    else toast.success(`All ${result.ok} PDF${result.ok === 1 ? "" : "s"} uploaded to ${folder.name}`);
  };

  const clear = () => { setItems([]); setSkipped(0); };
  const toggleAll = (on) => setItems((cur) => cur.map((i) => (i.status === "done" || i.status === "invalid" ? i : { ...i, selected: on })));

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-4">
      <div>
        <p className="text-sm text-gray-300">Bulk upload to <strong className="text-white">{folder?.name}</strong></p>
        <p className="text-xs text-gray-400 mt-0.5">Choose a folder from your computer. Every PDF inside it is uploaded one by one, and each title is the PDF's file name.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input ref={folderInput} type="file" multiple className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        <input ref={filesInput} type="file" multiple accept="application/pdf,.pdf" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        <button type="button" disabled={running} onClick={() => folderInput.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 font-semibold disabled:opacity-50"><FolderUp size={18} /> Choose a folder</button>
        <button type="button" disabled={running} onClick={() => filesInput.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50"><Files size={18} /> Choose PDF files</button>
        {items.length > 0 && !running && <button type="button" onClick={clear} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10"><X size={16} /> Clear list</button>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-gray-300">
          No files chosen yet. Press <strong>Choose a folder</strong> and pick the folder that contains your PDFs.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] items-center">
            <input className={input} placeholder="Tags for ALL these files (optional): python, notes" value={tags} onChange={(e) => setTags(e.target.value)} disabled={running} />
            <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-cyan-400" checked={includeSub} onChange={(e) => setIncludeSub(e.target.checked)} disabled={running} /> Include PDFs in sub-folders
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="text-gray-300">
              <strong className="text-white">{visible.length}</strong> PDF{visible.length === 1 ? "" : "s"} found
              {skipped > 0 && <span className="text-gray-400"> · {skipped} non-PDF file{skipped === 1 ? "" : "s"} ignored</span>}
              {done > 0 && <span className="text-emerald-300"> · {done} uploaded</span>}
              {failed > 0 && <span className="text-rose-300"> · {failed} failed</span>}
            </div>
            {!running && <div className="flex gap-3"><button type="button" onClick={() => toggleAll(true)} className="text-cyan-300 hover:underline">Select all</button><button type="button" onClick={() => toggleAll(false)} className="text-cyan-300 hover:underline">Select none</button></div>}
          </div>

          {running && (
            <div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${runTotal ? Math.round((Math.min(doneThisRun, runTotal) / runTotal) * 100) : 0}%` }} /></div>
              <p className="text-xs text-gray-300 mt-1">Uploading file {Math.min(doneThisRun + 1, runTotal)} of {runTotal}…</p>
            </div>
          )}

          <ul className="max-h-96 overflow-y-auto overscroll-contain space-y-1.5 pr-1">
            {visible.map((i) => (
              <li key={i.id} className={`rounded-xl border px-3 py-2 ${i.status === "error" ? "border-rose-400/40 bg-rose-500/10" : i.status === "done" ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 accent-cyan-400 shrink-0" checked={i.selected} disabled={running || i.status === "done" || i.status === "invalid"} onChange={(e) => update(i.id, { selected: e.target.checked })} aria-label={`Upload ${i.title}`} />
                  <div className="min-w-0 flex-1">
                    <input className="w-full bg-transparent text-white text-sm font-medium outline-none border-b border-transparent focus:border-cyan-400 disabled:opacity-80 select-text" value={i.title} maxLength={120} disabled={running || i.status === "done"} onChange={(e) => update(i.id, { title: e.target.value })} aria-label="Title" />
                    <p className="text-[11px] text-gray-400 truncate">{i.path} · {formatBytes(i.size)}</p>
                  </div>
                  <span className="shrink-0 text-xs">
                    {i.status === "uploading" && <span className="flex items-center gap-1 text-cyan-300"><Loader2 size={14} className="animate-spin" /> {i.progress}%</span>}
                    {i.status === "done" && <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 size={14} /> Done</span>}
                    {i.status === "error" && <span className="flex items-center gap-1 text-rose-300"><XCircle size={14} /> Failed</span>}
                    {i.status === "invalid" && <span className="text-amber-300">Skipped</span>}
                    {i.status === "queued" && <span className="text-gray-400">{i.selected ? "Ready" : "Not selected"}</span>}
                  </span>
                </div>
                {i.status === "uploading" && <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${i.progress}%` }} /></div>}
                {(i.error || i.note) && <p className={`text-xs mt-1 ${i.error ? "text-rose-300" : "text-amber-300"}`}>{i.error || i.note}</p>}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {running && <button type="button" onClick={() => { stopRef.current = true; }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold"><Square size={16} /> Stop after this file</button>}
            <button type="button" onClick={start} disabled={running || pending.length === 0} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-50">
              {running ? <Loader2 className="animate-spin" size={18} /> : failed > 0 && done + failed === visible.length ? <RotateCcw size={18} /> : <Upload size={18} />}
              {running ? "Uploading…" : `${failed > 0 ? "Retry / upload" : "Upload"} ${pending.length} PDF${pending.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
