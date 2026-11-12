import { useState } from "react";
import { avatarSrc } from "../../utils/avatar";

const COLORS = ["from-rose-500 to-pink-600", "from-sky-500 to-blue-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-violet-500 to-fuchsia-600", "from-cyan-500 to-sky-600"];
const colorFor = (key = "") => COLORS[[...String(key)].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];

// Profile photo with a coloured-initial fallback. Used everywhere a person is shown.
//  src: a URL or { url }     online: true/false shows a presence dot (omit for none)
export default function Avatar({ name = "?", src, size = 36, online, id, className = "" }) {
  const [failed, setFailed] = useState(false);
  const url = !failed ? avatarSrc(src, size) : null;
  const dot = Math.max(9, Math.round(size / 4));
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt={name} loading="lazy" draggable={false} onError={() => setFailed(true)} className="w-full h-full rounded-full object-cover bg-white/10" />
      ) : (
        <span className={`w-full h-full rounded-full bg-gradient-to-br ${colorFor(id || name)} flex items-center justify-center font-bold text-white select-none`} style={{ fontSize: Math.round(size * 0.42) }}>
          {(name || "?").trim()[0]?.toUpperCase() || "?"}
        </span>
      )}
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-slate-900 ${online ? "bg-emerald-400" : "bg-gray-500"}`} style={{ width: dot, height: dot }} title={online ? "Online" : "Offline"} />
      )}
    </span>
  );
}
