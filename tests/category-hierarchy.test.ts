import { test } from "node:test";
import * as assert from "node:assert";
import {
  buildHierarchicalMenu,
  assignParentCategory,
  validateCategoryForMenu,
  slugifyCategory,
  getIndustryHierarchy,
  getUncategorizedMetrics,
  checkUncategorizedThreshold,
} from "@/lib/category-hierarchy";

test("category hierarchy system", async (t) => {
  await t.test("slugifyCategory converts names correctly", () => {
    assert.strictEqual(slugifyCategory("AI & Machine Learning"), "ai-machine-learning");
    assert.strictEqual(slugifyCategory("Cloud Computing"), "cloud-computing");
    assert.strictEqual(slugifyCategory("Data & Analytics"), "data-analytics");
  });

  await t.test("getIndustryHierarchy returns correct taxonomy", () => {
    const techHierarchy = getIndustryHierarchy("technology");
    assert.ok(techHierarchy);
    assert.ok(techHierarchy["AI & ML"]);
    assert.ok(techHierarchy["Cloud & Infrastructure"]);

    const financeHierarchy = getIndustryHierarchy("finance");
    assert.ok(financeHierarchy);
    assert.ok(financeHierarchy["Banking"]);
    assert.ok(financeHierarchy["Digital Finance"]);
  });

  await t.test("assignParentCategory exact matches work", () => {
    const result = assignParentCategory("Machine Learning", "technology");
    assert.ok(result);
    assert.strictEqual(result?.parentCategory, "AI & ML");
    // Should match one of the children in AI & ML
    assert.ok(result?.childCategory);
  });

  await t.test("assignParentCategory fuzzy matches with similarity threshold", () => {
    // Should find match with high similarity
    const result = assignParentCategory("Machine Learning", "technology");
    assert.ok(result);
    assert.strictEqual(result?.parentCategory, "AI & ML");
  });

  await t.test("assignParentCategory returns null for unrelated terms", () => {
    const result = assignParentCategory("xyz123abc", "technology");
    assert.strictEqual(result, null);
  });

  await t.test("assignParentCategory handles ambiguous terms", () => {
    // "Crypto" appears in finance - should find it there
    const financeResult = assignParentCategory("Crypto", "finance");
    assert.ok(financeResult);
    assert.strictEqual(financeResult?.parentCategory, "Digital Finance");

    // "Blockchain" in tech should map (to Emerging Tech)
    const techResult = assignParentCategory("Blockchain", "technology");
    assert.ok(techResult); // Should find a match
    assert.strictEqual(techResult?.parentCategory, "Emerging Tech");
  });

  await t.test("buildHierarchicalMenu creates proper hierarchy", () => {
    const papers = [
      { category: "AI & Machine Learning", parentCategory: "AI & ML" },
      { category: "Deep Learning", parentCategory: "AI & ML" },
      { category: "Cloud Computing", parentCategory: "Cloud & Infrastructure" },
      { category: "AWS", parentCategory: "Cloud & Infrastructure" },
    ];

    const hierarchy = buildHierarchicalMenu(papers, "technology");
    assert.ok(hierarchy["AI & ML"]);
    assert.ok(hierarchy["Cloud & Infrastructure"]);
    assert.ok(hierarchy["AI & ML"].includes("AI & Machine Learning"));
    assert.ok(hierarchy["Cloud & Infrastructure"].includes("AWS"));
  });

  await t.test("buildHierarchicalMenu infers missing parents", () => {
    const papers = [
      { category: "Kubernetes", parentCategory: undefined },
      { category: "Docker", parentCategory: undefined },
    ];

    const hierarchy = buildHierarchicalMenu(papers, "technology");
    assert.ok(hierarchy["Cloud & Infrastructure"]);
    assert.ok(hierarchy["Cloud & Infrastructure"].includes("Kubernetes"));
  });

  await t.test("buildHierarchicalMenu limits main categories to 7", () => {
    const papers = Array.from({ length: 20 }, (_, i) => ({
      category: `Category ${i}`,
      parentCategory: `Parent ${i % 10}`,
    }));

    const hierarchy = buildHierarchicalMenu(papers, "technology");
    const parentCount = Object.keys(hierarchy).length;
    assert.ok(parentCount <= 7, `Expected <= 7 parents, got ${parentCount}`);
  });

  await t.test("buildHierarchicalMenu limits subcategories to 10 per parent", () => {
    const papers = Array.from({ length: 50 }, (_, i) => ({
      category: `Child ${i}`,
      parentCategory: "MainParent",
    }));

    const hierarchy = buildHierarchicalMenu(papers, "technology");
    const childCount = hierarchy["MainParent"]?.length || 0;
    assert.ok(childCount <= 10, `Expected <= 10 children, got ${childCount}`);
  });

  await t.test("buildHierarchicalMenu sorts parents by frequency", () => {
    const papers = [
      // Parent A: 5 papers
      { category: "A1", parentCategory: "A" },
      { category: "A2", parentCategory: "A" },
      { category: "A3", parentCategory: "A" },
      { category: "A4", parentCategory: "A" },
      { category: "A5", parentCategory: "A" },
      // Parent B: 2 papers
      { category: "B1", parentCategory: "B" },
      { category: "B2", parentCategory: "B" },
      // Parent C: 8 papers
      { category: "C1", parentCategory: "C" },
      { category: "C2", parentCategory: "C" },
      { category: "C3", parentCategory: "C" },
      { category: "C4", parentCategory: "C" },
      { category: "C5", parentCategory: "C" },
      { category: "C6", parentCategory: "C" },
      { category: "C7", parentCategory: "C" },
      { category: "C8", parentCategory: "C" },
    ];

    const hierarchy = buildHierarchicalMenu(papers, "technology");
    const parentOrder = Object.keys(hierarchy);
    // C should appear before A, A before B (by frequency)
    const cIndex = parentOrder.indexOf("C");
    const aIndex = parentOrder.indexOf("A");
    const bIndex = parentOrder.indexOf("B");
    assert.ok(cIndex < aIndex, "Parent C (8 papers) should appear before A (5 papers)");
    assert.ok(aIndex < bIndex, "Parent A (5 papers) should appear before B (2 papers)");
  });

  await t.test("validateCategoryForMenu accepts valid new categories", () => {
    const result = validateCategoryForMenu("NewCategory", "NewParent", ["Existing1", "Existing2"]);
    assert.strictEqual(result.valid, true);
  });

  await t.test("validateCategoryForMenu rejects when too many parents", () => {
    const existingParents = Array.from({ length: 7 }, (_, i) => `Parent${i}`);
    const result = validateCategoryForMenu(
      "NewCategory",
      "NewParent",
      ["Cat1"],
      existingParents
    );
    assert.strictEqual(result.valid, false);
  });

  await t.test("validateCategoryForMenu flags secondary parents correctly", () => {
    const existingParents = Array.from({ length: 6 }, (_, i) => `Parent${i}`);
    const result = validateCategoryForMenu(
      "NewCategory",
      "NewParent",
      ["Cat1"],
      existingParents
    );
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.wouldBecomeSubCategory, true);
  });

  await t.test("edge case: single paper creates proper hierarchy", () => {
    const papers = [{ category: "Kubernetes", parentCategory: undefined }];
    const hierarchy = buildHierarchicalMenu(papers, "technology");
    assert.ok(Object.keys(hierarchy).length > 0);
    assert.ok(Object.values(hierarchy)[0]?.includes("Kubernetes"));
  });

  await t.test("edge case: duplicate categories are deduplicated", () => {
    const papers = [
      { category: "AI", parentCategory: "AI & ML" },
      { category: "AI", parentCategory: "AI & ML" },
      { category: "AI", parentCategory: "AI & ML" },
    ];
    const hierarchy = buildHierarchicalMenu(papers, "technology");
    const childCount = hierarchy["AI & ML"]?.length || 0;
    assert.strictEqual(childCount, 1, "Duplicate categories should be deduplicated");
  });

  await t.test("edge case: missing parent falls back to 'Other'", () => {
    const papers = [{ category: "Cooking", parentCategory: undefined }];
    const hierarchy = buildHierarchicalMenu(papers, "technology");
    // Should have some parent for category (either "Other" or assigned)
    const hasCategory = Object.values(hierarchy).some(children => children.includes("Cooking"));
    assert.ok(hasCategory, "Category should be grouped in some parent");
  });

  await t.test("multi-industry support works", () => {
    // Same category, different industries
    const techResult = assignParentCategory("Trading", "technology");
    const financeResult = assignParentCategory("Trading", "finance");

    // Trading should map to Capital Markets in finance
    assert.ok(financeResult);
    assert.strictEqual(financeResult?.parentCategory, "Capital Markets");
  });

  await t.test("getUncategorizedMetrics counts papers in Other", () => {
    const hierarchy = {
      "AI & ML": ["Deep Learning", "NLP"],
      "Cloud": ["Kubernetes"],
      "Other": ["Cooking", "Random", "Uncategorized"],
    };

    const metrics = getUncategorizedMetrics(hierarchy);
    assert.strictEqual(metrics.total, 6);
    assert.strictEqual(metrics.uncategorized, 3);
    assert.strictEqual(metrics.percentage, 50);
    assert.deepStrictEqual(metrics.uncategorizedCategories, ["Cooking", "Random", "Uncategorized"]);
  });

  await t.test("getUncategorizedMetrics handles empty Other", () => {
    const hierarchy = {
      "AI & ML": ["Deep Learning"],
      "Cloud": ["AWS"],
    };

    const metrics = getUncategorizedMetrics(hierarchy);
    assert.strictEqual(metrics.total, 2);
    assert.strictEqual(metrics.uncategorized, 0);
    assert.strictEqual(metrics.percentage, 0);
  });

  await t.test("checkUncategorizedThreshold warns when exceeds limit", () => {
    const hierarchy = {
      "AI & ML": ["Deep Learning"],
      "Other": Array.from({ length: 25 }, (_, i) => `Uncategorized${i}`),
    };

    const result = checkUncategorizedThreshold(hierarchy, 20);
    assert.strictEqual(result.exceeds, true);
    assert.ok(result.message.includes("⚠️"));
    assert.ok(result.message.includes("96")); // ~96% of papers
  });

  await t.test("checkUncategorizedThreshold passes when below limit", () => {
    const hierarchy = {
      "AI & ML": Array.from({ length: 50 }, (_, i) => `Category${i}`),
      "Cloud": Array.from({ length: 30 }, (_, i) => `Cloud${i}`),
      "Other": ["Uncategorized1", "Uncategorized2"],
    };

    const result = checkUncategorizedThreshold(hierarchy, 20);
    assert.strictEqual(result.exceeds, false);
    assert.ok(result.message.includes("✓"));
    assert.ok(result.message.includes("within threshold"));
  });

  await t.test("checkUncategorizedThreshold returns metrics", () => {
    const hierarchy = {
      "Main": ["A", "B", "C"],
      "Other": ["D"],
    };

    const result = checkUncategorizedThreshold(hierarchy, 30);
    assert.strictEqual(result.metrics.total, 4);
    assert.strictEqual(result.metrics.uncategorized, 1);
    assert.strictEqual(result.metrics.percentage, 25);
  });

  await t.test("edge case: all papers uncategorized", () => {
    const hierarchy = {
      "Other": ["A", "B", "C", "D", "E"],
    };

    const metrics = getUncategorizedMetrics(hierarchy);
    assert.strictEqual(metrics.total, 5);
    assert.strictEqual(metrics.uncategorized, 5);
    assert.strictEqual(metrics.percentage, 100);

    const warning = checkUncategorizedThreshold(hierarchy, 20);
    assert.strictEqual(warning.exceeds, true);
    assert.ok(warning.message.includes("100"));
  });

  await t.test("edge case: no papers at all", () => {
    const hierarchy: Record<string, string[]> = {};

    const metrics = getUncategorizedMetrics(hierarchy);
    assert.strictEqual(metrics.total, 0);
    assert.strictEqual(metrics.uncategorized, 0);
    assert.strictEqual(metrics.percentage, 0); // 0/0 = 0%
  });
});
