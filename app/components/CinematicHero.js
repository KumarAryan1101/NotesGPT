"use client";

/* Full-screen cinematic hero for the studio page.
   - Looping background video with a custom rAF fade system (no CSS
     transitions): 500ms fade-in on load/loop start, 500ms fade-out when
     0.55s remain, then reset → play → fade back in. Each new fade cancels
     the previous frame and resumes from the current opacity.
   - Liquid-glass UI (`.liquid-glass` from globals.css), dark aesthetic,
     Instrument Serif display type (already loaded via next/font).       */

import { useRef } from "react";
import { ArrowRight, Globe, AtSign, Share2 } from "lucide-react";

const SERIF = { fontFamily: "var(--font-serif), 'Instrument Serif', Georgia, serif" };
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

export default function CinematicHero({ onEnter }) {
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const fadingOutRef = useRef(false);

  // rAF fade that resumes from the current opacity; cancels any running fade.
  const fadeTo = (target, dur = 500) => {
    const v = videoRef.current;
    if (!v) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = parseFloat(v.style.opacity || "0");
    let t0 = null;
    const step = (t) => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      v.style.opacity = String(from + (target - from) * p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const onPlaying = () => {
    if (!fadingOutRef.current) fadeTo(1);
  };
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || fadingOutRef.current) return;
    if (v.duration - v.currentTime <= 0.55) {
      fadingOutRef.current = true;
      fadeTo(0);
    }
  };
  const onEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    v.style.opacity = "0";
    setTimeout(() => {
      v.currentTime = 0;
      v.play().catch(() => {});
      fadingOutRef.current = false;
      fadeTo(1);
    }, 100);
  };

  const enter = (e) => {
    e?.preventDefault?.();
    if (onEnter) onEnter();
    else document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-[78svh] flex-col overflow-hidden bg-black md:min-h-screen">
      {/* ---- Background video (top cropped — content sits low in frame) ---- */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onPlaying={onPlaying}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        style={{ opacity: 0 }}
        className="absolute inset-0 h-full w-full translate-y-[17%] object-cover"
      />

      {/* ---- Nav ---- */}
      <nav className="relative z-20 py-6 pl-6 pr-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <Globe size={24} /> NotesGPT
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a href="/" className="text-sm font-medium text-white/80 transition-colors hover:text-white">Home</a>
              <a href="/#how" className="text-sm font-medium text-white/80 transition-colors hover:text-white">How it works</a>
              <a href="/#reviews" className="text-sm font-medium text-white/80 transition-colors hover:text-white">Reviews</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium text-white">Back home</a>
            <button onClick={enter} className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white">
              Enter studio
            </button>
          </div>
        </div>
      </nav>

      {/* ---- Hero content ---- */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center md:-translate-y-[20%] md:py-12">
        <h1
          style={SERIF}
          className="mb-8 text-4xl tracking-tight text-white sm:text-5xl md:whitespace-nowrap md:text-6xl lg:text-7xl"
        >
          Built for the curious
        </h1>

        <div className="w-full max-w-xl space-y-4">
          <form onSubmit={enter} className="liquid-glass flex items-center gap-3 rounded-full py-2 pl-6 pr-2">
            <input
              type="text"
              placeholder="What are you studying tonight?"
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
            />
            <button type="submit" aria-label="Open the studio" className="rounded-full bg-white p-3 text-black">
              <ArrowRight size={20} />
            </button>
          </form>
          <p className="px-4 text-sm leading-relaxed text-white">
            Drop a PDF, paste notes, snap a photo or just speak — NotesGPT turns
            any of it into summaries, flashcards and endless quizzes in seconds.
          </p>
        </div>

        <button
          onClick={enter}
          className="liquid-glass mt-8 rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
        >
          Start summarizing ↓
        </button>
      </div>

      {/* ---- Social footer ---- */}
      <div className="relative z-10 flex justify-center gap-4 pb-8 md:pb-12">
        <a href="#" aria-label="Instagram" className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
          <AtSign size={20} />
        </a>
        <a href="#" aria-label="Share" className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
          <Share2 size={20} />
        </a>
        <a href="/" aria-label="NotesGPT home" className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white">
          <Globe size={20} />
        </a>
      </div>
    </div>
  );
}
