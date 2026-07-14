"use client";

/* ------------------------------------------------------------------ *
 *  MainframeHero — light, interactive landing hero.
 *    • Background video that SCRUBS with horizontal mouse movement on
 *      desktop, and autoplays normally on mobile (<1024px).
 *    • Fixed transparent navbar with animated hamburger + mobile overlay.
 *    • Typewriter headline with a blinking cursor.
 *    • Multi-select "what do you want" pills with a springy status banner.
 *  Adapted from the Mainframe spec; wired to NotesGPT's real app entry.
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { media } from "../../config/media";

/* Typewriter that types `text` then keeps a blinking cursor. */
function useTypewriter(text, speed = 38, startDelay = 600) {
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

const OPTIONS = ["Summary", "Flashcards", "Quiz", "Glossary"];

export default function MainframeHero({ onOpenApp }) {
  const videoRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const { displayed, done } = useTypewriter("turn notes into\nknowledge, fast.");

  // Desktop mouse-scrub + mobile autoplay.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isDesktop = () => window.innerWidth >= 1024;

    let prevX = null;
    let target = 0; // where the mouse wants the video to be (seconds)
    let cur = 0; // smoothed value we actually seek to
    let seeking = false; // true while a seek is decoding — gate new seeks
    let seekAt = 0; // watchdog timestamp in case "seeked" never fires
    let raf = 0;

    const onSeeked = () => {
      seeking = false;
    };
    video.addEventListener("seeked", onSeeked);

    const tick = () => {
      if (video.duration) {
        // ease the target so mouse jitter doesn't translate into micro-seeks
        cur += (target - cur) * 0.16;
        // release a stuck seek if the browser swallowed the event
        if (seeking && performance.now() - seekAt > 220) seeking = false;
        // only issue a seek when the previous one has finished decoding
        if (!seeking && Math.abs(cur - video.currentTime) > 0.02) {
          seeking = true;
          seekAt = performance.now();
          video.currentTime = cur;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (!isDesktop() || !video.duration) return;
      if (prevX === null) {
        prevX = e.clientX;
        return;
      }
      const delta = e.clientX - prevX;
      prevX = e.clientX;
      target = Math.min(
        video.duration,
        Math.max(0, target + (delta / window.innerWidth) * 0.9 * video.duration)
      );
    };

    const startDesktop = () => {
      video.pause();
      cur = video.currentTime || 0;
      target = cur;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const setupMobile = () => {
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    };

    const init = () => (isDesktop() ? startDesktop() : setupMobile());

    if (video.readyState >= 1) init();
    else video.addEventListener("loadedmetadata", init, { once: true });

    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      video.removeEventListener("seeked", onSeeked);
    };
  }, []);

  const toggle = (s) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const links = [
    ["How it works", "#how"],
    ["Live usage", "#stats"],
    ["The app", "#app"],
  ];

  const cfg = media.landing;

  return (
    <div className="relative flex flex-col overflow-x-hidden bg-paper text-ink lg:block lg:min-h-screen">
      {/* Background video */}
      <div className="pointer-events-none relative order-last aspect-square w-full overflow-hidden bg-neutral-50 md:aspect-video lg:absolute lg:inset-0 lg:z-0 lg:order-none lg:aspect-auto lg:h-full lg:bg-transparent">
        <video
          ref={videoRef}
          className="h-full w-full object-cover object-right lg:object-right-bottom"
          muted
          playsInline
          preload="auto"
          src={cfg.src}
        />
        {/* left-side legibility wash on desktop */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-paper via-paper/70 to-transparent lg:block" />
      </div>

      {/* Navbar */}
      <header className="absolute inset-x-0 top-0 z-20 flex flex-row items-center justify-between bg-transparent px-5 py-4 sm:px-8 sm:py-5">
        <a href="#top" className="flex flex-row items-center gap-2 select-none">
          <span className="text-[21px] font-medium tracking-tight text-ink sm:text-[26px]">
            NotesGPT
          </span>
          <span className="mb-1 select-none text-[25px] font-medium leading-none tracking-[-0.02em] text-accent sm:text-[30px]">
            &#10033;
          </span>
        </a>

        <nav className="hidden text-[19px] text-ink md:flex">
          {links.map(([label, href], i) => (
            <span key={href} className="flex">
              <a href={href} className="transition-opacity hover:opacity-60">
                {label}
              </a>
              {i < links.length - 1 && <span className="opacity-40">,&nbsp;</span>}
            </span>
          ))}
        </nav>

        <button
          onClick={onOpenApp}
          className="hidden text-[19px] text-ink underline underline-offset-2 transition-opacity hover:opacity-60 md:block"
        >
          Open the app
        </button>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-8 w-8 flex-col items-center justify-center gap-[6px] md:hidden"
        >
          <span className={`h-[2px] w-6 bg-ink transition-all duration-300 ${menuOpen ? "translate-y-[8px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-6 bg-ink transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-6 bg-ink transition-all duration-300 ${menuOpen ? "-translate-y-[8px] -rotate-45" : ""}`} />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[9] flex flex-col items-center justify-center gap-8 bg-paper/95 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            className="text-3xl font-medium text-ink"
          >
            {label}
          </a>
        ))}
        <button
          onClick={() => {
            setMenuOpen(false);
            onOpenApp();
          }}
          className="mt-4 rounded-full bg-ink px-8 py-3 text-lg text-paper"
        >
          Open the app
        </button>
      </div>

      {/* Content layer */}
      <div className="relative z-10 order-first flex w-full flex-col bg-paper pb-8 lg:order-none lg:min-h-screen lg:bg-transparent lg:pb-0">
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-12 pt-28 lg:pt-12">
          <div className="max-w-2xl">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-accent">
              AI study copilot · powered by Groq
            </p>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mb-8 w-full select-none whitespace-pre-wrap text-5xl font-normal leading-[1.08] tracking-tight text-ink md:text-6xl lg:text-[76px]">
                {displayed}
                {!done && (
                  <span className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-blink bg-ink align-middle" />
                )}
              </h1>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="mb-12 max-w-2xl text-lg font-normal leading-relaxed text-[#5A635A] md:text-xl">
                Upload a lecture PDF or paste your notes — <br className="hidden sm:block" />
                get a summary, glossary, flashcards, and an endless quiz in seconds.
              </p>
            </motion.div>

            {/* Service pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="mb-2 text-2xl font-medium tracking-tight text-ink">
                What do you want to make?
              </h2>
              <p className="mb-8 text-[#738273] opacity-85">Select all that apply</p>

              <div className="flex flex-wrap gap-3">
                {OPTIONS.map((s) => {
                  const active = services.includes(s);
                  return (
                    <motion.button
                      key={s}
                      onClick={() => toggle(s)}
                      whileTap={{ scale: 0.96 }}
                      className={`flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium transition-colors ${
                        active
                          ? "transform bg-[#1C2E1E] text-white shadow-md shadow-emerald-950/5"
                          : "border border-[#E4E7E3] bg-white text-[#1C2E1E] hover:bg-[#F1F3F1]/60"
                      }`}
                    >
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <Check size={16} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {s}
                    </motion.button>
                  );
                })}
              </div>

              {/* Status banner */}
              <AnimatePresence mode="wait">
                {services.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 text-xs italic text-[#5A635A]"
                  >
                    Please click to select what you want to generate above.
                  </motion.p>
                ) : (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E4E7E3] bg-[#FAFBF9] px-5 py-4">
                      <p className="text-sm text-[#1C2E1E]">
                        Ready to generate:{" "}
                        <span className="font-medium">{services.join(", ")}</span>
                      </p>
                      <button
                        onClick={onOpenApp}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#4D6D47] transition hover:gap-2.5"
                      >
                        Let&apos;s Go <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
