export const INTENT_EXTRACTION_PROMPT = `You are an API requirements analyst. A developer wants to find the best third-party API for their use case.

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
}`;

export function buildScoringPrompt(params: {
  task: string;
  language: string;
  framework: string | null;
  priority: string;
  candidates: string;
}): string {
  const weightDescription =
    params.priority === "docs"
      ? "compatibility (40%) and price (30%)"
      : "scalability (40%) and price (30%)";

  return `You are an API evaluator. Score the following candidate APIs for this use case.

Task: ${params.task}
Language: ${params.language}
Framework: ${params.framework}
Priority: ${params.priority}

Candidates with doc excerpts:
${params.candidates}

Score each API 1–10 on:
- compatibility: works with their stack, has SDK for their language
- price: free tier generosity, cost at scale, transparent pricing
- scalability: rate limits, uptime SLA, enterprise tier availability
- maintenance: last updated, community activity, deprecation risk

Priority "${params.priority}" means weight ${weightDescription} most heavily.

Return ONLY a valid JSON array of the top 3, sorted by final_score descending:
[{
  "name": string,
  "url": string,
  "docs_url": string,
  "scores": { "compatibility": n, "price": n, "scalability": n, "maintenance": n },
  "final_score": number,
  "winner_reason": "2-3 sentences on why this wins for this exact use case",
  "tradeoff": "1 sentence on the main downside or caveat",
  "snippet": "working ${params.language} code showing first API call for this specific task"
}]`;
}
