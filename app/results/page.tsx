"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ResultsList from "@/components/ResultsList";
import DevinStatus from "@/components/DevinStatus";
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
  const pollGenerationRef = useRef(0);

  useEffect(() => {
    if (!resultData) {
      router.push("/");
    }
  }, [resultData, router]);

  const handleImplement = async (api: ScoredAPI) => {
    if (!resultData?.repoUrl || !resultData?.result) return;

    setImplementingApiName(api.name);
    setDevinError(null);
    setStage("generating");
    const generation = ++pollGenerationRef.current;

    try {
      const triggerRes = await fetch("/api/devin/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: resultData.repoUrl,
          selectedAPI: api,
          intent: resultData.result.intent,
        }),
      });
      const triggerData = await triggerRes.json();
      if (!triggerRes.ok) throw new Error(triggerData.error || "Failed to trigger Devin session");
      const { sessionId } = triggerData;
      setDevinSessionId(sessionId);

      const poll = async () => {
        if (pollGenerationRef.current !== generation) return;
        try {
          const statusRes = await fetch("/api/devin/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const status = await statusRes.json();
          if (!statusRes.ok) throw new Error(status.error || "Failed to check session status");
          if (pollGenerationRef.current !== generation) return;

          if (status.status === "completed") {
            setPrUrl(status.prUrl ?? null);
            setStage("pr-done");
          } else if (status.status === "failed") {
            setDevinError(status.message || "Devin session failed");
            setStage("pr-failed");
          } else {
            setTimeout(poll, 10000);
          }
        } catch (pollErr) {
          if (pollGenerationRef.current !== generation) return;
          console.error("Devin poll error:", pollErr);
          setDevinError(pollErr instanceof Error ? pollErr.message : "Failed to check session status");
          setStage("pr-failed");
        }
      };

      setTimeout(poll, 10000);
    } catch (err) {
      console.error("Devin error:", err);
      setDevinError(err instanceof Error ? err.message : "Failed to generate integration");
      setStage("pr-failed");
    }
  };

  void devinSessionId;

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
            onClick={() => router.push("/")}
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
          showImplementButton={resultData.inputMode === "github"}
        />

        {(stage === "generating" || stage === "pr-done" || stage === "pr-failed") && implementingApiName && (
          <div className="mt-8 max-w-4xl mx-auto">
            <DevinStatus
              status={stage}
              apiName={implementingApiName}
              prUrl={prUrl ?? undefined}
              errorMessage={stage === "pr-failed" ? devinError ?? undefined : undefined}
            />
          </div>
        )}
      </main>
    </div>
  );
}
