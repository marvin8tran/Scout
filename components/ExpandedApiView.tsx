"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ScoredAPI, PriorityMode } from "@/types";

const PRIORITY_SCORE_KEY: Record<PriorityMode, keyof ScoredAPI["scores"]> = {
  scalability: "scalability",
  cheapest: "price",
  maintenance: "maintenance",
};

interface ExpandedApiViewProps {
  api: ScoredAPI;
  priority?: PriorityMode;
  onBack: () => void;
  onImplement?: (api: ScoredAPI) => void;
  isImplementing?: boolean;
  isAnyImplementing?: boolean;
  showImplementButton?: boolean;
}

const SCORE_LABELS: { key: keyof ScoredAPI["scores"]; label: string; color: string }[] = [
  { key: "compatibility", label: "Compatibility", color: "bg-indigo-400" },
  { key: "price", label: "Price", color: "bg-emerald-400" },
  { key: "scalability", label: "Scalability", color: "bg-violet-400" },
  { key: "maintenance", label: "Maintenance", color: "bg-rose-400" },
];

export default function ExpandedApiView({
  api,
  priority,
  onBack,
  onImplement,
  isImplementing,
  isAnyImplementing,
  showImplementButton,
}: ExpandedApiViewProps) {
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
    <motion.div
      layoutId={api.name}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 transition-colors mb-6 font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Back to results
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {api.name}
          </h2>
          <a
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:text-indigo-600 hover:underline transition-colors"
          >
            {api.url}
          </a>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-gray-900">
            {api.final_score.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Overall Score
          </div>
        </div>
      </motion.div>

      {/* Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        {SCORE_LABELS.map(({ key, label, color }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="font-semibold text-gray-800">
                {api.scores[key]}/10
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${api.scores[key] * 10}%` }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  priority && PRIORITY_SCORE_KEY[priority] === key
                    ? color
                    : "bg-gray-300"
                }`}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Winner Reason */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-gray-700 mb-4 leading-relaxed"
      >
        {api.winner_reason}
      </motion.p>

      {/* Tradeoff */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50/80 border border-amber-200 mb-8"
      >
        <span className="text-amber-600 text-sm font-semibold shrink-0 mt-0.5">
          Tradeoff:
        </span>
        <p className="text-sm text-amber-800 leading-relaxed">
          {api.tradeoff}
        </p>
      </motion.div>

      {/* Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-2xl overflow-hidden border border-indigo-200 shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 border-b border-indigo-200">
          <span className="text-sm text-indigo-600 font-medium">Integration Code</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs rounded-lg bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-6 bg-white text-gray-800 text-sm overflow-x-auto font-mono leading-relaxed">
          <code>{api.snippet}</code>
        </pre>
      </motion.div>

      {/* Implement with Devin */}
      {showImplementButton && onImplement && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <button
            onClick={() => onImplement(api)}
            disabled={isAnyImplementing}
            className="w-full px-4 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </motion.div>
      )}
    </motion.div>
  );
}
