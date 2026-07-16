"use client";

/* Page-filling extras:
   - SideRails: decorative rails pinned to both screen edges (fills side gaps)
   - MarqueeBand: full-bleed tilted accent band with scrolling words
   - Testimonials: student quote wall
   - FAQ: animated accordion                                          */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Plus, Star, Send } from "lucide-react";
import { SplitWords, Scribble } from "./TextFX";

const EASE = [0.22, 1, 0.36, 1];
const up = (delay = 0, y = 18) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: EASE, delay },
});

/* ================================================================== */
/*  SideRails — pinned decorations on both edges of the viewport      */
/* ================================================================== */

const LEFT_WORDS = "SUMMARIZE · FLASHCARDS · QUIZ · GLOSSARY · REVISE · ";

export function SideRails() {
  return (
    <>
      {/* left rail — vertical scrolling wordmark */}
      <div className="pointer-events-none fixed inset-y-0 left-0 z-[3] hidden w-14 items-center justify-center overflow-hidden xl:flex">
        <div className="animate-rail flex flex-col items-center gap-0 whitespace-nowrap">
          {[0, 1].map((k) => (
            <span
              key={k}
              className="font-mono text-[10px] uppercase tracking-[0.5em] text-ink/25"
              style={{ writingMode: "vertical-rl" }}
            >
              {LEFT_WORDS.repeat(3)}
            </span>
          ))}
        </div>
        <span className="absolute bottom-8 h-16 w-px bg-gradient-to-b from-transparent to-accent/40" />
      </div>

      {/* right rail — floating study objects */}
      <div className="pointer-events-none fixed inset-y-0 right-0 z-[3] hidden w-20 flex-col items-center justify-center gap-8 xl:flex">
        <div className="animate-drift rotate-6 rounded-xl border border-ink/10 bg-white/70 px-2.5 py-2 text-center shadow-sm backdrop-blur">
          <p className="text-base">🃏</p>
          <p className="font-mono text-[8px] uppercase tracking-wider text-ink/40">cards</p>
        </div>
        <div className="animate-drift -rotate-3 rounded-xl border border-ink/10 bg-white/70 px-2.5 py-2 text-center shadow-sm backdrop-blur" style={{ animationDelay: "2.5s" }}>
          <p className="text-base">🎯</p>
          <p className="font-mono text-[8px] uppercase tracking-wider text-ink/40">quiz</p>
        </div>
        <div className="animate-drift rotate-2 rounded-xl border border-accent/25 bg-accent/10 px-2.5 py-2 text-center shadow-sm backdrop-blur" style={{ animationDelay: "5s" }}>
          <p className="text-base font-semibold text-accent">A+</p>
          <p className="font-mono text-[8px] uppercase tracking-wider text-accent/60">goal</p>
        </div>
        <span className="absolute top-1/2 -z-[1] h-48 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-ink/10 to-transparent" />
      </div>
    </>
  );
}

/* ================================================================== */
/*  MarqueeBand — full-bleed tilted accent ribbon                     */
/* ================================================================== */

const BAND = ["Summarize", "✦", "Flashcards", "✦", "Quiz", "✦", "Glossary", "✦", "Read aloud", "✦", "Export", "✦"];

