import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, Clock, FileText, Info, Loader2, Receipt, Wallet } from "lucide-react";
import { AppContent } from "../../context/Context";
import ReceiptModal from "./ReceiptModal";
import { dayLabel, groupByMonth, inr, methodLabel, stampLabel, timeLabel } from "../../utils/money";

const TABS = [
  ["due", "Due now"],
  ["upcoming", "Upcoming"],
  ["paid", "Paid"],
  ["receipts", "Receipts"],
];

// The student's payments page: what is due, what is paid, and every receipt.
export default function PaymentsStudent() {
  const { backend_url } = useContext(AppContent);
  const [ledger, setLedger] = useState(null);
  const [tab, setTab] = useState("due");
  const [openReceipt, setOpenReceipt] = useState(null);

  useEffect(() => {
    let alive = true;
    axios.get(`${backend_url}/api/payments/mine`).then(({ data }) => alive && setLedger(data.data)).catch((e) => { toast.error(e.response?.data?.message || "Could not load your payments"); alive && setLedger({ totals: {}, classes: [], receipts: [] }); });
    return () => { alive = false; };
  }, [backend_url]);

  const lists = useMemo(() => {
    const classes = ledger?.classes || [];
    return {
      due: classes.filter((c) => c.held && !c.paid),
      upcoming: classes.filter((c) => !c.held && !c.paid),
      paid: classes.filter((c) => c.paid),
      receipts: ledger?.receipts || [],
    };
  }, [ledger]);
  const receiptBy = useMemo(() => new Map(lists.receipts.map((r) => [String(r._id), r])), [lists.receipts]);

  if (!ledger) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;
  const t = ledger.totals || {};

  const kpis = [
    ["Due now", inr(t.pendingAmount), `${t.pendingCount || 0} class${t.pendingCount === 1 ? "" : "es"}`, Clock, t.pendingAmount > 0 ? "from-rose-500 to-orange-500" : "from-slate-500 to-slate-600"],
    ["Paid so far", inr(t.paidAmount), `${t.paidCount || 0} class${t.paidCount === 1 ? "" : "es"}`, CheckCircle2, "from-emerald-500 to-teal-600"],
    ["Upcoming", inr(t.upcomingAmount), `${t.upcomingCount || 0} class${t.upcomingCount === 1 ? "" : "es"} ahead`, Wallet, "from-indigo-500 to-violet-600"],
  ];

  const ClassRow = ({ c }) => (
    <li className="flex items-center gap-3 px-3 sm:px-4 py-3">
      <div className="w-12 shrink-0 text-center rounded-xl bg-white/10 py-1.5">
        <p className="text-lg font-bold leading-none">{new Date(c.classDate).getUTCDate()}</p>
        <p className="text-[10px] uppercase text-gray-300">{dayLabel(c.classDate, { month: "short" })}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{c.className}</p>
        <p className="text-xs text-gray-400">{dayLabel(c.classDate, { weekday: "short" })} · {timeLabel(c.classTime)} · {c.duration}h{c.paid && c.paidAt ? ` · paid ${dayLabel(c.paidAt, { day: "numeric", month: "short" })}` : ""}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold">{inr(c.amount)}</p>
        {c.paid
          ? receiptBy.get(c.paymentId) ? <button onClick={() => setOpenReceipt(receiptBy.get(c.paymentId))} className="text-[11px] text-cyan-300 hover:underline">Receipt</button> : <span className="text-[11px] text-emerald-300">Paid</span>
          : <span className={`text-[11px] ${c.held ? "text-rose-300" : "text-gray-400"}`}>{c.held ? "Due" : "Upcoming"}</span>}
      </div>
    </li>
  );

  const list = lists[tab];
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map(([label, value, sub, Icon, grad]) => (
          <div key={label} className={`rounded-2xl p-4 bg-gradient-to-br ${grad} shadow-lg`}>
            <div className="flex items-center justify-between"><p className="text-sm text-white/85">{label}</p><Icon size={18} className="text-white/80" /></div>
            <p className="text-3xl font-extrabold mt-1">{value}</p>
            <p className="text-xs text-white/80">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-gray-200">
        <Info size={18} className="shrink-0 mt-0.5 text-cyan-300" />
        <p>Your teacher records each payment. When they do, you get an <strong>e-mail receipt</strong> and the classes move to <strong>Paid</strong> here.</p>
      </div>

      <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
            {label} <span className="opacity-80">({lists[id].length})</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-gray-300">
          {tab === "due" ? <><CheckCircle2 className="mx-auto mb-2 text-emerald-300" size={34} /><p className="font-medium text-white">You are all clear!</p><p className="text-sm">Nothing is due right now.</p></>
            : tab === "receipts" ? <><Receipt className="mx-auto mb-2 text-gray-400" size={34} /><p>No receipts yet.</p></>
            : <p>Nothing here yet.</p>}
        </div>
      ) : tab === "receipts" ? (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r._id}>
              <button onClick={() => setOpenReceipt(r)} className="w-full flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-3 text-left transition">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center"><FileText size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.receiptNo}{r.status === "voided" && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">Cancelled</span>}</span>
                  <span className="block text-xs text-gray-400">{stampLabel(r.createdAt)} · {methodLabel(r.method)} · {(r.items || []).length} class{(r.items || []).length === 1 ? "" : "es"}</span>
                </span>
                <span className={`font-bold ${r.status === "voided" ? "line-through text-gray-400" : "text-emerald-300"}`}>{inr(r.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          {groupByMonth(list).map((g) => (
            <section key={g.label}>
              <div className="flex items-center justify-between px-1 mb-1.5"><h3 className="text-sm font-semibold text-gray-200">{g.label}</h3><span className="text-xs text-gray-400">{inr(g.items.reduce((n, c) => n + c.amount, 0))}</span></div>
              <ul className="rounded-2xl bg-white/10 border border-white/15 divide-y divide-white/10 overflow-hidden">{g.items.map((c) => <ClassRow key={c.classId} c={c} />)}</ul>
            </section>
          ))}
        </div>
      )}

      {openReceipt && <ReceiptModal receiptId={openReceipt._id} onClose={() => setOpenReceipt(null)} />}
    </div>
  );
}
