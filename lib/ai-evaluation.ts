/**
 * AI Generation Evaluation Framework
 * Validates output quality, citations, and factual accuracy
 */

export interface EvaluationCriteria {
  name: string;
  weight: number; // 0-1
  check: (output: string) => boolean;
  errorMessage: string;
}

export interface EvaluationResult {
  passed: boolean;
  score: number; // 0-100
  checks: { name: string; passed: boolean; message: string }[];
  warnings: string[];
}

// Quality evaluation criteria
export const EVALUATION_CRITERIA: EvaluationCriteria[] = [
  {
    name: "Has Title",
    weight: 0.1,
    check: (output) => /^#{1,2}\s+.{10,150}$/m.test(output),
    errorMessage: "Output must have a title (# or ##)",
  },
  {
    name: "Has Summary",
    weight: 0.15,
    check: (output) => /##\s+Summary/i.test(output) && output.split("\n").slice(0, 30).join("\n").length > 200,
    errorMessage: "Output must include a Summary section with sufficient content",
  },
  {
    name: "Has Sections",
    weight: 0.15,
    check: (output) => (output.match(/^##\s+\w+/gm) || []).length >= 3,
    errorMessage: "Output must have at least 3 main sections",
  },
  {
    name: "Has Citations",
    weight: 0.3,
    check: (output) => /\[.*?[Pp](?:age)?\.?\s*\d+.*?\]/g.test(output),
    errorMessage: "Output must include page citations [Source, p. XX]",
  },
  {
    name: "Has Key Takeaways",
    weight: 0.1,
    check: (output) => /^##\s+(?:Key\s+)?Takeaways?/im.test(output),
    errorMessage: "Output must have a Key Takeaways section",
  },
  {
    name: "Has Key Facts",
    weight: 0.1,
    check: (output) => /^##\s+(?:Key\s+)?Facts?/im.test(output),
    errorMessage: "Output must have a Key Facts section",
  },
  {
    name: "Has FAQ",
    weight: 0.09,
    check: (output) => /^##\s+(?:FAQ|Questions?)/im.test(output),
    errorMessage: "Output should include an FAQ section",
  },
];

export function evaluateAIOutput(output: string): EvaluationResult {
  const checks = EVALUATION_CRITERIA.map((criterion) => {
    const passed = criterion.check(output);
    return {
      name: criterion.name,
      passed,
      message: passed ? "✓ Passed" : criterion.errorMessage,
    };
  });

  const score = checks.reduce((sum, check, idx) => {
    const weight = EVALUATION_CRITERIA[idx].weight;
    return sum + (check.passed ? weight * 100 : 0);
  }, 0);

  const warnings: string[] = [];

  // Check citation percentage
  const citationPattern = /\[.*?[Pp](?:age)?\.?\s*\d+.*?\]/g;
  const citations = output.match(citationPattern) || [];
  const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const citationRatio = citations.length / Math.max(sentences.length, 1);

  if (citationRatio < 0.3) {
    warnings.push(`Low citation coverage: ${Math.round(citationRatio * 100)}% of sentences have citations (target: 30%+)`);
  }

  // Check for unsupported claims
  const unsupportedPatterns = [
    /\b(?:obviously|clearly|everyone knows|it's common knowledge)/i,
    /\b(?:we believe|we think|in our opinion)\b/i,
  ];

  for (const pattern of unsupportedPatterns) {
    if (pattern.test(output)) {
      warnings.push("Found unsupported claim language. All facts must be cited.");
    }
  }

  return {
    passed: checks.every((c) => c.passed),
    score: Math.round(score),
    checks,
    warnings,
  };
}

// Test fixtures for evaluation
export const TEST_FIXTURES = {
  good: {
    input: "Technology trends in cloud computing for 2024",
    expectedSections: ["Summary", "Cloud Evolution", "Security", "Cost Optimization", "Key Takeaways", "FAQ"],
    expectedCitations: 5,
  },
  mediocre: {
    input: "Benefits of remote work",
    expectedSections: ["Summary", "Productivity", "Cost Savings"],
    expectedCitations: 3,
  },
  poor: {
    input: "AI is the future",
    expectedSections: [],
    expectedCitations: 0,
  },
};

export function citationCoverageScore(output: string): number {
  const citationPattern = /\[.*?[Pp](?:age)?\.?\s*\d+.*?\]/g;
  const citations = (output.match(citationPattern) || []).length;
  const factClaims = (output.match(/(?:according|report|data|study|research|found|indicates|shows)/gi) || []).length;

  if (factClaims === 0) return 0;
  return Math.min(100, Math.round((citations / factClaims) * 100));
}
