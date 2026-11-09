import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import { TRACKS, DIFFICULTY_ORDER } from "./questions.js";
import { scoreAnswer, summarizeCriteria, improvementsFor } from "./rubric.js";
import "./style.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const md = new MarkdownIt();
const MODEL_NAME = "gemini-2.0-flash";

// ---------- config: API key ----------
// Priority: key saved in the browser (Settings) first, then VITE_GEMINI_API_KEY
// from a .env file. No key is ever hardcoded. Without a key the app runs in
// demo mode with a built-in question bank and rubric feedback.
// NOTE (by design, not fixed here): live mode still uses a client-side key.
// A serverless AI proxy is the bigger rebuild that would remove that.
function getApiKey() {
  const stored = (localStorage.getItem("godsgift.apiKey") || "").trim();
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
  return stored || envKey || "";
}
const hasKey = () => getApiKey().length > 0;

// ---------- dom ----------
const $ = (id) => document.getElementById(id);
const els = {
  modeBadge: $("modeBadge"),
  settingsBtn: $("settingsBtn"),
  keyBanner: $("keyBanner"),
  keyBannerBtn: $("keyBannerBtn"),
  setup: $("view-setup"),
  interview: $("view-interview"),
  scorecardView: $("view-scorecard"),
  trackList: $("trackList"),
  countSelect: $("countSelect"),
  difficultySelect: $("difficultySelect"),
  jdInput: $("jdInput"),
  resumeInput: $("resumeInput"),
  resumeStatus: $("resumeStatus"),
  historyWrap: $("historyWrap"),
  historyList: $("historyList"),
  settingsPanel: $("settingsPanel"),
  apiKeyInput: $("apiKeyInput"),
  saveKeyBtn: $("saveKeyBtn"),
  clearKeyBtn: $("clearKeyBtn"),
  keyStatus: $("keyStatus"),
  startBtn: $("startBtn"),
  progressText: $("progressText"),
  progressFill: $("progressFill"),
  qTimer: $("qTimer"),
  interviewMode: $("interviewMode"),
  transcript: $("transcript"),
  typing: $("typing"),
  answerForm: $("answerForm"),
  answerInput: $("answerInput"),
  submitAnswerBtn: $("submitAnswerBtn"),
  endBtn: $("endBtn"),
  scorecard: $("scorecard"),
  downloadBtn: $("downloadBtn"),
  restartBtn: $("restartBtn"),
  retryBtn: $("retryBtn"),
};

// ---------- state ----------
const state = {
  trackId: "swe",
  count: 5,
  difficulty: "mid",
  jdText: "",
  resumeText: "",
  resumeSkills: [],
  mode: "demo",
  questions: [], // question objects { text, difficulty, type, criteria }
  current: 0,
  transcript: [],
  scores: [], // { question, questionObj, score, note, criteria, seconds }
  chat: null,
  awaitingAnswer: false,
  finished: false,
  questionStart: 0,
  scorecard: null,
  weakest: null,
};

// ---------- helpers ----------
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function show(view) {
  els.setup.hidden = view !== "setup";
  els.interview.hidden = view !== "interview";
  els.scorecardView.hidden = view !== "scorecard";
}
function setBadge(mode) {
  const isLive = mode === "live";
  els.modeBadge.textContent = isLive ? "Live AI" : "Demo mode";
  els.modeBadge.className = "badge " + (isLive ? "badge-live" : "badge-demo");
  els.interviewMode.textContent = isLive ? "Live AI" : "Demo mode";
  els.interviewMode.className = "badge " + (isLive ? "badge-live" : "badge-demo");
  els.keyBanner.hidden = isLive;
}
function refreshModeUI() {
  setBadge(hasKey() ? "live" : "demo");
  els.keyStatus.textContent = hasKey() ? "Key saved in this browser." : "No key saved. Demo mode.";
  if (hasKey() && !els.apiKeyInput.value) els.apiKeyInput.value = getApiKey();
}

