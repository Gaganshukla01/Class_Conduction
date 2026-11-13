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
export { CreateForm };
export default function ExtraClassesAdmin() {
  const { backend_url, allUserData, allSchedule, userData, getAllSchedule } = useContext(AppContent);
  const [list, setList] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [creating, setCreating] = useState(false);
  const [attending, setAttending] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [classAttendance, setClassAttendance] = useState(null);
  // a substitute changes a scheduled class, so the rest of the app must see the new details too
  const reload = () => { load(); getAllSchedule?.(); };

  const users = allUserData?.data || [];
  const students = useMemo(() => users.filter((u) => u.userType === "student"), [users]);
  const admins = useMemo(() => users.filter((u) => u.userType === "admin" || u.userType === "teacher"), [users]);
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
    const msg = c.type === "substitute"
      ? `Cancel this substitute class?\n\nThe scheduled ${c.original?.className || c.title} class goes back to its ORIGINAL date and time (${fmt(c.original)}), and students are told in chat and by e-mail.`
      : `Cancel “${c.title}”? Students will be notified in chat and by email.`;
    if (!window.confirm(msg)) return;
    try { const { data } = await axios.put(`${backend_url}/api/extra-classes/${c._id}`, { status: "cancelled" }); toast.success([data.message, data.emailMessage].filter(Boolean).join(" · ")); reload(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not cancel"); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete “${c.title}” and its attendance?`)) return;
    try { await axios.delete(`${backend_url}/api/extra-classes/${c._id}`); toast.success("Deleted"); reload(); } catch (e) { toast.error(e.response?.data?.message || "Could not delete"); }
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
            const sub = c.type === "substitute";
            const marked = c.attendance?.length || 0;
            const present = (c.attendance || []).filter((a) => a.status === "Present").length;
            const classMarked = sub && c.scheduledClass?.attendanceMarkedAt;
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
                  {sub && c.original?.classDate && <p className="text-amber-200 bg-amber-500/10 border border-amber-400/25 rounded-lg px-2.5 py-1.5"><RefreshCw size={13} className="inline mr-1.5 -mt-0.5" />Replaces <strong>{c.original.className || c.title}</strong> on {fmt(c.original)}</p>}
                  {marked > 0 && <p className="text-emerald-300">{present} present · {marked - present} absent</p>}
                  {classMarked && <p className={c.scheduledClass.attendance === "Present" ? "text-emerald-300" : "text-rose-300"}>Attendance: {c.scheduledClass.attendance}</p>}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 text-sm">
                  {c.status !== "cancelled" && <button onClick={() => (sub ? setClassAttendance(c) : setAttending(c))} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 font-semibold"><CheckCheck size={15} /> {marked || classMarked ? "Edit attendance" : "Mark attendance"}</button>}
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

      {creating && <CreateForm backend_url={backend_url} students={students} admins={admins} batches={batches} classNames={classNames} meId={userData?.userId} isTeacher={userData?.userType === "teacher"} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
      {attending && <AttendanceModal backend_url={backend_url} extra={attending} onClose={() => setAttending(null)} onSaved={() => { setAttending(null); load(); }} />}
      {classAttendance && <ClassAttendanceModal backend_url={backend_url} extra={classAttendance} onClose={() => setClassAttendance(null)} onSaved={() => { setClassAttendance(null); reload(); }} />}
      {rescheduling && <RescheduleModal backend_url={backend_url} extra={rescheduling} onClose={() => setRescheduling(null)} onSaved={() => { setRescheduling(null); reload(); }} />}
    </div>
  );
}

function CreateForm({ backend_url, students, admins, batches, classNames, meId, onClose, onSaved, initialType = "extra", isTeacher = false }) {
  const [f, setF] = useState({ type: initialType, title: "", topic: "", date: today(), time: "17:00", duration: "1", classLink: "", instructorId: meId || "", substituteFor: "", note: "" });
  const [picked, setPicked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState(null); // scheduled classes the picked students share
  const [sessionId, setSessionId] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const sub = f.type === "substitute";
  const session = sessions?.find((c) => c._id === sessionId);
  const pickedKey = [...picked].sort().join(",");

  // Substitute: once students are chosen, load THEIR upcoming scheduled classes
  useEffect(() => {
    setSessionId("");
    if (!sub || picked.size === 0) { setSessions(null); return undefined; }
    let alive = true;
    setSessions(null);
    axios.get(`${backend_url}/api/extra-classes/replaceable`, { params: { studentIds: pickedKey } })
      .then((r) => alive && setSessions(r.data.data))
      .catch(() => alive && setSessions([]));
    return () => { alive = false; };
  }, [sub, pickedKey, backend_url]); // eslint-disable-line

  // choosing the class to replace pre-fills the form with its details
  const chooseSession = (id) => {
    setSessionId(id);
    const c = sessions?.find((x) => x._id === id);
    if (!c) return;
    setF((p) => ({ ...p, title: c.className, duration: String(c.classDuration || p.duration), classLink: p.classLink || c.classLink || "", instructorId: admins.some((a) => a._id === c.instructorId) ? c.instructorId : p.instructorId }));
  };

  const save = async () => {
    if (sub && !sessionId) return toast.error("Choose which scheduled class this substitute replaces");
    if (!sub && !f.title.trim()) return toast.error("Enter the class name");
    if (!/^https?:\/\//i.test(f.classLink.trim())) return toast.error("Enter the meeting link (starting with https://)");
    if (picked.size === 0) return toast.error("Select at least one student or class");
    setBusy(true);
    try {
      const { data } = await axios.post(`${backend_url}/api/extra-classes`, { ...f, studentIds: [...picked], ...(sub ? { replacesClassId: sessionId } : {}) });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Could not schedule the class"); } finally { setBusy(false); }
  };

  const others = session ? session.students.filter((s) => !picked.has(s._id)) : [];
  const picker = (
    <div className="md:col-span-2">
      <p className="text-sm text-gray-200 font-medium mb-2">{sub ? "Which student(s) is the class for?" : "Who is this class for?"}</p>
      <TargetPicker students={students} batches={batches} picked={picked} setPicked={setPicked} maxHeight="max-h-52" />
    </div>
  );

  return (
    <Modal wide title={sub ? "Schedule a substitute class" : "Schedule an extra class"} onClose={busy ? () => {} : onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex gap-2">
          {[["extra", "Extra class"], ["substitute", "Substitute class"]].map(([id, t]) => (
            <button key={id} type="button" onClick={() => setF({ ...f, type: id })} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${f.type === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600 border-transparent" : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"}`}>{t}</button>
          ))}
        </div>

        {sub && <>
          {picker}
          <div className="md:col-span-2">
            <label className={label}>Which scheduled class is being replaced?</label>
            {picked.size === 0 ? <p className="text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl px-4 py-3">Select the student(s) above first - their upcoming scheduled classes will appear here.</p>
              : sessions === null ? <p className="text-sm text-gray-400 px-1">Loading their scheduled classes…</p>
              : sessions.length === 0 ? <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-400/25 rounded-xl px-4 py-3">No upcoming scheduled class found for {picked.size > 1 ? "all of these students together" : "this student"}. A class whose attendance is already marked, or that was already replaced, is not listed.</p>
              : (
                <select className={field} value={sessionId} onChange={(e) => chooseSession(e.target.value)}>
                  <option value="" className="text-black">Select the class that will be replaced…</option>
                  {sessions.map((c) => <option key={c._id} value={c._id} className="text-black">{c.className} · {fmt(c)} · {c.students.map((s) => s.name).join(", ")}</option>)}
                </select>
              )}
          </div>
          {session && (
            <div className="md:col-span-2 rounded-xl bg-amber-500/10 border border-amber-400/30 p-4 text-sm text-amber-50 space-y-1.5">
              <p><strong>{session.className}</strong> is currently on <strong>{fmt(session)}</strong> ({session.classDuration}h). It will be <strong>moved to the new date, time and link below</strong>, so you mark its attendance the usual way.</p>
              <p className="text-amber-100/80">The students get a message in their private chat and an e-mail saying which class was replaced. You can cancel the substitute later to put the class back.</p>
              {others.length > 0 && <p className="text-rose-200">⚠ This class is shared with <strong>{others.map((s) => s.name).join(", ")}</strong> - they will be moved and notified too.</p>}
            </div>
          )}
        </>}

        {!sub && <>
          <div><label className={label}>Class name</label><input list="extra-class-names" className={field} value={f.title} onChange={set("title")} placeholder="e.g. Python Basics" maxLength={120} /><datalist id="extra-class-names">{classNames.map((n) => <option key={n} value={n} />)}</datalist></div>
          <div><label className={label}>Topic (optional)</label><input className={field} value={f.topic} onChange={set("topic")} maxLength={200} placeholder="e.g. Revision of loops" /></div>
        </>}
        {sub && <div className="md:col-span-2"><label className={label}>Topic (optional)</label><input className={field} value={f.topic} onChange={set("topic")} maxLength={200} placeholder="What will be covered" /></div>}

        <div><label className={label}>{sub ? "New date" : "Date"}</label><input type="date" className={field} value={f.date} min={today()} onChange={set("date")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>{sub ? "New time" : "Time"}</label><input type="time" className={field} value={f.time} onChange={set("time")} /></div>
          <div><label className={label}>Hours</label><input type="number" min="0.5" max="12" step="0.5" className={field} value={f.duration} onChange={set("duration")} /></div>
        </div>
        <div className="md:col-span-2"><label className={label}>{sub ? "New join link (Meet / Zoom / Teams)" : "Join link (Meet / Zoom / Teams)"}</label><input className={field} value={f.classLink} onChange={set("classLink")} placeholder="https://meet.google.com/…" /></div>
        <div>
          <label className={label}>{sub ? "Teacher taking the substitute class" : "Instructor"}</label>
          {isTeacher
            ? <input className={`${field} opacity-80`} value="You" disabled readOnly />
            : <select className={field} value={f.instructorId} onChange={set("instructorId")}>{admins.map((a) => <option key={a._id} value={a._id} className="text-black">{a.name} ({a.userType === "admin" ? "Admin" : "Teacher"})</option>)}</select>}
        </div>
        {sub && <div><label className={label}>Original teacher (optional)</label><input className={field} value={f.substituteFor} onChange={set("substituteFor")} placeholder="Who is being substituted" maxLength={120} /></div>}
        <div className="md:col-span-2"><label className={label}>Note for students (optional)</label><textarea rows={2} className={field} value={f.note} onChange={set("note")} maxLength={1000} placeholder="Anything they should prepare or know" /></div>
        {!sub && picker}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
        <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} {sub ? "Replace class & notify" : "Schedule & notify"}</button>
      </div>
    </Modal>
  );
}

// Attendance for a SUBSTITUTE: it is marked on the scheduled class that was replaced (the same
// record the normal Class Attendance screen uses).
function ClassAttendanceModal({ backend_url, extra, onClose, onSaved }) {
  const doc = extra.scheduledClass || {};
  const [status, setStatus] = useState(doc.attendanceMarkedAt ? doc.attendance : "Present");
  const [topic, setTopic] = useState(doc.topicCovered || extra.topic || "");
  const [notes, setNotes] = useState(doc.notes || "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const { data } = await axios.put(`${backend_url}/api/classschedule/markattendence`, { id: extra.replacesClassId, attendance: status, topicCovered: topic, notes });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Could not save attendance"); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Attendance · ${extra.title}`} onClose={busy ? () => {} : onClose}>
      <p className="text-sm text-gray-300 mb-1">{fmt(extra)} · {extra.students.map((s) => s.name).join(", ")}</p>
      <p className="text-xs text-amber-200 mb-4">This is the scheduled class that the substitute replaced, so it also shows up in Class Attendance and in the students' attendance.</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {["Present", "Absent"].map((st) => (
          <button key={st} onClick={() => setStatus(st)} className={`py-3 rounded-xl font-semibold border transition ${status === st ? (st === "Present" ? "bg-emerald-500 border-emerald-400" : "bg-rose-500 border-rose-400") : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"}`}>{st}</button>
        ))}
      </div>
      <label className={label}>Topic covered (optional)</label>
      <input className={`${field} mb-3`} value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} />
      <label className={label}>Notes for the students (optional)</label>
      <textarea rows={2} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20">Cancel</button>
        <button onClick={save} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Save attendance (students get an e-mail)</button>
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
