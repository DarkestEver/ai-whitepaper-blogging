"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function PennNewsDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="pn">
      {/* Header */}
      <header className="pn-header">
        <div className="pn-header-top">
          <div className="pn-container">
            <div className="pn-header-inner">
              <Link href="/" className="pn-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="pn-logo-img" />
                ) : (
                  <span className="pn-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="pn-header-actions">
                <button className="pn-icon-btn" aria-label="Search">🔍</button>
                <button className="pn-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="pn-nav" aria-label="Main navigation">
          <div className="pn-container">
            <div className="pn-nav-inner">
              <Link href="/" className="pn-nav-link">Home</Link>
              {navCategories.slice(0, 7).map((cat) => (
                <Link key={cat} href={catHref(cat)} className={`pn-nav-link${paper.category === cat ? " active" : ""}`}>
                  {cat}
                </Link>
              ))}
              <Link href="#" className="pn-nav-link">More</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="pn-body">
        <div className="pn-container pn-main-wrap">
          <main className="pn-main">
            {/* Breadcrumb */}
            <nav className="pn-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article */}
            <article className="pn-article">
              <header className="pn-article-header">
                <span className="pn-article-category">{paper.category}</span>
                <h1 className="pn-article-title">{paper.title}</h1>
                {paper.subtitle && <p className="pn-article-subtitle">{paper.subtitle}</p>}
                <div className="pn-article-meta">
                  {paper.authorName && <span className="pn-article-author">By {paper.authorName}</span>}
                  <time dateTime={paper.publicationDate}>
                    {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  {paper.readingMinutes && (
                    <span className="pn-reading-time">{paper.readingMinutes} min read</span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {paper.coverImageUrl && (
                <div className="pn-article-image">
                  <img src={paper.coverImageUrl} alt={paper.title} />
                </div>
              )}

              {/* Article Content */}
              <div className="pn-article-content">
                {paper.summary && (
                  <div className="pn-summary">
                    <p>{paper.summary}</p>
                  </div>
                )}

                {paper.htmlContent ? (
                  <div className="pn-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
                ) : (
                  <>
                    {paper.abstract && (
                      <section className="pn-content-section">
                        <h2>Overview</h2>
                        <p>{paper.abstract}</p>
                      </section>
                    )}

                    {paper.keyFacts && paper.keyFacts.length > 0 && (
                      <section className="pn-content-section">
                        <h2>Key Facts</h2>
                        <ul className="pn-list">
                          {paper.keyFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.takeaways && paper.takeaways.length > 0 && (
                      <section className="pn-content-section">
                        <h2>Key Takeaways</h2>
                        <ul className="pn-list">
                          {paper.takeaways.map((takeaway, i) => (
                            <li key={i}>{takeaway}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.faqItems && paper.faqItems.length > 0 && (
                      <section className="pn-content-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="pn-faq">
                          {paper.faqItems.map((item, i) => (
                            <details key={i} className="pn-faq-item">
                              <summary>{item.question}</summary>
                              <p>{item.answer}</p>
                            </details>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}

                {/* Tags */}
                {(paper.tags || []).length > 0 && (
                  <div className="pn-tags">
                    {paper.tags.map((tag) => (
                      <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="pn-tag">
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Related Articles */}
            {relatedPapers.length > 0 && (
              <section className="pn-related">
                <h2 className="pn-section-header">Related Articles</h2>
                <div className="pn-related-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="pn-related-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        <div className="pn-related-img">
                          {related.coverImageUrl ? (
                            <img src={related.coverImageUrl} alt={related.title} />
                          ) : (
                            <div className={`pn-placeholder art-${related.accent || "default"}`} />
                          )}
                        </div>
                        <div className="pn-related-body">
                          <span className="pn-related-cat">{related.category}</span>
                          <h3 className="pn-related-title">{related.title}</h3>
                          <p className="pn-related-excerpt">{related.summary}</p>
                          <div className="pn-related-meta">
                            <time className="pn-related-date">
                              {new Date(related.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="pn-sidebar">
            {relatedPapers.length > 0 && (
              <div className="pn-widget pn-related-widget">
                <h3 className="pn-widget-title">Related Content</h3>
                <div className="pn-related-list">
                  {relatedPapers.slice(0, 3).map((p) => (
                    <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="pn-related-item">
                      {p.coverImageUrl && (
                        <img src={p.coverImageUrl} alt={p.title} className="pn-related-item-img" />
                      )}
                      <h4 className="pn-related-item-title">{p.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="pn-footer">
        <div className="pn-container">
          <div className="pn-footer-grid">
            <div className="pn-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="pn-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pn-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pn-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
