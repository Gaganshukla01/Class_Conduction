import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Area, AreaChart, RadialBar, RadialBarChart,
  PolarAngleAxis, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { AlertTriangle, CalendarCheck, CalendarX, CalendarClock, Flame, Video, TrendingUp, TrendingDown } from "lucide-react";
import { Card, Kpi, ProgressBar, EmptyState, AXIS, GRID, TOOLTIP } from "./chartKit";
import { rateColor } from "../../utils/studentStats";
import { formatClassDate, formatClassTime } from "../../utils/classTime";

const TARGET = 75;

export default function AttendanceDashboard({ stats }) {
  const gauge = useMemo(() => [{ name: "rate", value: stats.rate, fill: rateColor(stats.rate) }], [stats.rate]);

  if (!stats.hasData) {
    return (
      <EmptyState icon={CalendarClock} title="No classes held yet"
        text={stats.upcomingCount ? `Your attendance will appear here after your first class. ${stats.upcomingCount} classes are scheduled.` : "You are not enrolled in any class yet."} />
    );
  }

  // classes in a row needed to climb back to the target
  const needed = stats.rate < TARGET ? Math.max(1, 3 * stats.held - 4 * stats.present) : 0;
  const trendUp = stats.recentRate >= stats.rate;

  return (
    <div className="space-y-6">
      {stats.rate < TARGET && (
        <div className="flex gap-3 items-start rounded-2xl p-4 bg-amber-500/15 border border-amber-400/40">
          <AlertTriangle className="text-amber-300 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-amber-100">Your attendance is {stats.rate}% — below the {TARGET}% target</p>
            <p className="text-sm text-amber-100/80 mt-0.5">Attend the next <strong>{needed}</strong> class{needed === 1 ? "" : "es"} in a row to get back on track.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="Overall attendance" subtitle={`${stats.present} of ${stats.held} classes attended`}>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={gauge} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "rgba(255,255,255,0.08)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-bold text-white">{stats.rate}%</span>
              <span className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                {trendUp ? <TrendingUp size={14} className="text-emerald-300" /> : <TrendingDown size={14} className="text-rose-300" />}
                last 4 classes: {stats.recentRate}%
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 content-start">
          <Kpi icon={CalendarCheck} tone="emerald" label="Present" value={stats.present} hint="classes attended" />
          <Kpi icon={CalendarX} tone="rose" label="Absent" value={stats.absent} hint="classes missed" />
          <Kpi icon={CalendarClock} tone="cyan" label="Upcoming" value={stats.upcomingCount} hint="still to come" />
          <Kpi icon={Flame} tone="amber" label="Current streak" value={stats.streak.current} hint="classes in a row" />
          <Kpi icon={Flame} tone="violet" label="Best streak" value={stats.streak.best} hint="your record" />
          {stats.nextClass ? (
            <div className="rounded-2xl p-4 border border-white/15 bg-white/5 flex flex-col justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-300">Next class</p>
              <div>
                <p className="text-white font-semibold truncate">{stats.nextClass.className}</p>
                <p className="text-xs text-gray-300">{formatClassDate(stats.nextClass)} · {formatClassTime(stats.nextClass)}</p>
              </div>
              {stats.nextClass.classLink && (
                <a href={stats.nextClass.classLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 w-fit"><Video size={13} /> Join link</a>
              )}
            </div>
          ) : <Kpi label="Next class" value="—" hint="nothing scheduled" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Month by month" subtitle="Classes attended vs missed">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
                <Bar dataKey="present" name="Present" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#fb7185" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Weekly trend" subtitle="Attendance % over the last 8 weeks (dashed line = 75% target)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weekly} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} unit="%" tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} formatter={(v) => [`${v}%`, "Attendance"]} />
                <ReferenceLine y={TARGET} stroke="#fbbf24" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="rate" stroke="#22d3ee" strokeWidth={3} fill="url(#attFill)" dot={{ r: 3, fill: "#22d3ee" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="By course" subtitle="The white tick marks the 75% target">
          <div className="space-y-5">
            {stats.courses.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-medium truncate pr-3">{c.name}</span>
                  <span className="text-gray-300 shrink-0">{c.present}/{c.held} · <strong style={{ color: rateColor(c.rate) }}>{c.held ? `${c.rate}%` : "—"}</strong></span>
                </div>
                <ProgressBar value={c.rate} color={rateColor(c.rate)} marker={TARGET} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent classes" subtitle="Your last 12 classes, newest first">
          <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {stats.recent.map((c) => {
              const ok = c.attendance === "Present";
              return (
                <li key={c._id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{c.className}{c.topicCovered ? ` — ${c.topicCovered}` : ""}</p>
                    <p className="text-xs text-gray-400">{formatClassDate(c)} · {formatClassTime(c)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{c.attendance}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
