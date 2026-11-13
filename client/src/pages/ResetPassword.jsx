import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { AppContent } from "../context/Context";
import AuthShell from "../components/auth/AuthShell";
import OtpInput from "../components/auth/OtpInput";
import { Field, PrimaryButton, authCard, authInput } from "../components/auth/authKit";

const STEPS = ["E-mail", "Code", "New password"];
const ok = (d) => d?.sucess ?? d?.success;

// Forgot password in three clear steps: e-mail -> 6-digit code -> new password.
export default function ResetPassword() {
  const { backend_url } = useContext(AppContent);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds until a new code may be requested
  const lock = useRef(false); // blocks a second request while one is running (double click / Enter + click)

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // runs one request at a time; the button shows a spinner and cannot be pressed again
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    try { await fn(); }
    catch (error) { toast.error(error.response?.data?.message || error.message); }
    finally { lock.current = false; setLoading(false); }
  };

  const sendCode = (e) => {
    e?.preventDefault();
    return run(async () => {
      const { data } = await axios.post(`${backend_url}/api/auth/resetotp`, { email: email.trim() });
      if (!ok(data)) return toast.error(data.message || "Could not send the code");
      setCooldown(data.retryAfter || 60);
      setOtp("");
      setStep(2);
      // the server does not send a second e-mail inside 60 seconds - say so instead of a second "sent" toast
      toast[data.alreadySent ? "info" : "success"](data.alreadySent ? "A code was already sent. Check your inbox (and Spam)." : "We sent a 6-digit code to your e-mail");
    });
  };

  const checkCode = (e, code = otp) => {
    e?.preventDefault();
    if (code.length !== 6) return toast.error("Enter all 6 digits");
    return run(async () => {
      const { data } = await axios.post(`${backend_url}/api/auth/verifyresetotp`, { email: email.trim(), otp: code });
      if (ok(data)) setStep(3);
      else { toast.error(data.message || "That code is not right"); setOtp(""); }
    });
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("The two passwords do not match");
    return run(async () => {
      const { data } = await axios.post(`${backend_url}/api/auth/resetpassword`, { email: email.trim(), otp, newPassword: password });
      if (ok(data)) { toast.success("Password changed. You can log in now."); navigate("/login", { replace: true }); }
      else { toast.error(data.message || "Could not reset the password"); if (/otp|attempt/i.test(data.message || "")) { setStep(2); setOtp(""); } }
    });
  };

  return (
    <AuthShell>
      <div className={authCard}>
        <button type="button" onClick={() => (step === 1 ? navigate("/login") : setStep(step - 1))} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white mb-4 -mt-1">
          <ArrowLeft size={16} /> {step === 1 ? "Back to log in" : "Back"}
        </button>

        {/* progress */}
        <ol className="flex items-center justify-between gap-2 mb-6" aria-label="Progress">
          {STEPS.map((label, i) => {
            const n = i + 1; const done = step > n; const current = step === n;
            return (
              <li key={label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                {i > 0 && <span className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-0 ${step >= n ? "bg-indigo-400" : "bg-white/15"}`} />}
                <span className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-emerald-500" : current ? "bg-indigo-500 ring-4 ring-indigo-500/30" : "bg-white/15 text-gray-300"}`}>{done ? <CheckCircle2 size={16} /> : n}</span>
                <span className={`text-[11px] sm:text-xs ${current ? "text-white font-semibold" : "text-gray-400"}`}>{label}</span>
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <form onSubmit={sendCode} className="space-y-4">
            <div className="text-center"><h2 className="text-2xl font-bold">Forgot your password?</h2><p className="text-sm text-gray-300 mt-1">Enter your e-mail. We will send you a 6-digit code.</p></div>
            <Field icon={Mail}><input className={authInput} type="email" placeholder="Email address" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <PrimaryButton type="submit" loading={loading}>{loading ? "Sending..." : "Send code"}</PrimaryButton>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={checkCode} className="space-y-5">
            <div className="text-center"><h2 className="text-2xl font-bold">Enter the code</h2><p className="text-sm text-gray-300 mt-1">We sent a 6-digit code to <strong className="text-white break-all">{email}</strong></p></div>
            <OtpInput value={otp} onChange={setOtp} onComplete={(code) => checkCode(null, code)} disabled={loading} />
            <PrimaryButton type="submit" loading={loading} disabled={otp.length !== 6}>{loading ? "Checking..." : "Verify code"}</PrimaryButton>
            <p className="text-center text-sm text-gray-300">
              Did not get it?{" "}
              {cooldown > 0
                ? <span className="text-gray-400">Resend in {cooldown}s</span>
                : <button type="button" onClick={sendCode} disabled={loading} className="font-semibold text-indigo-300 hover:text-white hover:underline disabled:opacity-50">Send a new code</button>}
            </p>
            <p className="text-center text-xs text-gray-400">Check your Spam folder too. The code works for 15 minutes.</p>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={savePassword} className="space-y-4">
            <div className="text-center"><h2 className="text-2xl font-bold">Choose a new password</h2><p className="text-sm text-gray-300 mt-1">At least 6 characters.</p></div>
            <Field icon={Lock} right={<button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-300 hover:text-white shrink-0" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>}>
              <input className={authInput} type={showPassword ? "text" : "password"} placeholder="New password" autoComplete="new-password" required minLength={6} autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field icon={KeyRound}><input className={authInput} type={showPassword ? "text" : "password"} placeholder="Confirm new password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
            {confirm && password !== confirm && <p className="text-xs text-rose-300 -mt-2">The passwords do not match yet.</p>}
            <PrimaryButton type="submit" loading={loading}>{loading ? "Saving..." : "Set new password"}</PrimaryButton>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
