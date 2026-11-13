// formatting helpers for the payments screens
export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// class dates are stored as UTC midnight: format them in UTC so the day never shifts
export const dayLabel = (d, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", ...opts }) : "-";
export const stampLabel = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "-";
export const monthLabel = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" }) : "");
export const timeLabel = (hhmm = "") => {
  const [h, m] = String(hhmm).split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export const METHODS = [
  ["cash", "Cash"],
  ["upi", "UPI"],
  ["bank", "Bank transfer"],
  ["card", "Card"],
  ["other", "Other"],
];
export const methodLabel = (m) => METHODS.find(([id]) => id === m)?.[1] || m;

// group classes by month, newest first (the input is already newest first)
export function groupByMonth(classes) {
  const groups = [];
  for (const c of classes) {
    const label = monthLabel(c.classDate);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(c);
    else groups.push({ label, items: [c] });
  }
  return groups;
}
