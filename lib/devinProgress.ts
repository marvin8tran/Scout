import type { DevinProgressStep } from "@/types";

const STEP_LABELS = [
  "Forking repository",
  "Analyzing project structure",
  "Installing SDK/package",
  "Creating integration code",
  "Setting up error handling & env vars",
  "Committing & pushing changes",
  "Opening pull request",
] as const;

const KEYWORD_PATTERNS: [RegExp, number][] = [
  [/fork/i, 0],
  [/clon/i, 0],
  [/analyz/i, 1],
  [/structure/i, 1],
  [/install/i, 2],
  [/package/i, 2],
  [/npm|yarn|pnpm/i, 2],
  [/integrat/i, 3],
  [/creat.*service|creat.*client|creat.*module/i, 3],
  [/type.*defin/i, 3],
  [/error.*handl|env.*var|\.env/i, 4],
  [/commit|push/i, 5],
  [/pull.*request|PR|pr create/i, 6],
  [/finish/i, 6],
];

const TIME_THRESHOLDS_SEC = [0, 20, 50, 90, 150, 210, 270];

function inferStepFromKeywords(message: string): number | null {
  for (const [pattern, stepIdx] of KEYWORD_PATTERNS) {
    if (pattern.test(message)) return stepIdx;
  }
  return null;
}

function inferStepFromTime(elapsedSeconds: number): number {
  let step = 0;
  for (let i = TIME_THRESHOLDS_SEC.length - 1; i >= 0; i--) {
    if (elapsedSeconds >= TIME_THRESHOLDS_SEC[i]) {
      step = i;
      break;
    }
  }
  return Math.min(step, STEP_LABELS.length - 1);
}

export function inferProgressSteps(
  sessionStatus: "pending" | "running" | "completed" | "failed" | "stopped",
  statusMessage?: string,
  elapsedSeconds?: number,
): DevinProgressStep[] {
  const steps: DevinProgressStep[] = STEP_LABELS.map((label) => ({
    label,
    status: "pending" as const,
  }));

  if (sessionStatus === "pending") {
    return steps;
  }

  if (sessionStatus === "completed") {
    return steps.map((s) => ({ ...s, status: "completed" as const }));
  }

  if (sessionStatus === "failed" || sessionStatus === "stopped") {
    let activeIdx = 0;
    if (statusMessage) {
      const kw = inferStepFromKeywords(statusMessage);
      if (kw !== null) activeIdx = kw;
      else if (elapsedSeconds !== undefined) activeIdx = inferStepFromTime(elapsedSeconds);
    } else if (elapsedSeconds !== undefined) {
      activeIdx = inferStepFromTime(elapsedSeconds);
    }

    return steps.map((s, i) => ({
      ...s,
      status: i < activeIdx ? ("completed" as const) : i === activeIdx ? ("failed" as const) : ("pending" as const),
    }));
  }

  // running
  let activeIdx = 0;
  if (statusMessage) {
    const kw = inferStepFromKeywords(statusMessage);
    if (kw !== null) activeIdx = kw;
    else if (elapsedSeconds !== undefined) activeIdx = inferStepFromTime(elapsedSeconds);
  } else if (elapsedSeconds !== undefined) {
    activeIdx = inferStepFromTime(elapsedSeconds);
  }

  return steps.map((s, i) => ({
    ...s,
    status: i < activeIdx ? ("completed" as const) : i === activeIdx ? ("active" as const) : ("pending" as const),
  }));
}
