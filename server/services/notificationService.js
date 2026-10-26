import mongoose from "mongoose";
import transporter from "../config/nodeMailer.js";
import userModel from "../model/userModel.js";
import classSchedule from "../model/classesScheduleDetails.js";
import {
  renderEmail,
  toText,
  esc,
  multiline,
  badge,
  button,
  callout,
  detailTable,
  paragraph,
  appUrl,
} from "./emailLayout.js";
import {
  classStart,
  formatDate,
  formatTime,
  formatDateTime,
  formatPlainDate,
} from "../utils/time.js";

export const ATTENDANCE_ALERT_THRESHOLD = Number(
  process.env.ATTENDANCE_ALERT_THRESHOLD ?? 75
);
const MIN_CLASSES_FOR_ALERT = 3;
const SEND_TIMEOUT_MS = 10000;
const CONCURRENCY = 5;

export const mailerConfigured = () =>
  Boolean(
    process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SENDER_EMAIL
  );

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email send timed out")), ms)
    ),
  ]);

const emptySummary = (extra = {}) => ({
  attempted: 0,
  sent: 0,
  failed: 0,
  skipped: false,
  ...extra,
});

// Sends a list of { to, subject, html } messages. NEVER throws - a failing
// email must not make the API request that triggered it fail.
export async function dispatch(messages) {
  const list = messages.filter((m) => m && m.to);
  if (list.length === 0) return emptySummary();
  if (!mailerConfigured()) {
    console.warn("[mail] SMTP_USER / SMTP_PASSWORD / SENDER_EMAIL not set - skipping emails");
    return emptySummary({ attempted: list.length, skipped: true });
  }

  const summary = emptySummary({ attempted: list.length });
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const chunk = list.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((m) =>
        withTimeout(
          transporter.sendMail({
            from: `"ClassWave" <${process.env.SENDER_EMAIL}>`,
            to: m.to,
            subject: m.subject,
            html: m.html,
            text: toText(m.html),
          }),
          SEND_TIMEOUT_MS
        )
      )
    );
    results.forEach((r) => {
      if (r.status === "fulfilled") summary.sent += 1;
      else {
        summary.failed += 1;
        console.error("[mail] failed:", r.reason?.message || r.reason);
      }
    });
  }
  return summary;
}

