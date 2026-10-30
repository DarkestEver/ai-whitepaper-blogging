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

export function HotMagazineHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.parentCategory })),
    site.industry || "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 6);

  const featured = featuredPapers.slice(0, 4);
  const mainFeatured = featured[0];
  const trendingPapers = papers.slice(0, 3);

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
              <Link href="/" className={`hm-nav-link${isHomePage ? " active" : ""}`}>Home</Link>
              {navParents.map((parent) => (
                <details key={parent} className="hm-nav-category">
                  <summary className="hm-nav-link">{parent.toUpperCase()}</summary>
                  <div className="hm-nav-submenu">
                    {categoryHierarchy[parent].map((child) => (
                      <Link
                        key={child}
                        href={catHref(child)}
                        className={`hm-nav-link${topic === child ? " active" : ""}`}
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

      <div className="hm-body">
        <div className="hm-container hm-main-wrap">
          <main className="hm-main">
            {/* Featured Cards Grid (4 cards) */}
            {isHomePage && featured.length > 0 && (
              <section className="hm-featured-grid">
                {featured.map((paper) => (
                  <article key={paper.id} className="hm-featured-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      <div className="hm-featured-img">
                        {paper.coverImageUrl ? (
                          <img src={paper.coverImageUrl} alt={paper.title} />
                        ) : (
                          <div className={`hm-placeholder art-${paper.accent || "default"}`} />
                        )}
                      </div>
                      <div className="hm-featured-body">
                        <h3 className="hm-featured-title">{paper.title}</h3>
                        <div className="hm-featured-meta">
                          <span className="hm-featured-category">{paper.category}</span>
                          <time className="hm-featured-date">
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
              </section>
            )}

            {/* Trending Section */}
            {isHomePage && trendingPapers.length > 0 && (
              <section className="hm-trending">
                <div className="hm-trending-header">
                  <h2 className="hm-trending-title">📈 TRENDING</h2>
                </div>
                <div className="hm-trending-content">
                  {trendingPapers.map((paper, idx) => (
                    <Link key={paper.id} href={`/whitepapers/${paper.slug}`} className="hm-trending-item">
                      <span className="hm-trending-num">{idx + 1}</span>
                      <div className="hm-trending-text">
                        <h4 className="hm-trending-title-sm">{paper.title}</h4>
                        <span className="hm-trending-cat">{paper.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Main Featured Article */}
            {isHomePage && mainFeatured && (
              <section className="hm-main-featured">
                <article className="hm-featured-article">
                  <Link href={`/whitepapers/${mainFeatured.slug}`} className="hm-featured-link">
                    <div className="hm-featured-img-large">
                      {mainFeatured.coverImageUrl ? (
                        <img src={mainFeatured.coverImageUrl} alt={mainFeatured.title} />
                      ) : (
                        <div className={`hm-placeholder-lg art-${mainFeatured.accent || "default"}`} />
                      )}
                    </div>
                    <div className="hm-featured-content">
                      <h2 className="hm-featured-title-lg">{mainFeatured.title}</h2>
                      <p className="hm-featured-excerpt">{mainFeatured.summary}</p>
                      <div className="hm-featured-footer">
                        <span className="hm-featured-author">{mainFeatured.authorName || "Editor"}</span>
                        <time className="hm-featured-date-lg">
                          {new Date(mainFeatured.publicationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </div>
                  </Link>
                </article>
              </section>
            )}

            {/* Posts Grid */}
            {pagination.items.length > 0 && (
              <section className="hm-posts">
                <div className="hm-posts-grid">
                  {pagination.items.map((paper) => (
                    <article key={paper.id} className="hm-post-card">
                      <Link href={`/whitepapers/${paper.slug}`}>
                        <div className="hm-post-img">
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} />
                          ) : (
                            <div className={`hm-placeholder art-${paper.accent || "default"}`} />
                          )}
                          <div className="hm-post-overlay">
                            <button className="hm-like-btn">❤️ {Math.floor(Math.random() * 500)}</button>
                          </div>
                        </div>
                        <div className="hm-post-body">
                          <h3 className="hm-post-title">{paper.title}</h3>
                          <div className="hm-post-meta">
                            <span className="hm-post-category">{paper.category}</span>
                            <time className="hm-post-date">
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
                  <div className="hm-pagination">
                    {pagination.currentPage > 1 && (
                      <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="hm-pag-btn">
                        ← Prev
                      </Link>
                    )}
                    {pagination.pageNumbers.map((p) => (
                      <Link
                        key={p}
                        href={pageHref(query, topic, p)}
                        className={`hm-pag-num${p === pagination.currentPage ? " active" : ""}`}
                      >
                        {p}
                      </Link>
                    ))}
                    {pagination.currentPage < pagination.totalPages && (
                      <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="hm-pag-btn">
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hm-sidebar">
            <div className="hm-widget hm-hottest-widget">
              <h3 className="hm-widget-title">🔥 HOTTEST READS</h3>
              <div className="hm-hottest-list">
                {papers.slice(0, 5).map((p) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="hm-hottest-item">
                    <div className="hm-hottest-img">
                      {p.coverImageUrl && (
                        <img src={p.coverImageUrl} alt={p.title} />
                      )}
                    </div>
                    <div className="hm-hottest-body">
                      <span className="hm-hottest-cat">{p.category}</span>
                      <h4 className="hm-hottest-title">{p.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

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
