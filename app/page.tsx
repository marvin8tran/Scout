"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import InputPanel from "@/components/InputPanel";
import type {
  AnalyzeRequest,
  ExtractedIntent,
  APICandidate,
  ScoredAPI,
} from "@/types";

type Stage =
  | "idle"
  | "fetching"
  | "analyzing"
  | "searching"
  | "scoring"
  | "done"
  | "error";

const PIPELINE_STEPS = [
  { key: "fetching", label: "Fetching", color: "bg-indigo-400" },
  { key: "analyzing", label: "Analyzing", color: "bg-violet-400" },
  { key: "searching", label: "Searching", color: "bg-rose-400" },
  { key: "scoring", label: "Scoring", color: "bg-amber-400" },
] as const;

const STAGE_MESSAGES: Record<string, string> = {
  fetching: "Fetching repository files...",
  analyzing: "Analyzing your code and requirements...",
  searching: "Searching for the best API candidates...",
  scoring: "Scoring and ranking your top matches...",
};

const STEPS = [
  {
    number: "1",
    title: "Describe your need",
    description: "Tell us what kind of API you're looking for using natural language.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Share your code",
    description: "Paste a code snippet or link a public GitHub repository for context.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
  },
  {
    number: "3",
    title: "AI analyzes intent",
    description: "We extract your stack, language, and requirements using AI.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  {
    number: "4",
    title: "Get ranked results",
    description: "Receive the top 3 APIs scored on compatibility, price, scalability, and maintenance.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollGenerationRef = useRef(0);

  const getStageIndex = (s: Stage): number => {
    const order = ["fetching", "analyzing", "searching", "scoring", "done"];
    return order.indexOf(s);
  };

  const handleSubmit = async (data: AnalyzeRequest) => {
    setError(null);
    pollGenerationRef.current += 1;

    const repoUrl = data.mode === "github" ? data.input : null;

    try {
      let inputText = data.input;

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

      // Store result and navigate to results page
      sessionStorage.setItem(
        "scout_result",
        JSON.stringify({
          result: { intent, recommendations: scored },
          priority: data.priority,
          inputMode: data.mode,
          repoUrl,
        })
      );
      setStage("done");
      router.push("/results");
    } catch (err) {
      console.error("Pipeline error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  const isLoading = stage !== "idle" && stage !== "done" && stage !== "error";

  return (
    <div className="flex flex-col min-h-screen bg-white relative overflow-hidden">
      {/* Decorative side elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-32 -left-6 w-48 h-48 rounded-full bg-indigo-50 opacity-60" />
        <div className="absolute top-72 left-12 w-24 h-24 rounded-full bg-violet-50 opacity-50" />
        <div className="absolute top-[420px] -left-4 w-32 h-32 rounded-full bg-rose-50 opacity-40" />
        <div className="absolute top-20 left-20 w-3 h-3 rounded-full bg-indigo-200 opacity-80" />
        <div className="absolute top-48 left-8 w-2 h-2 rounded-full bg-violet-300 opacity-60" />
        <div className="absolute top-96 left-28 w-2.5 h-2.5 rounded-full bg-rose-200 opacity-70" />

        <div className="absolute top-20 -right-8 w-56 h-56 rounded-full bg-violet-50 opacity-50" />
        <div className="absolute top-80 right-16 w-28 h-28 rounded-full bg-indigo-50 opacity-40" />
        <div className="absolute top-[500px] -right-4 w-36 h-36 rounded-full bg-rose-50 opacity-40" />
        <div className="absolute top-36 right-24 w-3 h-3 rounded-full bg-violet-200 opacity-70" />
        <div className="absolute top-64 right-10 w-2 h-2 rounded-full bg-indigo-300 opacity-60" />
        <div className="absolute top-[450px] right-32 w-2.5 h-2.5 rounded-full bg-rose-200 opacity-70" />

        <div className="absolute top-40 left-0 w-16 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-40" />
        <div className="absolute top-60 right-0 w-20 h-px bg-gradient-to-l from-transparent via-violet-200 to-transparent opacity-40" />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 relative z-10">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto pt-20 sm:pt-28 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-3">
              Scout
            </h1>
            <p className="text-gray-500 text-lg font-light">
              Find the perfect API for your project
            </p>
          </div>

          <InputPanel
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        {/* Loading Indicator */}
        {isLoading && (
          <section className="w-full max-w-xl mx-auto mt-4 mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 p-8 shadow-sm">
              {/* Spinner */}
              <div className="flex justify-center mb-6">
                <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-500 animate-spin" />
              </div>

              {/* Status message */}
              <p className="text-center text-base font-medium text-gray-800 mb-6">
                {STAGE_MESSAGES[stage] || "Processing..."}
              </p>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400"
                  style={{ width: `${((getStageIndex(stage) + 1) / 4) * 100}%` }}
                />
              </div>

              {/* Step indicators */}
              <div className="flex justify-between">
                {PIPELINE_STEPS.map((step, i) => {
                  const currentIndex = getStageIndex(stage);
                  const isActive = step.key === stage;
                  const isCompleted = currentIndex > i;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          isActive
                            ? `${step.color} animate-pulse shadow-sm`
                            : isCompleted
                              ? `${step.color} opacity-80`
                              : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium transition-colors ${
                          isActive
                            ? "text-gray-800"
                            : isCompleted
                              ? "text-gray-600"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* How It Works Section */}
        {stage === "idle" && (
          <section className="w-full max-w-4xl mx-auto py-20 border-t border-gray-100">
            <h2 className="text-center text-2xl font-semibold text-gray-900 mb-2">
              How it works
            </h2>
            <p className="text-center text-gray-500 text-sm mb-12">
              From idea to integration in four simple steps
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step) => (
                <div key={step.number} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {step.icon}
                  </div>
                  <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                    Step {step.number}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center relative z-10">
        <p className="text-xs text-gray-400">
          Built with Next.js, Gemini AI, and Exa Search
        </p>
      </footer>
    </div>
  );
}
