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

- **Demo mode (no key):** questions come from a built-in bank and feedback is
  a heuristic scorecard (answer length, concrete numbers, examples, structure).
  Nothing leaves the page. This is the default and works out of the box.
- **Live AI (Gemini key):** the interviewer is Google Gemini
  (`gemini-2.0-flash`). It asks questions, gives honest feedback with a score,
  asks follow-ups, and produces a final scorecard. Add a key in **Settings**
  (stored only in this browser's localStorage) or set `VITE_GEMINI_API_KEY`
  in a `.env` file. Get a key at
  <https://aistudio.google.com/app/apikey>.

A key in `.env` is baked into the client bundle at build time, so anyone who
loads the page can read it. Only use it for local / personal builds. For a
shared deployment, leave it empty and use Settings.

## Optional: resume tailoring

Upload a PDF resume on the setup screen and the interviewer tailors questions
toward the skills it finds. This needs the small resume server (see below).
If the server is not running, the interview just continues without tailoring.

## Run it

```bash
npm install
npm run dev        # app on http://localhost:5173
```

In a second terminal (optional, only for resume parsing):

```bash
npm run server     # resume server on http://localhost:3000
```

Build for production:

```bash
npm run build
npm run preview
```

## How it is built

- **Client:** Vite + vanilla JS modules. `main.js` is the interview flow
  (setup, interview, scorecard), `questions.js` is the question bank used by
  demo mode and as seed questions in live mode, `style.css` is the UI.
- **Server:** `server/server.js` is a small Express service that parses an
  uploaded PDF resume with `pdf-parse`. It does not hold any API key.
- **AI:** live mode calls Google Gemini directly from the browser with the
  user-supplied key. No key is hardcoded anywhere in this repo.

## Security note

An earlier version of this repo had a Gemini API key hardcoded in `main.js`.
That key is removed in this branch. If it was ever a real key, revoke it in
Google Cloud Console / AI Studio and generate a new one; a key committed to
git history cannot be un-exposed by deleting it.
