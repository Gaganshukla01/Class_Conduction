import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { FOLDER_COLORS } from "../ResourceLibraryAdmin";
import { Modal } from "./questionKit";

// Create / rename a Category (no parent) or a Session (parent = category).
export default function FolderForm({ backend_url, parent, folder, onClose, onSaved }) {
  const editing = Boolean(folder);
  const level = editing ? folder.level : parent ? 2 : 1;
  const [f, setF] = useState({ name: folder?.name || "", description: folder?.description || "", color: folder?.color || "indigo" });
  const [busy, setBusy] = useState(false);
  const kind = level === 1 ? "category" : "session";

  const save = async () => {
    if (!f.name.trim()) return toast.error(`Enter a ${kind} name`);
    setBusy(true);
    try {
      const { data } = editing
        ? await axios.put(`${backend_url}/api/question-folders/${folder._id}`, f)
        : await axios.post(`${backend_url}/api/question-folders`, { ...f, parentId: parent?._id });
      toast.success(data.message || "Saved");
      onSaved(data.data);
      onClose();
    } catch (error) { toast.error(error.response?.data?.message || "Could not save"); } finally { setBusy(false); }
  };
  const input = "w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

  return (
    <Modal title={`${editing ? "Edit" : "New"} ${kind}${parent ? ` in “${parent.name}”` : ""}`} onClose={busy ? () => {} : onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">{level === 1 ? "Category / subject name" : "Session name"}</label>
          <input autoFocus className={input} value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} placeholder={level === 1 ? "e.g. Python WebDev" : "e.g. Session 01"} />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Description (optional)</label>
          <input className={input} value={f.description} maxLength={300} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        {level === 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {Object.keys(FOLDER_COLORS).map((c) => (
              <button type="button" key={c} onClick={() => setF({ ...f, color: c })} aria-label={c} className={`w-7 h-7 rounded-full bg-gradient-to-br ${FOLDER_COLORS[c]} ${f.color === c ? "ring-2 ring-white" : ""}`} />
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Save</button>
        </div>
      </div>
    </Modal>
  );
}
