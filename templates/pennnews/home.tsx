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

export function PennNewsHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.parentCategory })),
    site.industry || "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 6);

  const featured = featuredPapers.slice(0, 1);
  const mainStories = papers.slice(0, 6);
  const sidebarStories = papers.slice(6, 10);

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
              <Link href="/" className={`pn-nav-link${isHomePage ? " active" : ""}`}>Home</Link>
              {navParents.map((parent) => (
                <details key={parent} className="pn-nav-category">
                  <summary className="pn-nav-link">{parent}</summary>
                  <div className="pn-nav-submenu">
                    {categoryHierarchy[parent].map((child) => (
                      <Link
                        key={child}
                        href={catHref(child)}
                        className={`pn-nav-link${topic === child ? " active" : ""}`}
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

      <div className="pn-body">
        <div className="pn-container pn-main-wrap">
          <main className="pn-main">
            {/* Featured Article */}
            {isHomePage && featured.length > 0 && (
              <section className="pn-featured">
                {featured.map((paper) => (
                  <article key={paper.id} className="pn-featured-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      <div className="pn-featured-img">
                        {paper.coverImageUrl ? (
                          <img src={paper.coverImageUrl} alt={paper.title} />
                        ) : (
                          <div className={`pn-placeholder art-${paper.accent || "default"}`} />
                        )}
                        <div className="pn-featured-overlay">
                          <span className="pn-featured-cat">{paper.category}</span>
                          <h2 className="pn-featured-title">{paper.title}</h2>
                          <p className="pn-featured-excerpt">{paper.summary}</p>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </section>
            )}

            {/* Main Content Area */}
            <div className="pn-content-wrap">
              {/* Main News Grid */}
              {pagination.items.length > 0 && (
                <section className="pn-news-section">
                  <h2 className="pn-section-header">Latest News</h2>
                  <div className="pn-news-grid">
                    {pagination.items.slice(0, 6).map((paper) => (
                      <article key={paper.id} className="pn-news-card">
                        <Link href={`/whitepapers/${paper.slug}`}>
                          <div className="pn-news-img">
                            {paper.coverImageUrl ? (
                              <img src={paper.coverImageUrl} alt={paper.title} />
                            ) : (
                              <div className={`pn-placeholder art-${paper.accent || "default"}`} />
                            )}
                          </div>
                          <div className="pn-news-body">
                            <span className="pn-news-cat">{paper.category}</span>
                            <h3 className="pn-news-title">{paper.title}</h3>
                            <p className="pn-news-excerpt">{paper.summary}</p>
                            <div className="pn-news-meta">
                              <time className="pn-news-date">
                                {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
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
                    <div className="pn-pagination">
                      {pagination.currentPage > 1 && (
                        <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="pn-pag-btn">
                          ← Prev
                        </Link>
                      )}
                      {pagination.pageNumbers.map((p) => (
                        <Link
                          key={p}
                          href={pageHref(query, topic, p)}
                          className={`pn-pag-num${p === pagination.currentPage ? " active" : ""}`}
                        >
                          {p}
                        </Link>
                      ))}
                      {pagination.currentPage < pagination.totalPages && (
                        <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="pn-pag-btn">
                          Next →
                        </Link>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="pn-sidebar">
            {/* Category Filter */}
            <div className="pn-widget pn-category-widget">
              <h3 className="pn-widget-title">Categories</h3>
              <div className="pn-category-buttons">
                {navCategories.slice(0, 8).map((cat, idx) => {
                  const colors = ["#4a90e2", "#ff6b9d", "#ffa500", "#4caf50", "#e63946", "#6c5ce7", "#00b4d8", "#ff9f43"];
                  return (
                    <Link key={cat} href={catHref(cat)} className="pn-cat-btn" style={{ backgroundColor: colors[idx % colors.length] }}>
                      {cat}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Stories */}
            {sidebarStories.length > 0 && (
              <div className="pn-widget pn-stories-widget">
                <h3 className="pn-widget-title">More News</h3>
                <div className="pn-stories-list">
                  {sidebarStories.map((p) => (
                    <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="pn-story-item">
                      {p.coverImageUrl && (
                        <img src={p.coverImageUrl} alt={p.title} className="pn-story-img" />
                      )}
                      <div className="pn-story-body">
                        <h4 className="pn-story-title">{p.title}</h4>
                        <time className="pn-story-date">
                          {new Date(p.publicationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
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
