<div align="center">

# 📚 NotesGPT

**Transform your lecture notes into a complete study toolkit — instantly.**

Upload a PDF or paste text and get an AI-generated summary, glossary, flashcards, and an adaptive practice quiz in seconds.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-orange)](https://groq.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload** | Drag-and-drop or select any text-based lecture PDF (up to 10 MB) |
| 📋 **Paste Notes** | Directly paste raw text — no file required |
| 🧠 **AI Summary** | 8–12 sentence structured summary that actually teaches the topic |
| 🔑 **Key Points** | 6–8 bullet-point highlights extracted from your notes |
| 📖 **Glossary** | 5–8 term definitions in plain English |
| 🃏 **Flashcards** | 8–12 flip cards with answers + elaborated context |
| ❓ **Practice Quiz** | 6 MCQs with difficulty tags, distractors, and explanations |
| 🔁 **Regenerate** | Get fresh flashcards & quiz sets with one click — never see repeats |
| 📊 **Live Analytics** | Real-time usage stats dashboard (summaries, flashcards, questions generated) |
| ⚡ **Blazing Fast** | Powered by Groq's LPU inference — responses in under 3 seconds |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | Full-stack React framework |
| **AI / LLM** | [Groq API](https://groq.com/) — LLaMA 3.3 70B | Ultra-fast LLM inference |
| **PDF Parsing** | [unpdf](https://github.com/unjs/unpdf) | Server-side PDF text extraction |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Page & component transitions |
| **3D / Visual** | [Spline](https://spline.design/) | Interactive 3D hero elements |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icon set |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| **Fonts** | Google Fonts (Inter, Instrument Serif, Space Mono) | Premium typography |
| **Deployment** | [Vercel](https://vercel.com/) | Edge-optimized hosting |
| **Rate Limiting** | In-memory sliding window (per IP) | Protects Groq quota |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  PDF Upload  │  │ Paste Text │  │  Analytics  │  │
│  │  Drag & Drop │  │  Textarea  │  │  Dashboard  │  │
│  └──────┬───────┘  └─────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼────────────────┼──────────┘
          │  POST /api/generate            │ GET /api/stats
          ▼                               ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes (Server)              │
│  ┌──────────────────────────────────────────────┐    │
│  │  /api/generate                               │    │
│  │  ├─ Rate limit (8 req/min/IP)                │    │
│  │  ├─ Input validation & size cap (10 MB)      │    │
│  │  ├─ PDF → text  (unpdf)                      │    │
│  │  └─ Build prompt → Groq API → JSON response  │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────┐   ┌──────────────────────────┐     │
│  │ /api/health  │   │ /api/stats               │     │
│  └──────────────┘   └──────────────────────────┘     │
└────────────────────────────┬────────────────────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │      Groq Cloud       │
                 │   LLaMA 3.3 70B       │
                 │  JSON-mode response   │
                 └───────────────────────┘
```

---

## 🎯 Use Cases

- 🎓 **Students** preparing for exams — convert lecture slides into flashcards & quizzes in seconds
- 📝 **Self-learners** digesting textbook chapters or research papers
- 👨‍🏫 **Educators** generating quick comprehension quizzes from their own material
- 🏢 **Professionals** summarizing technical documentation or meeting notes
- 🌐 **Open-source contributors** looking for a production-ready Next.js + Groq starter

---

## 📊 Analytics Dashboard

NotesGPT ships with a live usage statistics panel that tracks:

- **Total summaries** generated
- **Total flashcards** created
- **Total quiz questions** answered

Stats are updated after each generation via the `/api/stats` endpoint and surfaced in the UI. On a single-server deployment (or Vercel), counters persist via an in-memory + filesystem cache. For cross-instance production use, swap `lib/stats.js` for [Upstash Redis](https://upstash.com/) (free tier) — function signatures stay identical.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com/keys) (no credit card required)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/KumarAryan1101/notesgpt.git
cd notesgpt

# 2. Install dependencies
npm install

# 3. Configure your API key
cp .env.local.example .env.local
# Open .env.local and paste your Groq API key

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000** — upload a PDF or paste notes and hit **Generate**.

> **Health check:** `http://localhost:3000/api/health` should return `"hasKey": true`

---

## ☁️ Deploy to Vercel

1. Fork / push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Under **Settings → Environment Variables**, add:
   - `GROQ_API_KEY` → your Groq key
4. Click **Deploy** — you'll get a live URL in ~60 seconds 🎉

> Changing env vars on Vercel requires a redeploy to take effect.

---

## ⚙️ Configuration

| Environment Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Your Groq API key from console.groq.com |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Override the LLM model |

---

## ⚠️ Limitations

- **Text-based PDFs only** — scanned images require OCR (planned for a future release)
- **~16,000 character limit** — longer notes are trimmed to stay within Groq's free-tier token limits
- **In-memory rate limiter** — resets on serverless cold starts; use Upstash Redis for production-grade limiting
- **Groq free tier** — if you hit the rate limit, wait ~60 seconds and retry

---

## 🗺️ Roadmap

- [ ] OCR support for scanned PDFs (via Tesseract or Google Vision)
- [ ] Telegram bot integration for quiz delivery in chat
- [ ] User accounts & saved study sets
- [ ] Export flashcards to Anki format
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ by [KumarAryan1101](https://github.com/KumarAryan1101)

*Star ⭐ the repo if you find it useful!*

</div>
