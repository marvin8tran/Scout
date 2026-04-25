import { NextResponse } from "next/server";
import { fetchRepoFiles } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A GitHub URL is required" },
        { status: 400 }
      );
    }

    const files = await fetchRepoFiles(url);

    return NextResponse.json({ files });
  } catch (error) {
    console.error("fetch-repo error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch repo files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
