"use client";

/* Studio-only flourishes + tools:
   - MeshHalo: animated mesh-gradient "3D-ish" halo behind the hero (Spline
     vibe, but pure CSS/SVG so it costs ~0 kB of runtime and stays smooth on
     phones — real Spline embeds are ~1 MB and janky on mobile).
   - FloatingParticles: slow drifting dots for depth.
   - FocusTimer: draggable Pomodoro pill with an animated countdown ring.
   - ShortcutHint: little chip advertising the keyboard shortcuts.          */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Play, Pause, RotateCcw, Timer, X, Keyboard } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

// True on phones (< md) — used to disable GPU-heavy effects there.
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/* ------------------------------------------------------------------ */
/*  MeshHalo — blurred, slowly morphing colour blobs + conic ring     */
/* ------------------------------------------------------------------ */

export function MeshHalo() {
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  // Animating huge blur-3xl layers murders mobile GPUs — static halo there.
  const still = reduce || mobile;
  const blobs = [
    { c: "rgba(77,109,71,0.35)", x: "12%", y: "18%", s: 340, d: 0 },
    { c: "rgba(163,201,146,0.30)", x: "70%", y: "10%", s: 300, d: 1.5 },
    { c: "rgba(120,160,110,0.28)", x: "45%", y: "48%", s: 380, d: 3 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-[1] h-[520px] overflow-hidden">
      {/* slow-rotating conic ring for a subtle 3D sheen */}
      {!still && (
        <motion.div
          className="absolute left-1/2 top-[-160px] h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-[0.12] blur-2xl"
          style={{
            background:
              "conic-gradient(from 0deg, #4D6D47, #A3C992, #4D6D47, #7CA06E, #4D6D47)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        />
      )}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ background: b.c, width: b.s, height: b.s, left: b.x, top: b.y }}
          animate={
            still
              ? {}
              : { x: [0, 26, -18, 0], y: [0, -22, 16, 0], scale: [1, 1.08, 0.96, 1] }
          }
          transition={{ duration: 14 + i * 3, ease: "easeInOut", repeat: Infinity, delay: b.d }}
        />
      ))}
      {/* fade into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
    </div>
  );
}

export function FloatingParticles({ count = 14 }) {
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  // deterministic pseudo-random so SSR + client match
  const dots = Array.from({ length: mobile ? 6 : count }, (_, i) => ({
    left: (i * 61) % 100,
    top: (i * 37) % 100,
    size: 3 + ((i * 13) % 5),
    dur: 6 + ((i * 7) % 8),
    delay: (i % 5) * 0.7,
  }));
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-accent/30"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size }}
          animate={{ y: [0, -24, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FocusTimer — draggable Pomodoro with an animated ring             */
/* ------------------------------------------------------------------ */

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

export function FocusTimer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("focus"); // focus | break
  const [secs, setSecs] = useState(FOCUS_MIN * 60);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const dragRef = useRef(null);

  const total = (mode === "focus" ? FOCUS_MIN : BREAK_MIN) * 60;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          // switch phase, ping the user
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            const ctx = new AC();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 660;
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            o.start();
            o.stop(ctx.currentTime + 0.6);
          } catch {}
          const next = mode === "focus" ? "break" : "focus";
          if (mode === "focus") setRounds((r) => r + 1);
          setMode(next);
          setRunning(false);
          return (next === "focus" ? FOCUS_MIN : BREAK_MIN) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  const reset = () => {
    setRunning(false);
    setSecs(total);
  };
  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSecs((m === "focus" ? FOCUS_MIN : BREAK_MIN) * 60);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const pct = 1 - secs / total;
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <motion.div
      ref={dragRef}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      className="fixed bottom-24 right-5 z-50 cursor-grab active:cursor-grabbing md:bottom-6 md:right-6"
    >
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="surface w-60 rounded-3xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
                focus timer
              </span>
              <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex rounded-full bg-ink/5 p-1 text-xs">
              {["focus", "break"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 rounded-full py-1 font-medium capitalize transition ${
                    mode === m ? "bg-accent text-paper" : "text-ink/55"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="relative mx-auto grid h-40 w-40 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(28,46,30,0.08)" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r={R} fill="none"
                  stroke={mode === "focus" ? "#4D6D47" : "#A3C992"}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={C}
                  animate={{ strokeDashoffset: C * (1 - pct) }}
                  transition={{ ease: "linear", duration: 0.5 }}
                />
              </svg>
              <div className="text-center">
                <p className="font-mono text-3xl font-semibold tabular-nums">{mm}:{ss}</p>
                <p className="mt-0.5 text-[10px] text-ink/45">{rounds} round{rounds === 1 ? "" : "s"} done</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="btn-ink flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium"
              >
                {running ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Start</>}
              </button>
              <button onClick={reset} className="btn-soft grid h-9 w-9 place-items-center rounded-full" aria-label="Reset timer">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink/35">drag me anywhere ✦</p>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => setOpen(true)}
            className="surface flex items-center gap-2 rounded-full px-4 py-2.5"
          >
            <span className="relative flex h-2 w-2">
              {running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${running ? "bg-accent" : "bg-ink/30"}`} />
            </span>
            <Timer className="h-4 w-4 text-accent" />
            <span className="font-mono text-sm font-semibold tabular-nums">{mm}:{ss}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  ShortcutHint — dismissible chip listing keyboard shortcuts        */
/* ------------------------------------------------------------------ */

export function ShortcutHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="surface fixed bottom-6 left-5 z-40 hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs md:flex"
        >
          <Keyboard className="h-3.5 w-3.5 text-accent" />
          <span className="text-ink/60">
            <kbd className="rounded bg-ink/8 px-1 font-mono">1</kbd>
            <kbd className="ml-0.5 rounded bg-ink/8 px-1 font-mono">2</kbd>
            <kbd className="ml-0.5 rounded bg-ink/8 px-1 font-mono">3</kbd> tabs ·{" "}
            <kbd className="rounded bg-ink/8 px-1 font-mono">Ctrl</kbd>+<kbd className="rounded bg-ink/8 px-1 font-mono">↵</kbd> generate
          </span>
          <button onClick={() => setShow(false)} className="text-ink/35 hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Reading-time + word-count chips for a block of text. */
export function ReadingMeta({ text }) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">
      <span className="rounded-full bg-ink/5 px-2 py-0.5">{words} words</span>
      <span className="rounded-full bg-ink/5 px-2 py-0.5">≈ {mins} min read</span>
    </div>
  );
}
