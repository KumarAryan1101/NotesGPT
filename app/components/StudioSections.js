"use client";

/* Extra content sections for the /study page so it reads like a real
   workspace, not a lone form: a 3-step how-strip, recent sessions pulled
   from localStorage, live community stats, and a study-tips carousel.
   Everything is light (no images, no heavy libs) and mobile-first.      */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FileText, Brain, Layers, Sparkles, Clock, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---- 1. How the studio works — 3 steps with a drawing connector ---- */
export function HowStrip() {
  const steps = [
    { icon: FileText, t: "Drop anything in", d: "PDF, pasted text, a photo of the board, or just talk." },
    { icon: Brain, t: "AI reads & distills", d: "Groq-powered models pull out what actually matters." },
    { icon: Layers, t: "Study three ways", d: "Summary to skim, flashcards to drill, quizzes to prove it." },
  ];
  return (
    <section className="mx-auto mt-20 max-w-5xl md:mt-28">
      <Reveal className="mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">how the studio works</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Three steps. <span className="serif italic text-accent">Zero friction.</span>
        </h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        {steps.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -4 }}
              className="surface relative h-full rounded-3xl p-6"
            >
              <span className="absolute right-5 top-4 font-mono text-4xl font-semibold text-ink/8">
                0{i + 1}
              </span>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                <s.icon size={20} />
              </div>
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{s.d}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---- 2. Recent sessions (localStorage "ng-recent") ---- */
export function RecentSessions({ refreshKey = 0, onNew }) {
  const [recents, setRecents] = useState([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("ng-recent") || "[]");
      setRecents(Array.isArray(raw) ? raw.slice(0, 4) : []);
    } catch {
      setRecents([]);
    }
  }, [refreshKey]);

  if (!recents.length) return null;

  return (
    <section className="mx-auto mt-20 max-w-3xl md:mt-24">
      <Reveal>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">pick up where you left off</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Your recent sets</h2>
          </div>
          <Clock size={20} className="text-ink/30" />
        </div>
        <div className="space-y-2.5">
          {recents.map((r, i) => {
            const today = new Date(r.at).toDateString() === new Date().toDateString();
            return (
              <motion.button
                key={r.at || i}
                onClick={onNew}
                whileHover={{ x: 4 }}
                className="surface flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.t || "Untitled notes"}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink/40">
                    {r.c || 0} cards · {r.q || 0} questions · {today ? "today" : "earlier"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-700">
                  ready
                </span>
              </motion.button>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

/* ---- 3. Live community stats band ---- */
export function StatsBand({ refreshKey = 0 }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setStats(j))
      .catch(() => {});
  }, [refreshKey]);

  const items = [
    { k: "sets", label: "study sets generated", v: stats?.summaries },
    { k: "cards", label: "flashcards created", v: stats?.flashcards },
    { k: "qs", label: "quiz questions asked", v: stats?.questions },
  ];

  return (
    <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 bg-ink py-10 text-paper md:mt-28 md:py-14">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-5 text-center">
        {items.map((it, i) => (
          <Reveal key={it.k} delay={i * 0.1}>
            <p className="font-mono text-2xl font-semibold text-white md:text-4xl">
              {typeof it.v === "number" ? it.v.toLocaleString() : "—"}
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-white/45 md:text-xs">
              {it.label}
            </p>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        <Sparkles size={11} className="mr-1 inline-block" /> counted live across all users
      </p>
    </section>
  );
}

/* ---- 4. Study-tips carousel ---- */
const TIPS = [
  { t: "Test, don't reread", d: "Recalling from memory (flashcards, quizzes) beats passive rereading by ~50% in retention studies." },
  { t: "Space it out", d: "Come back to the same deck tomorrow, then in 3 days. Spacing is the single biggest memory multiplier." },
  { t: "Use the timer", d: "25 focused minutes then a 5-minute break — the Pomodoro pill lives at the bottom-right for exactly this." },
  { t: "Teach it back", d: "After the summary, close the tab and explain the topic aloud. Gaps you hear are gaps to re-study." },
  { t: "Shuffle the deck", d: "Study mode shuffles your cards — interleaving topics feels harder but sticks far better." },
];

export function TipsCarousel() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (d) => {
    setDir(d);
    setIdx((i) => (i + d + TIPS.length) % TIPS.length);
  };

  useEffect(() => {
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, []);

  const tip = TIPS[idx];

  return (
    <section className="mx-auto mt-20 max-w-2xl md:mt-24">
      <Reveal>
        <div className="surface relative overflow-hidden rounded-[28px] p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-700">
              <Lightbulb size={12} /> study smarter
            </span>
            <span className="font-mono text-xs text-ink/35">
              {idx + 1} / {TIPS.length}
            </span>
          </div>

          <div className="relative min-h-[96px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={idx}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <h3 className="serif text-xl italic text-accent md:text-2xl">{tip.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60 md:text-base">{tip.d}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Tip ${i + 1}`}
                  onClick={() => {
                    setDir(i > idx ? 1 : -1);
                    setIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-accent" : "w-1.5 bg-ink/15"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => go(-1)} aria-label="Previous tip" className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink/60 transition hover:bg-ink/5">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => go(1)} aria-label="Next tip" className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink/60 transition hover:bg-ink/5">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
