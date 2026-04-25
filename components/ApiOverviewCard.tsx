"use client";

import { motion } from "framer-motion";
import type { ScoredAPI, PriorityMode } from "@/types";

const PRIORITY_SCORE_KEY: Record<PriorityMode, keyof ScoredAPI["scores"]> = {
  scalability: "scalability",
  cheapest: "price",
  maintenance: "maintenance",
};

interface ApiOverviewCardProps {
  api: ScoredAPI;
  rank: number;
  priority?: PriorityMode;
  onSelect: (api: ScoredAPI) => void;
}

const SCORE_LABELS: { key: keyof ScoredAPI["scores"]; label: string }[] = [
  { key: "compatibility", label: "Compatibility" },
  { key: "price", label: "Price" },
  { key: "scalability", label: "Scalability" },
  { key: "maintenance", label: "Maintenance" },
];

export default function ApiOverviewCard({
  api,
  rank,
  priority,
  onSelect,
}: ApiOverviewCardProps) {
  return (
    <motion.div
      layoutId={api.name}
      className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-blue-500"
      onClick={() => onSelect(api)}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white text-sm font-bold dark:bg-zinc-100 dark:text-zinc-900">
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
              className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline transition-colors dark:text-zinc-500 dark:hover:text-zinc-300"
              onClick={(e) => e.stopPropagation()}
            >
              {api.url}
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {api.final_score.toFixed(1)}
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500">Score</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {api.scores[key]}/10
              </span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  priority && PRIORITY_SCORE_KEY[priority] === key
                    ? "bg-blue-600"
                    : "bg-zinc-400 dark:bg-zinc-500"
                }`}
                style={{ width: `${api.scores[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Winner Reason */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
        {api.winner_reason}
      </p>

      {/* Tradeoff */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50">
        <span className="text-amber-600 text-xs font-medium shrink-0 mt-0.5 dark:text-amber-400">
          Tradeoff:
        </span>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {api.tradeoff}
        </p>
      </div>

      {/* CTA */}
      <button
        className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(api);
        }}
      >
        View Integration Code
      </button>
    </motion.div>
  );
}
