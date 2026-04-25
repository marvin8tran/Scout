"use client";

import { useState } from "react";
import InputPanel from "@/components/InputPanel";
import ResultsList from "@/components/ResultsList";
import type {
  AnalyzeRequest,
  ExtractedIntent,
  APICandidate,
  ScoredAPI,
  ScoutResult,
} from "@/types";

type Stage =
  | "idle"
  | "fetching"
  | "analyzing"
  | "searching"
  | "scoring"
  | "done"
  | "error";

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
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ScoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<AnalyzeRequest["priority"]>("scalability");

  const handleSubmit = async (data: AnalyzeRequest) => {
    setResult(null);
    setError(null);
    setActivePriority(data.priority);

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

      setResult({ intent, recommendations: scored });
      setStage("done");
    } catch (err) {
      console.error("Pipeline error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 flex flex-col items-center px-4">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto pt-20 sm:pt-32 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-3">
              API Scout
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Find the perfect API for your project
            </p>
          </div>

          <InputPanel
            onSubmit={handleSubmit}
            isLoading={stage !== "idle" && stage !== "done" && stage !== "error"}
          />
        </section>

        {/* Results */}
        <ResultsList result={result} stage={stage} error={error} priority={activePriority} />

        {/* How It Works Section */}
        {stage === "idle" && !result && (
          <section className="w-full max-w-4xl mx-auto py-20 border-t border-gray-100">
            <h2 className="text-center text-2xl font-semibold text-gray-900 mb-2">
              How it works
            </h2>
            <p className="text-center text-gray-400 text-sm mb-12">
              From idea to integration in four simple steps
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step) => (
                <div key={step.number} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 text-gray-400 mb-4 group-hover:bg-gray-900 group-hover:text-white transition-all">
                    {step.icon}
                  </div>
                  <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-1">
                    Step {step.number}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-gray-300">
          Built with Next.js, Gemini AI, and Exa Search
        </p>
      </footer>
    </div>
  );
}
