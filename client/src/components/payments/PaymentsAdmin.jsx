import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Banknote, CheckCircle2, Clock, FileText, Loader2, Search, Users, Wallet } from "lucide-react";
import { AppContent } from "../../context/Context";
import { Modal } from "../questions/questionKit";
import Avatar from "../ui/Avatar";
import ReceiptModal from "./ReceiptModal";
import { METHODS, dayLabel, groupByMonth, inr, methodLabel, stampLabel, timeLabel } from "../../utils/money";

const FILTERS = [["all", "All students"], ["dues", "Has dues"], ["clear", "All clear"]];
const input = "w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";

// Payment collection for teachers, managers and admins.
//  * teachers see (and collect for) only their own students and classes
//  * recording a payment issues a numbered receipt and e-mails it to the student and the admins
export default function PaymentsAdmin() {
  const { backend_url, userData } = useContext(AppContent);
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null); // student row
  const isTeacher = userData?.userType === "teacher";

  const load = useCallback(() => axios.get(`${backend_url}/api/payments/summary`).then(({ data: d }) => setData(d.data)).catch((e) => { toast.error(e.response?.data?.message || "Could not load payments"); setData((cur) => cur || { totals: {}, students: [] }); }), [backend_url]);
  useEffect(() => { load(); }, [load]);

  const students = useMemo(() => (data?.students || []).filter((s) =>
    `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase()) &&
    (filter === "all" || (filter === "dues" ? s.pendingAmount > 0 : s.pendingAmount === 0))), [data, q, filter]);

  if (!data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;
  const t = data.totals || {};
  const kpis = [
    ["Pending", inr(t.pendingAmount), `${t.pendingCount || 0} classes not yet paid`, Clock, "from-rose-500 to-orange-500"],
    ["Collected this month", inr(t.collectedThisMonth), "payments recorded", Banknote, "from-emerald-500 to-teal-600"],
    ["Collected in total", inr(t.paidAmount), `${t.paidCount || 0} classes paid`, Wallet, "from-indigo-500 to-violet-600"],
    ["Students with dues", String(t.studentsWithDues || 0), `of ${(data.students || []).length} ${isTeacher ? "of your students" : "students"}`, Users, "from-sky-500 to-blue-600"],
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
        <p className="text-gray-300 text-sm">{isTeacher ? "Collect payments from your students. They and the admins get an e-mail receipt." : "See who owes what and record payments. The student and the admins get an e-mail receipt."}</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpis.map(([label, value, sub, Icon, grad]) => (
          <div key={label} className={`rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br ${grad} shadow-lg min-w-0`}>
            <div className="flex items-center justify-between gap-2"><p className="text-xs sm:text-sm text-white/90 truncate">{label}</p><Icon size={16} className="text-white/80 shrink-0" /></div>
            <p className="text-xl sm:text-3xl font-extrabold mt-1 truncate">{value}</p>
            <p className="text-[11px] sm:text-xs text-white/80 truncate">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${input} pl-9`} placeholder="Search a student…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div role="tablist" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {FILTERS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium ${filter === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>{label}</button>
          ))}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-gray-300">{(data.students || []).length === 0 ? (isTeacher ? "You have no students yet. Students appear here once they are enrolled in a class you teach." : "No students with classes yet.") : "No student matches."}</div>
      ) : (
        <>
          {/* laptop: table */}
          <div className="hidden md:block rounded-2xl border border-white/15 overflow-hidden bg-white/5">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-gray-300 text-xs uppercase tracking-wide">
                <tr><th className="text-left px-4 py-3">Student</th><th className="text-right px-4 py-3">Pending</th><th className="text-right px-4 py-3">Upcoming</th><th className="text-right px-4 py-3">Paid</th><th className="text-left px-4 py-3">Last payment</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {students.map((s) => (
                  <tr key={s.studentId} className="hover:bg-white/5">
                    <td className="px-4 py-3"><div className="flex items-center gap-3 min-w-0"><Avatar name={s.name} src={s.avatar} size={36} id={s.studentId} /><div className="min-w-0"><p className="font-medium truncate">{s.name}</p><p className="text-xs text-gray-400 truncate">{s.email}</p></div></div></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{s.pendingAmount > 0 ? <span className="font-bold text-rose-300">{inr(s.pendingAmount)}</span> : <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 size={14} /> Clear</span>}{s.pendingCount > 0 && <span className="block text-[11px] text-gray-400">{s.pendingCount} class{s.pendingCount === 1 ? "" : "es"}</span>}</td>
                    <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">{inr(s.upcomingAmount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-300 whitespace-nowrap">{inr(s.paidAmount)}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{s.lastPaidAt ? stampLabel(s.lastPaidAt).split(",").slice(0, 2).join(",") : "-"}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setOpen(s)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold text-sm whitespace-nowrap">{s.pendingAmount > 0 ? "Collect" : "Open"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* phone / tablet: cards */}
          <ul className="md:hidden space-y-3">
            {students.map((s) => (
              <li key={s.studentId} className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <div className="flex items-center gap-3"><Avatar name={s.name} src={s.avatar} size={44} id={s.studentId} /><div className="min-w-0 flex-1"><p className="font-semibold truncate">{s.name}</p><p className="text-xs text-gray-400 truncate">{s.email}</p></div></div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="rounded-xl bg-black/20 py-2"><p className="text-[10px] text-gray-400">Pending</p><p className={`font-bold text-sm ${s.pendingAmount > 0 ? "text-rose-300" : "text-emerald-300"}`}>{s.pendingAmount > 0 ? inr(s.pendingAmount) : "Clear"}</p></div>
                  <div className="rounded-xl bg-black/20 py-2"><p className="text-[10px] text-gray-400">Upcoming</p><p className="font-bold text-sm text-gray-200">{inr(s.upcomingAmount)}</p></div>
                  <div className="rounded-xl bg-black/20 py-2"><p className="text-[10px] text-gray-400">Paid</p><p className="font-bold text-sm text-emerald-300">{inr(s.paidAmount)}</p></div>
                </div>
                <button onClick={() => setOpen(s)} className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold">{s.pendingAmount > 0 ? "Collect payment" : "Open"}</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && <StudentPayments row={open} backend_url={backend_url} canVoid={!isTeacher} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

// One student: pick the classes that were paid for, record the payment, see receipts.
function StudentPayments({ row, backend_url, canVoid, onClose, onChanged }) {
  const [ledger, setLedger] = useState(null);
  const [tab, setTab] = useState("collect");
  const [picked, setPicked] = useState(new Set());
  const [withUpcoming, setWithUpcoming] = useState(false);
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // the receipt that was just created
  const [receipt, setReceipt] = useState(null);

  const load = useCallback(() => axios.get(`${backend_url}/api/payments/student/${row.studentId}`).then(({ data }) => setLedger(data.data)).catch((e) => { toast.error(e.response?.data?.message || "Could not load"); setLedger({ totals: {}, classes: [], receipts: [] }); }), [backend_url, row.studentId]);
  useEffect(() => { load(); }, [load]);

  const unpaid = useMemo(() => (ledger?.classes || []).filter((c) => !c.paid && (c.held || withUpcoming)), [ledger, withUpcoming]);
  const total = unpaid.filter((c) => picked.has(c.classId)).reduce((n, c) => n + c.amount, 0);
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPicked = unpaid.length > 0 && unpaid.every((c) => picked.has(c.classId));

  const record = async () => {
    if (picked.size === 0) return toast.error("Tick the classes that were paid for");
    setBusy(true);
    try {
      const { data } = await axios.post(`${backend_url}/api/payments/record`, { studentId: row.studentId, classIds: [...picked].filter((id) => unpaid.some((c) => c.classId === id)), method, reference, note });
      toast.success([data.message, data.emailMessage].filter(Boolean).join(" · "));
      setDone(data.data); setPicked(new Set()); setReference(""); setNote("");
      await load(); onChanged();
    } catch (e) { toast.error(e.response?.data?.message || "Could not record the payment"); } finally { setBusy(false); }
  };

  const voidReceipt = async (r) => {
    const reason = window.prompt(`Cancel receipt ${r.receiptNo} (${inr(r.amount)})?\n\nThe classes become unpaid again and the student and admins are told.\nReason (optional):`);
    if (reason === null) return;
    try { const { data } = await axios.post(`${backend_url}/api/payments/${r._id}/void`, { reason }); toast.success(data.message); await load(); onChanged(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not cancel the receipt"); }
  };

  const t = ledger?.totals || {};
  return (
    <Modal wide title={<span className="flex items-center gap-3 min-w-0"><Avatar name={row.name} src={row.avatar} size={30} id={row.studentId} /><span className="truncate">{row.name}</span></span>} onClose={busy ? () => {} : onClose}>
      {!ledger ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/20 py-2.5"><p className="text-[11px] text-rose-200">Pending</p><p className="font-bold text-rose-100">{inr(t.pendingAmount)}</p></div>
            <div className="rounded-xl bg-indigo-500/15 border border-indigo-400/20 py-2.5"><p className="text-[11px] text-indigo-200">Upcoming</p><p className="font-bold text-indigo-100">{inr(t.upcomingAmount)}</p></div>
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/20 py-2.5"><p className="text-[11px] text-emerald-200">Paid</p><p className="font-bold text-emerald-100">{inr(t.paidAmount)}</p></div>
          </div>

          <div role="tablist" className="flex gap-1.5">
            {[["collect", "Collect payment"], ["receipts", `Receipts (${ledger.receipts.length})`]].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>{label}</button>
            ))}
          </div>

          {tab === "collect" && (
            <>
              {done && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex flex-wrap items-center gap-3">
                  <CheckCircle2 className="text-emerald-300 shrink-0" />
                  <div className="min-w-0 flex-1"><p className="font-semibold text-emerald-100">{inr(done.amount)} recorded · {done.receiptNo}</p><p className="text-xs text-emerald-200/80">Receipt e-mailed to the student and the admins.</p></div>
                  <button onClick={() => setReceipt(done._id)} className="px-4 py-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-sm font-semibold">View receipt</button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer select-none"><input type="checkbox" className="w-4 h-4 accent-cyan-400" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(unpaid.map((c) => c.classId)))} /> Select all ({unpaid.length})</label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none"><input type="checkbox" className="w-4 h-4 accent-cyan-400" checked={withUpcoming} onChange={(e) => setWithUpcoming(e.target.checked)} /> Also show upcoming classes (paying ahead)</label>
              </div>

              {unpaid.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-gray-300"><CheckCircle2 className="mx-auto mb-2 text-emerald-300" size={30} />Nothing is pending for {row.name}.</div>
              ) : (
                <div className="max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-white/15 divide-y divide-white/10">
                  {groupByMonth(unpaid).map((g) => (
                    <div key={g.label}>
                      <p className="sticky top-0 bg-slate-800/95 backdrop-blur px-4 py-1.5 text-xs font-semibold text-gray-300">{g.label}</p>
                      {g.items.map((c) => (
                        <label key={c.classId} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 ${picked.has(c.classId) ? "bg-cyan-500/10" : ""}`}>
                          <input type="checkbox" className="w-4 h-4 accent-cyan-400 shrink-0" checked={picked.has(c.classId)} onChange={() => toggle(c.classId)} />
                          <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate">{c.className}</span><span className="block text-xs text-gray-400">{dayLabel(c.classDate, { weekday: "short", day: "numeric", month: "short" })} · {timeLabel(c.classTime)}{!c.held && <span className="ml-1.5 text-indigo-300">upcoming</span>}</span></span>
                          <span className="font-semibold text-sm shrink-0">{inr(c.amount)}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="block text-xs text-gray-300 mb-1">Paid by</label><select className={input} value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map(([id, label]) => <option key={id} value={id} className="text-black">{label}</option>)}</select></div>
                <div><label className="block text-xs text-gray-300 mb-1">Reference (optional)</label><input className={input} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UPI / cheque / transaction no." maxLength={120} /></div>
                <div className="sm:col-span-2"><label className="block text-xs text-gray-300 mb-1">Note (optional)</label><input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shown on the receipt" maxLength={500} /></div>
              </div>

              <div className="sticky bottom-0 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 bg-slate-900/95 backdrop-blur border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs text-gray-400">{picked.size} class{picked.size === 1 ? "" : "es"} selected</p><p className="text-2xl font-extrabold">{inr(total)}</p></div>
                <button onClick={record} disabled={busy || picked.size === 0} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-50">{busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Mark as paid &amp; send receipt</button>
              </div>
            </>
          )}

          {tab === "receipts" && (
            ledger.receipts.length === 0 ? <p className="text-center text-gray-300 py-8">No receipts yet.</p> : (
              <ul className="space-y-2">
                {ledger.receipts.map((r) => (
                  <li key={r._id} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 flex flex-wrap items-center gap-3">
                    <FileText className="text-emerald-300 shrink-0" size={20} />
                    <div className="min-w-0 flex-1"><p className="font-semibold">{r.receiptNo}{r.status === "voided" && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">Cancelled</span>}</p><p className="text-xs text-gray-400">{stampLabel(r.createdAt)} · {methodLabel(r.method)} · by {r.recordedByName}</p></div>
                    <span className={`font-bold ${r.status === "voided" ? "line-through text-gray-400" : "text-emerald-300"}`}>{inr(r.amount)}</span>
                    <button onClick={() => setReceipt(r._id)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm">View</button>
                    {canVoid && r.status !== "voided" && <button onClick={() => voidReceipt(r)} className="px-3 py-1.5 rounded-lg text-rose-300 hover:bg-rose-500/15 text-sm">Cancel</button>}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}
      {receipt && <ReceiptModal receiptId={receipt} onClose={() => setReceipt(null)} />}
    </Modal>
  );
}
