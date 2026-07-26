# SUBMISSION GUIDE — Build With Gemma @Bangladesh (Online Track)
### Step-by-step, in order. Deadline: July 28, 2026, 3:30 PM (GMT+6). Submit 20+ min early.

---

## ✅ The 5 things you MUST submit (missing any = not judged)

1. **Kaggle Writeup** (≤ 2,000 words, ≥ 10 graphics) — the main submission
2. **Media gallery** (screenshots/diagrams — these live inside the writeup)
3. **Public Kaggle Notebook** (or linked public GitHub/Colab notebook)
4. **Demo video** (≤ 5 min, on YouTube, linked in writeup)
5. **Public project link** (live app URL + public GitHub repo)

Everything attaches to / links from the Writeup. The Writeup IS the submission.

---

## STEP 1 — Deploy the app publicly (do this FIRST, everything links to it)

1. Push code to a **public** GitHub repo (check: repo visibility = Public).
2. Go to vercel.com → Add New Project → Import your GitHub repo → Deploy.
3. In Vercel: Settings → Environment Variables → add `GEMINI_API_KEY` = your AI Studio key → Redeploy.
4. Open the live URL **on your phone, logged out of everything** — record a voice entry end-to-end. If it works, copy the URL.
5. In the GitHub repo, make sure README has: 1-line description, live URL, 3 screenshots, run instructions (`npm install`, add `.env` with `GEMINI_API_KEY`, `npm run dev`), and the model used (`gemma-3n-e4b-it`).

**Checkpoint:** You now have 2 links: `https://your-app.vercel.app` and `https://github.com/you/repo`.

---

## STEP 2 — Record & upload the video (≤ 5 minutes)

1. One take is fine. Screen-record your phone using the LIVE deployed site (not localhost).
2. Follow this script (time-boxed):
   - **0:00–0:30** — Show a paper lal khata (or photo). Say the problem: shopkeepers track baki by hand, records get lost, typing apps don't fit.
   - **0:30–2:00** — THE DEMO: tap mic, speak "রহিম ভাইকে ৫০ টাকার ডাল বাকি দিলাম", show the parsed card, confirm, show it in the ledger with totals. Do a cash sale + a repayment too.
   - **2:00–3:00** — How it works: show your architecture diagram, say "audio goes to Gemma 3n E4B via the Gemini API, returns strict JSON, no chatbot anywhere." Say WHY Gemma 3n: only Gemma with native audio input, trained on 140+ languages including Bangla, small enough for on-device future.
   - **3:00–3:45** — Honest results: "In our quick test, X of 10 spoken entries parsed correctly." Limitations (noise, dialects). Roadmap (fine-tuning, bKash, offline on-device).
   - **3:45–4:15** — Close: who it helps, one sentence.
3. Speak in Bangla or English — if Bangla, add English captions (YouTube auto-captions + quick fix is enough).
4. Upload to YouTube → Visibility: **Public** (or Unlisted at minimum — public is safer) → copy the link.
5. Watch it once on the YouTube link to confirm it plays and is under 5:00.

---

## STEP 3 — Make the public Kaggle Notebook (15 min max)

1. On Kaggle: Create → New Notebook.
2. Cells to include:
   - Markdown cell: title + 2 lines describing what it demonstrates.
   - Code cell: the exact `fetch`/`requests` call to `models/gemma-3n-e4b-it:generateContent` with the extraction prompt and a sample base64 audio clip (record a 5-sec sample yourself, upload it as a notebook dataset/file).
   - For the API key: Add-ons → Secrets → add `GEMINI_API_KEY`, read it with `UserSecretsClient`. (Never paste the key in a cell.)
   - Run it so the JSON output is saved in the notebook.
3. Click **Save Version** → "Save & Run All" → after it finishes, Share → set to **Public**.
4. Copy the notebook URL.

(If Kaggle secrets give you trouble with time running out: run the call locally, paste the code + real output into the notebook as code cells with printed output shown in markdown, make it public, and note "run locally due to key security." Reproducible code is what matters.)

---

## STEP 4 — Write the Writeup on Kaggle (the main event)

