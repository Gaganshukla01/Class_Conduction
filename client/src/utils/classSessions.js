import { classStartDate } from "./classTime";

// Groups sessions into "batches" (same class name + same students) and numbers
// them 1..N by real start time. Mirrors the numbering the server stores.
export function buildBatches(allSchedule) {
  if (!Array.isArray(allSchedule)) return [];
  const map = new Map();
  allSchedule.forEach((cls) => {
    const students = [...(cls.studentsEnrolled || [])].sort();
    const key = `${cls.className}__${students.join(",")}`;
    if (!map.has(key)) {
      map.set(key, { key, className: cls.className, studentsEnrolled: students, sessions: [] });
    }
    map.get(key).sessions.push(cls);
  });
  return [...map.values()].map((batch) => {
    const sessions = batch.sessions
      .slice()
      .sort((a, b) => classStartDate(a) - classStartDate(b))
      .map((s, i) => ({ ...s, classNumber: i + 1 }));
    return { ...batch, sessions };
  });
}
