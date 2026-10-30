"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function ClassicMagazineDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="cm">
      {/* Header */}
      <header className="cm-header">
        <div className="cm-header-top">
          <div className="cm-container">
            <div className="cm-header-inner">
              <Link href="/" className="cm-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="cm-logo-img" />
                ) : (
                  <span className="cm-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="cm-header-ad">
                <div className="cm-ad-space">ad</div>
                <span className="cm-ad-size">728 × 90</span>
              </div>
              <div className="cm-header-actions">
                <button className="cm-icon-btn" aria-label="Search">🔍</button>
                <button className="cm-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="cm-nav" aria-label="Main navigation">
          <div className="cm-container">
            <div className="cm-nav-inner">
              <Link href="/" className="cm-nav-link">Home</Link>
              {navCategories.slice(0, 7).map((cat) => (
                <Link key={cat} href={catHref(cat)} className={`cm-nav-link${paper.category === cat ? " active" : ""}`}>
                  {cat.toUpperCase()}
                </Link>
              ))}
              <Link href="#" className="cm-nav-link">MORE</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="cm-body">
        <div className="cm-container cm-main-wrap">
          <main className="cm-main">
            {/* Breadcrumb */}
            <nav className="cm-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article */}
            <article className="cm-article">
              <header className="cm-article-header">
                <span className="cm-article-category">{paper.category}</span>
                <h1 className="cm-article-title">{paper.title}</h1>
                {paper.subtitle && <p className="cm-article-subtitle">{paper.subtitle}</p>}
                <div className="cm-article-meta">
                  {paper.authorName && <span className="cm-article-author">By {paper.authorName}</span>}
                  <time dateTime={paper.publicationDate}>
                    {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  {paper.readingMinutes && (
                    <span className="cm-reading-time">{paper.readingMinutes} min read</span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {paper.coverImageUrl && (
                <div className="cm-article-image">
                  <img src={paper.coverImageUrl} alt={paper.title} />
                </div>
              )}

              {/* Article Content */}
              <div className="cm-article-content">
                {paper.summary && (
                  <div className="cm-summary">
                    <p>{paper.summary}</p>
                  </div>
                )}

                {paper.htmlContent ? (
                  <div className="cm-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
                ) : (
                  <>
                    {paper.abstract && (
                      <section className="cm-content-section">
                        <h2>Overview</h2>
                        <p>{paper.abstract}</p>
                      </section>
                    )}

                    {paper.keyFacts && paper.keyFacts.length > 0 && (
                      <section className="cm-content-section">
                        <h2>Key Facts</h2>
                        <ul className="cm-list">
                          {paper.keyFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.takeaways && paper.takeaways.length > 0 && (
                      <section className="cm-content-section">
                        <h2>Key Takeaways</h2>
                        <ul className="cm-list">
                          {paper.takeaways.map((takeaway, i) => (
                            <li key={i}>{takeaway}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.faqItems && paper.faqItems.length > 0 && (
                      <section className="cm-content-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="cm-faq">
                          {paper.faqItems.map((item, i) => (
                            <details key={i} className="cm-faq-item">
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
                  <div className="cm-tags">
                    {paper.tags.map((tag) => (
                      <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="cm-tag">
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Related Articles */}
            {relatedPapers.length > 0 && (
              <section className="cm-related">
                <h2 className="cm-section-title">Related Articles</h2>
                <div className="cm-posts-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="cm-post-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        <div className="cm-post-img">
                          {related.coverImageUrl ? (
                            <img src={related.coverImageUrl} alt={related.title} />
                          ) : (
                            <div className={`cm-placeholder art-${related.accent || "default"}`} />
                          )}
                        </div>
                        <div className="cm-post-body">
                          <span className="cm-post-category">{related.category}</span>
                          <h3 className="cm-post-title">{related.title}</h3>
                          <p className="cm-post-excerpt">{related.summary}</p>
                          <div className="cm-post-meta">
                            <time className="cm-post-date">
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
          <aside className="cm-sidebar">
            <div className="cm-widget cm-ad-widget">
              <div className="cm-ad-placeholder">ad<br/><span className="cm-ad-size-small">300 × 600</span></div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="cm-footer">
        <div className="cm-container">
          <div className="cm-footer-grid">
            <div className="cm-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="cm-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="cm-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="cm-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
