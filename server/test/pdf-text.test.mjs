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


test('local API uses input skills in mock output and hides parser internals', async () => {
  const { spawn } = await import('node:child_process');
  const { once } = await import('node:events');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, GEMINI_API_KEY: '', MOCK_GEMINI: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await Promise.race([
      once(child.stdout, 'data'),
      once(child, 'exit').then(() => { throw new Error('Test server exited before startup'); }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test server startup timeout')), 5000).unref()),
    ]);
    const result = await fetch('http://127.0.0.1:3000/generate-questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: ['Java'] }),
    });
    assert.equal(result.status, 200);
    const text = await result.text();
    assert.match(text, /\*\*Java\*\*/);
    assert.doesNotMatch(text, /JavaScript|Python|Ruby/);
    assert.match(text, /canned template/);
    const invalid = await fetch('http://127.0.0.1:3000/generate-questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"skills":[]}',
    });
    assert.equal(invalid.status, 400);
    const form = new FormData();
    form.append('resume', new Blob(['not a pdf'], { type: 'application/pdf' }), 'invalid.pdf');
    const parsed = await fetch('http://127.0.0.1:3000/parse-pdf', { method: 'POST', body: form });
    assert.equal(parsed.status, 422);
    assert.equal(await parsed.text(), 'Could not parse that PDF. Try an unencrypted PDF with selectable text.');
    const denied = await fetch('http://127.0.0.1:3000/health', { headers: { Origin: 'https://example.invalid' } });
    assert.equal(denied.status, 403);
  } finally {
    child.kill();
    await once(child, 'exit');
  }
});
