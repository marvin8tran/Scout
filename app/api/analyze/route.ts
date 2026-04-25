import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { INTENT_EXTRACTION_PROMPT } from "@/lib/prompts";
import type { InputMode, PriorityMode } from "@/types";

export async function POST(request: Request) {
  try {
    const { input, chatMessage, mode, priority } = (await request.json()) as {
      input: string;
      chatMessage: string;
      mode: InputMode;
      priority: PriorityMode;
    };

    const model = getGeminiModel(INTENT_EXTRACTION_PROMPT);

    const result = await model.generateContent(
      `Mode: ${mode}\nPriority: ${priority}\n\nUser's code/repo context:\n${input}\n\nUser's API request:\n${chatMessage}`
    );

    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze input";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
