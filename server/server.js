const express = require("express");
const fileUpload = require("express-fileupload");
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// Resume PDF parsing service for GodsGift.
// Run with: npm run server   (from the repo root)
// The Vite dev server runs on :5173 and calls this on :3000.
//
// Note: this uses pdfjs-dist (modern pdf.js), not pdf-parse. The bundled
// pdf.js inside pdf-parse 1.1.1 fails with "bad XRef entry" on ordinary PDFs
// (including ones produced by fpdf), so pdf-parse is not used here.

const app = express();
const PORT = process.env.PORT || 3000;

// Allow the Vite dev server (and any localhost preview) to call /parse-pdf.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));

app.get("/health", (req, res) => res.json({ ok: true }));

async function extractTextFromPdf(buffer) {
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, disableFontFace: true }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text;
}

app.post("/parse-pdf", async (req, res) => {
  if (!req.files || !req.files.resume) {
    return res.status(400).send("No resume file was uploaded.");
  }

  try {
    // Parse the uploaded buffer directly. The old code called
    // resumeFile.mv() to a placeholder path that does not exist, which
    // threw before parsing ever ran.
    const text = await extractTextFromPdf(req.files.resume.data);
    res.type("text/plain").send(text);
  } catch (err) {
    console.error("parse-pdf failed:", err);
    res.status(500).send("Could not parse that PDF.");
  }
});

app.listen(PORT, () => {
  console.log(`GodsGift resume server listening on port ${PORT}`);
});
