# ClassWave - setup & what changed

## 1. First-time setup (Windows `cmd`)

```
cd server
copy .env.example .env
npm install
npm run dev

cd ..\client
copy .env.example .env
npm install
npm run dev
```

Open the values in `server\.env` (see comments inside). Minimum to run: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`.
`FRONTED_URL` (old spelling) still works, but please rename it to `FRONTEND_URL`.

> **Security:** `server/.env` used to be shipped without a `.gitignore`. If it was ever pushed to GitHub or shared,
> rotate the MongoDB password, `JWT_SECRET` and the Brevo SMTP key.

## 2. Email notifications (Nodemailer + Brevo)

Set `SMTP_USER`, `SMTP_PASSWORD`, `SENDER_EMAIL` (a sender verified in Brevo). Emails are sent for:

| Trigger | Who gets it |
|---|---|
| New class schedule created (one email with the weekly timetable, not 30) | enrolled students + instructor |
| Attendance marked (with running attendance % and a low-attendance warning) | enrolled students |
| Homework assigned (with due date) | the student |
| Homework submitted | the class instructor (falls back to admins) |
| Homework reviewed / feedback | the student |
| Payment received (one receipt per student, even for batches) | enrolled students |
| New class notes uploaded | enrolled students |
| **Automated alerts** (daily job): class starting within 24 h, homework due soon / overdue, weekly low-attendance alert | students (+ instructor for reminders) |

Emails are awaited before the API responds (the API is hosted on Vercel serverless, which can freeze work that
continues after the response). A failing email never fails the request; the admin toast shows e.g. "3 emails sent".

### Automated alerts
1. Put any long random string in `CRON_SECRET`.
2. `server/vercel.json` already contains a daily Vercel Cron (03:30 UTC = 09:00 IST) calling `/api/jobs/daily`.
   Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically. Any other scheduler (cron-job.org, GitHub
   Actions) can call the same URL with that header.
3. Admins can also run it by hand: `POST /api/jobs/run` while logged in as admin.

## 3. PDF notes & Resource Library (Cloudinary, free plan, no AWS)

1. Create a free account at cloudinary.com and copy *Cloud name / API key / API secret* into `server\.env`.
2. **Important:** Cloudinary → Settings → Security → enable **"Allow delivery of PDF and ZIP files"**.
   Free accounts block PDF delivery until you do.
3. Files go **browser → Cloudinary** with a signed upload, so they never pass through the Vercel API (4.5 MB limit).
   Max 10 MB per PDF (Cloudinary free-plan limit).

* **Admin → Class Notes:** choose a class + session ("Class 3") and upload a PDF. Only enrolled students see it.
* **Admin → Resource Library:** create folders (Python, Web Dev…) and upload PDFs into them. All students can
  open or download them.
* **Student → Study Materials:** *Class Notes* and *Resource Library* (folder grid + search, in-app PDF viewer, download).

Files are public by URL (anyone who has the exact link can open it) but links are only handed out to logged-in users.

## 4. Code editor (Playground)

| Language | How it runs |
|---|---|
| Python | real CPython in the browser (Pyodide, downloaded from jsDelivr on first run) |
| JavaScript | sandboxed Web Worker (5 s time limit, no DOM). Code that uses `document`/`window` runs in the Live Preview with your HTML + CSS |
| HTML / CSS | Live Preview (HTML + CSS + the JavaScript tab together) |
| Java / C++ | your own runner via the backend (see below) |

An **Input (stdin)** box feeds `input()` / `Scanner` / `cin` / `prompt()`. **Stop** cancels a running program.

**Java / C++ runner.** The public Piston API stopped being free on 15 Feb 2026, so configure one of:
* Self-hosted Piston: `docker run --privileged -v %cd%:/piston -dit -p 2000:2000 ghcr.io/engineer-man/piston`
  then `CODE_RUNNER_PROVIDER=piston`, `CODE_RUNNER_URL=http://localhost:2000`
  (install runtimes with the Piston CLI).
* Judge0 (self-hosted or RapidAPI): `CODE_RUNNER_PROVIDER=judge0`, `CODE_RUNNER_URL=...`, `CODE_RUNNER_KEY=...`
  (`CODE_RUNNER_RAPIDAPI_HOST` for RapidAPI).

Without it, Java/C++ show a clear "runner not configured" message instead of pretending to run. Java's public class must be `Main`.

## 5. Bugs fixed

