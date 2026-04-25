import { NextResponse } from "next/server";
import { getSessionStatus } from "@/lib/devin";

export async function POST(request: Request) {
  try {
    const { sessionId } = (await request.json()) as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing required field: sessionId" },
        { status: 400 }
      );
    }

    const status = await getSessionStatus(sessionId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("devin status error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get session status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
