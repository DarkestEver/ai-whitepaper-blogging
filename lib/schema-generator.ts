import "server-only";

/**
 * Generates schema.org structured data markup for SEO.
 * Supports: Article, ScholarlyArticle, NewsArticle, FAQPage, BreadcrumbList
 */

export interface SchemaArticle {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Person" | "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
      width: number;
      height: number;
    };
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
}

export interface SchemaFAQPage {
  "@context": string;
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface SchemaScholarlyArticle extends SchemaArticle {
  "@type": "ScholarlyArticle";
  keywords: string[];
  about: Array<{
    "@type": "Thing";
    name: string;
  }>;
  distribution?: {
    "@type": "DataDownload";
    encodingFormat: string;
    contentUrl: string;
  };
}

export interface SchemaBreadcrumb {
  "@context": string;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface SchemaNewsArticle extends SchemaArticle {
  "@type": "NewsArticle";
  datePublished: string;
  dateline: string;
  articleSection: string;
}

/**
 * Generate Article schema.org markup.
 */
export function generateArticleSchema(options: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
  publishedDate: string;
  modifiedDate?: string;
}): SchemaArticle {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    image: options.imageUrl,
    datePublished: options.publishedDate,
    dateModified: options.modifiedDate || options.publishedDate,
    author: {
      "@type": "Person",
      name: options.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: options.publisherName,
      logo: {
        "@type": "ImageObject",
        url: options.publisherLogoUrl,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
  };
}

/**
 * Generate ScholarlyArticle schema.org markup (for research/whitepapers).
 */
export function generateScholarlyArticleSchema(options: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
  publishedDate: string;
  modifiedDate?: string;
  keywords: string[];
  keyEntities: string[];
  pdfUrl?: string;
}): SchemaScholarlyArticle {
  const base = generateArticleSchema(options);

  return {
    ...base,
    "@type": "ScholarlyArticle",
    keywords: options.keywords,
    about: options.keyEntities.map((entity) => ({
      "@type": "Thing",
      name: entity,
    })),
    ...(options.pdfUrl && {
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "application/pdf",
        contentUrl: options.pdfUrl,
      },
    }),
  };
}

/**
 * Generate NewsArticle schema.org markup (for timely content).
 */
export function generateNewsArticleSchema(options: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
  publishedDate: string;
  modifiedDate?: string;
  section: string;
  dateline?: string;
}): SchemaNewsArticle {
  const base = generateArticleSchema(options);

  return {
    ...base,
    "@type": "NewsArticle",
    articleSection: options.section,
    dateline: options.dateline || options.publishedDate,
  };
}

/**
 * Generate FAQPage schema.org markup.
 */
export function generateFAQPageSchema(
  faqItems: Array<{
    question: string;
    answer: string;
  }>,
): SchemaFAQPage {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.slice(0, 2000), // Limit answer length
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema.org markup.
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>,
  baseUrl: string,
): SchemaBreadcrumb {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: new URL(item.url, baseUrl).href }),
    })),
  };
}

/**
 * Generate Open Graph meta tags (for social sharing).
 */
export interface OpenGraphTags {
  "og:title": string;
  "og:description": string;
  "og:image": string;
  "og:url": string;
  "og:type": string;
  "og:site_name"?: string;
  "og:article:published_time"?: string;
  "og:article:modified_time"?: string;
  "og:article:author"?: string;
  "og:article:section"?: string;
  "og:article:tag"?: string[];
  "twitter:card"?: string;
  "twitter:title"?: string;
  "twitter:description"?: string;
  "twitter:image"?: string;
  "twitter:creator"?: string;
}

export function generateOpenGraphTags(options: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  authorName?: string;
  publishedDate?: string;
  modifiedDate?: string;
  category?: string;
  tags?: string[];
  siteName?: string;
  twitterHandle?: string;
}): OpenGraphTags {
  const ogTags: OpenGraphTags = {
    "og:title": options.title,
    "og:description": options.description,
    "og:image": options.imageUrl,
    "og:url": options.url,
    "og:type": "article",
    ...(options.siteName && { "og:site_name": options.siteName }),
    ...(options.publishedDate && { "og:article:published_time": options.publishedDate }),
    ...(options.modifiedDate && { "og:article:modified_time": options.modifiedDate }),
    ...(options.authorName && { "og:article:author": options.authorName }),
    ...(options.category && { "og:article:section": options.category }),
    ...(options.tags && options.tags.length > 0 && { "og:article:tag": options.tags }),
    "twitter:card": "summary_large_image",
    "twitter:title": options.title,
    "twitter:description": options.description,
    "twitter:image": options.imageUrl,
    ...(options.twitterHandle && { "twitter:creator": options.twitterHandle }),
  };

  return ogTags;
}

/**
 * Generate canonical and hreflang tags for international SEO.
 */
export interface CanonicalTags {
  canonical: string;
  hreflang?: Array<{
    lang: string;
    url: string;
  }>;
}

export function generateCanonicalTags(options: {
  url: string;
  alternateLanguages?: Array<{ lang: string; url: string }>;
}): CanonicalTags {
  return {
    canonical: options.url,
    ...(options.alternateLanguages && { hreflang: options.alternateLanguages }),
  };
}

/**
 * Generate JSON-LD markup string for embedding in HTML.
 */
export function schemaToJsonLd(schema: object): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Generate HTML meta tags from Open Graph object.
 */
export function generateOpenGraphMetaTags(tags: OpenGraphTags): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tags)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        lines.push(`<meta property="${key}" content="${escapeHtml(item)}" />`);
      }
    } else {
      lines.push(`<meta property="${key}" content="${escapeHtml(value)}" />`);
    }
  }

  return lines.join("\n");
}

/**
 * Determine optimal schema.org type based on content.
 */
export function determineSchemaType(options: {
  documentType: string;
  isTimeSensitive: boolean;
  hasResearch: boolean;
  hasFrequentlyAskedQuestions: boolean;
}): "Article" | "NewsArticle" | "ScholarlyArticle" | "FAQPage" {
  if (options.documentType === "research_report" || options.hasResearch) {
    return "ScholarlyArticle";
  }
  if (options.isTimeSensitive) {
    return "NewsArticle";
  }
  if (options.hasFrequentlyAskedQuestions) {
    return "FAQPage";
  }
  return "Article";
}

// --- Utilities ---

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
