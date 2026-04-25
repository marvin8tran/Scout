import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { code, mode } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `You are an API requirements analyst. A developer has pasted code and wants to find the best third-party API to accomplish their goal.

Analyze the code and return ONLY a JSON object with this shape:
{
  "task": "one sentence describing what they're trying to do",
  "category": "e.g. payments, email, maps, auth, storage, AI, SMS, etc.",
  "language": "detected programming language",
  "framework": "detected framework if any, else null",
  "requirements": {
    "needs_webhooks": boolean,
    "needs_auth": boolean,
    "needs_realtime": boolean,
    "expected_scale": "low | medium | high",
    "pricing_sensitive": boolean
  },
  "search_queries": [
    "3 to 5 Exa search queries to find candidate APIs, be specific"
  ]
}

Return only valid JSON. No explanation, no markdown fences.`,
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