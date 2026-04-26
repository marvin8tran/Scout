const DEPENDENCY_FILES = [
  "package.json",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
];

const ENTRY_POINT_FILES = [
  "index.ts",
  "main.py",
  "app.ts",
  "server.js",
];

export function isValidGitHubUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
    return { valid: false, error: "URL must be a github.com link" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, error: "URL must use http or https protocol" };
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return {
      valid: false,
      error: "URL must include owner and repository (e.g. https://github.com/owner/repo)",
    };
  }

  const validSegment = /^[\w.-]+$/;
  if (!validSegment.test(segments[0]) || !validSegment.test(segments[1])) {
    return {
      valid: false,
      error: "URL must include owner and repository (e.g. https://github.com/owner/repo)",
    };
  }

  return { valid: true };
}

export async function validateGitHubRepoExists(
  url: string
): Promise<{ exists: boolean; error?: string }> {
  const formatCheck = isValidGitHubUrl(url);
  if (!formatCheck.valid) {
    return { exists: false, error: formatCheck.error };
  }

  const { owner, repo } = parseGitHubUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { method: "HEAD", signal: controller.signal }
    );

    if (res.status === 200) return { exists: true };
    if (res.status === 404) {
      return { exists: false, error: "Repository not found — make sure it exists and is public" };
    }
    if (res.status === 403) {
      return { exists: false, error: "Repository is not accessible — it may be private" };
    }
    return { exists: false, error: "Could not reach GitHub to verify repository" };
  } catch {
    return { exists: false, error: "Could not reach GitHub to verify repository" };
  } finally {
    clearTimeout(timeout);
  }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const check = isValidGitHubUrl(url);
  if (!check.valid) {
    throw new Error(check.error ?? "Invalid GitHub URL");
  }
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  return { owner: parts[0], repo: parts[1] };
}

async function fetchRawFile(
  owner: string,
  repo: string,
  file: string,
  branch: string
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFileWithFallback(
  owner: string,
  repo: string,
  file: string
): Promise<string | null> {
  const content = await fetchRawFile(owner, repo, file, "main");
  if (content !== null) return content;
  return fetchRawFile(owner, repo, file, "master");
}

const FORK_POLL_INTERVAL_MS = 5000;
const FORK_POLL_MAX_ATTEMPTS = 6;

export async function forkRepo(
  repoUrl: string
): Promise<{ forkOwner: string; forkRepo: string; forkUrl: string }> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error("GITHUB_PAT environment variable is not set");
  }

  const { owner, repo } = parseGitHubUrl(repoUrl);
  const headers: Record<string, string> = {
    Authorization: `token ${pat}`,
    Accept: "application/vnd.github.v3+json",
  };

  const forkRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/forks`,
    { method: "POST", headers }
  );

  if (!forkRes.ok && forkRes.status !== 202 && forkRes.status !== 422) {
    const body = await forkRes.text();
    throw new Error(
      `Failed to fork repository (${forkRes.status}): ${body}`
    );
  }

  const forkData = await forkRes.json();
  const forkOwner: string = forkData.owner?.login ?? forkData.full_name?.split("/")[0];

  if (!forkOwner) {
    throw new Error("Could not determine fork owner from GitHub response");
  }

  for (let i = 0; i < FORK_POLL_MAX_ATTEMPTS; i++) {
    const checkRes = await fetch(
      `https://api.github.com/repos/${forkOwner}/${repo}`,
      { headers }
    );
    if (checkRes.ok) {
      return {
        forkOwner,
        forkRepo: repo,
        forkUrl: `https://github.com/${forkOwner}/${repo}`,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, FORK_POLL_INTERVAL_MS));
  }

  throw new Error(
    `Fork not ready after ${FORK_POLL_MAX_ATTEMPTS * FORK_POLL_INTERVAL_MS / 1000}s — try again later`
  );
}

export async function fetchRepoFiles(
  url: string
): Promise<Record<string, string>> {
  const { owner, repo } = parseGitHubUrl(url);
  const files: Record<string, string> = {};

  const readme = await fetchFileWithFallback(owner, repo, "README.md");
  if (readme) files["README.md"] = readme;

  for (const dep of DEPENDENCY_FILES) {
    const content = await fetchFileWithFallback(owner, repo, dep);
    if (content) {
      files[dep] = content;
      break;
    }
  }

  for (const entry of ENTRY_POINT_FILES) {
    const content = await fetchFileWithFallback(owner, repo, entry);
    if (content) {
      files[entry] = content;
      break;
    }
  }

  return files;
}
