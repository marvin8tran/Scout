"use client";

import { useState, useEffect, useRef } from "react";
import { inferProgressSteps } from "@/lib/devinProgress";
import type { DevinProgressStep } from "@/types";

interface DevinProgressTrackerProps {
  sessionId: string;
  apiName: string;
  onComplete?: (prUrl: string) => void;
  onError?: (error: string) => void;
}

export default function DevinProgressTracker({
  sessionId,
  apiName,
  onComplete,
  onError,
}: DevinProgressTrackerProps) {
  const [steps, setSteps] = useState<DevinProgressStep[]>(() =>
    inferProgressSteps("pending")
  );
  const [sessionStatus, setSessionStatus] = useState<string>("pending");
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAt = useRef(0);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  useEffect(() => {
    mountedRef.current = true;
    startedAt.current = performance.now();

    const timerInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((performance.now() - startedAt.current) / 1000));
    }, 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    if (sessionStatus === "completed" || sessionStatus === "failed") return;

    const pollInterval = sessionStatus === "pending" ? 10000 : 5000;

    const doPoll = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch("/api/devin/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!mountedRef.current) return;
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to check status");

        const elapsed = Math.floor((performance.now() - startedAt.current) / 1000);
        setElapsedSeconds(elapsed);
        setSessionStatus(data.status);
        if (data.url) setSessionUrl(data.url);

        const newSteps = inferProgressSteps(data.status, data.message, elapsed);
        setSteps(newSteps);

        if (data.status === "completed") {
          if (data.prUrl) {
            setPrUrl(data.prUrl);
            onCompleteRef.current?.(data.prUrl);
          } else {
            const msg = "Session completed but no pull request was created";
            setErrorMessage(msg);
            setSessionStatus("failed");
            setSteps(inferProgressSteps("failed", msg, elapsed));
            onErrorRef.current?.(msg);
          }
          return;
        }

        if (data.status === "failed") {
          const msg = data.message || "Devin session failed";
          setErrorMessage(msg);
          onErrorRef.current?.(msg);
          return;
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : "Failed to check status";
        setErrorMessage(msg);
        setSessionStatus("failed");
        const elapsed = Math.floor((performance.now() - startedAt.current) / 1000);
        setSteps(inferProgressSteps("failed", msg, elapsed));
        onErrorRef.current?.(msg);
      }
    };

    doPoll();
    const id = setInterval(doPoll, pollInterval);
    return () => clearInterval(id);
  }, [sessionId, sessionStatus]);

  const timedOut = elapsedSeconds >= 600;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPct = sessionStatus === "completed"
    ? 100
    : Math.round((completedCount / steps.length) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sessionStatus !== "completed" && sessionStatus !== "failed" && (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          )}
          <div>
            <p className="text-sm font-medium text-zinc-800">
              {sessionStatus === "completed"
                ? `${apiName} integrated successfully`
                : sessionStatus === "failed"
                  ? `Failed to integrate ${apiName}`
                  : `Integrating ${apiName}...`}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Elapsed: {formatTime(elapsedSeconds)}
            </p>
          </div>
        </div>
        {sessionUrl && (
          <a
            href={sessionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
          >
            Watch live on Devin
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-4.5L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{progressPct}% complete</span>
          <span>{completedCount}/{steps.length} steps</span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 to-emerald-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps timeline */}
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-start gap-3">
            {/* Connector + icon */}
            <div className="flex flex-col items-center">
              {step.status === "completed" ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              ) : step.status === "active" ? (
                <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              ) : step.status === "failed" ? (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-zinc-200 bg-white shrink-0" />
              )}
              {i < steps.length - 1 && (
                <div
                  className={`w-0.5 h-6 ${
                    step.status === "completed" ? "bg-emerald-300" : "bg-zinc-200"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <div className="pt-0.5">
              <p
                className={`text-sm leading-6 ${
                  step.status === "completed"
                    ? "text-zinc-600"
                    : step.status === "active"
                      ? "text-zinc-900 font-medium"
                      : step.status === "failed"
                        ? "text-red-600 font-medium"
                        : "text-zinc-400"
                }`}
              >
                {step.label}
                {step.status === "active" && (
                  <span className="inline-flex ml-1.5">
                    <span className="animate-bounce [animation-delay:0ms] inline-block w-1 h-1 rounded-full bg-amber-400 mx-px" />
                    <span className="animate-bounce [animation-delay:150ms] inline-block w-1 h-1 rounded-full bg-amber-400 mx-px" />
                    <span className="animate-bounce [animation-delay:300ms] inline-block w-1 h-1 rounded-full bg-amber-400 mx-px" />
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeout warning */}
      {timedOut && sessionStatus !== "completed" && sessionStatus !== "failed" && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-amber-500 text-sm mt-0.5">⏱</span>
          <div>
            <p className="text-xs text-amber-700 font-medium">Taking longer than expected</p>
            {sessionUrl && (
              <a
                href={sessionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 hover:underline"
              >
                Check progress on Devin →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Completed state */}
      {sessionStatus === "completed" && prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          View Pull Request
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-4.5L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )}

      {/* Failed state */}
      {sessionStatus === "failed" && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">
            {errorMessage || "Failed to generate integration. Please try again."}
          </p>
        </div>
      )}
    </div>
  );
}
