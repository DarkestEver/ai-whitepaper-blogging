export type Whitepaper = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publisher: string;
  readingMinutes: number;
  publishedLabel: string;
  accent: "mint" | "blue" | "amber" | "violet";
  issue: string;
  abstract: string;
  takeaways: string[];
};

export const whitepapers: Whitepaper[] = [
  {
    slug: "practical-guide-to-private-ai",
    title: "A Practical Guide to Private AI",
    summary:
      "A clear framework for evaluating where private AI belongs in a modern organization.",
    category: "Artificial intelligence",
    publisher: "Signal Research Desk",
    readingMinutes: 12,
    publishedLabel: "Research brief · 2026",
    accent: "mint",
    issue: "01",
    abstract:
      "Private AI is not a single product choice. This original demonstration brief helps teams map data sensitivity, operating constraints, and evaluation needs before choosing a deployment model.",
    takeaways: [
      "Map use cases to data sensitivity and operational risk.",
      "Compare hosted, private-cloud, and local deployment trade-offs.",
      "Define evaluation and governance checks before rollout.",
    ],
  },
  {
    slug: "building-a-resilient-cloud-foundation",
    title: "Building a Resilient Cloud Foundation",
    summary:
      "Practical patterns for reducing operational surprises across distributed services.",
    category: "Cloud and infrastructure",
    publisher: "Signal Research Desk",
    readingMinutes: 9,
    publishedLabel: "Field guide · 2026",
    accent: "blue",
    issue: "02",
    abstract:
      "A resilient cloud foundation starts with explicit failure boundaries, measured recovery objectives, and repeatable operating practices—not a checklist of fashionable services.",
    takeaways: [
      "Draw service and data failure boundaries.",
      "Test restore procedures against real recovery objectives.",
      "Use load and failure tests to validate capacity assumptions.",
    ],
  },
  {
    slug: "security-by-design-for-growing-teams",
    title: "Security by Design for Growing Teams",
    summary:
      "A focused approach to access, data handling, and release controls as teams scale.",
    category: "Security and privacy",
    publisher: "Signal Research Desk",
    readingMinutes: 14,
    publishedLabel: "Research brief · 2026",
    accent: "violet",
    issue: "03",
    abstract:
      "Growing teams can make security operational by identifying trust boundaries early, assigning control ownership, and verifying protections with routine tests.",
    takeaways: [
      "Make identity and authorization rules explicit.",
      "Minimize retained data and restrict sensitive access.",
      "Turn security expectations into release evidence.",
    ],
  },
  {
    slug: "measuring-responsible-automation",
    title: "Measuring Responsible Automation",
    summary:
      "How to set useful quality measures before automation reaches production workflows.",
    category: "Artificial intelligence",
    publisher: "Signal Research Desk",
    readingMinutes: 8,
    publishedLabel: "Executive note · 2026",
    accent: "amber",
    issue: "04",
    abstract:
      "Automation quality should be measured against the real cost of failure. This brief outlines a practical way to combine human review, measurable outcomes, and safe rollback.",
    takeaways: [
      "Choose quality measures tied to real workflow outcomes.",
      "Keep human review where impact or uncertainty is high.",
      "Provide a safe pause and rollback path.",
    ],
  },
  {
    slug: "modern-data-platforms-without-the-hype",
    title: "Modern Data Platforms, Without the Hype",
    summary:
      "A decision guide for aligning data architecture with actual product and team needs.",
    category: "Data and analytics",
    publisher: "Signal Research Desk",
    readingMinutes: 11,
    publishedLabel: "Decision guide · 2026",
    accent: "blue",
    issue: "05",
    abstract:
      "Data platform decisions become easier when teams start with the decisions they need to make, then work backward to freshness, governance, and operating requirements.",
    takeaways: [
      "Start from decisions and data freshness needs.",
      "Make governance and ownership part of the architecture.",
      "Compare total operating effort, not only infrastructure cost.",
    ],
  },
  {
    slug: "designing-better-digital-workflows",
    title: "Designing Better Digital Workflows",
    summary:
      "A service-design lens on making complex operational tasks easier to complete.",
    category: "Product and operations",
    publisher: "Signal Research Desk",
    readingMinutes: 7,
    publishedLabel: "Field note · 2026",
    accent: "mint",
    issue: "06",
    abstract:
      "Effective workflows make status, ownership, and recovery paths visible. This field note offers a lightweight method to find friction and validate improvements.",
    takeaways: [
      "Observe complete tasks, including failure recovery.",
      "Make status and next actions easy to understand.",
      "Validate changes with representative users and accessibility checks.",
    ],
  },
  {
    slug: "privacy-first-measurement",
    title: "Privacy-First Measurement",
    summary:
      "A practical starting point for measuring digital experiences with less data.",
    category: "Security and privacy",
    publisher: "Signal Research Desk",
    readingMinutes: 10,
    publishedLabel: "Research brief · 2026",
    accent: "amber",
    issue: "07",
    abstract:
      "Useful measurement does not require collecting everything. Start with a clear purpose, aggregate where possible, and define retention and access before instrumentation.",
    takeaways: [
      "Tie every event to a documented product question.",
      "Prefer aggregation and data minimization.",
      "Set access and retention rules before collection.",
    ],
  },
  {
    slug: "reliable-platforms-on-lean-infrastructure",
    title: "Reliable Platforms on Lean Infrastructure",
    summary:
      "Capacity, recovery, and monitoring principles for teams with constrained infrastructure.",
    category: "Cloud and infrastructure",
    publisher: "Signal Research Desk",
    readingMinutes: 13,
    publishedLabel: "Technical guide · 2026",
    accent: "violet",
    issue: "08",
    abstract:
      "A small infrastructure footprint can still be operated responsibly when resource budgets are measured, state is protected, and recovery limitations are understood.",
    takeaways: [
      "Measure resource use under realistic workloads.",
      "Protect durable state and rehearse restoration.",
      "Document single-node risks and recovery ownership.",
    ],
  },
];

export const categories = [
  "All topics",
  ...new Set(whitepapers.map((paper) => paper.category)),
];

export function findWhitepaper(slug: string): Whitepaper | undefined {
  return whitepapers.find((paper) => paper.slug === slug);
}

export function filterWhitepapers(query: string, category: string): Whitepaper[] {
  const normalizedQuery = query.trim().toLowerCase();

  return whitepapers.filter((paper) => {
    const matchesCategory = category === "All topics" || paper.category === category;
    const searchableText =
      `${paper.title} ${paper.summary} ${paper.category} ${paper.publisher}`.toLowerCase();
    const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
