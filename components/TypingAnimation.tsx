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
  const isPausedRef = useRef(false);
  const onWordChangeRef = useRef(onWordChange);
  const wordsRef = useRef(words);
  const displayTextRef = useRef("");

  useEffect(() => {
    onWordChangeRef.current = onWordChange;
  }, [onWordChange]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  const tick = useCallback(() => {
    if (isPausedRef.current) return;

    const word = wordsRef.current[wordIndexRef.current];

    if (isDeletingRef.current) {
      const next = displayTextRef.current.slice(0, -1);
      displayTextRef.current = next;
      setDisplayText(next);

      if (next === "") {
        isDeletingRef.current = false;
        wordIndexRef.current =
          (wordIndexRef.current + 1) % wordsRef.current.length;
        const newWord = wordsRef.current[wordIndexRef.current];
        onWordChangeRef.current?.(newWord);
      }
    } else {
      const next = word.slice(0, displayTextRef.current.length + 1);
      displayTextRef.current = next;
      setDisplayText(next);

      if (next === word) {
        isPausedRef.current = true;
        setTimeout(() => {
          isPausedRef.current = false;
          isDeletingRef.current = true;
          const deleted = displayTextRef.current.slice(0, -1);
          displayTextRef.current = deleted;
          setDisplayText(deleted);
        }, 1500);
      }
    }
  }, []);

  useEffect(() => {
    onWordChangeRef.current?.(wordsRef.current[0]);
  }, []);

  useEffect(() => {
    if (isPausedRef.current) return;
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
