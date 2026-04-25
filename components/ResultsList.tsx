"use client";

import type { ScoutResult, ScoredAPI, PriorityMode } from "@/types";
import ResultCard from "./ResultCard";

interface ResultsListProps {
  result: ScoutResult | null;
  stage: "idle" | "fetching" | "analyzing" | "searching" | "scoring" | "done" | "generating" | "pr-done" | "pr-failed" | "error";
  error: string | null;
  priority?: PriorityMode;
  onImplement?: (api: ScoredAPI) => void;
  implementingApiName?: string | null;
  showImplementButton?: boolean;
}

const STAGE_MESSAGES: Record<string, string> = {
  fetching: "Fetching repository files...",
  analyzing: "Analyzing your input...",
  searching: "Searching for API candidates...",
  scoring: "Scoring and ranking APIs...",
  generating: "Devin is generating your integration...",
};

export default function ResultsList({ result, stage, error, priority, onImplement, implementingApiName, showImplementButton }: ResultsListProps) {
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-xl bg-red-50 border border-red-100">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (stage !== "idle" && stage !== "done" && stage !== "generating" && stage !== "pr-done" && stage !== "pr-failed") {
    return (
      <div className="w-full max-w-2xl mx-auto mt-16 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">
          {STAGE_MESSAGES[stage] || "Processing..."}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {(["analyzing", "searching", "scoring"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  stage === s
                    ? "bg-gray-900 animate-pulse"
                    : ["analyzing", "searching", "scoring"].indexOf(stage) > i
                      ? "bg-gray-400"
                      : "bg-gray-200"
                }`}
              />
              <span
                className={`text-xs ${
                  stage === s
                    ? "text-gray-900 font-medium"
                    : "text-gray-400"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && (
                <span className="text-gray-200 mx-1">&rarr;</span>
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
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Detected Intent
        </h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Task</span>
            <p className="text-gray-700 mt-0.5">
              {result.intent.task}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Language</span>
            <p className="text-gray-700 mt-0.5">
              {result.intent.language}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Framework</span>
            <p className="text-gray-700 mt-0.5">
              {result.intent.framework || "None detected"}
            </p>
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-4">
        {result.recommendations.map((api, i) => (
          <ResultCard
            key={api.name}
            api={api}
            rank={i + 1}
            priority={priority}
            onImplement={onImplement}
            isImplementing={api.name === implementingApiName}
            showImplementButton={showImplementButton}
          />
        ))}
      </div>
    </div>
  );
}
