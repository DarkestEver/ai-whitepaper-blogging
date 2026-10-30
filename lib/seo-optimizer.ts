import "server-only";

/**
 * SEO optimization analysis:
 * - Keyword density & placement
 * - AEO (Answer Engine Optimization) metrics
 * - GEO targeting validation
 * - Word frequency analysis
 */

export interface KeywordMetrics {
  keyword: string;
  density: number; // percentage
  inTitle: boolean;
  inDescription: boolean;
  inFirstParagraph: boolean;
  count: number;
}

export interface SEOAnalysis {
  keywordMetrics: KeywordMetrics[];
  averageDensity: number;
  titleKeywordCoverage: number; // % of keywords in title
  descriptionKeywordCoverage: number; // % of keywords in description
  readabilityScore: number; // 0-100, higher is better
  wordCount: number;
  recommendedKeywords: string[];
  warnings: string[];
}

export interface AEOOptimization {
  peopleAlsoAskQuestions: string[]; // Generated FAQ-style questions
  featuredSnippetCandidate: string; // Best summary for featured snippet
  voiceSearchOptimized: boolean; // Conversational phrasing
  structuredDataType: "FAQPage" | "NewsArticle" | "ScholarlyArticle" | "Article";
  answerEngineKeywords: string[]; // Keywords optimized for answer engines
}

/**
 * Analyze content for SEO keyword optimization.
 */
export function analyzeSEOKeywords(
  title: string,
  description: string,
  content: string,
  keywords: string[],
): SEOAnalysis {
  const normalizedContent = content.toLowerCase();
  const normalizedTitle = title.toLowerCase();
  const normalizedDesc = description.toLowerCase();
  const firstParagraph = normalizedContent.split("\n\n")[0] || "";

  const wordCount = normalizedContent.split(/\s+/).length;

  const metrics: KeywordMetrics[] = keywords.map((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    const matches = (normalizedContent.match(new RegExp(escapeRegex(lowerKeyword), "g")) || []).length;
    const density = (matches / wordCount) * 100;

    return {
      keyword,
      density,
      inTitle: normalizedTitle.includes(lowerKeyword),
      inDescription: normalizedDesc.includes(lowerKeyword),
      inFirstParagraph: firstParagraph.includes(lowerKeyword),
      count: matches,
    };
  });

  // Calculate coverage percentages
  const titleCoverage = (metrics.filter((m) => m.inTitle).length / keywords.length) * 100;
  const descCoverage = (metrics.filter((m) => m.inDescription).length / keywords.length) * 100;
  const avgDensity = metrics.reduce((sum, m) => sum + m.density, 0) / (keywords.length || 1);

  // Readability: simpler = higher score
  const avgWordLength = normalizedContent.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / wordCount;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordLength - 4) * 5));

  const warnings: string[] = [];
  if (titleCoverage < 50) warnings.push("Less than 50% of keywords appear in title");
  if (descCoverage < 50) warnings.push("Less than 50% of keywords appear in description");
  if (avgDensity < 0.5) warnings.push("Keyword density too low (<0.5%)");
  if (avgDensity > 3) warnings.push("Keyword density too high (>3%), may appear spammy");
  if (wordCount < 300) warnings.push("Content too short (<300 words)");
  if (readabilityScore < 50) warnings.push("Content readability low, use shorter words/sentences");

  // Find keywords worth emphasizing
  const underRepresented = metrics
    .filter((m) => m.density < 0.3 && m.count === 0)
    .map((m) => m.keyword);

  return {
    keywordMetrics: metrics,
    averageDensity: avgDensity,
    titleKeywordCoverage: titleCoverage,
    descriptionKeywordCoverage: descCoverage,
    readabilityScore,
    wordCount,
    recommendedKeywords: underRepresented.slice(0, 5),
    warnings,
  };
}

/**
 * Generate AEO (Answer Engine Optimization) fields from content.
 * Optimizes for ChatGPT, Gemini, Claude, Perplexity, etc.
 */
