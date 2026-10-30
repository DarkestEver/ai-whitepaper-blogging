/**
 * Theme Renderer
 * Layout-specific rendering for the 36 theme presets
 */

import type { IWhitepaper } from "@/lib/models";
import type { ThemePreset } from "@/lib/themes";

export interface RenderContext {
  whitepaper: IWhitepaper;
  theme: ThemePreset;
  siteUrl: string;
  siteName: string;
}

/**
 * Render SEO metadata for a content piece
 */
export function renderSeoMetadata(ctx: RenderContext): {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  ogImage: string;
  ogType: string;
} {
  const title = ctx.whitepaper.seoTitle || ctx.whitepaper.title;
  const description = ctx.whitepaper.seoDescription || ctx.whitepaper.summary;
  const canonical = ctx.whitepaper.canonicalUrl || `${ctx.siteUrl}/whitepapers/${ctx.whitepaper.slug}`;

  return {
    title: title.slice(0, 70),
    description: description.slice(0, 180),
    keywords: ctx.whitepaper.seoKeywords || [],
    canonical,
    ogImage: ctx.whitepaper.coverImageUrl || `${ctx.siteUrl}/og-default.jpg`,
    ogType: "article",
  };
}

/**
 * Render structured data (JSON-LD) for a content piece
 */
export function renderStructuredData(ctx: RenderContext): Record<string, any> {
  const {
    whitepaper,
    siteUrl,
    siteName,
    theme,
  } = ctx;

  const schemaType = whitepaper.documentType === "case_study" ? "Case" : "ScholarlyArticle";

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: whitepaper.title,
    description: whitepaper.summary,
    abstract: whitepaper.abstract,
    keywords: whitepaper.seoKeywords,
    author: {
      "@type": "Organization",
      name: whitepaper.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    datePublished: whitepaper.publicationDate,
    dateModified: whitepaper.updatedAt,
    image: {
      "@type": "ImageObject",
      url: whitepaper.coverImageUrl,
      width: 1024,
      height: 1024,
    },
    ...(whitepaper.documentType === "case_study" && {
      "@type": "Case",
      about: {
        "@type": "Thing",
        name: whitepaper.category,
      },
    }),
    ...(whitepaper.faqItems.length > 0 && {
      mainEntity: {
        "@type": "FAQPage",
        mainEntity: whitepaper.faqItems.map(item => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    }),
  };
}

/**
 * Render detail page content HTML (stripped to structure)
 * Actual styling handled by component layer
 */
export function renderDetailPage(ctx: RenderContext): {
  heroSection: { title: string; subtitle: string; image: string };
  metaSection: { author: string; date: string; readTime: string };
  contentSections: Array<{ heading: string; content: string }>;
  takeawaysSection: string[];
  keyFactsSection: Array<{ fact: string; citation: string }>;
  relatedTopics: string[];
  faqSection: Array<{ q: string; a: string }>;
} {
  const {
    whitepaper,
    theme,
  } = ctx;

  // Extract citations from key facts
  const keyFactsWithCitations = whitepaper.keyFacts.map(fact => {
    const citationMatch = fact.match(/\(Source:\s*page\s+(\d+)\)$/i);
    return {
      fact: fact.replace(/\s*\(Source:.*\)$/i, "").trim(),
      citation: citationMatch ? `page ${citationMatch[1]}` : "source material",
    };
  });

  return {
    heroSection: {
      title: whitepaper.title,
      subtitle: whitepaper.subtitle || whitepaper.summary.slice(0, 100),
      image: whitepaper.coverImageUrl,
    },
    metaSection: {
      author: whitepaper.authorName,
      date: whitepaper.publicationDate,
      readTime: `${whitepaper.readingMinutes} min read`,
    },
    contentSections: [
      {
        heading: "Overview",
        content: whitepaper.abstract,
      },
      ...(whitepaper.geoSummary ? [{
        heading: "Geographic Context",
        content: whitepaper.geoSummary,
      }] : []),
    ],
    takeawaysSection: whitepaper.takeaways,
    keyFactsSection: keyFactsWithCitations,
    relatedTopics: whitepaper.tags,
    faqSection: whitepaper.faqItems.map(item => ({
      q: item.question,
      a: item.answer,
    })),
  };
}

/**
 * Get layout-specific rendering parameters
 */
export function getLayoutConfig(layout: string): {
  columns: number;
  itemsPerPage: number;
  cardStyle: "minimal" | "detailed" | "image-first";
  enableFeatured: boolean;
} {
  const configs: Record<string, any> = {
    "lead-grid": { columns: 2, itemsPerPage: 12, cardStyle: "image-first", enableFeatured: true },
    "classic-columns": { columns: 3, itemsPerPage: 15, cardStyle: "detailed", enableFeatured: false },
    "topic-hub": { columns: 4, itemsPerPage: 20, cardStyle: "minimal", enableFeatured: true },
    "feature": { columns: 1, itemsPerPage: 8, cardStyle: "detailed", enableFeatured: true },
    "briefs": { columns: 2, itemsPerPage: 16, cardStyle: "minimal", enableFeatured: false },
    "stream": { columns: 1, itemsPerPage: 10, cardStyle: "minimal", enableFeatured: false },
  };

  return configs[layout] || { columns: 3, itemsPerPage: 12, cardStyle: "detailed", enableFeatured: false };
}

/**
 * Render catalog card (for listing/search)
 */
export function renderCatalogCard(whitepaper: IWhitepaper, style: "minimal" | "detailed" | "image-first"): {
  title: string;
  excerpt: string;
  image: string;
  metadata: { category: string; readTime: string; date: string };
  tags: string[];
} {
  const excerpt = style === "minimal"
    ? whitepaper.summary.slice(0, 80)
    : whitepaper.summary.slice(0, 150);

  return {
    title: whitepaper.title,
    excerpt: excerpt + (excerpt.length < whitepaper.summary.length ? "..." : ""),
    image: whitepaper.coverImageUrl,
    metadata: {
      category: whitepaper.category,
      readTime: `${whitepaper.readingMinutes}m`,
      date: whitepaper.publicationDate,
    },
    tags: whitepaper.tags.slice(0, 3),
  };
}

/**
 * Validate theme configuration for a site
 * Ensures theme and layout are compatible with accent colors
 */
export function validateThemeConfiguration(theme: ThemePreset): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const validLayouts = ["lead-grid", "classic-columns", "topic-hub", "feature", "briefs", "stream"];
  if (!validLayouts.includes(theme.layout)) {
    errors.push(`Invalid layout: ${theme.layout}`);
  }

  const validAccents = ["mint", "blue", "amber", "violet"];
  if (!validAccents.includes(theme.accent)) {
    errors.push(`Invalid accent color: ${theme.accent}`);
  }

  if (theme.status !== "approved" && theme.status !== "draft") {
    errors.push(`Invalid status: ${theme.status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get CSS variables for theme rendering
 */
export function getThemeCSSVariables(theme: ThemePreset): Record<string, string> {
  const accentColors: Record<string, string> = {
    mint: "#10b981",
    blue: "#3b82f6",
    amber: "#f59e0b",
    violet: "#8b5cf6",
  };

  return {
    "--theme-accent": accentColors[theme.accent] || accentColors.blue,
    "--theme-family": theme.family.toLowerCase().replace(/\s+/g, "-"),
    "--theme-layout": theme.layout,
  };
}
