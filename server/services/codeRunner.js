// Remote code execution for compiled languages (Java, C++, C).
//
// The public Piston instance (emkc.org) stopped being free on 15 Feb 2026, so
// this module talks to *your* runner, configured by environment variables:
//
//   CODE_RUNNER_PROVIDER = piston | judge0
//   CODE_RUNNER_URL      = e.g. http://localhost:2000   (self-hosted Piston)
//                          or   https://judge0-ce.p.rapidapi.com
//   CODE_RUNNER_KEY      = optional API key (Piston: Authorization header,
//                          Judge0: X-Auth-Token / X-RapidAPI-Key)
//   CODE_RUNNER_RAPIDAPI_HOST = only for RapidAPI-hosted Judge0
//
// Python and JavaScript are executed inside the browser (Pyodide / Web Worker)
// so they never need this service.

const PROVIDER = () => (process.env.CODE_RUNNER_PROVIDER || "").toLowerCase();
const BASE_URL = () => (process.env.CODE_RUNNER_URL || "").replace(/\/+$/, "");

export const runnerConfigured = () =>
  Boolean(BASE_URL() && ["piston", "judge0"].includes(PROVIDER()));

const LANGUAGES = {
  java: { piston: "java", judge0: 62, file: "Main.java" },
  cpp: { piston: "c++", judge0: 54, file: "main.cpp" },
  c: { piston: "c", judge0: 50, file: "main.c" },
  python: { piston: "python", judge0: 71, file: "main.py" },
  javascript: { piston: "javascript", judge0: 63, file: "main.js" },
};

export const supportedLanguages = () => Object.keys(LANGUAGES);

const MAX_SOURCE = 64 * 1024;
const MAX_STDIN = 10 * 1024;
const MAX_OUTPUT = 20000;

const clip = (text = "") =>
  text.length > MAX_OUTPUT ? text.slice(0, MAX_OUTPUT) + "\n…output truncated…" : text;

async function runPiston(lang, source, stdin) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.CODE_RUNNER_KEY) headers.Authorization = process.env.CODE_RUNNER_KEY;
  const res = await fetch(`${BASE_URL()}/api/v2/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      language: lang.piston,
      version: "*",
      files: [{ name: lang.file, content: source }],
      stdin,
      compile_timeout: 10000,
      run_timeout: 5000,
    }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Runner responded with ${res.status}`);
  const compile = data.compile || {};
  const run = data.run || {};
  const compileFailed = compile.code !== undefined && compile.code !== 0;
  return {
    stdout: clip(run.stdout || ""),
    stderr: clip(compileFailed ? compile.stderr || compile.output : run.stderr || ""),
    compileError: compileFailed,
    exitCode: compileFailed ? compile.code : run.code,
    signal: run.signal || null,
  };
}

async function runJudge0(lang, source, stdin) {
  const headers = { "Content-Type": "application/json" };
  const key = process.env.CODE_RUNNER_KEY;
  const host = process.env.CODE_RUNNER_RAPIDAPI_HOST;
  if (key && host) {
    headers["X-RapidAPI-Key"] = key;
    headers["X-RapidAPI-Host"] = host;
  } else if (key) {
    headers["X-Auth-Token"] = key;
  }
  const res = await fetch(
    `${BASE_URL()}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: source,
        language_id: lang.judge0,
        stdin,
        cpu_time_limit: 5,
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Runner responded with ${res.status}`);
  const compileError = data.status?.id === 6; // Compilation Error
  return {
    stdout: clip(data.stdout || ""),
    stderr: clip(compileError ? data.compile_output || "" : data.stderr || data.message || ""),
    compileError,
    exitCode: data.exit_code ?? (data.status?.id === 3 ? 0 : 1),
    signal: data.exit_signal ?? null,
    status: data.status?.description,
  };
}

export async function runCode({ language, source, stdin = "" }) {
  const lang = LANGUAGES[language];
  if (!lang) throw Object.assign(new Error(`Unsupported language: ${language}`), { status: 400 });
  if (typeof source !== "string" || !source.trim())
    throw Object.assign(new Error("No source code provided."), { status: 400 });
  if (source.length > MAX_SOURCE)
    throw Object.assign(new Error("Source code is too large (max 64 KB)."), { status: 413 });
  if (String(stdin).length > MAX_STDIN)
    throw Object.assign(new Error("Input is too large (max 10 KB)."), { status: 413 });
  if (!runnerConfigured())
    throw Object.assign(
      new Error("Code runner is not configured on the server (see CODE_RUNNER_* in .env.example)."),
      { status: 503 }
    );

  return PROVIDER() === "judge0"
    ? runJudge0(lang, source, String(stdin))
    : runPiston(lang, source, String(stdin));
}
