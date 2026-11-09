# GodsGift — AI Interview Practice

> *Revolutionizing interviews, one question at a time.*

GodsGift is a web app that runs mock job interviews with an AI interviewer.
Pick a track, answer one question at a time, get feedback and a score on each
answer, and finish with a summary scorecard.

This is a portfolio / learning build, not a startup bet: a similar product has
since shipped. It is built well anyway.

## Tracks

- **Software Engineer** — debugging, design, teamwork, craft
- **Behavioral** — teamwork, conflict, failure, growth
- **System Design** — architecture, scaling, tradeoffs
- **Algorithms** — data structures, complexity, problem solving
- **Product Manager** — prioritization, metrics, stakeholders

## Demo mode vs live AI

- **Demo mode (no key):** questions come from a built-in bank (50 questions,
  each with a difficulty level and 2–3 rubric criteria) and feedback is scored
  deterministically against that question's criteria, so the same answer scores
  differently on different questions and an off-topic answer scores low.
  Nothing leaves the page. This is the default and works out of the box.
  Run `npm test` for the rubric test cases.
- **Live AI (Gemini key):** the interviewer is Google Gemini
  (`gemini-2.0-flash`). It asks questions, gives honest feedback with a score,
  asks follow-ups, and produces a final scorecard. Add a key in **Settings**
  (stored only in this browser's localStorage) or set `VITE_GEMINI_API_KEY`
  in a `.env` file. Get a key at
  <https://aistudio.google.com/app/apikey>.

A key in `.env` is baked into the client bundle at build time, so anyone who
loads the page can read it. Only use it for local / personal builds. For a
shared deployment, leave it empty and use Settings.

## Optional: resume tailoring and job description

Upload a PDF resume on the setup screen and the interviewer tailors questions
toward the skills it finds. The PDF is parsed entirely in your browser with
pdfjs-dist, so this works on GitHub Pages with no server. Paste a job
description in the setup screen and question selection is also weighted toward
the skills and responsibilities it mentions, and the live-mode prompt includes
it. (The old `server/` Express `/parse-pdf` endpoint is no longer used by the
client and remains only for local dev.)

## Run it

```bash
npm install
npm run dev        # app on http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

Run the rubric tests:

```bash
npm test
```

## How it is built

- **Client:** Vite + vanilla JS modules. `main.js` is the interview flow
  (setup, interview, scorecard), `questions.js` is the question bank used by
  demo mode and as seed questions in live mode, `rubric.js` is the
  deterministic per-question rubric engine, `style.css` is the UI.
- **Server:** `server/server.js` is a small Express service that used to parse
  uploaded PDF resumes. It is no longer used by the client (parsing is now
  client-side with pdfjs-dist) and remains only for local dev.
- **AI:** live mode calls Google Gemini directly from the browser with the
  user-supplied key. No key is hardcoded anywhere in this repo. A serverless
  proxy holding the key is the planned bigger rebuild; until then, live mode
  is client-side key by design.

## Security note

An earlier version of this repo had a Gemini API key hardcoded in `main.js`.
That key is removed in this branch. If it was ever a real key, revoke it in
Google Cloud Console / AI Studio and generate a new one; a key committed to
git history cannot be un-exposed by deleting it.
