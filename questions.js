// Question banks for GodsGift interview tracks.
// Used by demo mode (no API key) and as fallback / seed questions in live mode.
// Each question is an object:
//   text       — the question as asked
//   difficulty — "intern" | "mid" | "senior" (used by pickQuestions)
//   type       — short tag shown in the interview ("Behavioral", "System design", ...)
//   criteria   — 2-3 concrete, checkable rubric criteria. Each criterion has a
//                 label shown to the user and keywords/concepts that evidence it.
//                 The demo rubric engine scores answers against THESE criteria,
//                 so feedback is question-aware: the same answer scores differently
//                 on different questions, and an off-topic answer scores low.

export const TRACKS = {
  swe: {
    label: "Software Engineer",
    blurb: "General software engineering: debugging, design, teamwork, and craft.",
    questions: [
      {
        text: "Tell me about the most challenging bug you have debugged. How did you find it and fix it?",
        difficulty: "mid",
        type: "Technical",
        criteria: [
          { label: "Names a concrete debugging method", keywords: ["log", "breakpoint", "debugger", "reproduce", "bisect", "trace", "stack trace", "profiler", "isolate", "test"] },
          { label: "Describes the fix and how it was verified", keywords: ["fix", "patch", "root cause", "verify", "regression", "monitor", "deploy", "test"] },
          { label: "Quantifies impact or names a tradeoff", keywords: ["user", "downtime", "latency", "error rate", "%", "percent", "hour", "scale", "tradeoff", "cost"] },
        ],
      },
      {
        text: "How do you approach code reviews, both when you are the reviewer and the author?",
        difficulty: "intern",
        type: "Technical",
        criteria: [
          { label: "Reviewer habits: what you actually check", keywords: ["readab", "clarity", "naming", "edge case", "test", "nit", "suggest", "question", "security", "performance"] },
          { label: "Author habits: small, reviewable changes", keywords: ["small", "description", "context", "respond", "ci", "draft", "split", "self-review"] },
          { label: "Treats review as learning, not gatekeeping", keywords: ["learn", "mentor", "respect", "discuss", "team", "kind", "teach", "share"] },
        ],
      },
      {
        text: "Explain closures in JavaScript to a junior engineer. When would you use one?",
        difficulty: "intern",
        type: "Technical",
        criteria: [
          { label: "Defines a closure correctly", keywords: ["scope", "function", "remember", "capture", "variable", "lexical", "enclosing", "inner function"] },
          { label: "Gives a real use case", keywords: ["callback", "private", "factory", "debounce", "memo", "event", "state", "counter", "handler"] },
          { label: "Names a tradeoff or pitfall", keywords: ["memory", "leak", "loop", "stale", "var", "garbage", "retain"] },
        ],
      },
      {
        text: "Describe a time you had to learn a new technology quickly to ship something. How did you do it?",
        difficulty: "intern",
        type: "Behavioral",
        criteria: [
          { label: "Shows a structured way of learning", keywords: ["docs", "documentation", "tutorial", "example", "spike", "prototype", "small", "experiment"] },
          { label: "Connects learning to shipping", keywords: ["mvp", "iterate", "scope", "pair", "review", "ask", "shipped", "delivered"] },
          { label: "States the outcome", keywords: ["shipped", "delivered", "learned", "result", "time", "launched", "worked"] },
        ],
      },
      {
        text: "How do you decide between a SQL and a NoSQL database for a new service?",
        difficulty: "senior",
        type: "System design",
        criteria: [
          { label: "Names a real tradeoff", keywords: ["consistency", "schema", "scale", "join", "transaction", "acid", "flexib", "normaliz"] },
          { label: "Reasons from the data model and access patterns", keywords: ["relational", "document", "key-value", "query", "access pattern", "read", "write", "relation"] },
          { label: "Makes a concrete choice for a use case", keywords: ["postgres", "mysql", "mongo", "dynamodb", "redis", "cassandra", "use case", "choose", "pick"] },
        ],
      },
      {
        text: "Tell me about a project you led end to end. What was the hardest tradeoff you made?",
        difficulty: "senior",
        type: "Behavioral",
        criteria: [
          { label: "Shows ownership and scope", keywords: ["scope", "plan", "roadmap", "stakeholder", "timeline", "milestone", "own", "led", "coordinat"] },
          { label: "Names the hardest tradeoff explicitly", keywords: ["tradeoff", "deadline", "quality", "cut", "prioritiz", "risk", "scope", "sacrifice"] },
          { label: "States the outcome with impact", keywords: ["shipped", "launched", "impact", "metric", "user", "result", "revenue", "adopt"] },
        ],
      },
      {
        text: "How do you handle technical debt on a team that is always shipping?",
        difficulty: "mid",
        type: "Technical",
        criteria: [
          { label: "Identifies the debt concretely", keywords: ["debt", "legacy", "refactor", "hack", "shortcut", "brittle", "fragile", "duplicat"] },
          { label: "Prioritizes by impact and risk", keywords: ["impact", "risk", "cost", "roadmap", "allocat", "prioritiz", "velocity", "bug"] },
          { label: "Prevents new debt", keywords: ["test", "review", "standard", "document", "refactor", "lint", "ci", "boy scout"] },
        ],
      },
      {
        text: "What is your approach to testing? How do you decide what is worth a test?",
        difficulty: "mid",
        type: "Technical",
        criteria: [
          { label: "Names test levels", keywords: ["unit", "integration", "e2e", "end-to-end", "coverage", "mock", "contract"] },
          { label: "Explains what is worth testing", keywords: ["critical", "logic", "edge", "regression", "flaky", "cost", "risk", "business"] },
          { label: "Acknowledges testing tradeoffs", keywords: ["speed", "flaky", "maintain", "ci", "slow", "brittle", "time", "confidence"] },
        ],
      },
      {
        text: "Describe a time you disagreed with a technical decision. What did you do?",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Uses a clear structure (situation, action, result)", keywords: ["situation", "context", "proposed", "alternative", "discussed", "decided", "outcome", "result"] },
          { label: "Argues with evidence, not opinion", keywords: ["data", "evidence", "benchmark", "prototype", "metric", "tradeoff", "measure"] },
          { label: "Handles the outcome maturely", keywords: ["compromise", "disagree and commit", "respect", "revisit", "learn", "accept", "support"] },
        ],
      },
      {
        text: "Walk me through how you would design a simple rate limiter for an API.",
        difficulty: "senior",
        type: "System design",
        criteria: [
          { label: "Names a rate-limiting algorithm", keywords: ["token bucket", "leaky bucket", "fixed window", "sliding window", "counter", "bucket"] },
          { label: "Handles distributed concerns", keywords: ["redis", "distributed", "race", "atomic", "scale", "shard", "shared", "consistent"] },
          { label: "Covers tradeoffs and failure modes", keywords: ["burst", "fairness", "latency", "abuse", "429", "header", "retry", "edge"] },
        ],
      },
    ],
  },
  behavioral: {
    label: "Behavioral",
    blurb: "Classic behavioral questions: teamwork, conflict, failure, and growth.",
    questions: [
      {
        text: "Tell me about a time you disagreed with a teammate. How did you handle it?",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Uses a clear structure (situation, action, result)", keywords: ["situation", "context", "told", "listened", "discussed", "decided", "outcome", "result"] },
          { label: "Shows empathy for the other side", keywords: ["perspective", "understand", "listen", "empathy", "their point", "respect", "concern"] },
          { label: "Reaches a resolution, not a stalemate", keywords: ["resolved", "compromise", "agreed", "solution", "moved forward", "decided", "outcome"] },
        ],
      },
      {
        text: "Describe a failure at work or school and what you learned from it.",
        difficulty: "intern",
        type: "Behavioral",
        criteria: [
          { label: "Owns the failure honestly", keywords: ["my fault", "i missed", "i failed", "mistake", "wrong", "responsib", "own"] },
          { label: "Explains what actually went wrong", keywords: ["because", "assum", "missed", "overlook", "deadline", "communicat", "test", "plan"] },
          { label: "Names a specific lesson and what changed", keywords: ["learned", "now i", "changed", "checklist", "process", "since then", "next time"] },
        ],
      },
      {
        text: "Tell me about a time you had to meet a tight deadline with incomplete information.",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Shows how you filled the gaps", keywords: ["ask", "clarif", "assum", "stakeholder", "prototype", "spike", "research", "guess"] },
          { label: "Shows prioritization under pressure", keywords: ["prioritiz", "scope", "mvp", "cut", "essential", "tradeoff", "focus"] },
          { label: "States the outcome", keywords: ["shipped", "delivered", "on time", "result", "launched", "met", "outcome"] },
        ],
      },
      {
        text: "Describe a conflict you had with a manager or a peer. How was it resolved?",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Describes the conflict concretely", keywords: ["disagree", "conflict", "tension", "different", "priority", "approach", "expectation"] },
          { label: "Shows a constructive approach", keywords: ["talk", "one-on-one", "listen", "data", "propos", "discuss", "private", "calm"] },
          { label: "Ends with a resolution or lesson", keywords: ["resolved", "agreed", "learned", "relationship", "better", "trust", "outcome"] },
        ],
      },
      {
        text: "Tell me about a time you went above and beyond what was asked of you.",
        difficulty: "intern",
        type: "Behavioral",
        criteria: [
          { label: "Shows initiative beyond the ask", keywords: ["extra", "volunteer", "noticed", "took it on", "initiative", "beyond", "extra mile"] },
          { label: "Names the extra work concretely", keywords: ["built", "wrote", "fixed", "created", "automated", "documented", "stayed", "weekend"] },
          { label: "States the impact on others", keywords: ["team", "saved", "helped", "faster", "user", "impact", "thank", "result"] },
        ],
      },
      {
        text: "Describe a time you received difficult feedback. What did you do with it?",
        difficulty: "intern",
        type: "Behavioral",
        criteria: [
          { label: "Receives feedback without defensiveness", keywords: ["listen", "thank", "reflect", "hard to hear", "accepted", "didn", "pause"] },
          { label: "Turns it into a concrete change", keywords: ["changed", "practiced", "asked", "checklist", "improved", "followed up", "plan"] },
          { label: "Shows the result of the change", keywords: ["better", "improved", "result", "feedback", "since then", "growth", "outcome"] },
        ],
      },
      {
        text: "Tell me about a time you mentored someone or helped a teammate grow.",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Names what the other person needed", keywords: ["struggl", "new", "stuck", "confused", "junior", "onboard", "learn"] },
          { label: "Describes what you actually did", keywords: ["pair", "review", "explain", "guide", "meet", "coach", "gave", "walked through"] },
          { label: "Shows their growth, not just your help", keywords: ["they", "shipped", "confident", "promot", "independent", "grew", "now", "result"] },
        ],
      },
      {
        text: "How do you handle ambiguity when a task has no clear requirements?",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Seeks clarity actively", keywords: ["ask", "clarif", "stakeholder", "question", "meeting", "write", "spec", "confirm"] },
          { label: "Makes progress without waiting for perfect clarity", keywords: ["assum", "prototype", "spike", "draft", "iterate", "mvp", "start", "small"] },
          { label: "Validates assumptions early", keywords: ["check", "feedback", "demo", "review", "validat", "confirm", "align", "iterate"] },
        ],
      },
      {
        text: "Describe a time you had to say no to a request. How did you communicate it?",
        difficulty: "senior",
        type: "Behavioral",
        criteria: [
          { label: "Gives a real reason, not just a refusal", keywords: ["because", "capacity", "priority", "tradeoff", "deadline", "focus", "risk"] },
          { label: "Offers an alternative or a path forward", keywords: ["alternative", "instead", "later", "someone else", "smaller", "help", "suggest"] },
          { label: "Shows the relationship survived", keywords: ["understood", "agreed", "trust", "relationship", "later", "worked out", "respect"] },
        ],
      },
      {
        text: "Tell me about a time you improved a process or a workflow for your team.",
        difficulty: "mid",
        type: "Behavioral",
        criteria: [
          { label: "Names the broken process concretely", keywords: ["manual", "slow", "repetitive", "error", "bottleneck", "waste", "pain", "took"] },
          { label: "Describes the improvement you made", keywords: ["automated", "script", "template", "checklist", "tool", "changed", "built", "introduced"] },
          { label: "Quantifies the improvement", keywords: ["saved", "hour", "%", "percent", "faster", "fewer", "from", "to", "cut"] },
        ],
      },
    ],
  },
  system: {
    label: "System Design",
    blurb: "Large-scale design: architecture, scaling, and tradeoffs.",
    questions: [
      {
        text: "Design a URL shortener. Walk me through your architecture and the tradeoffs.",
        difficulty: "mid",
        type: "System design",
        criteria: [
          { label: "Covers the core data model and flow", keywords: ["hash", "key", "mapping", "redirect", "database", "id", "generat", "lookup"] },
          { label: "Addresses scale and performance", keywords: ["cache", "scale", "read", "write", "shard", "replica", "latency", "cdn"] },
          { label: "Names a real tradeoff", keywords: ["tradeoff", "collision", "custom", "expir", "analytics", "security", "cost"] },
        ],
      },
      {
        text: "Design a real-time chat system for millions of users. What breaks first as you scale?",
        difficulty: "senior",
        type: "System design",
        criteria: [
          { label: "Names the realtime mechanism", keywords: ["websocket", "socket", "push", "polling", "sse", "connection", "fanout", "pub/sub"] },
          { label: "Identifies what breaks first at scale", keywords: ["break", "bottleneck", "connection", "fanout", "storage", "presence", "scale", "hot"] },
          { label: "Covers delivery guarantees and ordering", keywords: ["order", "deliver", "at-least-once", "exactly-once", "ack", "offline", "sync", "duplicate"] },
        ],
      },
      {
        text: "How would you design a rate limiter? Compare a few approaches.",
        difficulty: "mid",
        type: "System design",
        criteria: [
          { label: "Compares at least two approaches", keywords: ["token bucket", "leaky bucket", "fixed window", "sliding window", "counter", "versus", "compare", "instead"] },
          { label: "Handles distributed state", keywords: ["redis", "distributed", "race", "atomic", "shared", "consistent", "shard"] },
          { label: "Names tradeoffs (burst, fairness, memory)", keywords: ["burst", "fairness", "memory", "accuracy", "latency", "tradeoff", "cost"] },
        ],
      },
      {
        text: "Design a news feed for a social app. How do you rank and deliver posts?",
        difficulty: "senior",
        type: "System design",
        criteria: [
          { label: "Covers fanout (push vs pull)", keywords: ["fanout", "push", "pull", "timeline", "feed", "precompute", "on read", "on write"] },
          { label: "Explains ranking", keywords: ["rank", "score", "relevance", "recency", "engagement", "personal", "signal", "ml"] },
          { label: "Handles scale and freshness", keywords: ["cache", "scale", "fresh", "paginate", "shard", "celebrity", "hot", "latency"] },
        ],
      },
      {
        text: "Design a ride-sharing dispatch system. How do you match riders and drivers?",
        difficulty: "senior",
        type: "System design",
        criteria: [
          { label: "Explains matching", keywords: ["match", "nearest", "geohash", "quad", "eta", "distance", "dispatch", "assign"] },
          { label: "Covers location at scale", keywords: ["location", "geo", "index", "update", "gps", "shard", "partition", "map"] },
          { label: "Handles failure and fairness", keywords: ["surge", "cancel", "timeout", "fair", "retry", "fallback", "demand", "supply"] },
        ],
      },
      {
        text: "How do you scale a relational database when reads start to dominate?",
        difficulty: "mid",
        type: "System design",
        criteria: [
          { label: "Names read-scaling techniques", keywords: ["replica", "read replica", "cache", "index", "denormal", "materialized", "cdn"] },
          { label: "Explains the write/read tradeoff", keywords: ["replication lag", "stale", "consistency", "eventual", "write", "tradeoff"] },
          { label: "Knows when to shard or move on", keywords: ["shard", "partition", "vertical", "horizontal", "migrate", "nosql", "limit"] },
        ],
      },
      {
        text: "Design a notification system that supports email, push, and SMS.",
        difficulty: "mid",
        type: "System design",
        criteria: [
          { label: "Covers multiple channels and preferences", keywords: ["email", "push", "sms", "channel", "preference", "opt", "template"] },
          { label: "Handles delivery, retries, and dedup", keywords: ["queue", "retry", "dedupe", "duplicate", "idempot", "deliver", "rate"] },
          { label: "Names a tradeoff (latency, cost, spam)", keywords: ["tradeoff", "cost", "latency", "spam", "batch", "priority", "throttl"] },
        ],
      },
      {
        text: "What are the tradeoffs of caching, and where would you put caches in a web app?",
        difficulty: "intern",
        type: "System design",
        criteria: [
          { label: "Names caching layers", keywords: ["browser", "cdn", "redis", "memcached", "database", "application", "edge", "memory"] },
          { label: "Explains invalidation and staleness", keywords: ["invalidat", "ttl", "stale", "evict", "cache-aside", "write-through", "consistency"] },
          { label: "Names a real tradeoff", keywords: ["tradeoff", "complexity", "cost", "memory", "hit rate", "cold", "stampede"] },
        ],
      },
      {
        text: "Design a file storage service like a simple version of S3.",
        difficulty: "mid",
        type: "System design",
        criteria: [
          { label: "Covers storage and metadata", keywords: ["object", "bucket", "metadata", "blob", "chunk", "key", "store"] },
          { label: "Handles durability and replication", keywords: ["replica", "durab", "erasure", "redundan", "backup", "checksum", "availability"] },
          { label: "Covers uploads, downloads, and scale", keywords: ["multipart", "upload", "download", "presigned", "cdn", "scale", "range"] },
        ],
      },
      {
        text: "How would you design a search autocomplete that stays fast at scale?",
        difficulty: "intern",
        type: "System design",
        criteria: [
          { label: "Names a fast lookup structure", keywords: ["trie", "prefix", "index", "inverted", "elasticsearch", "cache", "lookup"] },
          { label: "Handles latency", keywords: ["latency", "debounce", "cache", "prefetch", "fast", "millisecond", "edge"] },
          { label: "Covers ranking and updates", keywords: ["rank", "popular", "frequent", "update", "fresh", "personal", "suggest"] },
        ],
      },
    ],
  },
  algo: {
    label: "Algorithms",
    blurb: "Data structures and algorithms: reasoning, complexity, and problem solving.",
    questions: [
      {
        text: "Explain Big O notation and give an example where it changed your approach.",
        difficulty: "intern",
        type: "Algorithms",
        criteria: [
          { label: "Defines Big O correctly", keywords: ["worst", "growth", "input", "scale", "complexity", "asymptotic", "upper bound"] },
          { label: "Gives a concrete example", keywords: ["example", "hash", "sort", "search", "loop", "nested", "linear", "quadratic"] },
          { label: "Shows it changed a real decision", keywords: ["changed", "instead", "chose", "switched", "faster", "slow", "timeout", "optimiz"] },
        ],
      },
      {
        text: "How would you detect a cycle in a linked list? Compare the approaches.",
        difficulty: "intern",
        type: "Algorithms",
        criteria: [
          { label: "Names Floyd's two-pointer approach", keywords: ["floyd", "tortoise", "hare", "slow", "fast", "two pointer", "pointer"] },
          { label: "Compares with the hash-set approach", keywords: ["hash", "set", "visited", "memory", "space", "compare", "tradeoff"] },
          { label: "States time and space complexity", keywords: ["o(1)", "o(n)", "constant", "linear", "space", "time", "complexity"] },
        ],
      },
      {
        text: "How would you solve two-sum? What if the array is sorted?",
        difficulty: "intern",
        type: "Algorithms",
        criteria: [
          { label: "Describes the hash-map solution", keywords: ["hash", "map", "complement", "lookup", "dictionary", "seen"] },
          { label: "Handles the sorted case with two pointers", keywords: ["sorted", "two pointer", "left", "right", "pointer", "shrink"] },
          { label: "States complexity", keywords: ["o(n)", "linear", "time", "space", "complexity", "o(1)"] },
        ],
      },
      {
        text: "Walk me through how you approach a coding problem you have never seen before.",
        difficulty: "mid",
        type: "Algorithms",
        criteria: [
          { label: "Clarifies and restates the problem", keywords: ["clarif", "restate", "example", "edge", "input", "output", "constraint", "ask"] },
          { label: "Works a small example by hand", keywords: ["example", "brute", "naive", "walk through", "trace", "small", "pattern"] },
          { label: "Optimizes and tests deliberately", keywords: ["optimiz", "complexity", "tradeoff", "test", "edge", "verify", "bottleneck"] },
        ],
      },
      {
        text: "Explain how a hash table works and what happens on a collision.",
        difficulty: "intern",
        type: "Algorithms",
        criteria: [
          { label: "Explains hashing and buckets", keywords: ["hash", "bucket", "array", "key", "function", "index", "mod"] },
          { label: "Explains collision handling", keywords: ["collision", "chaining", "probing", "open addressing", "linked list", "resize", "rehash"] },
          { label: "Mentions load factor / resizing", keywords: ["load factor", "resize", "rehash", "grow", "amortized", "threshold"] },
        ],
      },
      {
        text: "When would you use a heap instead of a sorted array, and why?",
        difficulty: "mid",
        type: "Algorithms",
        criteria: [
          { label: "Names a heap use case", keywords: ["top k", "priority", "queue", "median", "streaming", "schedule", "smallest", "largest"] },
          { label: "Compares insertion and access costs", keywords: ["insert", "log", "o(log n)", "o(n)", "extract", "peek", "sort", "cost"] },
          { label: "States the tradeoff", keywords: ["tradeoff", "random access", "search", "sorted", "order", "heapify", "memory"] },
        ],
      },
      {
        text: "Describe breadth-first search vs depth-first search. When does each win?",
        difficulty: "mid",
        type: "Algorithms",
        criteria: [
          { label: "Describes both traversals", keywords: ["queue", "stack", "level", "depth", "bfs", "dfs", "breadth", "depth-first"] },
          { label: "Names when BFS wins", keywords: ["shortest", "nearest", "level", "unweighted", "bfs"] },
          { label: "Names when DFS wins", keywords: ["deep", "path", "backtrack", "memory", "cycle", "topological", "dfs"] },
        ],
      },
      {
        text: "How do you test an algorithm before you trust it?",
        difficulty: "mid",
        type: "Algorithms",
        criteria: [
          { label: "Tests edge cases deliberately", keywords: ["edge", "empty", "single", "duplicate", "large", "null", "zero", "overflow"] },
          { label: "Checks invariants or brute-force agreement", keywords: ["brute", "invariant", "property", "random", "fuzz", "compare", "naive"] },
          { label: "Reasons about complexity and limits", keywords: ["complexity", "o(n)", "time", "space", "limit", "worst", "scale"] },
        ],
      },
      {
        text: "Given an array of numbers, how would you find the longest increasing subsequence? Talk through it, code optional.",
        difficulty: "senior",
        type: "Algorithms",
        criteria: [
          { label: "Describes the DP formulation", keywords: ["dp", "dynamic", "subproblem", "state", "recurrence", "table", "length"] },
          { label: "Mentions the O(n log n) approach", keywords: ["binary search", "patience", "tails", "o(n log n)", "log n", "greedy"] },
          { label: "Reasons about correctness or complexity", keywords: ["correct", "complexity", "o(n", "proof", "optimal", "tradeoff", "space"] },
        ],
      },
      {
        text: "Explain dynamic programming in your own words and give a problem where it helps.",
        difficulty: "mid",
        type: "Algorithms",
        criteria: [
          { label: "Defines DP (overlapping subproblems, optimal substructure)", keywords: ["overlap", "subproblem", "optimal substructure", "memo", "recurrence", "reuse"] },
          { label: "Gives a real example problem", keywords: ["fibonacci", "knapsack", "coin", "edit distance", "lis", "grid", "path", "example"] },
          { label: "Contrasts with naive recursion", keywords: ["recursion", "exponential", "naive", "cache", "memoiz", "faster", "repeat"] },
        ],
      },
    ],
  },
  product: {
    label: "Product Manager",
    blurb: "Product sense: prioritization, metrics, stakeholders, and tradeoffs.",
    questions: [
      {
        text: "How do you decide what to build next when everything feels urgent?",
        difficulty: "mid",
        type: "Product sense",
        criteria: [
          { label: "Uses a prioritization framework", keywords: ["rice", "impact", "effort", "reach", "confidence", "framework", "score", "value"] },
          { label: "Grounds the choice in users or strategy", keywords: ["user", "strategy", "goal", "metric", "research", "feedback", "mission"] },
          { label: "Says what gets cut and why", keywords: ["cut", "deprioritiz", "say no", "later", "tradeoff", "not now", "drop"] },
        ],
      },
      {
        text: "Tell me about a product you love and why. What would you change about it?",
        difficulty: "intern",
        type: "Product sense",
        criteria: [
          { label: "Names what makes it great", keywords: ["love", "because", "simple", "fast", "delight", "design", "habit", "solves"] },
          { label: "Critiques it specifically", keywords: ["change", "improve", "annoy", "missing", "confusing", "friction", "wish"] },
          { label: "Connects the critique to users", keywords: ["user", "retention", "churn", "onboard", "metric", "pain", "segment"] },
        ],
      },
      {
        text: "How do you measure success for a new feature after launch?",
        difficulty: "mid",
        type: "Product sense",
        criteria: [
          { label: "Names concrete metrics", keywords: ["adoption", "activation", "retention", "conversion", "engagement", "nps", "metric"] },
          { label: "Sets a baseline and a target", keywords: ["baseline", "target", "before", "after", "hypothesis", "goal", "benchmark"] },
          { label: "Plans how to learn from the data", keywords: ["cohort", "segment", "experiment", "survey", "interview", "funnel", "learn"] },
        ],
      },
      {
        text: "Describe a tradeoff you made between shipping speed and quality.",
        difficulty: "mid",
        type: "Product sense",
        criteria: [
          { label: "Names the tradeoff explicitly", keywords: ["tradeoff", "speed", "quality", "deadline", "cut", "scope", "debt", "risk"] },
          { label: "Explains the decision logic", keywords: ["because", "user", "risk", "reversible", "mvp", "learn", "impact"] },
          { label: "States the outcome and what followed", keywords: ["shipped", "result", "fixed", "later", "paid off", "regret", "lesson"] },
        ],
      },
      {
        text: "How do you handle a stakeholder who strongly disagrees with your roadmap?",
        difficulty: "senior",
        type: "Product sense",
        criteria: [
          { label: "Seeks the underlying concern", keywords: ["understand", "listen", "concern", "why", "their goal", "perspective", "empathy"] },
          { label: "Brings evidence, not just opinion", keywords: ["data", "research", "user", "metric", "experiment", "evidence", "test"] },
          { label: "Reaches alignment or a clear decision", keywords: ["align", "agreed", "compromise", "decided", "escalat", "document", "commit"] },
        ],
      },
      {
        text: "What metrics matter most for a consumer app, and which can mislead you?",
        difficulty: "mid",
        type: "Product sense",
        criteria: [
          { label: "Names the metrics that matter", keywords: ["retention", "activation", "dau", "mau", "ltv", "churn", "engagement", "conversion"] },
          { label: "Explains why vanity metrics mislead", keywords: ["vanity", "mislead", "downloads", "signups", "pageview", "correlat", "goodhart"] },
          { label: "Ties metrics to real value", keywords: ["value", "habit", "core", "north star", "outcome", "user", "revenue"] },
        ],
      },
      {
        text: "How do you prioritize a backlog when engineering capacity is limited?",
        difficulty: "senior",
        type: "Product sense",
        criteria: [
          { label: "Uses an explicit ordering principle", keywords: ["impact", "effort", "rice", "value", "cost", "framework", "rank", "score"] },
          { label: "Balances short-term wins and long-term bets", keywords: ["quick win", "long-term", "debt", "platform", "balance", "bet", "invest"] },
          { label: "Communicates the tradeoff to the team", keywords: ["communicat", "stakeholder", "transparen", "explain", "roadmap", "say no"] },
        ],
      },
      {
        text: "Tell me about a time you killed a feature. How did you decide and communicate it?",
        difficulty: "senior",
        type: "Product sense",
        criteria: [
          { label: "Shows the evidence behind the kill", keywords: ["data", "usage", "metric", "low", "nobody", "cost", "maintain", "research"] },
          { label: "Describes the decision process", keywords: ["decided", "discussed", "criteria", "threshold", "sunset", "deprecat", "plan"] },
          { label: "Handles communication and migration", keywords: ["communicat", "user", "migrat", "announce", "support", "feedback", "transition"] },
        ],
      },
      {
        text: "How do you validate an idea before investing engineering time in it?",
        difficulty: "mid",
        type: "Product sense",
        criteria: [
          { label: "Uses a cheap validation method", keywords: ["interview", "survey", "prototype", "landing", "fake door", "concierge", "test", "pilot"] },
          { label: "Defines what success looks like first", keywords: ["hypothesis", "success", "signal", "threshold", "metric", "learn", "criteria"] },
          { label: "Iterates or kills based on evidence", keywords: ["iterate", "pivot", "kill", "evidence", "result", "learned", "next"] },
        ],
      },
      {
        text: "Describe how you would launch a product in a market you do not know well.",
        difficulty: "intern",
        type: "Product sense",
        criteria: [
          { label: "Researches the market first", keywords: ["research", "interview", "local", "competitor", "culture", "user", "learn", "talk"] },
          { label: "Starts small and learns", keywords: ["pilot", "beta", "small", "iterate", "partner", "test", "mvp", "phase"] },
          { label: "Adapts to what is different there", keywords: ["adapt", "localiz", "language", "payment", "regulation", "different", "custom"] },
        ],
      },
    ],
  },
};

export const TRACK_IDS = Object.keys(TRACKS);

// Difficulty ordering used to fill a question set when the exact level is short.
export const DIFFICULTY_ORDER = ["intern", "mid", "senior"];
