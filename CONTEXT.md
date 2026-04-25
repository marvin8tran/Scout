# API Scout — AI Context File
> Feed this file to Windsurf/Claude at the start of every session.
> Last updated: LAHacks 2025

---

## 🧭 What We're Building

**API Scout** is a public web tool that helps developers (and AI coding agents) discover, compare, and integrate the best third-party public APIs for their use case.

Users provide two things:
1. **Source context** — either a **GitHub repo URL** (we fetch key files) or a **code snippet** (pasted directly)
2. **A chat message** — a natural language description of what API they need, optionally mentioning their priority preference (Scalability, Cheapest Price, or Maintenance)

We return the **top 3 API recommendations** scored on four dimensions:
- ✅ **Compatibility** — works with their detected stack/language
- 💰 **Price** — cheapest viable option at their expected scale
- 📈 **Scalability** — rate limits, enterprise tiers, architecture fit
- 🔧 **Maintenance** — last commit recency, GitHub stars, deprecation signals

Each result includes:
- Score breakdown (compatibility / price / scale / maintenance)
- 2–3 sentence winner reasoning
- Main tradeoff / caveat
- A ready-to-paste code snippet in their detected language

---

## 🛠️ Tech Stack — DO NOT DEVIATE

| Layer | Choice |
|---|---|
| Framework | **Next.js 14+ (App Router)** |
| Language | **TypeScript (strict mode)** |
| Styling | **Tailwind CSS** |
| AI | **Google Gemini API** (`gemini-2.0-flash`) via `@google/generative-ai` |
| Search | **Exa API** for semantic API discovery |
| GitHub fetching | **GitHub raw content API** (no auth, public repos only) |
| Deployment | **Vercel** |
| Package manager | **npm** |

**Do not suggest:** Python backends, Express, Prisma, GraphQL, Redis, Docker, or any database. This is a stateless web app. No auth, no persistence in v1.

---

## 📁 Folder Structure

```
api-scout/
├── app/
│   ├── page.tsx                  # Main UI — input form + results
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── analyze/
│       │   └── route.ts          # POST /api/analyze — Gemini intent extraction
│       ├── search/
│       │   └── route.ts          # POST /api/search — Exa API discovery
│       ├── score/
│       │   └── route.ts          # POST /api/score — Gemini scoring + snippet gen
│       ├── fetch-repo/
│       │   └── route.ts          # POST /api/fetch-repo — GitHub URL → key files
│       └── devin/
│           ├── trigger/
│           │   └── route.ts      # POST /api/devin/trigger — Trigger Devin session
│           └── status/
│               └── route.ts      # POST /api/devin/status — Poll Devin session status
├── components/
│   ├── InputPanel.tsx            # Chat-style input: source selection + chat message + priority pills
│   ├── ResultCard.tsx            # Single API result card
│   ├── ResultsList.tsx           # Top 3 results layout
│   └── DevinStatus.tsx           # Devin integration progress & PR result
├── lib/
│   ├── gemini.ts                 # Gemini client singleton
│   ├── exa.ts                    # Exa client singleton
│   ├── devin.ts                  # Devin API client singleton
│   ├── github.ts                 # GitHub fetch helpers
│   └── prompts.ts                # ALL system prompts live here
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── .env.local                    # API keys (never commit)
└── CLAUDE.md                     # This file
```

---

## 🔑 Environment Variables

Never share actual key values here. Keys are stored in `.env.local` (gitignored).

Required variables:
- `GEMINI_API_KEY` — from aistudio.google.com/apikey
- `EXA_API_KEY` — from exa.ai/api
- `DEVIN_API_KEY` — from Devin API (service user credential)
- `DEVIN_ORG_ID` — your Devin organization ID

When adding a new env variable:
1. Add it to `.env.local` manually (never ask AI to do this)
2. Add the variable NAME (not value) to `.env.local.example`
3. Access in code via `process.env.VARIABLE_NAME`

If an API call fails, check the key exists before debugging logic.

## 🧩 TypeScript Interfaces (source of truth)

