import MarkdownIt from 'markdown-it';
import './style.css';

// The Gemini API key never reaches this file. All model calls happen on the
// local Express server (server/server.js), which reads GEMINI_API_KEY from
// server/.env. See SECURITY.md.

const SERVER = 'http://localhost:3000';

const form = document.querySelector('#interviewForm');
const fileInput = document.querySelector('#resumeInput');
const dropzone = document.querySelector('#dropzone');
const dropzoneText = document.querySelector('#dropzoneText');
const submitBtn = document.querySelector('#submitBtn');
const output = document.querySelector('#output');
const statusLine = document.querySelector('#statusLine');
const transcriptState = document.querySelector('#transcriptState');
const viewfinder = document.querySelector('#viewfinder');
const cameraFeed = document.querySelector('#cameraFeed');
const recIndicator = document.querySelector('#recIndicator');
const sessionTag = document.querySelector('#sessionTag');
const modelTag = document.querySelector('#modelTag');
const mockTag = document.querySelector('#mockTag');
const boothBadge = document.querySelector('#boothBadge');
const cameraBtn = document.querySelector('#cameraBtn');
const stopCameraBtn = document.querySelector('#stopCameraBtn');

const steps = {
  parse: document.querySelector('.step[data-step="parse"]'),
  generate: document.querySelector('.step[data-step="generate"]'),
  camera: document.querySelector('.step[data-step="camera"]'),
};
const notes = {
  parse: document.querySelector('#noteParse'),
  generate: document.querySelector('#noteGenerate'),
  camera: document.querySelector('#noteCamera'),
};

sessionTag.textContent = 'SESSION ' + Math.random().toString(36).slice(2, 6).toUpperCase();

let serverReady = false;

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle('error', isError);
}

function setStep(name, state, note) {
  const el = steps[name];
  el.classList.remove('active', 'done', 'error');
  if (state) el.classList.add(state);
  if (note !== undefined) notes[name].textContent = note;
}

function showNotice(html, isError = false) {
  clearNotice();
  const div = document.createElement('div');
  div.className = 'notice' + (isError ? ' error' : '');
  div.id = 'configNotice';
  div.innerHTML = html;
  form.after(div);
}

function clearNotice() {
  document.querySelector('#configNotice')?.remove();
}

// ----- server health: parse + generation both live on the local server -----

async function checkServer() {
  try {
    const res = await fetch(SERVER + '/health');
    if (!res.ok) throw new Error('health ' + res.status);
    const health = await res.json();
    serverReady = true;
    modelTag.textContent = health.mock ? 'MOCK GENERATION' : health.model.toUpperCase().replaceAll('-', ' ');
    mockTag.hidden = !health.mock;

    if (!health.geminiConfigured) {
      showNotice(
        'The local server is running, but no Gemini key is configured. Add ' +
        '<code>GEMINI_API_KEY=...</code> to <code>server/.env</code> (see ' +
        '<code>server/.env.example</code>) and restart it. Get a key at ' +
        '<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>. ' +
        'The key stays on the server — it is never sent to the browser. ' +
        'Question generation is paused until then.'
      );
      setStep('generate', 'error', 'Missing GEMINI_API_KEY in server/.env');
      setStatus('Configure the server with a Gemini key to continue.', true);
      return;
    }
    setStep('generate', null, health.mock ? 'Mock mode — canned questions' : 'Ready (' + health.model + ')');
  } catch {
    serverReady = false;
    modelTag.textContent = 'SERVER OFFLINE';
    showNotice(
      'The local server is not reachable at <code>localhost:3000</code>. It parses the ' +
      'resume and holds the Gemini key, so nothing works without it. Start it with ' +
      '<code>cd server &amp;&amp; npm install &amp;&amp; node server.js</code>, then reload this page.',
      true
    );
    setStep('parse', 'error', 'Server offline');
    setStatus('Start the local server, then reload.', true);
  }
}

// ----- resume intake UI -----

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    dropzoneText.textContent = file.name;
    setStep('parse', null, file.name + ' ready');
    setStatus('');
  }
});

['dragover', 'dragleave', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (ev) => {
    ev.preventDefault();
    dropzone.classList.toggle('dragover', eventName === 'dragover');
    if (eventName === 'drop' && ev.dataTransfer.files.length) {
      fileInput.files = ev.dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });
});

// ----- parse + generate -----

async function parseResume(resumeFile) {
  const formData = new FormData();
  formData.append('resume', resumeFile);

  let response;
  try {
    response = await fetch(SERVER + '/parse-pdf', { method: 'POST', body: formData });
  } catch {
    throw new Error('Lost the connection to the local server. Is it still running?');
  }
  if (!response.ok) {
    throw new Error(`Parse failed (${response.status}): ${await response.text()}`);
  }
  return await response.text();
}

