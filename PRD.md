# PRD — "Lal Khata" (লাল খাতা)
### Voice-First Bookkeeper for Bangladesh's Mudi Dokans
**Competition:** Build With Gemma @Bangladesh — Native Audio & Voice Track (Online, $1,000 prize pool)
**Localized theme targeted:** Voice-First "Mudi Dokan" Bookkeeper
**Deadline:** Writeup due July 28, 2026, 3:30 PM GMT+6

---

## 1. Product Vision

Every mudi dokan (neighborhood grocery shop) in Bangladesh keeps its accounts in a red cloth-bound paper ledger — the **lal khata**. Shopkeepers track cash sales and *baki* (customer credit) by hand, often in a mix of Bangla and Banglish shorthand. Mistakes lose money; lost khatas lose everything; and many shopkeepers or their helpers are not comfortable with typing-based apps.

**Lal Khata** is a mobile-first web app that lets a shopkeeper simply *speak* a transaction the way they'd naturally say it —

> "রহিম ভাইকে ৫০ টাকার ডাল বাকি দিলাম"
> ("Gave Rahim bhai 50 taka of lentils on credit")

— and Gemma 3n's native audio understanding converts it directly into a structured digital ledger entry: customer, item, amount, cash-or-baki. No typing. No forms. No literacy barrier. The khata they already know, made digital by voice.

**Why this wins:** It targets the exact localized theme named on the competition page, it is structurally not a chatbot (audio → strict JSON → ledger UI, avoiding the wrapper disqualification), and it addresses a real economic barrier (financial record-keeping for low-digital-literacy micro-merchants) as the brief requires.

---

## 2. Target Users

| User | Context | Needs |
|---|---|---|
| **Primary: Mudi dokan owner** (30–60, semi-urban/rural) | Owns a low-end/mid Android phone; comfortable speaking, less comfortable typing; currently uses paper lal khata | Log sales & baki instantly while serving customers; see who owes what; daily totals |
| **Secondary: Shop helper / family member** | Helps run the shop, may manage the khata | Same as above; simple enough to hand over |
| **Tertiary: Small vendors beyond groceries** (tea stalls, tailors, van drivers) | Same credit-ledger culture | Same core loop generalizes |

**Device reality (drives all design decisions):** Android phones dominate; screens 360–412 px wide; often patchy 4G; users hold the phone one-handed while serving customers. The app is designed **mobile-first**, with desktop as a responsive enhancement.

---

## 3. Core User Flow ("the 10-second transaction")

