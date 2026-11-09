import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import MarkdownIt from "markdown-it";
import { TRACKS } from "./questions.js";
import "./style.css";

const md = new MarkdownIt();
const MODEL_NAME = "gemini-2.0-flash";

// ---------- config: API key ----------
// Priority: key saved in the browser (Settings) first, then VITE_GEMINI_API_KEY
// from a .env file. No key is ever hardcoded. Without a key the app runs in
// demo mode with a built-in question bank and heuristic feedback.
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
  resumeInput: $("resumeInput"),
  resumeStatus: $("resumeStatus"),
  settingsPanel: $("settingsPanel"),
  apiKeyInput: $("apiKeyInput"),
  saveKeyBtn: $("saveKeyBtn"),
  clearKeyBtn: $("clearKeyBtn"),
  keyStatus: $("keyStatus"),
  startBtn: $("startBtn"),
  progressText: $("progressText"),
  progressFill: $("progressFill"),
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
};

// ---------- state ----------
const state = {
  trackId: "swe",
  count: 5,
  difficulty: "mid",
  resumeText: "",
  resumeSkills: [],
  mode: "demo",
  questions: [],
  current: 0,
  transcript: [],
  scores: [],
  chat: null,
  awaitingAnswer: false,
  finished: false,
};

// ---------- helpers ----------
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

els.settingsBtn.addEventListener("click", () => {
  els.settingsPanel.open = true;
  els.settingsPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  els.apiKeyInput.focus();
});
els.keyBannerBtn.addEventListener("click", () => {
  els.settingsPanel.open = true;
  els.apiKeyInput.focus();
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

// ---------- resume (optional) ----------
const SKILL_RE =
  /(JavaScript|TypeScript|Python|Java|Go|Rust|C\+\+|C#|Ruby|PHP|SQL|React|Node\.js|Node|Vue|Angular|Django|Flask|Spring|Kubernetes|Docker|AWS|GCP|Azure|Terraform|GraphQL|REST|Kafka|Redis|PostgreSQL|Postgres|MySQL|MongoDB|Machine Learning|ML|LLM|System Design|Data Structures|Algorithms)/gi;

async function parseResume(file) {
  const formData = new FormData();
  formData.append("resume", file);
  const res = await fetch("/parse-pdf", { method: "POST", body: formData });
  if (!res.ok) throw new Error("parse-pdf returned " + res.status);
  return await res.text();
}

els.resumeInput.addEventListener("change", async () => {
  const file = els.resumeInput.files[0];
  if (!file) return;
  els.resumeStatus.textContent = "Parsing resume...";
  try {
    const text = await parseResume(file);
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
      "Resume server is not running (start it with npm run server), so the interview will continue without resume tailoring.";
  }
});

// ---------- transcript ----------
function addMessage(kind, html, score) {
  const who = kind === "q" ? "Interviewer" : kind === "a" ? "You" : "Feedback";
  const div = document.createElement("div");
  div.className = "msg msg-" + kind;
  div.innerHTML =
    `<span class="who">${who}</span>` +
    `<div>${html}</div>` +
    (typeof score === "number" ? `<span class="score-chip">Score: ${score}/10</span>` : "");
  els.transcript.appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
  state.transcript.push({ kind, html, score });
}

function setProgress() {
  const done = Math.min(state.current, state.count);
  els.progressText.textContent = `Question ${Math.min(state.current + 1, state.count)} of ${state.count}`;
  els.progressFill.style.width = `${Math.round((done / state.count) * 100)}%`;
}

// ---------- interview start ----------
function pickQuestions() {
  const bank = [...TRACKS[state.trackId].questions];
  // Shuffle lightly so repeat interviews feel fresh, but keep it deterministic enough.
  for (let i = bank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bank[i], bank[j]] = [bank[j], bank[i]];
  }
  return bank.slice(0, state.count);
}

function systemInstruction() {
  const track = TRACKS[state.trackId];
  const resume = state.resumeSkills.length
    ? `\nThe candidate's resume mentions these skills: ${state.resumeSkills.join(", ")}. Work at least one question toward them when natural.`
    : "";
  return (
    `You are an expert, friendly interviewer running a ${state.difficulty}-level ` +
    `${track.label} interview. Ask one question at a time. Keep questions focused and realistic. ` +
    `After each answer, give brief, honest feedback (2-3 sentences), a score from 1 to 10, ` +
    `then ask the next question. Do not lecture. Do not ask more than one question per turn.` +
    resume
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

function askQuestion(text) {
  state.questions[state.current] = text;
  addMessage("q", `<p>${esc(text)}</p>`);
  setProgress();
  state.awaitingAnswer = true;
  els.answerInput.focus();
}

async function startInterview() {
  state.count = parseInt(els.countSelect.value, 10);
  state.difficulty = els.difficultySelect.value;
  state.mode = hasKey() ? "live" : "demo";
  state.questions = pickQuestions();
  state.current = 0;
  state.transcript = [];
  state.scores = [];
  state.finished = false;
  state.chat = null;

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
        `Start the interview. The first question is: "${first}" Ask it now, exactly as written, with a one-line friendly opener.`
      );
      const text = res.response.text().trim();
      askQuestion(extractQuestion(text) || first);
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

els.startBtn.addEventListener("click", startInterview);

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
    score: sc ? Math.max(1, Math.min(10, Math.round(parseFloat(sc[1])))) : null,
    next: nx ? nx[1].trim() : null,
  };
}

// Demo-mode heuristic feedback: honest, specific to what the answer shows.
function demoFeedback(answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const n = words.length;
  const lower = answer.toLowerCase();
  const hasNumber = /\d/.test(answer);
  const hasExample = /(for example|for instance|when i|i led|we built|i built|i shipped|i designed|in my|at my|my team)/i.test(answer);
  const hasStructure = /(first|then|finally|so |because|as a result|the result was|situation|task|action|result)/i.test(answer);

  let score = 5;
  if (n >= 120) score += 1;
  if (n >= 60) score += 1;
  if (hasNumber) score += 1;
  if (hasExample) score += 1;
  if (hasStructure) score += 1;
  if (n < 25) score -= 1;
  score = Math.max(3, Math.min(9, score));

  const notes = [];
  if (n < 25) notes.push("This answer is short. Add detail: what you did, how, and what happened.");
  else if (n < 60) notes.push("A solid start, but it reads thin. Add one concrete detail or example.");
  else notes.push("Good length. The answer has room to breathe.");
  if (hasNumber) notes.push("Strong use of concrete numbers, that makes the answer credible.");
  else notes.push("Consider adding a number or a measurable outcome (users, time saved, scale).");
  if (hasExample) notes.push("The specific example helps a lot, keep grounding answers in real work.");
  else notes.push("Ground the answer in a real example from your experience.");
  if (!hasStructure) notes.push("Try a clear structure: situation, what you did, and the result.");
  return { score, text: notes.join(" ") };
}

async function handleAnswer(answer) {
  const q = state.questions[state.current];
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
      state.scores.push({ question: q, score: parsed.score, note: parsed.feedback });
      addMessage("f", md.render(parsed.feedback), parsed.score);
      advance(parsed.next);
    } else {
      const fb = demoFeedback(answer);
      state.scores.push({ question: q, score: fb.score, note: fb.text });
      addMessage("f", `<p>${esc(fb.text)}</p>`, fb.score);
      advance(null);
    }
  } catch (e) {
    addMessage(
      "f",
      `<p>Live AI hit an error (${esc(String(e.message || e))}). Switching to demo mode for the rest of this interview.</p>`
    );
    state.mode = "demo";
    setBadge("demo");
    const fb = demoFeedback(answer);
    state.scores.push({ question: q, score: fb.score, note: fb.text });
    addMessage("f", `<p>${esc(fb.text)}</p>`, fb.score);
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
  const nextQ = nextText && state.mode === "live" ? extractQuestion(nextText) || nextText : state.questions[state.current];
  // In live mode the model supplies the next question; in demo mode use the bank.
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
  finishInterview();
});

