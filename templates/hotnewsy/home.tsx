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

export function HotNewsyHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";
  const navCategories = categories;

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.category })),
    "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 5);

  const featured = featuredPapers.slice(0, 4);
  const mainFeatured = featured[0];
  const gridFeatured = featured.slice(1, 4);

  return (
    <div className="hn">
      {/* Header */}
      <header className="hn-header">
        <div className="hn-header-top">
          <div className="hn-container">
            <div className="hn-header-inner">
              <Link href="/" className="hn-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="hn-logo-img" />
                ) : (
                  <span className="hn-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="hn-header-actions">
                <button className="hn-search-toggle" aria-label="Search">🔍</button>
                <button className="hn-menu-toggle" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hn-nav" aria-label="Main navigation">
          <div className="hn-container">
            <div className="hn-nav-inner">
              <Link href="/" className={`hn-nav-link${isHomePage ? " active" : ""}`}>Home</Link>
              {navParents.map((parent) => (
                <details key={parent} className="hn-nav-category">
                  <summary className="hn-nav-link">{parent}</summary>
                  <div className="hn-nav-submenu">
                    {categoryHierarchy[parent].map((child) => (
                      <Link
                        key={child}
                        href={catHref(child)}
                        className={`hn-nav-link${topic === child ? " active" : ""}`}
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

      <div className="hn-body">
        <div className="hn-container hn-main-wrap">
          <main className="hn-main">
            {/* Featured Grid (4 cards) */}
            {isHomePage && featured.length > 0 && (
              <section className="hn-featured-grid">
                {featured.map((paper) => (
                  <article key={paper.id} className="hn-featured-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      <div className="hn-featured-img">
                        {paper.coverImageUrl ? (
                          <img src={paper.coverImageUrl} alt={paper.title} />
                        ) : (
                          <div className={`hn-placeholder art-${paper.accent || "default"}`} />
                        )}
                      </div>
                      <div className="hn-featured-body">
                        <h3 className="hn-featured-title">{paper.title}</h3>
                        <time className="hn-featured-date">
                          {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </Link>
                  </article>
                ))}
              </section>
            )}

            {/* Main Featured Article */}
            {isHomePage && mainFeatured && (
              <section className="hn-main-featured">
                <article className="hn-featured-article">
                  <Link href={`/whitepapers/${mainFeatured.slug}`}>
                    <div className="hn-featured-hero">
                      {mainFeatured.coverImageUrl ? (
                        <img src={mainFeatured.coverImageUrl} alt={mainFeatured.title} />
                      ) : (
                        <div className={`hn-placeholder-large art-${mainFeatured.accent || "default"}`} />
                      )}
                      <div className="hn-featured-overlay">
                        <span className="hn-category-tag">{mainFeatured.category}</span>
                        <h2 className="hn-featured-main-title">{mainFeatured.title}</h2>
                        <p className="hn-featured-excerpt">{mainFeatured.summary}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="hn-featured-actions">
                    <button className="hn-action-btn">❤️ {Math.floor(Math.random() * 1000)}</button>
                    <button className="hn-action-btn">💬 {Math.floor(Math.random() * 100)}</button>
                    <button className="hn-action-btn">↗️ Share</button>
                  </div>
                </article>
              </section>
            )}

            {/* Posts Grid */}
            {pagination.items.length > 0 && (
              <section className="hn-posts">
                <div className="hn-posts-grid">
                  {pagination.items.map((paper) => (
                    <article key={paper.id} className="hn-post-card">
                      <Link href={`/whitepapers/${paper.slug}`}>
                        <div className="hn-post-img">
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} />
                          ) : (
                            <div className={`hn-placeholder art-${paper.accent || "default"}`} />
                          )}
                        </div>
                        <div className="hn-post-body">
                          <div className="hn-post-meta">
                            <span className="hn-post-tag">{paper.category}</span>
                            <time className="hn-post-date">
                              {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                          <h3 className="hn-post-title">{paper.title}</h3>
                          <p className="hn-post-excerpt">{paper.summary}</p>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="hn-pagination">
                    {pagination.currentPage > 1 && (
                      <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="hn-pag-btn">
                        ← Prev
                      </Link>
                    )}
                    {pagination.pageNumbers.map((p) => (
                      <Link
                        key={p}
                        href={pageHref(query, topic, p)}
                        className={`hn-pag-num${p === pagination.currentPage ? " active" : ""}`}
                      >
                        {p}
                      </Link>
                    ))}
                    {pagination.currentPage < pagination.totalPages && (
                      <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="hn-pag-btn">
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hn-sidebar">
            <div className="hn-widget hn-ad-widget">
              <div className="hn-ad-placeholder">Ad 728x90</div>
            </div>

            {papers.length > 0 && (
              <div className="hn-widget">
                <h3 className="hn-widget-title">Around the World</h3>
                <div className="hn-world-posts">
                  {papers.slice(0, 3).map((p) => (
                    <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="hn-world-item">
                      {p.coverImageUrl && (
                        <img src={p.coverImageUrl} alt={p.title} className="hn-world-img" />
                      )}
                      <div className="hn-world-body">
                        <span className="hn-world-cat">{p.category}</span>
                        <h4 className="hn-world-title">{p.title}</h4>
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
      <footer className="hn-footer">
        <div className="hn-container">
          <div className="hn-footer-grid">
            <div className="hn-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="hn-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hn-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="hn-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
