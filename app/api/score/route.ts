import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { buildScoringPrompt } from "@/lib/prompts";
import type { APICandidate, ExtractedIntent, PriorityMode, ScoredAPI } from "@/types";

export async function POST(request: Request) {
  try {
    const { candidates, intent, priority } = (await request.json()) as {
      candidates: APICandidate[];
      intent: ExtractedIntent;
      priority: PriorityMode;
    };

    const candidatesText = candidates
      .map(
        (c, i) =>
          `${i + 1}. ${c.name}\n   URL: ${c.url}\n   Description: ${c.description}\n   Excerpt: ${c.raw_excerpt}`
      )
      .join("\n\n");

    const scoringPrompt = buildScoringPrompt({
      task: intent.task,
      language: intent.language,
      framework: intent.framework,
      priority,
      candidates: candidatesText,
    });

    const model = getGeminiModel(scoringPrompt);

    const result = await model.generateContent(
      "Score the candidates above and return the top 3 as a JSON array."
    );

    const text = result.response.text();
    const parsed: ScoredAPI[] = JSON.parse(
      text.replace(/```json|```/g, "").trim()
    );

    const sorted = parsed
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 3);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("score error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to score APIs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
