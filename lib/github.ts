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

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid GitHub URL: must contain owner and repo");
  }
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
