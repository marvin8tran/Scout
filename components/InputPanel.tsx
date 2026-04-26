"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PriorityMode, AnalyzeRequest } from "@/types";
import { isValidGitHubUrl } from "@/lib/github";

const PLACEHOLDER_EXAMPLES = [
  "authentication",
  "payment",
  "mapping",
  "email",
  "weather",
  "translation",
  "image recognition",
  "database",
  "analytics",
  "messaging",
];

const PRIORITY_KEYWORDS: { value: PriorityMode; keywords: string[] }[] = [
  { value: "scalability", keywords: ["scale", "scalab", "traffic", "high volume", "enterprise", "performance"] },
  { value: "cheapest", keywords: ["cheap", "budget", "free", "cost", "price", "afford", "inexpensive", "low cost"] },
  { value: "maintenance", keywords: ["maintain", "update", "active", "support", "communit", "deprecat", "outdated", "fresh", "latest"] },
];

interface InputPanelProps {
  onSubmit: (data: AnalyzeRequest) => void;
  isLoading: boolean;
}

export default function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [input, setInput] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<PriorityMode>("scalability");
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && chatMessage.length > 0) return;
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isFocused, chatMessage]);

  const detectPriority = useCallback((text: string): PriorityMode | null => {
    const lower = text.toLowerCase();
    for (const opt of PRIORITY_KEYWORDS) {
      if (opt.keywords.some((kw) => lower.includes(kw))) {
        return opt.value;
      }
    }
    return null;
  }, []);

  const handleDetailsChange = (text: string) => {
    setDetails(text);
    const detected = detectPriority(text);
    if (detected) setPriority(detected);
  };

  const [urlError, setUrlError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!chatMessage.trim() || !input.trim()) return;
    const validation = isValidGitHubUrl(input.trim());
    if (!validation.valid) {
      setUrlError(validation.error ?? "Invalid GitHub URL");
      return;
    }
    setUrlError(null);
    const fullMessage = details.trim()
      ? `${chatMessage.trim()}. Additional details: ${details.trim()}`
      : chatMessage.trim();
    onSubmit({ input: input.trim(), chatMessage: fullMessage, mode: "github", priority });
  };

  const showPlaceholder = !isFocused && chatMessage.length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      {/* Hero Search Bar */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-0 text-2xl sm:text-4xl font-light text-gray-900 tracking-tight">
          <span className="whitespace-nowrap">I want a</span>
          <div className="relative mx-2 inline-flex items-center min-w-[180px] sm:min-w-[260px]">
            <input
              ref={inputRef}
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-indigo-500 outline-none text-center text-2xl sm:text-4xl font-light text-gray-900 pb-1 transition-colors placeholder-transparent"
            />
            {showPlaceholder && (
              <span
                key={currentPlaceholder}
                className="absolute inset-0 flex items-center justify-center text-2xl sm:text-4xl font-light text-gray-300 pointer-events-none pb-1 animate-[fade-in-up_0.4s_ease-out]"
              >
                {PLACEHOLDER_EXAMPLES[currentPlaceholder]}
              </span>
            )}
          </div>
          <span className="whitespace-nowrap">API</span>
        </div>

        {/* More Details */}
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Add more details</p>
          <div className="max-w-lg mx-auto">
            <textarea
              value={details}
              onChange={(e) => handleDetailsChange(e.target.value)}
              placeholder="e.g. I need something scalable and well-maintained, price is not a concern. Must support webhooks."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-sm resize-none transition-all"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !chatMessage.trim() || !input.trim()}
          className="mt-6 px-8 py-3 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </span>
          ) : (
            "Find APIs"
          )}
        </button>
      </div>

      {/* GitHub Repo Input */}
      <div className="space-y-4">
        <p className="text-center text-sm text-gray-400 uppercase tracking-widest font-medium">
          Provide your GitHub repository
        </p>

        <div className="max-w-2xl mx-auto">
          <input
            type="url"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (urlError) setUrlError(null);
            }}
            onBlur={() => {
              if (input.trim()) {
                const check = isValidGitHubUrl(input.trim());
                setUrlError(check.valid ? null : (check.error ?? "Invalid GitHub URL"));
              } else {
                setUrlError(null);
              }
            }}
            placeholder="https://github.com/owner/repo"
            className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-sm transition-all"
          />
          {urlError && <p className="text-xs text-red-500 mt-1 text-center">{urlError}</p>}
        </div>
      </div>
    </div>
  );
}
