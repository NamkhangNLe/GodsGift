// PDF text extraction via pdf.js (pdfjs-dist legacy build, runs in Node).
// Replaces the old parser after valid generated PDFs failed extraction tests.
import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractPdfText(buffer) {
  const data = new Uint8Array(buffer);
  const task = getDocument({
    data,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: VerbosityLevel.ERRORS,
  });
  const doc = await task.promise;
  try {
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return text;
  } finally {
    await task.destroy();
  }
}