function extractInfoFromResume(resumeText) {
  // Basic keyword scan, as in the original demo. Returns only skills actually
  // found in the text — never invented ones.
  const found = resumeText.match(/(JavaScript|Python|Java|C#|Ruby|PHP)/gi) || [];
  const skills = [...new Set(found.map((s) => s.toLowerCase()))];
  return { skills };
}

async function streamQuestions(skills, onChunk) {
  const response = await fetch(SERVER + '/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  });
  if (!response.ok) {
    throw new Error(`Generation failed (${response.status}): ${await response.text()}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

// ----- camera (only ever started/stopped by the explicit buttons) -----

let cameraStream = null;

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraFeed.srcObject = null;
  viewfinder.classList.remove('live');
  recIndicator.hidden = true;
  boothBadge.textContent = 'STANDBY';
  boothBadge.classList.remove('on-air');
  stopCameraBtn.hidden = true;
  cameraBtn.hidden = false;
  cameraBtn.disabled = false;
  setStep('camera', 'active', 'Press Start camera when ready');
  setStatus('Camera off. Your questions above are still ready.');
}

stopCameraBtn.addEventListener('click', stopCamera);

cameraBtn.addEventListener('click', () => {
  setStep('camera', 'active', 'Requesting camera…');
  cameraBtn.disabled = true;
  // Video only: the demo never records or transmits anything, so it has no
  // reason to ask for the microphone.
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      cameraStream = stream;
      cameraFeed.srcObject = stream;
      viewfinder.classList.add('live');
      recIndicator.hidden = false;
      boothBadge.textContent = 'LIVE';
      boothBadge.classList.add('on-air');
      cameraBtn.hidden = true;
      stopCameraBtn.hidden = false;
      setStep('camera', 'done', 'Camera preview is live (nothing is recorded)');
      setStatus('Camera preview live. Press Stop camera to end it.');
    })
    .catch((err) => {
      cameraBtn.disabled = false;
      setStep('camera', 'error', 'Camera unavailable');
      setStatus(
        'Camera permission was denied or no camera was found. ' +
        'Your questions above are still ready — allow access and press Start camera again.',
        true
      );
      console.error('Error accessing media devices.', err);
    });
});

// ----- main flow -----

form.onsubmit = async (ev) => {
  ev.preventDefault();
  clearNotice();

  const resumeFile = fileInput.files[0];
  if (!resumeFile) {
    setStatus('Choose a PDF resume first.', true);
    dropzone.classList.add('dragover');
    setTimeout(() => dropzone.classList.remove('dragover'), 600);
    return;
  }

  if (!serverReady) {
    showNotice(
      'The local server is not reachable at <code>localhost:3000</code>. Start it with ' +
      '<code>cd server &amp;&amp; npm install &amp;&amp; node server.js</code>, then reload this page.',
      true
    );
    setStatus('Start the local server, then reload.', true);
    return;
  }

  submitBtn.disabled = true;
  transcriptState.textContent = 'working';
  transcriptState.className = 'transcript-state streaming';
  output.innerHTML = '';
  cameraBtn.hidden = true;

  try {
    // 1. Parse the resume on the local server
    setStep('parse', 'active', 'Sending to parse server…');
    setStatus('Parsing resume on the local server…');
    const resumeText = await parseResume(resumeFile);
    const info = extractInfoFromResume(resumeText);

    if (info.skills.length === 0) {
      setStep('parse', 'done', 'Parsed — no listed skills recognized');
      setStep('generate', 'error', 'Nothing to build questions from');
      transcriptState.textContent = 'no skills found';
      transcriptState.className = 'transcript-state';
      output.innerHTML =
        '<p class="placeholder">The resume parsed, but none of the tracked skills ' +
        '(JavaScript, Python, Java, C#, Ruby, PHP) appear in it. Questions are only ' +
        'generated from skills actually found — try a resume that lists them.</p>';
      setStatus('No recognized skills found in the resume.');
      return;
    }

    setStep('parse', 'done', `Found: ${info.skills.join(', ')}`);
    if (cameraStream) stopCamera(); // reset the booth on a rerun
    cameraBtn.hidden = true;
    stopCameraBtn.hidden = true;

    // 2. Stream questions from the server (which holds the Gemini key)
    setStep('generate', 'active', 'Streaming questions…');
    setStatus('Generating questions from the parsed skills…');

    const md = new MarkdownIt();
    let text = '';
    await streamQuestions(info.skills, (chunk) => {
      text += chunk;
      output.innerHTML = md.render(text);
      output.scrollTop = output.scrollHeight;
    });

    if (!text.trim()) {
      throw new Error('The server returned no questions.');
    }

    setStep('generate', 'done', 'Questions ready');
    transcriptState.textContent = 'ready';
    transcriptState.className = 'transcript-state done';
    setStatus('Questions ready. Start the camera when you are.');

    // 3. Offer the booth — the camera never starts on its own
    setStep('camera', 'active', 'Press Start camera when ready');
    cameraBtn.hidden = false;
    cameraBtn.disabled = false;
    stopCameraBtn.hidden = true;
  } catch (e) {
    transcriptState.textContent = 'error';
    transcriptState.className = 'transcript-state error';
    setStep('generate', 'error', 'Generation failed');
    setStatus(String(e?.message || e), true);
    output.innerHTML +=
      '<p class="placeholder">Generation stopped. The resume and its text stay on ' +
      'this machine; only extracted skill keywords leave the local server for Gemini.</p>';
  } finally {
    submitBtn.disabled = false;
  }
};

checkServer();
