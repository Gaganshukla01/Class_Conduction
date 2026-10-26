import axios from "axios";

// ---------------------------------------------------------------------------
// Real code execution for the playground.
//
//  * JavaScript  -> sandboxed Web Worker (no DOM, no cookies, killed on timeout)
//  * Python      -> Pyodide (real CPython compiled to WebAssembly) in a Worker
//  * Java / C++  -> your own runner through the backend  (POST /api/code/run)
//
// The old editor "ran" Python by regex-matching print(...) and ran JavaScript
// with eval() inside the main page.
// ---------------------------------------------------------------------------

const PYODIDE_VERSION = "0.26.4";

// ------------------------------- JS worker ---------------------------------
// Exported as a string so it can be unit-tested outside a browser.
export const JS_WORKER_SOURCE = `
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const send = (m) => self.postMessage(m);

const fmt = (v) => {
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.stack ? String(v.stack).split("\\n")[0] : String(v);
  if (typeof v === "function") return String(v);
  if (typeof v === "undefined") return "undefined";
  if (typeof v === "symbol" || typeof v === "bigint") return String(v);
  if (typeof v === "object" && v !== null) {
    try { return JSON.stringify(v, (k, x) => (typeof x === "bigint" ? String(x) : x), 2); }
    catch (e) { return String(v); }
  }
  return String(v);
};

const errText = (err) => {
  if (!err || typeof err !== "object") return "Uncaught " + fmt(err);
  const name = err.name || "Error";
  let line = "";
  const stack = String(err.stack || "");
  // Chrome/Node: "...eval at <anonymous> (...), <anonymous>:3:6)"   Firefox: "AsyncFunction:3:6"
  const m = stack.match(/,\\s*<anonymous>:(\\d+):(\\d+)\\)/) || stack.match(/AsyncFunction:(\\d+):(\\d+)/);
  // AsyncFunction wraps the source in 2 extra lines
  if (m) line = " (line " + Math.max(1, Number(m[1]) - 2) + ")";
  return name + ": " + (err.message || "") + line;
};

self.onmessage = async (e) => {
  const { code, stdin } = e.data;
  const lines = String(stdin || "").split(/\\r?\\n/);
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  const out = (stream) => (...args) => send({ type: "out", stream, text: args.map(fmt).join(" ") });
  const console = {
    log: out("out"), info: out("out"), debug: out("out"), table: out("out"), dir: out("out"),
    error: out("err"), warn: out("err"), trace: out("err"),
  };

  // Track timers so "done" waits for setTimeout callbacks to run.
  const live = new Set();
  const _st = self.setTimeout.bind(self);
  const _ct = self.clearTimeout.bind(self);
  const setTimeout = (fn, ms, ...a) => {
    const id = _st(async () => {
      live.delete(id);
      try { if (typeof fn === "function") await fn(...a); }
      catch (err) { send({ type: "out", stream: "err", text: "Uncaught " + errText(err) }); }
    }, ms);
    live.add(id);
    return id;
  };
  const clearTimeout = (id) => { live.delete(id); _ct(id); };
  const alert = (m) => out("out")("Alert: " + fmt(m));
  const prompt = () => (lines.length ? lines.shift() : null);

  try {
    const fn = new AsyncFunction("console", "setTimeout", "clearTimeout", "alert", "prompt", code);
    await fn(console, setTimeout, clearTimeout, alert, prompt);
    while (live.size > 0) await new Promise((r) => _st(r, 10));
    send({ type: "done" });
  } catch (err) {
    send({ type: "error", text: errText(err) });
  }
};
`;

// ------------------------------ Python worker ------------------------------
const PY_WORKER_SOURCE = `
importScripts("https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js");
let pyodide = null;
const send = (m) => self.postMessage(m);

const cleanTraceback = (msg) => {
  const text = String(msg || "");
  const i = text.indexOf('File "<exec>"');
  if (i === -1) return text.trim();
  return ("Traceback (most recent call last):\\n  " + text.slice(i)).replace(/File "<exec>"/g, 'File "main.py"').trim();
};

self.onmessage = async (e) => {
  const { code, stdin } = e.data;
  try {
    if (!pyodide) {
      send({ type: "loading", text: "Loading Python runtime (first run only, ~10 MB)…" });
      pyodide = await loadPyodide();
    }
    const lines = String(stdin || "").split(/\\r?\\n/);
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    pyodide.setStdin({ stdin: () => (lines.length ? lines.shift() : undefined) });
    pyodide.setStdout({ batched: (s) => send({ type: "out", text: s }) });
    pyodide.setStderr({ batched: (s) => send({ type: "err", text: s }) });
    send({ type: "started" });
    try { await pyodide.loadPackagesFromImports(code); } catch (_) { /* ignore: import error shows below */ }
    // fresh namespace per run so variables from the last run do not leak
    const globals = pyodide.globals.get("dict")();
    try {
      await pyodide.runPythonAsync(code, { globals });
    } finally {
      globals.destroy();
    }
    send({ type: "done" });
  } catch (err) {
    send({ type: "error", text: cleanTraceback(err && err.message) });
  }
};
`;

