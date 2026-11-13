# Test plan - GodsGift interview studio redesign

Ground-up frontend redesign ("AI interview studio": dark broadcast booth, amber on-air accent, viewfinder booth) plus a security rework: the Gemini key moved server-side.

![Desktop - questions ready](https://github.com/user-attachments/assets/9ee8e127-d7ef-4645-a8ee-e53b7f430dd8)
![Mobile - questions ready](https://github.com/user-attachments/assets/28936e5a-6f78-45bb-ade4-58b0c1067280)
![Camera live](https://github.com/user-attachments/assets/4207311c-bd0a-4d47-8599-62ac86199bcc)
![Camera denied](https://github.com/user-attachments/assets/dbc5900f-9cef-41b4-b6b7-a2b88d2a7331)

## Security model (changed)
- The Gemini key now lives ONLY in `server/.env` (`GEMINI_API_KEY`), read by the Express server. The old `VITE_GEMINI_API_KEY` was bundled into the shipped client JS - visible to anyone loading the page.
- Browser talks only to the local server (`/health`, `/parse-pdf`, `/generate-questions`). The client bundle contains no key handling at all.
- SECURITY.md updated: key rotation instructions preserved, plus an explicit note that this is a localhost demo, not hardened for public deployment (no auth or rate limiting; only documented local frontend origins allowed).
- Resumes are parsed in memory; nothing is written to disk. Only extracted skill keywords (from a fixed keyword list) are sent to Gemini.
- `MOCK_GEMINI=1` streams canned questions for UI testing without a key; the UI badges this as MOCK MODE so it can't pass for real output.

## Model and SDK (verified against current docs)
- SDK moved from `@google/generative-ai` 0.1.x to `@google/genai` ^3.3.0 (current official JS SDK).
- Model `gemini-3.5-flash-lite`, overridable via `GEMINI_MODEL`.
- Source evidence, retrieved 2026-11-13 from https://aistudio.google.com/docs/models (Google AI Studio, official model list):
  - "For any new projects, use our latest models: Gemini 4 Hydrogen or 3.5 Flash-Lite."
  - Model table: "Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite`" (stable string, per the page's naming-convention section: "`gemini-3.6-flash`" given as the example of a stable string).
  - "`gemini-2.5-flash` is deprecated ... Effective December 1, 2026, all API requests to `gemini-2.5-flash` will automatically route to `gemini-3.5-flash-lite`. Update your model string to `gemini-3.5-flash-lite`."
  - `gemini-1.5-flash` and the original demo's `gemini-pro-vision` appear nowhere on the current model list.
- SDK call shape verified 2026-11-13 against the official js-genai reference
  (https://googleapis.github.io/js-genai/release_docs/classes/models.Models.html):
  "`generateContentStream({ model: 'gemini-3.8-flash', contents: 'why is the sky blue?', config: { ... } })` -> `Promise<AsyncGenerator<GenerateContentResponse>>`", iterated with "`for await (const chunk of response)`". server.js uses exactly this shape.

## Passed (all on the final revision, headless Chrome driven over CDP)
- `vite build` passes.
- `GET /health` reports key/mock/model state; UI reflects all three (configured, missing key, server offline) - screenshots in this folder.
- `POST /parse-pdf` returns extracted text for ReportLab, PyMuPDF, Chrome-generated and fixture PDFs; empty upload 400s; non-PDF and invalid PDF rejected.
- `node --test` in server/ passes (extractor happy path on committed fixture + invalid input).
- `POST /generate-questions` streams mocked questions chunk-by-chunk; bad body 400s.
- Full UI flow: upload PDF -> parse -> streamed questions render as markdown -> Start camera button appears ONLY then (camera never auto-starts).
- Camera click with a granted (fake) device: viewfinder goes live, badge flips STANDBY -> LIVE, amber PREVIEW indicator shows (nothing is recorded - no REC claim). Stop camera appears and stops all tracks, returning the booth to STANDBY with Start camera re-armed.
- Camera requests video only - the demo never records or transmits, so it never asks for the microphone.
- Camera denied: honest error state, questions remain usable, button re-enabled.
- Desktop (1440px) and mobile (430px) layouts screenshot-verified, no overflow.
- No secrets anywhere in the diff.

## Parser follow-up
- Replaced old pdf-parse after valid generated PDFs failed extraction checks. pdfjs-dist legacy extractor passes independent ReportLab/PyMuPDF fixtures and the committed synthetic fixture.
- Requires Node >=22.13.0; publisher checks ran on Node 22.23.4.
- `npm --prefix server test`: 2 tests pass (synthetic PDF text + invalid PDF rejection).

## Fixed while redesigning (original crashed at runtime)
- `readFile()` called but never defined; malformed Gemini `contents` shape; null crash when no skills matched; REC badge visible with camera off.
- Server wrote uploads to a literal `/somewhere/on/your/server` placeholder (always 500s); now in-memory parse with a 10 MB limit and PDF check.
- PDF parser replaced: pdf-parse bundles pdf.js 1.x, which failed 'bad XRef entry' on valid PDFs from ReportLab and PyMuPDF (caught in publication review). Now uses pdfjs-dist 6.5 legacy build via server/pdf-text.mjs; verified against ReportLab, PyMuPDF, Chrome print-to-PDF and the committed fixture (server/test/fixtures/synthetic-resume.pdf). Invalid input returns 422.

## Not tested (explicit)
- Live Gemini streaming with a real key: no key in scope, and there shouldn't be - test with your own `server/.env`.
- Real camera hardware: verified with Chrome's fake device and with permission denied, not a physical webcam.
- Non-Chrome browsers and any non-localhost deployment.

## Publisher checks
- Explicit 127.0.0.1 listener verified from the listening socket.
- Unexpected Origin and Origin: null rejected with 403 before uploads/API execution; localhost/127.0.0.1 on Vite ports 5173/4173 permitted.
- Empty multipart, missing resume field, repeated resume fields and invalid generation JSON return 400 without crashing.
- Dependency audits still report root: 8 findings (1 moderate, 7 high), server: 8 findings (3 low, 1 moderate, 3 high, 1 critical). See PR notes for affected packages. Not production-ready.

## How to run
Requires Node >=22.13.0.

1. `cd server && npm install && cp .env.example .env` - add your key (or `MOCK_GEMINI=1` to try the UI without one) - `npm start`.
2. `npm ci && npm run dev -- --port 5173 --strictPort` in the repo root.
