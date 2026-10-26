import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Award, BookOpenCheck, CalendarCheck, Flame, GraduationCap, Target, Clock } from "lucide-react";
import { Card, Kpi, ProgressBar, EmptyState, TOOLTIP } from "./chartKit";
import { rateColor } from "../../utils/studentStats";

const HW_COLORS = { completed: "#34d399", submitted: "#22d3ee", pending: "#fbbf24", overdue: "#fb7185" };

export default function ProgressDashboard({ stats, homeworkData = [] }) {
  const hw = stats.homework;
  const pie = useMemo(
    () => Object.keys(HW_COLORS).map((k) => ({ name: k[0].toUpperCase() + k.slice(1), key: k, value: hw[k] })).filter((d) => d.value > 0),
    [hw]
  );

  const dueSoon = useMemo(
    () => (homeworkData || [])
      .filter((h) => ["pending", "overdue"].includes(h.status))
      .map((h) => ({ ...h, due: h.dueDate ? new Date(h.dueDate) : null }))
      .sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity))
      .slice(0, 5),
    [homeworkData]
  );

  const badges = [
    { ok: stats.held >= 3 && stats.rate === 100, icon: CalendarCheck, title: "Perfect attendance", text: "100% so far" },
    { ok: stats.streak.best >= 5, icon: Flame, title: "On a roll", text: `${stats.streak.best}-class streak` },
    { ok: hw.total >= 3 && hw.rate >= 80, icon: BookOpenCheck, title: "Homework hero", text: `${hw.rate}% submitted` },
    { ok: stats.courseProgress >= 50, icon: GraduationCap, title: "Halfway there", text: "50%+ of course done" },
  ];

  if (!stats.total && !hw.total) {
    return <EmptyState icon={GraduationCap} title="Nothing to show yet" text="Once you are enrolled in a class and have homework, your progress will show up here." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={GraduationCap} tone="violet" label="Course progress" value={`${stats.courseProgress}%`} hint={`${stats.held} of ${stats.total} classes done`} />
        <Kpi icon={CalendarCheck} tone="emerald" label="Attendance" value={stats.hasData ? `${stats.rate}%` : "—"} hint={stats.hasData ? `${stats.present}/${stats.held} attended` : "no classes yet"} />
        <Kpi icon={BookOpenCheck} tone="cyan" label="Homework done" value={hw.total ? `${hw.rate}%` : "—"} hint={`${hw.done} of ${hw.total} submitted`} />
        <Kpi icon={Flame} tone="amber" label="Best streak" value={stats.streak.best} hint="classes in a row" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Course journey" subtitle="How far you are through each course">
          <div className="space-y-5">
            {stats.courses.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-medium truncate pr-3">{c.name}</span>
                  <span className="text-gray-300 shrink-0">Class {Math.min(c.held + 1, c.total)} of {c.total}</span>
                </div>
                <ProgressBar value={c.progress} color="linear-gradient(90deg,#8b5cf6,#22d3ee)" />
                <p className="text-xs text-gray-400 mt-1.5">Attendance in this course: <span style={{ color: rateColor(c.rate) }}>{c.held ? `${c.rate}%` : "—"}</span></p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Homework" subtitle={hw.total ? `${hw.done} of ${hw.total} handed in` : "No homework assigned yet"}>
          {hw.total === 0 ? <p className="text-gray-300 text-sm">Your homework status will appear here.</p> : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-44 h-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" innerRadius={56} outerRadius={80} paddingAngle={3} stroke="none">
                      {pie.map((d) => <Cell key={d.key} fill={HW_COLORS[d.key]} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-white">{hw.rate}%</span>
                  <span className="text-[11px] text-gray-300">done</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm flex-1 w-full">
                {Object.keys(HW_COLORS).map((k) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-200 capitalize"><span className="w-3 h-3 rounded-full" style={{ background: HW_COLORS[k] }} />{k}</span>
                    <span className="text-white font-semibold">{hw[k]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="To do next" subtitle="Homework that still needs your attention">
          {dueSoon.length === 0 ? <p className="text-gray-300 text-sm">You're all caught up. 🎉</p> : (
            <ul className="space-y-2">
              {dueSoon.map((h) => {
                const late = h.status === "overdue" || (h.due && h.due < new Date());
                return (
                  <li key={h._id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                    <Target size={18} className={late ? "text-rose-300" : "text-amber-300"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{h.homeworkTitle}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{h.due ? `Due ${h.due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No due date"}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${late ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"}`}>{late ? "Overdue" : "Pending"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Achievements" subtitle="Earned automatically as you progress">
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <div key={b.title} className={`rounded-2xl p-4 border text-center transition ${b.ok ? "bg-gradient-to-br from-amber-400/25 to-orange-500/10 border-amber-300/40" : "bg-white/5 border-white/10 opacity-50"}`}>
                <b.icon size={26} className={`mx-auto mb-2 ${b.ok ? "text-amber-300" : "text-gray-400"}`} />
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="text-xs text-gray-300 mt-0.5">{b.ok ? b.text : "Locked"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
