// Public review wall storage.
//
// Same persistence model as lib/stats.js: in-memory with a best-effort JSON
// mirror in the OS temp dir. On Vercel each serverless instance has its own
// /tmp, so reviews are per-instance and can reset on cold starts — fine for a
// student project. For durable, global reviews swap this for Upstash Redis or
// Vercel KV; keep the same function names and the rest of the app works.

import fs from "fs";
import path from "path";
import os from "os";

const FILE = path.join(os.tmpdir(), "notesgpt-reviews.json");
const MAX_REVIEWS = 60; // keep the newest N

// A few seed reviews so the wall never looks empty on a fresh instance.
const SEED = [
  { id: "seed-3", name: "Ishaan R.", tag: "EEE, 3rd year", rating: 5, text: "Pasted my control systems notes 20 minutes before a class test. The quiz caught exactly the two topics I'd skipped.", at: 1751190000000 },
  { id: "seed-2", name: "Meera V.", tag: "CSE, 2nd year", rating: 4, text: "Flashcards are genuinely good — not just definitions, they explain the why. Wish I could save decks between visits.", at: 1750930000000 },
  { id: "seed-1", name: "Kabir S.", tag: "Mech, final year", rating: 5, text: "The custom difficulty is the best part. 'numericals only, exam style' actually works.", at: 1750600000000 },
];

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    cache = Array.isArray(parsed) && parsed.length ? parsed : [...SEED];
  } catch {
    cache = [...SEED];
  }
  return cache;
}

function persist() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(cache));
  } catch {
    // read-only fs — memory copy still serves this instance.
  }
}

export function getReviews() {
  return [...load()];
}

export function addReview({ name, tag, rating, text }) {
  const list = load();
  const review = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    tag,
    rating,
    text,
    at: Date.now(),
  };
  list.unshift(review);
  if (list.length > MAX_REVIEWS) list.length = MAX_REVIEWS;
  persist();
  return review;
}
