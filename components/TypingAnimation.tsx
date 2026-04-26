"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TypingAnimationProps {
  words: string[];
  onWordChange?: (word: string) => void;
}

export default function TypingAnimation({
  words,
  onWordChange,
}: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState("");
  const wordIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const onWordChangeRef = useRef(onWordChange);
  const wordsRef = useRef(words);

  useEffect(() => {
    onWordChangeRef.current = onWordChange;
  }, [onWordChange]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  const tick = useCallback(() => {
    const word = wordsRef.current[wordIndexRef.current];

    if (isDeletingRef.current) {
      setDisplayText((prev) => {
        const next = prev.slice(0, -1);
        if (next === "") {
          isDeletingRef.current = false;
          wordIndexRef.current =
            (wordIndexRef.current + 1) % wordsRef.current.length;
          const newWord = wordsRef.current[wordIndexRef.current];
          onWordChangeRef.current?.(newWord);
        }
        return next;
      });
    } else {
      setDisplayText((prev) => {
        const next = word.slice(0, prev.length + 1);
        if (next === word) {
          setTimeout(() => {
            isDeletingRef.current = true;
            setDisplayText((p) => p.slice(0, -1));
          }, 1500);
        }
        return next;
      });
    }
  }, []);

  useEffect(() => {
    onWordChangeRef.current?.(wordsRef.current[0]);
  }, []);

  useEffect(() => {
    const speed = isDeletingRef.current ? 50 : 80;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [displayText, tick]);

  return (
    <span className="text-indigo-500">
      {displayText}
      <span
        className="inline-block w-[3px] h-[1em] bg-indigo-400 ml-0.5 align-baseline"
        style={{ animation: "blink 1s step-end infinite" }}
      />
    </span>
  );
}