```typescript
// types/index.ts

export type InputMode = "github" | "snippet";
export type PriorityMode = "scalability" | "cheapest" | "maintenance";

export interface AnalyzeRequest {
  input: string;          // code snippet or GitHub URL content
  chatMessage: string;    // user's chat message describing desired API + priority
  mode: InputMode;
  priority: PriorityMode;
}

export interface ExtractedIntent {
  task: string;
  category: string;
  language: string;
  framework: string | null;
  requirements: {
    needs_webhooks: boolean;
    needs_auth: boolean;
    needs_realtime: boolean;
    expected_scale: "low" | "medium" | "high";
    pricing_sensitive: boolean;
  };
  search_queries: string[];
}

export interface APICandidate {
  name: string;
  url: string;
  docs_url: string;
  description: string;
  raw_excerpt: string;    // doc text Exa returned
  pricing_excerpt: string; // text from pricing/docs page (second-pass Exa query)
}

export interface PricingDetails {
  free_tier: string | null;         // e.g. "1,000 requests/month free"
  paid_starting_price: string | null; // e.g. "$0.01 per request" or "$25/month"
  rate_limit: string | null;        // e.g. "100 requests/second"
  monthly_capacity: string | null;  // e.g. "1M requests/month on Pro plan"
  last_updated: string | null;      // e.g. "2025-03-15" or "March 2025"
  data_source: string | null;       // URL where the data was found
}

export interface ScoredAPI {
  name: string;
  url: string;
  docs_url: string;
  scores: {
    compatibility: number;  // 1-10
    price: number;          // 1-10
    scalability: number;    // 1-10
    maintenance: number;    // 1-10
  };
  final_score: number;
  winner_reason: string;
  tradeoff: string;
  snippet: string;          // ready-to-paste code in user's language
  pricing_details: PricingDetails; // extracted empirical pricing numbers
}

export interface ScoutResult {
  intent: ExtractedIntent;
  recommendations: ScoredAPI[];  // always top 3, sorted by final_score
}

export interface DevinTriggerRequest {
  repoUrl: string;              // user's public GitHub repo URL
  selectedAPI: ScoredAPI;       // the API they chose to implement
  intent: ExtractedIntent;      // the extracted intent from the analyze step
}

export interface DevinSessionStatus {
  sessionId: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  prUrl?: string;               // populated when Devin creates the PR from fork
}
```

---

## 🤖 The Three API Routes

### POST `/api/analyze`
**Input:** `{ input: string, chatMessage: string, mode: InputMode, priority: PriorityMode }`
**Output:** `ExtractedIntent`
**What it does:** Sends the user's code context and chat message to Gemini with the intent extraction system prompt. Returns structured JSON describing what they need.

### POST `/api/search`
**Input:** `ExtractedIntent`
**Output:** `APICandidate[]`
**What it does:** Takes the `search_queries` array from the intent, fires them at Exa, deduplicates results, returns 5–8 candidates with doc excerpts.

### POST `/api/score`
**Input:** `{ candidates: APICandidate[], intent: ExtractedIntent, priority: PriorityMode }`
**Output:** `ScoredAPI[]` (top 3)
**What it does:** Sends candidates + intent to Gemini with the scoring system prompt. Gemini scores each on 4 dimensions and generates a code snippet. Returns top 3.

### POST `/api/fetch-repo` *(GitHub mode only)*
**Input:** `{ url: string }`
**Output:** `{ files: Record<string, string> }` — map of filename → content
**What it does:** Parses the GitHub URL, fetches via raw.githubusercontent.com:
- `README.md`
- `package.json` OR `requirements.txt` OR `go.mod` OR `Cargo.toml`
- `index.ts` / `main.py` / `app.ts` / `server.js` (whichever exists)

Max 3 files. Never fetch the whole repo.

### POST `/api/devin/trigger`
**Input:** `{ repoUrl: string, selectedAPI: ScoredAPI, intent: ExtractedIntent }`
**Output:** `{ sessionId: string }`
**What it does:** Triggers a Devin session that forks the user's public repo, generates full integration code for the selected API, and opens a PR from the fork to the user's repo.

### POST `/api/devin/status`
**Input:** `{ sessionId: string }`
**Output:** `DevinSessionStatus`
**What it does:** Polls the Devin API for session progress. Returns status and PR URL when complete.

---

## 📝 System Prompts (all live in `lib/prompts.ts`)

