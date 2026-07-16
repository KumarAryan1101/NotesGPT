"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import ScrollFX from "./components/ScrollFX";
import ProductTour from "./components/ProductTour";
import { StudioHero } from "./components/glass";
import { DashboardShowcase, AnalyticsBoard, BookSpread, FeatureTicker, TypeCycle } from "./components/Showcase";
import { SplitWords, BlurWords, Scribble, GhostWord } from "./components/TextFX";
import { SideRails, MarqueeBand, Testimonials, FAQ, ReviewWall } from "./components/Extras";

/* ================================================================== */
/*  Motion helpers                                                     */
/* ================================================================== */

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: i * 0.08 },
  }),
};

function Reveal({ children, delay = 0, className = "", y = 26 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// Typewriter that types `text` then keeps a blinking cursor.
function useTypewriter(text, speed = 45, startDelay = 500) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let interval;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);
  return { displayed, done };
}

// Count up to `value` the first time it scrolls into view (and on updates).
function CountUp({ value, duration = 1100 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.6 });
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView && !started.current) return;
    started.current = true;
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf;
    let ts0 = null;
    const step = (t) => {
      if (ts0 === null) ts0 = t;
      const p = Math.min(1, (t - ts0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

/* ================================================================== */
/*  Decorative background                                              */
/* ================================================================== */

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-drift absolute -left-32 -top-24 h-[36rem] w-[36rem] rounded-full bg-emerald-300/15 blur-3xl" />
      <div
        className="animate-drift absolute -right-24 top-24 h-[30rem] w-[30rem] rounded-full bg-lime-200/20 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="animate-drift absolute bottom-[-10rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-200/20 blur-3xl"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
}

/* ================================================================== */
/*  Subject marquee                                                    */
/* ================================================================== */

const SUBJECTS = [
  "Thermodynamics", "Data Structures", "Signals & Systems", "Operating Systems",
  "Fluid Mechanics", "Organic Chemistry", "Linear Algebra", "Machine Learning",
  "Computer Networks", "Control Systems", "Microprocessors", "Discrete Maths",
  "Electromagnetics", "Compiler Design", "Strength of Materials",
];

function MarqueeRow({ reverse = false }) {
  const loop = [...SUBJECTS, ...SUBJECTS];
  return (
    <div className={`flex w-max gap-3 ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
      {loop.map((s, i) => (
        <span
          key={i}
          className="shrink-0 rounded-full border border-ink/10 bg-ink/5 px-5 py-2.5 text-sm text-ink/70 backdrop-blur"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Live dashboard                                                     */
/* ================================================================== */

const STAT_CARDS = [
  { key: "summaries", label: "Notes summarized", accent: "text-indigo-600" },
  { key: "flashcards", label: "Flashcards created", accent: "text-fuchsia-600" },
  { key: "questions", label: "Quiz questions generated", accent: "text-emerald-600" },
];

function LiveDashboard({ refreshKey }) {
  const [stats, setStats] = useState({ summaries: 0, flashcards: 0, questions: 0 });
  useEffect(() => {
    let alive = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = await res.json();
        if (alive) setStats(data);
      } catch {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STAT_CARDS.map((c, i) => (
        <Reveal key={c.key} delay={i * 0.1}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="surface rounded-[28px] p-6 text-center"
          >
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                live
              </span>
            </div>
            <p className={`text-4xl font-semibold tracking-tight ${c.accent}`}>
              <CountUp value={stats[c.key] || 0} />
            </p>
            <p className="mt-1.5 text-sm text-ink/55">{c.label}</p>
          </motion.div>
        </Reveal>
      ))}
      {/* gauge-style analytics for everything summarized so far */}
      <div className="sm:col-span-3">
        <AnalyticsBoard stats={stats} />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function Home() {
  const goApp = () => { window.location.href = "/study"; };

  return (
    <>
      <Aurora />
      <ScrollFX />
      <SideRails />

      {/* ================= HERO (Creative Studio · spotlight reveal, light) ================= */}
      <StudioHero onOpenApp={goApp} />

      <main className="mx-auto max-w-6xl px-5 pb-32">
        {/* ================= MARQUEE ================= */}
        <section data-parallax="0.06" className="edge-fade mt-20 space-y-3 overflow-hidden md:mt-28">
          <MarqueeRow />
          <MarqueeRow reverse />
        </section>

        {/* ================= APP TEASER (real app lives at /study) ================= */}
        <section id="app" className="mt-24 scroll-mt-24 md:mt-32">
          <Reveal className="mb-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">the studio</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              <SplitWords text="Drop it in. Get" />{" "}
              <TypeCycle
                words={["a summary", "flashcards", "a quiz", "a glossary", "study-ready"]}
                className="serif italic text-accent"
              />
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="surface mx-auto max-w-2xl rounded-[32px] p-6 text-center md:p-10">
              <div className="mx-auto grid max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["📄", "PDF"],
                  ["✍️", "Text"],
                  ["📸", "Photo"],
                  ["🎙", "Voice"],
                ].map(([e, l]) => (
                  <div key={l} className="rounded-2xl border border-ink/10 bg-ink/[0.02] px-3 py-4">
                    <p className="text-2xl">{e}</p>
                    <p className="mt-1 text-xs font-medium text-ink/60">{l}</p>
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink/55">
                Upload a PDF, paste text, photograph your notes, or just dictate
                them — the studio turns any of it into a summary, glossary,
                flashcards and an endless quiz.
              </p>
              <a
                href="/study"
                className="btn-ink mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 font-medium"
              >
                Open the studio →
              </a>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
                free · no account · ~10 seconds
              </p>
            </div>
          </Reveal>

          {/* quick extra-features strip under the app */}
          <FeatureTicker />
        </section>


        {/* ================= BOOK SPREAD (before/after, GSAP scroll) ================= */}
        <BookSpread />

        {/* ================= FULL-BLEED MARQUEE BAND ================= */}
        <MarqueeBand />

        {/* ================= DASHBOARD SHOWCASE (Nexora-style preview) ================= */}
        <DashboardShowcase onOpenApp={goApp} />

        {/* ================= LIVE STATS ================= */}
        <section id="stats" className="mt-28 scroll-mt-24 md:mt-36">
          <Reveal className="mb-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">trusted by students</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              <SplitWords text="A study engine that's" />{" "}
              <Scribble><span className="serif text-accent">always running</span></Scribble>.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-ink/55">
              These numbers update live as students around campus turn their notes
              into revision material.
            </p>
          </Reveal>
          <LiveDashboard refreshKey={0} />
        </section>

        {/* ================= PRODUCT TOUR (how it works) ================= */}
        <div id="how" className="scroll-mt-24">
          <ProductTour />
        </div>

        {/* ================= TESTIMONIALS ================= */}
        <Testimonials />

        {/* ================= REVIEWS (user-written, live) ================= */}
        <ReviewWall />

        {/* ================= FAQ ================= */}
        <FAQ />

        {/* ================= EDITORIAL QUOTE ================= */}
        <section className="mt-28 md:mt-40">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-3xl font-medium leading-[1.25] tracking-tight md:text-5xl">
              <BlurWords
                text="It's like having a topper explain the whole chapter — the night before the exam."
                accents={["topper", "night", "before"]}
              />
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
              — the idea behind NotesGPT
            </p>
          </Reveal>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="mx-auto max-w-6xl px-5 pb-28">
        <GhostWord text="NotesGPT" />
        <Reveal>
          <div className="surface -mt-4 flex flex-col items-center gap-6 rounded-[32px] px-8 py-12 text-center md:-mt-8">
            <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
              <SplitWords text="Ready to" /> <Scribble><span className="serif text-accent">ace</span></Scribble>{" "}
              <SplitWords text="the next one?" delay={0.2} />
            </h3>
            <button onClick={goApp} className="magnetic btn-ink rounded-full px-8 py-3.5 font-medium">
              Summarize my notes →
            </button>
            <p className="font-mono text-xs text-ink/40">Built with Next.js + Groq · a NotesGPT study tool</p>
          </div>
        </Reveal>
      </footer>

      {/* ---- Floating bottom nav ---- */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
        <div className="surface flex items-center rounded-full p-2">
          <button onClick={goApp} className="btn-ink rounded-full px-5 py-2 text-sm font-medium">
            Start now →
          </button>
        </div>
      </div>
    </>
  );
}
