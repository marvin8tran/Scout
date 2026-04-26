"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ResultsList from "@/components/ResultsList";
import type { ScoutResult, ScoredAPI, PriorityMode, InputMode } from "@/types";

type Stage =
  | "done"
  | "generating"
  | "pr-done"
  | "pr-failed";

interface StoredResultData {
  result: ScoutResult;
  priority: PriorityMode;
  inputMode: InputMode;
  repoUrl: string | null;
}

export default function ResultsPage() {
  const router = useRouter();
  const [resultData] = useState<StoredResultData | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("scout_result");
    if (!stored) return null;
    return JSON.parse(stored) as StoredResultData;
  });
  const [stage, setStage] = useState<Stage>("done");
  const [implementingApiName, setImplementingApiName] = useState<string | null>(null);
  const [devinSessionId, setDevinSessionId] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [devinError, setDevinError] = useState<string | null>(null);

  useEffect(() => {
    if (!resultData) {
      router.push("/search");
    }
  }, [resultData, router]);

  const handleImplement = async (api: ScoredAPI, developerContext?: string) => {
    if (!resultData?.repoUrl || !resultData?.result) return;

    setImplementingApiName(api.name);
    setDevinError(null);
    setPrUrl(null);
    setDevinSessionId(null);
    setStage("generating");

    try {
      const triggerRes = await fetch("/api/devin/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: resultData.repoUrl,
          selectedAPI: api,
          intent: resultData.result.intent,
          developerContext,
        }),
      });
      const triggerData = await triggerRes.json();
      if (!triggerRes.ok) throw new Error(triggerData.error || "Failed to trigger Devin session");
      setDevinSessionId(triggerData.sessionId);
    } catch (err) {
      console.error("Devin error:", err);
      setDevinError(err instanceof Error ? err.message : "Failed to generate integration");
      setStage("pr-failed");
    }
  };

  const handleDevinComplete = (url: string) => {
    setPrUrl(url);
    setStage("pr-done");
  };

  const handleDevinError = (error: string) => {
    setDevinError(error);
    setImplementingApiName(null);
    setDevinSessionId(null);
    setStage("pr-failed");
  };

  if (!resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-violet-50/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-20 -left-10 w-64 h-64 rounded-full bg-indigo-100/40" />
        <div className="absolute top-60 right-0 w-48 h-48 rounded-full bg-violet-100/30" />
        <div className="absolute bottom-20 left-1/3 w-56 h-56 rounded-full bg-rose-100/20" />
      </div>

      <main className="relative z-10 px-6 py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/search")}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            New Search
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Scout <span className="text-indigo-500 font-normal text-lg">Results</span>
          </h1>
        </div>

        {/* Results */}
        <ResultsList
          result={resultData.result}
          stage={stage}
          error={null}
          priority={resultData.priority}
          onImplement={handleImplement}
          implementingApiName={implementingApiName}
          showImplementButton={true}
          devinSessionId={devinSessionId}
          onDevinComplete={handleDevinComplete}
          onDevinError={handleDevinError}
        />

        {/* Completed: show PR link */}
        {stage === "pr-done" && prUrl && implementingApiName && (
          <div className="mt-8 max-w-2xl mx-auto p-6 rounded-xl border border-emerald-100 bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-3">
              Devin created a pull request for{" "}
              <span className="font-medium">{implementingApiName}</span>!
            </p>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              View Pull Request
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-4.5L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        )}

        {/* Failed state */}
        {stage === "pr-failed" && (
          <div className="mt-8 max-w-2xl mx-auto p-6 rounded-xl border border-red-100 bg-red-50">
            <p className="text-sm text-red-700">
              {devinError || "Failed to generate integration. Please try again."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
