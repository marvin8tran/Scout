import { NextResponse } from "next/server";
import { fetchRepoFiles, isValidGitHubUrl, validateGitHubRepoExists } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A GitHub URL is required" },
        { status: 400 }
      );
    }

    const formatCheck = isValidGitHubUrl(url);
    if (!formatCheck.valid) {
      return NextResponse.json({ error: formatCheck.error }, { status: 400 });
    }

    const repoCheck = await validateGitHubRepoExists(url);
    if (!repoCheck.exists) {
      return NextResponse.json({ error: repoCheck.error }, { status: 400 });
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