export function generateAEOContent(
  title: string,
  summary: string,
  keyFacts: string[],
  faqItems: Array<{ question: string; answer: string }>,
  geoSummary: string,
): AEOOptimization {
  // Featured snippet: best 155-200 char summary
  const featuredSnippet = summary.slice(0, 180).trim() + (summary.length > 180 ? "..." : "");

  // Extract question patterns from FAQ (people also ask style)
  const peopleAlsoAsk = faqItems
    .slice(0, 5)
    .map((item) => item.question)
    .filter((q) => q.length < 100);

  // Check for conversational/voice-search optimization
  const voiceSearchTerms = [
    "how to",
    "what is",
    "why is",
    "when is",
    "where is",
    "can i",
    "should i",
    "is it",
  ];
  const contentLower = (title + " " + summary).toLowerCase();
  const voiceOptimized = voiceSearchTerms.some((term) => contentLower.includes(term));

  // Determine best schema.org type
  let schemaType: "FAQPage" | "NewsArticle" | "ScholarlyArticle" | "Article" = "Article";
  if (faqItems.length >= 3) schemaType = "FAQPage";
  if (geoSummary.length > 100) schemaType = "NewsArticle";
  if (title.toLowerCase().includes("research") || title.toLowerCase().includes("study")) {
    schemaType = "ScholarlyArticle";
  }

  // Answer engine keywords: focus on intent and entities
  const answerEngineKeywords = [
    ...new Set([
      // Extract entities from title
      title.split(/\s+/).filter((w) => w.length > 4 && !["this", "that", "what", "when"].includes(w)),
      // Add question words for conversational matches
      voiceSearchTerms.filter((term) => contentLower.includes(term)),
      // Include fact-based keywords
      keyFacts
        .slice(0, 3)
        .flatMap((fact) => fact.split(/\s+/).filter((w) => w.length > 5))
        .slice(0, 5),
    ].flat()),
  ].slice(0, 15);

  return {
    peopleAlsoAskQuestions: peopleAlsoAsk,
    featuredSnippetCandidate: featuredSnippet,
    voiceSearchOptimized: voiceOptimized,
    structuredDataType: schemaType,
    answerEngineKeywords: answerEngineKeywords as string[],
  };
}

/**
 * Calculate LSI (Latent Semantic Indexing) related keywords.
 * Finds semantically similar terms to boost relevance.
 */
export function suggestLSIKeywords(primary: string[], content: string): string[] {
  const contentWords = content
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4 && !isCommonWord(w));

  // Frequency analysis
  const frequency: Record<string, number> = {};
  for (const word of contentWords) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Return top words not in primary keywords
  const primarySet = new Set(primary.map((k) => k.toLowerCase()));
  const suggested = Object.entries(frequency)
    .filter(([word]) => !primarySet.has(word) && frequency[word] >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return suggested;
}

/**
 * Validate content for SEO best practices.
 */
export function validateSEOContent(
  title: string,
  seoDescription: string,
  seoKeywords: string[],
  content: string,
): { valid: boolean; errors: string[]; recommendations: string[] } {
  const errors: string[] = [];
  const recommendations: string[] = [];

  // Title validation
  if (title.length < 30) errors.push("Title too short (minimum 30 characters)");
  if (title.length > 70) errors.push("Title too long (maximum 70 characters)");
  if (!title.match(/[a-z0-9]/i)) errors.push("Title must contain alphanumeric characters");

  // Description validation
  if (seoDescription.length < 120) {
    recommendations.push("Description could be longer (120-180 characters ideal)");
  }
  if (seoDescription.length > 180) errors.push("Description too long (maximum 180 characters)");
  if (!seoDescription.includes(seoKeywords[0]?.toLowerCase() || "")) {
    recommendations.push("Primary keyword not in description");
  }

  // Keywords validation
  if (seoKeywords.length < 3) recommendations.push("Add at least 3 SEO keywords");
  if (seoKeywords.some((k) => k.length > 60)) errors.push("Some keywords exceed 60 characters");

  // Content validation
  if (!content || content.length < 300) errors.push("Content too short (minimum 300 characters)");

  return {
    valid: errors.length === 0,
    errors,
    recommendations,
  };
}

// --- Utilities ---

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const COMMON_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "this",
  "that",
  "these",
  "those",
  "as",
  "it",
  "not",
  "no",
  "yes",
]);

function isCommonWord(word: string): boolean {
  return COMMON_WORDS.has(word);
}