### INTENT_EXTRACTION_PROMPT
```
You are an API requirements analyst. A developer wants to find the best third-party API for their use case.

Analyze the input and return ONLY a valid JSON object matching this exact shape — no markdown, no explanation:
{
  "task": "one sentence describing what they are trying to do",
  "category": "payments | email | maps | auth | storage | AI | SMS | search | other",
  "language": "detected programming language",
  "framework": "detected framework or null",
  "requirements": {
    "needs_webhooks": boolean,
    "needs_auth": boolean,
    "needs_realtime": boolean,
    "expected_scale": "low | medium | high",
    "pricing_sensitive": boolean
  },
  "search_queries": ["3 to 5 specific Exa search queries to find candidate APIs"]
}
```

### SCORING_PROMPT
```
You are an API evaluator. Score the following candidate APIs for this use case.

Task: {task}
Language: {language}
Framework: {framework}
Priority: {priority}

Candidates with doc excerpts:
{candidates}

Score each API 1–10 on:
- compatibility: works with their stack, has SDK for their language
- price: free tier generosity, cost at scale, transparent pricing
- scalability: rate limits, uptime SLA, enterprise tier availability
- maintenance: last updated, community activity, deprecation risk

Priority "{priority}" means weight {priority === "scalability" ? "scalability (40%) and compatibility (30%)" : priority === "cheapest" ? "price (50%) and compatibility (25%)" : "maintenance (40%) and compatibility (30%)"} most heavily.

Return ONLY a valid JSON array of the top 3, sorted by final_score descending:
[{
  "name": string,
  "url": string,
  "docs_url": string,
  "scores": { "compatibility": n, "price": n, "scalability": n, "maintenance": n },
  "final_score": number,
  "winner_reason": "2-3 sentences on why this wins for this exact use case",
  "tradeoff": "1 sentence on the main downside or caveat",
  "snippet": "working {language} code showing first API call for this specific task"
}]
```

---

## ⚙️ Coding Standards

### Before writing any logic, always:
1. Define or reference the TypeScript interface it uses
2. Add the route to this file if it's new
3. Put prompts in `lib/prompts.ts`, not inline in routes

### Error handling
- Every API route wraps logic in try/catch
- On error, return `NextResponse.json({ error: message }, { status: 500 })`
- Log the raw error to console before returning
- Never silently swallow errors

### Gemini API calls
- Always use `gemini-2.0-flash` — do not change this model
- Pass system prompts via `systemInstruction` in `getGeminiModel()`
- Parse response with: `result.response.text()`
- Strip markdown fences before JSON.parse: `.replace(/```json|```/g, "").trim()`

### Exa API calls
- Use `client.searchAndContents()` not `client.search()`
- Use `{ text: { maxCharacters: 2000 } }` for both initial and pricing-specific queries
- After the initial search pass, run a second targeted pass per candidate for pricing/rate-limit data
- Deduplicate results by domain before returning

### GitHub fetching
- Parse owner/repo from URL using URL constructor, not regex
- Always use `https://raw.githubusercontent.com/{owner}/{repo}/main/{file}`
- If `main` 404s, retry with `master`
- Timeout after 5 seconds per file

---

## 🚦 Vibe Check Protocol

When Windsurf or Claude suggests something architectural (new route, new library, new data shape), pause and check:

1. **Is this library in our stack?** If not, find a way without it
2. **Does this add a new env variable?** Add it to `.env.local.example`
3. **Does this change a TypeScript interface?** Update `types/index.ts` first
4. **Is this prompt logic?** It goes in `lib/prompts.ts`, not inline

When in doubt, ask: *"Does this make the demo cleaner or more complex?"* If more complex, skip it.

---

## 🎯 Demo Flow (what judges will see)

1. User lands on page — picks **Code Snippet** or **GitHub Link**
2. They provide their code/link in the source input
3. They type a chat message describing the API they need, e.g. "I need a cheap payment API"
4. Priority auto-detects from keywords (or they click a pill to select)
5. They hit the send button (or press Enter)
6. Loading state shows pipeline steps: Analyzing → Searching → Scoring
7. Top 3 cards appear with scores, reasoning, and a copy-able code snippet
8. User clicks "Implement with Devin" on their preferred API *(GitHub mode only)*
9. Devin forks the repo, generates integration code, and opens a PR
10. User sees the PR link and can review/merge on GitHub

---

## ❌ Out of Scope for v1 (do not build)

- User accounts / auth
- Saving results / history
- Private GitHub repos
- Paid API tier checks (use public pricing pages only)
- More than 3 recommendations
- Any database
- Any backend other than Next.js API routes