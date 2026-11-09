// Question banks for GodsGift interview tracks.
// Used by demo mode (no API key) and as fallback / seed questions in live mode.
// Each track has a label, a short description, and a list of questions.

export const TRACKS = {
  swe: {
    label: "Software Engineer",
    blurb: "General software engineering: debugging, design, teamwork, and craft.",
    questions: [
      "Tell me about the most challenging bug you have debugged. How did you find it and fix it?",
      "How do you approach code reviews, both when you are the reviewer and the author?",
      "Explain closures in JavaScript to a junior engineer. When would you use one?",
      "Describe a time you had to learn a new technology quickly to ship something. How did you do it?",
      "How do you decide between a SQL and a NoSQL database for a new service?",
      "Tell me about a project you led end to end. What was the hardest tradeoff you made?",
      "How do you handle technical debt on a team that is always shipping?",
      "What is your approach to testing? How do you decide what is worth a test?",
      "Describe a time you disagreed with a technical decision. What did you do?",
      "Walk me through how you would design a simple rate limiter for an API.",
    ],
  },
  behavioral: {
    label: "Behavioral",
    blurb: "Classic behavioral questions: teamwork, conflict, failure, and growth.",
    questions: [
      "Tell me about a time you disagreed with a teammate. How did you handle it?",
      "Describe a failure at work or school and what you learned from it.",
      "Tell me about a time you had to meet a tight deadline with incomplete information.",
      "Describe a conflict you had with a manager or a peer. How was it resolved?",
      "Tell me about a time you went above and beyond what was asked of you.",
      "Describe a time you received difficult feedback. What did you do with it?",
      "Tell me about a time you mentored someone or helped a teammate grow.",
      "How do you handle ambiguity when a task has no clear requirements?",
      "Describe a time you had to say no to a request. How did you communicate it?",
      "Tell me about a time you improved a process or a workflow for your team.",
    ],
  },
  system: {
    label: "System Design",
    blurb: "Large-scale design: architecture, scaling, and tradeoffs.",
    questions: [
      "Design a URL shortener. Walk me through your architecture and the tradeoffs.",
      "Design a real-time chat system for millions of users. What breaks first as you scale?",
      "How would you design a rate limiter? Compare a few approaches.",
      "Design a news feed for a social app. How do you rank and deliver posts?",
      "Design a ride-sharing dispatch system. How do you match riders and drivers?",
      "How do you scale a relational database when reads start to dominate?",
      "Design a notification system that supports email, push, and SMS.",
      "What are the tradeoffs of caching, and where would you put caches in a web app?",
      "Design a file storage service like a simple version of S3.",
      "How would you design a search autocomplete that stays fast at scale?",
    ],
  },
  algo: {
    label: "Algorithms",
    blurb: "Data structures and algorithms: reasoning, complexity, and problem solving.",
    questions: [
      "Explain Big O notation and give an example where it changed your approach.",
      "How would you detect a cycle in a linked list? Compare the approaches.",
      "How would you solve two-sum? What if the array is sorted?",
      "Walk me through how you approach a coding problem you have never seen before.",
      "Explain how a hash table works and what happens on a collision.",
      "When would you use a heap instead of a sorted array, and why?",
      "Describe breadth-first search vs depth-first search. When does each win?",
      "How do you test an algorithm before you trust it?",
      "Given an array of numbers, how would you find the longest increasing subsequence? Talk through it, code optional.",
      "Explain dynamic programming in your own words and give a problem where it helps.",
    ],
  },
  product: {
    label: "Product Manager",
    blurb: "Product sense: prioritization, metrics, stakeholders, and tradeoffs.",
    questions: [
      "How do you decide what to build next when everything feels urgent?",
      "Tell me about a product you love and why. What would you change about it?",
      "How do you measure success for a new feature after launch?",
      "Describe a tradeoff you made between shipping speed and quality.",
      "How do you handle a stakeholder who strongly disagrees with your roadmap?",
      "What metrics matter most for a consumer app, and which can mislead you?",
      "How do you prioritize a backlog when engineering capacity is limited?",
      "Tell me about a time you killed a feature. How did you decide and communicate it?",
      "How do you validate an idea before investing engineering time in it?",
      "Describe how you would launch a product in a market you do not know well.",
    ],
  },
};

export const TRACK_IDS = Object.keys(TRACKS);
