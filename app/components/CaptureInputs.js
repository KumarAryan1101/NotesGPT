"use client";

/* Photo + voice inputs for the study page.
   - PhotoCapture: live camera (or file pick), sends the frame to /api/vision
     which classifies legit study material vs nonsense and transcribes it.
   - VoiceCapture: browser SpeechRecognition → live transcript into `text`.
   Both feed the same `text` state the Generate button already uses.        */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, Check, X, Mic, Square, Upload, Youtube } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/* Downscale + JPEG-compress a frame so uploads stay small. */
function frameToDataUrl(source, w, h) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1280 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function PhotoCapture({ text, setText }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [live, setLive] = useState(false);
  const [shot, setShot] = useState(null); // data-url of the captured frame
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState(null); // /api/vision response
  const [err, setErr] = useState("");

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function startCamera() {
    setErr("");
    setShot(null);
    setVerdict(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      setLive(true);
      // let the <video> mount, then attach
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setErr("Camera unavailable — check permissions, or attach a photo instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }

  function snap() {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const url = frameToDataUrl(v, v.videoWidth, v.videoHeight);
    stopCamera();
    setShot(url);
    analyse(url);
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    setVerdict(null);
    const img = new Image();
    img.onload = () => {
      const url = frameToDataUrl(img, img.naturalWidth, img.naturalHeight);
      setShot(url);
      analyse(url);
    };
    img.onerror = () => setErr("Could not read that image file.");
    img.src = URL.createObjectURL(f);
    e.target.value = "";
  }

  async function analyse(dataUrl) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not analyse the photo.");
      setVerdict(data);
      if (data.legit && data.text) {
        setText((t) => (t.trim() ? t.trimEnd() + "\n\n" + data.text : data.text));
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const retake = () => {
    setShot(null);
    setVerdict(null);
    startCamera();
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-ink/[0.02]">
        {live ? (
          <>
            <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
              <button onClick={snap} className="btn-ink flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium">
                <Camera className="h-4 w-4" /> Capture
              </button>
              <button onClick={stopCamera} className="btn-soft rounded-full px-4 py-2.5 text-sm font-medium">
                Cancel
              </button>
            </div>
          </>
        ) : shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Captured notes" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="text-4xl">📸</div>
            <p className="font-medium">Photograph your notes</p>
            <p className="max-w-xs text-xs text-ink/40">
              Point at handwritten notes, a textbook page, slides or a whiteboard.
              The AI checks it&apos;s real study material, then reads it for you.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <button onClick={startCamera} className="btn-ink flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium">
                <Camera className="h-4 w-4" /> Open camera
              </button>
              <button onClick={() => fileRef.current?.click()} className="btn-soft flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium">
                <Upload className="h-4 w-4" /> Attach photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
            </div>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              Checking &amp; reading your photo…
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {verdict && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              verdict.legit
                ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-700"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700"
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${verdict.legit ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
              {verdict.legit ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
            <span>
              <span className="font-semibold capitalize">
                {verdict.legit ? `${verdict.kind} detected` : "Not study material"}
              </span>{" "}
              <span className="opacity-70">({verdict.confidence}% sure)</span>
              <span className="block opacity-80">{verdict.reason}</span>
            </span>
            {shot && (
              <button onClick={retake} className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-xs font-medium">
                <RefreshCw className="h-3 w-3" /> Retake
              </button>
            )}
          </motion.div>
        )}
        {err && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {err}
          </motion.p>
        )}
      </AnimatePresence>

      {text.trim() && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
            extracted text · editable
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-28 w-full resize-y bg-transparent text-sm text-ink outline-none"
          />
        </div>
      )}
    </div>
  );
}

/* ---- Voice ----------------------------------------------------------- */

function VoiceCapture({ text, setText }) {
  const recRef = useRef(null);
  const finalRef = useRef("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [err, setErr] = useState("");
  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => () => recRef.current?.stop(), []);

  function start() {
    setErr("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    finalRef.current = text.trim() ? text.trimEnd() + "\n" : "";
    rec.onresult = (e) => {
      let interimNow = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += chunk + " ";
        else interimNow += chunk;
      }
      setText(finalRef.current);
      setInterim(interimNow);
    };
    rec.onerror = (e) => {
      setErr(
        e.error === "not-allowed"
          ? "Microphone blocked — allow mic access and try again."
          : "Speech recognition hiccup — tap the mic to resume."
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
    setInterim("");
  }

  if (!supported) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-ink/[0.02] p-8 text-center">
        <p className="font-medium">Voice input isn&apos;t supported in this browser.</p>
        <p className="mt-1 text-xs text-ink/40">Try Chrome or Edge — or switch to ✍️ Text and type instead.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-ink/15 bg-ink/[0.02] px-6 py-10 text-center">
        <motion.button
          onClick={listening ? stop : start}
          whileTap={{ scale: 0.92 }}
          className={`relative grid h-20 w-20 place-items-center rounded-full transition ${
            listening ? "bg-red-500 text-white" : "bg-accent text-paper hover:brightness-110"
          }`}
          aria-label={listening ? "Stop recording" : "Start recording"}
        >
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400/50" />
          )}
          {listening ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
        </motion.button>
        <div>
          <p className="font-medium">{listening ? "Listening… speak your notes" : "Dictate your notes"}</p>
          <p className="mt-1 text-xs text-ink/40">
            {listening
              ? "Tap the square to stop. Punctuation like “full stop” works too."
              : "Tap the mic and read out your notes, definitions or a lecture recap."}
          </p>
        </div>
        {interim && (
          <p className="max-w-md text-sm italic text-ink/45">…{interim}</p>
        )}
      </div>

      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
            {err}
          </motion.p>
        )}
      </AnimatePresence>

      {text.trim() && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
              transcript · editable
            </p>
            <span className="font-mono text-[10px] text-ink/35">{text.trim().split(/\s+/).length} words</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-32 w-full resize-y bg-transparent text-sm text-ink outline-none"
          />
        </div>
      )}
    </div>
  );
}

/* ---- YouTube --------------------------------------------------------- */

function YouTubeCapture({ text, setText }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState(null); // { title, words } after a successful fetch

  async function fetchTranscript() {
    const link = url.trim();
    if (!link || busy) return;
    setBusy(true);
    setErr("");
    setInfo(null);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not fetch the transcript.");
      const t = (data.text || "").trim();
      if (!t) throw new Error("No transcript text was found for that video.");
      setText((prev) => (prev.trim() ? prev.trimEnd() + "\n\n" + t : t));
      setInfo({ title: data.title || "Video transcript", words: t.split(/\s+/).length });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-ink/[0.02] p-6 text-center">
        <div className="text-4xl">▶️</div>
        <p className="mt-3 font-medium">Summarise a YouTube video</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-ink/40">
          Paste a link to a lecture, tutorial or explainer. We pull its captions,
          then turn them into notes, flashcards and a quiz.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchTranscript(); } }}
            placeholder="https://www.youtube.com/watch?v=…"
            className="flex-1 rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-accent/50"
          />
          <button
            onClick={fetchTranscript}
            disabled={busy || !url.trim()}
            className="btn-ink flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
                Fetching…
              </>
            ) : (
              <>
                <Youtube className="h-4 w-4" /> Fetch transcript
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {info && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15">
              <Check className="h-3 w-3" />
            </span>
            <span>
              <span className="font-semibold">Transcript added</span>
              <span className="block opacity-80">
                {info.title} · {info.words} words — edit below, then Generate.
              </span>
            </span>
          </motion.div>
        )}
        {err && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {err}
          </motion.p>
        )}
      </AnimatePresence>

      {text.trim() && (
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
              transcript · editable
            </p>
            <span className="font-mono text-[10px] text-ink/35">{text.trim().split(/\s+/).length} words</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-32 w-full resize-y bg-transparent text-sm text-ink outline-none"
          />
        </div>
      )}
    </div>
  );
}

export default function CaptureInputs({ mode, text, setText }) {
  if (mode === "photo") return <PhotoCapture text={text} setText={setText} />;
  if (mode === "youtube") return <YouTubeCapture text={text} setText={setText} />;
  return <VoiceCapture text={text} setText={setText} />;
}