* **Admin panel needed a manual refresh** - data was only loaded on page load; now it loads as soon as a user is known
  (login included), refreshes silently after add/attendance/payment/homework changes, clears on logout, and an expired
  session returns you to login.
* Attendance % counted all 30 *future* weekly classes (week 2 showed ~7 %). Only classes that already happened count now.
* `ProgressTab` called a hook after an early `return` (Rules of Hooks); student dashboard used an undefined `CheckCircle`.
* Homework "Submit" was a stub (undefined function, dead file input, status `submitted` missing from the schema).
* Schema silently dropped `weekNumber`, `seriesId`, `originalDate`, `paymentUpdatedAt`.
* `getAllClasses` returned 404 for "no classes", leaving the admin panel on "loading" forever.
* Payment tab sent one request (and would now send one email) per class - now one batch request.
* `ResetPassword` crashed in its `catch` blocks (`data` undefined) and treated failures as success.
* Free classes (`classRate = 0`) were rejected as "missing field".
* Search notes: user input went straight into a regex (ReDoS) - now escaped.

### Security fixes
* `PUT /api/user/usertypeupdate` had **no authentication** - anyone could make any account an admin. Now admin-only.
* Course add/update/delete, class schedule, attendance, payment, homework create/update/delete, user list: admin-only.
* Students only receive their own classes / homework / notes (previously every student received everything).
* Notes endpoints check ownership; the user id always comes from the JWT, never from the request body.

## 6. New feature: homework submissions + review
Homework now has an optional **due date**. Students submit a note, a link and/or a PDF from their dashboard;
the instructor is emailed, reviews it (feedback + "Approve & complete") and the student is emailed back. Overdue
homework is flagged automatically by the daily job.

## 7. Student dashboard
Attendance and Progress were redesigned with charts: attendance gauge, current/best streak, monthly present-vs-absent,
8-week trend with the 75 % target line, per-course bars, recent classes, course journey, homework donut, "to do next"
list and achievement badges. A low-attendance banner tells the student how many classes in a row bring them back to 75 %.
Tabs scroll on mobile, and email links open the right tab (`/studentdash?tab=attendance`).

## 8. Code Questions (question bank + assignments + review)

**Admin → Code Questions**
* **New question**: title, language (Python, JavaScript, Java, C++, HTML/CSS), difficulty, the question text, optional
  starter code (a template is offered per language), optional sample input, tags and the **desired result as text,
  an image, or both**. Use **Save & add another** to create many questions in a row. Edit / Duplicate / Delete each one.
* The questions live in a **reusable bank**. Click **Assign** on any question, tick one or many students (or "Select all"),
  optionally set a due date. You can assign the same question again later to other students - students who already have
  it are shown as "Already assigned" and are skipped. Each student gets an email.
* Click the Assigned / To review / Accepted counter to open **submissions**: the student's code, their output next to the
  expected result (with an automatic "matches / differs" badge when you gave expected text), their optional screenshot,
  then **Accept** or **Needs work** with feedback (required for Needs work). The student is emailed.

**Student → Code Questions**
* A list of assigned questions (filters: To do / Needs work / Submitted / Accepted).
* Opening one shows the question, sample input and the expected result (text and/or image, click to enlarge) next to a
  code editor (line numbers, Tab key, auto-saved draft) with Run / Stop / stdin / output - the same real runners as the
  Playground. HTML/CSS questions get a live preview. They must run their latest code before submitting so the output
  submitted matches the code. An optional screenshot can be attached (paste with Ctrl+V works). After *Needs work* they
  can fix and resubmit (up to 20 attempts); accepted questions are locked.

Notes: the automatic output check is advisory (the output is produced in the student's browser, so a determined student
could edit it) - the instructor always sees the code and can re-run it. Image uploads use the same Cloudinary account
(PNG/JPG/GIF/WebP, max 5 MB) and need no extra setting.

## 9. Tests that were run
Server: 113+ automated checks (incl. 25 for Code Questions and auth on 11 more routes) (signature vs Cloudinary's documented example, mail rendering/escaping/failure handling,
auth on 15 routes, runner providers + rate limit, controller logic with stubbed models, alert windows/dedupe).
Client: formulas, worker logic, ESLint (no undefined identifiers in `src`) and server-side rendering of every new
screen. **Not tested here** (no MongoDB / internet in the sandbox): real MongoDB queries, real SMTP delivery, a real
Cloudinary upload, Pyodide download, and a full `vite build` - please run `npm run build` once on your machine.
