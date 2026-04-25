export type InputMode = "github" | "snippet";
export type PriorityMode = "scalability" | "cheapest" | "maintenance";

export interface AnalyzeRequest {
  input: string;          // code snippet or GitHub URL content
  chatMessage: string;    // user's chat message describing desired API + priority
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
  pricing_excerpt: string;
}

export interface PricingDetails {
  free_tier: string | null;
  paid_starting_price: string | null;
  rate_limit: string | null;
  monthly_capacity: string | null;
  last_updated: string | null;
  data_source: string | null;
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
  pricing_details: PricingDetails;
}

export interface ScoutResult {
  intent: ExtractedIntent;
  recommendations: ScoredAPI[];
}

export interface DevinTriggerRequest {
  repoUrl: string;
  selectedAPI: ScoredAPI;
  intent: ExtractedIntent;
}

export interface DevinSessionStatus {
  sessionId: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  prUrl?: string;
}
