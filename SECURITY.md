# Security Policy

## What happened here

A Google Gemini API key was hardcoded in `main.js` and committed to the
`main` branch, where it was publicly visible. The key has been removed from
the source.

The key now lives **server-side only**: the local Express server
(`server/server.js`) reads `GEMINI_API_KEY` from `server/.env` and makes all
Gemini calls there. The browser client never sees the key — earlier
revisions looked up `VITE_GEMINI_API_KEY` in the client, which Vite bundles
into the shipped JavaScript, exposing it to anyone who loads the page. This
app is still a local demo: the server binds localhost and is not hardened
for public deployment (no auth or rate limiting; browser origins limited to localhost/127.0.0.1 on ports 5173 and 4173). Do not
expose it to the internet. Loopback and origin checks reduce accidental exposure;
they do not make a key-holding demo a production service.

**Deleting the key from the code does NOT fix the leak.** The key is still
in the repository's git history and must be treated as compromised.

## Required action (owner only)

1. **Revoke the leaked Gemini API key** in Google Cloud Console or
   Google AI Studio (APIs & Services → Credentials), and generate a new one.
2. Put the new key in a local `server/.env` file (gitignored) — never in
   source. See `server/.env.example` for the variable name.
3. Do not reuse the old key anywhere.

## Rules for contributors

- **Never commit API keys, tokens, passwords, or any credential** — not in
  source, not in config files, not in docs, not in tests.
- Keep secrets in a local `.env` file. `.env` is gitignored in this repo;
  `.env.example` documents the variable names with placeholder values.
- If you find a secret in the repo, do not post it anywhere. Remove it,
  open a security fix, and tell the maintainer so the credential can be
  rotated. Assume any committed secret is already compromised.
- To report a vulnerability, open an issue or contact the maintainer
  directly. Do not include the secret itself in the report.
