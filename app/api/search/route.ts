import { NextResponse } from "next/server";
import { getExa } from "@/lib/exa";
import type { ExtractedIntent, APICandidate } from "@/types";

export async function POST(request: Request) {
  try {
    const intent: ExtractedIntent = await request.json();

    const allResults: APICandidate[] = [];
    const seenDomains = new Set<string>();

    for (const query of intent.search_queries) {
      const response = await getExa().searchAndContents(query, {
        numResults: 5,
        text: { maxCharacters: 2000 },
      });

      for (const result of response.results) {
        let domain: string;
        try {
          domain = new URL(result.url).hostname;
        } catch {
          continue;
        }

        if (seenDomains.has(domain)) continue;
        seenDomains.add(domain);

        allResults.push({
          name: result.title || domain,
          url: result.url,
          docs_url: result.url,
          description: result.text?.slice(0, 200) || "",
          raw_excerpt: result.text || "",
          pricing_excerpt: "",
        });
      }
    }

    const candidates = allResults.slice(0, 8);

    // Second pass: targeted pricing queries for each candidate
    const exa = getExa();
    for (const candidate of candidates) {
      const pricingQuery = `${candidate.name} API pricing plans free tier cost per request`;
      const rateLimitQuery = `${candidate.name} API rate limits requests per second`;

      const [pricingRes, rateLimitRes] = await Promise.all([
        exa
          .searchAndContents(pricingQuery, {
            numResults: 2,
            text: { maxCharacters: 2000 },
          })
          .catch(() => null),
        exa
          .searchAndContents(rateLimitQuery, {
            numResults: 2,
            text: { maxCharacters: 2000 },
          })
          .catch(() => null),
      ]);

      const excerpts: string[] = [];
      if (pricingRes) {
        for (const r of pricingRes.results) {
          if (r.text) excerpts.push(r.text);
        }
      }
      if (rateLimitRes) {
        for (const r of rateLimitRes.results) {
          if (r.text) excerpts.push(r.text);
        }
      }

      candidate.pricing_excerpt = excerpts.join("\n\n---\n\n");
    }

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("search error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to search for APIs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
