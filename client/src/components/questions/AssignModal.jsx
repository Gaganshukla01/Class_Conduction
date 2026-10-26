import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Check, Loader2, Search } from "lucide-react";
import { Modal } from "./questionKit";

// Assign one question to many students. Students who already have it are shown
// as such and cannot be picked twice.
export default function AssignModal({ backend_url, question, students, onClose, onAssigned }) {
  const [existing, setExisting] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const [q, setQ] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(`${backend_url}/api/questions/${question._id}/assignments`)
      .then((r) => setExisting(new Set(r.data.data.map((a) => a.studentId))))
      .catch(() => setExisting(new Set()));
  }, [backend_url, question._id]);

  const list = useMemo(
    () => students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())),
    [students, q]
  );
  const free = list.filter((s) => !existing?.has(s._id));
  const allPicked = free.length > 0 && free.every((s) => picked.has(s._id));

  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setPicked((p) => { const n = new Set(p); free.forEach((s) => (allPicked ? n.delete(s._id) : n.add(s._id))); return n; });

  const submit = async () => {
    if (picked.size === 0) return toast.error("Select at least one student");
    setBusy(true);
    try {
      const { data } = await axios.post(`${backend_url}/api/questions/${question._id}/assign`, {
        studentIds: [...picked],
        dueDate: due ? `${due}T23:59:00+05:30` : undefined,
      });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      onAssigned();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not assign");
    } finally { setBusy(false); }
  };

  return (
    <Modal title={`Assign “${question.title}”`} onClose={busy ? () => {} : onClose}>
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <button onClick={toggleAll} disabled={free.length === 0} className="text-cyan-300 hover:underline disabled:opacity-40 disabled:no-underline">{allPicked ? "Clear selection" : `Select all (${free.length})`}</button>
          <span className="text-gray-400">{picked.size} selected</span>
        </div>
        <ul className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {existing === null ? <li className="text-gray-400 text-sm">Loading…</li> : list.length === 0 ? <li className="text-gray-400 text-sm">No students found.</li> : list.map((s) => {
            const has = existing.has(s._id);
            const on = picked.has(s._id);
            return (
              <li key={s._id}>
                <button type="button" disabled={has} onClick={() => toggle(s._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${has ? "opacity-50 border-white/10 bg-white/5 cursor-not-allowed" : on ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? "bg-cyan-400 border-cyan-400 text-black" : "border-white/30"}`}>{on && <Check size={14} />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-white truncate">{s.name}</span><span className="block text-xs text-gray-400 truncate">{s.email}</span></span>
                  {has && <span className="text-xs text-gray-300 shrink-0">Already assigned</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Due date (optional)</label>
          <input type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white [color-scheme:dark]" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
          <button onClick={submit} disabled={busy || picked.size === 0} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">
            {busy && <Loader2 className="animate-spin" size={16} />} Assign{picked.size ? ` to ${picked.size}` : ""} (students get an email)
          </button>
        </div>
      </div>
    </Modal>
  );
}
