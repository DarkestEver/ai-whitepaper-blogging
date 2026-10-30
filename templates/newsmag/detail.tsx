import Link from "next/link";
import type { PaperRecord } from "@/lib/db";
import { DownloadForm } from "@/components/download-form";

import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

const documentTypeLabels: Record<PaperRecord["documentType"], string> = {
  whitepaper: "Whitepaper",
  research_report: "Research report",
  case_study: "Case study",
  guide: "Guide",
  briefing: "Briefing",
};

export function NewsmagDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const year = now.getFullYear();

  return (
    <div className="nm">
      {/* Top Bar */}
      <div className="nm-topbar">
        <div className="nm-container nm-topbar-inner">
          <span className="nm-topbar-date">{dateStr}</span>
          <div className="nm-topbar-links">
            <Link href="/contact">Contact</Link>
            {site.indexingEnabled && <Link href="/rss.xml">RSS Feed</Link>}
          </div>
        </div>
      </div>

      {/* Logo Bar */}
      <div className="nm-logobar">
        <div className="nm-container nm-logobar-inner">
          <Link href="/" className="nm-logo">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.name} className="nm-logo-img" />
            ) : (
              <div>
                <span className="nm-logo-text">{site.name}</span>
                {site.tagline && <span className="nm-logo-tagline">{site.tagline}</span>}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="nm-nav" aria-label="Main navigation">
        <div className="nm-container nm-nav-inner">
          <Link href="/" className="nm-nav-link nm-nav-home">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </Link>
          <Link href="/" className="nm-nav-link">Home</Link>
          {categories.filter((c) => c !== "All topics").slice(0, 8).map((cat) => (
            <Link key={cat} href={`/category/${slugify(cat)}`} className={`nm-nav-link${cat === paper.category ? " active" : ""}`}>{cat}</Link>
          ))}
        </div>
      </nav>

      <div className="nm-container nm-main-wrap">
        <main className="nm-content">
          {/* Breadcrumb */}
          <nav className="nm-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href={`/category/${slugify(paper.category)}`}>{paper.category}</Link>
            <span>/</span>
            <span>{paper.title}</span>
          </nav>

          <article className="nm-article">
            <header className="nm-article-header">
              <span className="nm-cat-badge">{paper.category}</span>
              <h1 className="nm-article-title">{paper.title}</h1>
              {paper.subtitle && <p className="nm-article-subtitle">{paper.subtitle}</p>}
              <div className="nm-article-meta">
                <span className="nm-article-author">
                  <span className="nm-author-avatar">{paper.authorName.charAt(0)}</span>
                  By <strong>{paper.authorName}</strong>
                  {paper.authorTitle && <span className="nm-author-title"> — {paper.authorTitle}</span>}
                </span>
                <span>{paper.publicationDate || paper.publishedLabel}</span>
                <span>{paper.readingMinutes} min read</span>
              </div>
              <div className="nm-article-type">
                {documentTypeLabels[paper.documentType]} · Published by {paper.publisher}
              </div>
            </header>

            {paper.coverImageUrl ? (
              <div className="nm-article-cover">
                <img src={paper.coverImageUrl} alt={paper.coverImageAlt || paper.title} />
              </div>
            ) : (
              <div className={`nm-article-cover-placeholder art-${paper.accent}`}>
                <span>{paper.category}</span>
                <span className="nm-cover-issue">{paper.issue}</span>
              </div>
            )}

            <div className="nm-article-summary">
              <p>{paper.summary}</p>
            </div>

            {(paper.industry || paper.geographicTarget || paper.tags.length > 0) && (
              <div className="nm-article-tags">
                {paper.industry && <span className="nm-tag">{paper.industry}</span>}
                {paper.geographicTarget && <span className="nm-tag">{paper.geographicTarget}</span>}
                {paper.tags.map((tag) => <span className="nm-tag" key={tag}>{tag}</span>)}
              </div>
            )}

            <div className="nm-article-body">
              {paper.htmlContent ? (
                <div className="html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
              ) : (
                <>
                  {paper.abstract && (
                    <section>
                      <h2>Overview</h2>
                      <p>{paper.abstract}</p>
                    </section>
                  )}

                  {paper.takeaways.length > 0 && (
                    <section className="nm-takeaways">
                      <h2>Key Takeaways</h2>
                      <ul>
                        {paper.takeaways.map((t) => <li key={t}>{t}</li>)}
                      </ul>
                    </section>
                  )}

                  {paper.geoSummary && (
                    <section>
                      <h2>Key Answer</h2>
                      <blockquote>{paper.geoSummary}</blockquote>
                    </section>
                  )}

                  {paper.keyEntities.length > 0 && (
                    <section>
                      <h2>Topics & Entities</h2>
                      <div className="nm-article-tags">
                        {paper.keyEntities.map((e) => <span className="nm-tag" key={e}>{e}</span>)}
                      </div>
                    </section>
                  )}

                  {paper.keyFacts.length > 0 && (
                    <section>
                      <h2>Key Facts</h2>
                      <ul className="nm-facts">
                        {paper.keyFacts.map((f) => <li key={f}>{f}</li>)}
                      </ul>
                    </section>
                  )}

                  {paper.faqItems.length > 0 && (
                    <section className="nm-faq">
                      <h2>Frequently Asked Questions</h2>
                      {paper.faqItems.map((item) => (
                        <div key={item.question} className="nm-faq-item">
                          <h3>{item.question}</h3>
                          <p>{item.answer}</p>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>

            {paper.downloadablePdfAsset ? (
              <div className="nm-download-box">
                <h3>Download this {documentTypeLabels[paper.documentType]}</h3>
                <DownloadForm paperId={paper.id} title={paper.title} />
              </div>
            ) : (
              <div className="nm-download-box nm-download-pending">
                <strong>Download</strong>
                <p>No approved PDF asset is attached yet.</p>
              </div>
            )}

            {(paper.sourceName || paper.sourceUrl) && (
              <div className="nm-source">
                Source: {paper.sourceUrl
                  ? <a href={paper.sourceUrl} rel="noreferrer">{paper.sourceName || paper.sourceUrl}</a>
                  : paper.sourceName}
              </div>
            )}
          </article>

          {relatedPapers.length > 0 && (
            <section className="nm-related">
              <div className="nm-section-header">
                <h2 className="nm-section-title">Related Posts</h2>
              </div>
              <div className="nm-related-grid">
                {relatedPapers.slice(0, 3).map((p) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-grid-card">
                    <div className="nm-grid-img">
                      {p.coverImageUrl ? (
                        <img src={p.coverImageUrl} alt={p.title} />
                      ) : (
                        <div className={`nm-placeholder-img art-${p.accent}`}>{p.category}</div>
                      )}
                    </div>
                    <div className="nm-grid-info">
                      <span className="nm-cat-badge small">{p.category}</span>
                      <h3 className="nm-grid-title">{p.title}</h3>
                      <p className="nm-post-meta">{p.publicationDate || p.publishedLabel}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="nm-sidebar">
          <div className="nm-widget nm-ad-widget">
            <div className="nm-ad-placeholder nm-ad-300">300 x 250 Ad</div>
          </div>

          {relatedPapers.length > 0 && (
            <div className="nm-widget">
              <h3 className="nm-widget-title">Related Posts</h3>
              <div className="nm-popular-list">
                {relatedPapers.slice(0, 4).map((p, i) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-popular-item">
                    <span className="nm-popular-num">{i + 1}</span>
                    <div className="nm-popular-img">
                      {p.coverImageUrl ? (
                        <img src={p.coverImageUrl} alt={p.title} />
                      ) : (
                        <div className={`nm-placeholder-img-sm art-${p.accent}`}>{p.category?.charAt(0)}</div>
                      )}
                    </div>
                    <div className="nm-popular-info">
                      <h4>{p.title}</h4>
                      <span className="nm-post-meta">{p.publicationDate || p.publishedLabel}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* Footer */}
      <footer className="nm-footer">
        <div className="nm-container">
          <div className="nm-footer-bottom">
            <p>&copy; {year} {site.legalName || site.name}. All rights reserved.</p>
            <div className="nm-footer-bottom-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
              {site.indexingEnabled && <Link href="/rss.xml">RSS</Link>}
              {site.indexingEnabled && <Link href="/sitemap.xml">Sitemap</Link>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
