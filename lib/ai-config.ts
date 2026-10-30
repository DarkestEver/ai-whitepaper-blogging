/**
 * AI Configuration and Provider Setup
 * Currently configured for Anthropic Claude 3.5 Sonnet
 */

export interface AIProviderConfig {
  provider: "anthropic" | "openai" | "gemini";
  model: string;
  apiKey: string;
  apiUrl?: string;
  maxTokens: number;
  temperature: number;
  costPerMTok: number; // Cost per 1M tokens
}

export function getAIProviderConfig(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();

  if (provider === "anthropic") {
    return {
      provider: "anthropic",
      model: process.env.AI_MODEL || "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY || "",
      apiUrl: "https://api.anthropic.com/v1",
      maxTokens: 4096,
      temperature: 0.7,
      costPerMTok: 1.5, // Input: $0.8, Output: $2.4, average $1.5
    };
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      model: process.env.AI_MODEL || "gpt-4-turbo",
      apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "",
      apiUrl: "https://api.openai.com/v1",
      maxTokens: 4096,
      temperature: 0.7,
      costPerMTok: 15.0, // GPT-4 turbo average
    };
  }

  if (provider === "gemini") {
    return {
      provider: "gemini",
      model: process.env.AI_MODEL || "gemini-1.5-pro",
      apiKey: process.env.GOOGLE_AI_API_KEY || process.env.AI_API_KEY || "",
      maxTokens: 8192,
      temperature: 0.7,
      costPerMTok: 2.5, // Approximate average
    };
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

export function validateAIConfig(): { valid: boolean; error?: string } {
  try {
    const config = getAIProviderConfig();

    if (!config.apiKey) {
      return {
        valid: false,
        error: `${config.provider.toUpperCase()}_API_KEY environment variable is not set`,
      };
    }

    if (config.apiKey.length < 10) {
      return {
        valid: false,
        error: `${config.provider.toUpperCase()}_API_KEY appears to be invalid (too short)`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const SYSTEM_PROMPT = `You are a research whitepaper generation assistant specializing in technical and industry analysis.

CORE RESPONSIBILITIES:
1. Generate well-researched, factual whitepapers
2. Include specific page citations from source documents
3. Structure content with clear sections and takeaways
4. Maintain professional, academic tone
5. Support claims with verifiable facts

OUTPUT FORMAT:
- Title: Clear, SEO-friendly
- Summary: 1-2 paragraph executive summary
- Abstract: 3-4 paragraph deep dive
- Key Takeaways: 3-5 bullet points
- Sections: Use H2 headers with 200-400 words each
- Key Facts: List 5-10 important facts with page citations
- Key Entities: People, companies, technologies mentioned
- FAQ Items: 3-5 Q&A pairs addressing common questions

CITATION REQUIREMENT:
Every factual claim MUST include a page citation in format: [Source, p. XX]
Example: "According to the 2023 Industry Report [p. 5], market growth exceeded 25%..."

VALIDATION CHECKLIST:
✓ All claims have sources and page numbers
✓ No unsupported statements or speculation
✓ Content is original (not copy-paste from source)
✓ Tone is professional and neutral
✓ Structure is logical and complete
✓ Facts are current and relevant`;