// Wrap any notifier so that a bug inside it can never break the request.
const safe =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[mail] ${fn.name} crashed:`, error);
      return emptySummary({ failed: 1 });
    }
  };

const validIds = (ids = []) =>
  [...new Set(ids.filter(Boolean).map(String))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );

const loadUsers = async (ids) => {
  const list = validIds(ids);
  if (list.length === 0) return [];
  return userModel.find({ _id: { $in: list } }).select("name email").lean();
};

const loadAdmins = async () =>
  userModel.find({ userType: "admin" }).select("name email").limit(10).lean();

const dashboardUrl = (tab) =>
  `${appUrl()}/studentdash${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`;

// ---------------------------------------------------------------------------
// Attendance statistics (only classes that have already started count)
// ---------------------------------------------------------------------------
export async function getAttendanceStats(studentId, now = new Date()) {
  const docs = await classSchedule
    .find({
      studentsEnrolled: String(studentId),
      classDate: { $lte: new Date(now.getTime() + 24 * 3600 * 1000) },
    })
    .select("classDate classTime classDuration attendance")
    .lean();
  const held = docs.filter((c) => classStart(c) <= now);
  const present = held.filter((c) => c.attendance === "Present").length;
  const rate = held.length ? Math.round((present / held.length) * 100) : null;
  return { held: held.length, present, absent: held.length - present, rate };
}

// ---------------------------------------------------------------------------
// 1. New class schedule created
// ---------------------------------------------------------------------------
export const notifyClassScheduled = safe(async function notifyClassScheduled({
  className,
  instructorId,
  studentsEnrolled = [],
  classLink,
  classDuration,
  weeklySchedule = [],
  weeks = 30,
}) {
  const [students, instructors] = await Promise.all([
    loadUsers(studentsEnrolled),
    loadUsers([instructorId]),
  ]);
  const instructor = instructors[0];

  const slots = weeklySchedule
    .filter((s) => s?.date && s?.time)
    .map((s) => {
      const first = new Date(s.date);
      const last = new Date(first);
      last.setUTCDate(first.getUTCDate() + (weeks - 1) * 7);
      return {
        weekday: new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "UTC" }).format(first),
        time: formatTime(s.time),
        first: formatDate({ classDate: first }),
        last: formatDate({ classDate: last }),
      };
    });

  const slotRows = slots
    .map(
      (s) => `<tr>
<td style="padding:9px 12px;border-bottom:1px solid #eef0f4;font-size:14px;color:#111827;font-weight:600;">${esc(s.weekday)}</td>
<td style="padding:9px 12px;border-bottom:1px solid #eef0f4;font-size:14px;color:#374151;">${esc(s.time)}</td>
<td style="padding:9px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#6b7280;">${esc(s.first)} → ${esc(s.last)}</td>
</tr>`
    )
    .join("");

  const build = (recipient, asInstructor) => {
    const body = `
${paragraph(
  asInstructor
    ? `A new class series has been scheduled and you are the instructor.`
    : `A new class has been scheduled for you. Here are the details so you can plan ahead.`
)}
${detailTable([
  { label: "Course / Class", value: esc(className) },
  { label: "Instructor", value: esc(instructor?.name || "To be announced") },
  { label: "Duration", value: esc(`${classDuration} hour(s) per session`) },
  { label: "Total sessions", value: esc(`${slots.length * weeks} (${weeks} weeks)`) },
])}
<p style="margin:18px 0 6px;color:#111827;font-size:14px;font-weight:700;">Weekly timetable</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f4;border-radius:8px;border-collapse:separate;overflow:hidden;">
<tr style="background:#f9fafb;">
<th align="left" style="padding:8px 12px;font-size:12px;color:#6b7280;">Day</th>
<th align="left" style="padding:8px 12px;font-size:12px;color:#6b7280;">Time</th>
<th align="left" style="padding:8px 12px;font-size:12px;color:#6b7280;">Runs</th>
</tr>${slotRows}</table>
${classLink ? button("Join class link", classLink) : ""}
${paragraph(`<span style="color:#6b7280;font-size:13px;">Tip: join 5 minutes early and keep your notebook ready.</span>`)}`;
    return {
      to: recipient.email,
      subject: `📅 New class scheduled: ${className}`,
      html: renderEmail({
        preheader: `${className} - ${slots.length} weekly slot(s)`,
        title: "New class scheduled",
        greetingName: recipient.name,
        bodyHtml: body,
        accent: "#4f46e5",
      }),
    };
  };

  const messages = students.map((s) => build(s, false));
  if (instructor && !students.some((s) => String(s._id) === String(instructor._id))) {
    messages.push(build(instructor, true));
  }
  return dispatch(messages);
});

// ---------------------------------------------------------------------------
// 2. Attendance marked
// ---------------------------------------------------------------------------
export const notifyAttendanceMarked = safe(async function notifyAttendanceMarked(cls) {
  const students = await loadUsers(cls.studentsEnrolled);
  const present = cls.attendance === "Present";

  const messages = [];
  for (const student of students) {
    const stats = await getAttendanceStats(student._id);
    const low =
      stats.rate !== null &&
      stats.held >= MIN_CLASSES_FOR_ALERT &&
      stats.rate < ATTENDANCE_ALERT_THRESHOLD;

    const body = `
${paragraph(
  present
    ? `Your attendance for the class below has been recorded. Great job staying consistent!`
    : `You were marked <strong>absent</strong> for the class below. If this is a mistake, please contact your instructor.`
)}
${detailTable([
  { label: "Class", value: esc(cls.className) },
  { label: "Date & time", value: esc(formatDateTime(cls)) },
  { label: "Status", value: badge(present ? "Present" : "Absent", present ? "green" : "red") },
  { label: "Topics covered", value: cls.topicCovered ? multiline(cls.topicCovered) : "" },
  { label: "Instructor notes", value: cls.notes ? multiline(cls.notes) : "" },
])}
${
  stats.held
    ? detailTable([
        { label: "Classes held so far", value: String(stats.held) },
        { label: "Attended", value: String(stats.present) },
        {
          label: "Attendance rate",
          value: `<strong>${stats.rate}%</strong> ${badge(low ? "Needs attention" : "On track", low ? "amber" : "green")}`,
        },
      ])
    : ""
}
${
  low
    ? callout(
        `<strong>Attendance alert:</strong> your attendance is <strong>${stats.rate}%</strong>, below the recommended ${ATTENDANCE_ALERT_THRESHOLD}%. Try not to miss the upcoming classes - you can find recorded topics and notes in your dashboard.`,
        "amber"
      )
    : ""
}
${button("View my attendance", dashboardUrl("attendance"))}`;

    messages.push({
      to: student.email,
      subject: present
        ? `✅ Attendance recorded: ${cls.className}`
        : `⚠️ Marked absent: ${cls.className}`,
      html: renderEmail({
        preheader: `${present ? "Present" : "Absent"} - ${formatDate(cls)}`,
        title: present ? "Attendance recorded" : "Absence recorded",
        greetingName: student.name,
        bodyHtml: body,
        accent: present ? "#059669" : "#dc2626",
      }),
    });
  }
  return dispatch(messages);
});

// ---------------------------------------------------------------------------
// 3. Homework assigned / submitted / reviewed
// ---------------------------------------------------------------------------
const PRIORITY_TONE = { high: "red", medium: "amber", low: "blue" };

export const notifyHomeworkAssigned = safe(async function notifyHomeworkAssigned(hw) {
  const [student] = await loadUsers([hw.studentId]);
  if (!student) return emptySummary();

  const body = `
${paragraph(`A new homework has been assigned to you. Please complete it before the due date.`)}
${detailTable([
  { label: "Title", value: `<strong>${esc(hw.homeworkTitle)}</strong>` },
  { label: "Type", value: esc(hw.homeworkType) },
  { label: "Priority", value: badge(hw.priority, PRIORITY_TONE[hw.priority] || "gray") },
  { label: "Due date", value: hw.dueDate ? esc(formatPlainDate(hw.dueDate)) : "" },
])}
<p style="margin:16px 0 6px;color:#111827;font-size:14px;font-weight:700;">Description</p>
${paragraph(multiline(hw.homeworkDescription))}
${hw.additionalNotes ? callout(`<strong>Note from instructor:</strong><br/>${multiline(hw.additionalNotes)}`, "blue") : ""}
${button("Open my homework", dashboardUrl("homework"))}`;

  return dispatch([
    {
      to: student.email,
      subject: `📝 New homework: ${hw.homeworkTitle}`,
      html: renderEmail({
        preheader: hw.dueDate ? `Due ${formatPlainDate(hw.dueDate)}` : "New homework assigned",
        title: "New homework assigned",
        greetingName: student.name,
        bodyHtml: body,
        accent: "#7c3aed",
      }),
    },
  ]);
});

export const notifyHomeworkSubmitted = safe(async function notifyHomeworkSubmitted(hw) {
  // Tell the class instructor; fall back to admins.
  let recipients = [];
  if (mongoose.Types.ObjectId.isValid(hw.classScheduleId)) {
    const cls = await classSchedule.findById(hw.classScheduleId).select("instructorId className").lean();
    if (cls?.instructorId) recipients = await loadUsers([cls.instructorId]);
  }
  if (recipients.length === 0) recipients = await loadAdmins();

  const body = `
${paragraph(`<strong>${esc(hw.studentName)}</strong> has submitted homework and it is waiting for your review.`)}
${detailTable([
  { label: "Homework", value: esc(hw.homeworkTitle) },
  { label: "Student", value: esc(hw.studentName) },
  { label: "Submitted", value: esc(formatPlainDate(hw.submittedAt || new Date())) },
  { label: "Student note", value: hw.submissionNote ? multiline(hw.submissionNote) : "" },
  {
    label: "Link",
    value: hw.submissionLink ? `<a href="${esc(hw.submissionLink)}" style="color:#4f46e5;">${esc(hw.submissionLink)}</a>` : "",
  },
  {
    label: "Attached PDF",
    value: hw.submissionFile?.url ? `<a href="${esc(hw.submissionFile.url)}" style="color:#4f46e5;">${esc(hw.submissionFile.originalName || "Open file")}</a>` : "",
  },
])}
${button("Review submission", `${appUrl()}/admin`)}`;

  return dispatch(
    recipients.map((r) => ({
      to: r.email,
      subject: `📥 Homework submitted: ${hw.homeworkTitle} (${hw.studentName})`,
      html: renderEmail({
        preheader: `${hw.studentName} submitted ${hw.homeworkTitle}`,
        title: "Homework submitted",
        greetingName: r.name,
        bodyHtml: body,
        accent: "#0891b2",
      }),
    }))
  );
});

export const notifyHomeworkReviewed = safe(async function notifyHomeworkReviewed(hw) {
  const [student] = await loadUsers([hw.studentId]);
  if (!student) return emptySummary();
  const done = hw.status === "completed";
  const body = `
${paragraph(
  done
    ? `Your instructor has reviewed your homework and marked it <strong>completed</strong>. Well done!`
    : `Your instructor has reviewed your homework. Please check the feedback below.`
)}
${detailTable([
  { label: "Homework", value: esc(hw.homeworkTitle) },
  { label: "Status", value: badge(hw.status, done ? "green" : "amber") },
])}
${hw.feedback ? callout(`<strong>Instructor feedback:</strong><br/>${multiline(hw.feedback)}`, done ? "green" : "amber") : ""}
${button("View in dashboard", dashboardUrl("homework"))}`;
  return dispatch([
    {
      to: student.email,
      subject: `${done ? "🎉" : "💬"} Homework reviewed: ${hw.homeworkTitle}`,
      html: renderEmail({
        preheader: done ? "Marked completed" : "Feedback available",
        title: "Homework reviewed",
        greetingName: student.name,
        bodyHtml: body,
        accent: done ? "#059669" : "#d97706",
      }),
    },
  ]);
});

// ---------------------------------------------------------------------------
// 4. Payment received
// ---------------------------------------------------------------------------
export const notifyPaymentReceived = safe(async function notifyPaymentReceived(classes) {
  const list = Array.isArray(classes) ? classes : [classes];
  if (list.length === 0) return emptySummary();

  // Group by student so each student gets one email for the whole batch
  const byStudent = new Map();
  list.forEach((c) =>
    (c.studentsEnrolled || []).forEach((sid) => {
      if (!byStudent.has(sid)) byStudent.set(sid, []);
      byStudent.get(sid).push(c);
    })
  );
  const students = await loadUsers([...byStudent.keys()]);

  const messages = students.map((student) => {
    const own = byStudent.get(String(student._id)) || [];
    const total = own.reduce((sum, c) => sum + (Number(c.classRate) || 0), 0);
    const rows = own
      .slice(0, 15)
      .map(
        (c) => `<tr>
<td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">${esc(c.className)}</td>
<td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#6b7280;">${esc(formatDate(c))}</td>
<td align="right" style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">₹${esc(c.classRate)}</td>
</tr>`
      )
      .join("");
    const body = `
${paragraph(`We have received your payment for the following class${own.length > 1 ? "es" : ""}. Thank you!`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f4;border-radius:8px;border-collapse:separate;overflow:hidden;margin:12px 0;">${rows}
<tr style="background:#f9fafb;"><td colspan="2" style="padding:10px 12px;font-size:14px;font-weight:700;color:#111827;">Total</td><td align="right" style="padding:10px 12px;font-size:14px;font-weight:700;color:#047857;">₹${total}</td></tr></table>
${own.length > 15 ? paragraph(`<span style="color:#6b7280;font-size:13px;">…and ${own.length - 15} more.</span>`) : ""}
${button("View payments", dashboardUrl("payment"))}`;
    return {
      to: student.email,
      subject: `💳 Payment received - ₹${total}`,
      html: renderEmail({
        preheader: `₹${total} received for ${own.length} class(es)`,
        title: "Payment received",
        greetingName: student.name,
        bodyHtml: body,
        accent: "#059669",
      }),
    };
  });
  return dispatch(messages);
});

// ---------------------------------------------------------------------------
// 5. Class note uploaded
// ---------------------------------------------------------------------------
export const notifyClassNoteUploaded = safe(async function notifyClassNoteUploaded(note) {
  const students = await loadUsers(note.studentsEnrolled);
  const body = `
${paragraph(`New study notes are available for one of your classes.`)}
${detailTable([
  { label: "Class", value: esc(`${note.className} - Class ${note.classNumber}`) },
  { label: "Notes", value: `<strong>${esc(note.title)}</strong>` },
  { label: "Details", value: note.description ? multiline(note.description) : "" },
])}
${button("View & download notes", dashboardUrl("resources"))}`;
  return dispatch(
    students.map((s) => ({
      to: s.email,
      subject: `📚 New notes: ${note.className} - Class ${note.classNumber}`,
      html: renderEmail({
        preheader: note.title,
        title: "New class notes available",
        greetingName: s.name,
        bodyHtml: body,
        accent: "#2563eb",
      }),
    }))
  );
});

// ---------------------------------------------------------------------------
// 6. Automated alerts (used by the daily job)
// ---------------------------------------------------------------------------
export const notifyClassReminder = safe(async function notifyClassReminder(cls) {
  const [students, instructor] = await Promise.all([
    loadUsers(cls.studentsEnrolled),
    loadUsers([cls.instructorId]),
  ]);
  const body = (name) => `
${paragraph(`Friendly reminder - your class starts soon.`)}
${detailTable([
  { label: "Class", value: `<strong>${esc(cls.className)}</strong>` },
  { label: "When", value: esc(formatDateTime(cls)) },
  { label: "Duration", value: esc(`${cls.classDuration} hour(s)`) },
])}
${cls.classLink ? button("Join class", cls.classLink) : ""}`;
  const all = [...students];
  if (instructor[0] && !all.some((s) => String(s._id) === String(instructor[0]._id))) all.push(instructor[0]);
  return dispatch(
    all.map((u) => ({
      to: u.email,
      subject: `⏰ Reminder: ${cls.className} at ${formatTime(cls.classTime)}`,
      html: renderEmail({
        preheader: formatDateTime(cls),
        title: "Class starting soon",
        greetingName: u.name,
        bodyHtml: body(u.name),
        accent: "#4f46e5",
      }),
    }))
  );
});

export const notifyHomeworkDeadline = safe(async function notifyHomeworkDeadline(hw, kind) {
  const [student] = await loadUsers([hw.studentId]);
  if (!student) return emptySummary();
  const overdue = kind === "overdue";
  const body = `
${paragraph(
  overdue
    ? `This homework is <strong>past its due date</strong> and has not been submitted yet. Please submit it as soon as possible or talk to your instructor.`
    : `This homework is due <strong>within 24 hours</strong>. Don't forget to submit it from your dashboard.`
)}
${detailTable([
  { label: "Homework", value: `<strong>${esc(hw.homeworkTitle)}</strong>` },
  { label: "Due date", value: esc(formatPlainDate(hw.dueDate)) },
  { label: "Status", value: badge(overdue ? "Overdue" : "Due soon", overdue ? "red" : "amber") },
])}
${button("Submit now", dashboardUrl("homework"))}`;
  return dispatch([
    {
      to: student.email,
      subject: `${overdue ? "🚨 Overdue" : "⏳ Due soon"}: ${hw.homeworkTitle}`,
      html: renderEmail({
        preheader: overdue ? "Homework overdue" : "Homework due within 24 hours",
        title: overdue ? "Homework overdue" : "Homework due soon",
        greetingName: student.name,
        bodyHtml: body,
        accent: overdue ? "#dc2626" : "#d97706",
      }),
    },
  ]);
});

export const notifyLowAttendance = safe(async function notifyLowAttendance(student, stats) {
  const body = `
${paragraph(`We noticed your attendance has dropped below the recommended level.`)}
${detailTable([
  { label: "Classes held", value: String(stats.held) },
  { label: "Attended", value: String(stats.present) },
  { label: "Attendance rate", value: `<strong>${stats.rate}%</strong> ${badge("Below " + ATTENDANCE_ALERT_THRESHOLD + "%", "amber")}` },
])}
${callout(`Regular attendance is the best predictor of progress. If something is making it hard to attend, please reach out to your instructor - we're happy to help.`, "amber")}
${button("View my attendance", dashboardUrl("attendance"))}`;
  return dispatch([
    {
      to: student.email,
      subject: `⚠️ Attendance alert: ${stats.rate}%`,
      html: renderEmail({
        preheader: `Your attendance is ${stats.rate}%`,
        title: "Attendance alert",
        greetingName: student.name,
        bodyHtml: body,
        accent: "#d97706",
      }),
    },
  ]);
});

// Used by the admin UI toast: "3 emails sent".
export const summaryText = (s) => {
  if (!s || s.attempted === 0) return "";
  if (s.skipped) return "Emails skipped (SMTP not configured)";
  if (s.failed > 0) return `${s.sent}/${s.attempted} emails sent`;
  return `${s.sent} email${s.sent === 1 ? "" : "s"} sent`;
};

// ---------------------------------------------------------------------------
// 7. Coding questions: assigned / submitted / reviewed
// ---------------------------------------------------------------------------
const LANG_LABEL = { javascript: "JavaScript", python: "Python", java: "Java", cpp: "C++", html: "HTML/CSS" };
const DIFF_TONE = { easy: "green", medium: "amber", hard: "red" };

export const notifyQuestionsAssigned = safe(async function notifyQuestionsAssigned(question, studentIds, dueDate) {
  const students = await loadUsers(studentIds);
  const body = (name) => `
${paragraph(`A new coding question has been assigned to you. Open it, write your solution in the built-in editor, run it and submit.`)}
${detailTable([
  { label: "Question", value: `<strong>${esc(question.title)}</strong>` },
  { label: "Language", value: esc(LANG_LABEL[question.language] || question.language) },
  { label: "Difficulty", value: badge(question.difficulty, DIFF_TONE[question.difficulty] || "gray") },
  { label: "Due date", value: dueDate ? esc(formatPlainDate(dueDate)) : "" },
])}
${button("Open the question", dashboardUrl("questions"))}`;
  return dispatch(
    students.map((s) => ({
      to: s.email,
      subject: `💻 New coding question: ${question.title}`,
      html: renderEmail({
        preheader: `${LANG_LABEL[question.language] || question.language} · ${question.difficulty}`,
        title: "New coding question",
        greetingName: s.name,
        bodyHtml: body(s.name),
        accent: "#7c3aed",
      }),
    }))
  );
});

export const notifyQuestionSubmitted = safe(async function notifyQuestionSubmitted(question, assignment, student) {
  let recipients = await loadUsers([question.createdBy]);
  if (recipients.length === 0) recipients = await loadAdmins();
  const last = assignment.submissions?.[assignment.submissions.length - 1];
  const match =
    last?.outputMatches === true
      ? badge("Output matches expected", "green")
      : last?.outputMatches === false
        ? badge("Output differs from expected", "amber")
        : badge("No text to compare", "gray");
  const body = `
${paragraph(`<strong>${esc(student?.name || "A student")}</strong> submitted a solution and it is waiting for your review.`)}
${detailTable([
  { label: "Question", value: esc(question.title) },
  { label: "Student", value: esc(student?.name || "") },
  { label: "Attempt", value: String(assignment.submissions?.length || 1) },
  { label: "Automatic check", value: match },
])}
${button("Review submission", `${appUrl()}/admin`)}`;
  return dispatch(
    recipients.map((r) => ({
      to: r.email,
      subject: `📥 Solution submitted: ${question.title} (${student?.name || "student"})`,
      html: renderEmail({
        preheader: `${student?.name || "A student"} submitted ${question.title}`,
        title: "Solution submitted",
        greetingName: r.name,
        bodyHtml: body,
        accent: "#0891b2",
      }),
    }))
  );
});

export const notifyQuestionReviewed = safe(async function notifyQuestionReviewed(question, assignment) {
  const [student] = await loadUsers([assignment.studentId]);
  if (!student) return emptySummary();
  const ok = assignment.status === "accepted";
  const body = `
${paragraph(ok ? `Your solution was <strong>accepted</strong>. Great work!` : `Your instructor reviewed your solution and it <strong>needs a little more work</strong>. Check the feedback, fix it and submit again.`)}
${detailTable([
  { label: "Question", value: esc(question.title) },
  { label: "Result", value: badge(ok ? "Accepted" : "Needs work", ok ? "green" : "amber") },
])}
${assignment.feedback ? callout(`<strong>Instructor feedback:</strong><br/>${multiline(assignment.feedback)}`, ok ? "green" : "amber") : ""}
${button(ok ? "View in dashboard" : "Fix and resubmit", dashboardUrl("questions"))}`;
  return dispatch([
    {
      to: student.email,
      subject: `${ok ? "🎉 Accepted" : "🔁 Needs work"}: ${question.title}`,
      html: renderEmail({
        preheader: ok ? "Solution accepted" : "Feedback available",
        title: ok ? "Solution accepted" : "Feedback on your solution",
        greetingName: student.name,
        bodyHtml: body,
        accent: ok ? "#059669" : "#d97706",
      }),
    },
  ]);
});
