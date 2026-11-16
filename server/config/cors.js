// Allowed browser origins come ONLY from environment variables - nothing is hard-coded.
//   FRONTEND_URL       https://classwave.in            (main site)
//   FRONTEND_URL_WWW   https://www.classwave.in        (optional second address)
//   CORS_ORIGINS       comma separated extras, "*" allowed as a wildcard, e.g.
//                      https://staging.classwave.in,https://*.vercel.app
// The www / non-www twin of every address is allowed automatically.
// http://localhost:5173 / 3000 / 5174 are allowed only when NODE_ENV is not "production".
const clean = (v) => String(v || "").trim().replace(/\/+$/, "");
const split = (v) => String(v || "").split(/[,\s]+/).map(clean).filter(Boolean);

const twin = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
    if (host.split(".").length < 2 || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname === "localhost") return null;
    return `${u.protocol}//${host}${u.port ? `:${u.port}` : ""}`;
  } catch {
    return null;
  }
};

export function buildOrigins(env = process.env) {
  const base = [
    ...split(env.FRONTEND_URL),
    ...split(env.FRONTED_URL), // old misspelled name, still honoured
    ...split(env.FRONTEND_URL_WWW),
    ...split(env.CORS_ORIGINS),
  ];
  if (env.NODE_ENV !== "production") base.push("http://localhost:5173", "http://localhost:5174", "http://localhost:3000");
  const exact = new Set();
  const patterns = [];
  for (const o of base) {
    if (o.includes("*")) {
      patterns.push(new RegExp(`^${o.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/.]+(?:\\.[^/.]+)*")}$`));
      continue;
    }
    exact.add(o);
    const t = twin(o);
    if (t) exact.add(t);
  }
  return { exact: [...exact], patterns };
}

export const isOriginAllowed = (origin, allowed = buildOrigins()) =>
  !origin || allowed.exact.includes(clean(origin)) || allowed.patterns.some((p) => p.test(clean(origin)));