export function MarqueeBand() {
  const loop = [...BAND, ...BAND, ...BAND];
  return (
    <div className="relative left-1/2 mt-28 w-screen -translate-x-1/2 md:mt-36" aria-hidden>
      <motion.div {...up(0, 24)} className="-rotate-[1.6deg]">
        <div className="edge-fade overflow-hidden bg-ink py-4 shadow-lg">
          <div className="animate-marquee flex w-max items-center gap-8">
            {loop.map((w, i) => (
              <span
                key={i}
                className={w === "✦" ? "text-accent" : "serif text-2xl italic text-paper/90 md:text-3xl"}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
        <div className="edge-fade -mt-1 overflow-hidden bg-accent/90 py-2.5">
          <div className="animate-marquee-rev flex w-max items-center gap-10">
            {loop.map((w, i) => (
              <span key={i} className="font-mono text-[11px] uppercase tracking-[0.3em] text-paper/80">
                {w === "✦" ? "·" : w}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Testimonials — student quote wall                                 */
/* ================================================================== */

const QUOTES = [
  ["Uploaded 60 pages of thermo notes at 11pm. Had a summary, cards and a quiz before my chai got cold.", "Priya S.", "Mechanical, 3rd year", "-rotate-1"],
  ["The custom quiz difficulty is unreal. I type 'numericals only' and it just… does that.", "Arjun M.", "ECE, 2nd year", "rotate-1"],
  ["I stopped rewriting notes entirely. Paste, generate, revise on the bus.", "Sneha K.", "CSE, final year", "-rotate-[0.5deg]"],
  ["Flashcards flip like a real deck and the glossary saved me in viva.", "Rahul D.", "Civil, 3rd year", "rotate-[1.5deg]"],
  ["Read-aloud summaries while cooking dinner. Multitasking unlocked.", "Ananya T.", "Biotech, 1st year", "rotate-[0.5deg]"],
  ["Endless quiz questions means I can't memorise the answers. Annoying. Effective.", "Vikram J.", "IT, 2nd year", "-rotate-[1.2deg]"],
];

export function Testimonials() {
  return (
    <section className="mt-28 md:mt-36">
      <div className="mb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">word on campus</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          <SplitWords text="Students are" />{" "}
          <Scribble><span className="serif italic text-accent">talking</span></Scribble>.
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUOTES.map(([q, name, tag, tilt], i) => (
          <motion.figure
            key={name}
            {...up(i * 0.07, 22)}
            whileHover={{ rotate: 0, y: -4 }}
            className={`surface rounded-3xl p-6 ${tilt}`}
          >
            <Quote className="h-5 w-5 text-accent/50" />
            <blockquote className="mt-3 text-[15px] leading-relaxed text-ink/80">{q}</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/12 text-sm font-semibold text-accent">
                {name[0]}
              </span>
              <span>
                <span className="block text-sm font-semibold">{name}</span>
                <span className="block text-xs text-ink/45">{tag}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* ================================================================== */
/*  FAQ — animated accordion                                          */
/* ================================================================== */

const FAQS = [
  ["What kind of files can I upload?", "Text-based PDFs up to 10 MB, or just paste your notes directly. Scanned/photo PDFs aren't supported yet — if the PDF has selectable text, it works."],
  ["Is it actually free?", "Yes. NotesGPT runs on Groq's blazing-fast llama-3.3 model, and there's no account, no paywall, no card."],
  ["How does the quiz difficulty work?", "Pick easy, medium, hard, a mix — or type your own instruction like 'numericals only' or 'conceptual traps'. The AI writes fresh questions to match."],
  ["Are my notes stored anywhere?", "No. Your notes are processed to generate the study material and are never saved on a server. Recent-upload history lives only in your own browser."],
  ["Can I keep generating more?", "Endlessly. 'More cards' and 'New questions' always exclude what you've already seen, so every batch is fresh."],
  ["Does it work on my phone?", "Fully responsive — upload on your laptop, revise the same way on your phone on the bus."],
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section className="mt-28 md:mt-36">
      <div className="mb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">questions</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          <SplitWords text="Asked all the" /> <span className="serif italic text-accent">time</span>.
        </h2>
      </div>
      <div className="mx-auto max-w-2xl space-y-3">
        {FAQS.map(([q, a], i) => {
          const open = openIdx === i;
          return (
            <motion.div key={q} {...up(i * 0.05)} className="surface overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpenIdx(open ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="font-medium">{q}</span>
                <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}>
                  <Plus className={`h-4 w-4 shrink-0 ${open ? "text-accent" : "text-ink/40"}`} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-ink/60">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ================================================================== */
/*  ReviewWall — visitors write reviews; everyone sees them           */
/* ================================================================== */

function Stars({ value, onChange, size = "h-5 w-5" }) {
  const interactive = !!onChange;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? "transition hover:scale-110" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "fill-none text-ink/20"}`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 60000);
  if (d < 1) return "just now";
  if (d < 60) return `${d}m ago`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ReviewWall() {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setMsg("");
    if (text.trim().length < 10) {
      setMsg("Please write at least a short sentence.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tag, text, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post your review.");
      setReviews(data.reviews || []);
      setText("");
      setMsg("Thanks! Your review is live. ✦");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";
  const visible = showAll ? reviews : reviews.slice(0, 6);

  return (
    <section id="reviews" className="mt-28 scroll-mt-24 md:mt-36">
      <div className="mb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">reviews</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          <SplitWords text="Leave your" />{" "}
          <Scribble><span className="serif italic text-accent">mark</span></Scribble>.
        </h2>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink/55">
          <Stars value={Math.round(Number(avg))} size="h-4 w-4" />
          <span className="font-semibold text-ink">{avg}</span>
          <span>· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* write a review */}
      <motion.form
        {...up(0.05, 22)}
        onSubmit={submit}
        className="surface mx-auto max-w-2xl rounded-[28px] p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium">How was NotesGPT for you?</p>
          <Stars value={rating} onChange={setRating} />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={400}
          placeholder="Tell other students what worked (or what didn't)…"
          className="mt-4 h-24 w-full resize-y rounded-2xl border border-ink/10 bg-ink/[0.02] p-4 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-accent/50 focus:bg-ink/[0.04]"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Your name (optional)"
            className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/30 focus:border-accent/50"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            maxLength={40}
            placeholder="Branch / year — e.g. CSE, 2nd year (optional)"
            className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/30 focus:border-accent/50"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="btn-ink flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Post review"}
          </button>
          <AnimatePresence>
            {msg && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-sm ${msg.startsWith("Thanks") ? "text-accent" : "text-red-600"}`}
              >
                {msg}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.form>

      {/* the wall */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {visible.map((r, i) => (
            <motion.figure
              key={r.id}
              layout
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: EASE, delay: (i % 3) * 0.06 }}
              className="surface rounded-3xl p-6"
            >
              <div className="flex items-center justify-between">
                <Stars value={r.rating || 5} size="h-3.5 w-3.5" />
                <span className="font-mono text-[10px] text-ink/35">{timeAgo(r.at)}</span>
              </div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-ink/80">
                {r.text}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/12 text-sm font-semibold text-accent">
                  {(r.name || "A")[0].toUpperCase()}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{r.name || "Anonymous"}</span>
                  {r.tag && <span className="block text-xs text-ink/45">{r.tag}</span>}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </AnimatePresence>
      </div>

      {reviews.length > 6 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll((s) => !s)}
            className="btn-soft rounded-full px-6 py-2.5 text-sm font-medium"
          >
            {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
          </button>
        </div>
      )}
    </section>
  );
}
