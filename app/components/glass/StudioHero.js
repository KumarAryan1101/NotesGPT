"use client";

/* ------------------------------------------------------------------ *
 *  StudioHero — "Creative Studio" spotlight-reveal hero.
 *
 *  Two variants (chosen in config/media.js → studioHero.variant):
 *    "portrait" — faithful to the reference: a dim base photo with a
 *                 bright photo revealed under the cursor lens.
 *    "formula"  — NotesGPT-branded: faint formulas that light up.
 *
 *  Both use a GPU-composited CSS radial-gradient mask driven by one rAF
 *  loop — NOT canvas.toDataURL() per frame (what made the reference lag).
 *  Per frame we only write a mask string + one transform; nothing is
 *  serialized, so it stays at 60fps.
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { media } from "../../config/media";

const EASE = [0.22, 1, 0.36, 1];

/* Faint knowledge the lens reveals in the "formula" variant. Deterministic
   (index-derived) so SSR and client markup match — no hydration mismatch. */
const KNOWLEDGE = [
  "∇·E = ρ/ε₀", "F = ma", "e^{iπ}+1 = 0", "PV = nRT", "∫eˣdx = eˣ+C",
  "O(n log n)", "S = k ln W", "a²+b² = c²", "λ = h/p", "∂u/∂t = α∇²u",
  "dS ≥ 0", "V = IR", "ΣF = 0", "Bayes' rule", "σ(x)=1/(1+e⁻ˣ)",
  "Δx·Δp ≥ ħ/2", "∮B·dl = μ₀I", "y = mx+b", "amortized O(1)", "τ = r×F",
  "det(A−λI)=0", "Σ1/n² = π²/6", "ΔG = ΔH−TΔS", "c = λν", "∇×B = μ₀J",
  "Nyquist rate", "big-θ bound", "eigenbasis",
];

