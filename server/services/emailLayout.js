// Shared, table-based (email-client safe) HTML layout for every ClassWave email.
// Inline styles only - Gmail/Outlook strip <style> blocks in many cases.

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

export const appUrl = () =>
  (
    process.env.FRONTEND_URL ||
    process.env.FRONTED_URL || // legacy spelling that exists in the current .env
    "https://class-conduction.vercel.app"
  ).replace(/\/+$/, "");

const TONES = {
  indigo: { bg: "#eef2ff", fg: "#4338ca", border: "#c7d2fe" },
  green: { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" },
  red: { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" },
  amber: { bg: "#fffbeb", fg: "#b45309", border: "#fde68a" },
  blue: { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" },
  gray: { bg: "#f3f4f6", fg: "#374151", border: "#e5e7eb" },
};

export const badge = (text, tone = "indigo") => {
  const t = TONES[tone] || TONES.indigo;
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${t.bg};color:${t.fg};border:1px solid ${t.border};font-size:12px;font-weight:600;">${esc(text)}</span>`;
};

export const button = (label, url, color = "#4f46e5") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:8px;background:${color};"><a href="${esc(url)}" target="_blank" style="display:inline-block;padding:12px 26px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${esc(label)}</a></td></tr></table>`;

export const callout = (html, tone = "amber") => {
  const t = TONES[tone] || TONES.amber;
  return `<div style="margin:18px 0;padding:14px 16px;border-radius:8px;background:${t.bg};border:1px solid ${t.border};color:${t.fg};font-size:14px;line-height:1.5;">${html}</div>`;
};

// rows: [{ label, value }]  - value is HTML (escape user text yourself with esc()).
export const detailTable = (rows) => {
  const body = rows
    .filter((r) => r && r.value !== undefined && r.value !== null && r.value !== "")
    .map(
      (r) => `<tr>
<td style="padding:10px 14px;border-bottom:1px solid #eef0f4;color:#6b7280;font-size:13px;width:38%;vertical-align:top;">${esc(r.label)}</td>
<td style="padding:10px 14px;border-bottom:1px solid #eef0f4;color:#111827;font-size:14px;font-weight:500;vertical-align:top;">${r.value}</td>
</tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eef0f4;border-radius:8px;border-collapse:separate;overflow:hidden;">${body}</table>`;
};

export const paragraph = (html) =>
  `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.65;">${html}</p>`;

// Turns user-entered multi-line text into safe HTML.
export const multiline = (text) => esc(text).replace(/\r?\n/g, "<br/>");

export function renderEmail({
  preheader = "",
  title,
  greetingName,
  bodyHtml,
  accent = "#4f46e5",
  footerNote = "",
}) {
  const greeting = greetingName
    ? `<p style="margin:0 0 14px;color:#111827;font-size:16px;font-weight:600;">Hi ${esc(greetingName)},</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(17,24,39,0.06);">
    <tr><td style="background:${accent};padding:22px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.2px;">ClassWave</td>
        <td align="right" style="color:rgba(255,255,255,0.85);font-size:12px;">Learn &middot; Practice &middot; Grow</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px 28px 8px;">
      <h1 style="margin:0 0 18px;color:#111827;font-size:22px;line-height:1.3;">${esc(title)}</h1>
      ${greeting}
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:8px 28px 26px;">
      <hr style="border:none;border-top:1px solid #eef0f4;margin:8px 0 16px;"/>
      <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${footerNote ? esc(footerNote) + "<br/>" : ""}This is an automated message from ClassWave. If something looks wrong, simply reply to this email or contact your instructor.</p>
    </td></tr>
  </table>
  <p style="margin:14px 0 0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} ClassWave</p>
</td></tr>
</table>
</body>
</html>`;
}

// Very small HTML -> text fallback so every email also has a text/plain part.
export const toText = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(br|\/p|\/tr|\/h1|\/div)\s*\/?>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&copy;/g, "©")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
