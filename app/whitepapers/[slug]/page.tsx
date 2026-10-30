import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findWhitepaperRecordForSite, listWhitepapers, type PaperRecord } from "@/lib/db";
import { getRequestSite } from "@/lib/request-site";
import { DefaultDetail } from "@/templates/default/detail";
import { NewsmagDetail } from "@/templates/newsmag/detail";
import { MagazineDetail } from "@/templates/magazine/detail";
import { NewsynDetail } from "@/templates/newsy/detail";
import { HotNewsyDetail } from "@/templates/hotnewsy/detail";
import { HotMagazineDetail } from "@/templates/hotmagazine/detail";
import { ClassicMagazineDetail } from "@/templates/classicmagazine/detail";
import { GamerWorldDetail } from "@/templates/gamerworld/detail";
import { PennNewsDetail } from "@/templates/pennnews/detail";
import { LifestyleDetail } from "@/templates/lifestyle/detail";

type PaperPageProps = {
  params: Promise<{ slug: string }>;
};

function publicAssetUrl(assetUrl: string, publicUrl: string): string {
  return publicUrl ? new URL(assetUrl, publicUrl).toString() : assetUrl;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PaperPageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getRequestSite();
  if (!site) notFound();
  const paper = await findWhitepaperRecordForSite(slug, site.id);
  if (!paper || paper.status !== "published") {
    return { title: "Research not found", robots: { index: false, follow: false } };
  }
  const title = paper.seoTitle || paper.title;
  const description = paper.seoDescription || paper.summary;
  const canonicalUrl = paper.canonicalUrl || (site.publicUrl
    ? new URL(`/whitepapers/${encodeURIComponent(paper.slug)}`, site.publicUrl).toString()
    : "");
  return {
    title,
    description,
    ...(paper.seoKeywords.length ? { keywords: paper.seoKeywords } : {}),
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: "article",
      title,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(paper.coverImageUrl ? { images: [{ url: publicAssetUrl(paper.coverImageUrl, site.publicUrl), alt: paper.coverImageAlt }] } : {}),
    },
    robots: { index: site.indexingEnabled, follow: site.indexingEnabled },
  };
}

export default async function WhitepaperPage({ params }: PaperPageProps) {
  const { slug } = await params;
  const site = await getRequestSite();
  if (!site) notFound();
  const paper = await findWhitepaperRecordForSite(slug, site.id);
  if (!paper || paper.status !== "published") notFound();

  // Get related papers (same category, excluding current)
  const allPapers = await listWhitepapers({ siteId: site.id });
  const relatedPapers = allPapers
    .filter((p) => p.slug !== paper.slug && (p.category === paper.category || p.tags.some((t) => paper.tags.includes(t))))
    .slice(0, 4);

  const canonicalUrl = paper.canonicalUrl || (site.publicUrl
    ? new URL(`/whitepapers/${encodeURIComponent(paper.slug)}`, site.publicUrl).toString()
    : "");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": canonicalUrl ? `${canonicalUrl}#article` : undefined,
        headline: paper.title,
        description: paper.seoDescription || paper.summary,
        abstract: paper.abstract,
        inLanguage: paper.language,
        author: { "@type": "Person", name: paper.authorName },
        publisher: { "@type": "Organization", name: site.legalName || paper.publisher },
        ...(paper.publicationDate ? { datePublished: paper.publicationDate } : {}),
        ...(paper.coverImageUrl ? { image: publicAssetUrl(paper.coverImageUrl, site.publicUrl) } : {}),
        ...(canonicalUrl ? { mainEntityOfPage: canonicalUrl } : {}),
      },
      ...(paper.faqItems.length
        ? [{
            "@type": "FAQPage",
            mainEntity: paper.faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }]
        : []),
    ],
  };

  const categories = [...new Set(allPapers.map((p) => p.category))];
  const data = { site, paper, relatedPapers, categories };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      {site.templateId === "newsmag" ? <NewsmagDetail {...data} /> : site.templateId === "magazine" ? <MagazineDetail {...data} /> : site.templateId === "newsy" ? <NewsynDetail {...data} /> : site.templateId === "hotnewsy" ? <HotNewsyDetail {...data} /> : site.templateId === "hotmagazine" ? <HotMagazineDetail {...data} /> : site.templateId === "classicmagazine" ? <ClassicMagazineDetail {...data} /> : site.templateId === "gamerworld" ? <GamerWorldDetail {...data} /> : site.templateId === "pennnews" ? <PennNewsDetail {...data} /> : site.templateId === "lifestyle" ? <LifestyleDetail {...data} /> : <DefaultDetail {...data} />}
    </>
  );
}
