"use client";

import { useEffect, useRef, useState } from "react";

// Real Spline 3D via the official web-component viewer (loaded from CDN).
// This avoids all Next bundler/exports headaches the npm package causes.
//
// To use YOUR OWN scene: build it at spline.design → Export → "Public URL",
// then paste the .splinecode link below. Everything else keeps working.
const SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
const VIEWER = "https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js";

export default function Hero3D() {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Load the custom-element definition once.
    const ensureScript = () =>
      new Promise((resolve, reject) => {
        if (customElements.get("spline-viewer")) return resolve();
        const existing = document.querySelector(`script[data-spline]`);
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", reject);
          return;
        }
        const s = document.createElement("script");
        s.type = "module";
        s.src = VIEWER;
        s.dataset.spline = "1";
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });

    ensureScript()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        const el = document.createElement("spline-viewer");
        el.setAttribute("url", SCENE);
        el.setAttribute("loading-anim-type", "none");
        el.style.width = "100%";
        el.style.height = "100%";
        el.addEventListener("load", () => !cancelled && setReady(true));
        el.addEventListener("error", () => !cancelled && setFailed(true));
        hostRef.current.appendChild(el);
        // safety: if the scene never fires 'load', reveal fallback gracefully
        setTimeout(() => !cancelled && setReady((r) => r || false), 9000);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
      {/* glow base — also the graceful fallback if the scene can't load */}
      <div
        className={`absolute right-[-12%] top-[-8%] h-[44rem] w-[44rem] rounded-full bg-gradient-to-br from-indigo-300/40 via-fuchsia-200/30 to-emerald-200/30 blur-[90px] transition-opacity duration-700 ${
          ready && !failed ? "opacity-40" : "opacity-100"
        }`}
      />
      <div
        ref={hostRef}
        className={`absolute right-0 top-0 hidden h-full w-full transition-opacity duration-1000 md:block ${
          ready && !failed ? "opacity-100" : "opacity-0"
        }`}
        style={{ maskImage: "radial-gradient(70% 70% at 72% 42%, #000 50%, transparent 100%)" }}
      />
    </div>
  );
}
