export const INTENT_EXTRACTION_PROMPT = `You are an API requirements analyst. A developer wants to find the best third-party API for their use case.

The developer will provide two things:
1. Code context — either a code snippet or repository content showing their technical stack
2. A chat message — a natural language description of what API they are looking for and their priority preference (scalability, cheapest price, or maintenance)

Pay special attention to the user's stated priority preference when setting expected_scale and pricing_sensitive:
- If priority is "scalability", set expected_scale to "high"
- If priority is "cheapest", set pricing_sensitive to true
- If priority is "maintenance", focus search_queries on well-maintained and actively updated APIs

Analyze both inputs and return ONLY a valid JSON object matching this exact shape — no markdown, no explanation:
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

At least 1 of the search_queries MUST target pricing pages or rate limit documentation, e.g. "{API category} API pricing free tier cost" or "{API category} API rate limits requests per second".`;

export function buildDevinSessionPrompt(params: {
  repoUrl: string;
  apiName: string;
  apiDocsUrl: string;
  apiSnippet: string;
  apiWinnerReason: string;
  language: string;
  framework: string | null;
  task: string;
}): string {
  return `You are integrating the ${params.apiName} API into a ${params.language}${params.framework ? ` / ${params.framework}` : ''} project.

Repository: ${params.repoUrl}

Steps:
1. Fork this repository
2. Clone your fork
3. Analyze the project structure to understand where integration code should go
4. Install the ${params.apiName} SDK/package using the project's package manager
5. Create the integration:
   - A service/client module for ${params.apiName}
   - Type definitions if using TypeScript
   - Example usage showing: ${params.task}
   - Error handling and environment variable setup
6. Reference snippet for the first API call:
\`\`\`
${params.apiSnippet}
\`\`\`
7. API documentation: ${params.apiDocsUrl}
8. Commit to branch: scout/integrate-${params.apiName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
9. Push and open a PR from your fork to the original repo
10. PR title: "Scout: Integrate ${params.apiName} for ${params.task}"
11. PR description should explain what was added, why ${params.apiName} was chosen (${params.apiWinnerReason}), and any setup instructions (env vars, install commands)

Do NOT merge the PR. Just create it and return the PR URL.`;
}

export function buildScoringPrompt(params: {
  task: string;
  language: string;
  framework: string | null;
  priority: string;
  candidates: string;
}): string {
  const weightDescription =
    params.priority === "scalability"
      ? "scalability (40%) and compatibility (30%)"
      : params.priority === "cheapest"
        ? "price (50%) and compatibility (25%)"
        : "maintenance (40%) and compatibility (30%)";

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

For EACH candidate, you MUST extract specific empirical numbers from the provided excerpts. If a number is not found in the excerpt, search your training data for the most recent known value and note it may be approximate.

In addition to scores, return a "pricing_details" object for each API:
{
  "free_tier": "exact free tier description with numbers, e.g. '10,000 emails/month free' or null if none",
  "paid_starting_price": "lowest paid tier price, e.g. '$0.0035 per email' or '$19.95/month' or null",
  "rate_limit": "requests per second/minute/hour, e.g. '100 req/sec' or null",
  "monthly_capacity": "max requests or units on common plans, e.g. '50K emails/month on Essentials' or null",
  "last_updated": "most recent known update date for the API/SDK, e.g. '2025-03-15' or 'March 2025' or null",
  "data_source": "URL where you found the most specific pricing data"
}

IMPORTANT: Do NOT return vague descriptions like "generous free tier" or "affordable". Return SPECIFIC NUMBERS or null. The user needs empirical data to make a decision.

Return ONLY a valid JSON array of the top 3, sorted by final_score descending:
[{
  "name": string,
  "url": string,
  "docs_url": string,
  "scores": { "compatibility": n, "price": n, "scalability": n, "maintenance": n },
  "final_score": number,
  "winner_reason": "2-3 sentences on why this wins for this exact use case",
  "tradeoff": "1 sentence on the main downside or caveat",
  "snippet": "working ${params.language} code showing first API call for this specific task",
  "pricing_details": { "free_tier": string|null, "paid_starting_price": string|null, "rate_limit": string|null, "monthly_capacity": string|null, "last_updated": string|null, "data_source": string|null }
}]`;
}
