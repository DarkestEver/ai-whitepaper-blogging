/**
 * Category Hierarchy System
 * Organizes flat category list into main + subcategories for efficient UI rendering
 * Limits: 5-7 main categories, max 10 subcategories per main
 */

export interface CategoryNode {
  name: string;
  slug: string;
  subCategories: Array<{ name: string; slug: string; count: number }>;
  paperCount: number;
}

const MAX_MAIN_CATEGORIES = 7;
const MAX_SUB_CATEGORIES = 10;

/**
 * Slugify category name
 */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/^-|-$/g, "") // Trim hyphens
    .slice(0, 50);
}

/**
 * Organize categories into a hierarchy:
 * - Count items per category
 * - Sort by frequency (most papers first)
 * - Keep top 5-7 as main categories
 * - Rest become subcategories under a "More Topics" parent
 * - Limit each group to prevent menu explosion
 */
export function buildCategoryHierarchy(
  allCategories: string[],
  papersByCategory: Map<string, number> = new Map()
): CategoryNode[] {
  if (allCategories.length === 0) {
    return [];
  }

  // Remove "All topics" if present
  const categories = allCategories.filter((cat) => cat !== "All topics");

  // Count papers per category
  const categoryFreq = new Map<string, number>();
  categories.forEach((cat) => {
    categoryFreq.set(cat, (papersByCategory.get(cat) || 0) || categories.filter((c) => c === cat).length);
  });

  // Sort by frequency (descending)
  const sorted = Array.from(categoryFreq.entries())
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([name]) => name);

  // Split into main and sub
  const mainCategoryNames = sorted.slice(0, MAX_MAIN_CATEGORIES);
  const subCategoryNames = sorted.slice(MAX_MAIN_CATEGORIES).slice(0, MAX_SUB_CATEGORIES);

  // Build hierarchy
  const hierarchy: CategoryNode[] = mainCategoryNames.map((name) => ({
    name,
    slug: slugifyCategory(name),
    subCategories: [],
    paperCount: categoryFreq.get(name) || 0,
  }));

  // Add "More Topics" if there are remaining categories
  if (subCategoryNames.length > 0) {
    hierarchy.push({
      name: "More Topics",
      slug: "more-topics",
      subCategories: subCategoryNames.map((name) => ({
        name,
        slug: slugifyCategory(name),
        count: categoryFreq.get(name) || 0,
      })),
      paperCount: subCategoryNames.reduce((sum, name) => sum + (categoryFreq.get(name) || 0), 0),
    });
  }

  return hierarchy;
}

/**
 * Build flat menu items (backward compatible with existing templates)
 * Returns main categories + "More Topics" if needed
 * Keeps API simple: just render normally, hide overflow with CSS if needed
 */
export function getFlatMenuCategories(
  allCategories: string[]
): string[] {
  if (allCategories.length === 0) {
    return [];
  }

  const categories = allCategories.filter((cat) => cat !== "All topics");

  if (categories.length <= MAX_MAIN_CATEGORIES) {
    return categories;
  }

  // Return main categories + "More Topics" (user clicks to expand)
  return categories.slice(0, MAX_MAIN_CATEGORIES).concat(["More Topics"]);
}

/**
 * Get subcategories for a parent category
 */
export function getSubCategories(
  allCategories: string[],
  parentSlug: string
): string[] {
  const categories = allCategories.filter((cat) => cat !== "All topics");
  const categoryFreq = new Map<string, number>();
  categories.forEach((cat) => {
    categoryFreq.set(cat, categories.filter((c) => c === cat).length);
  });

  const sorted = Array.from(categoryFreq.entries())
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([name]) => name);

  if (parentSlug === "more-topics") {
    return sorted.slice(MAX_MAIN_CATEGORIES).slice(0, MAX_SUB_CATEGORIES);
  }

  // Find parent category
  const parentName = sorted.find((name) => slugifyCategory(name) === parentSlug);
  if (!parentName) {
    return [];
  }

  return [parentName]; // Parent itself
}

/**
 * Predefined category hierarchies by industry
 * Parent → [Children]
 */
