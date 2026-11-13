import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, Printer } from "lucide-react";
import { AppContent } from "../../context/Context";
import { Modal } from "../questions/questionKit";
import { dayLabel, inr, methodLabel, stampLabel } from "../../utils/money";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// a stand-alone printable page (opens in a new window so the dashboard styling does not get in the way)
export function printReceipt(r) {
  const rows = (r.items || []).map((i) => `<tr><td>${esc(i.className)}</td><td>${esc(dayLabel(i.classDate))}</td><td class="r">${esc(inr(i.amount))}</td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(r.receiptNo)}</title>
<style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:32px}.box{max-width:640px;margin:auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}
.head{background:#4f46e5;color:#fff;padding:22px 26px;display:flex;justify-content:space-between;align-items:center}.head h1{margin:0;font-size:22px}.head small{opacity:.85}
.amount{background:#ecfdf5;padding:20px 26px;border-bottom:1px solid #d1fae5}.amount b{font-size:34px;color:#065f46}.amount span{display:block;color:#047857;font-size:12px;font-weight:700;letter-spacing:.6px}
.pad{padding:20px 26px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#f9fafb;text-align:left;font-size:12px;color:#6b7280;padding:8px 10px}td{padding:9px 10px;border-bottom:1px solid #eef0f4;font-size:14px}.r{text-align:right}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;font-size:13px}.meta div span{color:#6b7280;display:block;font-size:11px}.void{color:#b91c1c;font-weight:700}.foot{padding:14px 26px;background:#f9fafb;color:#6b7280;font-size:12px}
@media print{body{padding:0}.box{border:0}}</style></head><body><div class="box">
<div class="head"><div><h1>ClassWave</h1><small>Payment receipt</small></div><div style="text-align:right"><b>${esc(r.receiptNo)}</b><br><small>${esc(stampLabel(r.createdAt))}</small></div></div>
<div class="amount"><span>${r.status === "voided" ? "CANCELLED RECEIPT" : "PAYMENT RECEIVED"}</span><b>${esc(inr(r.amount))}</b></div>
<div class="pad"><div class="meta"><div><span>Student</span>${esc(r.student?.name)}</div><div><span>Paid by</span>${esc(methodLabel(r.method))}</div>
${r.reference ? `<div><span>Reference</span>${esc(r.reference)}</div>` : ""}<div><span>Received by</span>${esc(r.recordedByName)}</div></div>
<table><tr><th>Class</th><th>Date</th><th class="r">Amount</th></tr>${rows}<tr><td colspan="2"><b>Total</b></td><td class="r"><b>${esc(inr(r.amount))}</b></td></tr></table>
${r.note ? `<p style="font-size:13px;color:#374151">Note: ${esc(r.note)}</p>` : ""}${r.status === "voided" ? `<p class="void">This receipt was cancelled${r.voidReason ? `: ${esc(r.voidReason)}` : ""}.</p>` : ""}</div>
<div class="foot">This is a computer generated receipt.</div></div><script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`;
  const w = window.open("", "_blank", "width=760,height=900");
  if (!w) return toast.error("Allow pop-ups to print the receipt");
  w.document.write(html);
  w.document.close();
}

// The receipt as it appears on screen. `receipt` may be passed in, or loaded by `receiptId`.
export function ReceiptView({ r }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-white text-slate-900">
      <div className="bg-indigo-600 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-lg font-bold leading-tight">ClassWave</p><p className="text-xs text-indigo-100">Payment receipt</p></div>
        <div className="text-right"><p className="font-bold">{r.receiptNo}</p><p className="text-xs text-indigo-100">{stampLabel(r.createdAt)}</p></div>
      </div>
      <div className={`px-5 py-4 border-b ${r.status === "voided" ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
        <p className={`text-xs font-bold tracking-wider ${r.status === "voided" ? "text-rose-700" : "text-emerald-700"}`}>{r.status === "voided" ? "CANCELLED RECEIPT" : "PAYMENT RECEIVED"}</p>
        <p className={`text-3xl font-extrabold ${r.status === "voided" ? "text-rose-800 line-through" : "text-emerald-800"}`}>{inr(r.amount)}</p>
      </div>
      <div className="px-5 py-4 space-y-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-xs text-slate-500">Student</dt><dd className="font-medium break-words">{r.student?.name}</dd></div>
          <div><dt className="text-xs text-slate-500">Paid by</dt><dd className="font-medium">{methodLabel(r.method)}</dd></div>
          {r.reference && <div><dt className="text-xs text-slate-500">Reference</dt><dd className="font-medium break-all">{r.reference}</dd></div>}
          <div><dt className="text-xs text-slate-500">Received by</dt><dd className="font-medium">{r.recordedByName}</dd></div>
        </dl>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-3 py-2">Class</th><th className="text-left px-3 py-2">Date</th><th className="text-right px-3 py-2">Amount</th></tr></thead>
            <tbody>{(r.items || []).map((i) => <tr key={i.classId} className="border-t border-slate-100"><td className="px-3 py-2">{i.className}</td><td className="px-3 py-2 text-slate-500 whitespace-nowrap">{dayLabel(i.classDate)}</td><td className="px-3 py-2 text-right whitespace-nowrap">{inr(i.amount)}</td></tr>)}</tbody>
            <tfoot><tr className="border-t border-slate-200 bg-slate-50 font-bold"><td className="px-3 py-2" colSpan={2}>Total</td><td className="px-3 py-2 text-right text-emerald-700">{inr(r.amount)}</td></tr></tfoot>
          </table>
        </div>
        {r.note && <p className="text-sm text-slate-600"><span className="text-slate-400">Note:</span> {r.note}</p>}
        {r.status === "voided" && <p className="text-sm font-semibold text-rose-700">Cancelled{r.voidReason ? `: ${r.voidReason}` : ""}.</p>}
      </div>
    </div>
  );
}

export default function ReceiptModal({ receiptId, receipt, onClose }) {
  const { backend_url } = useContext(AppContent);
  const [r, setR] = useState(receipt || null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (receipt || !receiptId) return;
    axios.get(`${backend_url}/api/payments/receipt/${receiptId}`).then(({ data }) => setR(data.data)).catch((e) => setError(e.response?.data?.message || "Could not load the receipt"));
  }, [receiptId, receipt, backend_url]);

  return (
    <Modal title={r ? `Receipt ${r.receiptNo}` : "Receipt"} onClose={onClose}>
      {error ? <p className="text-rose-300">{error}</p> : !r ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div> : (
        <div className="space-y-4">
          <ReceiptView r={r} />
          <div className="flex justify-end"><button onClick={() => printReceipt(r)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold"><Printer size={16} /> Print / save as PDF</button></div>
        </div>
      )}
    </Modal>
  );
}
