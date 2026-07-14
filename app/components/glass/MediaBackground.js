"use client";

import { useEffect, useRef } from "react";

/**
 * MediaBackground — full-cover backdrop driven by app/config/media.js.
 *
 * config.type === "gradient" → animated CSS gradient (no external deps).
 * config.type === "video"    → looping video with a smooth crossfade to black
 *                              between plays (vanilla rAF, matches reference).
 */
export default function MediaBackground({ config, className = "", overlay = true }) {
  const videoRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (config?.type !== "video") return;
    const v = videoRef.current;
    if (!v) return;

    const fade = (from, to, ms, done) => {
      cancelAnimationFrame(rafRef.current);
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / ms);
        v.style.opacity = String(from + (to - from) * p);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else done?.();
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const onCanPlay = () => {
      v.play().catch(() => {});
      fade(0, 1, 500);
    };
    const onTimeUpdate = () => {
      if (v.duration && v.duration - v.currentTime <= 0.55) {
        fade(parseFloat(v.style.opacity || "1"), 0, 500);
      }
    };
    const onEnded = () => {
      v.style.opacity = "0";
      setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
        fade(0, 1, 500);
      }, 100);
    };

    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    return () => {
      cancelAnimationFrame(rafRef.current);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, [config?.type, config?.src]);

  const stops = config?.gradient || ["#1a0b3d", "#0a0a1f", "#000000"];

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {config?.type === "video" && config?.src ? (
        <video
          ref={videoRef}
          src={config.src}
          muted
          autoPlay
          playsInline
          preload="auto"
          style={{ opacity: 0 }}
          className="absolute inset-0 h-full w-full object-cover object-bottom"
        />
      ) : (
        <div
          className="animate-aurora absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 0%, ${stops[0]} 0%, ${stops[1]} 45%, ${stops[2]} 100%)`,
          }}
        />
      )}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      )}
    </div>
  );
}
