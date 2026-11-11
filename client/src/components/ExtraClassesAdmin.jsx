import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CalendarPlus, CheckCheck, Clock, ExternalLink, Loader2, RefreshCw, Trash2, Users, XCircle } from "lucide-react";
import { AppContent } from "../context/Context";
import { buildBatches } from "../utils/classSessions";
import { classStartDate } from "../utils/classTime";
import TargetPicker from "./questions/TargetPicker";
import { Modal } from "./questions/questionKit";

const field = "w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 [color-scheme:dark]";
const label = "block text-sm text-gray-300 mb-1.5";
const fmt = (c) => { const d = classStartDate(c); return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`; };
const today = () => new Date().toISOString().slice(0, 10);

// Schedule a one-off Extra / Substitute class, post it to the students' chat with a
// Join Now button, email them, and mark attendance for it afterwards.
export default function ExtraClassesAdmin() {
  const { backend_url, allUserData, allSchedule, userData } = useContext(AppContent);
  const [list, setList] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [creating, setCreating] = useState(false);
  const [attending, setAttending] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  const users = allUserData?.data || [];
  const students = useMemo(() => users.filter((u) => u.userType === "student"), [users]);
  const admins = useMemo(() => users.filter((u) => u.userType === "admin"), [users]);
  const batches = useMemo(() => buildBatches(allSchedule), [allSchedule]);
  const classNames = useMemo(() => [...new Set((Array.isArray(allSchedule) ? allSchedule : []).map((c) => c.className))], [allSchedule]);

  const load = () => axios.get(`${backend_url}/api/extra-classes`).then((r) => setList(r.data.data)).catch((e) => { setList([]); toast.error(e.response?.data?.message || "Could not load extra classes"); });
  useEffect(() => { load(); }, []); // eslint-disable-line

  const now = new Date();
  const shown = (list || []).filter((c) => {
    const past = classStartDate(c).getTime() + (parseFloat(c.classDuration) || 1) * 3600000 < now.getTime();
    if (tab === "cancelled") return c.status === "cancelled";
    if (c.status === "cancelled") return false;
    return tab === "upcoming" ? !past && c.status !== "completed" : past || c.status === "completed";
  }).sort((a, b) => (tab === "upcoming" ? 1 : -1) * (classStartDate(a) - classStartDate(b)));

  const cancel = async (c) => {
    if (!window.confirm(`Cancel “${c.title}”? Students will be notified in chat and by email.`)) return;
    try { const { data } = await axios.put(`${backend_url}/api/extra-classes/${c._id}`, { status: "cancelled" }); toast.success([data.message, data.emailMessage].filter(Boolean).join(" · ")); load(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not cancel"); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete “${c.title}” and its attendance?`)) return;
    try { await axios.delete(`${backend_url}/api/extra-classes/${c._id}`); toast.success("Deleted"); load(); } catch (e) { toast.error(e.response?.data?.message || "Could not delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><CalendarPlus className="text-cyan-300" /> Extra & Substitute Classes</h2>
          <p className="text-gray-300 text-sm mt-1">Schedule a one-off class. Students get a rich card with a <strong>Join Now</strong> button in the chat, plus an email.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold"><CalendarPlus size={18} /> New class</button>
      </div>

      <div className="flex gap-2">
        {[["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"]].map(([id, t]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>{t}</button>
        ))}
      </div>

      {list === null ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div> : shown.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-300">No {tab} extra classes.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((c) => {
            const marked = c.attendance?.length || 0;
            const present = (c.attendance || []).filter((a) => a.status === "Present").length;
            return (
              <div key={c._id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.type === "substitute" ? "bg-amber-500/25 text-amber-200" : "bg-indigo-500/25 text-indigo-200"}`}>{c.type === "substitute" ? "Substitute" : "Extra"} class</span>
                    <h3 className="text-lg font-semibold text-white mt-1.5">{c.title}</h3>
                    {c.topic && <p className="text-sm text-gray-300">{c.topic}</p>}
                  </div>
                  {c.status === "completed" && <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">Attendance done</span>}
                </div>
                <div className="mt-3 text-sm text-gray-200 space-y-1">
                  <p className="flex items-center gap-2"><Clock size={15} className="text-cyan-300" /> {fmt(c)} · {c.classDuration}h</p>
                  <p className="flex items-center gap-2"><Users size={15} className="text-cyan-300" /> {c.students.length} student{c.students.length === 1 ? "" : "s"}: <span className="text-gray-300 truncate">{c.students.slice(0, 3).map((s) => s.name).join(", ")}{c.students.length > 3 ? ` +${c.students.length - 3}` : ""}</span></p>
                  {c.substituteFor && <p className="text-gray-300">Substituting for <span className="text-white">{c.substituteFor}</span></p>}
                  {marked > 0 && <p className="text-emerald-300">{present} present · {marked - present} absent</p>}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 text-sm">
                  {c.status !== "cancelled" && <button onClick={() => setAttending(c)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 font-semibold"><CheckCheck size={15} /> {marked ? "Edit attendance" : "Mark attendance"}</button>}
                  {c.status !== "cancelled" && <a href={c.classLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"><ExternalLink size={15} /> Link</a>}
                  {c.status !== "cancelled" && <button onClick={() => setRescheduling(c)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"><RefreshCw size={15} /> Reschedule</button>}
                  {c.status !== "cancelled" && <button onClick={() => cancel(c)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-amber-300 hover:bg-amber-500/15"><XCircle size={15} /> Cancel</button>}
                  <button onClick={() => remove(c)} className="ml-auto p-2 rounded-lg text-rose-300 hover:bg-rose-500/20" aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && <CreateForm backend_url={backend_url} students={students} admins={admins} batches={batches} classNames={classNames} meId={userData?.userId} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
      {attending && <AttendanceModal backend_url={backend_url} extra={attending} onClose={() => setAttending(null)} onSaved={() => { setAttending(null); load(); }} />}
      {rescheduling && <RescheduleModal backend_url={backend_url} extra={rescheduling} onClose={() => setRescheduling(null)} onSaved={() => { setRescheduling(null); load(); }} />}
    </div>
  );
}

function CreateForm({ backend_url, students, admins, batches, classNames, meId, onClose, onSaved }) {
  const [f, setF] = useState({ type: "extra", title: "", topic: "", date: today(), time: "17:00", duration: "1", classLink: "", instructorId: meId || "", substituteFor: "", note: "" });
  const [picked, setPicked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!f.title.trim()) return toast.error("Enter the class name");
    if (!/^https?:\/\//i.test(f.classLink.trim())) return toast.error("Enter the meeting link (starting with https://)");
    if (picked.size === 0) return toast.error("Select at least one student or class");
    setBusy(true);
    try {
      const { data } = await axios.post(`${backend_url}/api/extra-classes`, { ...f, studentIds: [...picked] });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Could not schedule the class"); } finally { setBusy(false); }
  };

  return (
    <Modal wide title="Schedule an extra / substitute class" onClose={busy ? () => {} : onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex gap-2">
          {[["extra", "Extra class"], ["substitute", "Substitute class"]].map(([id, t]) => (
            <button key={id} type="button" onClick={() => setF({ ...f, type: id })} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${f.type === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600 border-transparent" : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"}`}>{t}</button>
          ))}
        </div>
        <div><label className={label}>Class name</label><input list="extra-class-names" className={field} value={f.title} onChange={set("title")} placeholder="e.g. Python Basics" maxLength={120} /><datalist id="extra-class-names">{classNames.map((n) => <option key={n} value={n} />)}</datalist></div>
        <div><label className={label}>Topic (optional)</label><input className={field} value={f.topic} onChange={set("topic")} maxLength={200} placeholder="e.g. Revision of loops" /></div>
        <div><label className={label}>Date</label><input type="date" className={field} value={f.date} min={today()} onChange={set("date")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Time</label><input type="time" className={field} value={f.time} onChange={set("time")} /></div>
          <div><label className={label}>Hours</label><input type="number" min="0.5" max="12" step="0.5" className={field} value={f.duration} onChange={set("duration")} /></div>
        </div>
        <div className="md:col-span-2"><label className={label}>Join link (Meet / Zoom / Teams)</label><input className={field} value={f.classLink} onChange={set("classLink")} placeholder="https://meet.google.com/…" /></div>
        <div>
          <label className={label}>Instructor</label>
          <select className={field} value={f.instructorId} onChange={set("instructorId")}>{admins.map((a) => <option key={a._id} value={a._id} className="text-black">{a.name}</option>)}</select>
        </div>
        {f.type === "substitute" && <div><label className={label}>Substituting for</label><input className={field} value={f.substituteFor} onChange={set("substituteFor")} placeholder="Original teacher or class" maxLength={120} /></div>}
        <div className="md:col-span-2"><label className={label}>Note for students (optional)</label><textarea rows={2} className={field} value={f.note} onChange={set("note")} maxLength={1000} placeholder="Anything they should prepare or know" /></div>
        <div className="md:col-span-2"><p className="text-sm text-gray-200 font-medium mb-2">Who is this class for?</p><TargetPicker students={students} batches={batches} picked={picked} setPicked={setPicked} maxHeight="max-h-52" /></div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
        <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Schedule & notify</button>
      </div>
    </Modal>
  );
}

