"use client";

import { useState } from "react";
import type { InputMode, PriorityMode, AnalyzeRequest } from "@/types";

const MODE_TABS: { label: string; value: InputMode }[] = [
  { label: "GitHub URL", value: "github" },
  { label: "Code Snippet", value: "snippet" },
  { label: "Plain English", value: "description" },
];

interface InputPanelProps {
  onSubmit: (data: AnalyzeRequest) => void;
  isLoading: boolean;
}

export default function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [mode, setMode] = useState<InputMode>("github");
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<PriorityMode>("docs");

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit({ input: input.trim(), mode, priority });
  };

  const placeholder: Record<InputMode, string> = {
    github: "https://github.com/owner/repo",
    snippet:
      "Paste your code here...\n\ne.g. a function that needs an external API",
    description:
      "Describe what you need...\n\ne.g. I want an API that handles payments like Stripe",
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Mode Tabs */}
      <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setMode(tab.value)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === tab.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      {mode === "github" ? (
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder[mode]}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      ) : (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder[mode]}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none font-mono"
        />
      )}

      {/* Priority Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Priority Mode
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPriority("docs")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              priority === "docs"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            Compatibility
          </button>
          <button
            onClick={() => setPriority("scale")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              priority === "scale"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            Scalability
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Scouting..." : "Scout APIs"}
      </button>
    </div>
  );
}
