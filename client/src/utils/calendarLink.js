// "Add to Google Calendar" link for one class. Works for ANY class (pasted link or generated Meet)
// and needs no Google sign-in setup on the server: the person's own Google Calendar opens with the
// event pre-filled and they press Save.
// classDate is UTC-midnight of the class day and classTime "HH:mm" in the institute time zone,
// so the wall-clock time is sent together with the zone name (not converted by the browser).
const pad = (n) => String(n).padStart(2, "0");
const parse = (t = "") => {
  const m = String(t).trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!m) return { h: 0, min: 0 };
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const p = m[3]?.toUpperCase();
  if (p === "PM" && h < 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return { h, min };
};
const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;

export function googleCalendarUrl({ title, classDate, classTime, classDuration, link, details = "", tz = "Asia/Kolkata" }) {
  const day = new Date(classDate);
  const { h, min } = parse(classTime);
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, min));
  const hrs = parseFloat(classDuration);
  const end = new Date(start.getTime() + (Number.isFinite(hrs) && hrs > 0 ? hrs * 60 : 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Class",
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: tz,
    details: [details, link ? `Join: ${link}` : ""].filter(Boolean).join("\n"),
    location: link || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
