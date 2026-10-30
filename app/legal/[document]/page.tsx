import { notFound } from "next/navigation";
import { getRequestSite } from "@/lib/request-site";
import { listWhitepapers } from "@/lib/db";
import { renderPolicyText } from "@/lib/site-public";
import { NewsmagWrapper } from "@/templates/newsmag/layout-wrapper";
import { DefaultWrapper } from "@/templates/default/layout-wrapper";
import { MagazineWrapper } from "@/templates/magazine/layout-wrapper";
import { NewsynWrapper } from "@/templates/newsy/layout-wrapper";
import { HotNewsyWrapper } from "@/templates/hotnewsy/layout-wrapper";
import { HotMagazineWrapper } from "@/templates/hotmagazine/layout-wrapper";
import { ClassicMagazineWrapper } from "@/templates/classicmagazine/layout-wrapper";
import { GamerWorldWrapper } from "@/templates/gamerworld/layout-wrapper";
import { PennNewsWrapper } from "@/templates/pennnews/layout-wrapper";
import { LifestyleWrapper } from "@/templates/lifestyle/layout-wrapper";

const documents = {
  privacy: ["Privacy policy", "privacyPolicy", "This privacy policy has not been configured yet."],
  terms: ["Terms of use", "termsOfUse", "Terms of use have not been configured yet."],
  cookies: ["Cookie policy", "cookiePolicy", "Cookie information has not been configured yet."],
  disclaimer: ["Disclaimer", "disclaimer", "No disclaimer has been configured yet."],
  "editorial-policy": ["Editorial policy", "editorialPolicy", "No editorial policy has been configured yet."],
  accessibility: ["Accessibility statement", "accessibilityStatement", "No accessibility statement has been configured yet."],
} as const;

export const dynamic = "force-dynamic";

export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const site = await getRequestSite();
  const { document } = await params;
  const config = documents[document as keyof typeof documents];
  if (!site || !config) notFound();
  const [title, field, fallback] = config;
  const paragraphs = renderPolicyText(String(site[field]), fallback);

  const content = (
    <div style={{ padding: "2rem 0" }}>
      <p className="nm-breadcrumb" style={{ marginBottom: "0.5rem" }}>
        <a href="/">Home</a> <span>/</span> <span>{title}</span>
      </p>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{title}</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Legal publisher: {site.legalName || site.name}</p>
      <div style={{ lineHeight: 1.8 }}>
        {paragraphs.map((paragraph) => <p key={paragraph} style={{ marginBottom: "1rem" }}>{paragraph}</p>)}
      </div>
    </div>
  );

  if (site.templateId === "newsmag") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <NewsmagWrapper site={site} categories={categories}>{content}</NewsmagWrapper>;
  }

  if (site.templateId === "magazine") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <MagazineWrapper site={site} categories={categories}>{content}</MagazineWrapper>;
  }

  if (site.templateId === "newsy") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <NewsynWrapper site={site} categories={categories}>{content}</NewsynWrapper>;
  }

  if (site.templateId === "hotnewsy") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <HotNewsyWrapper site={site} categories={categories}>{content}</HotNewsyWrapper>;
  }

  if (site.templateId === "hotmagazine") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <HotMagazineWrapper site={site} categories={categories}>{content}</HotMagazineWrapper>;
  }

  if (site.templateId === "classicmagazine") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <ClassicMagazineWrapper site={site} categories={categories}>{content}</ClassicMagazineWrapper>;
  }

  if (site.templateId === "gamerworld") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <GamerWorldWrapper site={site} categories={categories}>{content}</GamerWorldWrapper>;
  }

  if (site.templateId === "pennnews") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <PennNewsWrapper site={site} categories={categories}>{content}</PennNewsWrapper>;
  }

  if (site.templateId === "lifestyle") {
    const allPapers = await listWhitepapers({ siteId: site.id });
    const categories = [...new Set(allPapers.map((p) => p.category))];
    return <LifestyleWrapper site={site} categories={categories}>{content}</LifestyleWrapper>;
  }

  return <DefaultWrapper site={site}>{content}</DefaultWrapper>;
}
