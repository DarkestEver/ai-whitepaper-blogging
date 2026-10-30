import { getRequestSite } from "@/lib/request-site";
import { listWhitepapers } from "@/lib/db";
import { notFound } from "next/navigation";
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

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const site = await getRequestSite();
  if (!site) notFound();

  const content = (
    <div style={{ padding: "2rem 0" }}>
      <p className="nm-breadcrumb" style={{ marginBottom: "0.5rem" }}>
        <a href="/">Home</a> <span>/</span> <span>Contact</span>
      </p>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Contact Us</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>{site.description}</p>
      <div style={{ lineHeight: 1.8 }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Get in touch</h2>
        {site.contactEmail && <p style={{ marginBottom: "0.5rem" }}>Email: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>}
        {site.contactPhone && <p style={{ marginBottom: "0.5rem" }}>Phone: {site.contactPhone}</p>}
        {site.contactAddress && <p style={{ marginBottom: "0.5rem" }}>{site.contactAddress}</p>}
        {!site.contactEmail && !site.contactPhone && !site.contactAddress && <p>Contact details have not been configured yet.</p>}
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
