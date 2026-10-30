import { connectDatabase } from "@/lib/mongodb";
import { Site, Whitepaper, nextId } from "@/lib/models";
import { whitepapers as samplePapers } from "@/lib/catalog";

async function initDefaultSite() {
  try {
    await connectDatabase();

    // Check if default site exists
    const existing = await Site.findOne({ slug: "signal-library" });
    if (existing) {
      console.log("Default site already exists");
      process.exit(0);
    }

    // Create default site
    const siteId = await nextId("Site");
    const defaultSite = new Site({
      numericId: siteId,
      slug: "signal-library",
      name: "Signal Library",
      description:
        "Explore practical research, industry briefings, and evidence-led guides for modern teams.",
      themeId: "modernist-ocean-1",
      publicUrl: "",
      tagline: "Research and insights you can trust",
      logoUrl: "",
      faviconUrl: "",
      brandColor: "#1f2937",
      accentColor: "#c8ec6d",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      legalName: "",
      privacyPolicy: "",
      termsOfUse: "",
      cookiePolicy: "",
      disclaimer: "",
      editorialPolicy: "",
      accessibilityStatement: "",
      indexingEnabled: false,
      socialLinks: [],
      emailEnabled: false,
      emailProvider: "",
      emailApiUrl: "",
      emailSecretRef: "",
      emailFromEmail: "",
      emailFromName: "",
      emailReplyTo: "",
      emailApproved: false,
      privacyApproved: false,
      termsApproved: false,
      downloadEnabled: false,
      leadRetentionDays: 90,
      verificationTokenMinutes: 60,
      downloadRateLimitPerHour: 10,
      maxDownloadsPerLead: 3,
      updatedAt: new Date().toISOString(),
    });

    await defaultSite.save();
    console.log("✓ Default site created");

    // Create sample whitepapers
    for (const paper of samplePapers.slice(0, 5)) {
      const paperId = await nextId("Whitepaper");
      const wp = new Whitepaper({
        numericId: paperId,
        siteId,
        slug: paper.slug,
        title: paper.title,
        summary: paper.summary,
        category: paper.category,
        publisher: paper.publisher,
        readingMinutes: paper.readingMinutes,
        publishedLabel: paper.publishedLabel,
        accent: paper.accent || "amber",
        issue: paper.issue || "",
        abstract: paper.summary,
        takeaways: [],
        status: "published",
        editorialStatus: "approved",
        updatedAt: new Date().toISOString(),
        subtitle: "",
        authorName: "Signal Research Desk",
        authorTitle: "",
        documentType: "whitepaper",
        language: "en",
        publicationDate: "",
        industry: "",
        targetAudience: "",
        geographicTarget: "",
        tags: [paper.category],
        sourceName: paper.publisher,
        sourceUrl: "",
        sourceDocumentUrl: "",
        sourceDocumentAsset: "",
        downloadablePdfAsset: "",
        sourceDocumentTitle: "",
        sourceRightsStatus: "allowed",
        sourceRightsEvidence: "Sample whitepaper",
        scheduledAt: "",
        seoTitle: paper.title,
        seoDescription: paper.summary,
        canonicalUrl: "",
        seoKeywords: [paper.category],
        geoSummary: "",
        keyEntities: [],
        keyFacts: [],
        faqItems: [],
        coverImageUrl: "",
        coverImageAlt: "",
        featured: false,
      });

      await wp.save();
    }

    console.log(`✓ Created ${Math.min(5, samplePapers.length)} sample whitepapers`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

initDefaultSite();
