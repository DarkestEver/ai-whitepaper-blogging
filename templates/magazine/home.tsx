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

export function MagazineHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.parentCategory })),
    site.industry || "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 5);

  const featured = featuredPapers.slice(0, 3);
  const categorySections: { category: string; items: typeof papers }[] = [];
  const seen = new Set<number>();

  if (isHomePage) {
    for (const cat of navCategories) {
      const items = papers.filter((p) => p.category === cat && !seen.has(p.id)).slice(0, 6);
      items.forEach((p) => seen.add(p.id));
      if (items.length > 0) categorySections.push({ category: cat, items });
    }
  }

  const itemsToShow = isHomePage ? pagination.items.slice(0, 12) : pagination.items;

  return (
    <div className="mag">
      {/* Breaking News Bar */}
      {isHomePage && papers.length > 0 && (
        <div className="mag-breaking">
          <div className="mag-container">
            <span className="mag-breaking-label">BREAKING NEWS</span>
            <span className="mag-breaking-text">{papers[0]?.title || "Latest news breaking now"}</span>
          </div>
        </div>
      )}

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
            {navParents.map((parent) => (
              <details key={parent} className="mag-header-category">
                <summary>{parent}</summary>
                <div className="mag-header-submenu">
                  {categoryHierarchy[parent].map((child) => (
                    <Link key={child} href={catHref(child)}>
                      {child}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <Link href="/pages">Pages</Link>
          </nav>
          <div className="mag-header-icons">
            <button className="mag-icon-btn" aria-label="Social">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9h-4v4h4v-4z"/>
              </svg>
            </button>
            <input type="search" placeholder="Search" className="mag-header-search" defaultValue={query} />
          </div>
        </div>
      </header>

      {/* Featured Grid */}
      {isHomePage && featured.length > 0 && (
        <section className="mag-featured">
          <div className="mag-container">
            <div className="mag-featured-grid">
              {featured.map((paper) => (
                <article key={paper.id} className="mag-featured-card">
                  <Link href={`/whitepapers/${paper.slug}`} className="mag-featured-link">
                    {paper.coverImageUrl ? (
                      <img src={paper.coverImageUrl} alt={paper.title} className="mag-featured-image" />
                    ) : (
                      <div className={`mag-featured-placeholder art-${paper.accent || "default"}`} />
                    )}
                    <div className="mag-featured-overlay">
                      <span className="mag-category-badge">{paper.category}</span>
                      <h2 className="mag-featured-title">{paper.title}</h2>
                      <time className="mag-featured-date">
                        {new Date(paper.publicationDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </time>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mag-body">
        {/* Category Sections */}
        {isHomePage && categorySections.length > 0 && (
          <>
            {categorySections.map(({ category, items }) => (
              <section key={category} className="mag-category-section">
                <div className="mag-container">
                  <h2 className="mag-section-title">{category}</h2>
                  <div className="mag-posts-grid">
                    {items.slice(0, 6).map((paper) => (
                      <article key={paper.id} className="mag-card">
                        <Link href={`/whitepapers/${paper.slug}`}>
                          {paper.coverImageUrl ? (
                            <img src={paper.coverImageUrl} alt={paper.title} className="mag-card-image" />
                          ) : (
                            <div className={`mag-card-placeholder art-${paper.accent || "default"}`} />
                          )}
                          <div className="mag-card-body">
                            <span className="mag-card-category">{paper.category}</span>
                            <h3 className="mag-card-title">{paper.title}</h3>
                            <time className="mag-card-date">
                              {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </time>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                  <Link href={catHref(category)} className="mag-section-link">
                    View all {category}
                  </Link>
                </div>
              </section>
            ))}
          </>
        )}

        {/* Category Page or Search Results */}
        {!isHomePage && (
          <section className="mag-category-page">
            <div className="mag-container">
              <h1 className="mag-page-title">{topic}</h1>
              <div className="mag-posts-grid">
                {pagination.items.map((paper) => (
                  <article key={paper.id} className="mag-card">
                    <Link href={`/whitepapers/${paper.slug}`}>
                      {paper.coverImageUrl ? (
                        <img src={paper.coverImageUrl} alt={paper.title} className="mag-card-image" />
                      ) : (
                        <div className={`mag-card-placeholder art-${paper.accent || "default"}`} />
                      )}
                      <div className="mag-card-body">
                        <span className="mag-card-category">{paper.category}</span>
                        <h3 className="mag-card-title">{paper.title}</h3>
                        <time className="mag-card-date">
                          {new Date(paper.publicationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </time>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mag-pagination">
                  {pagination.currentPage > 1 && (
                    <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="mag-pag-btn">
                      ← Prev
                    </Link>
                  )}
                  {pagination.pageNumbers.map((p) => (
                    <Link
                      key={p}
                      href={pageHref(query, topic, p)}
                      className={`mag-pag-num${p === pagination.currentPage ? " active" : ""}`}
                    >
                      {p}
                    </Link>
                  ))}
                  {pagination.currentPage < pagination.totalPages && (
                    <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="mag-pag-btn">
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
            <div className="mag-footer-social">
              <a href="#" aria-label="Twitter">𝕏</a>
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="LinkedIn">in</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
