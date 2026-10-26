// Shared bits for the student dashboards (dark glass theme).
export const AXIS = { fill: "#cbd5e1", fontSize: 12 };
export const GRID = "rgba(255,255,255,0.08)";
export const TOOLTIP = {
  contentStyle: { background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" },
  labelStyle: { color: "#e2e8f0" },
  itemStyle: { color: "#e2e8f0" },
  cursor: { fill: "rgba(255,255,255,0.06)" },
};

export const Card = ({ title, subtitle, right, children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-lg p-5 sm:p-6 rounded-3xl border border-white/20 ${className}`}>
    {(title || right) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
    )}
    {children}
  </div>
);

export const Kpi = ({ icon: Icon, label, value, hint, tone = "cyan" }) => {
  const tones = {
    cyan: "from-cyan-500/30 to-sky-500/10 text-cyan-300",
    emerald: "from-emerald-500/30 to-teal-500/10 text-emerald-300",
    rose: "from-rose-500/30 to-pink-500/10 text-rose-300",
    amber: "from-amber-500/30 to-orange-500/10 text-amber-300",
    violet: "from-violet-500/30 to-fuchsia-500/10 text-violet-300",
  };
  return (
    <div className={`rounded-2xl p-4 border border-white/15 bg-gradient-to-br ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-300">{label}</p>
        {Icon && <Icon size={18} />}
      </div>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      {hint && <p className="text-xs text-gray-300 mt-1">{hint}</p>}
    </div>
  );
};

export const ProgressBar = ({ value, color = "#22d3ee", marker, height = "h-2.5" }) => (
  <div className={`relative ${height} rounded-full bg-white/10 overflow-visible`}>
    <div className={`${height} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    {marker != null && <div className="absolute -top-1 -bottom-1 w-0.5 bg-white/70" style={{ left: `${marker}%` }} title={`${marker}% target`} />}
  </div>
);

export const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20 text-center">
    {Icon && <Icon size={48} className="text-gray-400 mx-auto mb-4" />}
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-300">{text}</p>
  </div>
);
