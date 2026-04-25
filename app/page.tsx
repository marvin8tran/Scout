"use client";

import { useState } from "react";
import InputPanel from "@/components/InputPanel";
import ResultsList from "@/components/ResultsList";
import DevinStatus from "@/components/DevinStatus";
import type {
  AnalyzeRequest,
  ExtractedIntent,
  APICandidate,
  ScoredAPI,
  ScoutResult,
  InputMode,
} from "@/types";

type Stage =
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

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ScoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<AnalyzeRequest["priority"]>("scalability");
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [devinSessionId, setDevinSessionId] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [implementingApiName, setImplementingApiName] = useState<string | null>(null);
  const [devinError, setDevinError] = useState<string | null>(null);

  const handleSubmit = async (data: AnalyzeRequest) => {
    setResult(null);
    setError(null);
    setActivePriority(data.priority);
    setInputMode(data.mode);
    setDevinSessionId(null);
    setPrUrl(null);
    setImplementingApiName(null);
    setDevinError(null);

    if (data.mode === "github") {
      setRepoUrl(data.input);
    } else {
      setRepoUrl(null);
    }

    try {
      let inputText = data.input;

      // Step 1: If GitHub mode, fetch repo files first
      if (data.mode === "github") {
        setStage("fetching");
        const fetchRes = await fetch("/api/fetch-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.input }),
        });
        const fetchData = await fetchRes.json();
        if (!fetchRes.ok) throw new Error(fetchData.error || "Failed to fetch repo");
        inputText = Object.entries(fetchData.files as Record<string, string>)
          .map(([name, content]) => `--- ${name} ---\n${content}`)
          .join("\n\n");
      }

      // Step 2: Analyze input to extract intent
      setStage("analyzing");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: inputText,
          chatMessage: data.chatMessage,
          mode: data.mode,
          priority: data.priority,
        }),
      });
      const intent: ExtractedIntent = await analyzeRes.json();
      if (!analyzeRes.ok)
        throw new Error(
          (intent as unknown as { error: string }).error ||
            "Failed to analyze input"
        );

      // Step 3: Search for API candidates
      setStage("searching");
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent),
      });
      const candidates: APICandidate[] = await searchRes.json();
      if (!searchRes.ok)
        throw new Error(
          (candidates as unknown as { error: string }).error ||
            "Failed to search APIs"
        );

      // Step 4: Score and rank candidates
      setStage("scoring");
      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates,
          intent,
          priority: data.priority,
        }),
      });
      const scored: ScoredAPI[] = await scoreRes.json();
      if (!scoreRes.ok)
        throw new Error(
          (scored as unknown as { error: string }).error ||
            "Failed to score APIs"
        );

      setResult({ intent, recommendations: scored });
      setStage("done");
    } catch (err) {
      console.error("Pipeline error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  const handleImplement = async (api: ScoredAPI) => {
    if (!repoUrl || !result) return;

    setImplementingApiName(api.name);
    setDevinError(null);
    setStage("generating");

    try {
      const triggerRes = await fetch("/api/devin/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          selectedAPI: api,
          intent: result.intent,
        }),
      });
      const triggerData = await triggerRes.json();
      if (!triggerRes.ok) throw new Error(triggerData.error || "Failed to trigger Devin session");
      const { sessionId } = triggerData;
      setDevinSessionId(sessionId);

      const poll = async () => {
        try {
          const statusRes = await fetch("/api/devin/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const status = await statusRes.json();

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

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex flex-1 w-full flex-col items-center px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            API Scout
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm max-w-md">
            Discover, compare, and integrate the best third-party APIs for your
            use case
          </p>
        </div>

        <InputPanel
          onSubmit={handleSubmit}
          isLoading={stage !== "idle" && stage !== "done" && stage !== "error" && stage !== "pr-done" && stage !== "pr-failed"}
        />

        <ResultsList
          result={result}
          stage={stage}
          error={error}
          priority={activePriority}
          onImplement={handleImplement}
          implementingApiName={implementingApiName}
          showImplementButton={inputMode === "github"}
        />

        {(stage === "generating" || stage === "pr-done" || stage === "pr-failed") && implementingApiName && (
          <DevinStatus
            status={stage as "generating" | "pr-done" | "pr-failed"}
            apiName={implementingApiName}
            prUrl={prUrl ?? undefined}
            errorMessage={stage === "pr-failed" ? devinError ?? undefined : undefined}
          />
        )}
      </main>
    </div>
  );
}
