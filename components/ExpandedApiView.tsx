"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ScoredAPI, PriorityMode } from "@/types";
import { useTypewriter } from "@/hooks/useTypewriter";

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

const SCORE_LABELS: { key: keyof ScoredAPI["scores"]; label: string }[] = [
  { key: "compatibility", label: "Compatibility" },
  { key: "price", label: "Price" },
  { key: "scalability", label: "Scalability" },
  { key: "maintenance", label: "Maintenance" },
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
  const { displayedText, isComplete } = useTypewriter(api.snippet, 18);

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
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6 dark:text-zinc-400 dark:hover:text-zinc-100"
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
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {api.name}
          </h2>
          <a
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-blue-600 hover:underline transition-colors dark:text-zinc-500 dark:hover:text-blue-400"
          >
            {api.url}
          </a>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            {api.final_score.toFixed(1)}
          </div>
          <div className="text-sm text-zinc-400 dark:text-zinc-500">
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
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {api.scores[key]}/10
              </span>
            </div>
            <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${api.scores[key] * 10}%` }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  priority && PRIORITY_SCORE_KEY[priority] === key
                    ? "bg-blue-600"
                    : "bg-zinc-400 dark:bg-zinc-500"
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
        className="text-zinc-600 mb-4 dark:text-zinc-400"
      >
        {api.winner_reason}
      </motion.p>

      {/* Tradeoff */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-100 mb-8 dark:bg-amber-950/30 dark:border-amber-900/50"
      >
        <span className="text-amber-600 text-sm font-medium shrink-0 mt-0.5 dark:text-amber-400">
          Tradeoff:
        </span>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          {api.tradeoff}
        </p>
      </motion.div>

      {/* Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`relative rounded-xl overflow-hidden transition-shadow duration-500 ${
          !isComplete
            ? "shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            : "shadow-lg"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-850">
          <span className="text-xs text-zinc-400">Integration Code</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs rounded-md bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-6 bg-zinc-950 text-emerald-400 text-sm overflow-x-auto font-mono leading-relaxed">
          <code>
            {displayedText}
            {!isComplete && (
              <span className="cursor-blink inline-block w-2 h-4 bg-emerald-400 ml-0.5 align-middle" />
            )}
          </code>
        </pre>
      </motion.div>

      {/* Implement with Devin */}
      {isComplete && showImplementButton && onImplement && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <button
            onClick={() => onImplement(api)}
            disabled={isAnyImplementing}
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
