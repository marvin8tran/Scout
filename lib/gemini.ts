import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

export function getGeminiModel(systemInstruction?: string): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemInstruction,
  });
}