// ---------- setup view ----------
function renderTracks() {
  els.trackList.innerHTML = "";
  for (const [id, t] of Object.entries(TRACKS)) {
    const label = document.createElement("label");
    label.className = "track-card" + (id === state.trackId ? " selected" : "");
    label.innerHTML =
      `<input type="radio" name="track" value="${id}" ${id === state.trackId ? "checked" : ""} />` +
      `<span class="track-name">${esc(t.label)}</span>` +
      `<p class="track-blurb">${esc(t.blurb)}</p>`;
    label.querySelector("input").addEventListener("change", () => {
      state.trackId = id;
      renderTracks();
    });
    els.trackList.appendChild(label);
  }
}

// ---------- interview history (localStorage) ----------
const HISTORY_KEY = "godsgift.history";
function loadHistory() {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(h) ? h : [];
  } catch {
    return [];
  }
}
function saveHistoryEntry(entry) {
  const h = loadHistory();
  h.unshift(entry);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)));
  } catch {
    // storage full or unavailable: history is a nice-to-have, never fatal
  }
}
function renderHistory() {
  const h = loadHistory();
  els.historyList.innerHTML = "";
  els.historyWrap.hidden = h.length === 0;
  for (const entry of h) {
    const li = document.createElement("li");
    li.className = "history-item";
    const date = new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const overall = typeof entry.overall === "number" ? entry.overall.toFixed(1) + " / 10" : "n/a";
    const label = document.createElement("span");
    label.textContent = `${date} · ${entry.trackLabel} · ${entry.difficulty} · ${overall} · ${entry.count} questions`;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-small btn-ghost";
    retry.textContent = "Retry weakest";
    retry.addEventListener("click", () => retryQuestion(entry.weakestText, entry.trackId));
    li.appendChild(label);
    li.appendChild(retry);
    els.historyList.appendChild(li);
  }
}

els.settingsBtn.addEventListener("click", () => {
  els.settingsPanel.open = true;
  els.settingsPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  els.apiKeyInput.focus();
});
els.keyBannerBtn.addEventListener("click", () => {
  els.settingsPanel.open = true;
  els.settingsPanel.focus();
});
els.saveKeyBtn.addEventListener("click", () => {
  const key = els.apiKeyInput.value.trim();
  if (!key) {
    els.keyStatus.textContent = "Enter a key first.";
    return;
  }
  localStorage.setItem("godsgift.apiKey", key);
  refreshModeUI();
  els.keyStatus.textContent = "Key saved. Live AI is on.";
});
els.clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem("godsgift.apiKey");
  els.apiKeyInput.value = "";
  refreshModeUI();
  els.keyStatus.textContent = "Key removed. Demo mode.";
});