1. Go to the competition page → **Writeups tab** → click **"New Writeup"** button.
2. Title: **"Lal Khata — Voice-First Bookkeeper for Bangladesh's Mudi Dokans (Gemma 3n)"**
3. Paste this structure and fill it (keep total under 2,000 words — Kaggle counts; aim ~1,500):

```
## Problem Statement
[3–4 sentences: paper khata pain, baki disputes, low typing literacy,
why voice + Bangla matters in the Bangladesh context. 1 photo of a real khata.]

## Solution Overview
[What the app does in 4 sentences + the 10-second flow.
2 screenshots: mic screen, ledger screen.]

## How Gemma Is Used (and why)
[Model: gemma-3n-e4b-it via Gemini API. Why: the only Gemma line with
NATIVE AUDIO input; 140+ languages incl. Bangla; on-device-class size = 
future offline path. Approach: prompt-engineered strict-JSON extraction,
no fine-tuning (state why: time + accuracy already sufficient).
1 figure: audio → prompt → JSON example.]

## Technical Architecture
[1 diagram (browser → /api/gemma proxy → Gemma 3n → JSON → localStorage → UI).
Stack: React+Vite+Tailwind, anime.js, Vercel. Key kept server-side. 
Note the 30s audio limit and how you handle it. 3–5 sentences per element.]

## Impact & Validation
[Your quick test: "X/10 spoken entries parsed fully correctly across N speakers."
Small table. 1–2 honest quotes if you tested with anyone.
1 screenshot of a parsed confirmation card.]

## Limitations & Future Work
[Dialect variance, noisy shops, 30s clip cap. Roadmap: regional fine-tuning,
bKash, fully on-device via MediaPipe, SMS baki reminders.]

## Links
- 🔴 Live app: [URL]
- 📦 GitHub: [URL]  
- 📓 Notebook: [URL]
- 🎬 Video: [YouTube URL]
```

4. **Insert the 10 graphics** as you go (Kaggle editor: drag-and-drop images). Count them: khata photo, hero/mic screenshot, ledger screenshot, confirmation card screenshot, baki list screenshot, error/empty state screenshot, architecture diagram, user flow diagram, JSON example figure, results table image. That's 10. ✔
5. Embed the YouTube video link near the top AND in Links.
6. **Save** the writeup.

---

## STEP 5 — SUBMIT (don't skip the second click!)

1. On your saved Writeup, find the **"Submit"** button in the **top right corner** of the writeup page (the competition page says: after saving, "Submit" appears top-right).
2. Click it and confirm.
3. **Verify:** go back to the competition page — the yellow "You haven't created a writeup yet" banner should be GONE, and your submission should appear under your profile / the Writeups tab as submitted.
4. Screenshot the confirmation for your own records.

⚠️ A saved **draft** is NOT a submission. Drafts and un-submitted writeups are explicitly not considered by judges. The Submit click is the whole game.

---

## FINAL 10-MINUTE CHECKLIST (run through literally)

- [ ] Live app URL opens in an incognito/logged-out browser, on mobile, and a voice entry works
- [ ] GitHub repo is Public; README present; no API key anywhere in the code or commit history (`git log -p | grep -i key` if unsure)
- [ ] YouTube video is Public/Unlisted, plays, ≤ 5:00
- [ ] Notebook is Public and shows the Gemma call + output
- [ ] Writeup: word count < 2,000, graphics ≥ 10 (count them), all 4 links present and clickable
- [ ] Writeup mentions the exact model name `gemma-3n-e4b-it` (proves Gemma is core, not incidental)
- [ ] No chat interface visible anywhere in screenshots/video (disqualification trigger)
- [ ] **SUBMIT button clicked and confirmed** — not just saved
- [ ] Done ≥ 20 minutes before 3:30 PM GMT+6

---

## If something is broken at T-minus 45 min

- App bug you can't fix → deploy the last working version; describe the known issue honestly in Limitations.
- Video too long → trim the middle demo, never the problem/close.
- Only 8 graphics → screenshot 2 more app states (empty state, error state) — 2 minutes.
- Notebook won't run on Kaggle → code cells + pasted real output + "reproducible locally per README," set Public, move on.
- Vercel down → link GitHub Pages/Netlify mirror, or as last resort a Loom of localhost + GitHub link, and say so transparently.

**Submit something complete. Judges read writeups, not intentions.**
