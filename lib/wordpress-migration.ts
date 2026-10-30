/**
 * WordPress Migration
 * Export/import, URL mapping, redirect generation
 */

import { IWhitepaper, Whitepaper, nextId, Site } from "@/lib/models";

export interface WordPressPost {
  post_id: string;
  post_title: string;
  post_name: string; // slug
  post_content: string;
  post_excerpt: string;
  post_date: string;
  post_modified: string;
  post_author: string;
  post_status: "publish" | "draft" | "scheduled";
  post_type: string;
  post_category?: string[];
  post_tags?: string[];
  custom_fields?: Record<string, any>;
  featured_image_url?: string;
}

export interface MigrationMapping {
  wpPostId: string;
  wpSlug: string;
  wpUrl: string;
  newSlug: string;
  newUrl: string;
  paperId: number;
  status: "pending" | "migrated" | "failed" | "redirected";
  migrationDate?: string;
}

/**
 * Parse WordPress XML export (simplified)
 * In production, use a full WXR parser
 */
export function parseWordPressExport(xmlContent: string): WordPressPost[] {
  const posts: WordPressPost[] = [];

  // Extract posts from XML - simplified parsing (avoid /s flag for ES2018 compat)
  const postMatches = xmlContent.split("<item>").slice(1).map(part => `<item>${part.split("</item>")[0]}</item>`);

  for (const match of postMatches) {
    const titleMatch = match.match(/<title>(.*?)<\/title>/);
    const nameMatch = match.match(/<wp:post_name>(.*?)<\/wp:post_name>/);
    const contentMatch = match.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
    const excerptMatch = match.match(/<excerpt:encoded>(.*?)<\/excerpt:encoded>/);
    const dateMatch = match.match(/<pubDate>(.*?)<\/pubDate>/);
    const statusMatch = match.match(/<wp:status>(.*?)<\/wp:status>/);
    const idMatch = match.match(/<wp:post_id>(.*?)<\/wp:post_id>/);

    if (titleMatch && nameMatch && idMatch) {
      posts.push({
        post_id: idMatch[1],
        post_title: titleMatch[1],
        post_name: nameMatch[1],
        post_content: contentMatch ? contentMatch[1] : "",
        post_excerpt: excerptMatch ? excerptMatch[1] : "",
        post_date: dateMatch ? dateMatch[1] : new Date().toISOString(),
        post_modified: dateMatch ? dateMatch[1] : new Date().toISOString(),
        post_author: "Migrated",
        post_status: (statusMatch ? statusMatch[1] : "draft") as "publish" | "draft" | "scheduled",
        post_type: "post",
      });
    }
  }

  return posts;
}

/**
 * Convert WordPress post to whitepaper draft
 */
export async function convertWordPressPost(
  wpPost: WordPressPost,
  siteId: number,
  baseSlug: string,
): Promise<IWhitepaper> {
  const paperId = await nextId("whitepaper");

  // Generate new slug with migration prefix to avoid conflicts
  const newSlug = `${baseSlug}-${wpPost.post_name}-${paperId}`.slice(0, 120);

  const whitepaper: IWhitepaper & { numericId?: number } = {
    numericId: paperId,
    siteId,
    slug: newSlug,
    title: wpPost.post_title.slice(0, 140),
    summary: wpPost.post_excerpt.slice(0, 500),
    category: "Migrated Content",
    publisher: "WordPress Import",
    readingMinutes: Math.max(1, Math.ceil(wpPost.post_content.split(" ").length / 200)),
    publishedLabel: "Research",
    accent: "blue",
    issue: "1",
    abstract: wpPost.post_excerpt.slice(0, 2000),
    takeaways: [],
    status: wpPost.post_status === "publish" ? "published" : "draft",
    editorialStatus: wpPost.post_status === "publish" ? "approved" : "draft",
    updatedAt: new Date().toISOString(),
    subtitle: "",
    authorName: wpPost.post_author,
    authorTitle: "Migrated",
    documentType: "research_report",
    language: "en",
    publicationDate: wpPost.post_date,
    industry: "",
    targetAudience: "",
    geographicTarget: "",
    tags: [],
    sourceName: "WordPress",
    sourceUrl: "",
    sourceDocumentUrl: "",
    sourceDocumentAsset: "",
    sourceDocumentTitle: wpPost.post_title,
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "WordPress export import",
    scheduledAt: "",
    seoTitle: wpPost.post_title.slice(0, 70),
    seoDescription: wpPost.post_excerpt.slice(0, 180),
    canonicalUrl: "",
    seoKeywords: [],
    geoSummary: "",
    keyEntities: [],
    keyFacts: [],
    faqItems: [],
    coverImageUrl: wpPost.featured_image_url || "",
    coverImageAlt: "",
    featured: false,
  } as any;

  return whitepaper;
}

/**
 * Create redirect mapping from old WordPress URLs to new URLs
 */
