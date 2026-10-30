"use client";

import Link from "next/link";
import type { HomePageData } from "../registry";
import { slugify } from "@/lib/slugify";
import { buildHierarchicalMenu } from "@/lib/category-hierarchy";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

function pageHref(query: string, topic: string, page: number): string {
  const base = topic !== "All topics" ? catHref(topic) : "/";
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${base}?${search}` : base;
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

export function NewsynHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.parentCategory })),
    site.industry || "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 6);

  const featured = featuredPapers.slice(0, 3);
  const sectionCategories = navCategories.slice(0, 3);

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
            <input type="search" placeholder="Search" className="nsy-search-input" defaultValue={query} />
            <button className="nsy-search-btn" aria-label="Search">🔍</button>
          </div>
          <button className="nsy-menu-btn" aria-label="Menu">☰</button>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="nsy-cat-nav" aria-label="Category navigation">
        <div className="nsy-container nsy-cat-nav-inner">
          <Link href="/" className={`nsy-cat-tab${isHomePage ? " active" : ""}`}>All</Link>
          {navParents.map((parent) => (
            <details key={parent} className="nsy-cat-category">
              <summary className="nsy-cat-tab">{parent}</summary>
              <div className="nsy-cat-submenu">
                {categoryHierarchy[parent].map((child) => (
                  <Link
                    key={child}
                    href={catHref(child)}
                    className={`nsy-cat-tab${topic === child ? " active" : ""}`}
                  >
                    {getCategoryEmoji(child)} {child}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </nav>

      <div className="nsy-body">
        {/* Featured Grid (Homepage Only) */}
        {isHomePage && featured.length > 0 && (
          <section className="nsy-featured">
            <div className="nsy-container">
              <div className="nsy-featured-grid">
                {featured.map((paper) => (
                  <article key={paper.id} className="nsy-featured-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      {paper.coverImageUrl ? (
                        <img src={paper.coverImageUrl} alt={paper.title} className="nsy-featured-img" />
                      ) : (
                        <div className={`nsy-featured-placeholder art-${paper.accent || "default"}`} />
                      )}
                      <div className="nsy-featured-overlay">
                        <span className="nsy-featured-emoji">{getCategoryEmoji(paper.category)}</span>
                        <h2 className="nsy-featured-title">{paper.title}</h2>
                        <span className="nsy-featured-cat">{paper.category}</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Category Sections */}
        {isHomePage ? (
          sectionCategories.map((category) => {
            const items = papers.filter((p) => p.category === category).slice(0, 6);
            if (items.length === 0) return null;
            return (
              <section key={category} className="nsy-category-section">
                <div className="nsy-container">
                  <h2 className="nsy-section-title">
                    {getCategoryEmoji(category)} Latest {category}
                  </h2>
                  <div className="nsy-posts-grid">
                    {items.map((paper) => (
                      <article key={paper.id} className="nsy-card">
                        <Link href={`/whitepapers/${paper.slug}`}>
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} className="nsy-card-img" />
                          ) : (
                            <div className={`nsy-card-placeholder art-${paper.accent || "default"}`} />
                          )}
                          <div className="nsy-card-body">
                            <span className="nsy-card-emoji">{getCategoryEmoji(paper.category)}</span>
                            <h3 className="nsy-card-title">{paper.title}</h3>
                            <p className="nsy-card-excerpt">{paper.summary || paper.abstract || ""}</p>
                            <time className="nsy-card-date">
                              {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                  <Link href={catHref(category)} className="nsy-section-link">
                    View all {category} →
                  </Link>
                </div>
              </section>
            );
          })
        ) : (
          // Category/Search Results Page
          <section className="nsy-category-page">
            <div className="nsy-container">
              <h1 className="nsy-page-title">
                {getCategoryEmoji(topic)} {topic}
              </h1>
              <div className="nsy-posts-grid">
                {pagination.items.map((paper) => (
                  <article key={paper.id} className="nsy-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      {paper.coverImageUrl ? (
                        <img src={paper.coverImageUrl} alt={paper.title} className="nsy-card-img" />
                      ) : (
                        <div className={`nsy-card-placeholder art-${paper.accent || "default"}`} />
                      )}
                      <div className="nsy-card-body">
                        <span className="nsy-card-emoji">{getCategoryEmoji(paper.category)}</span>
                        <h3 className="nsy-card-title">{paper.title}</h3>
                        <p className="nsy-card-excerpt">{paper.summary || paper.abstract || ""}</p>
                        <time className="nsy-card-date">
                          {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="nsy-pagination">
                  {pagination.currentPage > 1 && (
                    <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="nsy-pag-btn">
                      ← Prev
                    </Link>
                  )}
                  {pagination.pageNumbers.map((p) => (
                    <Link
                      key={p}
                      href={pageHref(query, topic, p)}
                      className={`nsy-pag-num${p === pagination.currentPage ? " active" : ""}`}
                    >
                      {p}
                    </Link>
                  ))}
                  {pagination.currentPage < pagination.totalPages && (
                    <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="nsy-pag-btn">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
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
