"use client";

import type { ScoutResult, PriorityMode } from "@/types";
import ResultCard from "./ResultCard";

interface ResultsListProps {
  result: ScoutResult | null;
  stage: "idle" | "fetching" | "analyzing" | "searching" | "scoring" | "done" | "error";
  error: string | null;
  priority?: PriorityMode;
}

const STAGE_MESSAGES: Record<string, string> = {
  fetching: "Fetching repository files...",
  analyzing: "Analyzing your input...",
  searching: "Searching for API candidates...",
  scoring: "Scoring and ranking APIs...",
};

export default function ResultsList({ result, stage, error, priority }: ResultsListProps) {
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (stage !== "idle" && stage !== "done") {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {STAGE_MESSAGES[stage] || "Processing..."}
        </p>
        {/* Pipeline progress */}
        <div className="flex items-center gap-2 mt-2">
          {(["analyzing", "searching", "scoring"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  stage === s
                    ? "bg-blue-500 animate-pulse"
                    : ["analyzing", "searching", "scoring"].indexOf(stage) > i
                      ? "bg-green-500"
                      : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              <span
                className={`text-xs ${
                  stage === s
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && (
                <span className="text-zinc-300 dark:text-zinc-600">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-6">
      {/* Intent Summary */}
      <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Detected Intent
        </h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Task</span>
            <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
              {result.intent.task}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Language</span>
            <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
              {result.intent.language}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Framework</span>
            <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
              {result.intent.framework || "None detected"}
            </p>
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-4">
        {result.recommendations.map((api, i) => (
          <ResultCard key={api.name} api={api} rank={i + 1} priority={priority} />
        ))}
      </div>
    </div>
  );
}
