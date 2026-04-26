import { buildDevinSessionPrompt } from "@/lib/prompts";
import { forkRepo } from "@/lib/github";
import type { DevinTriggerRequest, DevinSessionStatus } from "@/types";

const DEVIN_API_BASE = "https://api.devin.ai/v3";

function getApiKey(): string {
  if (!process.env.DEVIN_API_KEY) {
    throw new Error("DEVIN_API_KEY environment variable is not set");
  }
  return process.env.DEVIN_API_KEY;
}

function getOrgId(): string {
  if (!process.env.DEVIN_ORG_ID) {
    throw new Error("DEVIN_ORG_ID environment variable is not set");
  }
  return process.env.DEVIN_ORG_ID;
}

function getGitHubPat(): string {
  if (!process.env.GITHUB_PAT) {
    throw new Error("GITHUB_PAT environment variable is not set");
  }
  return process.env.GITHUB_PAT;
}

export async function triggerDevinSession(
  request: DevinTriggerRequest
): Promise<{ sessionId: string }> {
  const apiKey = getApiKey();
  const orgId = getOrgId();

  const { forkOwner, forkUrl } = await forkRepo(request.repoUrl);

  const repoMatch = request.repoUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  const repoOwner = repoMatch?.[1] ?? '';
  const repoName = repoMatch?.[2] ?? '';

  const prompt = buildDevinSessionPrompt({
    repoUrl: request.repoUrl,
    repoOwner,
    repoName,
    forkOwner,
    forkUrl,
    apiName: request.selectedAPI.name,
    apiDocsUrl: request.selectedAPI.docs_url,
    apiSnippet: request.selectedAPI.snippet,
    apiWinnerReason: request.selectedAPI.winner_reason,
    language: request.intent.language,
    framework: request.intent.framework,
    task: request.intent.task,
    developerContext: request.developerContext,
  });

  const res = await fetch(
    `${DEVIN_API_BASE}/organizations/${orgId}/sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        title: `Scout: Integrate ${request.selectedAPI.name} for ${request.intent.task}`,
        session_secrets: [
          {
            key: "GITHUB_TOKEN",
            value: getGitHubPat(),
            sensitive: true,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Devin API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return { sessionId: data.session_id };
}

export async function getSessionStatus(
  sessionId: string
): Promise<DevinSessionStatus> {
  const apiKey = getApiKey();
  const orgId = getOrgId();

  const devinId = sessionId.startsWith("devin-")
    ? sessionId
    : `devin-${sessionId}`;

  const res = await fetch(
    `${DEVIN_API_BASE}/organizations/${orgId}/sessions/${devinId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Devin API error (${res.status}): ${body}`);
  }

  const data = await res.json();

  const prEntry = data.pull_requests?.find(
    (pr: { pr_url: string }) => pr.pr_url
  );

  const sessionUrl = data.url || undefined;

  if (data.status === "error") {
    return {
      sessionId,
      status: "failed",
      message: "Devin session encountered an error",
      url: sessionUrl,
    };
  }

  if (data.status === "suspended") {
    const detail: string = data.status_detail || "suspended";
    return {
      sessionId,
      status: "failed",
      message: `Devin session suspended: ${detail}`,
      url: sessionUrl,
    };
  }

  if (
    data.status === "exit" ||
    data.status_detail === "finished" ||
    (data.status === "running" && prEntry)
  ) {
    return {
      sessionId,
      status: "completed",
      prUrl: prEntry?.pr_url,
      url: sessionUrl,
    };
  }

  if (data.status === "running" || data.status === "creating" || data.status === "claimed" || data.status === "resuming") {
    return {
      sessionId,
      status: "running",
      message: data.status_detail || "Devin is working...",
      url: sessionUrl,
    };
  }

  return {
    sessionId,
    status: "pending",
    url: sessionUrl,
  };
}
