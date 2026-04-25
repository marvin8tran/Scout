import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { code, mode } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `You are an API evaluator helping a developer choose the best third-party API for their use case.

Task: {task}
Language: {language}
Framework: {framework}
Priority mode: {mode}  ← either "docs" or "scale"

You have been given documentation excerpts and metadata for the following candidate APIs:
{candidates}

Score each API from 1-10 on these dimensions:
- docs: clarity, completeness, SDK quality, example coverage
- scale: rate limits, pricing at 10k/100k/1M requests, free tier, SLA
- dx: time to first working call, auth complexity, community size
- fit: how well it matches the specific task requirements

Weight your FINAL score heavily toward {mode === "docs" ? "docs and dx" : "scale and pricing"}.

Return ONLY a JSON array:
[
  {
    "name": "API name",
    "url": "homepage",
    "docs_url": "docs url",
    "scores": { "docs": 8, "scale": 6, "dx": 9, "fit": 8 },
    "final_score": 8.2,
    "winner_reason": "2-3 sentences on why this wins for this use case",
    "tradeoff": "1 sentence on the main downside",
    "snippet": "working code example in {language} showing how to make the first API call for this specific task"
  }
]

Sort by final_score descending. Return only valid JSON.`,
    messages: [
      {
        role: "user",
        content: `Mode: ${mode}\n\nCode:\n${code}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text);

  return NextResponse.json(parsed);
}