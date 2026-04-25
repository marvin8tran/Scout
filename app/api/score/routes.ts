import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// 1. Keep your prompt function at the top or import it
export const SCORING_PROMPT = (
  task: string,
  language: string,
  candidates: string
) => `You are an API evaluator. A developer needs the best third-party API for their use case.



Task: ${task}

Language: ${language}



Here are candidate APIs with documentation excerpts:

${candidates}



Score each API on three dimensions (1–10):

- price: free tier limits, cost at scale, pay-as-you-go availability, no surprise fees

- scalability: rate limits, uptime SLA, global infrastructure, no hard ceilings

- maintenance: recent commit activity, active support, deprecation risk, community health



Return ONLY a valid JSON array of exactly 3 items sorted by final_score descending.

No markdown, no explanation, nothing outside the JSON.



[{

  "name": string,

  "url": string,

  "docs_url": string,

  "scores": { "price": n, "scalability": n, "maintenance": n },

  "final_score": number,

  "winner_reason": "2-3 sentences specific to this task and language",

  "tradeoff": "1 sentence on the biggest caveat",

  "snippet": "working ${language} code for this exact task, ready to paste"

}]`;

export async function POST(req: NextRequest) {
  // 2. Destructure the variables your new prompt needs
  // Make sure your frontend is sending 'task' and 'candidates' now!
  const { task, language, candidates, mode } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048, // Increased slightly to handle the snippets safely
    // 3. CALL the function here and pass the arguments
    system: SCORING_PROMPT(task, language, candidates),
    messages: [
      {
        role: "user",
        // Keeping this simple since the bulk of the logic is in the system prompt
        content: `Please evaluate the candidates for the task: ${task}. Priority Mode: ${mode}`,
      },
    ],
  });

  // 4. Extract and Parse
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  
  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 });
  }
}