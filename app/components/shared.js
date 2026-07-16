"use client";

/* Bits shared between the landing page (/) and the study app (/study). */

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { AnalyticsBoard } from "./Showcase";

export const EASE = [0.22, 1, 0.36, 1];

export function Reveal({ children, delay = 0, className = "", y = 26 }) {
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

/* Soft drifting aurora orbs, fixed behind everything. */
export function Aurora() {
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

/* Count up to `value` when scrolled into view (and on later updates). */
export function CountUp({ value, duration = 1100 }) {
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

/* ---- Subject marquee ------------------------------------------------ */

const SUBJECTS = [
  "Thermodynamics", "Data Structures", "Signals & Systems", "Operating Systems",
  "Fluid Mechanics", "Organic Chemistry", "Linear Algebra", "Machine Learning",
  "Computer Networks", "Control Systems", "Microprocessors", "Discrete Maths",
  "Electromagnetics", "Compiler Design", "Strength of Materials",
];

export function MarqueeRow({ reverse = false }) {
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

/* ---- Live stats dashboard ------------------------------------------- */

const STAT_CARDS = [
  { key: "summaries", label: "Notes summarized", accent: "text-indigo-600" },
  { key: "flashcards", label: "Flashcards created", accent: "text-fuchsia-600" },
  { key: "questions", label: "Quiz questions generated", accent: "text-emerald-600" },
];

export function LiveDashboard({ refreshKey = 0 }) {
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
