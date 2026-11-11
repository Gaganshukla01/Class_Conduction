import { useMemo, useState } from "react";
import { Check, Search, Users } from "lucide-react";

// Pick students one by one and/or add a whole class at once.
//  students: [{_id, name, email}]   batches: [{key, className, studentsEnrolled}]
export default function TargetPicker({ students, batches = [], picked, setPicked, maxHeight = "max-h-64" }) {
  const [q, setQ] = useState("");
  const valid = useMemo(() => new Set(students.map((s) => s._id)), [students]);
  const list = useMemo(() => students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())), [students, q]);
  const allShown = list.length > 0 && list.every((s) => picked.has(s._id));

  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleMany = (ids) => setPicked((p) => {
    const n = new Set(p); const ids2 = ids.filter((i) => valid.has(i)); const all = ids2.every((i) => n.has(i));
    ids2.forEach((i) => (all ? n.delete(i) : n.add(i))); return n;
  });

  return (
    <div className="space-y-3">
      {batches.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">Add a whole class</p>
          <div className="flex flex-wrap gap-2">
            {batches.map((b) => {
              const ids = b.studentsEnrolled.filter((i) => valid.has(i));
              const on = ids.length > 0 && ids.every((i) => picked.has(i));
              return (
                <button key={b.key} type="button" onClick={() => toggleMany(b.studentsEnrolled)} disabled={ids.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${on ? "bg-cyan-500/25 border-cyan-400 text-cyan-100" : "bg-white/5 border-white/15 text-gray-200 hover:bg-white/10"} disabled:opacity-40`}>
                  {on ? <Check size={14} /> : <Users size={14} />} {b.className} <span className="opacity-70">({ids.length})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={() => toggleMany(list.map((s) => s._id))} disabled={list.length === 0} className="text-cyan-300 hover:underline disabled:opacity-40">{allShown ? "Clear shown" : `Select all shown (${list.length})`}</button>
        <span className="text-gray-400">{picked.size} selected</span>
      </div>
      <ul className={`${maxHeight} overflow-y-auto space-y-1.5 pr-1`}>
        {list.length === 0 ? <li className="text-gray-400 text-sm">No students found.</li> : list.map((s) => {
          const on = picked.has(s._id);
          return (
            <li key={s._id}>
              <button type="button" onClick={() => toggle(s._id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition ${on ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? "bg-cyan-400 border-cyan-400 text-black" : "border-white/30"}`}>{on && <Check size={14} />}</span>
                <span className="min-w-0 flex-1"><span className="block text-white truncate">{s.name}</span><span className="block text-xs text-gray-400 truncate">{s.email}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
