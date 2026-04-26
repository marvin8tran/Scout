import { NextResponse } from "next/server";
import { triggerDevinSession } from "@/lib/devin";
import { isValidGitHubUrl } from "@/lib/github";
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

    const urlCheck = isValidGitHubUrl(body.repoUrl);
    if (!urlCheck.valid) {
      return NextResponse.json(
        { error: urlCheck.error ?? "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    const { sessionId } = await triggerDevinSession(body);
    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("devin trigger error:", error);
    const raw =
      error instanceof Error ? error.message : "Failed to trigger Devin session";
    const message = raw.includes("Failed to fork")
      ? "Failed to fork repository — please check the GitHub URL is valid and public"
      : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
