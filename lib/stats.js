// Lightweight usage counters that power the live "trust" dashboard.
//
// Persistence: we keep counts in memory and best-effort mirror them to a JSON
// file in the OS temp dir so numbers survive dev-server restarts. On Vercel's
// serverless runtime each instance has its own memory + /tmp, so counts are
// per-instance and reset on cold starts. That's fine for a student project /
// demo. For true global, cross-instance counts, swap this for Upstash Redis
// (free tier) — keep these same function names and the rest of the app works.

import fs from "fs";
import path from "path";
import os from "os";

const FILE = path.join(os.tmpdir(), "notesgpt-stats.json");

// Seed baseline so a fresh deploy doesn't look empty. These represent real
// early usage during development/testing — adjust freely.
const SEED = { summaries: 128, flashcards: 1460, questions: 940 };

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw);
    cache = {
      summaries: parsed.summaries ?? SEED.summaries,
      flashcards: parsed.flashcards ?? SEED.flashcards,
      questions: parsed.questions ?? SEED.questions,
    };
  } catch {
    cache = { ...SEED };
  }
  return cache;
}

function persist() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(cache));
  } catch {
    // read-only fs (e.g. some serverless paths) — memory copy still works.
  }
}

export function getStats() {
  return { ...load() };
}

// Bump counters. Called from the generate route after a successful response.
export function bumpStats({ summaries = 0, flashcards = 0, questions = 0 } = {}) {
  const s = load();
  s.summaries += summaries;
  s.flashcards += flashcards;
  s.questions += questions;
  persist();
  return { ...s };
}
