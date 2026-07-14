"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import ScrollFX from "./components/ScrollFX";
import ProductTour from "./components/ProductTour";
import { GeneratingOverlay, StudioHero } from "./components/glass";

/* ================================================================== */
/*  Motion helpers                                                     */
/* ================================================================== */

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: i * 0.08 },
  }),
};

function Reveal({ children, delay = 0, className = "", y = 26 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// Typewriter that types `text` then keeps a blinking cursor.
function useTypewriter(text, speed = 45, startDelay = 500) {
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

// Count up to `value` the first time it scrolls into view (and on updates).
function CountUp({ value, duration = 1100 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.6 });
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView && !started.current) return;
    started.current = true;
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf;
    let ts0 = null;
    const step = (t) => {
      if (ts0 === null) ts0 = t;
      const p = Math.min(1, (t - ts0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

/* ================================================================== */
/*  Decorative background                                              */
/* ================================================================== */

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-drift absolute -left-32 -top-24 h-[36rem] w-[36rem] rounded-full bg-emerald-300/15 blur-3xl" />
      <div
        className="animate-drift absolute -right-24 top-24 h-[30rem] w-[30rem] rounded-full bg-lime-200/20 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="animate-drift absolute bottom-[-10rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-200/20 blur-3xl"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
}

/* ================================================================== */
/*  Subject marquee                                                    */
/* ================================================================== */

const SUBJECTS = [
  "Thermodynamics", "Data Structures", "Signals & Systems", "Operating Systems",
  "Fluid Mechanics", "Organic Chemistry", "Linear Algebra", "Machine Learning",
  "Computer Networks", "Control Systems", "Microprocessors", "Discrete Maths",
  "Electromagnetics", "Compiler Design", "Strength of Materials",
];

function MarqueeRow({ reverse = false }) {
  const loop = [...SUBJECTS, ...SUBJECTS];
  return (
    <div className={`flex w-max gap-3 ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
      {loop.map((s, i) => (
        <span
          key={i}
          className="shrink-0 rounded-full border border-ink/10 bg-ink/5 px-5 py-2.5 text-sm text-ink/70 backdrop-blur"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Live dashboard                                                     */
/* ================================================================== */

const STAT_CARDS = [
  { key: "summaries", label: "Notes summarized", accent: "text-indigo-600" },
  { key: "flashcards", label: "Flashcards created", accent: "text-fuchsia-600" },
  { key: "questions", label: "Quiz questions generated", accent: "text-emerald-600" },
];

function LiveDashboard({ refreshKey }) {
  const [stats, setStats] = useState({ summaries: 0, flashcards: 0, questions: 0 });
  useEffect(() => {
    let alive = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = await res.json();
        if (alive) setStats(data);
      } catch {}
    };
    fetchStats();
    const id = setInterval(fetchStats, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STAT_CARDS.map((c, i) => (
        <Reveal key={c.key} delay={i * 0.1}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="surface rounded-[28px] p-6 text-center"
          >
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                live
              </span>
            </div>
            <p className={`text-4xl font-semibold tracking-tight ${c.accent}`}>
              <CountUp value={stats[c.key] || 0} />
            </p>
            <p className="mt-1.5 text-sm text-ink/55">{c.label}</p>
          </motion.div>
        </Reveal>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function Home() {
  const [mode, setMode] = useState("pdf");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("summary");
  const [statsKey, setStatsKey] = useState(0);

  const [quizVersion, setQuizVersion] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [banner, setBanner] = useState("");

  const fileRef = useRef(null);
  const appRef = useRef(null);
  const resultRef = useRef(null);

  async function callApi(payload) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function handleGenerate() {
    setError("");
    setBanner("");
    setResult(null);
    if (mode === "pdf" && !file) return setError("Please choose a PDF first.");
    // Match the server's 10 MB cap so oversized files get a friendly message
    // here instead of a dropped request at the platform body-size limit.
    if (mode === "pdf" && file && file.size > 10 * 1024 * 1024)
      return setError("That PDF is over 10 MB. Please upload a smaller file.");
    if (mode === "text" && text.trim().length < 40)
      return setError("Please paste at least a few sentences of notes.");

    setLoading(true);
    try {
      const fd = new FormData();
      if (mode === "pdf") fd.append("file", file);
      else fd.append("text", text);
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      setTab("summary");
      setQuizVersion((v) => v + 1);
      setStatsKey((k) => k + 1);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function newQuiz() {
    if (!result?.sourceText) return;
    setQuizLoading(true);
    setBanner("");
    try {
      const data = await callApi({
        text: result.sourceText,
        action: "quiz",
        exclude: (result.quiz || []).map((q) => q.question),
      });
      if (data.quiz?.length) {
        setResult((r) => ({ ...r, quiz: data.quiz }));
        setQuizVersion((v) => v + 1);
        setStatsKey((k) => k + 1);
      } else setBanner("Couldn't fetch new questions — try again in a moment.");
    } catch (e) {
      setBanner(e.message);
    } finally {
      setQuizLoading(false);
    }
  }

  async function moreCards() {
    if (!result?.sourceText) return;
    setCardsLoading(true);
    setBanner("");
    try {
      const data = await callApi({
        text: result.sourceText,
        action: "flashcards",
        exclude: (result.flashcards || []).map((c) => c.q),
      });
      if (data.flashcards?.length) {
        setResult((r) => ({ ...r, flashcards: [...r.flashcards, ...data.flashcards] }));
        setStatsKey((k) => k + 1);
      } else setBanner("Couldn't fetch more cards — try again in a moment.");
    } catch (e) {
      setBanner(e.message);
    } finally {
      setCardsLoading(false);
    }
  }

  const goApp = () => appRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <>
      <Aurora />
      <ScrollFX />
      <GeneratingOverlay show={loading} action="full" />

      {/* ================= HERO (Creative Studio · spotlight reveal, light) ================= */}
      <StudioHero onOpenApp={goApp} />

      <main className="mx-auto max-w-6xl px-5 pb-32">
        {/* ================= MARQUEE ================= */}
        <section data-parallax="0.06" className="edge-fade mt-20 space-y-3 overflow-hidden md:mt-28">
          <MarqueeRow />
          <MarqueeRow reverse />
        </section>

        {/* ================= APP ================= */}
        <section id="app" ref={appRef} className="mt-24 scroll-mt-24 md:mt-32">
          <Reveal className="mb-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">the app</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Drop it in. Get <span className="serif text-accent">study-ready</span> material.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="surface mx-auto max-w-2xl rounded-[32px] p-6 md:p-8">
              <div className="mb-5 inline-flex rounded-full bg-ink/5 p-1">
                <SegBtn active={mode === "pdf"} onClick={() => setMode("pdf")}>📄 Upload PDF</SegBtn>
                <SegBtn active={mode === "text"} onClick={() => setMode("text")}>✍️ Paste text</SegBtn>
              </div>

              {mode === "pdf" ? (
                <motion.div
                  whileHover={{ scale: 1.006 }}
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 bg-ink/[0.02] px-4 py-12 text-center transition hover:border-accent/50 hover:bg-ink/[0.05]"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-4xl">{file ? "📗" : "📚"}</div>
                  <p className="mt-3 font-medium">{file ? file.name : "Click to choose a PDF"}</p>
                  <p className="mt-1 text-xs text-ink/40">Text-based PDFs only (scanned images not supported yet)</p>
                </motion.div>
              ) : (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your lecture notes here…"
                  className="h-48 w-full resize-y rounded-2xl border border-ink/10 bg-ink/[0.02] p-4 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-accent/50 focus:bg-ink/[0.05]"
                />
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-ink mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Spinner /> Thinking…
                  </>
                ) : (
                  "Generate study material →"
                )}
              </button>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          {loading && <Skeleton />}

          <AnimatePresence>
            {result && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="mx-auto mt-10 max-w-3xl scroll-mt-24"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold tracking-tight">{result.title}</h3>
                  <ExportButtons result={result} />
                </div>
                {result.truncated && (
                  <p className="mb-3 text-xs text-amber-600">
                    Note: your notes were long, so we used the first portion.
                  </p>
                )}

                <div className="mb-5 flex flex-wrap gap-2">
                  <Pill active={tab === "summary"} onClick={() => setTab("summary")}>📝 Summary</Pill>
                  <Pill active={tab === "cards"} onClick={() => setTab("cards")}>🎴 Flashcards ({result.flashcards.length})</Pill>
                  <Pill active={tab === "quiz"} onClick={() => setTab("quiz")}>🧠 Quiz ({result.quiz.length})</Pill>
                </div>

                {banner && (
                  <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
                    {banner}
                  </p>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    {tab === "summary" && <Summary result={result} />}
                    {tab === "cards" && <Flashcards cards={result.flashcards} loading={cardsLoading} onMore={moreCards} />}
                    {tab === "quiz" && <Quiz key={quizVersion} quiz={result.quiz} loading={quizLoading} onNew={newQuiz} />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ================= LIVE STATS ================= */}
        <section id="stats" className="mt-28 scroll-mt-24 md:mt-36">
          <Reveal className="mb-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/40">trusted by students</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              A study engine that&apos;s <span className="serif text-accent">always running</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-ink/55">
              These numbers update live as students around campus turn their notes
              into revision material.
            </p>
          </Reveal>
          <LiveDashboard refreshKey={statsKey} />
        </section>

        {/* ================= PRODUCT TOUR (how it works) ================= */}
        <div id="how" className="scroll-mt-24">
          <ProductTour />
        </div>

        {/* ================= EDITORIAL QUOTE ================= */}
        <section className="mt-28 md:mt-40">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-3xl font-medium leading-[1.25] tracking-tight md:text-5xl">
              It&apos;s like having a <span className="serif text-accent">topper</span> explain
              the whole chapter — <span className="serif text-accent">the night before</span> the exam.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-ink/40">
              — the idea behind NotesGPT
            </p>
          </Reveal>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="mx-auto max-w-6xl px-5 pb-28">
        <Reveal>
          <div className="surface flex flex-col items-center gap-6 rounded-[32px] px-8 py-12 text-center">
            <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to <span className="serif text-accent">ace</span> the next one?
            </h3>
            <button onClick={goApp} className="magnetic btn-ink rounded-full px-8 py-3.5 font-medium">
              Summarize my notes →
            </button>
            <p className="font-mono text-xs text-ink/40">Built with Next.js + Groq · a NotesGPT study tool</p>
          </div>
        </Reveal>
      </footer>

      {/* ---- Floating bottom nav ---- */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
        <div className="surface flex items-center gap-3 rounded-full px-3 py-2 pl-5">
          <span className="serif text-lg text-accent">N</span>
          <button onClick={goApp} className="btn-ink rounded-full px-5 py-2 text-sm font-medium">
            Start now
          </button>
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function SegBtn({ active, onClick, children, groupId = "seg" }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "text-paper" : "text-ink/60 hover:text-ink"
      }`}
    >
      {active && (
        <motion.span
          layoutId={groupId}
          className="absolute inset-0 rounded-full bg-ink"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "btn-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
  );
}

function ListenButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  if (!supported || !text) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  return (
    <button
      onClick={toggle}
      className="magnetic flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60 transition hover:border-accent/40 hover:text-accent"
      aria-label={speaking ? "Stop reading summary" : "Listen to summary"}
    >
      {speaking ? "◼ stop" : "▶ listen"}
    </button>
  );
}

function Summary({ result }) {
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
  };
  return (
    <div className="space-y-5">
      <div className="surface rounded-[28px] p-6 md:p-7">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-indigo-600">summary</span>
          <span className="h-px flex-1 bg-ink/10" />
          <ListenButton text={`${result.title ? result.title + ". " : ""}${result.summary}`} />
          <span className="font-mono text-[10px] text-ink/35">{result.summary.split(/\s+/).length} words</span>
        </div>
        <p className="whitespace-pre-line text-[15px] leading-[1.8] text-ink/80">{result.summary}</p>
      </div>

      {result.keyPoints.length > 0 && (
        <div className="surface rounded-[28px] p-6 md:p-7">
          <h4 className="mb-4 font-semibold text-indigo-600">Key points</h4>
          <motion.ul
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-3"
          >
            {result.keyPoints.map((p, i) => (
              <motion.li key={i} variants={item} className="flex gap-3 text-ink/80">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-[10px] font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{p}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}

      {result.glossary?.length > 0 && (
        <div className="surface rounded-[28px] p-6 md:p-7">
          <h4 className="mb-4 font-semibold text-fuchsia-600">Glossary</h4>
          <Glossary items={result.glossary} />
        </div>
      )}
    </div>
  );
}

function Glossary({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-ink/8">
      {items.map((g, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="py-1">
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-2.5 text-left"
            >
              <span className={`font-medium transition-colors ${isOpen ? "text-accent" : "text-ink"}`}>{g.term}</span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/50">
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="pb-3 pr-10 text-sm leading-relaxed text-ink/60">{g.definition}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function Flashcards({ cards, loading, onMore }) {
  const [view, setView] = useState("grid");
  if (!cards.length) return <Empty label="No flashcards were generated." />;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-ink/5 p-1">
          <SegBtn groupId="cards" active={view === "grid"} onClick={() => setView("grid")}>▦ Grid</SegBtn>
          <SegBtn groupId="cards" active={view === "study"} onClick={() => setView("study")}>🎯 Study mode</SegBtn>
        </div>
        <span className="font-mono text-xs text-ink/40">{cards.length} cards</span>
      </div>

      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 sm:grid-cols-2">
            {cards.map((c, i) => (
              <Flashcard key={i} card={c} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="study" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StudyDeck cards={cards} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onMore}
        disabled={loading}
        className="btn-soft mt-5 w-full rounded-2xl px-4 py-3.5 font-medium text-accent disabled:opacity-60"
      >
        {loading ? "Fetching more cards… ✨" : "➕ Load more flashcards"}
      </button>
    </div>
  );
}

function StudyDeck({ cards }) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dir, setDir] = useState(1);

  // keep order length in sync when more cards are loaded
  useEffect(() => {
    setOrder((o) => (o.length === cards.length ? o : cards.map((_, i) => i)));
  }, [cards.length]);

  const len = order.length;
  const card = cards[order[pos]] || cards[0];

  const go = (delta) => {
    setDir(delta);
    setFlipped(false);
    setPos((p) => (p + delta + len) % len);
  };
  const shuffle = () => {
    const a = [...order];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setOrder(a);
    setPos(0);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [len]);

  return (
    <div>
      {/* progress */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${((pos + 1) / len) * 100}%` }}
            transition={{ ease: EASE, duration: 0.4 }}
          />
        </div>
        <span className="font-mono text-xs text-ink/45">{pos + 1} / {len}</span>
      </div>

      {/* big card */}
      <div className="relative h-72">
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.div
            key={pos + "-" + order[pos]}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60, rotateZ: dir * 2 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, x: dir * -60, rotateZ: dir * -2 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0"
          >
            <div className="card-3d h-full cursor-pointer select-none" onClick={() => setFlipped((f) => !f)}>
              <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                <div className="card-face surface rounded-[28px] p-8 text-center">
                  <div>
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-indigo-600">Question</p>
                    <p className="text-xl font-medium leading-snug text-ink">{card.q}</p>
                    <p className="mt-4 font-mono text-[10px] text-ink/35">click / space to reveal</p>
                  </div>
                </div>
                <div className="card-face card-back rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-8 text-center backdrop-blur">
                  <div className="thin max-h-full overflow-y-auto">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-600">Answer</p>
                    <p className="text-lg text-ink">{card.a}</p>
                    {card.detail && <p className="mt-3 text-sm text-ink/55">{card.detail}</p>}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={() => go(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 bg-ink/5 text-lg text-ink transition hover:bg-ink/10">←</button>
        <button onClick={() => setFlipped((f) => !f)} className="btn-soft rounded-full px-5 py-2.5 text-sm font-medium">↻ Flip</button>
        <button onClick={shuffle} className="btn-soft rounded-full px-5 py-2.5 text-sm font-medium">🔀 Shuffle</button>
        <button onClick={() => go(1)} className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 bg-ink/5 text-lg text-ink transition hover:bg-ink/10">→</button>
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-ink/35">tip: use ← → to move, space to flip</p>
    </div>
  );
}

function Flashcard({ card, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 2) * 0.05, ease: EASE }}
      className="card-3d h-52 cursor-pointer select-none"
      onClick={() => setFlipped((f) => !f)}
    >
      <div className={`card-inner ${flipped ? "flipped" : ""}`}>
        <div className="card-face surface rounded-[24px] p-5 text-center">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-600">Question</p>
            <p className="font-medium text-ink">{card.q}</p>
            <p className="mt-3 font-mono text-[10px] text-ink/35">tap to flip</p>
          </div>
        </div>
        <div className="card-face card-back rounded-[24px] border border-emerald-400/30 bg-emerald-500/10 p-5 text-center backdrop-blur">
          <div className="thin max-h-full overflow-y-auto">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600">Answer</p>
            <p className="text-ink">{card.a}</p>
            {card.detail && <p className="mt-2 text-xs text-ink/55">{card.detail}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const DIFF_STYLES = {
  easy: "bg-emerald-500/15 text-emerald-600",
  medium: "bg-amber-500/15 text-amber-700",
  hard: "bg-red-500/15 text-red-600",
};

function Quiz({ quiz, loading, onNew }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  if (!quiz.length) return <Empty label="No quiz was generated." />;
  const score = quiz.reduce((acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0), 0);
  const answered = Object.keys(answers).length;
  const pct = Math.round((score / quiz.length) * 100);

  if (submitted) {
    return (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="surface relative overflow-hidden rounded-[28px] p-8 text-center"
        >
          {pct >= 80 && <Confetti />}
          <ScoreRing pct={pct} score={score} total={quiz.length} />
          <p className="mt-4 text-lg font-medium">
            {pct === 100 ? "Perfect score! 🎉" : pct >= 60 ? "Nice work — review the misses below." : "Keep studying — you've got this 💪"}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="btn-soft rounded-full px-5 py-2.5 text-sm font-medium">
              ↻ Retry same questions
            </button>
            <button onClick={onNew} disabled={loading} className="magnetic btn-ink rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60">
              {loading ? "Generating…" : "✨ New questions"}
            </button>
          </div>
        </motion.div>

        <p className="px-1 font-mono text-xs uppercase tracking-[0.2em] text-ink/40">review</p>
        {quiz.map((q, i) => (
          <div key={i} className="surface rounded-[28px] p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-medium">
                <span className="text-accent">Q{i + 1}.</span> {q.question}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${answers[i] === q.answerIndex ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>
                {answers[i] === q.answerIndex ? "correct" : answers[i] == null ? "skipped" : "wrong"}
              </span>
            </div>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const isCorrect = q.answerIndex === oi;
                const chosen = answers[i] === oi;
                let cls = "border-ink/10 bg-ink/[0.03]";
                if (isCorrect) cls = "border-emerald-400/50 bg-emerald-500/10";
                else if (chosen) cls = "border-red-400/50 bg-red-500/10";
                return (
                  <div key={oi} className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${cls}`}>
                    <span className="font-semibold text-ink/40">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                    {isCorrect && <span className="ml-auto text-emerald-600">✓</span>}
                    {chosen && !isCorrect && <span className="ml-auto text-red-500">✗</span>}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-ink/60">
              <span className="font-medium text-emerald-600">Why:</span> {q.explanation}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="surface flex items-center gap-3 rounded-2xl px-4 py-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
          <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${(answered / quiz.length) * 100}%` }} transition={{ ease: EASE }} />
        </div>
        <span className="font-mono text-xs text-ink/45">{answered}/{quiz.length}</span>
      </div>

      {quiz.map((q, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="surface rounded-[28px] p-6"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="font-medium">
              <span className="text-accent">Q{i + 1}.</span> {q.question}
            </p>
            {q.difficulty && (
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFF_STYLES[q.difficulty] || "bg-ink/10 text-ink/60"}`}>
                {q.difficulty}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            {q.options.map((opt, oi) => {
              const chosen = answers[i] === oi;
              return (
                <motion.button
                  key={oi}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                    chosen ? "border-accent/60 bg-accent/5" : "border-ink/10 bg-ink/[0.03] hover:bg-ink/[0.06]"
                  }`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition ${chosen ? "bg-accent text-paper" : "bg-ink/8 text-ink/40"}`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}

      <button onClick={() => setSubmitted(true)} className="magnetic btn-ink w-full rounded-2xl px-4 py-4 font-medium">
        Submit quiz {answered < quiz.length ? `(${quiz.length - answered} unanswered)` : "→"}
      </button>
    </div>
  );
}

function ScoreRing({ pct, score, total }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const stroke = pct >= 80 ? "#10B981" : pct >= 50 ? "#5B4DF5" : "#EF4444";
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(28,46,30,0.10)" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={r} fill="none" stroke={stroke} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-tight text-ink">{pct}%</p>
          <p className="font-mono text-xs text-ink/45">{score}/{total}</p>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#5B4DF5", "#EC4899", "#10B981", "#F59E0B", "#6366F1"];
  const pieces = Array.from({ length: 40 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 120 + Math.random() * 160;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-[42%] h-2 w-2 rounded-[2px]"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x, y: y + 200, opacity: 0, scale: 0.5, rotate: Math.random() * 420 }}
            transition={{ duration: 1.5 + Math.random() * 0.7, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

function ExportButtons({ result }) {
  const [copied, setCopied] = useState(false);
  function toMarkdown() {
    const lines = [`# ${result.title}`, "", "## Summary", result.summary, ""];
    if (result.keyPoints?.length) lines.push("## Key points", ...result.keyPoints.map((p) => `- ${p}`), "");
    if (result.glossary?.length) lines.push("## Glossary", ...result.glossary.map((g) => `- **${g.term}**: ${g.definition}`), "");
    if (result.flashcards?.length) {
      lines.push("## Flashcards");
      result.flashcards.forEach((c, i) => lines.push(`${i + 1}. **Q:** ${c.q}`, `   **A:** ${c.a}${c.detail ? ` — ${c.detail}` : ""}`));
      lines.push("");
    }
    if (result.quiz?.length) {
      lines.push("## Quiz");
      result.quiz.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.question}`);
        q.options.forEach((o, oi) => lines.push(`   ${String.fromCharCode(65 + oi)}. ${o}`));
        lines.push(`   → Answer: ${String.fromCharCode(65 + q.answerIndex)} (${q.explanation})`, "");
      });
    }
    return lines.join("\n");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(toMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  function download() {
    const blob = new Blob([toMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^\w]+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="flex gap-2">
      <button onClick={copy} className="btn-soft rounded-full px-3.5 py-1.5 text-sm">{copied ? "✓ Copied" : "📋 Copy"}</button>
      <button onClick={download} className="btn-soft rounded-full px-3.5 py-1.5 text-sm">⬇️ Download</button>
    </div>
  );
}

function Empty({ label }) {
  return <div className="surface rounded-[28px] p-8 text-center text-ink/50">{label}</div>;
}

function Skeleton() {
  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface h-20 animate-pulse rounded-[28px]" />
      ))}
    </div>
  );
}
