import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractPdfText } from '../pdf-text.mjs';

test('extracts text from a real generated PDF', async () => {
  const buf = Buffer.from(readFileSync(new URL('./fixtures/synthetic-resume.pdf.base64', import.meta.url), 'utf8').trim(), 'base64');
  const text = await extractPdfText(buf);
  assert.match(text, /JavaScript Python Ruby/);
});

test('rejects non-PDF input', async () => {
  await assert.rejects(() => extractPdfText(Buffer.from('not a pdf')), /Invalid PDF/);
});
