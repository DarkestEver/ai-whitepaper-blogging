import Link from "next/link";
import type { PaperRecord } from "@/lib/db";
import { DownloadForm } from "@/components/download-form";
import type { DetailPageData } from "../registry";

const documentTypeLabels: Record<PaperRecord["documentType"], string> = {
  whitepaper: "Whitepaper",
  research_report: "Research report",
  case_study: "Case study",
  guide: "Guide",
  briefing: "Briefing",
};

export function DefaultDetail({ site, paper }: DetailPageData) {
  return (
    <div className="site-shell detail-shell" data-theme={site.themeId}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <span className="brand-mark" aria-hidden="true">{site.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{site.name}</strong><small>{site.tagline || site.description}</small></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/#library">Explore research</Link>
          <Link href="/#about">About the library</Link>
        </nav>
        <span className="demo-chip">{site.tagline || "Research library"}</span>
      </header>

      <main id="main-content" className="detail-main">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/#library">Research</Link><span aria-hidden="true">/</span><span>{paper.category}</span>
        </nav>

        <article className="detail-layout">
          <div className={`detail-cover art-${paper.accent}${paper.coverImageUrl ? " has-cover-image" : ""}`}>
            {paper.coverImageUrl ? (
              <img className="detail-cover-image" src={paper.coverImageUrl} alt={paper.coverImageAlt} />
            ) : (
              <>
                <span className="paper-art-top">{paper.category}</span>
                <span className="detail-cover-number">{paper.issue}</span>
                <span className="detail-cover-title">{paper.title}</span>
                <span className="paper-art-bottom">SIGNAL / RESEARCH</span>
              </>
            )}
          </div>

          <div className="detail-copy">
            <p className="eyebrow">{documentTypeLabels[paper.documentType]} · {paper.publicationDate || paper.publishedLabel}</p>
            <h1>{paper.title}</h1>
            {paper.subtitle && <p className="detail-summary">{paper.subtitle}</p>}
            <p className="detail-summary">{paper.summary}</p>
            <div className="detail-byline">
              <span className="byline-mark" aria-hidden="true">S</span>
              <span>By <strong>{paper.authorName}</strong>{paper.authorTitle ? `, ${paper.authorTitle}` : ""} · Published by <strong>{paper.publisher}</strong></span>
              <span className="byline-divider" aria-hidden="true">·</span>
              <span>{paper.readingMinutes} min read</span>
            </div>
            {(paper.industry || paper.geographicTarget || paper.tags.length > 0) && (
              <div className="content-taxonomy" aria-label="Content topics">
                {paper.industry && <span>{paper.industry}</span>}
                {paper.geographicTarget && <span>{paper.geographicTarget}</span>}
                {paper.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            )}
            {paper.downloadablePdfAsset ? (
              <section className="prototype-callout"><h2 id="download-heading">Download this brief</h2><DownloadForm paperId={paper.id} title={paper.title} /></section>
            ) : (
              <div className="prototype-callout" role="note"><strong>Download status</strong><span>No approved public PDF asset is attached yet.</span></div>
            )}
            <a className="button button-dark" href="/#library">Back to research library <span aria-hidden="true">↗</span></a>
          </div>
        </article>

        {paper.htmlContent ? (
          <div className="detail-body html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
        ) : (
          <>
            <div className="detail-body">
              <section>
                <p className="eyebrow">The brief</p>
                <h2>A useful place to <em>begin.</em></h2>
                <p className="detail-paragraph">{paper.abstract}</p>
              </section>
              <aside className="takeaways">
                <p className="eyebrow">Inside this brief</p>
                <h2>Key ideas</h2>
                <ul>{paper.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
              </aside>
            </div>

            {paper.keyFacts.length > 0 && (
              <section>
                <p className="eyebrow">Research notes</p>
                <h2>Key facts</h2>
                <ul className="fact-list">{paper.keyFacts.map((f) => <li key={f}>{f}</li>)}</ul>
              </section>
            )}
            {paper.faqItems.length > 0 && (
              <section>
                <p className="eyebrow">Quick answers</p>
                <h2>Frequently asked questions</h2>
                <ul className="faq-list">{paper.faqItems.map((item) => (
                  <li key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></li>
                ))}</ul>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>{site.name}</strong><small>Research for better decisions</small></span>
        </Link>
        <p>Prototype experience · Not a production publishing service</p>
        <Link href="/#library">Explore more research ↑</Link>
      </footer>
    </div>
  );
}
