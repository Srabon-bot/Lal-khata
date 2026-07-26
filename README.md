# লাল খাতা — Lal Khata

**Voice-first bookkeeper for Bangladesh's mudi dokans, built with Gemma.**

A shopkeeper taps one mic button, says a transaction out loud in Bangla or
Banglish ("রহিম ভাইকে ৫০ টাকার ডাল বাকি দিলাম" — *gave Rahim bhai 50 taka of
lentils on credit*), and Gemma turns it into a structured ledger entry —
customer, item, amount, cash-or-credit — with no typing and no forms.

**Live app:** https://lal-khata.vercel.app
**Model:** `gemma-4-26b-a4b-it` (via the Gemini API)

## Why this exists

~4.5 million mudi dokans (neighborhood grocery shops) operate in Bangladesh;
94% of middle-class households still shop at them, and 73%+ of their sales
go on credit (*baki*), tracked by hand in a paper ledger. Records get lost,
disputes happen, and many shopkeepers or their helpers aren't comfortable
with typing-heavy apps. Lal Khata replaces the pen with a voice.

## Screenshots

| Welcome | Ledger | Confirmation card |
|---|---|---|
| _add screenshot_ | _add screenshot_ | _add screenshot_ |

## How it works

```
Browser (React + Vite + Tailwind, anime.js)
  Web Speech API → transcript → /api/gemma (Vercel Edge Function)
                                     → Gemini API (gemma-4-26b-a4b-it)
                                     → structured ledger JSON
  Confirmation card → IndexedDB (Dexie) → Ledger / Customers / Summary UI
```

- **Speech-to-text:** the browser's native `SpeechRecognition` API (Chrome/
  Android) transcribes Bangla speech client-side. Gemma's audio input isn't
  enabled on this project's API key — verified directly against the live
  Gemini API (`gemma-3n-e2b/e4b-it`, the audio-native models the project
  originally targeted, are no longer served at all on this key; the
  available `gemma-4-*-it` models return "Audio input modality is not
  enabled for this model" for any audio payload). Gemma still does the
  actual hard part: turning a messy transcript into typed ledger data with
  per-field confidence scores.
- **Extraction:** a single Gemma text call per utterance, strict JSON
  schema, retry-with-repair if the first output isn't valid JSON.
- **Weekly insight:** a second, independent Gemma call summarizes the
  week's already-computed totals into one short Bangla observation.
- **Storage:** IndexedDB only, on-device. No accounts, no backend
  database — the Sign up / Log in flow stores a display name locally and
  nothing else.
- **Key handling:** `GEMINI_API_KEY` is read only inside the serverless
  proxy (`api/gemma.ts`); the browser never talks to
  `generativelanguage.googleapis.com` directly.

## Known limitation

`gemma-4-26b-a4b-it` is a "thinking" model — it spends real time on internal
reasoning before the final answer, pushing measured latency to 15–26s.
Vercel's Edge Runtime enforces a non-configurable ~25s execution ceiling,
so the slowest requests occasionally time out and ask the user to retry.
This is a platform/model constraint, not a bug in the extraction logic —
retrying almost always succeeds.

## Run it locally

```bash
npm install
cp .env.example .env   # add your GEMINI_API_KEY (from AI Studio)
vercel dev              # runs the app + the /api/gemma proxy together
```

(Plain `npm run dev` also works for UI-only work, but `/api/*` routes
only run under `vercel dev`.)

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · anime.js v4 · Dexie
(IndexedDB) · react-router-dom · Vercel (hosting + serverless proxy) ·
Gemini API (`gemma-4-26b-a4b-it`)

## Team

Made by **Team Xenomorphic**.