function Splash({ onDone }) {
  const boxes = Array.from({ length: 5 });
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {["top", "bottom"].map((row, r) => (
        <div key={row} className="flex h-1/2 w-full">
          {boxes.map((_, i) => (
            <motion.div
              key={i}
              className="h-full w-1/5 bg-accent"
              initial={{ y: "0%" }}
              animate={{ y: row === "top" ? "-100%" : "100%" }}
              transition={{ duration: 0.9, ease: [0.96, -0.02, 0.38, 1.01], delay: i * 0.05 }}
              onAnimationComplete={r === 1 && i === 4 ? onDone : undefined}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
}

function MenuPanel({ open, onClose, onOpenApp }) {
  const links = [
    ["How it works", "#how"],
    ["Live usage", "#stats"],
    ["The app", "#app"],
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "-110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed right-2 top-2 z-[70] flex w-[calc(100%-1rem)] flex-col justify-between rounded-3xl bg-[#122014]/95 p-8 backdrop-blur-2xl md:right-3 md:top-3 md:w-[420px] md:p-12"
          style={{ minHeight: "min(70vh, 560px)" }}
        >
          <nav className="mt-10 flex flex-col gap-2">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={onClose}
                className="text-4xl font-medium leading-tight text-paper transition hover:opacity-60 md:text-5xl"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-10 flex flex-col gap-5">
            <a href="mailto:hello@notesgpt.app" className="text-lg text-paper/50 transition hover:text-paper">
              hello@notesgpt.app
            </a>
            <button
              onClick={() => {
                onClose();
                onOpenApp();
              }}
              className="group flex w-fit items-center gap-3 rounded-full bg-paper py-2 pl-6 pr-2 text-ink"
            >
              <span className="text-sm font-medium">Open the app</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-paper transition group-hover:-translate-x-1">
                <ArrowUpRight size={16} />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function StudioHero({ onOpenApp }) {
  const cfg = media.studioHero || { variant: "formula" };
  const isPortrait = cfg.variant === "portrait";

  const [splash, setSplash] = useState(true);
  const [menu, setMenu] = useState(false);
  const revealRef = useRef(null);
  const lensRef = useRef(null);

  // Smoothly follow the pointer; paint a CSS mask + move the lens ring.
  // No canvas, no toDataURL — just a mask string and a transform per frame.
  useEffect(() => {
    const reveal = revealRef.current;
    const lens = lensRef.current;
    if (!reveal) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      reveal.style.webkitMaskImage = "none";
      reveal.style.maskImage = "none";
      setSplash(false);
      return;
    }

    const R = isPortrait ? 260 : 230;
    let raf = 0;
    let t = 0;
    let moved = false;
    const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.5 };
    const curp = { x: target.x, y: target.y };

    const onMove = (e) => {
      moved = true;
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const loop = () => {
      t += 0.016;
      if (!moved) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        target.x = w * (0.5 + 0.26 * Math.cos(t * 0.55));
        target.y = h * (0.46 + 0.18 * Math.sin(t * 0.9));
      }
      curp.x += (target.x - curp.x) * 0.12;
      curp.y += (target.y - curp.y) * 0.12;

      const mask = isPortrait
        ? `radial-gradient(circle ${R}px at ${curp.x}px ${curp.y}px, #000 0%, #000 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`
        : `radial-gradient(circle ${R}px at ${curp.x}px ${curp.y}px, #000 0%, #000 44%, rgba(0,0,0,0.45) 68%, transparent 84%)`;
      reveal.style.webkitMaskImage = mask;
      reveal.style.maskImage = mask;
      if (lens) lens.style.transform = `translate3d(${curp.x - R}px, ${curp.y - R}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [isPortrait]);

  // ---- Portrait variant: dim base photo + bright photo revealed by lens ----
  if (isPortrait) {
    return (
      <section className="relative h-screen min-h-[720px] w-full overflow-hidden bg-[#E4E4E4] text-[#111]">
        <AnimatePresence>{splash && <Splash onDone={() => setSplash(false)} />}</AnimatePresence>

        {/* Giant ghost word behind the image */}
        <motion.div
          initial={{ y: 330 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
          className="pointer-events-none absolute inset-x-0 bottom-[-40px] z-[2] text-center"
        >
          <h2
            className="select-none font-medium text-[#F4F1E8]"
            style={{ fontSize: "clamp(180px, 28vw, 560px)", lineHeight: 0.8, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}
          >
            Focus
          </h2>
        </motion.div>

        {/* Base image (dim) */}
        <motion.div
          initial={{ opacity: 0, scale: 1.5, rotate: 3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 1 }}
          className="absolute inset-x-0 bottom-0 top-[30vh] z-[5] bg-cover bg-no-repeat md:top-0"
          style={{
            backgroundImage: `url('${cfg.baseImg}')`,
            backgroundPosition: "60% center",
          }}
        />

        {/* Reveal image (bright), masked to the lens */}
        <div
          ref={revealRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[30vh] z-[7] bg-cover bg-no-repeat md:top-0"
          style={{
            backgroundImage: `url('${cfg.revealImg}')`,
            backgroundPosition: "60% center",
            maskImage: "radial-gradient(circle 0px at 50% 50%, #000, transparent)",
            WebkitMaskImage: "radial-gradient(circle 0px at 50% 50%, #000, transparent)",
          }}
        />

        {/* Lens ring */}
        <div
          ref={lensRef}
          className="pointer-events-none absolute left-0 top-0 z-[8] hidden rounded-full md:block"
          style={{ width: 520, height: 520, border: "1px solid rgba(255,255,255,0.35)" }}
        />

        {/* Floating logo */}
        <div className="fixed left-5 top-7 z-[75] mix-blend-difference md:left-10 md:top-9">
          <a href="#top" className="text-lg font-semibold text-white" aria-label="NotesGPT home">
            Notes<span className="serif text-[1.1em]">GPT</span>
          </a>
        </div>

        {/* Burger */}
        <div className="fixed right-4 top-4 z-[75] md:right-9 md:top-6">
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label={menu ? "Close menu" : "Open menu"}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
              menu ? "bg-[#0B0B0B] text-white" : "bg-[#F4F1E8] text-[#111] hover:bg-[#0B0B0B] hover:text-white"
            }`}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <MenuPanel open={menu} onClose={() => setMenu(false)} onOpenApp={onOpenApp} />

        {/* Content — headline + CTA, bottom-left */}
        <div className="pointer-events-none absolute inset-0 z-[10] mx-auto flex max-w-[1600px] flex-col justify-end px-4 pb-8 md:justify-between md:px-10 md:pb-24 md:pt-40">
          <div />
          <div className="pointer-events-auto flex flex-col items-start gap-7">
            <h1
              className="max-w-[447px] font-medium text-[#111]"
              style={{ fontSize: "clamp(22px, 2.4vw, 28px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
            >
              {"Upload your notes and watch them come into focus — summary, cards & quiz.".split(" ").map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 1 + i * 0.05 }}
                  className="mr-[0.3em] inline-block"
                >
                  {w}
                </motion.span>
              ))}
            </h1>

            <motion.button
              initial={{ opacity: 0, y: 60, scale: 0.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 1 }}
              onClick={onOpenApp}
              className="group flex items-center gap-3 rounded-full bg-black/5 p-2"
            >
              <span className="rounded-full bg-white px-8 py-3.5 font-medium text-[#111] transition-all group-hover:px-10">
                Start studying now
              </span>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform group-hover:-translate-x-1.5 md:h-[54px] md:w-[54px]">
                <ArrowUpRight size={20} />
              </span>
            </motion.button>
          </div>
        </div>

        {/* Hint chip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="pointer-events-none absolute right-6 top-6 z-[10] hidden md:block"
        >
          <span className="rounded-full border border-black/10 bg-white/60 px-4 py-2 font-mono text-xs text-black/50 backdrop-blur">
            ✦ move to reveal
          </span>
        </motion.div>
      </section>
    );
  }

  // ---- Formula variant (NotesGPT-branded) ----------------------------------
  const headWords = "Turn dense notes into knowledge that sticks.".split(" ");
  return (
    <section className="relative h-screen min-h-[720px] w-full overflow-hidden bg-paper text-ink">
      <AnimatePresence>{splash && <Splash onDone={() => setSplash(false)} />}</AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-[-3vw] z-[1] text-center">
        <span
          className="select-none font-medium text-ink/[0.05]"
          style={{ fontSize: "clamp(140px, 30vw, 560px)", lineHeight: 0.8, letterSpacing: "-0.04em" }}
        >
          notes
        </span>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
        <FormulaField className="text-ink/[0.07]" />
      </div>

      <div
        ref={revealRef}
        className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
        style={{
          maskImage: "radial-gradient(circle 0px at 50% 50%, #000, transparent)",
          WebkitMaskImage: "radial-gradient(circle 0px at 50% 50%, #000, transparent)",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(40rem_28rem_at_50%_45%,rgba(77,109,71,0.14),transparent_70%)]" />
        <FormulaField className="font-medium text-accent" glow />
      </div>

      <div
        ref={lensRef}
        className="pointer-events-none absolute left-0 top-0 z-[6] hidden rounded-full md:block"
        style={{ width: 460, height: 460, border: "1px solid rgba(77,109,71,0.25)", boxShadow: "inset 0 0 60px rgba(77,109,71,0.06)" }}
      />

      <div className="fixed left-5 top-7 z-[75] mix-blend-difference md:left-10 md:top-9">
        <a href="#top" className="text-lg font-semibold text-white" aria-label="NotesGPT home">
          Notes<span className="serif text-[1.1em]">GPT</span>
        </a>
      </div>

      <div className="fixed right-4 top-4 z-[75] md:right-9 md:top-6">
        <button
          onClick={() => setMenu((m) => !m)}
          aria-label={menu ? "Close menu" : "Open menu"}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            menu ? "bg-[#122014] text-paper" : "bg-ink text-paper hover:opacity-90"
          }`}
        >
          {menu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <MenuPanel open={menu} onClose={() => setMenu(false)} onOpenApp={onOpenApp} />

      <div className="relative z-[10] mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-24 md:px-10 md:pb-28">
        <div className="max-w-[820px]">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.32em] text-accent">
            AI study copilot · powered by Groq
          </p>
          <h1 className="font-medium text-ink" style={{ fontSize: "clamp(38px, 6.4vw, 92px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
            {headWords.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE, delay: 1 + i * 0.06 }}
                className="mr-[0.26em] inline-block"
              >
                {w === "knowledge" ? <em className="serif not-italic text-accent">{w}</em> : w}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 1.5 }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-[#5A635A] md:text-base"
          >
            Move your cursor to bring the ideas into focus. Upload a PDF or
            paste notes and get a summary, glossary, flashcards, and an endless
            quiz — in seconds.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 1.7 }}
            onClick={onOpenApp}
            className="group mt-9 flex items-center gap-3 rounded-full bg-ink p-2 text-paper"
          >
            <span className="whitespace-nowrap px-7 py-3 font-medium">Start studying now</span>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-paper transition-transform duration-300 group-hover:-translate-x-1">
              <ArrowUpRight size={20} />
            </span>
          </motion.button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-40 bg-gradient-to-b from-transparent to-paper" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="pointer-events-none absolute right-6 top-1/2 z-[10] hidden -translate-y-1/2 md:block"
      >
        <span className="rounded-full border border-ink/10 bg-paper/70 px-4 py-2 font-mono text-xs text-ink/50 backdrop-blur">
          ✦ move to reveal
        </span>
      </motion.div>
    </section>
  );
}

function FormulaField({ className = "", glow = false }) {
  return (
    <>
      {KNOWLEDGE.map((k, i) => {
        const col = i % 6;
        const rowN = Math.floor(i / 6);
        const left = 4 + col * 16 + ((i * 37) % 7);
        const top = 8 + rowN * 17 + ((i * 53) % 7);
        const rot = ((i * 41) % 22) - 11;
        const size = 13 + ((i * 17) % 11);
        return (
          <span
            key={i}
            className={`absolute font-mono ${className}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: `rotate(${rot}deg)`,
              fontSize: `${size}px`,
              textShadow: glow ? "0 0 22px rgba(77,109,71,0.45)" : "none",
            }}
          >
            {k}
          </span>
        );
      })}
    </>
  );
}
