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
    <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold">
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {api.name}
            </h3>
            <a
              href={api.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 hover:underline transition-colors"
            >
              {api.url}
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {api.final_score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">
            Score
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{label}</span>
              <span className="font-medium text-gray-700">
                {api.scores[key]}/10
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  priority && PRIORITY_SCORE_KEY[priority] === key
                    ? "bg-gray-900"
                    : "bg-gray-400"
                }`}
                style={{ width: `${api.scores[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Winner Reason */}
      <p className="text-sm text-gray-600">
        {api.winner_reason}
      </p>

      {/* Tradeoff */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
        <span className="text-amber-600 text-xs font-medium shrink-0 mt-0.5">
          Tradeoff:
        </span>
        <p className="text-xs text-amber-700">
          {api.tradeoff}
        </p>
      </div>

      {/* Code Snippet */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="p-4 rounded-lg bg-gray-950 text-gray-100 text-xs overflow-x-auto">
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