export function createRedirectMapping(
  wpPost: WordPressPost,
  oldDomain: string,
  newDomain: string,
  newSlug: string,
): MigrationMapping {
  const wpUrl = `${oldDomain}/${wpPost.post_name}/`;
  const newUrl = `${newDomain}/whitepapers/${newSlug}/`;

  return {
    wpPostId: wpPost.post_id,
    wpSlug: wpPost.post_name,
    wpUrl,
    newSlug,
    newUrl,
    paperId: 0, // Will be set after paper is created
    status: "pending",
  };
}

/**
 * Generate .htaccess redirects (for Apache)
 */
export function generateApacheRedirects(mappings: MigrationMapping[]): string {
  const lines = [
    "# WordPress migration redirects",
    "# Generated for 301 permanent redirects",
    "<IfModule mod_rewrite.c>",
    "RewriteEngine On",
  ];

  for (const mapping of mappings) {
    const oldPath = mapping.wpSlug;
    const newPath = `whitepapers/${mapping.newSlug}`;
    lines.push(`RewriteRule ^${oldPath}/?$ /${newPath}/ [R=301,L]`);
  }

  lines.push("</IfModule>");

  return lines.join("\n");
}

/**
 * Generate Next.js redirect configuration
 */
export function generateNextJsRedirects(mappings: MigrationMapping[]): Array<{ source: string; destination: string; permanent: boolean }> {
  return mappings.map(mapping => ({
    source: `/${mapping.wpSlug}`,
    destination: `/whitepapers/${mapping.newSlug}`,
    permanent: true,
  }));
}

/**
 * Validate URL mappings for duplicates and conflicts
 */
export function validateRedirectMappings(mappings: MigrationMapping[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const seenNewUrls = new Set<string>();
  const seenNewSlugs = new Set<string>();

  for (const mapping of mappings) {
    if (seenNewUrls.has(mapping.newUrl)) {
      errors.push(`Duplicate new URL: ${mapping.newUrl}`);
    }
    seenNewUrls.add(mapping.newUrl);

    if (seenNewSlugs.has(mapping.newSlug)) {
      errors.push(`Duplicate new slug: ${mapping.newSlug}`);
    }
    seenNewSlugs.add(mapping.newSlug);

    // Warn if old and new slugs are identical (no slug change)
    if (mapping.wpSlug === mapping.newSlug) {
      warnings.push(`No slug change for: ${mapping.wpSlug}`);
    }

    // Warn if URL looks like category or archive
    if (mapping.wpSlug.includes("category") || mapping.wpSlug.includes("tag") || mapping.wpSlug.includes("archive")) {
      warnings.push(`May be category/archive page: ${mapping.wpSlug}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Simulate migration - dry run without committing to database
 */
export async function simulateMigration(
  wpPosts: WordPressPost[],
  siteId: number,
  baseSlug: string,
  oldDomain: string,
  newDomain: string,
): Promise<{
  totalPosts: number;
  willPublish: number;
  willBeDraft: number;
  mappings: MigrationMapping[];
  redirectValidation: ReturnType<typeof validateRedirectMappings>;
}> {
  const mappings: MigrationMapping[] = [];
  let willPublish = 0;
  let willBeDraft = 0;

  for (const post of wpPosts) {
    if (post.post_status === "publish") willPublish++;
    else willBeDraft++;

    const newSlug = `${baseSlug}-${post.post_name}`.slice(0, 120);
    const mapping = createRedirectMapping(post, oldDomain, newDomain, newSlug);
    mappings.push(mapping);
  }

  return {
    totalPosts: wpPosts.length,
    willPublish,
    willBeDraft,
    mappings,
    redirectValidation: validateRedirectMappings(mappings),
  };
}

/**
 * Execute migration - import all posts and create redirect mappings
 */
export async function executeMigration(
  wpPosts: WordPressPost[],
  siteId: number,
  baseSlug: string,
  oldDomain: string,
  newDomain: string,
): Promise<{
  success: boolean;
  imported: number;
  failed: number;
  mappings: MigrationMapping[];
  errors: Array<{ postId: string; error: string }>;
}> {
  const mappings: MigrationMapping[] = [];
  const errors: Array<{ postId: string; error: string }> = [];
  let imported = 0;
  let failed = 0;

  for (const post of wpPosts) {
    try {
      const whitepaper = await convertWordPressPost(post, siteId, baseSlug);
      const paperId = whitepaper.numericId!;

      // Create whitepaper in database
      await Whitepaper.create(whitepaper);

      const newSlug = whitepaper.slug;
      const mapping = createRedirectMapping(post, oldDomain, newDomain, newSlug);
      mapping.paperId = paperId;
      mapping.status = "migrated";
      mapping.migrationDate = new Date().toISOString();
      mappings.push(mapping);

      imported++;
    } catch (error) {
      failed++;
      errors.push({
        postId: post.post_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    mappings,
    errors,
  };
}
