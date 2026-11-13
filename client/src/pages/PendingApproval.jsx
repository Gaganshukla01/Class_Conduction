import { useContext, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, Clock, Hourglass, LogOut, Mail, RefreshCw, ShieldX } from "lucide-react";
import { AppContent } from "../context/Context";
import AuthShell from "../components/auth/AuthShell";
import { authCard } from "../components/auth/authKit";
import { ROLE_LABEL, dashboardPath, isApproved, statusOf } from "../utils/roles";

// Shown to a signed-in person whose account an admin has not approved yet (or has rejected).
// It checks again every 20 seconds and moves them to their dashboard the moment they are approved.
export default function PendingApproval() {
  const { userData, getUserData, backend_url, isLoggedIn, setIsLoggedin, setUserData, isDataLoading } = useContext(AppContent);
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const wasPending = useRef(false);
  const status = statusOf(userData);

  useEffect(() => { if (status === "pending") wasPending.current = true; }, [status]);

  const check = async (manual = false) => {
    setChecking(true);
    const user = await getUserData();
    setChecking(false);
    if (manual && user && !isApproved(user) && statusOf(user) === "pending") toast.info("Still in review. We will e-mail you as soon as it is approved.");
  };

  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && getUserData(), 20000);
    return () => clearInterval(id);
  }, [getUserData]);

  // approved while this page was open -> welcome + go to the right dashboard
  useEffect(() => {
    if (userData && isApproved(userData)) {
      if (wasPending.current) toast.success(`Your account is approved - welcome, ${ROLE_LABEL[userData.userType] || "friend"}!`);
      navigate(dashboardPath(userData.userType), { replace: true });
    }
  }, [userData, navigate]);

  const logout = async () => {
    try { await axios.post(backend_url + "/api/auth/logout"); } catch { /* ignore */ }
    setIsLoggedin(false); setUserData(false); navigate("/login", { replace: true });
  };

  if (isDataLoading) return <AuthShell><div className={`${authCard} text-center text-gray-300`}>Loading...</div></AuthShell>;
  if (!isLoggedIn || !userData) return <Navigate to="/login" replace />;
  if (isApproved(userData)) return <Navigate to={dashboardPath(userData.userType)} replace />;

  const rejected = status === "rejected";
  const steps = [
    ["Account created", "done"],
    ["E-mail received", "done"],
    ["Admin review", rejected ? "failed" : "current"],
    ["Access granted", "todo"],
  ];

  return (
    <AuthShell wide>
      <div className={authCard}>
        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center ${rejected ? "bg-rose-500/20 text-rose-300" : "bg-amber-400/20 text-amber-300"}`}>
          {rejected ? <ShieldX size={32} /> : <Hourglass size={32} className="animate-pulse" />}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center">{rejected ? "Your request was not approved" : "Your account is in review"}</h1>
        <p className="text-center text-gray-300 mt-2">
          {rejected
            ? "An administrator did not approve this account."
            : <>Thanks, <strong className="text-white">{userData.name}</strong>! An administrator is checking your account. You will get an e-mail the moment it is approved - then you can use ClassWave.</>}
        </p>

        {rejected && userData.rejectedReason && (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100"><strong>Reason:</strong> {userData.rejectedReason}</div>
        )}

        {!rejected && (
          <ol className="mt-6 space-y-3" aria-label="Progress">
            {steps.map(([label, state]) => (
              <li key={label} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${state === "done" ? "bg-emerald-500" : state === "current" ? "bg-amber-400 text-slate-900" : "bg-white/10 text-gray-400"}`}>
                  {state === "done" ? <CheckCircle2 size={16} /> : state === "current" ? <Clock size={15} /> : <span className="w-2 h-2 rounded-full bg-gray-500" />}
                </span>
                <span className={state === "todo" ? "text-gray-400" : "text-white"}>{label}{state === "current" && <span className="ml-2 text-xs text-amber-300">in progress</span>}</span>
              </li>
            ))}
          </ol>
        )}

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 min-w-0"><dt className="text-gray-400 text-xs flex items-center gap-1.5"><Mail size={13} /> E-mail</dt><dd className="font-medium break-all">{userData.email}</dd></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><dt className="text-gray-400 text-xs">Role you asked for</dt><dd className="font-medium">{ROLE_LABEL[userData.requestedRole] || "Student"}</dd></div>
        </dl>
        <p className="text-xs text-gray-400 mt-3">The admin may change the role when approving. This page updates by itself - you can leave it open.</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {!rejected && <button onClick={() => check(true)} disabled={checking} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-600 font-semibold disabled:opacity-60"><RefreshCw size={16} className={checking ? "animate-spin" : ""} /> Check status</button>}
          <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-semibold"><LogOut size={16} /> Log out</button>
        </div>
      </div>
    </AuthShell>
  );
}
