export type InputMode = "github" | "snippet" | "description";
export type PriorityMode = "docs" | "scale";

export interface AnalyzeRequest {
  input: string;
  mode: InputMode;
  priority: PriorityMode;
}

export interface ExtractedIntent {
  task: string;
  category: string;
  language: string;
  framework: string | null;
  requirements: {
    needs_webhooks: boolean;
    needs_auth: boolean;
    needs_realtime: boolean;
    expected_scale: "low" | "medium" | "high";
    pricing_sensitive: boolean;
  };
  search_queries: string[];
}

export interface APICandidate {
  name: string;
  url: string;
  docs_url: string;
  description: string;
  raw_excerpt: string;
}

export interface ScoredAPI {
  name: string;
  url: string;
  docs_url: string;
  scores: {
    compatibility: number;
    price: number;
    scalability: number;
    maintenance: number;
  };
  final_score: number;
  winner_reason: string;
  tradeoff: string;
  snippet: string;
}

export interface ScoutResult {
  intent: ExtractedIntent;
  recommendations: ScoredAPI[];
}
