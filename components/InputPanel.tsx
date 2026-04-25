"use client";

import { useState } from "react";
import type { InputMode, PriorityMode, AnalyzeRequest } from "@/types";

const PRIORITY_OPTIONS: { label: string; value: PriorityMode; keywords: string[] }[] = [
  { label: "Scalability", value: "scalability", keywords: ["scale", "scalab", "traffic", "high volume", "enterprise", "performance"] },
  { label: "Cheapest Price", value: "cheapest", keywords: ["cheap", "budget", "free", "cost", "price", "afford", "inexpensive", "low cost"] },
  { label: "Maintenance", value: "maintenance", keywords: ["maintain", "update", "active", "support", "communit", "deprecat", "outdated", "fresh", "latest"] },
];

interface InputPanelProps {
  onSubmit: (data: AnalyzeRequest) => void;
  isLoading: boolean;
}

export default function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [mode, setMode] = useState<InputMode | null>(null);
  const [input, setInput] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [priority, setPriority] = useState<PriorityMode>("scalability");

  const detectPriority = (text: string): PriorityMode | null => {
    const lower = text.toLowerCase();
    for (const opt of PRIORITY_OPTIONS) {
      if (opt.keywords.some((kw) => lower.includes(kw))) {
        return opt.value;
      }
    }
    return null;
  };

  const handleChatChange = (text: string) => {
    setChatMessage(text);
    const detected = detectPriority(text);
    if (detected) setPriority(detected);
  };

  const handleSubmit = () => {
    if (!input.trim() || !chatMessage.trim() || !mode) return;
    onSubmit({ input: input.trim(), chatMessage: chatMessage.trim(), mode, priority });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Step 1 — Source Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("snippet")}
          className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
            mode === "snippet"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
          }`}
        >
          <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Code Snippet</span>
        </button>
        <button
          onClick={() => setMode("github")}
          className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
            mode === "github"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
          }`}
        >
          <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">GitHub Link</span>
        </button>
      </div>

      {/* Step 2 — Source Input (shown after mode selection) */}
      {mode && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {mode === "github" ? "GitHub Repository URL" : "Paste your code"}
          </label>
          {mode === "github" ? (
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your code here...&#10;&#10;e.g. a function that needs an external API"
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none font-mono"
            />
          )}
        </div>
      )}

      {/* Step 3 — Chat Input + Send Button */}
      {mode && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={chatMessage}
              onChange={(e) => handleChatChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Describe the API you need"
              rows={2}
              className="w-full pl-4 pr-12 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim() || !chatMessage.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Scout APIs"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Priority Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">Priority:</span>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  priority === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
