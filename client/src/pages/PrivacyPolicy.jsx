import { Link } from "react-router-dom";

// Public page (no login). Needed for the Google OAuth consent screen ("Privacy policy link").
// Replace CONTACT_EMAIL with the address students can write to.
const CONTACT_EMAIL = "your-email@example.com";
const UPDATED = "17 November 2026";

const Section = ({ title, children }) => (
  <section className="mb-7">
    <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
    <div className="text-gray-300 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-10">
        <Link to="/" className="text-sm text-cyan-300 hover:underline">← Back to ClassWave</Link>
        <h1 className="text-3xl font-bold text-white mt-4 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {UPDATED}</p>

        <Section title="About ClassWave">
          <p>ClassWave is an online class-management website used by an institute, its teachers and its students to schedule classes, share study material, mark attendance, chat and record fee payments.</p>
        </Section>

        <Section title="Information we collect">
          <p>Name, email address and password (stored securely, never in plain text), role (student, teacher, manager or admin), optional profile photo, the classes you are enrolled in or teach, attendance and homework records, chat messages, and fee payment records.</p>
        </Section>

        <Section title="How we use it">
          <p>To run your classes: show your timetable, send class reminders and receipts by email, let teachers and students communicate, and let administrators manage accounts and payments. We do not sell your data and we do not show advertisements.</p>
        </Section>

        <Section title="Google Meet and Google Calendar">
          <p>When a teacher or administrator chooses "Auto-generate Google Meet link", ClassWave uses the Google Calendar API, through the institute's own Google account, to create a calendar event with a Google Meet link. The event contains the class name, date, time, and the email addresses of the teacher and enrolled students so they receive the invitation and can join.</p>
          <p>ClassWave only creates, updates and deletes the class events it created. It does not read other calendar events, contacts or files. Students and teachers do not need to connect their own Google account to ClassWave.</p>
          <p>ClassWave's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.</p>
        </Section>

        <Section title="Who can see your information">
          <p>Administrators and managers can see all accounts. Teachers see their own students. Students see only their own records and conversations with their teachers. Service providers that help us operate the site (hosting, database, file storage and email delivery) process data on our behalf.</p>
        </Section>

        <Section title="Storage and security">
          <p>Data is stored with reputable cloud providers. Connections use HTTPS and sign-in uses secure cookies. No system is perfectly secure, but we take reasonable steps to protect your information.</p>
        </Section>

        <Section title="Your choices">
          <p>You can ask us to correct or delete your account and data at any time by writing to <a className="text-cyan-300 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </Section>

        <Section title="Changes">
          <p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
        </Section>
      </div>
    </div>
  );
}
