// Deterministic, question-aware rubric engine for GodsGift demo mode.
// Scores an answer against THAT question's criteria (see questions.js), not
// against generic length/keyword heuristics. No network, no model, no state.
//
// scoreAnswer(question, answer) -> {
//   score: 1-10,
//   criteria: [{ label, passed, evidence }],
//   text: human-readable feedback naming what passed and what is missing,
// }
// Properties the engine is designed to have (see tests in test/rubric.test.mjs):
//   - the same answer scores differently on different questions
//   - an off-topic answer scores low even if it is long
//   - a padded "I don't know" scores low

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// One keyword matches if it appears as a word (allowing common suffixes:
// test matches tests/testing/tested; prioritiz matches prioritize/prioritized).
// Multi-word phrases match as substrings.
function keywordMatches(text, keyword) {
  const kw = keyword.toLowerCase();
  if (kw.includes(" ")) return text.includes(kw);
  const re = new RegExp(`\\b${escapeRegExp(kw)}\\w*\\b`);
  return re.test(text);
}

function criterionPassed(answerLower, criterion) {
  const hits = (criterion.keywords || []).filter((k) => keywordMatches(answerLower, k));
  return { passed: hits.length > 0, evidence: hits.slice(0, 3) };
}

export function scoreAnswer(question, answer) {
  const text = (answer || "").trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;
  const criteria = (question.criteria || []).map((c) => {
    const r = criterionPassed(lower, c);
    return { label: c.label, passed: r.passed, evidence: r.evidence };
  });
  const total = criteria.length || 1;
  const passedCount = criteria.filter((c) => c.passed).length;

  // Base: 2 points + 6 spread across criteria + 1 for a developed answer.
  // 0/3 criteria -> 2 (3 if long, so a long off-topic answer still fails).
  // 3/3 criteria + developed -> 9. Nothing here can reach 10: a 10 needs the
  // live model or a human; the rubric tops out at 9 by design.
  let score = 2 + Math.round((6 * passedCount) / total) + (n >= 40 ? 1 : 0);
  // Very short answers cannot score above 4 no matter the keyword hits.
  if (n < 15) score = Math.min(score, 4);
  // An explicit "I don't know" with no criteria passed is a 2, not a 3.
  if (passedCount === 0 && /(i don'?t know|no idea|not sure|i have no)/i.test(text)) score = 2;
  score = Math.max(1, Math.min(9, score));

  const passed = criteria.filter((c) => c.passed);
  const missed = criteria.filter((c) => !c.passed);
  const parts = [];
  if (passed.length === total) {
    parts.push(`Strong answer: it hits every part of this question (${passed.map((c) => c.label.toLowerCase()).join("; ")}).`);
  } else if (passed.length > 0) {
    parts.push(`Good on: ${passed.map((c) => c.label.toLowerCase()).join("; ")}.`);
  } else {
    parts.push("This answer does not address what the question is actually asking about.");
  }
  if (missed.length > 0) {
    parts.push(`Missing: ${missed.map((c) => c.label.toLowerCase()).join("; ")}.`);
  }
  if (n < 25) parts.push("It is also short: add a concrete detail or example from your own experience.");
  else if (n < 40) parts.push("Add one more concrete detail or a number to make it land harder.");
  return { score, criteria, text: parts.join(" ") };
}

// Aggregate per-criterion results across an interview into strengths / gaps /
// improvements, so the scorecard is derived from what the candidate actually
// did instead of three hardcoded bullets.
export function summarizeCriteria(scored) {
  const byLabel = new Map();
  for (const s of scored) {
    for (const c of s.criteria || []) {
      const e = byLabel.get(c.label) || { label: c.label, passed: 0, total: 0 };
      e.total += 1;
      if (c.passed) e.passed += 1;
      byLabel.set(c.label, e);
    }
  }
  const rows = [...byLabel.values()].map((e) => ({
    ...e,
    rate: e.total ? e.passed / e.total : 0,
  }));
  const strengths = rows
    .filter((r) => r.rate >= 0.75 && r.total >= 1)
    .sort((a, b) => b.rate - a.rate || b.total - a.total)
    .map((r) => `${r.label} (${r.passed}/${r.total} questions)`);
  const gaps = rows
    .filter((r) => r.rate <= 0.5)
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .map((r) => `${r.label} (${r.passed}/${r.total} questions)`);
  return { rows, strengths, gaps };
}

// Advice lines keyed off the most-missed criteria. Falls back to generic
// structure advice only when there is nothing specific to say.
const ADVICE_BY_KEYWORD = [
  [/quantif|number|measur|metric/i, "End answers with a number: users affected, time saved, latency, or scale. One figure beats a paragraph of adjectives."],
  [/tradeoff/i, "Name the tradeoff out loud in every design or decision answer: what you gave up, and why it was worth it."],
  [/structure|STAR/i, "Use situation, action, result: set the scene in one sentence, say what you did, then land the outcome."],
  [/example|concrete|real/i, "Ground every answer in one real example from your work. 'For example, when I…' is the strongest sentence you can open with."],
  [/outcome|result|impact/i, "Close each answer with the outcome: what changed, who it helped, or what you learned."],
  [/evidence|data/i, "Argue with evidence: a measurement, a benchmark, or a prototype result, not just an opinion."],
  [/test|edge case/i, "Show your testing instinct: name the edge cases you would check before trusting an answer."],
  [/scale|distributed|performance/i, "For design answers, always say what breaks first as you scale, and what you would do about it."],
];

export function improvementsFor(gaps, rows) {
  const out = [];
  for (const gap of gaps.slice(0, 3)) {
    const hit = ADVICE_BY_KEYWORD.find(([re]) => re.test(gap));
    out.push(hit ? hit[1] : `Practice: ${gap.toLowerCase()}.`);
  }
  if (out.length === 0) {
    out.push("Your answers hit the rubric consistently. Next level: tighten each answer to its sharpest example and outcome, and cut filler.");
  }
  return out;
}
