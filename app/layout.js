import "./globals.css";
import { Instrument_Serif, Space_Mono, Readex_Pro, Inter } from "next/font/google";

// Inter is the default sans (--font-sans) for the light "Mainframe" look.
const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});
const readex = Readex_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-readex",
  display: "swap",
});

export const metadata = {
  title: "NotesGPT — Turn notes into knowledge",
  description:
    "Upload a lecture PDF or paste your notes and instantly get an AI summary, glossary, flashcards, and an endless practice quiz. Built for students.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} ${readex.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
