"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function GamerWorldDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="gw">
      {/* Header */}
      <header className="gw-header">
        <div className="gw-header-top">
          <div className="gw-container">
            <div className="gw-header-inner">
              <Link href="/" className="gw-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="gw-logo-img" />
                ) : (
                  <span className="gw-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="gw-header-actions">
                <button className="gw-icon-btn" aria-label="Search">🔍</button>
                <button className="gw-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="gw-nav" aria-label="Main navigation">
          <div className="gw-container">
            <div className="gw-nav-inner">
              <Link href="/" className="gw-nav-link">Home</Link>
              {navCategories.slice(0, 7).map((cat) => (
                <Link key={cat} href={catHref(cat)} className={`gw-nav-link${paper.category === cat ? " active" : ""}`}>
                  {cat}
                </Link>
              ))}
              <Link href="#" className="gw-nav-link">More</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="gw-body">
        <div className="gw-container gw-main-wrap">
          <main className="gw-main">
            {/* Breadcrumb */}
            <nav className="gw-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article */}
            <article className="gw-article">
              <header className="gw-article-header">
                <span className="gw-article-category">{paper.category}</span>
                <h1 className="gw-article-title">{paper.title}</h1>
                {paper.subtitle && <p className="gw-article-subtitle">{paper.subtitle}</p>}
                <div className="gw-article-meta">
                  {paper.authorName && <span className="gw-article-author">By {paper.authorName}</span>}
                  <time dateTime={paper.publicationDate}>
                    {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  {paper.readingMinutes && (
                    <span className="gw-reading-time">{paper.readingMinutes} min read</span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {paper.coverImageUrl && (
                <div className="gw-article-image">
                  <img src={paper.coverImageUrl} alt={paper.title} />
                </div>
              )}

              {/* Article Content */}
              <div className="gw-article-content">
                {paper.summary && (
                  <div className="gw-summary">
                    <p>{paper.summary}</p>
                  </div>
                )}

                {paper.htmlContent ? (
                  <div className="gw-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
                ) : (
                  <>
                    {paper.abstract && (
                      <section className="gw-content-section">
                        <h2>Overview</h2>
                        <p>{paper.abstract}</p>
                      </section>
                    )}

                    {paper.keyFacts && paper.keyFacts.length > 0 && (
                      <section className="gw-content-section">
                        <h2>Key Facts</h2>
                        <ul className="gw-list">
                          {paper.keyFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.takeaways && paper.takeaways.length > 0 && (
                      <section className="gw-content-section">
                        <h2>Key Takeaways</h2>
                        <ul className="gw-list">
                          {paper.takeaways.map((takeaway, i) => (
                            <li key={i}>{takeaway}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.faqItems && paper.faqItems.length > 0 && (
                      <section className="gw-content-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="gw-faq">
                          {paper.faqItems.map((item, i) => (
                            <details key={i} className="gw-faq-item">
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
                  <div className="gw-tags">
                    {paper.tags.map((tag) => (
                      <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="gw-tag">
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Related Articles */}
            {relatedPapers.length > 0 && (
              <section className="gw-related">
                <h2 className="gw-section-header">Related Articles</h2>
                <div className="gw-posts-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="gw-post-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        <div className="gw-post-img">
                          {related.coverImageUrl ? (
                            <img src={related.coverImageUrl} alt={related.title} />
                          ) : (
                            <div className={`gw-placeholder art-${related.accent || "default"}`} />
                          )}
                        </div>
                        <div className="gw-post-body">
                          <span className="gw-post-category">{related.category}</span>
                          <h3 className="gw-post-title">{related.title}</h3>
                          <p className="gw-post-excerpt">{related.summary}</p>
                          <div className="gw-post-meta">
                            <time className="gw-post-date">
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
          <aside className="gw-sidebar">
            {relatedPapers.length > 0 && (
              <div className="gw-widget gw-related-widget">
                <h3 className="gw-widget-title">Related Content</h3>
                <div className="gw-related-list">
                  {relatedPapers.slice(0, 3).map((p) => (
                    <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="gw-related-item">
                      {p.coverImageUrl && (
                        <img src={p.coverImageUrl} alt={p.title} className="gw-related-img" />
                      )}
                      <h4 className="gw-related-title">{p.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="gw-footer">
        <div className="gw-container">
          <div className="gw-footer-grid">
            <div className="gw-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="gw-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="gw-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="gw-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
