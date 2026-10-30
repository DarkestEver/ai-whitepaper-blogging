import "server-only";

/**
 * Manages site-level category and tag taxonomies.
 * Validates AI-generated categories/tags against site constraints.
 * Handles normalization and deduplication.
 */

export interface TaxonomyConfig {
  allowedCategories?: string[];
  allowedTags?: string[];
  maxTags?: number;
  requireCategory?: boolean;
  tagNormalizationRules?: {
    lowercase?: boolean;
    removeSpecialChars?: boolean;
    maxLength?: number;
  };
}

export interface TaxonomyValidation {
  category: string | null;
  tags: string[];
  valid: boolean;
  warnings: string[];
  suggestedCategory?: string;
  suggestedTags?: string[];
}

/**
 * Predefined category taxonomies for common industries.
 */
const INDUSTRY_TAXONOMIES: Record<string, string[]> = {
  technology: [
    "AI & Machine Learning",
    "Cloud Computing",
    "Cybersecurity",
    "Data Science",
    "DevOps",
    "Enterprise Software",
    "IoT",
    "Mobile Development",
    "Software Architecture",
    "Web Development",
  ],
  finance: [
    "Banking",
    "Blockchain & Crypto",
    "Capital Markets",
    "Corporate Finance",
    "Fintech",
    "Insurance",
    "Investment",
    "Payment Systems",
    "Risk Management",
    "Trading",
  ],
  healthcare: [
    "Biotech",
    "Clinical Research",
    "Digital Health",
    "Drug Development",
    "Healthcare IT",
    "Hospital Management",
    "Medical Devices",
    "Pharmaceuticals",
    "Public Health",
    "Telemedicine",
  ],
  energy: [
    "Fossil Fuels",
    "Grid Modernization",
    "Nuclear",
    "Renewable Energy",
    "Smart Grid",
    "Sustainability",
    "Utilities",
  ],
  manufacturing: [
    "Automation",
    "Industry 4.0",
    "IoT & Sensors",
    "Logistics",
    "Operations",
    "Robotics",
    "Supply Chain",
  ],
};

/**
 * Get taxonomy for a given industry.
 */
export function getTaxonomyForIndustry(industry: string): string[] {
  const key = industry.toLowerCase().replace(/[^a-z]+/g, "");
  return INDUSTRY_TAXONOMIES[key] || getDefaultCategories();
}

/**
 * Get default/universal categories.
 */
export function getDefaultCategories(): string[] {
  return [
    "Analysis",
    "Best Practices",
    "Case Study",
    "Emerging Trends",
    "Guide",
    "Industry News",
    "Innovation",
    "Regulation",
    "Report",
    "Research",
    "Strategy",
    "Technology",
    "Thought Leadership",
    "Tools & Resources",
  ];
}

/**
 * Normalize a tag for consistent storage/matching.
 */
export function normalizeTag(tag: string, maxLength = 50): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/^-|-$/g, "") // Trim hyphens
    .slice(0, maxLength);
}

/**
 * Validate category and tags against site taxonomy.
 */
export function validateTaxonomy(
  category: string,
  tags: string[],
  config: TaxonomyConfig = {},
): TaxonomyValidation {
  const warnings: string[] = [];
  let validCategory: string | null = null;
  let suggestedCategory: string | undefined;
  const validTags = new Set<string>();
  const suggestedTags: string[] = [];

  const normRules = config.tagNormalizationRules || { lowercase: true, removeSpecialChars: true, maxLength: 50 };
  const allowedCats = config.allowedCategories || getDefaultCategories();
  const allowedTags = config.allowedTags || [];
  const maxTags = config.maxTags || 20;

  // Validate category
  if (!category || category.trim().length === 0) {
    if (config.requireCategory) {
      warnings.push("Category is required but not provided");
    }
  } else {
    const normalized = normalizeCategory(category);
    const match = findClosestMatch(normalized, allowedCats);

    if (match && match.similarity > 0.7) {
      validCategory = match.value;
    } else {
      warnings.push(`Category "${category}" not in allowed list`);
      suggestedCategory = match?.value;
    }
  }

  // Validate tags
  const processedTags = new Set<string>();
  for (const tag of tags) {
    if (tag.trim().length === 0) continue;

    const normalized = normalizeRuleTag(tag, normRules);
    if (normalized.length === 0) continue;

    // Avoid duplicates
    if (processedTags.has(normalized)) {
      warnings.push(`Duplicate tag (normalized): "${normalized}"`);
      continue;
    }
    processedTags.add(normalized);

    // Check allowed tags (if configured)
    if (allowedTags.length > 0) {
      const match = findClosestMatch(normalized, allowedTags);
      if (match && match.similarity > 0.7) {
        validTags.add(match.value);
      } else {
        warnings.push(`Tag "${tag}" not in allowed list`);
        if (match) suggestedTags.push(match.value);
      }
    } else {
      // No constraints, just use normalized tag
      validTags.add(normalized);
    }
  }

  // Check tag count
  if (validTags.size > maxTags) {
    warnings.push(`Too many tags (${validTags.size}), max is ${maxTags}`);
  }

  return {
    category: validCategory,
    tags: Array.from(validTags).slice(0, maxTags),
    valid: !validCategory || warnings.length === 0,
    warnings,
    suggestedCategory,
    suggestedTags: [...new Set(suggestedTags)].slice(0, 3),
  };
}

/**
 * Find semantic tags based on content analysis.
 */
export function generateSemanticTags(
  title: string,
  summary: string,
  keyEntities: string[],
  industry: string,
): string[] {
  const content = (title + " " + summary).toLowerCase();
  const taxonomy = getTaxonomyForIndustry(industry);

  // Extract entities that match taxonomy
  const matchedTags = keyEntities
    .map((entity) => normalizeTag(entity))
    .filter((tag) => tag.length >= 2 && tag.length <= 50);

  // Add industry-relevant tags
  const industryTags = taxonomy
    .map((cat) => normalizeTag(cat))
    .filter((tag) => content.includes(tag.replace(/-/g, " ")))
    .slice(0, 5);

  // Combine and deduplicate
  const allTags = [...new Set([...matchedTags, ...industryTags])];
  return allTags.slice(0, 20);
}

/**
 * Get SEO-friendly slug from title and category.
 */
export function generateCategorySlug(category: string): string {
  return normalizeTag(category, 50);
}

// --- Utilities ---

function normalizeCategory(cat: string): string {
  return cat.toLowerCase().trim();
}

function normalizeRuleTag(tag: string, rules: TaxonomyConfig["tagNormalizationRules"] = {}): string {
  let normalized = tag.trim();

  if (rules.lowercase !== false) {
    normalized = normalized.toLowerCase();
  }

  if (rules.removeSpecialChars !== false) {
    normalized = normalized.replace(/[^a-z0-9\s-]/gi, "");
  }

  normalized = normalized.replace(/\s+/g, "-").replace(/^-|-$/g, "");

  const maxLen = rules.maxLength || 50;
  return normalized.slice(0, maxLen);
}

interface Match {
  value: string;
  similarity: number;
}

function findClosestMatch(term: string, options: string[]): Match | null {
  if (options.length === 0) return null;

  const scores = options.map((opt) => ({
    value: opt,
    similarity: stringSimilarity(term, opt.toLowerCase()),
  }));

  return scores.reduce((best, current) => (current.similarity > best.similarity ? current : best));
}

/**
 * Simple string similarity (0-1, higher = more similar).
 * Based on Levenshtein distance.
 */
function stringSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        const newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          costs[j - 1] = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        } else {
          costs[j - 1] = lastValue;
        }
        lastValue = costs[j];
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
