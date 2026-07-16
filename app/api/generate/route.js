import Groq from "groq-sdk";
import { getDocumentProxy } from "unpdf";
import { rateLimit } from "@/lib/ratelimit";
import { bumpStats } from "@/lib/stats";

// Run on the Node.js runtime (unpdf + Buffer need it, not the Edge runtime).
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Keep input within a comfortable size so we stay under Groq's free-tier
// tokens-per-minute limits. ~16k chars ≈ a big lecture handout.
const MAX_CHARS = 16000;

// Reject oversized uploads before we buffer/parse them. A public endpoint
// with no cap lets anyone hand us a multi-hundred-MB "PDF" to exhaust memory
// and function time. 10 MB comfortably covers real lecture handouts.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
// Same idea for pasted/JSON text — bound it so a giant paste can't blow past
// what we'd ever feed the model anyway.
const MAX_TEXT_BYTES = 2 * 1024 * 1024;

// Thrown from readInput; carries an HTTP status so the handler can map it.
class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

const RULES = `Base everything ONLY on the provided notes; do not invent facts not implied by them. Keep language student-friendly. Respond with ONE valid JSON object and nothing else — no markdown fences.`;

// Short inputs ("explain the OSI model", a 10-word jotting, a sparse PDF) are a
// topic to teach, not notes to stay grounded in — so the model is allowed to
// use its own knowledge instead of being pinned to the (near-empty) text.
const TOPIC_RULES = `The student gave a short topic, question, or very brief notes rather than full notes. Treat it as the subject to teach: explain it accurately from your own knowledge at an undergraduate level, covering the essentials a student needs. If it is phrased as a question, answer it thoroughly. Keep language student-friendly. Respond with ONE valid JSON object and nothing else — no markdown fences.`;

// Extract text page-by-page and stop as soon as we have enough. We only ever
// feed MAX_CHARS to the model, so pulling every page of a 700-page PDF is pure
// waste — and on a serverless function that wasted extraction blows the timeout.
// Reading until we cross the limit keeps huge PDFs fast (a few pages) while
// small ones still yield all their text.
async function extractPdfText(buf, maxChars) {
  const pdf = await getDocumentProxy(buf);
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str ?? "").join(" ") + "\n";
    if (out.length >= maxChars) break;
  }
  return out;
}

// ---- Prompts per action -----------------------------------------------------

function fullPrompt(rules) {
  return `You are NotesGPT, an expert study assistant for engineering students. Turn the notes into rich study material as a JSON object with this exact shape:
{
  "title": "a short 3-6 word title",
  "summary": "a detailed, well-structured 8-12 sentence summary that actually teaches the topic",
  "keyPoints": ["6 to 8 important bullet points"],
  "glossary": [{ "term": "important term", "definition": "one-line plain-English meaning" }],   // 5 to 8 terms
  "flashcards": [{ "q": "question", "a": "concise answer", "detail": "1-2 sentence elaboration explaining WHY / extra context" }],  // 8 to 12 cards
  "quiz": [{ "question": "MCQ testing understanding", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "why it's correct", "difficulty": "easy|medium|hard" }]  // 6 questions
}
Make quiz distractors plausible but clearly wrong. ${rules}`;
}

function quizPrompt(difficulty, rules) {
  let diffLine = "Use a mix of difficulties.";
  if (["easy", "medium", "hard"].includes(difficulty)) {
    diffLine = `ALL questions must be "${difficulty}" difficulty.`;
  } else if (difficulty) {
    // Free-text "custom" mode — the student describes what they want.
    diffLine = `The student asked for this style of questions: "${difficulty.slice(0, 200)}". Follow it while staying faithful to the notes.`;
  }
  return `You are NotesGPT. Create a FRESH set of multiple-choice quiz questions from the notes. Return JSON:
{ "quiz": [{ "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "...", "difficulty": "easy|medium|hard" }] }
Generate 6 questions. ${diffLine} They must be DIFFERENT from any listed as already-used, testing different sub-topics. Distractors plausible but clearly wrong. ${rules}`;
}

function flashPrompt(rules) {
  return `You are NotesGPT. Create a FRESH set of elaborated flashcards from the notes. Return JSON:
{ "flashcards": [{ "q": "question", "a": "concise answer", "detail": "1-2 sentence elaboration / why it matters" }] }
Generate 8 cards. They must be DIFFERENT from any listed as already-used, covering different sub-topics. ${rules}`;
}

// ---- Input handling ---------------------------------------------------------

async function readInput(req) {
  const contentType = req.headers.get("content-type") || "";

  // JSON body → regeneration requests carry the already-extracted text.
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const text = (body.text || "").toString();
    if (text.length > MAX_TEXT_BYTES) {
      throw new InputError("That text is too large. Please shorten it.", 413);
    }
    return {
      text,
      action: body.action || "full",
      exclude: Array.isArray(body.exclude) ? body.exclude.slice(0, 40) : [],
      difficulty: typeof body.difficulty === "string" ? body.difficulty.slice(0, 200) : "",
    };
  }

  // multipart/form-data — first upload (PDF or pasted text).
  const form = await req.formData();
  const pasted = form.get("text");
  if (pasted && pasted.toString().trim()) {
    const text = pasted.toString();
    if (text.length > MAX_TEXT_BYTES) {
      throw new InputError("That text is too large. Please shorten it.", 413);
    }
    return { text, action: "full", exclude: [] };
  }

  const file = form.get("file");
  if (file && typeof file.arrayBuffer === "function") {
    // Reject by declared size first (cheap), before we ever buffer it.
    if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
      throw new InputError("PDF is too large (max 10 MB).", 413);
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    // Guard again on the real byte length in case size was absent/spoofed.
    if (buf.byteLength > MAX_UPLOAD_BYTES) {
      throw new InputError("PDF is too large (max 10 MB).", 413);
    }
    const joined = await extractPdfText(buf, MAX_CHARS);
    return { text: joined, action: "full", exclude: [] };
  }

  return { text: "", action: "full", exclude: [] };
}

