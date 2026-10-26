import { runCode, runnerConfigured, supportedLanguages } from "../services/codeRunner.js";

// Tiny in-memory limiter: 15 runs / minute / user. (Per server instance, which
// is enough to stop accidental loops; use Redis if you need a hard guarantee.)
const hits = new Map();
const LIMIT = 15;
const WINDOW_MS = 60 * 1000;

const allowed = (userId) => {
  const now = Date.now();
  const recent = (hits.get(userId) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
};

export const runStatus = (req, res) => {
  res.status(200).json({
    success: true,
    configured: runnerConfigured(),
    languages: runnerConfigured() ? supportedLanguages() : [],
  });
};

export const executeCode = async (req, res) => {
  try {
    if (!allowed(req.userId)) {
      return res.status(429).json({
        success: false,
        message: "Too many runs. Please wait a few seconds and try again.",
      });
    }
    const { language, code, stdin } = req.body;
    const result = await runCode({ language, source: code, stdin });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 502).json({
      success: false,
      message: error.status ? error.message : `Code runner error: ${error.message}`,
    });
  }
};
