"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoutResult, ScoredAPI, PriorityMode } from "@/types";
import ApiOverviewCard from "./ApiOverviewCard";
import ExpandedApiView from "./ExpandedApiView";

interface ResultsListProps {
  result: ScoutResult | null;
  stage:
    | "idle"
    | "fetching"
    | "analyzing"
    | "searching"
    | "scoring"
    | "done"
    | "generating"
    | "pr-done"
    | "pr-failed"
    | "error";
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

export default function ResultsList({
  result,
  stage,
  error,
  priority,
  onImplement,
  implementingApiName,
  showImplementButton,
}: ResultsListProps) {
  const [selectedApi, setSelectedApi] = useState<ScoredAPI | null>(null);

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-xl bg-red-50 border border-red-100">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (
    stage !== "idle" &&
    stage !== "done" &&
    stage !== "generating" &&
    stage !== "pr-done" &&
    stage !== "pr-failed"
  ) {
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
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
      <AnimatePresence mode="wait">
        {selectedApi === null ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Intent Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800"
            >
              <h3 className="text-sm font-medium text-zinc-900 mb-2 dark:text-zinc-100">
                Detected Intent
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500">Task</span>
                  <p className="text-zinc-700 mt-0.5 dark:text-zinc-300">
                    {result.intent.task}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    Language
                  </span>
                  <p className="text-zinc-700 mt-0.5 dark:text-zinc-300">
                    {result.intent.language}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    Framework
                  </span>
                  <p className="text-zinc-700 mt-0.5 dark:text-zinc-300">
                    {result.intent.framework || "None detected"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.recommendations.map((api, i) => (
                <motion.div
                  key={api.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <ApiOverviewCard
                    api={api}
                    rank={i + 1}
                    priority={priority}
                    onSelect={setSelectedApi}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ExpandedApiView
              api={selectedApi}
              priority={priority}
              onBack={() => setSelectedApi(null)}
              onImplement={onImplement}
              isImplementing={selectedApi.name === implementingApiName}
              isAnyImplementing={implementingApiName != null}
              showImplementButton={showImplementButton}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
