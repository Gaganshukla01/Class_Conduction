import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Briefcase, CheckCircle2, GraduationCap, Inbox, Loader2, MailCheck, Presentation, RefreshCw, XCircle } from "lucide-react";
import { AppContent } from "../context/Context";
import Avatar from "./ui/Avatar";
import { ROLE_LABEL } from "../utils/roles";

const ROLES = [["student", GraduationCap], ["teacher", Presentation], ["manager", Briefcase]];

const ago = (d) => {
  if (!d) return "";
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} day${Math.round(s / 86400) === 1 ? "" : "s"} ago`;
};

// Admin: new accounts wait here. Choose the role and approve, or reject.
// The person is e-mailed either way, and sees "in review" until you decide.
export default function AccountApprovals({ onChanged }) {
  const { backend_url, getAllUserData } = useContext(AppContent);
  const [status, setStatus] = useState("pending");
  const [list, setList] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, rejected: 0 });
  const [roleFor, setRoleFor] = useState({}); // id -> chosen role
  const [rejecting, setRejecting] = useState(null); // id
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/user/accounts`, { params: { status } });
      setList(data.data); setCounts(data.counts);
      onChanged?.(data.counts.pending);
    } catch (e) { toast.error(e.response?.data?.message || "Could not load the requests"); setList((c) => c || []); }
  }, [backend_url, status, onChanged]);

  useEffect(() => { setList(null); load(); }, [load]);
  useEffect(() => { const id = setInterval(() => document.visibilityState === "visible" && load(), 30000); return () => clearInterval(id); }, [load]);

  const approve = async (a) => {
    const role = roleFor[a._id] || a.requestedRole;
    setBusy(a._id);
    try {
      const { data } = await axios.put(`${backend_url}/api/user/accounts/${a._id}/approve`, { role });
      toast.success(data.message);
      await load(); getAllUserData?.();
    } catch (e) { toast.error(e.response?.data?.message || "Could not approve"); } finally { setBusy(null); }
  };

  const reject = async (a) => {
    setBusy(a._id);
    try {
      const { data } = await axios.put(`${backend_url}/api/user/accounts/${a._id}/reject`, { reason });
      toast.success(data.message);
      setRejecting(null); setReason(""); await load();
    } catch (e) { toast.error(e.response?.data?.message || "Could not reject"); } finally { setBusy(null); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Account approvals</h1>
          <p className="text-sm text-gray-300">New sign-ups wait here. Pick the role (student, teacher or manager) and approve - they get an e-mail and can start right away.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"><RefreshCw size={15} /> Refresh</button>
      </div>

      <div role="tablist" className="flex gap-1.5">
        {[["pending", `Pending (${counts.pending})`], ["rejected", `Rejected (${counts.rejected})`]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={status === id} onClick={() => setStatus(id)} className={`px-4 py-2 rounded-xl text-sm font-medium ${status === id ? "bg-gradient-to-r from-emerald-500 to-cyan-600" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>{label}</button>
        ))}
      </div>

      {list === null ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={30} /></div>
        : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-gray-300"><Inbox className="mx-auto mb-3 text-gray-400" size={38} /><p className="font-medium text-white">{status === "pending" ? "No one is waiting" : "No rejected requests"}</p><p className="text-sm">{status === "pending" ? "New sign-ups will appear here." : ""}</p></div>
        ) : (
          <ul className="space-y-3">
            {list.map((a) => {
              const chosen = roleFor[a._id] || a.requestedRole;
              return (
                <li key={a._id} className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={a.name} src={a.avatar} size={46} id={a._id} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-lg leading-tight break-words">{a.name}</p>
                      <p className="text-sm text-gray-300 break-all">{a.email}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                        <span>Registered {ago(a.registeredAt)}</span>
                        {a.isAccountVerified && <span className="inline-flex items-center gap-1 text-emerald-300"><MailCheck size={12} /> e-mail verified</span>}
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200">Asked for: {ROLE_LABEL[a.requestedRole]}</span>
                      </div>
                      {a.rejectedReason && <p className="text-xs text-rose-300 mt-1.5">Reason given: {a.rejectedReason}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-gray-300 mb-1.5">Approve as</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map(([id, Icon]) => (
                        <button key={id} type="button" onClick={() => setRoleFor((r) => ({ ...r, [a._id]: id }))} aria-pressed={chosen === id}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition ${chosen === id ? "border-cyan-400 bg-cyan-400/15 text-white" : "border-white/15 bg-white/5 text-gray-300 hover:bg-white/10"}`}>
                          <Icon size={16} /> {ROLE_LABEL[id]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {rejecting === a._id ? (
                    <div className="mt-4 space-y-2">
                      <label className="block text-xs text-gray-300">Reason (shown to the person, optional)</label>
                      <textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-rose-400" placeholder="e.g. We could not find you in our student list" />
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => { setRejecting(null); setReason(""); }} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm">Cancel</button>
                        <button onClick={() => reject(a)} disabled={busy === a._id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold disabled:opacity-60">{busy === a._id ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Reject &amp; notify</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      {status === "pending" && <button onClick={() => setRejecting(a._id)} className="px-5 py-2.5 rounded-xl text-rose-300 hover:bg-rose-500/15 font-medium">Reject</button>}
                      <button onClick={() => approve(a)} disabled={busy === a._id} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">{busy === a._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve as {ROLE_LABEL[chosen]}</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}
