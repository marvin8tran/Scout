"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TypingAnimation from "@/components/TypingAnimation";
import { getArticle } from "@/lib/grammar";

const WORDS = [
  "weather",
  "payment",
  "authentication",
  "email",
  "image recognition",
  "analytics",
  "mapping",
  "translation",
  "database",
  "messaging",
  "OAuth",
  "SMS",
  "encryption",
  "geolocation",
];

const STEPS = [
  {
    number: "1",
    title: "Link your GitHub repo",
    description:
      "Provide a public GitHub repository URL so Scout can understand your tech stack.",
    example: "https://github.com/your-username/your-project",
    exampleType: "url" as const,
  },
  {
    number: "2",
    title: "Describe what you need",
    description:
      "Tell Scout what kind of API you're looking for in plain English.",
    example: null,
    exampleType: null,
  },
  {
    number: "3",
    title: "Get ranked recommendations",
    description:
      "Scout analyzes your stack and returns the top 3 APIs scored on compatibility, price, scalability, and maintenance — with ready-to-paste code snippets.",
    example: null,
    exampleType: null,
  },
];

const SPONSORS = ["Cognition AI", "Exa", "Gemini", "Monster Energy"];

export default function HomePage() {
  const [article, setArticle] = useState<"a" | "an">("a");

  const handleWordChange = (word: string) => {
    setArticle(getArticle(word));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-32 -left-6 w-48 h-48 rounded-full bg-indigo-50 opacity-60" />
        <div className="absolute top-72 left-12 w-24 h-24 rounded-full bg-violet-50 opacity-50" />
        <div className="absolute top-20 -right-8 w-56 h-56 rounded-full bg-violet-50 opacity-50" />
        <div className="absolute top-80 right-16 w-28 h-28 rounded-full bg-indigo-50 opacity-40" />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 relative z-10">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto pt-20 sm:pt-28 pb-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            I want {article}{" "}
            <TypingAnimation words={WORDS} onWordChange={handleWordChange} />
            {" "}API
          </h1>
          <p className="text-gray-500 text-lg font-light mb-10">
            Discover, compare, and integrate the best third-party APIs for your
            project.
          </p>

          {/* Scout logo */}
          <div className="flex justify-center mb-10">
            <Image
              src="/scout-logo.svg"
              alt="Scout logo"
              width={120}
              height={120}
              priority
            />
          </div>

          {/* CTA */}
          <Link
            href="/search"
            className="inline-block px-8 py-3 rounded-full text-white font-semibold text-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md hover:shadow-lg transition-all"
          >
            Start Searching
          </Link>
        </section>

        {/* How to Use Section */}
        <section className="w-full max-w-4xl mx-auto py-20 border-t border-gray-100">
          <h2 className="text-center text-2xl font-semibold text-gray-900 mb-2">
            How to Use Scout
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12">
            Three simple steps to find the perfect API
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="text-center group rounded-xl border border-gray-100 p-6 hover:border-indigo-100 hover:shadow-sm transition-all"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm mb-4">
                  {step.number}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {step.description}
                </p>
                {step.example && (
                  <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2">
                    <code className="text-xs text-gray-600 break-all">
                      {step.example}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sponsors */}
        <section className="w-full max-w-4xl mx-auto py-10 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-3">Powered by</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {SPONSORS.map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-gray-400"
              >
                {name}
              </span>
            ))}
          </div>
        </section>
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
