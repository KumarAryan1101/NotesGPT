"use client";

/* ------------------------------------------------------------------ *
 *  GeneratingOverlay — fullscreen "securify"-style loading screen.
 *  Shown while the AI builds the summary / flashcards / quiz.
 *
 *  - Looping fullscreen background video (from config/media.js → generating)
 *  - Floating pill navbar with a live "generating" status
 *  - Giant staggered typography that cycles through the real work stages
 *  - Thematic stat blocks + bottom gradient + elapsed timer
 *
 *  Palette is pure black / white / neutral-900 + white-opacity variants.
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { media, generatingStages } from "../../config/media";

const EASE = [0.22, 1, 0.36, 1];

/* Custom shield/lock mark from the securify spec (kept — reads as "secure/AI"). */
function Mark() {
  return (
    <svg viewBox="0 0 256 256" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#ffffff"
        d="M 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 128 L 64 128 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z M 128 64 L 128 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 Z M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 128 0 L 192 0 Z"
      />
    </svg>
  );
}

function StatBlock({ align, number, label, rotate }) {
  const right = align === "right";
  return (
    <div className={right ? "text-right" : "text-left"}>
      <div className={`flex items-center gap-3 ${right ? "justify-end" : "justify-start"}`}>
        {right && (
          <span
            className="hidden h-px w-24 bg-white/40 md:block"
            style={{ transform: `rotate(${rotate}deg)` }}
          />
        )}
        <span className="text-4xl font-medium tracking-tight text-white md:text-5xl tabular-nums">
          {number}
        </span>
        {!right && (
          <span
            className="hidden h-px w-24 bg-white/40 md:block"
            style={{ transform: `rotate(${rotate}deg)` }}
          />
        )}
      </div>
      <div className="mt-1 text-xs text-white/70 md:text-sm">{label}</div>
    </div>
  );
}

export default function GeneratingOverlay({ show, action = "full" }) {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tokens, setTokens] = useState(0);
  const videoRef = useRef(null);
  const cfg = media.generating;
  const useVideo = cfg?.type === "video" && cfg?.src;

  // Cycle the giant stage words + count elapsed seconds while visible.
  useEffect(() => {
    if (!show) return;
    setStage(0);
    setElapsed(0);
    setTokens(0);
    const stageTimer = setInterval(
      () => setStage((s) => (s + 1) % generatingStages.length),
      2200
    );
    const secTimer = setInterval(() => setElapsed((e) => e + 1), 1000);
    // fake-but-fun token throughput ticker (purely decorative)
    const tokTimer = setInterval(
      () => setTokens((t) => t + Math.floor(180 + Math.random() * 640)),
      120
    );
    return () => {
      clearInterval(stageTimer);
      clearInterval(secTimer);
      clearInterval(tokTimer);
    };
  }, [show]);

  const current = generatingStages[stage];
  const gradientBg = cfg?.gradient
    ? `linear-gradient(160deg, ${cfg.gradient.join(", ")})`
    : "#000";

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          key="generating-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-0 z-[120] h-screen w-full overflow-hidden bg-black"
          style={{ background: gradientBg }}
          aria-live="polite"
          aria-label="Generating your study material"
        >
          {/* Background video */}
          {useVideo && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              autoPlay
              loop
              muted
              playsInline
              src={cfg.src}
            />
          )}
          {/* darken for legibility */}
          <div className="absolute inset-0 bg-black/45" />

          {/* Navbar */}
          <div className="absolute left-0 right-0 top-0 z-20 px-6 pt-6 md:px-10">
            <nav className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 rounded-full bg-neutral-900/90 py-3 pl-4 pr-6 backdrop-blur">
                <Mark />
                <span className="text-sm font-normal tracking-tight text-white">NotesGPT</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-neutral-900/90 px-5 py-3 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-sm text-white/90">generating…</span>
              </div>
            </nav>
          </div>

          {/* Foreground content */}
          <div className="relative h-full w-full">
            {/* Giant staggered headline — cycles through stages */}
            <AnimatePresence mode="wait">
              <motion.div key={stage} className="hero-title">
                {current.words.map((word, i) => {
                  const pos = [
                    "left-4 top-[18%] md:left-10",
                    "right-4 top-[38%] md:right-10",
                    "left-[10%] top-[58%] md:left-[28%]",
                  ][i];
                  return (
                    <motion.h1
                      key={word + i}
                      initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -30, filter: "blur(12px)" }}
                      transition={{ duration: 0.55, ease: EASE, delay: i * 0.09 }}
                      className={`hero-title absolute font-medium text-white text-[14vw] md:text-[13vw] ${pos}`}
                    >
                      {word}
                    </motion.h1>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Blurb under the headline */}
            <div className="absolute left-6 top-[46%] max-w-[260px] md:left-10">
              <AnimatePresence mode="wait">
                <motion.p
                  key={current.blurb}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="text-[15px] leading-snug text-white/90"
                >
                  {current.blurb}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Stat — top right */}
            <div className="absolute right-6 top-[14%] md:right-24">
              <StatBlock align="right" number={`${tokens.toLocaleString()}`} label="tokens processed" rotate={20} />
            </div>

            {/* Stat — bottom left */}
            <div className="absolute bottom-20 left-6 md:bottom-24 md:left-20">
              <StatBlock align="left" number={`${elapsed}s`} label="time elapsed" rotate={-20} />
            </div>

            {/* Stat — bottom right */}
            <div className="absolute bottom-16 right-6 md:bottom-20 md:right-20">
              <StatBlock
                align="right"
                number={action === "full" ? "5" : "3"}
                label="artifacts building"
                rotate={-20}
              />
            </div>

            {/* Progress shimmer bar */}
            <div className="absolute bottom-8 left-6 right-6 md:left-20 md:right-20">
              <div className="h-px w-full overflow-hidden bg-white/15">
                <motion.div
                  className="h-full w-1/3 bg-white"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                />
              </div>
            </div>
          </div>

          {/* Bottom gradient overlay */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black" />
        </motion.section>
      )}
    </AnimatePresence>
  );
}
