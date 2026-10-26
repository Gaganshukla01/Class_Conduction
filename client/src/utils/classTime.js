// Class dates are stored as UTC-midnight of the picked day, time as "HH:mm".
// Build the real local start/end instants from those parts.
export const parseTimeParts = (classTime = "") => {
  const m = String(classTime).trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!m) return { hours: 0, minutes: 0 };
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const p = m[3]?.toUpperCase();
  if (p === "PM" && hours < 12) hours += 12;
  if (p === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

export const classStartDate = (cls) => {
  const d = new Date(cls.classDate);
  const { hours, minutes } = parseTimeParts(cls.classTime);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes);
};

export const classEndDate = (cls) => {
  const hrs = parseFloat(cls.classDuration);
  const mins = Number.isFinite(hrs) && hrs > 0 ? hrs * 60 : 60;
  return new Date(classStartDate(cls).getTime() + mins * 60000);
};

export const formatClassDate = (cls) =>
  classStartDate(cls).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatClassTime = (cls) =>
  classStartDate(cls).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