// ---------- resume (optional, client-side PDF parsing) ----------
// Parses the PDF entirely in the browser with pdfjs-dist, so resume upload
// works on GitHub Pages with no server. The old /parse-pdf Express endpoint
// is no longer used by the client (server/ remains for local dev only).
const SKILL_RE =
  /(JavaScript|TypeScript|Python|Java|Go|Rust|C\+\+|C#|Ruby|PHP|SQL|React|Node\.js|Node|Vue|Angular|Django|Flask|Spring|Kubernetes|Docker|AWS|GCP|Azure|Terraform|GraphQL|REST|Kafka|Redis|PostgreSQL|Postgres|MySQL|MongoDB|Machine Learning|ML|LLM|System Design|Data Structures|Algorithms)/gi;

async function parseResumePdf(file) {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text;
}

els.resumeInput.addEventListener("change", async () => {
  const file = els.resumeInput.files[0];
  if (!file) return;
  els.resumeStatus.textContent = "Parsing resume in your browser...";
  try {
    const text = await parseResumePdf(file);
    state.resumeText = text;
    const found = [...new Set((text.match(SKILL_RE) || []).map((s) => s.trim()))];
    state.resumeSkills = found.slice(0, 12);
    els.resumeStatus.textContent =
      state.resumeSkills.length > 0
        ? "Resume parsed. Skills found: " + state.resumeSkills.join(", ")
        : "Resume parsed, no listed skills detected. It will still inform the interview.";
  } catch (e) {
    state.resumeText = "";
    state.resumeSkills = [];
    els.resumeStatus.textContent =
      "Could not parse that PDF (" + (e.message || "unknown error") + "). The interview will continue without resume tailoring.";
  }
});

// ---------- transcript ----------
// All HTML inserted here is sanitized with DOMPurify first: live model output
// is untrusted and must never reach innerHTML raw.
function addMessage(kind, html, score, tag) {
  const who = kind === "q" ? "Interviewer" : kind === "a" ? "You" : "Feedback";
  const div = document.createElement("div");
  div.className = "msg msg-" + kind;
  div.innerHTML =
    `<span class="who">${who}${tag ? ` <span class="q-tag">${esc(tag)}</span>` : ""}</span>` +
    `<div>${DOMPurify.sanitize(html)}</div>` +
    (typeof score === "number" ? `<span class="score-chip">Score: ${score}/10</span>` : "");
  els.transcript.appendChild(div);
  if (typeof div.scrollIntoView === "function") div.scrollIntoView({ behavior: "smooth", block: "end" });
  state.transcript.push({ kind, html, score });
}

function setProgress() {
  const done = Math.min(state.current, state.count);
  els.progressText.textContent = `Question ${Math.min(state.current + 1, state.count)} of ${state.count}`;
  els.progressFill.style.width = `${Math.round((done / state.count) * 100)}%`;
}

// ---------- per-question timer ----------
let timerId = null;
function updateTimer() {
  const s = Math.max(0, Math.floor((Date.now() - state.questionStart) / 1000));
  els.qTimer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function startTimer() {
  stopTimer();
  state.questionStart = Date.now();
  updateTimer();
  timerId = setInterval(updateTimer, 1000);
}
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function questionSeconds() {
  return Math.max(0, Math.floor((Date.now() - state.questionStart) / 1000));
}

// ---------- interview start ----------
// Difficulty is real now: questions are ranked by difficulty distance first,
// then by keyword overlap with the job description and resume skills, with a
// small random jitter so repeat interviews feel fresh.
function tokenize(s) {
  return new Set((s.toLowerCase().match(/[a-z][a-z+#.]{1,}/g) || []));
}
function pickQuestions() {
  const bank = [...TRACKS[state.trackId].questions];
  const want = DIFFICULTY_ORDER.indexOf(state.difficulty);
  const jdTokens = tokenize(state.jdText);
  const resumeLower = state.resumeSkills.map((s) => s.toLowerCase());
  const scored = bank.map((q) => {
    const dist = Math.abs(DIFFICULTY_ORDER.indexOf(q.difficulty) - want);
    const qTokens = tokenize(q.text + " " + (q.criteria || []).map((c) => c.label).join(" "));
    let overlap = 0;
    for (const t of jdTokens) if (qTokens.has(t)) overlap += 1;
    for (const s of resumeLower) if (q.text.toLowerCase().includes(s)) overlap += 2;
    return { q, key: -dist * 10 + overlap + Math.random() * 0.9 };
  });
  scored.sort((a, b) => b.key - a.key);
  return scored.slice(0, state.count).map((s) => s.q);
}

function systemInstruction() {
  const track = TRACKS[state.trackId];
  const resume = state.resumeSkills.length
    ? `\nThe candidate's resume mentions these skills: ${state.resumeSkills.join(", ")}. Work at least one question toward them when natural.`
    : "";
  const jd = state.jdText.trim()
    ? `\nThe job description for this role: ${state.jdText.trim().slice(0, 2000)} Tailor your questions to the skills and responsibilities in it.`
    : "";
  return (
    `You are an expert, friendly interviewer running a ${state.difficulty}-level ` +
    `${track.label} interview. Ask one question at a time. Keep questions focused and realistic. ` +
    `After each answer, give brief, honest feedback (2-3 sentences), a score from 1 to 10, ` +
    `then ask the next question. Do not lecture. Do not ask more than one question per turn.` +
    resume +
    jd
  );
}

function newGeminiChat() {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction(),
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  });
  return model.startChat({ history: [] });
}

function askQuestion(q) {
  state.questions[state.current] = q;
  addMessage("q", `<p>${esc(q.text)}</p>`, undefined, q.type);
  setProgress();
  startTimer();
  state.awaitingAnswer = true;
  els.answerInput.focus();
}

async function startInterview(override) {
  state.count = override ? override.questions.length : parseInt(els.countSelect.value, 10);
  state.difficulty = els.difficultySelect.value;
  state.jdText = els.jdInput ? els.jdInput.value : "";
  state.mode = hasKey() ? "live" : "demo";
  state.questions = override ? override.questions : pickQuestions();
  state.current = 0;
  state.transcript = [];
  state.scores = [];
  state.finished = false;
  state.chat = null;
  state.scorecard = null;
  state.weakest = null;
  els.retryBtn.hidden = true;

  els.transcript.innerHTML = "";
  els.answerInput.value = "";
  setBadge(state.mode);
  show("interview");
  setProgress();

  if (state.mode === "live") {
    try {
      state.chat = newGeminiChat();
      const first = state.questions[0];
      // Seed the first question from the bank so the interview starts instantly,
      // then let Gemini drive feedback and follow-ups.
      const res = await state.chat.sendMessage(
        `Start the interview. The first question is: "${first.text}" Ask it now, exactly as written, with a one-line friendly opener.`
      );
      const text = res.response.text().trim();
      askQuestion({ text: extractQuestion(text) || first.text, difficulty: state.difficulty, type: "Live", criteria: [] });
    } catch (e) {
      addMessage(
        "f",
        `<p>Live AI could not start (${esc(String(e.message || e))}). Continuing in demo mode for this interview.</p>`
      );
      state.mode = "demo";
      setBadge("demo");
      askQuestion(state.questions[0]);
    }
  } else {
    askQuestion(state.questions[0]);
  }
}

els.startBtn.addEventListener("click", () => startInterview());

// Retry the weakest question from the last scorecard (or a history entry):
// a focused one-question interview on exactly that question.
function findQuestionByText(trackId, text) {
  const bank = TRACKS[trackId] ? TRACKS[trackId].questions : [];
  return bank.find((q) => q.text === text) || null;
}
function retryQuestion(questionText, trackId) {
  if (!questionText) return;
  state.trackId = trackId || state.trackId;
  renderTracks();
  const q = findQuestionByText(state.trackId, questionText) || {
    text: questionText,
    difficulty: state.difficulty,
    type: "Retry",
    criteria: [],
  };
  show("setup");
  startInterview({ questions: [q] });
}
els.retryBtn.addEventListener("click", () => {
  if (state.weakest) retryQuestion(state.weakest.question, state.trackId);
});

// ---------- answering ----------
function extractQuestion(text) {
  const m = text.match(/QUESTION:\s*(.+)/i) || text.match(/["“]([^"”]+)["”]/);
  if (m) return m[1].trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : null;
}

function parseLiveTurn(text) {
  const fb = text.match(/FEEDBACK:\s*([\s\S]*?)(?=\nSCORE:|\nNEXT:|$)/i);
  const sc = text.match(/SCORE:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const nx = text.match(/NEXT:\s*([\s\S]*)/i);
  return {
    feedback: fb ? fb[1].trim() : text.trim(),
    // If the model omits SCORE:, default to a mid score (5) instead of null,
    // which used to render "n/a" on the scorecard.
    score: sc ? Math.max(1, Math.min(10, Math.round(parseFloat(sc[1])))) : 5,
    next: nx ? nx[1].trim() : null,
  };
}

// Demo feedback is scored by the rubric engine against THIS question's
// criteria (rubric.js). Live-model follow-up questions have no bank criteria;
// they fall back to three generic criteria so the rubric still applies.
const GENERIC_CRITERIA = [
  { label: "Uses a clear structure", keywords: ["first", "then", "finally", "because", "as a result", "situation", "action", "result"] },
  { label: "Grounds the answer in a real example", keywords: ["for example", "for instance", "when i", "i led", "we built", "i built", "i shipped", "my team"] },
  { label: "Quantifies impact", keywords: ["%", "percent", "user", "hour", "faster", "saved", "reduced", "increased", "scale"] },
];
function demoFeedback(question, answer) {
  const q = question.criteria && question.criteria.length ? question : { ...question, criteria: GENERIC_CRITERIA };
  return scoreAnswer(q, answer);
}

function criteriaHtml(criteria) {
  if (!criteria || !criteria.length) return "";
  return `<ul class="criteria-list">${criteria
    .map((c) => `<li class="${c.passed ? "pass" : "fail"}">${c.passed ? "✓" : "✗"} ${esc(c.label)}</li>`)
    .join("")}</ul>`;
}

async function handleAnswer(answer) {
  const q = state.questions[state.current];
  const seconds = questionSeconds();
  stopTimer();
  addMessage("a", `<p>${esc(answer)}</p>`);
  els.answerInput.value = "";
  els.submitAnswerBtn.disabled = true;
  els.typing.hidden = false;

  try {
    if (state.mode === "live" && state.chat) {
      const res = await state.chat.sendMessage(
        `The candidate answered: "${answer}"\n` +
          `Give brief, honest feedback (2-3 sentences), then a score, then the next question.\n` +
          `Reply in exactly this format:\nFEEDBACK: <feedback>\nSCORE: <n>/10\nNEXT: <next question, or DONE if this was the last question>`
      );
      const parsed = parseLiveTurn(res.response.text());
      state.scores.push({ question: q.text, questionObj: q, score: parsed.score, note: parsed.feedback, criteria: [], seconds });
      addMessage("f", md.render(parsed.feedback), parsed.score);
      advance(parsed.next);
    } else {
      const fb = demoFeedback(q, answer);
      state.scores.push({ question: q.text, questionObj: q, score: fb.score, note: fb.text, criteria: fb.criteria, seconds });
      addMessage("f", `<p>${esc(fb.text)}</p>${criteriaHtml(fb.criteria)}`, fb.score);
      advance(null);
    }
  } catch (e) {
    addMessage(
      "f",
      `<p>Live AI hit an error (${esc(String(e.message || e))}). Switching to demo mode for the rest of this interview.</p>`
    );
    state.mode = "demo";
    setBadge("demo");
    const fb = demoFeedback(q, answer);
    state.scores.push({ question: q.text, questionObj: q, score: fb.score, note: fb.text, criteria: fb.criteria, seconds });
    addMessage("f", `<p>${esc(fb.text)}</p>${criteriaHtml(fb.criteria)}`, fb.score);
    advance(null);
  } finally {
    els.typing.hidden = true;
    els.submitAnswerBtn.disabled = false;
  }
}

function advance(nextText) {
  state.current += 1;
  if (state.current >= state.count || (nextText && /^done\b/i.test(nextText))) {
    finishInterview();
    return;
  }
  // In live mode the model supplies the next question; in demo mode use the bank.
  const nextQ =
    nextText && state.mode === "live"
      ? { text: extractQuestion(nextText) || nextText, difficulty: state.difficulty, type: "Live", criteria: [] }
      : state.questions[state.current];
  askQuestion(nextQ);
}

els.answerForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (!state.awaitingAnswer || state.finished) return;
  const answer = els.answerInput.value.trim();
  if (!answer) {
    els.answerInput.focus();
    els.answerInput.placeholder = "Write an answer first, even a short one.";
    return;
  }
  state.awaitingAnswer = false;
  handleAnswer(answer);
});

els.endBtn.addEventListener("click", () => {
  if (state.finished) return;
  stopTimer();
  finishInterview();
});

// ---------- scorecard ----------
// Derived from the per-question criteria results, not hardcoded bullets:
// strengths/gaps/improvements come from which criteria the candidate
// consistently passed or failed across this interview.
function demoScorecard() {
  const scored = state.scores.filter((s) => typeof s.score === "number");
  const overall = scored.length
    ? Math.round((scored.reduce((a, s) => a + s.score, 0) / scored.length) * 10) / 10
    : null;
  const summary = summarizeCriteria(scored);
  const improvements = improvementsFor(summary.gaps.map((g) => g.split(" (")[0]), summary.rows);
  const weakest = scored.length ? [...scored].sort((a, b) => a.score - b.score)[0] : null;
  return {
    overall,
    perQuestion: state.scores,
    criteriaRows: summary.rows,
    strengths: summary.strengths,
    gaps: summary.gaps,
    improvements,
    weakest: weakest ? { question: weakest.question, score: weakest.score } : null,
    mode: "demo",
  };
}

async function liveScorecard() {
  const res = await state.chat.sendMessage(
    "The interview is over. Produce a scorecard as JSON in a fenced ```json block with exactly these keys: " +
      '{"overall": <number 1-10>, "perQuestion": [{"question": "...", "score": <number>, "note": "..."}], ' +
      '"strengths": ["..."], "gaps": ["..."], "improvements": ["..."]}. ' +
      "Base it on the answers given. Be honest and specific."
  );
  const text = res.response.text();
  const m = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Could not parse scorecard JSON.");
  const data = JSON.parse(m[1] || m[0]);
  const scored = (data.perQuestion || []).map((s) => ({ ...s, score: typeof s.score === "number" ? s.score : 5 }));
  const weakest = scored.length ? [...scored].sort((a, b) => a.score - b.score)[0] : null;
  return { ...data, perQuestion: scored, criteriaRows: [], weakest: weakest ? { question: weakest.question, score: weakest.score } : null, mode: "live" };
}

function renderScorecard(data) {
  const overall = typeof data.overall === "number" ? data.overall : null;
  const overallPct = overall === null ? 0 : Math.max(0, Math.min(100, Math.round((overall / 10) * 100)));
  const rows = (data.perQuestion || state.scores)
    .map((s) => {
      const pct = typeof s.score === "number" ? Math.max(0, Math.min(100, Math.round((s.score / 10) * 100))) : 0;
      const crit = s.criteria && s.criteria.length ? criteriaHtml(s.criteria) : "";
      const time = typeof s.seconds === "number" ? `<span class="muted small"> · ${Math.floor(s.seconds / 60)}:${String(s.seconds % 60).padStart(2, "0")}</span>` : "";
      return `<tr><td>${esc(s.question || "")}${time}</td><td>${esc(s.note || "")}${crit}</td><td class="num">${typeof s.score === "number" ? s.score + " / 10" : "-"}<span class="score-bar"><span style="width:${pct}%"></span></span></td></tr>`;
    })
    .join("");
  const list = (items) => (items && items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "<p class=\"muted\">Nothing noted.</p>");
  const rubricViz =
    data.criteriaRows && data.criteriaRows.length
      ? `<h3>Rubric breakdown</h3><p class="muted small">How often each rubric criterion was met across this interview.</p>` +
        data.criteriaRows
          .map((r) => {
            const pct = r.total ? Math.round((r.passed / r.total) * 100) : 0;
            return `<div class="rubric-row"><span class="rubric-label">${esc(r.label)}</span><span class="rubric-bar"><span style="width:${pct}%"></span></span><span class="rubric-num">${r.passed}/${r.total}</span></div>`;
          })
          .join("")
      : "";
  els.scorecard.innerHTML =
    `<div class="overall"><span class="big">${overall === null ? "n/a" : overall.toFixed(1)}<small> / 10</small></span><span class="overall-bar"><span style="width:${overallPct}%"></span></span><span class="muted small">${data.mode === "live" ? "Live AI scorecard" : "Demo scorecard (rubric)"}</span></div>` +
    `<h3>Per question</h3>` +
    `<table class="score-table"><thead><tr><th>Question</th><th>Feedback</th><th style="text-align:right">Score</th></tr></thead><tbody>${rows}</tbody></table>` +
    rubricViz +
    `<h3>Strengths</h3>${list(data.strengths)}` +
    `<h3>Gaps</h3>${list(data.gaps)}` +
    `<h3>To improve</h3>${list(data.improvements)}`;
}

async function finishInterview() {
  state.finished = true;
  state.awaitingAnswer = false;
  stopTimer();
  els.typing.hidden = false;
  els.typing.textContent = "Building your scorecard...";
  show("scorecard");
  try {
    let data;
    if (state.mode === "live" && state.chat) {
      try {
        data = await liveScorecard();
      } catch (e) {
        data = demoScorecard();
        data.mode = "demo";
      }
    } else {
      data = demoScorecard();
    }
    renderScorecard(data);
    state.scorecard = data;
    state.weakest = data.weakest || null;
    els.retryBtn.hidden = !state.weakest;
    if (state.weakest) {
      els.retryBtn.textContent = `Retry weakest question (${state.weakest.score}/10)`;
    }
    saveHistoryEntry({
      date: new Date().toISOString(),
      trackId: state.trackId,
      trackLabel: TRACKS[state.trackId].label,
      difficulty: state.difficulty,
      count: state.scores.length,
      overall: data.overall,
      mode: data.mode,
      weakestText: state.weakest ? state.weakest.question : null,
    });
    renderHistory();
  } finally {
    els.typing.hidden = true;
    els.typing.textContent = "Interviewer is thinking...";
  }
}

els.restartBtn.addEventListener("click", () => {
  state.chat = null;
  state.finished = false;
  els.answerInput.value = "";
  els.answerInput.placeholder = "Type your answer here. Be specific: what you did, how, and what happened.";
  refreshModeUI();
  renderHistory();
  show("setup");
});

// ---------- transcript download ----------
els.downloadBtn.addEventListener("click", () => {
  const track = TRACKS[state.trackId];
  const lines = [`# GodsGift interview transcript`, ``, `Track: ${track.label} | Difficulty: ${state.difficulty} | Mode: ${state.mode}`, ``];
  for (const t of state.transcript) {
    const who = t.kind === "q" ? "Interviewer" : t.kind === "a" ? "You" : "Feedback";
    const text = t.html.replace(/<[^>]+>/g, "");
    lines.push(`## ${who}`, ``, text, ``);
    if (typeof t.score === "number") lines.push(`Score: ${t.score}/10`, ``);
  }
  if (state.scorecard) {
    lines.push(`## Scorecard`, ``, `Overall: ${state.scorecard.overall} / 10`, ``);
    (state.scorecard.strengths || []).forEach((s) => lines.push(`- Strength: ${s}`));
    (state.scorecard.gaps || []).forEach((s) => lines.push(`- Gap: ${s}`));
    (state.scorecard.improvements || []).forEach((s) => lines.push(`- Improve: ${s}`));
    if (state.scorecard.weakest) lines.push(``, `Weakest question: ${state.scorecard.weakest.question} (${state.scorecard.weakest.score}/10)`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "godsgift-interview.md";
  a.click();
  URL.revokeObjectURL(a.href);
});

// ---------- init ----------
renderTracks();
renderHistory();
refreshModeUI();
show("setup");
