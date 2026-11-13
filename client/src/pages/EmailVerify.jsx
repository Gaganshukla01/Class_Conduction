import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MailCheck } from "lucide-react";
import { AppContent } from "../context/Context";
import AuthShell from "../components/auth/AuthShell";
import OtpInput from "../components/auth/OtpInput";
import { PrimaryButton, authCard } from "../components/auth/authKit";
import { dashboardPath, isApproved } from "../utils/roles";

const ok = (d) => d?.sucess ?? d?.success;

// Verify your e-mail with the 6-digit code that was just sent.
export default function EmailVerify() {
  axios.defaults.withCredentials = true;
  const { backend_url, userData, isLoggedIn, getUserData } = useContext(AppContent);
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60); // the code was just sent from the menu
  const lock = useRef(false);

  const home = () => navigate(userData && isApproved(userData) ? dashboardPath(userData.userType) : userData ? "/pending" : "/", { replace: true });

  // already verified -> nothing to do here
  useEffect(() => { if (isLoggedIn && userData?.isAccountVerifed) home(); }, [isLoggedIn, userData]); // eslint-disable-line
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true; setLoading(true);
    try { await fn(); } catch (e) { toast.error(e.response?.data?.message || e.message); } finally { lock.current = false; setLoading(false); }
  };

  const verify = (e, code = otp) => {
    e?.preventDefault();
    if (code.length !== 6) return toast.error("Enter all 6 digits");
    return run(async () => {
      const { data } = await axios.post(backend_url + "/api/auth/verifyemail", { otp: code });
      if (ok(data)) { toast.success("E-mail verified!"); await getUserData(); home(); }
      else { toast.error(data.message || "That code is not right"); setOtp(""); }
    });
  };

  const resend = () => run(async () => {
    const { data } = await axios.post(backend_url + "/api/auth/sendverifyOtp");
    if (!ok(data)) return toast.error(data.message);
    if (data.alreadyVerified) { await getUserData(); return home(); }
    setCooldown(data.retryAfter || 60);
    toast[data.alreadySent ? "info" : "success"](data.alreadySent ? "A code was already sent. Check your inbox (and Spam)." : "A new code was sent");
  });

  return (
    <AuthShell>
      <div className={authCard}>
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center"><MailCheck size={28} /></div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center">Verify your e-mail</h2>
        <p className="text-center text-sm text-gray-300 mt-1 mb-6">Enter the 6-digit code we sent{userData?.email ? <> to <strong className="text-white break-all">{userData.email}</strong></> : " to your e-mail"}.</p>
        <form onSubmit={verify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} onComplete={(code) => verify(null, code)} disabled={loading} />
          <PrimaryButton type="submit" loading={loading} disabled={otp.length !== 6}>{loading ? "Checking..." : "Verify e-mail"}</PrimaryButton>
        </form>
        <p className="text-center text-sm text-gray-300 mt-5">
          Did not get it?{" "}
          {cooldown > 0 ? <span className="text-gray-400">Resend in {cooldown}s</span> : <button type="button" onClick={resend} disabled={loading} className="font-semibold text-indigo-300 hover:text-white hover:underline disabled:opacity-50">Send a new code</button>}
        </p>
        <button type="button" onClick={home} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-white hover:underline">Skip for now</button>
      </div>
    </AuthShell>
  );
}
