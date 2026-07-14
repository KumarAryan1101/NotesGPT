// -----------------------------------------------------------------------------
// Media config — single source of truth for hero / section backdrops.
//
// EASY CHANGE ACCESS: to use a video instead of the animated gradient, set
// `type: "video"` and drop your URL in `src`. Set back to "gradient" any time.
// Everything in the UI reads from here, so you never touch component code.
// -----------------------------------------------------------------------------

export const media = {
  hero: {
    type: "gradient", // "gradient" | "video"
    src: "", // e.g. "https://your-cdn.com/hero.mp4"
    // gradient stops used when type === "gradient"
    gradient: ["#1a0b3d", "#0a0a1f", "#000000"],
  },
  featured: {
    type: "gradient",
    src: "",
    gradient: ["#0b2b3d", "#0a0a1f", "#000000"],
  },
  philosophy: {
    type: "gradient",
    src: "",
    gradient: ["#2b0b2e", "#0a0a1f", "#000000"],
  },
  // Fullscreen loop shown on the "generating" overlay while the AI works.
  // EASY CHANGE ACCESS: swap `src` for your own mp4, or set type:"gradient"
  // to fall back to the animated gradient (no video) at any time.
  generating: {
    type: "video",
    src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4",
    gradient: ["#04121a", "#020814", "#000000"],
  },
  // Scrub-on-scroll background video for the light landing hero.
  // EASY CHANGE ACCESS: swap `src` for your own mp4 any time.
  landing: {
    type: "video",
    src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4",
  },
  // Spotlight-reveal hero (StudioHero). `variant` picks what the cursor lens
  // reveals:
  //   "portrait" — the ORIGINAL reference: a dim base photo, a bright photo
  //                revealed under the lens (the "boy" images you saw).
  //   "formula"  — the NotesGPT-branded version: faint formulas that light up.
  // Swap `variant` any time; images below are only used by the portrait one.
  studioHero: {
    variant: "portrait",
    baseImg:
      "https://soft-zoom-63098134.figma.site/_assets/v11/5c9f982199fde1d9b85a20e5396f0fa7bacaf9a3.png?w=2560",
    revealImg:
      "https://soft-zoom-63098134.figma.site/_assets/v11/6be2165e31648955b4e071f4cf2a50bc572b9bfd.png?w=1536",
  },
};

// Rotating "stage" words shown large + staggered on the generating overlay.
// Each stage = three lowercase words placed like the securify hero.
export const generatingStages = [
  { words: ["reading", "your", "notes"], blurb: "parsing every page, keeping the signal" },
  { words: ["mapping", "the", "ideas"], blurb: "finding structure inside the noise" },
  { words: ["writing", "the", "summary"], blurb: "teaching-grade, exam-ready prose" },
  { words: ["forging", "flash", "cards"], blurb: "elaborated Q&A you can actually drill" },
  { words: ["building", "the", "quiz"], blurb: "questions that test understanding" },
];
