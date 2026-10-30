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

export function GamerWorldHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";
  const navCategories = categories;

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.category })),
    "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 6);

  const featured = featuredPapers.slice(0, 4);
  const mainStories = papers.slice(0, 5);
  const trendingStories = papers.slice(5, 9);

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
              <Link href="/" className={`gw-nav-link${isHomePage ? " active" : ""}`}>Home</Link>
              {navParents.map((parent) => (
                <details key={parent} className="gw-nav-category">
                  <summary className="gw-nav-link">{parent}</summary>
                  <div className="gw-nav-submenu">
                    {categoryHierarchy[parent].map((child) => (
                      <Link
                        key={child}
                        href={catHref(child)}
                        className={`gw-nav-link${topic === child ? " active" : ""}`}
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

      <div className="gw-body">
        <div className="gw-container gw-main-wrap">
          <main className="gw-main">
            {/* Featured Cards Grid (4 columns) */}
            {isHomePage && featured.length > 0 && (
              <section className="gw-featured">
                <div className="gw-featured-grid">
                  {featured.map((paper) => (
                    <article key={paper.id} className="gw-featured-card">
                      <Link href={`/whitepapers/${paper.slug}`}>
                        <div className="gw-featured-img">
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} />
                          ) : (
                            <div className={`gw-placeholder art-${paper.accent || "default"}`} />
                          )}
                          <div className="gw-featured-overlay">
                            <h3 className="gw-featured-title">{paper.title}</h3>
                            <span className="gw-featured-cat">{paper.category}</span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Main Content Area */}
            <div className="gw-content-wrap">
              {/* Featured Stories */}
              {isHomePage && mainStories.length > 0 && (
                <section className="gw-featured-stories">
                  <h2 className="gw-section-header">Featured Stories</h2>
                  <div className="gw-stories-grid">
                    {mainStories.map((paper) => (
                      <article key={paper.id} className="gw-story-card">
                        <Link href={`/whitepapers/${paper.slug}`}>
                          <div className="gw-story-img">
                            {paper.coverImageUrl ? (
                              <img src={paper.coverImageUrl} alt={paper.title} />
                            ) : (
                              <div className={`gw-placeholder art-${paper.accent || "default"}`} />
                            )}
                          </div>
                          <div className="gw-story-body">
                            <span className="gw-story-category">{paper.category}</span>
                            <h3 className="gw-story-title">{paper.title}</h3>
                            <p className="gw-story-excerpt">{paper.summary}</p>
                            <div className="gw-story-meta">
                              <time className="gw-story-date">
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
                </section>
              )}

              {/* All Posts */}
              {pagination.items.length > 0 && (
                <section className="gw-posts">
                  <div className="gw-posts-grid">
                    {pagination.items.map((paper) => (
                      <article key={paper.id} className="gw-post-card">
                        <Link href={`/whitepapers/${paper.slug}`}>
                          <div className="gw-post-img">
                            {paper.coverImageUrl ? (
                              <img src={paper.coverImageUrl} alt={paper.title} />
                            ) : (
                              <div className={`gw-placeholder art-${paper.accent || "default"}`} />
                            )}
                          </div>
                          <div className="gw-post-body">
                            <span className="gw-post-category">{paper.category}</span>
                            <h3 className="gw-post-title">{paper.title}</h3>
                            <p className="gw-post-excerpt">{paper.summary}</p>
                            <div className="gw-post-meta">
                              <time className="gw-post-date">
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
                    <div className="gw-pagination">
                      {pagination.currentPage > 1 && (
                        <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="gw-pag-btn">
                          ← Prev
                        </Link>
                      )}
                      {pagination.pageNumbers.map((p) => (
                        <Link
                          key={p}
                          href={pageHref(query, topic, p)}
                          className={`gw-pag-num${p === pagination.currentPage ? " active" : ""}`}
                        >
                          {p}
                        </Link>
                      ))}
                      {pagination.currentPage < pagination.totalPages && (
                        <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="gw-pag-btn">
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
          <aside className="gw-sidebar">
            {/* Trending Stories */}
            {isHomePage && trendingStories.length > 0 && (
              <div className="gw-widget gw-trending-widget">
                <h3 className="gw-widget-title">Trending Stories</h3>
                <div className="gw-trending-list">
                  {trendingStories.map((p) => (
                    <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="gw-trending-item">
                      <div className="gw-trending-img">
                        {p.coverImageUrl && (
                          <img src={p.coverImageUrl} alt={p.title} />
                        )}
                      </div>
                      <div className="gw-trending-body">
                        <span className="gw-trending-cat">{p.category}</span>
                        <h4 className="gw-trending-title">{p.title}</h4>
                        <time className="gw-trending-date">
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

            {/* Related Content */}
            {papers.slice(0, 3).length > 0 && (
              <div className="gw-widget gw-related-widget">
                <h3 className="gw-widget-title">Related Content</h3>
                <div className="gw-related-list">
                  {papers.slice(0, 3).map((p) => (
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
