// Helpers for the 3-tier question hierarchy:  Category > Session > Question

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// Homework progress is based ONLY on coding questions: assigned vs accepted.
export function computeQuestionStats(items = []) {
  const count = (s) => items.filter((a) => a.status === s).length;
  const total = items.length;
  const accepted = count("accepted");
  const submitted = count("submitted");
  const needsWork = count("needs_work");
  const todo = count("assigned");
  const overdue = items.filter((a) => a.dueDate && new Date(a.dueDate) < new Date() && ["assigned", "needs_work"].includes(a.status)).length;
  return { total, accepted, submitted, needsWork, todo, overdue, rate: pct(accepted, total), pending: total - accepted };
}

const emptyBucket = () => ({ ...computeQuestionStats([]), items: [] });
const addTo = (bucket, a) => bucket.items.push(a);
const finish = (bucket) => ({ ...bucket, ...computeQuestionStats(bucket.items) });

export const UNFILED_ID = "unfiled";

// Builds [{ ...category, sessions: [{ ...session, items, stats }], items, stats }]
// from the student's assignments and the folders returned with them.
export function buildQuestionTree(items = [], folders = []) {
  const cats = folders.filter((f) => f.level === 1);
  const sessions = folders.filter((f) => f.level === 2);
  const sessionById = new Map(sessions.map((s) => [String(s._id), { ...s, ...emptyBucket() }]));
  const unfiled = { _id: UNFILED_ID, name: "Other questions", level: 1, color: "slate", sessions: [], ...emptyBucket() };
  const unfiledSession = { _id: UNFILED_ID, name: "Unsorted", level: 2, parentId: UNFILED_ID, ...emptyBucket() };

  items.forEach((a) => {
    const s = a.question?.folderId && sessionById.get(String(a.question.folderId));
    addTo(s || unfiledSession, a);
  });

  const out = cats
    .map((c) => {
      const kids = [...sessionById.values()]
        .filter((s) => String(s.parentId) === String(c._id) && s.items.length > 0)
        .map(finish)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, undefined, { numeric: true }));
      const all = kids.flatMap((k) => k.items);
      return { ...c, sessions: kids, items: all, ...computeQuestionStats(all) };
    })
    .filter((c) => c.items.length > 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (unfiledSession.items.length) {
    const s = finish(unfiledSession);
    out.push({ ...unfiled, sessions: [s], items: s.items, ...computeQuestionStats(s.items) });
  }
  return out;
}

// "Python WebDev / Session 01" for a question, given the folders list
export function folderPath(folderId, folders = []) {
  const s = folders.find((f) => String(f._id) === String(folderId));
  if (!s) return "Unfiled";
  const c = folders.find((f) => String(f._id) === String(s.parentId));
  return c ? `${c.name} / ${s.name}` : s.name;
}
