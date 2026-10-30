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

export function ClassicMagazineHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.parentCategory })),
    site.industry || "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 6);

  const featured = featuredPapers.slice(0, 3);
  const sidebarFeatured = papers.slice(0, 4);

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
              <Link href="/" className={`cm-nav-link${isHomePage ? " active" : ""}`}>Home</Link>
              {navParents.map((parent) => (
                <details key={parent} className="cm-nav-category">
                  <summary className="cm-nav-link">{parent.toUpperCase()}</summary>
                  <div className="cm-nav-submenu">
                    {categoryHierarchy[parent].map((child) => (
                      <Link
                        key={child}
                        href={catHref(child)}
                        className={`cm-nav-link${topic === child ? " active" : ""}`}
                      >
                        {child.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <div className="cm-body">
        <div className="cm-container cm-main-wrap">
          <main className="cm-main">
            {/* Featured Cards (3 columns) */}
            {isHomePage && featured.length > 0 && (
              <section className="cm-featured">
                <div className="cm-featured-grid">
                  {featured.map((paper) => (
                    <article key={paper.id} className="cm-featured-card">
                      <Link href={`/whitepapers/${paper.slug}`}>
                        <div className="cm-featured-img">
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} />
                          ) : (
                            <div className={`cm-placeholder art-${paper.accent || "default"}`} />
                          )}
                          <div className="cm-featured-overlay">
                            <h2 className="cm-featured-title">{paper.title}</h2>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Top Stories Section */}
            {isHomePage && (
              <section className="cm-top-stories">
                <h2 className="cm-section-title">📰 Top Stories</h2>
                <div className="cm-stories-grid">
                  {papers.slice(3, 7).map((paper) => (
                    <article key={paper.id} className="cm-story-card">
                      <Link href={`/whitepapers/${paper.slug}`}>
                        <div className="cm-story-img">
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} />
                          ) : (
                            <div className={`cm-placeholder art-${paper.accent || "default"}`} />
                          )}
                        </div>
                        <h3 className="cm-story-title">{paper.title}</h3>
                        <p className="cm-story-excerpt">{paper.summary}</p>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Posts Grid */}
            {pagination.items.length > 0 && (
              <section className="cm-posts">
                <div className="cm-posts-grid">
                  {pagination.items.map((paper) => (
                    <article key={paper.id} className="cm-post-card">
                      <Link href={`/whitepapers/${paper.slug}`}>
                        <div className="cm-post-img">
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} />
                          ) : (
                            <div className={`cm-placeholder art-${paper.accent || "default"}`} />
                          )}
                        </div>
                        <div className="cm-post-body">
                          <span className="cm-post-category">{paper.category}</span>
                          <h3 className="cm-post-title">{paper.title}</h3>
                          <p className="cm-post-excerpt">{paper.summary}</p>
                          <div className="cm-post-meta">
                            <time className="cm-post-date">
                              {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                            <span className="cm-post-author">{paper.authorName}</span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="cm-pagination">
                    {pagination.currentPage > 1 && (
                      <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="cm-pag-btn">
                        ← Prev
                      </Link>
                    )}
                    {pagination.pageNumbers.map((p) => (
                      <Link
                        key={p}
                        href={pageHref(query, topic, p)}
                        className={`cm-pag-num${p === pagination.currentPage ? " active" : ""}`}
                      >
                        {p}
                      </Link>
                    ))}
                    {pagination.currentPage < pagination.totalPages && (
                      <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="cm-pag-btn">
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="cm-sidebar">
            <div className="cm-widget cm-featured-widget">
              <h3 className="cm-widget-title">Featured</h3>
              <div className="cm-featured-list">
                {sidebarFeatured.map((p) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="cm-featured-item">
                    {p.coverImageUrl && (
                      <img src={p.coverImageUrl} alt={p.title} className="cm-featured-item-img" />
                    )}
                    <div className="cm-featured-item-body">
                      <h4 className="cm-featured-item-title">{p.title}</h4>
                      <span className="cm-featured-item-cat">{p.category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="cm-widget cm-ad-widget">
              <div className="cm-ad-placeholder">ad<br/><span className="cm-ad-size-small">300 × 600</span></div>
            </div>

            <div className="cm-widget cm-download-widget">
              <h3 className="cm-widget-title">Download</h3>
              <button className="cm-download-btn">Download the App</button>
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
