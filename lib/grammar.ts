const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export function getArticle(word: string): "a" | "an" {
  if (!word) return "a";
  return VOWELS.has(word[0].toLowerCase()) ? "an" : "a";
}
