"use client";

/* Showcase sections adapted from the Nexora + Convix hero specs:
   - DashboardShowcase: coded product-preview (frosted glass, sidebar, chart, table)
   - AnalyticsBoard: gauge-driven live analytics for /api/stats
   - BookSpread: GSAP scroll-driven book open/close for empty sections
   - TypeCycle: looping typewriter that cycles through words                    */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ChevronDown, ChevronRight, Search, Bell, TrendingUp, TrendingDown,
  FileText, Layers, Brain, Sparkles, BookOpen, Zap,
} from "lucide-react";
import { SplitWords, Scribble } from "./TextFX";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = [0.22, 1, 0.36, 1];
const up = (delay = 0, y = 16) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.6, ease: EASE, delay },
});

/* ================================================================== */
/*  TypeCycle — types a word, holds, deletes, types the next          */
/* ================================================================== */

export function TypeCycle({ words, className = "", typeSpeed = 70, hold = 1600 }) {
  const [text, setText] = useState("");
  const [wi, setWi] = useState(0);
  useEffect(() => {
    const word = words[wi % words.length];
    let i = 0, t;
    let phase = "typing";
    const tick = () => {
      if (phase === "typing") {
        i += 1;
        setText(word.slice(0, i));
        if (i >= word.length) { phase = "holding"; t = setTimeout(tick, hold); return; }
        t = setTimeout(tick, typeSpeed);
      } else if (phase === "holding") {
        phase = "deleting";
        t = setTimeout(tick, 40);
      } else {
        i -= 1;
        setText(word.slice(0, i));
        if (i <= 0) { setWi((w) => w + 1); return; }
        t = setTimeout(tick, 34);
      }
    };
    t = setTimeout(tick, typeSpeed);
    return () => clearTimeout(t);
  }, [wi, words, typeSpeed, hold]);
  return (
    <span className={className}>
      {text}
      <span className="animate-blink">|</span>
    </span>
  );
}

/* ================================================================== */
/*  DashboardShowcase — Nexora-style coded product preview            */
/* ================================================================== */

const SIDEBAR = [
  { icon: FileText, label: "Summaries" },
  { icon: Layers, label: "Flashcards" },
  { icon: Brain, label: "Quizzes" },
  { icon: BookOpen, label: "Glossary" },
  { icon: Sparkles, label: "Study plan" },
];

const SAMPLE_RECENT = [
  ["Today", "Thermodynamics Unit 3", "12 cards · 6 Qs", "Ready", "text-emerald-600 bg-emerald-500/10"],
  ["Today", "Operating Systems — Deadlocks", "9 cards · 6 Qs", "Ready", "text-emerald-600 bg-emerald-500/10"],
  ["Yesterday", "Signals & Systems Ch. 4", "14 cards · 12 Qs", "Ready", "text-emerald-600 bg-emerald-500/10"],
  ["Yesterday", "Fluid Mechanics scan.pdf", "—", "Needs text PDF", "text-amber-700 bg-amber-500/10"],
];

// Recent uploads recorded by the app (page.js writes these on each generate).
function readRecents() {
  try {
    const raw = JSON.parse(localStorage.getItem("ng-recent") || "[]");
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.slice(0, 4).map((r) => {
      const day = new Date(r.at).toDateString() === new Date().toDateString() ? "Today" : "Earlier";
      return [day, r.t || "Untitled notes", `${r.c || 0} cards · ${r.q || 0} Qs`, "Ready", "text-emerald-600 bg-emerald-500/10"];
    });
  } catch {
    return null;
  }
}