function AttendanceModal({ backend_url, extra, onClose, onSaved }) {
  const initial = Object.fromEntries((extra.attendance || []).map((a) => [a.studentId, a.status]));
  const [marks, setMarks] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (id, status) => setMarks((m) => ({ ...m, [id]: status }));
  const all = (status) => setMarks(Object.fromEntries(extra.students.map((s) => [s._id, status])));

  const save = async () => {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    if (!records.length) return toast.error("Mark at least one student");
    setBusy(true);
    try { const { data } = await axios.put(`${backend_url}/api/extra-classes/${extra._id}/attendance`, { records }); toast.success(data.message); onSaved(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not save attendance"); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Attendance · ${extra.title}`} onClose={busy ? () => {} : onClose}>
      <p className="text-sm text-gray-300 mb-3">{fmt(extra)}</p>
      <div className="flex gap-2 mb-3">
        <button onClick={() => all("Present")} className="px-3 py-1.5 rounded-lg text-sm bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30">All present</button>
        <button onClick={() => all("Absent")} className="px-3 py-1.5 rounded-lg text-sm bg-rose-500/20 text-rose-200 hover:bg-rose-500/30">All absent</button>
      </div>
      <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {extra.students.map((s) => (
          <li key={s._id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-white">{s.name}</span>
            {["Present", "Absent"].map((st) => (
              <button key={st} onClick={() => set(s._id, st)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${marks[s._id] === st ? (st === "Present" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white") : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>{st}</button>
            ))}
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
        <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Save attendance</button>
      </div>
    </Modal>
  );
}

function RescheduleModal({ backend_url, extra, onClose, onSaved }) {
  const [f, setF] = useState({ date: new Date(extra.classDate).toISOString().slice(0, 10), time: extra.classTime, classLink: extra.classLink });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { const { data } = await axios.put(`${backend_url}/api/extra-classes/${extra._id}`, f); toast.success([data.message, data.emailMessage].filter(Boolean).join(" · ")); onSaved(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not update"); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Reschedule · ${extra.title}`} onClose={busy ? () => {} : onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>Date</label><input type="date" className={field} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div><label className={label}>Time</label><input type="time" className={field} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className={label}>Join link</label><input className={field} value={f.classLink} onChange={(e) => setF({ ...f, classLink: e.target.value })} /></div>
      </div>
      <p className="text-xs text-gray-400 mt-3">If the date, time or link changes, students get an updated card in the chat and an email.</p>
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Close</button>
        <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Save</button>
      </div>
    </Modal>
  );
}