const makeWorker = (source) => {
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  const worker = new Worker(url);
  return { worker, url };
};

const active = new Set(); // JS workers currently running
let pyWorker = null;
let pyCancel = null;

export function cancelAll() {
  active.forEach((cancel) => cancel());
  if (pyCancel) pyCancel();
}

// ------------------------------- JavaScript --------------------------------
export function runJavaScript(code, stdin = "", { timeoutMs = 5000 } = {}) {
  return new Promise((resolve) => {
    const start = performance.now();
    const { worker, url } = makeWorker(JS_WORKER_SOURCE);
    const out = [];
    const err = [];
    let finished = false;

    const finish = (extra) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      active.delete(cancel);
      resolve({ stdout: out.join("\n"), stderr: err.join("\n"), ms: Math.round(performance.now() - start), ...extra });
    };
    const cancel = () => finish({ success: false, cancelled: true, error: "Stopped." });
    active.add(cancel);

    const timer = setTimeout(
      () => finish({ success: false, error: `Time limit exceeded (${timeoutMs / 1000}s). Check for an infinite loop.` }),
      timeoutMs
    );

    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "out") (m.stream === "err" ? err : out).push(m.text);
      else if (m.type === "done") finish({ success: true });
      else if (m.type === "error") finish({ success: false, error: m.text });
    };
    worker.onerror = (e) => finish({ success: false, error: e.message || "The JavaScript worker crashed." });
    worker.postMessage({ code, stdin });
  });
}

// --------------------------------- Python ----------------------------------
export function runPython(code, stdin = "", { timeoutMs = 10000, loadTimeoutMs = 60000, onStatus } = {}) {
  return new Promise((resolve) => {
    if (!pyWorker) pyWorker = makeWorker(PY_WORKER_SOURCE).worker;
    const w = pyWorker;
    const out = [];
    const err = [];
    let start = performance.now();
    let timer;
    let finished = false;

    const arm = (ms, message) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        w.terminate(); // the only way to stop a Python infinite loop
        pyWorker = null;
        finish({ success: false, error: message });
      }, ms);
    };
    const finish = (extra) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      pyCancel = null;
      w.onmessage = null;
      w.onerror = null;
      resolve({ stdout: out.join("\n"), stderr: err.join("\n"), ms: Math.round(performance.now() - start), ...extra });
    };
    pyCancel = () => {
      w.terminate();
      pyWorker = null;
      finish({ success: false, cancelled: true, error: "Stopped." });
    };

    arm(loadTimeoutMs, "Could not load the Python runtime. Check your internet connection and try again.");
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === "loading") onStatus?.(m.text);
      else if (m.type === "started") {
        start = performance.now();
        arm(timeoutMs, `Time limit exceeded (${timeoutMs / 1000}s). Check for an infinite loop or a waiting input().`);
      } else if (m.type === "out") out.push(m.text);
      else if (m.type === "err") err.push(m.text);
      else if (m.type === "done") finish({ success: true });
      else if (m.type === "error") finish({ success: false, error: m.text });
    };
    w.onerror = () => {
      pyWorker = null;
      finish({
        success: false,
        error: "Python runtime failed to load. It is downloaded from cdn.jsdelivr.net on first use - check your internet connection.",
      });
    };
    w.postMessage({ code, stdin });
  });
}

// ------------------------------ Java / C++ / C -----------------------------
export async function runRemote({ language, code, stdin, backendUrl }) {
  const start = performance.now();
  try {
    const { data } = await axios.post(`${backendUrl}/api/code/run`, { language, code, stdin });
    const failed = data.compileError || (data.exitCode !== 0 && data.exitCode != null);
    return {
      success: !failed,
      stdout: data.stdout || "",
      stderr: data.stderr || "",
      compileError: data.compileError,
      exitCode: data.exitCode,
      ms: Math.round(performance.now() - start),
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.response?.data?.message || error.message || "Could not reach the code runner.",
      ms: Math.round(performance.now() - start),
    };
  }
}

// Turns any result into the text shown in the console.
export function formatResult(result, { language } = {}) {
  const parts = [];
  if (result.compileError) parts.push("⚠️ Compilation failed:");
  if (result.stdout) parts.push(result.stdout);
  if (result.stderr) parts.push(result.stderr);
  if (result.error) parts.push(result.error);
  if (parts.length === 0) {
    parts.push(
      result.success
        ? language === "python" || language === "javascript"
          ? "(program finished with no output — use print() / console.log() to see results)"
          : "(program finished with no output)"
        : "Program failed."
    );
  }
  if (!result.success && result.exitCode != null && result.exitCode !== 0 && !result.compileError) {
    parts.push(`\nexit code ${result.exitCode}`);
  }
  return parts.join("\n");
}
