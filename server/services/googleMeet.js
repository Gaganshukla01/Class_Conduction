// Creates Google Meet links through the Google Calendar API.
//
// One-time setup (see README / chat): a Google Cloud project with the Calendar API enabled, an OAuth
// client, and a refresh token for the Google account that should "host" the classes. The three values
// live in the server environment - never in the repo:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// Optional: GOOGLE_CALENDAR_ID (default "primary"), APP_TZ_NAME (default "Asia/Kolkata"),
//           GOOGLE_SEND_INVITES=false (do not let Google e-mail the guests an invite).
import crypto from "crypto";
import { classStart, classEnd } from "../utils/time.js";

const TZ_OFFSET_MIN = Number(process.env.APP_TZ_OFFSET_MINUTES ?? 330);
const API = "https://www.googleapis.com/calendar/v3/calendars";
const calendarId = () => encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
const sendUpdates = () => (process.env.GOOGLE_SEND_INVITES === "false" ? "none" : "all");

export const isMeetConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);

let cached = { token: "", exp: 0 };

async function accessToken() {
  if (cached.token && Date.now() < cached.exp - 60000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Google sign-in failed (${data.error_description || data.error || res.status}). The refresh token may have expired - generate a new one.`);
  }
  cached = { token: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return cached.token;
}

async function call(method, path, body) {
  const token = await accessToken();
  const res = await fetch(`${API}/${calendarId()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data?.error?.message || `Google Calendar error ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

// "2026-11-20T17:30:00" in the institute's local time, from a real instant
const localStamp = (instant) => new Date(instant.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 19);

const cleanEmails = (list) => [...new Set((list || []).map((e) => String(e || "").trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];

function buildEvent({ title, description, classDate, classTime, durationHours, emails, weeks }) {
  const cls = { classDate, classTime, classDuration: String(durationHours || 1) };
  const tz = process.env.APP_TZ_NAME || "Asia/Kolkata";
  const event = {
    summary: title,
    description: description || "",
    start: { dateTime: localStamp(classStart(cls)), timeZone: tz },
    end: { dateTime: localStamp(classEnd(cls)), timeZone: tz },
    attendees: cleanEmails(emails).map((email) => ({ email })),
    guestsCanModify: false,
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
  };
  if (weeks && weeks > 1) event.recurrence = [`RRULE:FREQ=WEEKLY;COUNT=${Math.min(Number(weeks), 104)}`];
  return event;
}

const linkOf = (ev) => ev.hangoutLink || ev.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri || "";

// Creates the event (+ a Meet room). With `weeks` > 1 it is ONE weekly recurring event, so the same
// Meet link works for every session of that weekday.
export async function createMeetEvent(opts) {
  const body = {
    ...buildEvent(opts),
    conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
  };
  let ev = await call("POST", `/events?conferenceDataVersion=1&sendUpdates=${sendUpdates()}`, body);
  for (let i = 0; i < 3 && !linkOf(ev); i++) {
    await new Promise((r) => setTimeout(r, 700));
    ev = await call("GET", `/events/${ev.id}?conferenceDataVersion=1`);
  }
  const meetLink = linkOf(ev);
  if (!meetLink) throw new Error("Google did not return a Meet link. Try again in a moment.");
  return { eventId: ev.id, meetLink };
}

// New time / guests for an existing event (the Meet link stays the same).
export async function updateMeetEvent(eventId, opts) {
  const ev = await call("PATCH", `/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1&sendUpdates=${sendUpdates()}`, buildEvent(opts));
  return { eventId: ev.id, meetLink: linkOf(ev) };
}

// Already gone is fine.
export async function deleteMeetEvent(eventId) {
  if (!eventId) return;
  try {
    await call("DELETE", `/events/${encodeURIComponent(eventId)}?sendUpdates=${sendUpdates()}`);
  } catch (e) {
    if (e.status !== 404 && e.status !== 410) throw e;
  }
}

// Calendar title: "<student name(s)> - <course> classes", e.g. "Arjun - Python classes"
export function meetTitle(studentNames, className) {
  const names = [...new Set((studentNames || []).map((n) => String(n || "").trim()).filter(Boolean))];
  let who = "";
  if (names.length === 1) who = names[0];
  else if (names.length === 2) who = `${names[0]} & ${names[1]}`;
  else if (names.length === 3) who = `${names[0]}, ${names[1]} & ${names[2]}`;
  else if (names.length > 3) who = `${names[0]}, ${names[1]} +${names.length - 2}`;
  const course = String(className || "Class").trim();
  const what = /class/i.test(course) ? course : `${course} classes`;
  return who ? `${who} - ${what}` : what;
}

export const _resetMeetTokenCache = () => { cached = { token: "", exp: 0 }; };
