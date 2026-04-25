import { useState, useEffect } from "react";

export function useTypewriter(text: string, speed: number = 20) {
  const [index, setIndex] = useState(0);
  const [prevText, setPrevText] = useState(text);

  // Reset index when text changes (setState-during-render pattern)
  if (prevText !== text) {
    setPrevText(text);
    setIndex(0);
  }

  useEffect(() => {
    if (index >= text.length) return;

    const timeout = setTimeout(() => {
      const char = text[index];
      const isWhitespace = char === " " || char === "\n" || char === "\t";
      if (isWhitespace && index + 1 < text.length) {
        let end = index + 1;
        while (
          end < text.length &&
          (text[end] === " " || text[end] === "\n" || text[end] === "\t")
        ) {
          end++;
        }
        setIndex(end);
      } else {
        setIndex(index + 1);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [index, text, speed]);

  return {
    displayedText: text.slice(0, index),
    isComplete: index >= text.length,
  };
}
