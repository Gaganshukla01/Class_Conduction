import { Loader2 } from "lucide-react";

// small shared pieces of the auth screens
export const authInput =
  "w-full bg-transparent outline-none text-white placeholder:text-gray-400 min-w-0 select-text";
export const authCard = "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-5 sm:p-8";

export function Field({ icon: Icon, right, children }) {
  return (
    <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/30">
      {Icon && <Icon className="w-5 h-5 text-gray-300 shrink-0" />}
      {children}
      {right}
    </div>
  );
}

export function PrimaryButton({ loading, children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/30 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}
