"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function HotMagazineDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="hm">
      {/* Header */}
      <header className="hm-header">
        <div className="hm-header-top">
          <div className="hm-container">
            <div className="hm-header-inner">
              <Link href="/" className="hm-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="hm-logo-img" />
                ) : (
                  <span className="hm-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="hm-header-ad">
                <div className="hm-ad-space">ad</div>
              </div>
              <div className="hm-header-icons">
                <button className="hm-icon-btn" aria-label="Search">🔍</button>
                <button className="hm-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hm-nav" aria-label="Main navigation">
          <div className="hm-container">
            <div className="hm-nav-inner">
              <Link href="/" className="hm-nav-link">Home</Link>
              {navCategories.slice(0, 8).map((cat) => (
                <Link key={cat} href={catHref(cat)} className={`hm-nav-link${paper.category === cat ? " active" : ""}`}>
                  {cat.toUpperCase()}
                </Link>
              ))}
              <Link href="#" className="hm-nav-link">MORE</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="hm-body">
        <div className="hm-container hm-main-wrap">
          <main className="hm-main">
            {/* Breadcrumb */}
            <nav className="hm-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article */}
            <article className="hm-article">
              <header className="hm-article-header">
                <span className="hm-article-category">{paper.category}</span>
                <h1 className="hm-article-title">{paper.title}</h1>
                {paper.subtitle && <p className="hm-article-subtitle">{paper.subtitle}</p>}
                <div className="hm-article-meta">
                  {paper.authorName && <span className="hm-article-author">By {paper.authorName}</span>}
                  <time dateTime={paper.publicationDate}>
                    {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  {paper.readingMinutes && (
                    <span className="hm-reading-time">{paper.readingMinutes} min read</span>
                  )}
                </div>
              </header>

              {/* Featured Image */}
              {paper.coverImageUrl && (
                <div className="hm-article-image">
                  <img src={paper.coverImageUrl} alt={paper.title} />
                </div>
              )}

              {/* Article Content */}
              <div className="hm-article-content">
                {paper.summary && (
                  <div className="hm-summary">
                    <p>{paper.summary}</p>
                  </div>
                )}

                {paper.htmlContent ? (
                  <div className="hm-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
                ) : (
                  <>
                    {paper.abstract && (
                      <section className="hm-content-section">
                        <h2>Overview</h2>
                        <p>{paper.abstract}</p>
                      </section>
                    )}

                    {paper.keyFacts && paper.keyFacts.length > 0 && (
                      <section className="hm-content-section">
                        <h2>Key Facts</h2>
                        <ul className="hm-list">
                          {paper.keyFacts.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.takeaways && paper.takeaways.length > 0 && (
                      <section className="hm-content-section">
                        <h2>Key Takeaways</h2>
                        <ul className="hm-list">
                          {paper.takeaways.map((takeaway, i) => (
                            <li key={i}>{takeaway}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {paper.faqItems && paper.faqItems.length > 0 && (
                      <section className="hm-content-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="hm-faq">
                          {paper.faqItems.map((item, i) => (
                            <details key={i} className="hm-faq-item">
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
                  <div className="hm-tags">
                    {paper.tags.map((tag) => (
                      <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="hm-tag">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Related Articles */}
            {relatedPapers.length > 0 && (
              <section className="hm-related">
                <h2 className="hm-section-title">Related Articles</h2>
                <div className="hm-posts-grid">
                  {relatedPapers.slice(0, 4).map((related) => (
                    <article key={related.id} className="hm-post-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        <div className="hm-post-img">
                          {related.coverImageUrl ? (
                            <img src={related.coverImageUrl} alt={related.title} />
                          ) : (
                            <div className={`hm-placeholder art-${related.accent || "default"}`} />
                          )}
                          <div className="hm-post-overlay">
                            <button className="hm-like-btn">❤️</button>
                          </div>
                        </div>
                        <div className="hm-post-body">
                          <h3 className="hm-post-title">{related.title}</h3>
                          <div className="hm-post-meta">
                            <span className="hm-post-category">{related.category}</span>
                            <time className="hm-post-date">
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
          <aside className="hm-sidebar">
            <div className="hm-widget hm-ad-widget">
              <div className="hm-ad-placeholder">Ad Space 300x250</div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="hm-footer">
        <div className="hm-container">
          <div className="hm-footer-grid">
            <div className="hm-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="hm-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hm-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="hm-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
