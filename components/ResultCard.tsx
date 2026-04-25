"use client";

import { useState } from "react";
import type { ScoredAPI, PriorityMode } from "@/types";

const PRIORITY_SCORE_KEY: Record<PriorityMode, keyof ScoredAPI["scores"]> = {
  scalability: "scalability",
  cheapest: "price",
  maintenance: "maintenance",
};

interface ResultCardProps {
  api: ScoredAPI;
  rank: number;
  priority?: PriorityMode;
  onImplement?: (api: ScoredAPI) => void;
  isImplementing?: boolean;
  showImplementButton?: boolean;
}

const SCORE_LABELS: { key: keyof ScoredAPI["scores"]; label: string }[] = [
  { key: "compatibility", label: "Compatibility" },
  { key: "price", label: "Price" },
  { key: "scalability", label: "Scalability" },
  { key: "maintenance", label: "Maintenance" },
];

export default function ResultCard({ api, rank, priority, onImplement, isImplementing, showImplementButton }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(api.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {api.name}
            </h3>
            <a
              href={api.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              {api.url}
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {api.final_score.toFixed(1)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Final Score
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {api.scores[key]}/10
              </span>
            </div>
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  priority && PRIORITY_SCORE_KEY[priority] === key
                    ? "bg-emerald-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${api.scores[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Winner Reason */}
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {api.winner_reason}
      </p>

      {/* Tradeoff */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium shrink-0 mt-0.5">
          Tradeoff:
        </span>
        <p className="text-xs text-amber-800 dark:text-amber-300">
          {api.tradeoff}
        </p>
      </div>

      {/* Code Snippet */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 text-xs overflow-x-auto">
          <code>{api.snippet}</code>
        </pre>
      </div>

      {showImplementButton && onImplement && (
        <button
          onClick={() => onImplement(api)}
          disabled={isImplementing}
          className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isImplementing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Devin is working...
            </>
          ) : (
            "Implement with Devin"
          )}
        </button>
      )}
    </div>
  );
}
