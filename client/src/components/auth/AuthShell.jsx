import { useNavigate } from "react-router-dom";
import { GraduationCap, MessageSquare, Video, Code2, ShieldCheck } from "lucide-react";
import useNavOffset from "../../hooks/useNavOffset";

const POINTS = [
  [Video, "Live classes", "Join with one tap, with reminders before every class."],
  [Code2, "Practice that counts", "Coding questions with real feedback from your teacher."],
  [MessageSquare, "One-to-one chat", "Talk privately to your teachers. Safe and simple."],
];

// Page frame for login, sign-up, forgot password, e-mail verification and "in review".
//  * laptop / desktop: a brand panel on the left and the form on the right
//  * phone / tablet: just the form, full width, and the page scrolls if the keyboard needs room
// Its height is (screen - site navbar), so nothing is cut off on a short laptop screen.
export default function AuthShell({ children, wide = false }) {
  useNavOffset();
  const navigate = useNavigate();
  return (
    <div
      className="relative flex flex-col lg:flex-row w-full bg-slate-950 text-white overflow-x-hidden"
      style={{ minHeight: "calc(100dvh - var(--nav-h, 0px))" }}
    >
      <aside className="hidden lg:flex lg:w-[42%] xl:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <button onClick={() => navigate("/")} className="relative z-10 flex items-center gap-3 text-left w-fit" aria-label="ClassWave home">
          <span className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center"><GraduationCap size={24} /></span>
          <span className="text-2xl font-bold tracking-tight">ClassWave</span>
        </button>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">Learn live.<br />Practice more.<br />Grow faster.</h1>
          <ul className="mt-8 space-y-5">
            {POINTS.map(([Icon, title, text]) => (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 w-10 h-10 shrink-0 rounded-xl bg-white/15 flex items-center justify-center"><Icon size={20} /></span>
                <span><span className="block font-semibold">{title}</span><span className="block text-sm text-indigo-100/90">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 flex items-center gap-2 text-sm text-indigo-100/90"><ShieldCheck size={16} /> Every new account is reviewed by an admin.</p>
      </aside>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:px-8 sm:py-10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
          {/* on phones the brand panel is hidden, so show a small header */}
          <button onClick={() => navigate("/")} className="lg:hidden flex items-center gap-2.5 mx-auto mb-5" aria-label="ClassWave home">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center"><GraduationCap size={20} /></span>
            <span className="text-xl font-bold">ClassWave</span>
          </button>
          {children}
        </div>
      </main>
    </div>
  );
}
