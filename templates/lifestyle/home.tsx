"use client";

import Link from "next/link";
import type { HomePageData } from "../registry";
import { buildHierarchicalMenu } from "@/lib/category-hierarchy";
import { slugify } from "@/lib/slugify";

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

export function LifestyleHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.parentCategory })),
    site.industry || "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 5);

  const featured = featuredPapers.slice(0, 1);
  const featuredSmall = featuredPapers.slice(1, 3);
  const mainArticles = papers.slice(0, 8);

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
              <Link href="/" className={`ls-nav-link${isHomePage ? " active" : ""}`}>Home</Link>
              {navParents.map((parent) => (
                <details key={parent} className="ls-nav-category">
                  <summary className="ls-nav-link">{parent}</summary>
                  <div className="ls-nav-submenu">
                    {categoryHierarchy[parent].map((child) => (
                      <Link
                        key={child}
                        href={catHref(child)}
                        className={`ls-nav-link${topic === child ? " active" : ""}`}
                      >
                        {child}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <div className="ls-body">
        <div className="ls-container ls-main-wrap">
          <main className="ls-main">
            {/* Featured Hero */}
            {isHomePage && featured.length > 0 && (
              <section className="ls-hero">
                {featured.map((paper) => (
                  <article key={paper.id} className="ls-hero-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      <div className="ls-hero-img">
                        {paper.coverImageUrl ? (
                          <img src={paper.coverImageUrl} alt={paper.title} />
                        ) : (
                          <div className={`ls-placeholder art-${paper.accent || "default"}`} />
                        )}
                      </div>
                      <div className="ls-hero-content">
                        <span className="ls-hero-cat">{paper.category}</span>
                        <h2 className="ls-hero-title">{paper.title}</h2>
                        <p className="ls-hero-excerpt">{paper.summary}</p>
                      </div>
                    </Link>
                  </article>
                ))}
              </section>
            )}

            {/* Featured Small Cards */}
            {isHomePage && featuredSmall.length > 0 && (
              <div className="ls-featured-small">
                {featuredSmall.map((paper) => (
                  <article key={paper.id} className="ls-featured-small-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      <div className="ls-featured-small-img">
                        {paper.coverImageUrl ? (
                          <img src={paper.coverImageUrl} alt={paper.title} />
                        ) : (
                          <div className={`ls-placeholder art-${paper.accent || "default"}`} />
                        )}
                      </div>
                      <div className="ls-featured-small-body">
                        <span className="ls-featured-small-cat">{paper.category}</span>
                        <h3 className="ls-featured-small-title">{paper.title}</h3>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {/* Main Content Grid */}
            <section className="ls-content">
              <h2 className="ls-section-title">Latest Articles</h2>
              <div className="ls-grid">
                {pagination.items.slice(0, 8).map((paper, idx) => (
                  <article key={paper.id} className={`ls-card ${idx === 0 ? "ls-card-large" : ""}`}>
                    <Link href={`/whitepapers/${paper.slug}`}>
                      <div className="ls-card-img">
                        {paper.coverImageUrl ? (
                          <img src={paper.coverImageUrl} alt={paper.title} />
                        ) : (
                          <div className={`ls-placeholder art-${paper.accent || "default"}`} />
                        )}
                        <span className="ls-card-cat">{paper.category}</span>
                      </div>
                      <div className="ls-card-body">
                        <h3 className="ls-card-title">{paper.title}</h3>
                        <p className="ls-card-excerpt">{paper.summary}</p>
                        <div className="ls-card-meta">
                          <time className="ls-card-date">
                            {new Date(paper.publicationDate).toLocaleDateString("en-US", {
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="ls-pagination">
                  {pagination.currentPage > 1 && (
                    <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="ls-pag-btn">
                      ← Previous
                    </Link>
                  )}
                  <div className="ls-pag-numbers">
                    {pagination.pageNumbers.map((p) => (
                      <Link
                        key={p}
                        href={pageHref(query, topic, p)}
                        className={`ls-pag-num${p === pagination.currentPage ? " active" : ""}`}
                      >
                        {p}
                      </Link>
                    ))}
                  </div>
                  {pagination.currentPage < pagination.totalPages && (
                    <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="ls-pag-btn">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <aside className="ls-sidebar">
            {/* About Widget */}
            <div className="ls-widget ls-about-widget">
              <h3 className="ls-widget-title">About Us</h3>
              <p className="ls-widget-text">{site.description || site.name}</p>
            </div>

            {/* Categories Widget */}
            <div className="ls-widget ls-categories-widget">
              <h3 className="ls-widget-title">Categories</h3>
              <ul className="ls-cat-list">
                {navCategories.slice(0, 8).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Posts Widget */}
            {papers.slice(0, 4).length > 0 && (
              <div className="ls-widget ls-popular-widget">
                <h3 className="ls-widget-title">Popular Posts</h3>
                <div className="ls-popular-list">
                  {papers.slice(0, 4).map((p) => (
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
