"use client";

interface DevinStatusProps {
  status: "generating" | "pr-done" | "pr-failed";
  apiName: string;
  prUrl?: string;
  errorMessage?: string;
}

export default function DevinStatus({
  status,
  apiName,
  prUrl,
  errorMessage,
}: DevinStatusProps) {
  if (status === "generating") {
    return (
      <div className="w-full max-w-2xl mx-auto mt-6 p-6 rounded-xl border border-blue-100 bg-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-700">
            Devin is forking your repo and generating integration code for{" "}
            <span className="font-medium">{apiName}</span>...
          </p>
        </div>
      </div>
    );
  }

  if (status === "pr-done") {
    return (
      <div className="w-full max-w-2xl mx-auto mt-6 p-6 rounded-xl border border-emerald-100 bg-emerald-50">
        <p className="text-sm text-emerald-700 mb-3">
          Devin created a pull request for{" "}
          <span className="font-medium">{apiName}</span>!
        </p>
        {prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            View Pull Request
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    );
  }

  if (status === "pr-failed") {
    return (
      <div className="w-full max-w-2xl mx-auto mt-6 p-6 rounded-xl border border-red-100 bg-red-50">
        <p className="text-sm text-red-700">
          {errorMessage || "Failed to generate integration. Please try again."}
        </p>
      </div>
    );
  }

  return null;
}
