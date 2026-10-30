"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

export function MagazineDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="mag">
      {/* Header */}
      <header className="mag-header">
        <div className="mag-container mag-header-inner">
          <Link href="/" className="mag-logo">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.name} className="mag-logo-img" />
            ) : (
              <span className="mag-logo-text">{site.name.charAt(0).toUpperCase()}.</span>
            )}
          </Link>
          <nav className="mag-header-nav">
            <Link href="/">Home</Link>
            {navCategories.slice(0, 5).map((cat) => (
              <Link key={cat} href={catHref(cat)}>
                {cat}
              </Link>
            ))}
            <Link href="/pages">Pages</Link>
          </nav>
          <div className="mag-header-icons">
            <button className="mag-icon-btn" aria-label="Social">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9h-4v4h4v-4z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mag-body">
        <article className="mag-article">
          <div className="mag-container">
            {/* Breadcrumb */}
            <nav className="mag-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article Header */}
            <header className="mag-article-header">
              <span className="mag-article-category">{paper.category}</span>
              <h1 className="mag-article-title">{paper.title}</h1>
              {paper.subtitle && <p className="mag-article-subtitle">{paper.subtitle}</p>}
              <div className="mag-article-meta">
                {paper.authorName && <span className="mag-author">By {paper.authorName}</span>}
                <time dateTime={paper.publicationDate}>
                  {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                {paper.readingMinutes && (
                  <span className="mag-reading-time">{paper.readingMinutes} min read</span>
                )}
              </div>
            </header>

            {/* Featured Image */}
            {paper.coverImageUrl && (
              <div className="mag-article-image">
                <img src={paper.coverImageUrl} alt={paper.title} />
              </div>
            )}

            {/* Main Content */}
            <div className="mag-article-content">
              {paper.summary && (
                <div className="mag-summary">
                  <p>{paper.summary}</p>
                </div>
              )}

              {paper.htmlContent ? (
                <div className="mag-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
              ) : (
                <>
                  {paper.abstract && (
                    <section className="mag-content-section">
                      <h2>Overview</h2>
                      <p>{paper.abstract}</p>
                    </section>
                  )}

                  {paper.keyFacts && paper.keyFacts.length > 0 && (
                    <section className="mag-content-section">
                      <h2>Key Facts</h2>
                      <ul className="mag-list">
                        {paper.keyFacts.map((fact, i) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {paper.takeaways && paper.takeaways.length > 0 && (
                    <section className="mag-content-section">
                      <h2>Key Takeaways</h2>
                      <ul className="mag-list">
                        {paper.takeaways.map((takeaway, i) => (
                          <li key={i}>{takeaway}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {paper.faqItems && paper.faqItems.length > 0 && (
                    <section className="mag-content-section">
                      <h2>Frequently Asked Questions</h2>
                      <div className="mag-faq">
                        {paper.faqItems.map((item, i) => (
                          <details key={i} className="mag-faq-item">
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
                <div className="mag-tags">
                  {paper.tags.map((tag) => (
                    <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="mag-tag">
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Articles */}
          {relatedPapers.length > 0 && (
            <section className="mag-related">
              <div className="mag-container">
                <h2 className="mag-section-title">Related Articles</h2>
                <div className="mag-posts-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="mag-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        {related.coverImageUrl ? (
                          <img src={related.coverImageUrl} alt={related.title} className="mag-card-image" />
                        ) : (
                          <div className={`mag-card-placeholder art-${related.accent || "default"}`} />
                        )}
                        <div className="mag-card-body">
                          <span className="mag-card-category">{related.category}</span>
                          <h3 className="mag-card-title">{related.title}</h3>
                          <time className="mag-card-date">
                            {new Date(related.publicationDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </article>
      </div>

      {/* Footer */}
      <footer className="mag-footer">
        <div className="mag-container">
          <div className="mag-footer-grid">
            <div className="mag-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="mag-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mag-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mag-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
