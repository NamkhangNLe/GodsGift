// Node test for the demo rubric engine: node test/rubric.test.mjs
// Exit non-zero on any failure. Run from the repo root.
import { scoreAnswer, summarizeCriteria } from "../rubric.js";
import { TRACKS } from "../questions.js";

let failures = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures += 1;
}

const bugQ = TRACKS.swe.questions[0];
const closureQ = TRACKS.swe.questions[2];
const rateQ = TRACKS.swe.questions[9];

const goodBug =
  "The hardest bug was a race condition in our checkout service that caused duplicate charges for about 2% of users. " +
  "I reproduced it locally with logs and a debugger, then used a stack trace and bisect to isolate the bad deploy. " +
  "The root cause was a missing idempotency key. I shipped a fix, added a regression test, and monitored error rates for a week. " +
  "Duplicate charges dropped to zero and we saved roughly 40 hours of support time a month.";
const offTopic =
  "I really enjoy cooking Italian food on weekends. My favorite recipe is a slow tomato sauce with fresh basil and good olive oil. " +
  "I also like hiking in the mountains when the weather is nice, and I have been reading a lot about photography lately. " +
  "Cooking teaches patience and attention to detail, which I think matters in any craft, and hiking clears my head for the week ahead.";
const paddedIDK =
  "I don't know, I really don't know, I have no idea at all about this one, I don't know what to say here, " +
  "I don't know, I don't know, I don't know, I don't know, I don't know, I don't know, I don't know, I don't know, " +
  "I don't know, I don't know, I don't know, I don't know, I don't know, I don't know, I don't know, I don't know.";

const good = scoreAnswer(bugQ, goodBug);
const off = scoreAnswer(bugQ, offTopic);
const idk = scoreAnswer(bugQ, paddedIDK);
const sameOnClosure = scoreAnswer(closureQ, goodBug);
const goodRate =
  "I would use a token bucket in Redis with atomic increments so distributed instances share one counter. " +
  "A fixed window is simpler but allows bursts at the boundary, while a sliding window is fairer and costs more memory. " +
  "The tradeoff is burst tolerance versus fairness: I would return 429 with a retry-after header and monitor abuse, accepting a little extra latency for consistent enforcement.";
const rate = scoreAnswer(rateQ, goodRate);

console.log("good bug answer:", JSON.stringify(good, null, 1));
console.log("off-topic answer:", JSON.stringify(off, null, 1));
console.log("padded I-don't-know:", JSON.stringify(idk, null, 1));
console.log("same bug answer on closures question:", JSON.stringify(sameOnClosure, null, 1));
console.log("good rate-limiter answer:", JSON.stringify(rate, null, 1));

check("good on-topic answer scores >= 7", good.score >= 7, `score=${good.score}`);
check("good answer passes all 3 criteria", good.criteria.every((c) => c.passed));
check("off-topic long answer scores <= 4", off.score <= 4, `score=${off.score}`);
check("off-topic answer passes 0 criteria", off.criteria.every((c) => !c.passed));
check("padded I-don't-know scores <= 3", idk.score <= 3, `score=${idk.score}`);
check("same answer scores differently on a different question", good.score !== sameOnClosure.score, `bug=${good.score} closure=${sameOnClosure.score}`);
check("bug answer scores lower on closures question", sameOnClosure.score < good.score);
check("good rate-limiter answer scores >= 7", rate.score >= 7, `score=${rate.score}`);
check("short answer caps at 4", scoreAnswer(bugQ, "I fixed it with logs.").score <= 4);

// Scorecard derivation: one interview where every criteria row is exercised.
const scored = [
  { question: bugQ.text, score: good.score, criteria: good.criteria },
  { question: rateQ.text, score: rate.score, criteria: rate.criteria },
  { question: closureQ.text, score: sameOnClosure.score, criteria: sameOnClosure.criteria },
];
const summary = summarizeCriteria(scored);
console.log("criteria summary:", JSON.stringify(summary, null, 1));
check("summary finds at least one strength", summary.strengths.length >= 1, JSON.stringify(summary.strengths));
check("summary finds at least one gap", summary.gaps.length >= 1, JSON.stringify(summary.gaps));

// Every question in the bank must have a difficulty and 2-3 criteria.
let bankOk = true;
for (const [trackId, track] of Object.entries(TRACKS)) {
  if (track.questions.length !== 10) { bankOk = false; console.log(`FAIL track ${trackId} has ${track.questions.length} questions`); }
  for (const q of track.questions) {
    if (!["intern", "mid", "senior"].includes(q.difficulty)) { bankOk = false; console.log(`FAIL ${trackId}: no difficulty on "${q.text.slice(0, 40)}"`); }
    if (!q.criteria || q.criteria.length < 2 || q.criteria.length > 3) { bankOk = false; console.log(`FAIL ${trackId}: bad criteria on "${q.text.slice(0, 40)}"`); }
    if (!q.type) { bankOk = false; console.log(`FAIL ${trackId}: no type on "${q.text.slice(0, 40)}"`); }
  }
}
check("all 50 questions have difficulty + 2-3 criteria + type", bankOk);

if (failures > 0) { console.error(`${failures} FAILURE(S)`); process.exit(1); }
console.log("ALL RUBRIC TESTS PASSED");
