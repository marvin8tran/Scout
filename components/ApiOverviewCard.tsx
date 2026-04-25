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

const SCORE_LABELS: { key: keyof ScoredAPI["scores"]; label: string; color: string }[] = [
  { key: "compatibility", label: "Compatibility", color: "bg-indigo-400" },
  { key: "price", label: "Price", color: "bg-emerald-400" },
  { key: "scalability", label: "Scalability", color: "bg-violet-400" },
  { key: "maintenance", label: "Maintenance", color: "bg-rose-400" },
];

const RANK_COLORS = [
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-rose-100 text-rose-700 border-rose-200",
];

const CARD_ACCENTS = [
  "border-indigo-200 hover:border-indigo-300 hover:shadow-indigo-100/50",
  "border-violet-200 hover:border-violet-300 hover:shadow-violet-100/50",
  "border-rose-200 hover:border-rose-300 hover:shadow-rose-100/50",
];

export default function ApiOverviewCard({
  api,
  rank,
  priority,
  onSelect,
}: ApiOverviewCardProps) {
  const accentIndex = Math.min(rank - 1, CARD_ACCENTS.length - 1);

  return (
    <motion.div
      layoutId={api.name}
      className={`rounded-2xl border-2 bg-white p-7 space-y-5 cursor-pointer hover:shadow-lg transition-all ${CARD_ACCENTS[accentIndex]}`}
      onClick={() => onSelect(api)}
      whileHover={{ y: -3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border ${RANK_COLORS[accentIndex]}`}>
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {api.name}
            </h3>
            <a
              href={api.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-600 hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {api.url}
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {api.final_score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 font-medium">Score</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {SCORE_LABELS.map(({ key, label, color }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">{label}</span>
              <span className="font-semibold text-gray-700">
                {api.scores[key]}/10
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  priority && PRIORITY_SCORE_KEY[priority] === key
                    ? color
                    : "bg-gray-300"
                }`}
                style={{ width: `${api.scores[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Winner Reason - full text, not clamped */}
      <p className="text-sm text-gray-700 leading-relaxed">
        {api.winner_reason}
      </p>

      {/* Tradeoff */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50/80 border border-amber-200">
        <span className="text-amber-600 text-xs font-semibold shrink-0 mt-0.5">
          Tradeoff:
        </span>
        <p className="text-xs text-amber-800 leading-relaxed">
          {api.tradeoff}
        </p>
      </div>

      {/* CTA */}
      <button
        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          rank === 1
            ? "bg-indigo-500 text-white hover:bg-indigo-600"
            : rank === 2
              ? "bg-violet-500 text-white hover:bg-violet-600"
              : "bg-rose-500 text-white hover:bg-rose-600"
        }`}
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
