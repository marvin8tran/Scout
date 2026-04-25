import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { code, mode } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `You are analyzing a GitHub repository to understand its tech stack and purpose.

You have been given the contents of: README.md, package.json (or requirements.txt), and up to 2 entry point files.

Return ONLY a JSON object:
{
  "purpose": "one sentence",
  "language": "primary language",
  "framework": "primary framework or null",
  "relevant_files": ["list of files that would be most relevant to an API integration"],
  "suggested_snippet_location": "where in the codebase would you add a new API integration — e.g. src/services/"
}`,
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