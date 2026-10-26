// Class dates are stored as UTC-midnight of the picked calendar day and the
// time as "HH:mm" in the institute's local time (IST by default).
const TZ_OFFSET_MIN = Number(process.env.APP_TZ_OFFSET_MINUTES ?? 330);
const TZ_LABEL = process.env.APP_TZ_LABEL || "IST";

export const parseTime = (classTime = "") => {
  const m = String(classTime).trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!m) return { hours: 0, minutes: 0 };
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const period = m[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

// Real instant at which the class starts.
export const classStart = (cls) => {
  const d = new Date(cls.classDate);
  const { hours, minutes } = parseTime(cls.classTime);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes) -
      TZ_OFFSET_MIN * 60000
  );
};

export const classEnd = (cls) => {
  const hrs = parseFloat(cls.classDuration);
  const durationMin = Number.isFinite(hrs) && hrs > 0 ? hrs * 60 : 60;
  return new Date(classStart(cls).getTime() + durationMin * 60000);
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const formatDate = (cls) => {
  const d = new Date(cls.classDate);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const formatTime = (classTime) => {
  const { hours, minutes } = parseTime(classTime);
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const formatDateTime = (cls) =>
  `${formatDate(cls)} · ${formatTime(cls.classTime)} ${TZ_LABEL}`;

export const formatDay = (date) => {
  const d = new Date(date);
  return `${WEEKDAYS[d.getUTCDay()]}`;
};

export const formatPlainDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  // Local (institute) calendar date for real timestamps
  const local = new Date(d.getTime() + TZ_OFFSET_MIN * 60000);
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]} ${local.getUTCFullYear()}`;
};

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