1. Shopkeeper taps the single large **mic button** (thumb-reach zone, bottom center).
2. Speaks the transaction naturally in Bangla / Banglish (≤ 30 s — Gemma's audio clip limit).
3. App sends the audio to **Gemma 3n (E4B)** via the Gemini API with a strict-JSON extraction prompt.
4. A **confirmation card** appears showing the parsed entry (name, item, amount, cash/baki) with big ✓ Confirm / ✎ Edit buttons. Low-confidence fields are visually flagged.
5. On confirm, the entry animates into today's ledger; totals and the customer's baki balance update.

Everything else (customer pages, daily summary, baki reminders) hangs off this loop. **The loop must feel faster than writing in the paper khata — that's the product's entire promise.**

---

## 4. Feature Requirements

### 4.1 MVP (must ship — judged demo)
- **F1. Voice capture:** Browser MediaRecorder; tap-to-record with live waveform; auto-stop at 28 s; re-record option. Mic permission flow with Bangla instructions.
- **F2. Gemma extraction:** Audio → Gemma 3n E2B/E4B via Gemini API (`generateContent`, inline base64 audio). Strict JSON schema output (see §7). Retry-with-repair on malformed JSON.
- **F3. Confirmation card:** Parsed fields displayed large; any field tappable to edit; ambiguity flags (e.g., unclear amount) highlighted in amber.
- **F4. Ledger view ("আজকের খাতা" / Today's Khata):** Chronological entries, running cash total, running baki total. Bangla numerals (৳ ৫০) as default with a toggle.
- **F5. Customer baki pages:** Auto-created per customer name; balance, history, and a "বাকি শোধ" (credit repaid) voice/tap action that decrements balance.
- **F6. Local persistence:** All data in IndexedDB (via `idb` or Dexie) — works across sessions offline; only the Gemma call needs network. Export ledger as CSV.
- **F7. Bilingual UI:** Bangla-first labels with English secondary; all copy reviewed for natural shopkeeper vocabulary (khata, baki, joma, hishab — not "transactions dashboard").
- **F8. PWA basics:** Installable (manifest + service worker), app icon, works as home-screen app. Ledger *viewing* fully offline; recording queues if offline and syncs when back online.

### 4.2 Stretch (only if MVP is polished; each is writeup material)
- **S1. Multi-transaction chunking:** Long recordings split into ≤ 30 s chunks, each parsed, results merged.
- **S2. Daily summary spoken aloud** (browser SpeechSynthesis reading the day's totals in Bangla).
- **S3. Weekly insight card:** One Gemma text call summarizing the week ("চাল বিক্রি বেড়েছে; মোট বাকি ৳১,২৪০").
- **S4. Baki reminder message generator:** Draft a polite Bangla SMS the shopkeeper can copy-send to a customer.

### 4.3 Explicit non-goals
- No accounts/login (localStorage identity only) — keeps us clear of auth complexity and privacy risk.
- No payments integration (bKash etc.) — mention as future work in writeup.
- No open-ended chat interface anywhere — protects against the "chatbot wrapper" disqualification.

---

## 5. Design System — "Digital Lal Khata"

**Design thesis:** The app should feel like the shopkeeper's own red ledger came alive — warm, familiar, tactile — not like a fintech dashboard parachuted into a village. Every visual choice derives from the physical lal khata and the mudi dokan environment.

### 5.1 Color tokens
| Token | Hex | Source in the real world |
|---|---|---|
| `--khata-red` | `#B3261E` | The red cloth cover of the lal khata (primary brand, headers, mic button) |
| `--khata-red-deep` | `#7A1512` | Shadowed fold of the cloth binding (pressed states, gradients on red) |
| `--page-cream` | `#FAF3E3` | Aged ledger paper (app background) |
| `--rule-blue` | `#3D5A80` | The blue ruled lines in ledger paper (secondary actions, links, table rules) |
| `--ink` | `#26201A` | Fountain-pen ink (primary text) |
| `--baki-amber` | `#C97B1E` | Turmeric / warning (baki balances, ambiguity flags) |
| `--joma-green` | `#2E7D4F` | Fresh betel leaf (cash-in, confirmations, "paid" states) |

Contrast: all text pairs meet WCAG AA on their backgrounds (verify `--baki-amber` on cream at final sizes; darken if needed).

### 5.2 Typography
- **Bangla + display:** *Hind Siliguri* (Google Fonts) — excellent Bangla legibility at small sizes, warm humanist forms. Bold weight for amounts and headers.
- **Latin body / numerals fallback:** *Inter* or system stack.
- **Amounts are the hero type:** ledger amounts set 1.5–2× body size, bold, tabular alignment — in a bookkeeping app, numbers ARE the content.
- Minimum body size 16 px; touch targets ≥ 48 px (mic button 72 px+).

### 5.3 Layout & texture
- **Mobile-first single column;** bottom nav with 3 items max (Khata / Customers / Summary); mic button as a raised center FAB.
- **Ledger entries rendered as ruled rows** — a subtle repeating horizontal line background on the ledger card, echoing ruled khata paper (CSS gradient, not an image; keep it faint).
- **The signature element:** the app "cover." On first load, the screen shows the closed red khata cover (SVG: cloth texture hint, embossed title লাল খাতা) which *opens* like a book into the ledger — one orchestrated anime.js timeline. Bold once, quiet everywhere else.
- Desktop (≥ 768 px): the khata becomes a centered two-page spread — entries on the left "page," daily totals and top baki customers on the right. Same components, wider stage.

### 5.4 Motion (anime.js v4)
Use anime.js v4 (`npm i animejs`, ES module imports: `import { animate, stagger, createTimeline } from 'animejs'`). Motion is meaningful, brief, and respects `prefers-reduced-motion` (guard all animations; fall back to instant states).

| Moment | Animation | anime.js feature |
|---|---|---|
| App open (first load only) | Khata cover opens; title settles; today's rows stagger in | `createTimeline` + `stagger` |
| Recording | Mic button breathing pulse; live waveform bars | looped `animate` with `alternate: true` |
| Parsing (waiting on Gemma) | SVG pen "writing" a line across the card | SVG `createDrawable` line-draw |
| Entry confirmed | Card slides + settles into the ledger row; totals count up | `animate` with spring ease (`createSpring`) + number counting via JS object animation |
| Baki repaid | Amber balance chip crossfades to green with a small ✓ draw | SVG line-draw + color tween |
| Errors/empty states | Gentle single shake / fade-in, nothing looping | short `animate` |

Rules: no scroll-jacking; nothing loops except the record pulse; total added JS for animation kept small (tree-shake imports); test at 60 fps on a mid-range Android profile in Chrome DevTools throttling.

### 5.5 Copy & accessibility
- Bangla-first sentence-case labels; verbs say what happens ("খাতায় লিখুন" = Write to khata, not "Submit").
- Errors explain and direct: "কথা বোঝা যায়নি — আবার বলুন" (Couldn't understand — say it again) with a one-tap retry.
- Empty ledger = invitation: big arrow to the mic, "প্রথম হিসাব বলুন" (Speak your first entry).
- Visible keyboard focus, semantic HTML, `aria-live` region announcing parsed entries, alt text on all graphics.

---

## 6. Technical Architecture

```
┌─────────────────────────── Browser (PWA) ───────────────────────────┐
│  React + Vite + Tailwind          anime.js v4 (motion)              │
│                                                                     │
│  MicRecorder ──► AudioChunker(≤28s) ──► GemmaClient ──► JSONRepair  │
│       │                                     │                        │
│       ▼                                     ▼                        │
│  Waveform UI                        ConfirmationCard                 │
│                                             │ confirm                │
│                                             ▼                        │
│                    LedgerStore (IndexedDB via Dexie)                 │
│                     ├── entries  ├── customers  ├── settings         │
│                             ▼                                        │
│              Ledger UI / Customer pages / Summary / CSV export       │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS
                               ▼
              Serverless proxy (Vercel Edge Function)
              — holds GEMINI_API_KEY, forwards audio —
                               ▼
        Gemini API → gemma-3n-e4b-it  (native audio input)
```

**Stack decisions & justifications (these go in the writeup too):**
- **React + Vite + Tailwind:** fastest path to a polished responsive PWA; huge vibe-coding compatibility.
- **Gemma 3n E4B via Gemini API (AI Studio key):** the only hosted Gemma variants with **audio input** are 3n E2B/E4B — larger Gemma models reject audio. E4B chosen over E2B for better Bangla comprehension; fall back to E2B if latency matters. Audio ≤ 30 s/clip, mono — recorder enforces 28 s cap.
- **Serverless proxy, not client-side key:** the competition requires a *public* project link; shipping the API key in client JS would get it scraped in hours. A 20-line Vercel edge function keeps the key server-side. (Document this as a security decision — judges reward it.)
- **IndexedDB local-first:** shop data stays on the shopkeeper's phone (privacy + offline). No backend database needed for the demo.
- **Fine-tuning: not used, and say why** — prompt-engineered extraction with few-shot Bangla examples hit the accuracy bar within hackathon time; fine-tuning on collected shop audio is named future work.

**Repo layout:** `/src` (app), `/api/gemma.ts` (proxy), `/docs` (writeup assets, diagrams), README with 5-minute local-run instructions + deploy guide.

### 6.1 Development Workflow (building with Claude + API key handling)

The app is vibe-coded with Claude generating the full project as real files (React + Vite), then run and deployed by the team. The Gemini/Gemma API key is never hardcoded and never committed; only its *location* changes between environments:

| Stage | Where the app runs | Where the key lives | How Gemma is called |
|---|---|---|---|
| 1. Generate | Claude produces the complete codebase (components, proxy, prompt, configs) | — | — |
| 2. Local dev | `npm run dev` on your machine (`vercel dev` for the proxy) | `.env` file: `GEMINI_API_KEY=...` (`.env` is in `.gitignore`) | Browser → local `/api/gemma` proxy → Google |
| 3. Production | Vercel deployment (the required public link) | Vercel project → Settings → Environment Variables | Browser → `/api/gemma` edge function → Google |

Rules:
- The browser **never** talks to `generativelanguage.googleapis.com` directly in any committed code — always through `/api/gemma`. This keeps the key server-side and makes dev and prod behave identically.
- Manual steps are limited to two: (1) create the key once at AI Studio, (2) paste it into `.env` locally and into Vercel's env settings. Everything else — model choice, endpoint, prompt, payload — is code.
- A Claude in-chat artifact cannot hold the Gemini key safely (artifacts are client-side), so interactive prototyping in the artifact panel uses mocked Gemma responses; the real integration is exercised locally and in deployment.

---

## 7. Gemma Integration Spec

**Model:** `gemma-3n-e4b-it` (fallback `gemma-3n-e2b-it`)
**Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent` (via proxy)
**Payload:** `contents.parts = [ {text: EXTRACTION_PROMPT}, {inline_data: {mime_type: "audio/webm", data: <base64>}} ]`

**Model selection is code-defined, not configured manually.** The AI Studio API key is model-agnostic; the model is chosen by the model name in the request URL. It lives in exactly one place in the codebase so switching variants is a one-line change:

```javascript
// src/config.ts — single source of truth
export const GEMMA_MODEL = "gemma-3n-e4b-it";   // audio-capable; fallback: "gemma-3n-e2b-it"

// api/gemma.ts (proxy) builds the URL from it:
// https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent
// with header  x-goog-api-key: process.env.GEMINI_API_KEY
```

Guardrail: on startup (dev mode only), log the configured model and fail loudly if it isn't a `gemma-3n-*` audio-capable variant — prevents accidentally pointing at a larger Gemma model that rejects audio input.

**Extraction prompt (v1 — iterate against test set):**
```
You convert a Bangladeshi shopkeeper's spoken words into ledger JSON.
The audio is in Bangla, Banglish, or mixed. Common patterns:
- "X ke Y takar Z baki dilam"  → credit sale to customer X
- "X Y taka joma dilo / shodh korlo" → customer X repaid Y taka
- "Y takar Z bikri" (no name) → cash sale
Numbers may be spoken in Bangla words (পঞ্চাশ = 50).

Return ONLY valid JSON, no markdown, no explanation:
{
 "type": "credit_sale" | "cash_sale" | "repayment" | "unclear",
 "customer": string | null,
 "item": string | null,
 "amount_taka": number | null,
 "confidence": { "customer": 0-1, "item": 0-1, "amount": 0-1 },
 "transcript": string   // your best transcript of what was said
}
If any field is not stated, use null. Never invent an amount.
```

**Client handling:**
- Strip ```json fences → `JSON.parse` → on failure, one retry appending "Your last output was invalid JSON. Return only the JSON object."
- `confidence < 0.7` on any field → amber flag on the confirmation card.
- `type: "unclear"` → friendly re-record prompt, never a silent failure.
- Log (locally) every audio→JSON pair during testing — this becomes the **accuracy table** for the writeup (target: report something like "correctly parsed 45/50 test utterances across 5 speakers").

**Rate/latency budget:** free-tier AI Studio limits are fine for demo scale; show a max ~3–5 s "pen writing" wait state; timeout at 15 s with retry.

---

## 8. Submission Package (mapped to the official rubric — 100 pts app + 40 pts video)

The writeup is worth as much as the app. Budget **40% of total time** here.

### 8.1 Kaggle Writeup (≤ 2,000 words, ≥ 10 graphics) — checklist per rubric
| Rubric criterion (pts) | What we submit |
|---|---|
| Usefulness (15) | Problem framing with real context: paper khata pain (loss, disputes, illegibility), micro-merchant economy stats; 2–3 quotes from actual shopkeeper conversations if obtainable |
| Informativeness (15) | Full solution walkthrough; **why Gemma 3n E4B** (audio-native, 140+ languages incl. Bangla, on-device-class efficiency); prompting-vs-fine-tuning decision; 30 s clip constraint and chunking design |
| Documentation (15) | Architecture diagram (§6), data-flow diagram, prompt spec, README-quality run instructions linked |
| Engagement (10) | Lal Khata design story (cultural grounding sells), before/after: paper khata photo vs. app screenshot |
| Novelty (5) | Voice-first + zero-typing + local-first privacy + strict non-chatbot structure |
| Required (10 graphics, <2000 words) | Graphics plan: (1) hero mock, (2) paper khata photo, (3) user flow, (4) architecture, (5) data flow, (6) prompt/JSON figure, (7) confirmation-card screenshot, (8) ledger screenshot, (9) accuracy table, (10) roadmap. |
| Impact & validation | Mini user test: ≥ 5 testers × 10 utterances → accuracy table + 3 quotes; limitations stated honestly (dialect variance, noisy-shop audio) |
| Limitations & future work | Fine-tuning on regional dialects, bKash integration, SMS baki reminders, fully on-device Gemma via MediaPipe |

### 8.2 Media gallery
Screenshots (all states incl. empty/error), both diagrams, sample input audio → JSON → ledger row figure, 3–4 s GIF of the khata-opening animation.

### 8.3 Public notebook
Kaggle notebook demonstrating the Gemma call reproducibly: load a sample Bangla audio clip → call gemma-3n → show JSON output; documented cells; licensed sample audio recorded by us.

### 8.4 Video (< 5 min, YouTube) — 40 pts
Script beats: (0:00) real mudi dokan / paper khata shot → problem in one line; (0:40) live demo: speak → parse → confirm → ledger updates (the money shot — record clean screen capture + phone-in-hand shot); (2:00) baki tracking + repayment demo; (2:45) 45-second architecture + why Gemma 3n; (3:30) accuracy results + honest limitations; (4:15) roadmap + closing. Production: Bangla demo speech with English subtitles; good mic; steady pacing.

### 8.5 Public project link
- Deployed on Vercel (free tier), custom-ish URL (e.g., `lal-khata.vercel.app`).
- Public GitHub repo: MIT license, README (screenshots, run + deploy instructions, prompt spec), clean commit history.
- Verify the link works logged-out, on mobile, on a throttled connection, **through the entire judging period**.

---

## 9. EMERGENCY Build Plan (4 hours to deadline)

**Golden rule: incomplete submissions are not judged. All 5 components submitted > any single component perfect.** Submit with 20 minutes to spare, not 2.

| Time | Task | Deliverable |
|---|---|---|
| 0:00–0:15 | Setup | AI Studio key created; Vite+React scaffold running locally with `vercel dev` (so the `/api/gemma` proxy works on localhost) |
| 0:15–1:30 | Build the full app locally | Record button → Gemma 3n call → JSON → confirmation card → ledger list with cash/baki totals. localStorage (not IndexedDB). Red/cream Lal Khata styling via Tailwind. ONE animation: mic pulse. Test end-to-end on localhost. |
| 1:30–1:50 | **Deploy to Vercel** (see §9.1) + quick validation | Live public URL working on your phone; test 10 spoken utterances on the LIVE site — note X/10 accuracy as your evidence table |
| 1:50–2:10 | Graphics blitz | 6–8 app screenshots (all states) + 1 architecture diagram + 1 user-flow diagram = 10 graphics minimum met |
| 2:10–2:50 | Video | ONE take, screen-record the live site on your phone: problem (30s) → live voice demo (90s) → how it works/why Gemma 3n (60s) → limits+roadmap (30s). Upload to YouTube (Public/Unlisted), copy link |
| 2:50–3:30 | Kaggle Writeup | Write directly in Kaggle's Writeup editor using the template in SUBMISSION.md. Insert all 10 graphics + video link + live URL + GitHub URL |
| 3:15–3:30 (parallel) | Notebook | Minimal public Kaggle notebook: one cell calling gemma-3n with sample audio → prints JSON (mock the key with kaggle secrets or show code with output saved) |
| 3:30–3:40 | **SUBMIT** | Attach everything, hit Submit, verify it shows as submitted |
| 3:40–4:00 | Buffer | Fix anything broken; do NOT add features |

### 9.1 Vercel Deployment (after the app is built — ~15 min)

Workflow: **build and test everything locally first, then deploy once.**

1. `git init` → commit → push to a new **public** GitHub repo. Confirm `.env` is in `.gitignore` and was never committed (`git log --all --full-history -- .env` should be empty).
2. vercel.com → **Add New Project** → Import the GitHub repo. Vercel auto-detects Vite; accept defaults. Files in `/api/` (the Gemma proxy) auto-deploy as serverless functions — no extra config.
3. Before/right after first deploy: **Settings → Environment Variables** → add `GEMINI_API_KEY` = your AI Studio key (all environments) → **Redeploy** so the function picks it up.
4. Smoke-test the live URL **on your phone in an incognito/logged-out browser**: mic permission prompt appears → record → entry parses → ledger updates. If the Gemma call fails live but worked locally, it's almost always the env variable (missing or deployed before it was set → redeploy).
5. Any later code fix = just `git push`; Vercel auto-redeploys in ~1 min. Keep pushing fixes right up to the video recording, then freeze.

This live URL is the "Public Project Link" required by the submission — it goes in the writeup, the README, and the video.

**Cut completely (do not touch):** PWA/offline, customer detail pages (show baki as a simple grouped list instead), CSV export, khata-opening animation, desktop two-page layout, audio chunking (enforce 28s cap and move on), serverless proxy *if* it costs >15 min — fallback: key in Vercel env with a minimal proxy is still only ~15 lines, keep it if possible; absolute worst case, restrict the key in Google Cloud console and note key rotation post-judging in the README.

**If the app breaks at hour 3:** ship whatever runs, describe honestly in writeup ("known issue: X"), and protect the writeup+video time. Judges score the writeup — they reward honesty about limitations explicitly.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gemma mis-parses noisy shop audio / dialects | Confirmation-card human-in-the-loop is the product answer; report honestly in writeup (judges reward honesty per rubric) |
| Larger Gemma models rejected audio → wrong model chosen late | Locked to gemma-3n E2B/E4B from day one; verified in Phase 0 |
| API key abuse on public link | Serverless proxy + basic rate limit per IP |
| Free hosting flakes during judging | Vercel (reliable free tier) + README local-run instructions as the mandated backup |
| JSON output drift | Strict prompt + repair-retry + schema validation (zod) |
| Scope creep kills writeup time | Phase gates above; writeup/video time is protected, not leftover |
| "Chatbot wrapper" disqualification perception | No chat UI exists anywhere; architecture diagram makes the structured pipeline obvious |

---

## 11. Success Criteria

1. A first-time user completes a spoken transaction to confirmed ledger entry in **≤ 10 seconds**, one-handed, on a 360 px phone.
2. ≥ 85% field-level extraction accuracy on the 50-utterance test set.
3. All five submission components complete and cross-linked, submitted ≥ 3 hours early.
4. Every rubric line in §8.1 has a corresponding, verifiable artifact.
5. Zero open-ended chat surface in the shipped product.