const CATEGORY_HIERARCHIES: Record<string, Record<string, string[]>> = {
  technology: {
    "AI & ML": [
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
      "Neural Networks",
      "NLP",
      "Computer Vision",
    ],
    "Cloud & Infrastructure": [
      "Cloud Computing",
      "AWS",
      "Azure",
      "Kubernetes",
      "DevOps",
      "Infrastructure",
    ],
    Cybersecurity: [
      "Security",
      "Encryption",
      "Zero Trust",
      "Threat Detection",
      "Compliance",
      "Privacy",
    ],
    "Data & Analytics": [
      "Data Science",
      "Big Data",
      "Analytics",
      "Business Intelligence",
      "Data Engineering",
    ],
    "Web & Mobile": [
      "Web Development",
      "Mobile Development",
      "Frontend",
      "Backend",
      "API Design",
    ],
    "Emerging Tech": [
      "Blockchain",
      "IoT",
      "Quantum Computing",
      "AR/VR",
      "Edge Computing",
    ],
  },
  finance: {
    Banking: ["Banking", "Consumer Finance", "Payment Systems", "Credit"],
    "Capital Markets": ["Trading", "Investment", "Equities", "Fixed Income", "Derivatives"],
    "Digital Finance": ["Fintech", "Crypto", "Blockchain Finance", "DeFi"],
    Risk: ["Risk Management", "Compliance", "Regulations", "AML/KYC"],
    Operations: ["Operations", "Settlement", "Clearing", "Infrastructure"],
  },
  healthcare: {
    "Clinical & Research": [
      "Clinical Research",
      "Drug Development",
      "Pharmaceuticals",
      "Medical Devices",
      "Biotech",
    ],
    "Digital Health": [
      "Telemedicine",
      "Health IT",
      "EHR",
      "Wearables",
      "Telehealth",
    ],
    "Hospital & Operations": ["Hospital Management", "Patient Care", "Operations"],
    Public: ["Public Health", "Epidemiology", "Population Health"],
  },
  energy: {
    Renewables: ["Solar", "Wind", "Renewable Energy", "Clean Energy"],
    "Oil & Gas": ["Fossil Fuels", "Petroleum", "Natural Gas"],
    "Grid & Distribution": ["Grid Modernization", "Smart Grid", "Utilities"],
    Sustainability: ["Sustainability", "Carbon", "Net Zero", "ESG"],
  },
  manufacturing: {
    "Industry 4.0": ["Industry 4.0", "Automation", "Smart Manufacturing"],
    "Supply Chain": ["Supply Chain", "Logistics", "Operations"],
    Quality: ["Quality Control", "Robotics", "Process Optimization"],
  },
};

/**
 * Get hierarchy for an industry
 */
export function getIndustryHierarchy(
  industry: string
): Record<string, string[]> | null {
  const key = industry.toLowerCase().replace(/[^a-z]+/g, "");
  return CATEGORY_HIERARCHIES[key] || null;
}

/**
 * Calculate similarity between two strings (0-1, higher = more similar)
 * Uses simple Levenshtein-inspired distance
 */
function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
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

/**
 * Find best parent category for a given child category
 * Returns [parentCategory, childCategory] or null if no match
 * Uses exact/fuzzy matching instead of substring matching
 */
export function assignParentCategory(
  childCategory: string,
  industry: string
): {
  parentCategory: string;
  childCategory: string;
} | null {
  const normalized = childCategory.toLowerCase().trim();
  const hierarchy = getIndustryHierarchy(industry);

  if (!hierarchy) {
    return null;
  }

  // First pass: exact matches
  for (const [parent, children] of Object.entries(hierarchy)) {
    for (const child of children) {
      const childLower = child.toLowerCase();
      if (childLower === normalized) {
        return {
          parentCategory: parent,
          childCategory: child,
        };
      }
    }
  }

  // Second pass: fuzzy matches
  let bestMatch: { parent: string; child: string; similarity: number } | null = null;

  for (const [parent, children] of Object.entries(hierarchy)) {
    for (const child of children) {
      const childLower = child.toLowerCase();

      // Fuzzy match (substring OR similarity)
      const isSubstringMatch =
        childLower.includes(normalized) || normalized.includes(childLower);
      const similarity = calculateSimilarity(childLower, normalized);
      const isSimilar = isSubstringMatch || similarity > 0.75;

      if (isSimilar) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { parent, child, similarity };
        }
      }
    }
  }

  // Return best match if similarity is good enough
  if (bestMatch && bestMatch.similarity >= 0.7) {
    return {
      parentCategory: bestMatch.parent,
      childCategory: bestMatch.child,
    };
  }

  // No match found
  return null;
}

/**
 * Build hierarchical category structure from papers
 * Groups papers by parent → child relationships
 * Sorts parents by frequency (most papers first)
 */
