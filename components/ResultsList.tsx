"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoutResult, ScoredAPI, PriorityMode } from "@/types";
import ApiOverviewCard from "./ApiOverviewCard";
import ExpandedApiView from "./ExpandedApiView";

interface ResultsListProps {
  result: ScoutResult | null;
  stage: string;
  error: string | null;
  priority?: PriorityMode;
  onImplement?: (api: ScoredAPI, developerContext?: string) => void;
  implementingApiName?: string | null;
  showImplementButton?: boolean;
  devinSessionId?: string | null;
  onDevinComplete?: (prUrl: string) => void;
  onDevinError?: (error: string) => void;
}

export default function ResultsList({
  result,
  stage,
  error,
  priority,
  onImplement,
  implementingApiName,
  showImplementButton,
  devinSessionId,
  onDevinComplete,
  onDevinError,
}: ResultsListProps) {
  const [selectedApi, setSelectedApi] = useState<ScoredAPI | null>(null);

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  // Loading is now handled by the parent page
  if (stage !== "done" && stage !== "generating" && stage !== "pr-done" && stage !== "pr-failed") {
    return null;
  }

  if (!result) return null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {selectedApi === null ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Intent Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100"
            >
              <h3 className="text-sm font-semibold text-indigo-700 mb-3">
                Detected Intent
              </h3>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-indigo-400 text-xs font-medium uppercase tracking-wider">Task</span>
                  <p className="text-gray-800 mt-1">
                    {result.intent.task}
                  </p>
                </div>
                <div>
                  <span className="text-indigo-400 text-xs font-medium uppercase tracking-wider">
                    Language
                  </span>
                  <p className="text-gray-800 mt-1">
                    {result.intent.language}
                  </p>
                </div>
                <div>
                  <span className="text-indigo-400 text-xs font-medium uppercase tracking-wider">
                    Framework
                  </span>
                  <p className="text-gray-800 mt-1">
                    {result.intent.framework || "None detected"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {result.recommendations.map((api, i) => (
                <motion.div
                  key={api.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.15 }}
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
              devinSessionId={
                selectedApi.name === implementingApiName ? devinSessionId ?? undefined : undefined
              }
              onDevinComplete={onDevinComplete}
              onDevinError={onDevinError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
