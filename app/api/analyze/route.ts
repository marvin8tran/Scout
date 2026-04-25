import { NextResponse } from "next/server";
import { getAnthropic } from "@/lib/anthropic";
import { INTENT_EXTRACTION_PROMPT } from "@/lib/prompts";
import type { InputMode, PriorityMode } from "@/types";

export async function POST(request: Request) {
  try {
    const { input, mode, priority } = (await request.json()) as {
      input: string;
      mode: InputMode;
      priority: PriorityMode;
    };

    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: INTENT_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Mode: ${mode}\nPriority: ${priority}\n\nInput:\n${input}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze input";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