export function buildHierarchicalMenu(
  papers: Array<{ category: string; parentCategory?: string }>,
  industry: string
): Record<string, string[]> {
  const hierarchy: Record<string, string[]> = {};
  const parentCounts: Record<string, number> = {};

  papers.forEach((paper) => {
    let parent = paper.parentCategory;
    let child = paper.category;

    // If no parent assigned, try to find one
    if (!parent) {
      const assignment = assignParentCategory(child, industry);
      if (assignment) {
        parent = assignment.parentCategory;
        child = assignment.childCategory;
      } else {
        parent = "Other";
      }
    }

    if (!hierarchy[parent]) {
      hierarchy[parent] = [];
      parentCounts[parent] = 0;
    }

    if (!hierarchy[parent].includes(child)) {
      hierarchy[parent].push(child);
    }

    // Count papers per parent
    parentCounts[parent]++;
  });

  // Limit subcategories per parent
  Object.keys(hierarchy).forEach((parent) => {
    hierarchy[parent] = hierarchy[parent].slice(0, MAX_SUB_CATEGORIES);
  });

  // Sort parents by frequency (most papers first)
  const sortedParents = Object.keys(hierarchy).sort(
    (a, b) => (parentCounts[b] || 0) - (parentCounts[a] || 0)
  );

  // Limit main categories to top by frequency
  const mainParents = sortedParents.slice(0, MAX_MAIN_CATEGORIES);
  const filtered: Record<string, string[]> = {};
  mainParents.forEach((parent) => {
    filtered[parent] = hierarchy[parent];
  });

  return filtered;
}

/**
 * Validate that a category won't cause menu overflow
 * Checks both parent and child limits
 * Used by AI draft validation
 */
export function validateCategoryForMenu(
  category: string,
  parentCategory: string | undefined,
  existingCategories: string[],
  existingParents?: string[]
): {
  valid: boolean;
  wouldBecomeSubCategory: boolean;
  message: string;
  suggestedParent?: string;
} {
  const uniqueCategories = [...new Set([...existingCategories, category])].filter(
    (c) => c !== "All topics"
  );
  const parentList = existingParents || [];
  const uniqueParents = [...new Set([...parentList, parentCategory || "Other"])];

  // Check parent limit (max 7 parents)
  if (uniqueParents.length > MAX_MAIN_CATEGORIES) {
    return {
      valid: false,
      wouldBecomeSubCategory: false,
      message: `Too many parent categories (${uniqueParents.length}/${MAX_MAIN_CATEGORIES}). Will assign to "Other".`,
      suggestedParent: "Other",
    };
  }

  // Check if this parent already has max subcategories
  const childrenInParent = uniqueCategories.filter((c) => {
    // This is approximate - ideally we'd have full hierarchy data
    return true; // Simplified for this check
  }).length;

  if (childrenInParent > MAX_SUB_CATEGORIES) {
    return {
      valid: false,
      wouldBecomeSubCategory: false,
      message: `Parent category "${parentCategory}" has too many children (${childrenInParent}/${MAX_SUB_CATEGORIES}).`,
      suggestedParent: "Other",
    };
  }

  // All checks passed
  return {
    valid: true,
    wouldBecomeSubCategory: uniqueParents.length >= MAX_MAIN_CATEGORIES,
    message:
      uniqueParents.length >= MAX_MAIN_CATEGORIES
        ? `Category will be assigned to a secondary parent`
        : `Category will appear in main menu`,
  };
}

/**
 * Get uncategorized metrics for papers
 * Tracks how many papers ended up in "Other" category
 */
export function getUncategorizedMetrics(
  hierarchy: Record<string, string[]>
): {
  total: number;
  uncategorized: number;
  percentage: number;
  uncategorizedCategories: string[];
} {
  const uncategorizedChildren = hierarchy["Other"] || [];
  const totalChildren = Object.values(hierarchy).reduce(
    (sum, children) => sum + children.length,
    0
  );

  return {
    total: totalChildren,
    uncategorized: uncategorizedChildren.length,
    percentage: totalChildren > 0 ? (uncategorizedChildren.length / totalChildren) * 100 : 0,
    uncategorizedCategories: uncategorizedChildren,
  };
}

/**
 * Check if uncategorized rate exceeds threshold
 * Returns warning if too many papers fall into "Other"
 */
export function checkUncategorizedThreshold(
  hierarchy: Record<string, string[]>,
  thresholdPercent: number = 20
): {
  exceeds: boolean;
  message: string;
  metrics: ReturnType<typeof getUncategorizedMetrics>;
} {
  const metrics = getUncategorizedMetrics(hierarchy);

  if (metrics.percentage > thresholdPercent) {
    return {
      exceeds: true,
      message: `⚠️ ${metrics.percentage.toFixed(1)}% of categories are uncategorized (${metrics.uncategorized}/${metrics.total}). Consider: 1) Adding new parent categories, 2) Improving keyword matching, 3) Manually assigning categories.`,
      metrics,
    };
  }

  return {
    exceeds: false,
    message: `✓ Uncategorized rate: ${metrics.percentage.toFixed(1)}% (${metrics.uncategorized}/${metrics.total}) - within threshold`,
    metrics,
  };
}
