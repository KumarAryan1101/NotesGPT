"use client";

/* Kinetic typography kit:
   - SplitWords: per-word masked slide-up reveal (staggered)
   - BlurWords: per-word blur + rise reveal, for editorial copy
   - Scribble: hand-drawn SVG underline that draws itself on scroll
   - GhostWord: giant outlined word for section closers               */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/* Words rise out of a clipped mask, one after another. Wrap headings.
   Visibility is observed on the OUTER span: the words themselves start
   fully clipped inside overflow-hidden masks, so per-word observers can
   report 0% visible and never fire — which left headings showing only
   their last unclipped word on phones. */
export function SplitWords({ text, className = "", delay = 0, stagger = 0.055 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "115%", rotate: 5 }}
            animate={inView ? { y: 0, rotate: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* Words sharpen out of a blur, one by one — for long editorial lines.
   `accents` lists words (lowercase, punctuation stripped) to render in
   serif italic accent green. */
export function BlurWords({ text, className = "", stagger = 0.045, accents = [] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => {
        const isAccent = accents.includes(w.toLowerCase().replace(/[^\w'-]/g, ""));
        return (
          <motion.span
            key={i}
            className={`inline-block ${isAccent ? "serif italic text-accent" : ""}`}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.55, ease: EASE, delay: i * stagger }}
          >
            {w}
            {i < words.length - 1 && <span className="font-sans not-italic text-ink">&nbsp;</span>}
          </motion.span>
        );
      })}
    </span>
  );
}

/* Accent word with a hand-drawn underline stroke that draws itself. */
export function Scribble({ children, className = "", color = "#4D6D47", delay = 0.35 }) {
  return (
    <span className={`relative inline-block whitespace-nowrap ${className}`}>
      {children}
      <svg
        viewBox="0 0 120 12"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.14em] left-0 h-[0.28em] w-full overflow-visible"
        aria-hidden
      >
        <motion.path
          d="M3,9 C25,4 45,10 62,7 C80,4 100,8 117,5"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut", delay }}
        />
      </svg>
    </span>
  );
}

/* Giant outlined ghost word that slides up into view — for the footer. */
export function GhostWord({ text }) {
  return (
    <div className="pointer-events-none select-none overflow-hidden" aria-hidden>
      <motion.p
        initial={{ y: "45%", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: EASE }}
        className="serif whitespace-nowrap text-center italic leading-[0.85] text-transparent"
        style={{
          fontSize: "clamp(80px, 16vw, 220px)",
          WebkitTextStroke: "1.5px rgba(28,46,30,0.14)",
        }}
      >
        {text}
      </motion.p>
    </div>
  );
}