export function DashboardShowcase({ onOpenApp }) {
  const [view, setView] = useState("Summaries");
  const [stats, setStats] = useState({ summaries: 0, flashcards: 0, questions: 0 });
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    setRecent(readRecents());
  }, []);

  return (
    <section className="mt-28 md:mt-36">
      <motion.div {...up(0)} className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-sm text-ink/55">
          Powered by Groq · llama-3.3 ✨
        </span>
        <h2 className="mx-auto mt-5 max-w-xl text-center text-4xl font-semibold leading-[0.98] tracking-tight md:text-6xl">
          <SplitWords text="Your notes," /> <span className="serif italic text-accent">organised</span>{" "}
          <SplitWords text="while you sleep" delay={0.25} />
        </h2>
        <p className="mx-auto mt-4 max-w-[650px] text-base leading-relaxed text-ink/55 md:text-lg">
          Every upload becomes a workspace — summary, glossary, flashcards and an
          endless quiz, all kept in one place.
        </p>
      </motion.div>

      {/* frosted-glass dashboard — coded & functional */}
      <motion.div {...up(0.15, 30)} className="mx-auto w-full max-w-5xl">
        <div
          className="overflow-hidden rounded-2xl p-3 md:p-4"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 25px 80px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          <div className="overflow-hidden rounded-xl border border-ink/8 bg-paper text-[11px]">
            {/* top bar */}
            <div className="flex items-center gap-3 border-b border-ink/8 px-4 py-2.5">
              <span className="grid h-5 w-5 place-items-center rounded bg-accent font-semibold text-paper">N</span>
              <span className="font-medium">NotesGPT</span>
              <ChevronDown className="h-3 w-3 text-ink/40" />
              <div className="ml-4 hidden flex-1 items-center gap-2 rounded-lg bg-ink/5 px-3 py-1.5 text-ink/40 sm:flex">
                <Search className="h-3 w-3" /> Search your material…
                <span className="ml-auto rounded border border-ink/10 px-1 text-[9px]">⌘K</span>
              </div>
              <button
                onClick={onOpenApp}
                className="ml-auto hidden rounded-full bg-accent px-3 py-1 font-medium text-paper transition hover:brightness-110 sm:block"
              >
                New upload
              </button>
              <Bell className="h-3.5 w-3.5 text-ink/40" />
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ink/10 text-[9px] font-semibold">AB</span>
            </div>

            <div className="flex">
              {/* sidebar — clickable */}
              <div className="hidden w-40 shrink-0 border-r border-ink/8 p-2 sm:block">
                {SIDEBAR.map(({ icon: Icon, label }) => {
                  const badge =
                    label === "Flashcards" && stats.flashcards
                      ? String(Math.min(stats.flashcards, 999))
                      : label === "Quizzes" && stats.questions
                        ? String(Math.min(stats.questions, 999))
                        : null;
                  return (
                    <button
                      key={label}
                      onClick={() => setView(label)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
                        view === label ? "bg-accent/10 font-medium text-accent" : "text-ink/55 hover:bg-ink/5"
                      }`}
                    >
                      <Icon className="h-3 w-3" /> {label}
                      {badge && <span className="ml-auto rounded-full bg-accent/15 px-1.5 text-[9px] text-accent">{badge}</span>}
                    </button>
                  );
                })}
                <p className="mt-3 px-2.5 text-[9px] uppercase tracking-wider text-ink/30">Workflows</p>
                {["Exam mode", "Revision", "Reminders", "Settings"].map((l) => (
                  <div key={l} className="px-2.5 py-1.5 text-ink/45">{l}</div>
                ))}
              </div>

              {/* main */}
              <div className="flex-1 bg-ink/[0.02] p-4">
                <p className="text-sm font-semibold">Welcome back 👋</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                  {["Summarize", "Quiz me", "Review cards", "Glossary"].map((l, i) => (
                    <button
                      key={l}
                      onClick={onOpenApp}
                      className={
                        i === 0
                          ? "rounded-full bg-accent px-2.5 py-1 font-medium text-paper transition hover:brightness-110"
                          : "rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-ink/60 transition hover:border-accent/40 hover:text-accent"
                      }
                    >
                      {l}
                    </button>
                  ))}
                  <span className="ml-auto self-center text-ink/40">Customize</span>
                </div>

                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  {/* live activity card w/ bezier chart */}
                  <div className="flex-1 basis-0 rounded-xl border border-ink/8 bg-paper p-3">
                    <p className="flex items-center gap-1 text-ink/55">
                      {view === "Summaries" ? "Retention score" : `${view} activity`} <span className="text-emerald-500">✓</span>
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">
                      {view === "Summaries" ? (
                        <>87.4<span className="text-xs text-ink/40">%</span></>
                      ) : view === "Flashcards" ? (
                        stats.flashcards.toLocaleString()
                      ) : view === "Quizzes" ? (
                        stats.questions.toLocaleString()
                      ) : (
                        stats.summaries.toLocaleString()
                      )}
                    </p>
                    <div className="mt-1 flex gap-3 text-[10px]">
                      <span className="text-ink/40">Last 30 days</span>
                      <span className="text-emerald-600">+{Math.max(stats.flashcards, 12)} cards</span>
                      <span className="text-red-500">−32 misses</span>
                    </div>
                    <svg viewBox="0 0 300 80" className="mt-2 h-20 w-full">
                      <defs>
                        <linearGradient id="ng-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4D6D47" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#4D6D47" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,62 C40,58 55,30 90,34 C125,38 140,52 175,44 C210,36 225,14 260,18 C275,20 290,12 300,10 L300,80 L0,80 Z" fill="url(#ng-area)" />
                      <path d="M0,62 C40,58 55,30 90,34 C125,38 140,52 175,44 C210,36 225,14 260,18 C275,20 290,12 300,10" fill="none" stroke="#4D6D47" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* totals card — live from /api/stats */}
                  <div className="flex-1 basis-0 rounded-xl border border-ink/8 bg-paper p-3">
                    <div className="flex items-center justify-between text-ink/55">
                      Your library <span className="text-ink/35">＋ ⋮</span>
                    </div>
                    {[
                      ["Summaries", stats.summaries],
                      ["Flashcards", stats.flashcards],
                      ["Quiz questions", stats.questions],
                    ].map(([n, v]) => (
                      <div key={n} className="flex justify-between py-3 text-xs">
                        <span>{n}</span>
                        <span className="font-medium">{Number(v).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* recent table — real uploads from this browser, sample otherwise */}
                <div className="mt-3 rounded-xl border border-ink/8 bg-paper p-3">
                  <p className="mb-2 font-medium">
                    Recent uploads {recent ? <span className="font-normal text-ink/35">(this device)</span> : <span className="font-normal text-ink/35">(sample)</span>}
                  </p>
                  <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-y-2 text-[10px]">
                    {["Date", "Notes", "Output", "Status"].map((h) => (
                      <span key={h} className="text-ink/35">{h}</span>
                    ))}
                    {(recent || SAMPLE_RECENT).map(([d, n, o, s, cls], i) => (
                      <FragmentRow key={`${n}-${i}`} d={d} n={n} o={o} s={s} cls={cls} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FragmentRow({ d, n, o, s, cls }) {
  return (
    <>
      <span className="text-ink/45">{d}</span>
      <span>{n}</span>
      <span className="text-ink/55">{o}</span>
      <span><span className={`rounded-full px-2 py-0.5 ${cls}`}>{s}</span></span>
    </>
  );
}

/* ================================================================== */
/*  Gauge — 40 tick marks over a 180° arc (Convix spec)               */
/* ================================================================== */

function Gauge({ value, color = "#4D6D47", showLabels, min = "0", max = "100" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(0);

  // sweep the needle from 0 the first time the gauge scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let t0 = null;
        const step = (t) => {
          if (t0 === null) t0 = t;
          const p = Math.min(1, (t - t0) / 900);
          setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const ticks = 40;
  const active = Math.round((shown / 100) * ticks);
  const lines = Array.from({ length: ticks }, (_, i) => {
    const a = Math.PI + (i / (ticks - 1)) * Math.PI;
    const r = 80;
    const x1 = 100 + Math.cos(a) * (r - 10), y1 = 100 + Math.sin(a) * (r - 10);
    const x2 = 100 + Math.cos(a) * r, y2 = 100 + Math.sin(a) * r;
    return { x1, y1, x2, y2, on: i < active };
  });
  return (
    <div ref={ref} className="mx-auto" style={{ maxWidth: 260 }}>
      <svg viewBox="0 0 200 120" className="w-full">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.on ? color : "#d4d4d8"} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        <text x="100" y="105" textAnchor="middle" fontSize="22" fontWeight="600" fill="currentColor">
          {shown}%
        </text>
      </svg>
      {showLabels && (
        <div className="flex justify-between text-[11px] text-neutral-500">
          <span>{min}</span><span>{max}</span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  AnalyticsBoard — Convix-style live analytics for /api/stats       */
/* ================================================================== */

export function AnalyticsBoard({ stats }) {
  const { summaries = 0, flashcards = 0, questions = 0 } = stats || {};
  const total = summaries + flashcards + questions;
  // soft "target" so gauges have something meaningful to show
  const pct = (v, target) => Math.max(4, Math.min(100, Math.round((v / target) * 100)));

  return (
    <motion.div {...up(0.1, 24)} className="mx-auto w-full max-w-[880px] rounded-3xl bg-[#f0f2ee] p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {/* Card 1 — summaries */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-accent">Summaries</span>
            <span className="text-neutral-500">All time</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[28px] font-semibold leading-none">{summaries.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
              <TrendingUp className="h-3 w-3" /> live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">PDFs & pasted notes processed</p>
          <p className="mt-3 text-center text-[11px] text-neutral-500">Milestone progress</p>
          <Gauge value={pct(summaries, 100)} showLabels min="0" max="100" />
          <div className="mt-2 flex rounded-full bg-neutral-100 p-1 text-[11px]">
            <span className="flex-1 rounded-full bg-white py-1 text-center font-medium shadow-sm">Summaries</span>
            <span className="flex-1 py-1 text-center text-neutral-500">Uploads</span>
          </div>
        </div>

        {/* Card 2 — flashcards */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-accent">Flashcards</span>
            <span className="text-neutral-500">All time</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[28px] font-semibold leading-none">{flashcards.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
              <TrendingUp className="h-3 w-3" /> live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">Cards generated for revision</p>
          <p className="mt-3 text-center text-[11px] text-neutral-500">Milestone progress</p>
          <Gauge value={pct(flashcards, 1000)} showLabels min="0" max="1k" />
          <div className="mt-2 flex rounded-full bg-neutral-100 p-1 text-[11px]">
            <span className="flex-1 rounded-full bg-white py-1 text-center font-medium shadow-sm">Created</span>
            <span className="flex-1 py-1 text-center text-neutral-500">Reviewed</span>
          </div>
        </div>

        {/* Card 3 — quiz questions */}
        <div className="rounded-2xl bg-white p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-accent">Quiz questions</span>
            <span className="text-neutral-500">All time</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[28px] font-semibold leading-none">{questions.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
              {total ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {total ? "live" : "0"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">MCQs written & graded</p>
          <p className="mt-3 text-center text-[11px] text-neutral-500">Milestone progress</p>
          <Gauge value={pct(questions, 500)} color="#9ca3af" />
          <div className="mt-2 flex rounded-full bg-neutral-100 p-1 text-[11px]">
            <span className="flex-1 rounded-full bg-white py-1 text-center font-medium shadow-sm">Generated</span>
            <span className="flex-1 py-1 text-center text-neutral-500">Answered</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  BookSpread — GSAP scroll-scrubbed book that opens as you scroll   */
/* ================================================================== */

const LEFT_PAGE = [
  "Raw lecture notes.",
  "40 pages of scribbles,",
  "half-finished diagrams,",
  "and \"IMP!!\" in the margins.",
];
const RIGHT_PAGE = [
  ["Summary", "the whole chapter in 10 sentences"],
  ["Glossary", "every term, plain English"],
  ["Flashcards", "tap to flip, swipe to learn"],
  ["Quiz", "endless fresh questions"],
];

export function BookSpread() {
  const wrapRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: wrapRef.current,
              start: "top 78%",
              end: "top 22%",
              scrub: 0.6,
            },
            defaults: { ease: "none" },
          })
          .fromTo(".book-cover", { rotateY: 0 }, { rotateY: -168 }, 0)
          .fromTo(".book-right-item", { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.12 }, 0.25)
          .fromTo(".book-left-line", { opacity: 0 }, { opacity: 1, stagger: 0.08 }, 0.15);
      });
      return () => mm.revert();
    },
    { scope: wrapRef }
  );

  return (
    <section ref={wrapRef} className="mt-28 md:mt-40">
      <div className="mb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">before / after</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          <SplitWords text="Watch the chapter" />{" "}
          <Scribble><span className="serif italic text-accent">open up</span></Scribble>.
        </h2>
      </div>

      <div className="mx-auto max-w-4xl px-2" style={{ perspective: "1600px" }}>
        <div className="relative mx-auto flex min-h-[340px] max-w-3xl rounded-2xl md:min-h-[400px]">
          {/* left page (revealed as the cover turns) */}
          <div className="relative z-[1] flex-1 rounded-l-2xl border border-r-0 border-ink/10 bg-[#f6f5f0] p-6 shadow-inner md:p-10">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-ink/35">your notes</p>
            {LEFT_PAGE.map((l, i) => (
              <p key={i} className="book-left-line mt-2 font-mono text-sm leading-relaxed text-ink/60 md:text-base">{l}</p>
            ))}
            <div className="mt-6 space-y-2">
              {[80, 62, 74, 40].map((w, i) => (
                <div key={i} className="book-left-line h-2 rounded bg-ink/8" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* right page */}
          <div className="relative z-[1] flex-1 rounded-r-2xl border border-ink/10 bg-white p-6 md:p-10">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">notesgpt output</p>
            {RIGHT_PAGE.map(([t, d]) => (
              <div key={t} className="book-right-item mt-3 flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/10 text-xs text-accent">✓</span>
                <div>
                  <p className="text-sm font-semibold md:text-base">{t}</p>
                  <p className="text-xs text-ink/50 md:text-sm">{d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* the cover — hinged on the spine, rotates open on scroll */}
          <div
            className="book-cover absolute inset-y-0 right-0 z-[2] w-1/2 origin-left rounded-r-2xl border border-ink/10 bg-gradient-to-br from-[#26402A] to-[#1C2E1E] p-6 md:p-10"
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          >
            <div className="flex h-full flex-col justify-between text-paper">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/50">unit 3</p>
              <div>
                <p className="serif text-3xl italic md:text-4xl">Lecture<br />Notes</p>
                <p className="mt-2 text-xs text-paper/50">scroll to open ↓</p>
              </div>
              <p className="font-mono text-[10px] text-paper/40">notesgpt press</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  FeatureTicker — quick extra features row w/ icons                 */
/* ================================================================== */

const EXTRAS = [
  { icon: Zap, t: "Instant", d: "summary in ~10 seconds" },
  { icon: Layers, t: "Endless decks", d: "load more cards forever" },
  { icon: Brain, t: "Adaptive quiz", d: "easy → hard, or custom" },
  { icon: BookOpen, t: "Read aloud", d: "listen to any summary" },
];

export function FeatureTicker() {
  return (
    <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
      {EXTRAS.map(({ icon: Icon, t, d }, i) => (
        <motion.div
          key={t}
          {...up(i * 0.08)}
          whileHover={{ y: -5, rotate: i % 2 ? 0.6 : -0.6 }}
          className="surface rounded-2xl p-4 text-center"
        >
          <Icon className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-2 text-sm font-semibold">{t}</p>
          <p className="text-xs text-ink/50">{d}</p>
        </motion.div>
      ))}
    </div>
  );
}
