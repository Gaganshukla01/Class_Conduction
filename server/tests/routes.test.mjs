// Run: node tests/routes.test.mjs   - boots the real server (no DB needed) and checks route protection.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jwt = createRequire(root + "/")("jsonwebtoken");
let out = "", pass = 0, fail = 0;
const child = spawn("node", ["server.js"], { cwd: root, env: { ...process.env, PORT: "4777", MONGODB_URI: "mongodb://127.0.0.1:1/x", JWT_SECRET: "t", NODE_ENV: "development" } });
child.stdout.on("data", (d) => (out += d)); child.stderr.on("data", (d) => (out += d));
await new Promise((r) => setTimeout(r, 2000));
const check = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "✓" : "✗"} ${name}${cond ? "" : "  <- " + extra}`); };
const call = async (m, p, auth) => (await fetch("http://127.0.0.1:4777" + p, { method: m, headers: { "content-type": "application/json", ...(auth ? { Cookie: `token=${jwt.sign({ id: "64b000000000000000000001" }, "t")}` } : {}) }, body: m === "GET" || m === "DELETE" ? undefined : "{}", signal: AbortSignal.timeout(5000) })).status;
try {
  check("server boots and listens even without socket.io installed", /Server is running on port 4777/.test(out), out.slice(0, 300));
  const routes = [["GET", "/api/chat/messages"], ["POST", "/api/chat/messages"], ["DELETE", "/api/chat/messages/1"], ["POST", "/api/chat/read"], ["GET", "/api/chat/unread"], ["GET", "/api/chat/members"], ["POST", "/api/chat/migrate"],
    ["GET", "/api/question-folders"], ["POST", "/api/question-folders"], ["PUT", "/api/question-folders/1"], ["DELETE", "/api/question-folders/1"],
    ["POST", "/api/questions/assign-bulk"], ["PUT", "/api/questions/move"], ["GET", "/api/questions/review-queue"],
    ["GET", "/api/extra-classes"], ["GET", "/api/extra-classes/mine"], ["POST", "/api/extra-classes"], ["PUT", "/api/extra-classes/1/attendance"], ["PUT", "/api/extra-classes/1"], ["DELETE", "/api/extra-classes/1"]];
  for (const [m, p] of routes) { const s = await call(m, p, false); check(`${m} ${p} -> 401 without login`, s === 401, s); }
} finally { child.kill("SIGKILL"); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
