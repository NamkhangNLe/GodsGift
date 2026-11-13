// GodsGift local server: parses resume PDFs and generates interview questions.
// The Gemini API key lives HERE only (server/.env) — it is never shipped to
// the browser. See SECURITY.md and server/.env.example.
import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
// Import the lib directly: pdf-parse's index.js enters a debug mode under
// ESM and tries to read a test fixture from disk.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY || '';
// Current stable model per https://aistudio.google.com/docs/models (checked
// 2026-11-13: gemini-2.5-flash is deprecated; 3.5 Flash-Lite is recommended
// for new projects). Override with GEMINI_MODEL if Google moves on.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
// MOCK_GEMINI=1 streams canned questions so the UI can be tried without a
// key. Clearly flagged to the frontend via /health. Never set in real use.
const MOCK = process.env.MOCK_GEMINI === '1';

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const app = express();

// Only the documented local Vite dev/preview origins can read or call this API.
// Origin-less requests remain available to local command-line tests.
const LOCAL_ORIGINS = new Set([
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:4173', 'http://127.0.0.1:4173',
]);
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && !LOCAL_ORIGINS.has(origin)) {
    return res.status(403).send('This demo only accepts the documented localhost frontend origins.');
  }
  if (origin) res.set('Access-Control-Allow-Origin', origin);
  res.vary('Origin');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Parse uploads in memory only. Check origin before consuming any upload.
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
}));
app.use(express.json({ limit: '64kb' }));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(API_KEY) || MOCK,
    mock: MOCK,
    model: MOCK ? 'mock' : MODEL,
  });
});

app.post('/parse-pdf', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "resume") is used to retrieve the uploaded file
  const resumeFile = req.files.resume;

  if (!resumeFile || Array.isArray(resumeFile)) {
    return res.status(400).send('Upload one PDF in the resume field.');
  }

  if (resumeFile.mimetype !== 'application/pdf' && !resumeFile.name.toLowerCase().endsWith('.pdf')) {
    return res.status(400).send('Only PDF resumes are supported.');
  }

  try {
    // Parse straight from the in-memory buffer; nothing is saved on the server.
    const data = await pdfParse(resumeFile.data);
    res.type('text/plain').send(data.text);
  } catch (err) {
    res.status(422).send('Could not parse that PDF: ' + err.message);
  }
});

const MOCK_QUESTIONS = [
  '1. **JavaScript** — Walk me through a bug you tracked down in production JavaScript. How did you isolate it?',
  '2. **Python** — Tell me about a Python project where performance mattered. What did you measure and change?',
  '3. **Ruby** — Describe a time you inherited Ruby code you disagreed with. What did you keep, and why?',
  '',
  '_Generated with MOCK_GEMINI=1 — canned questions for UI testing, not from a real model._',
].join('\n');

app.post('/generate-questions', async (req, res) => {
  const skills = req.body?.skills;
  if (!Array.isArray(skills) || skills.length === 0 ||
      !skills.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 40)) {
    return res.status(400).send('Body must be JSON: { "skills": ["javascript", ...] }');
  }

  res.type('text/plain');

  if (MOCK) {
    // Stream the canned questions in chunks so the UI exercises its real
    // streaming path without touching the Gemini API.
    for (const chunk of MOCK_QUESTIONS.split('\n')) {
      res.write(chunk + '\n');
      await new Promise((r) => setTimeout(r, 150));
    }
    return res.end();
  }

  if (!ai) {
    return res.status(503).send(
      'Gemini is not configured on this server. Add GEMINI_API_KEY to server/.env ' +
      '(see server/.env.example) and restart.'
    );
  }

  const prompt =
    'You are preparing a technical interview. A resume mentions these skills: ' +
    skills.join(', ') + '. Write one thoughtful, open-ended interview question ' +
    'per skill, formatted as a markdown numbered list with the skill name in bold. ' +
    'Do not invent experience the resume does not show.';

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: prompt,
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      },
    });
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) res.write(text);
    }
    res.end();
  } catch (err) {
    // If we have not started streaming yet we can still send a real status.
    if (!res.headersSent) {
      res.status(502).send('Gemini request failed: ' + (err?.message || err));
    } else {
      res.end();
    }
  }
});

app.listen(3000, '127.0.0.1', () => {
  console.log(`Server started on port 3000 (model: ${MOCK ? 'mock' : MODEL}, key: ${API_KEY ? 'set' : 'missing'})`);
});
