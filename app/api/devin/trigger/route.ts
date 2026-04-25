import { NextResponse } from "next/server";
import { triggerDevinSession } from "@/lib/devin";
import type { DevinTriggerRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DevinTriggerRequest;

    if (!body.repoUrl || !body.selectedAPI || !body.intent) {
      return NextResponse.json(
        { error: "Missing required fields: repoUrl, selectedAPI, intent" },
        { status: 400 }
      );
    }

    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
    if (!githubUrlPattern.test(body.repoUrl)) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    const { sessionId } = await triggerDevinSession(body);
    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("devin trigger error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to trigger Devin session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
