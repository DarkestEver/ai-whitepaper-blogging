"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function HotNewsyDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="hn">
      {/* Header */}
      <header className="hn-header">
        <div className="hn-header-top">
          <div className="hn-container">
            <div className="hn-header-inner">
              <Link href="/" className="hn-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="hn-logo-img" />
                ) : (
                  <span className="hn-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="hn-header-actions">
                <button className="hn-search-toggle" aria-label="Search">🔍</button>
                <button className="hn-menu-toggle" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hn-nav" aria-label="Main navigation">
          <div className="hn-container">
            <div className="hn-nav-inner">
              <Link href="/" className="hn-nav-link">Home</Link>
              {navCategories.slice(0, 6).map((cat) => (
                <Link key={cat} href={catHref(cat)} className={`hn-nav-link${paper.category === cat ? " active" : ""}`}>
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <div className="hn-body">
        <div className="hn-container hn-main-wrap">
          <main className="hn-main">
            {/* Breadcrumb */}
            <nav className="hn-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article Header */}
            <article className="hn-article">
              <header className="hn-article-header">
                <span className="hn-article-tag">{paper.category}</span>
                <h1 className="hn-article-title">{paper.title}</h1>
                {paper.subtitle && <p className="hn-article-subtitle">{paper.subtitle}</p>}
                <div className="hn-article-meta">
                  {paper.authorName && <span className="hn-article-author">By {paper.authorName}</span>}
                  <time dateTime={paper.publicationDate}>
                    {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  {paper.readingMinutes && (
                    <span className="hn-reading-time">{paper.readingMinutes} min read</span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {paper.coverImageUrl && (
                <div className="hn-article-image">
                  <img src={paper.coverImageUrl} alt={paper.title} />
                </div>
              )}

              {/* Article Content */}
              <div className="hn-article-content">
                {paper.summary && (
                  <div className="hn-summary">
                    <p>{paper.summary}</p>
                  </div>
                )}

                {paper.htmlContent ? (
                  <div className="hn-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
                ) : (
                  <>
                    {paper.abstract && (
                      <section className="hn-content-section">
                        <h2>Overview</h2>
                        <p>{paper.abstract}</p>
                      </section>
                    )}

                    {paper.keyFacts && paper.keyFacts.length > 0 && (
                      <section className="hn-content-section">
                        <h2>Key Facts</h2>
                        <ul className="hn-list">
                          {paper.keyFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.takeaways && paper.takeaways.length > 0 && (
                      <section className="hn-content-section">
                        <h2>Key Takeaways</h2>
                        <ul className="hn-list">
                          {paper.takeaways.map((takeaway, i) => (
                            <li key={i}>{takeaway}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.faqItems && paper.faqItems.length > 0 && (
                      <section className="hn-content-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="hn-faq">
                          {paper.faqItems.map((item, i) => (
                            <details key={i} className="hn-faq-item">
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
                  <div className="hn-tags">
                    {paper.tags.map((tag) => (
                      <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="hn-tag">
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Article Actions */}
              <div className="hn-article-actions">
                <button className="hn-action-btn">❤️ Like</button>
                <button className="hn-action-btn">💬 Comment</button>
                <button className="hn-action-btn">↗️ Share</button>
              </div>
            </article>

            {/* Related Articles */}
            {relatedPapers.length > 0 && (
              <section className="hn-related">
                <h2 className="hn-section-title">Related Articles</h2>
                <div className="hn-posts-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="hn-post-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        <div className="hn-post-img">
                          {related.coverImageUrl ? (
                            <img src={related.coverImageUrl} alt={related.title} />
                          ) : (
                            <div className={`hn-placeholder art-${related.accent || "default"}`} />
                          )}
                        </div>
                        <div className="hn-post-body">
                          <div className="hn-post-meta">
                            <span className="hn-post-tag">{related.category}</span>
                            <time className="hn-post-date">
                              {new Date(related.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                          <h3 className="hn-post-title">{related.title}</h3>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hn-sidebar">
            <div className="hn-widget hn-ad-widget">
              <div className="hn-ad-placeholder">Ad 300x250</div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="hn-footer">
        <div className="hn-container">
          <div className="hn-footer-grid">
            <div className="hn-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="hn-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hn-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="hn-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
