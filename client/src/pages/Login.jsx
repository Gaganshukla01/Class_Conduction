import { useContext, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Briefcase, Eye, EyeOff, GraduationCap, Lock, Loader2, Mail, Presentation, User } from "lucide-react";
import { AppContent } from "../context/Context";
import AuthShell from "../components/auth/AuthShell";
import { Field, PrimaryButton, authCard, authInput } from "../components/auth/authKit";
import { dashboardPath, isApproved } from "../utils/roles";

const ROLE_CHOICES = [
  ["student", "Student", "Learn and practise", GraduationCap],
  ["teacher", "Teacher", "Teach and guide students", Presentation],
  ["manager", "Manager", "Run classes and fees", Briefcase],
];

// One page for both: a clear Log in / Sign up switch at the top.
export default function Login() {
  const { backend_url, setIsLoggedin, getUserData } = useContext(AppContent);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const busy = useRef(false); // a double click must not submit twice
  const signup = mode === "signup";

  // after a successful login: approved people go to their dashboard, new ones to the "in review" page
  const enter = async () => {
    setIsLoggedin(true);
    const user = await getUserData();
    navigate(user ? (isApproved(user) ? dashboardPath(user.userType) : "/pending") : "/", { replace: true });
  };

  const handleGoogle = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setIsGoogleLoading(true);
    try {
      // loaded only now - Firebase is big and most people never use Google sign-in
      const [{ getAuth, GoogleAuthProvider, signInWithPopup }, { app }] = await Promise.all([import("firebase/auth"), import("../components/FirebaseConfig.jsx")]);
      const result = await signInWithPopup(getAuth(app), new GoogleAuthProvider());
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backend_url + "/api/auth/googleauth", {
        name: result.user.displayName,
        email: result.user.email,
        Validuser: result.user.emailVerified,
        requestedRole: signup ? requestedRole : undefined,
      });
      if (data.sucess) {
        toast.success(data.accountStatus === "pending" ? "Account created. An admin will review it - we will e-mail you." : data.message);
        await enter();
      } else toast.error(data.message);
    } catch (error) {
      if (error?.code !== "auth/popup-closed-by-user") toast.error(error.message || "Authentication failed");
    } finally {
      busy.current = false;
      setIsGoogleLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    if (signup && name.trim().length < 2) return toast.error("Please enter your full name");
    if (signup && password.length < 6) return toast.error("Password must be at least 6 characters");
    busy.current = true;
    setIsLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backend_url + (signup ? "/api/auth/register" : "/api/auth/login"), signup ? { name: name.trim(), email, password, requestedRole } : { email, password });
      if (data.sucess) {
        toast.success(signup ? "Account created! An admin will review it - we will e-mail you once it is approved." : data.accountStatus === "pending" ? "Your account is still in review" : "Welcome back!");
        await enter();
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Authentication failed");
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className={authCard}>
        {/* Log in / Sign up switch */}
        <div role="tablist" aria-label="Log in or sign up" className="relative grid grid-cols-2 p-1 rounded-2xl bg-white/10 border border-white/10 mb-6">
          <span aria-hidden className="absolute top-1 bottom-1 left-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-600 shadow-lg transition-transform duration-300 ease-out" style={{ width: "calc(50% - 4px)", transform: signup ? "translateX(100%)" : "translateX(0)" }} />
          {[["login", "Log in"], ["signup", "Sign up"]].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`relative z-10 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-colors ${mode === id ? "text-white" : "text-gray-300 hover:text-white"}`}>{label}</button>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight">{signup ? "Create your account" : "Welcome back"}</h2>
        <p className="text-center text-gray-300 text-sm mt-1 mb-6">{signup ? "Join ClassWave in a minute. An admin approves every new account." : "Log in to continue learning."}</p>

        <form onSubmit={submit} className="space-y-4" noValidate={false}>
          {signup && (
            <Field icon={User}><input className={authInput} type="text" placeholder="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          )}
          <Field icon={Mail}><input className={authInput} type="email" placeholder="Email address" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field
            icon={Lock}
            right={<button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-300 hover:text-white shrink-0" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>}
          >
            <input className={authInput} type={showPassword ? "text" : "password"} placeholder="Password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          {signup && (
            <fieldset>
              <legend className="text-sm text-gray-200 font-medium mb-2">I am joining as</legend>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_CHOICES.map(([id, label, hint, Icon]) => (
                  <button key={id} type="button" onClick={() => setRequestedRole(id)} aria-pressed={requestedRole === id}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${requestedRole === id ? "border-cyan-400 bg-cyan-400/15 text-white" : "border-white/15 bg-white/5 text-gray-300 hover:bg-white/10"}`}>
                    <Icon size={20} />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-[10px] leading-tight text-gray-400 hidden sm:block">{hint}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">An admin checks this choice and can change it when approving your account.</p>
            </fieldset>
          )}

          {!signup && (
            <div className="flex justify-end -mt-1">
              <button type="button" onClick={() => navigate("/resetPassword")} className="text-sm text-indigo-300 hover:text-white hover:underline">Forgot password?</button>
            </div>
          )}

          <PrimaryButton type="submit" loading={isLoading}>{isLoading ? "Please wait..." : signup ? "Create account" : "Log in"}</PrimaryButton>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-x-0 top-1/2 border-t border-white/15" />
            <span className="relative px-3 text-xs uppercase tracking-wider text-gray-400 bg-[#1b1840] rounded">or</span>
          </div>

          <button type="button" onClick={handleGoogle} disabled={isGoogleLoading} className="w-full py-3 rounded-2xl bg-white text-slate-800 font-semibold shadow hover:bg-gray-100 transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3">
            {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          {signup ? "Already have an account? " : "New to ClassWave? "}
          <button type="button" onClick={() => setMode(signup ? "login" : "signup")} className="font-semibold text-white hover:underline">{signup ? "Log in" : "Create an account"}</button>
        </p>
      </div>
    </AuthShell>
  );
}