// ---- Handler ----------------------------------------------------------------

export async function POST(req) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "Missing GROQ_API_KEY. Add it to .env.local (see .env.local.example)." },
      { status: 500 }
    );
  }

  // Per-IP rate limit — protects your Groq quota from public abuse.
  const limit = rateLimit(getIp(req), { max: 8, windowMs: 60000 });
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let input;
  try {
    input = await readInput(req);
  } catch (e) {
    // Size-cap rejections carry their own status/message; everything else is
    // a generic unreadable-input 400.
    if (e instanceof InputError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    return Response.json(
      { error: "Could not read the input. If it's a PDF, make sure it's a real text-based PDF (not a scanned image)." },
      { status: 400 }
    );
  }

  const notes = (input.text || "").trim();
  if (notes.length < 3) {
    return Response.json(
      { error: "Type a topic or paste some notes first — even a few words work. (Scanned-image PDFs aren't supported yet.)" },
      { status: 400 }
    );
  }

  // Under ~40 words we can't ground the output in the text anyway — treat it
  // as a topic request and let the model teach from its own knowledge.
  const wordCount = notes.split(/\s+/).filter(Boolean).length;
  const rules = wordCount < 40 ? TOPIC_RULES : RULES;

  const truncated = notes.slice(0, MAX_CHARS);
  const action = ["full", "quiz", "flashcards"].includes(input.action) ? input.action : "full";

  const system =
    action === "quiz" ? quizPrompt(input.difficulty, rules) : action === "flashcards" ? flashPrompt(rules) : fullPrompt(rules);

  // Variation seed + exclusions make each Retry / "load more" genuinely fresh.
  const seed = Math.floor(Math.random() * 1_000_000);
  const excludeLine =
    input.exclude.length > 0
      ? `\n\nAlready used (do NOT repeat these, make new ones):\n- ${input.exclude.join("\n- ")}`
      : "";

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Groq's free tier caps input + max_tokens per minute (12k TPM). A full
  // generation needs a big JSON back, so we reserve less for regen requests.
  const maxOut = action === "full" ? 5000 : 3000;

  try {
    // Token-dense PDFs (e.g. numeric tables) can pack ~2 chars/token, so 16k
    // chars can exceed the TPM limit even though normal prose fits fine. On a
    // 413 we trim the notes and retry rather than failing the whole request.
    let notesForModel = truncated;
    let completion;
    for (let attempt = 0; ; attempt++) {
      try {
        completion = await groq.chat.completions.create({
          model: MODEL,
          temperature: action === "full" ? 0.4 : 0.85, // more variety when regenerating
          max_tokens: maxOut,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: `Notes below. Variation seed: ${seed}.${excludeLine}\n\n---NOTES START---\n${notesForModel}\n---NOTES END---`,
            },
          ],
        });
        break;
      } catch (e) {
        if (e?.status === 413 && attempt < 2 && notesForModel.length > 3000) {
          notesForModel = notesForModel.slice(0, Math.floor(notesForModel.length * 0.6));
          continue;
        }
        throw e;
      }
    }

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    const cleanQuiz = (arr) =>
      Array.isArray(arr)
        ? arr.filter((q) => Array.isArray(q.options) && q.options.length >= 2)
        : [];
    const cleanCards = (arr) => (Array.isArray(arr) ? arr : []);

    // Targeted regeneration returns only the requested slice.
    if (action === "quiz") {
      const quiz = cleanQuiz(data.quiz);
      bumpStats({ questions: quiz.length });
      return Response.json({ quiz });
    }
    if (action === "flashcards") {
      const flashcards = cleanCards(data.flashcards);
      bumpStats({ flashcards: flashcards.length });
      return Response.json({ flashcards });
    }

    // Full generation — normalise so the UI never crashes on missing fields.
    const flashcards = cleanCards(data.flashcards);
    const quiz = cleanQuiz(data.quiz);
    bumpStats({ summaries: 1, flashcards: flashcards.length, questions: quiz.length });
    return Response.json({
      title: data.title || "Your Notes",
      summary: data.summary || "",
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
      glossary: Array.isArray(data.glossary) ? data.glossary : [],
      flashcards,
      quiz,
      sourceText: notesForModel, // what the model actually saw; client reuses it to regenerate
      truncated: notes.length > notesForModel.length,
    });
  } catch (e) {
    const msg = e?.error?.message || e?.message || "Unknown error";
    const status = e?.status === 429 ? 429 : 500;
    const friendly =
      status === 429
        ? "Groq's free rate limit was hit. Wait a minute and try again."
        : `AI request failed: ${msg}`;
    return Response.json({ error: friendly }, { status });
  }
}
