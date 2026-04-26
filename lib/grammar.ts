const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const VOWEL_SOUND_LETTERS = new Set(["a", "e", "f", "h", "i", "l", "m", "n", "o", "r", "s", "x"]);

function isAcronym(word: string): boolean {
  return word === word.toUpperCase() && word.length <= 5;
}

export function getArticle(word: string): "a" | "an" {
  if (!word) return "a";
  if (isAcronym(word)) {
    return VOWEL_SOUND_LETTERS.has(word[0].toLowerCase()) ? "an" : "a";
  }
  return VOWELS.has(word[0].toLowerCase()) ? "an" : "a";
}
