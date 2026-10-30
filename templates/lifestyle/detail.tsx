"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function LifestyleDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="ls">
      {/* Header */}
      <header className="ls-header">
        <div className="ls-header-top">
          <div className="ls-container">
            <div className="ls-header-inner">
              <Link href="/" className="ls-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="ls-logo-img" />
                ) : (
                  <span className="ls-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="ls-header-actions">
                <button className="ls-search-btn" aria-label="Search">🔍</button>
                <button className="ls-menu-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ls-nav" aria-label="Main navigation">
          <div className="ls-container">
            <div className="ls-nav-inner">
              <Link href="/" className="ls-nav-link">Home</Link>
              {navCategories.slice(0, 6).map((cat) => (
                <Link key={cat} href={catHref(cat)} className={`ls-nav-link${paper.category === cat ? " active" : ""}`}>
                  {cat}
                </Link>
              ))}
              <Link href="#" className="ls-nav-link">More</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="ls-body">
        <div className="ls-container ls-main-wrap">
          <main className="ls-main">
            {/* Breadcrumb */}
            <nav className="ls-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article */}
            <article className="ls-article">
              <header className="ls-article-header">
                <span className="ls-article-cat">{paper.category}</span>
                <h1 className="ls-article-title">{paper.title}</h1>
                {paper.subtitle && <p className="ls-article-subtitle">{paper.subtitle}</p>}
                <div className="ls-article-meta">
                  {paper.authorName && <span className="ls-article-author">By {paper.authorName}</span>}
                  <time dateTime={paper.publicationDate}>
                    {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  {paper.readingMinutes && (
                    <span className="ls-reading-time">{paper.readingMinutes} min read</span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {paper.coverImageUrl && (
                <div className="ls-article-image">
                  <img src={paper.coverImageUrl} alt={paper.title} />
                </div>
              )}

              {/* Article Content */}
              <div className="ls-article-content">
                {paper.summary && (
                  <div className="ls-summary">
                    <p>{paper.summary}</p>
                  </div>
                )}

                {paper.htmlContent ? (
                  <div className="ls-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
                ) : (
                  <>
                    {paper.abstract && (
                      <section className="ls-content-section">
                        <h2>Overview</h2>
                        <p>{paper.abstract}</p>
                      </section>
                    )}

                    {paper.keyFacts && paper.keyFacts.length > 0 && (
                      <section className="ls-content-section">
                        <h2>Key Points</h2>
                        <ul className="ls-list">
                          {paper.keyFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.takeaways && paper.takeaways.length > 0 && (
                      <section className="ls-content-section">
                        <h2>Takeaways</h2>
                        <ul className="ls-list">
                          {paper.takeaways.map((takeaway, i) => (
                            <li key={i}>{takeaway}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.faqItems && paper.faqItems.length > 0 && (
                      <section className="ls-content-section">
                        <h2>FAQ</h2>
                        <div className="ls-faq">
                          {paper.faqItems.map((item, i) => (
                            <details key={i} className="ls-faq-item">
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
                  <div className="ls-tags">
                    {paper.tags.map((tag) => (
                      <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="ls-tag">
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Related Articles */}
            {relatedPapers.length > 0 && (
              <section className="ls-related">
                <h2 className="ls-related-title">Related Articles</h2>
                <div className="ls-related-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="ls-related-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        <div className="ls-related-img">
                          {related.coverImageUrl ? (
                            <img src={related.coverImageUrl} alt={related.title} />
                          ) : (
                            <div className={`ls-placeholder art-${related.accent || "default"}`} />
                          )}
                        </div>
                        <div className="ls-related-body">
                          <span className="ls-related-cat">{related.category}</span>
                          <h3 className="ls-related-title">{related.title}</h3>
                          <div className="ls-related-meta">
                            <time className="ls-related-date">
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
          <aside className="ls-sidebar">
            {/* About Widget */}
            <div className="ls-widget ls-about-widget">
              <h3 className="ls-widget-title">About Us</h3>
              <p className="ls-widget-text">{site.description || site.name}</p>
            </div>

            {relatedPapers.length > 0 && (
              <div className="ls-widget ls-popular-widget">
                <h3 className="ls-widget-title">Related Content</h3>
                <div className="ls-popular-list">
                  {relatedPapers.slice(0, 4).map((p) => (
                    <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="ls-popular-item">
                      {p.coverImageUrl && (
                        <img src={p.coverImageUrl} alt={p.title} className="ls-popular-img" />
                      )}
                      <div className="ls-popular-body">
                        <h4 className="ls-popular-title">{p.title}</h4>
                        <span className="ls-popular-date">
                          {new Date(p.publicationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="ls-footer">
        <div className="ls-container">
          <div className="ls-footer-grid">
            <div className="ls-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="ls-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ls-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="ls-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
