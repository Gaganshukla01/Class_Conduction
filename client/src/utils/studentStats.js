import { classStartDate } from "./classTime";

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// Only classes that have already started count towards attendance. The old
// code counted all 30 future weeks too, which made rates look absurdly low.
export function computeStudentStats(allSchedule, userId, homework = [], now = new Date()) {
  const mine = (Array.isArray(allSchedule) ? allSchedule : [])
    .filter((c) => (c.studentsEnrolled || []).includes(userId))
    .map((c) => ({ ...c, start: classStartDate(c) }))
    .sort((a, b) => a.start - b.start);

  const held = mine.filter((c) => c.start <= now);
  const upcoming = mine.filter((c) => c.start > now);
  const present = held.filter((c) => c.attendance === "Present");

  // streaks over held classes, oldest -> newest
  let best = 0, run = 0;
  held.forEach((c) => {
    run = c.attendance === "Present" ? run + 1 : 0;
    best = Math.max(best, run);
  });
  let current = 0;
  for (let i = held.length - 1; i >= 0 && held[i].attendance === "Present"; i--) current++;

  const byCourse = new Map();
  mine.forEach((c) => {
    if (!byCourse.has(c.className)) byCourse.set(c.className, { name: c.className, total: 0, held: 0, present: 0 });
    const row = byCourse.get(c.className);
    row.total++;
    if (c.start <= now) {
      row.held++;
      if (c.attendance === "Present") row.present++;
    }
  });
  const courses = [...byCourse.values()].map((r) => ({
    ...r,
    rate: pct(r.present, r.held),
    progress: pct(r.held, r.total), // how far through the course
  }));

  const byMonth = new Map();
  held.forEach((c) => {
    const key = `${c.start.getFullYear()}-${String(c.start.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, { key, label: c.start.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), held: 0, present: 0 });
    const row = byMonth.get(key);
    row.held++;
    if (c.attendance === "Present") row.present++;
  });
  const monthly = [...byMonth.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => ({ ...r, rate: pct(r.present, r.held), absent: r.held - r.present }));

  // last 8 calendar weeks (Mon-start) trend
  const weekStart = (d) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  const byWeek = new Map();
  held.forEach((c) => {
    const ws = weekStart(c.start);
    const key = ws.getTime();
    if (!byWeek.has(key)) byWeek.set(key, { key, label: ws.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), held: 0, present: 0 });
    const row = byWeek.get(key);
    row.held++;
    if (c.attendance === "Present") row.present++;
  });
  const weekly = [...byWeek.values()].sort((a, b) => a.key - b.key).slice(-8).map((r) => ({ ...r, rate: pct(r.present, r.held) }));

  const mineHw = (homework || []).filter((h) => h.studentId === userId);
  const hw = {
    total: mineHw.length,
    pending: mineHw.filter((h) => h.status === "pending").length,
    submitted: mineHw.filter((h) => h.status === "submitted").length,
    completed: mineHw.filter((h) => h.status === "completed").length,
    overdue: mineHw.filter((h) => h.status === "overdue").length,
  };
  hw.done = hw.submitted + hw.completed;
  hw.rate = pct(hw.done, hw.total);

  const rate = pct(present.length, held.length);
  return {
    total: mine.length,
    held: held.length,
    present: present.length,
    absent: held.length - present.length,
    upcomingCount: upcoming.length,
    nextClass: upcoming[0] || null,
    rate,
    hasData: held.length > 0,
    streak: { current, best },
    courses,
    monthly,
    weekly,
    recent: held.slice(-12).reverse(),
    courseProgress: pct(held.length, mine.length),
    homework: hw,
    // last 4 held classes vs overall - used for the trend hint
    recentRate: pct(held.slice(-4).filter((c) => c.attendance === "Present").length, Math.min(4, held.length)),
  };
}

export const rateTone = (rate) => (rate >= 85 ? "emerald" : rate >= 75 ? "cyan" : rate >= 50 ? "amber" : "rose");
export const rateColor = (rate) => ({ emerald: "#34d399", cyan: "#22d3ee", amber: "#fbbf24", rose: "#fb7185" })[rateTone(rate)];
