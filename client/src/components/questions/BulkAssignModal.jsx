import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FolderOpen, Loader2, ListChecks } from "lucide-react";
import { Modal } from "./questionKit";
import TargetPicker from "./TargetPicker";

// Assign questions and/or whole folders to students and/or whole classes.
//   questionIds: [..]   folders: [{_id, name, questionCount}]   title: modal title
export default function BulkAssignModal({ backend_url, title, questionIds = [], folders = [], students, batches, onClose, onDone }) {
  const [picked, setPicked] = useState(new Set());
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  const folderQuestions = folders.reduce((n, f) => n + (f.questionCount || 0), 0);
  const total = questionIds.length + folderQuestions;

  const submit = async () => {
    if (picked.size === 0) return toast.error("Select at least one student or class");
    setBusy(true);
    try {
      const { data } = await axios.post(`${backend_url}/api/questions/assign-bulk`, {
        questionIds,
        folderIds: folders.map((f) => f._id),
        studentIds: [...picked],
        dueDate: due ? `${due}T23:59:00+05:30` : undefined,
      });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      onDone?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not assign");
    } finally { setBusy(false); }
  };

  return (
    <Modal title={title || "Assign questions"} onClose={busy ? () => {} : onClose}>
      <div className="space-y-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm space-y-1.5">
          {questionIds.length > 0 && <p className="flex items-center gap-2 text-gray-200"><ListChecks size={16} className="text-cyan-300" /> {questionIds.length} selected question{questionIds.length === 1 ? "" : "s"}</p>}
          {folders.map((f) => <p key={f._id} className="flex items-center gap-2 text-gray-200"><FolderOpen size={16} className="text-amber-300" /> Entire folder “{f.name}” <span className="text-gray-400">({f.questionCount ?? "?"} questions)</span></p>)}
          {total > 0 && <p className="text-xs text-gray-400">Students who already have a question are skipped automatically.</p>}
        </div>
        <TargetPicker students={students} batches={batches} picked={picked} setPicked={setPicked} />
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Due date (optional)</label>
          <input type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white [color-scheme:dark]" />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
          <button onClick={submit} disabled={busy || picked.size === 0} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">
            {busy && <Loader2 className="animate-spin" size={16} />} Assign{picked.size ? ` to ${picked.size} student${picked.size === 1 ? "" : "s"}` : ""}
          </button>
        </div>
      </div>
    </Modal>
  );
}
