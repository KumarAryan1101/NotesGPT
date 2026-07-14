"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  { k: "Summary", d: "A teaching-grade recap, key points and a glossary — the whole chapter, distilled." },
  { k: "Flashcards", d: "Elaborated Q&A cards that flip in 3D. Load more anytime; every set is fresh." },
  { k: "Quiz", d: "Endless MCQs with difficulty, explanations and instant scoring to test recall." },
];

export default function ProductTour() {
  const scope = useRef(null);
  const pinRef = useRef(null);
  const panelsRef = useRef([]);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const panels = panelsRef.current.filter(Boolean);
      if (panels.length < 3) return;

      gsap.set(panels[0], { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(panels.slice(1), { autoAlpha: 0, y: 60, scale: 0.94 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scope.current,
          start: "top top",
          end: "+=260%",
          scrub: 0.6,
          pin: pinRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            setActive(p < 0.34 ? 0 : p < 0.67 ? 1 : 2);
          },
        },
      });

      tl.to(panels[0], { autoAlpha: 0, y: -60, scale: 0.94, ease: "power2.inOut" }, 0.0)
        .to(panels[1], { autoAlpha: 1, y: 0, scale: 1, ease: "power2.inOut" }, 0.0)
        .to(panels[1], { autoAlpha: 0, y: -60, scale: 0.94, ease: "power2.inOut" }, 1.0)
        .to(panels[2], { autoAlpha: 1, y: 0, scale: 1, ease: "power2.inOut" }, 1.0);
    },
    { scope }
  );

  // Keep the pin math correct when page height changes (e.g. results render
  // above this section, fonts/video load). Stale measurements are what make
  // the pinned tour overlap other sections.
  useEffect(() => {
    let raf;
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    window.addEventListener("load", refresh);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <section ref={scope} className="relative mt-28 md:mt-40" aria-label="Product tour">
      <div ref={pinRef} className="flex min-h-screen flex-col justify-center bg-paper py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-1 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          {/* left — steps */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">the output</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              One upload, <span className="serif text-accent">three ways</span> to revise.
            </h2>
            <div className="mt-8 space-y-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.k}
                  className={`rounded-2xl border p-4 transition-all duration-500 ${
                    active === i
                      ? "border-accent/30 bg-ink/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                      : "border-transparent bg-transparent opacity-45"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs transition ${
                        active === i ? "bg-ink text-paper" : "bg-ink/10 text-ink/50"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold">{s.k}</h3>
                  </div>
                  <p className="mt-2 pl-11 text-sm leading-relaxed text-ink/60">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* right — device frame with scrubbed panels */}
          <div className="relative">
            <div className="surface relative h-[430px] overflow-hidden rounded-[28px] p-0">
              {/* faux top bar */}
              <div className="flex items-center gap-1.5 border-b border-ink/5 bg-ink/[0.03] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-3 font-mono text-[11px] text-ink/35">notesgpt · thermodynamics.pdf</span>
              </div>

              <div className="relative h-[calc(430px-45px)]">
                {/* Panel 0 — Summary */}
                <Panel refCb={(el) => (panelsRef.current[0] = el)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-600">Summary</p>
                  <h4 className="mt-1 text-lg font-semibold">Laws of Thermodynamics</h4>
                  <div className="mt-3 space-y-2">
                    <Line w="100%" /><Line w="94%" /><Line w="97%" /><Line w="80%" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {["Energy is conserved in any process", "Entropy of an isolated system never decreases"].map((t) => (
                      <div key={t} className="flex items-start gap-2 text-sm text-ink/75">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {t}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Entropy", "Enthalpy", "Adiabatic"].map((g) => (
                      <span key={g} className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-medium text-fuchsia-600">{g}</span>
                    ))}
                  </div>
                </Panel>

                {/* Panel 1 — Flashcards */}
                <Panel refCb={(el) => (panelsRef.current[1] = el)}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-600">Flashcards</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.04] p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-indigo-600">Question</p>
                      <p className="mt-1 text-sm font-medium">What does the first law state?</p>
                      <p className="mt-3 font-mono text-[9px] text-ink/30">tap to flip ↻</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-600">Answer</p>
                      <p className="mt-1 text-sm">Energy can't be created or destroyed, only transformed.</p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4 opacity-70">
                      <Line w="70%" /><div className="h-1" /><Line w="90%" />
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4 opacity-70">
                      <Line w="80%" /><div className="h-1" /><Line w="60%" />
                    </div>
                  </div>
                </Panel>

                {/* Panel 2 — Quiz */}
                <Panel refCb={(el) => (panelsRef.current[2] = el)}>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-600">Quiz</p>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">medium</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">Which quantity always increases in a spontaneous process?</p>
                  <div className="mt-3 space-y-2">
                    {[["A", "Enthalpy", false], ["B", "Entropy", true], ["C", "Pressure", false], ["D", "Volume", false]].map(([l, t, ok]) => (
                      <div key={l} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${ok ? "border-emerald-400/50 bg-emerald-500/10" : "border-ink/10 bg-ink/[0.03]"}`}>
                        <span className="font-semibold text-ink/40">{l}.</span> {t}
                        {ok && <span className="ml-auto text-emerald-600">✓</span>}
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[11px] text-ink/35">↓ scroll to flip through the output</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ children, refCb }) {
  return (
    <div ref={refCb} className="absolute inset-0 p-5" style={{ visibility: "hidden" }}>
      {children}
    </div>
  );
}

function Line({ w }) {
  return <div className="h-2.5 rounded-full bg-ink/10" style={{ width: w }} />;
}
