# Security Policy

## What happened here

A Google Gemini API key was hardcoded in `main.js` and committed to the
`main` branch, where it was publicly visible. The key has been removed from
the source on this branch and replaced with an environment-variable lookup
(`VITE_GEMINI_API_KEY`).

**Deleting the key from the code does NOT fix the leak.** The key is still
in the repository's git history and must be treated as compromised.

## Required action (owner only)

1. **Revoke the leaked Gemini API key** in Google Cloud Console or
   Google AI Studio (APIs & Services → Credentials), and generate a new one.
2. Put the new key in a local `.env` file (gitignored) — never in source.
   See `.env.example` for the variable name.
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