// ---------- scorecard ----------
function demoScorecard() {
  const scored = state.scores.filter((s) => typeof s.score === "number");
  const overall = scored.length
    ? Math.round((scored.reduce((a, s) => a + s.score, 0) / scored.length) * 10) / 10
    : null;
  const allText = state.transcript.filter((t) => t.kind === "a").map((t) => t.html).join(" ");
  const strengths = [];
  const gaps = [];
  const improvements = [];
  if (/\d/.test(allText)) strengths.push("Uses concrete numbers and measurable detail.");
  else gaps.push("Answers rarely include numbers or measurable outcomes.");
  if (/(for example|for instance|when i|i led|we built)/i.test(allText)) strengths.push("Grounds answers in real experience.");
  else gaps.push("Answers stay general, add a real example from your work.");
  const avgLen = state.transcript.filter((t) => t.kind === "a").length
    ? state.transcript.filter((t) => t.kind === "a").reduce((a, t) => a + t.html.split(/\s+/).length, 0) /
      state.transcript.filter((t) => t.kind === "a").length
    : 0;
  if (avgLen >= 60) strengths.push("Answers are well developed, not one-liners.");
  else gaps.push("Answers run short. Aim for a few sentences with a clear result.");
  improvements.push("For each answer, use situation, action, result: what happened, what you did, what changed.");
  improvements.push("End answers with an outcome or a lesson, not just a description.");
  improvements.push("Practice the weakest question again and record a 60-second spoken version.");
  return { overall, perQuestion: state.scores, strengths, gaps, improvements, mode: "demo" };
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
  return { ...data, mode: "live" };
}

function renderScorecard(data) {
  const overall = typeof data.overall === "number" ? data.overall : null;
  const overallPct = overall === null ? 0 : Math.max(0, Math.min(100, Math.round((overall / 10) * 100)));
  const rows = (data.perQuestion || state.scores)
    .map((s) => {
      const pct = typeof s.score === "number" ? Math.max(0, Math.min(100, Math.round((s.score / 10) * 100))) : 0;
      return `<tr><td>${esc(s.question || "")}</td><td>${esc(s.note || "")}</td><td class="num">${typeof s.score === "number" ? s.score + " / 10" : "-"}<span class="score-bar"><span style="width:${pct}%"></span></span></td></tr>`;
    })
    .join("");
  const list = (items) => (items && items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "<p class=\"muted\">Nothing noted.</p>");
  els.scorecard.innerHTML =
    `<div class="overall"><span class="big">${overall === null ? "n/a" : overall.toFixed(1)}<small> / 10</small></span><span class="overall-bar"><span style="width:${overallPct}%"></span></span><span class="muted small">${data.mode === "live" ? "Live AI scorecard" : "Demo scorecard (heuristic)"}</span></div>` +
    `<h3>Per question</h3>` +
    `<table class="score-table"><thead><tr><th>Question</th><th>Note</th><th style="text-align:right">Score</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<h3>Strengths</h3>${list(data.strengths)}` +
    `<h3>Gaps</h3>${list(data.gaps)}` +
    `<h3>To improve</h3>${list(data.improvements)}`;
}

async function finishInterview() {
  state.finished = true;
  state.awaitingAnswer = false;
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
refreshModeUI();
show("setup");
