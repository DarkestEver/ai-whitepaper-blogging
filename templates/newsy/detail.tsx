"use client";

import Link from "next/link";
import type { DetailPageData } from "../registry";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

const categoryEmojis: Record<string, string> = {
  "News": "📰",
  "Entertainment": "🎬",
  "Funny": "😂",
  "Cute": "🐱",
  "Animals": "🦁",
  "Quiz": "❓",
  "List": "📋",
  "Video": "🎥",
  "Tech": "💻",
  "Science": "🔬",
  "Sports": "⚽",
  "Business": "💼",
  "Health": "🏥",
  "Food": "🍔",
  "Travel": "✈️",
  "Music": "🎵",
  "Art": "🎨",
  "Fashion": "👗",
};

function getCategoryEmoji(category: string): string {
  return categoryEmojis[category] || "📌";
}

export function NewsynDetail({ site, paper, relatedPapers, categories }: DetailPageData) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="nsy">
      {/* Header */}
      <header className="nsy-header">
        <div className="nsy-container nsy-header-inner">
          <Link href="/" className="nsy-logo">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.name} className="nsy-logo-img" />
            ) : (
              <span className="nsy-logo-text">{site.name}</span>
            )}
          </Link>
          <div className="nsy-search-box">
            <input type="search" placeholder="Search" className="nsy-search-input" />
            <button className="nsy-search-btn" aria-label="Search">🔍</button>
          </div>
          <button className="nsy-menu-btn" aria-label="Menu">☰</button>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="nsy-cat-nav" aria-label="Category navigation">
        <div className="nsy-container nsy-cat-nav-inner">
          <Link href="/" className="nsy-cat-tab">All</Link>
          {navCategories.slice(0, 7).map((cat) => (
            <Link key={cat} href={catHref(cat)} className={`nsy-cat-tab${paper.category === cat ? " active" : ""}`}>
              {getCategoryEmoji(cat)} {cat}
            </Link>
          ))}
        </div>
      </nav>

      <div className="nsy-body">
        <article className="nsy-article">
          <div className="nsy-container">
            {/* Breadcrumb */}
            <nav className="nsy-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={catHref(paper.category)}>{paper.category}</Link>
              <span>/</span>
              <span>{paper.title}</span>
            </nav>

            {/* Article Header */}
            <header className="nsy-article-header">
              <span className="nsy-article-emoji">{getCategoryEmoji(paper.category)}</span>
              <span className="nsy-article-category">{paper.category}</span>
              <h1 className="nsy-article-title">{paper.title}</h1>
              {paper.subtitle && <p className="nsy-article-subtitle">{paper.subtitle}</p>}
              <div className="nsy-article-meta">
                {paper.authorName && <span className="nsy-article-author">By {paper.authorName}</span>}
                <time dateTime={paper.publicationDate}>
                  {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                {paper.readingMinutes && (
                  <span className="nsy-reading-time">{paper.readingMinutes} min read</span>
                )}
              </div>
            </header>

            {/* Featured Image */}
            {paper.coverImageUrl && (
              <div className="nsy-article-image">
                <img src={paper.coverImageUrl} alt={paper.title} />
              </div>
            )}

            {/* Article Content */}
            <div className="nsy-article-content">
              {paper.summary && (
                <div className="nsy-summary">
                  <p>{paper.summary}</p>
                </div>
              )}

              {paper.htmlContent ? (
                <div className="nsy-html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
              ) : (
                <>
                  {paper.abstract && (
                    <section className="nsy-content-section">
                      <h2>Overview</h2>
                      <p>{paper.abstract}</p>
                    </section>
                  )}

                  {paper.keyFacts && paper.keyFacts.length > 0 && (
                    <section className="nsy-content-section">
                      <h2>Key Facts</h2>
                      <ul className="nsy-list">
                        {paper.keyFacts.map((fact, i) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {paper.takeaways && paper.takeaways.length > 0 && (
                    <section className="nsy-content-section">
                      <h2>Key Takeaways</h2>
                      <ul className="nsy-list">
                        {paper.takeaways.map((takeaway, i) => (
                          <li key={i}>{takeaway}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {paper.faqItems && paper.faqItems.length > 0 && (
                    <section className="nsy-content-section">
                      <h2>Frequently Asked Questions</h2>
                      <div className="nsy-faq">
                        {paper.faqItems.map((item, i) => (
                          <details key={i} className="nsy-faq-item">
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
                <div className="nsy-tags">
                  {paper.tags.map((tag) => (
                    <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="nsy-tag">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Articles */}
          {relatedPapers.length > 0 && (
            <section className="nsy-related">
              <div className="nsy-container">
                <h2 className="nsy-section-title">Related Articles</h2>
                <div className="nsy-posts-grid">
                  {relatedPapers.slice(0, 3).map((related) => (
                    <article key={related.id} className="nsy-card">
                      <Link href={`/whitepapers/${related.slug}`}>
                        {related.coverImageUrl ? (
                          <img src={related.coverImageUrl} alt={related.title} className="nsy-card-img" />
                        ) : (
                          <div className={`nsy-card-placeholder art-${related.accent || "default"}`} />
                        )}
                        <div className="nsy-card-body">
                          <span className="nsy-card-emoji">{getCategoryEmoji(related.category)}</span>
                          <h3 className="nsy-card-title">{related.title}</h3>
                          <time className="nsy-card-date">
                            {new Date(related.publicationDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
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
      <footer className="nsy-footer">
        <div className="nsy-container">
          <div className="nsy-footer-grid">
            <div className="nsy-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="nsy-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{getCategoryEmoji(cat)} {cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nsy-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="nsy-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
