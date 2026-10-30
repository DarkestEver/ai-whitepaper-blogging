export type ThemeFamily =
  | "Editorial / Newsroom"
  | "Research Library"
  | "Technical Journal"
  | "Industry Briefing"
  | "Innovation / Product"
  | "Executive Insights";

export type ThemePreset = {
  id: string;
  name: string;
  family: ThemeFamily;
  description: string;
  accent: "mint" | "blue" | "amber" | "violet";
  layout: "lead-grid" | "classic-columns" | "topic-hub" | "feature" | "briefs" | "stream";
  status: "approved" | "draft";
  version: 1;
};

const families: Array<{
  family: ThemeFamily;
  prefix: string;
  accent: ThemePreset["accent"];
  names: Array<[string, string]>;
}> = [
  {
    family: "Editorial / Newsroom",
    prefix: "editorial",
    accent: "mint",
    names: [
      ["lead-grid", "Lead Grid"],
      ["classic-columns", "Classic Columns"],
      ["topic-hub", "Topic Hub"],
      ["longform-feature", "Longform Feature"],
      ["local-briefs", "Local Briefs"],
      ["mixed-stream", "Mixed Stream"],
    ],
  },
  {
    family: "Research Library",
    prefix: "research",
    accent: "blue",
    names: [
      ["report-index", "Report Index"],
      ["topic-catalog", "Topic Catalog"],
      ["author-led", "Author Led"],
      ["data-summary", "Data Summary"],
      ["whitepaper-focus", "Whitepaper Focus"],
      ["briefing-stream", "Briefing Stream"],
    ],
  },
  {
    family: "Technical Journal",
    prefix: "technical",
    accent: "violet",
    names: [
      ["documentation-led", "Documentation Led"],
      ["engineering-notes", "Engineering Notes"],
      ["analysis", "Technical Analysis"],
      ["tutorial-series", "Tutorial Series"],
      ["release-briefs", "Release Briefs"],
      ["topic-index", "Technical Topic Index"],
    ],
  },
  {
    family: "Industry Briefing",
    prefix: "industry",
    accent: "amber",
    names: [
      ["market-pulse", "Market Pulse"],
      ["sector-hub", "Sector Hub"],
      ["regulatory-watch", "Regulatory Watch"],
      ["executive-brief", "Executive Brief"],
      ["comparison", "Industry Comparison"],
      ["news-stream", "Industry News Stream"],
    ],
  },
  {
    family: "Innovation / Product",
    prefix: "innovation",
    accent: "mint",
    names: [
      ["product-news", "Product News"],
      ["case-study", "Case Study"],
      ["research-lab", "Research Lab"],
      ["product-guides", "Product Guides"],
      ["launch-stream", "Launch Stream"],
      ["topic-showcase", "Topic Showcase"],
    ],
  },
  {
    family: "Executive Insights",
    prefix: "executive",
    accent: "blue",
    names: [
      ["opinion-led", "Opinion Led"],
      ["author-column", "Author Column"],
      ["strategy-brief", "Strategy Brief"],
      ["interview", "Executive Interview"],
      ["roundtable", "Roundtable"],
      ["insight-stream", "Insight Stream"],
    ],
  },
];

const layoutNames: ThemePreset["layout"][] = [
  "lead-grid",
  "classic-columns",
  "topic-hub",
  "feature",
  "briefs",
  "stream",
];

export const themePresets: ThemePreset[] = families.flatMap((group) =>
  group.names.map(([suffix, name], index) => ({
    id: `${group.prefix}-${suffix}`,
    name,
    family: group.family,
    description: `${name} composition for ${group.family.toLowerCase()} content, built from shared templates and design tokens.`,
    accent: group.accent,
    layout: layoutNames[index],
    status: "draft",
    version: 1,
  })),
);

export function findThemePreset(id: string): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}
