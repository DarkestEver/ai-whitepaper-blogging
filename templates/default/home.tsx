import Link from "next/link";
import { FeaturedCarousel } from "@/components/featured-carousel";
import type { HomePageData } from "../registry";
import { slugify } from "@/lib/slugify";
import { buildHierarchicalMenu } from "@/lib/category-hierarchy";

function catalogHref(query: string, topic: string): string {
  const base = topic !== "All topics" ? `/category/${slugify(topic)}` : "/";
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `${base}?${search}#library` : `${base}#library`;
}

function pageHref(query: string, topic: string, page: number): string {
  const base = topic !== "All topics" ? `/category/${slugify(topic)}` : "/";
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${base}?${search}#library` : `${base}#library`;
}

export function DefaultHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const featured = featuredPapers[0];
  const layout = "lead-grid";

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.category })),
    "technology"
  );

  return (
    <div className="site-shell" data-theme={site.themeId} data-layout={layout}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <span className="brand-mark" aria-hidden="true">{site.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{site.name}</strong><small>{site.tagline || site.description}</small></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="#library">Explore research</a>
          <a href="#about">About the library</a>
        </nav>
        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <div><a href="#library">Explore</a><a href="#about">About</a></div>
        </details>
        <span className="demo-chip">{site.tagline || "Research library"}</span>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Independent research library</p>
            <h1 id="hero-title">Ideas worth<br /><em>thinking through.</em></h1>
            <p className="hero-description">{site.description}</p>
            <a className="button button-dark" href="#library">Browse the library <span aria-hidden="true">↓</span></a>
            <p className="hero-note">Original sample entries · No signup required</p>
          </div>
          <div className="hero-art" aria-label={`Featured research issue ${featured?.issue ?? "01"}`}>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-disc" />
            <div className="featured-cover">
              <span className="cover-brand">SIGNAL / FIELD NOTES</span>
              <span className="cover-issue">VOL. {featured?.issue ?? "01"} — 2026</span>
              <span className="cover-line" />
              <span className="cover-title">{featured?.title ?? "Research for better decisions"}</span>
              <span className="cover-bottom">RESEARCH BRIEF</span>
            </div>
          </div>
        </section>

        <FeaturedCarousel items={featuredPapers} />

        <section id="library" className="library-section" aria-labelledby="library-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The reading room</p>
              <h2 id="library-title">Find your next <em>good question.</em></h2>
            </div>
            <p className="library-count">
              {pagination.totalItems.toString().padStart(2, "0")} <span>research notes</span>
            </p>
          </div>

          <form className="search-form" action="/" method="get" role="search">
            <label className="search-label" htmlFor="catalog-search">Search research</label>
            <div className="search-row">
              <div className="search-input-wrap">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input id="catalog-search" name="q" type="search" maxLength={100} placeholder={'Try "cloud", "privacy", or "AI"'} defaultValue={query} />
              </div>
              {topic !== "All topics" && <input type="hidden" name="topic" value={topic} />}
              <button className="button button-search" type="submit">Search <span aria-hidden="true">↗</span></button>
            </div>
          </form>

          <nav className="topic-nav" aria-label="Filter by topic">
            {Object.entries(categoryHierarchy).map(([parentCategory, children]) => (
              <details key={parentCategory} className="topic-category">
                <summary className="topic-link topic-parent">
                  {parentCategory} <span aria-hidden="true">▼</span>
                </summary>
                <div className="topic-children">
                  {children.map((child) => (
                    <Link
                      key={child}
                      className={`topic-link topic-child${child === topic ? " is-active" : ""}`}
                      href={catalogHref(query, child)}
                      aria-current={child === topic ? "page" : undefined}
                    >
                      {child}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </nav>

          {pagination.items.length > 0 ? (
            <>
              <div className="paper-grid" aria-live="polite">
                {pagination.items.map((paper, index) => {
                  const colors = ['navy', 'purple', 'sage', 'gold', 'mint', 'cream'];
                  const colorClass = colors[index % colors.length];
                  return (
                    <article className="paper-card" key={paper.slug}>
                      <Link className={`paper-art art-${colorClass}`} href={`/whitepapers/${paper.slug}`}>
                        {paper.coverImageUrl ? (
                          <img className="paper-art-image" src={paper.coverImageUrl} alt="" />
                        ) : (
                          <>
                            <span className="paper-art-top">{paper.category}</span>
                            <span className="paper-art-shape" aria-hidden="true">{paper.issue}</span>
                            <span className="paper-art-bottom">SIGNAL / RESEARCH</span>
                          </>
                        )}
                        <span className="card-arrow" aria-hidden="true">↗</span>
                      </Link>
                      <div className="paper-card-content">
                        <div className="paper-meta">
                          <span>{paper.publicationDate || paper.publishedLabel}</span>
                          <span>{paper.readingMinutes} min</span>
                        </div>
                        <h3><Link href={`/whitepapers/${paper.slug}`}>{paper.title}</Link></h3>
                        <p>{paper.summary}</p>
                        <div className="paper-card-footer">
                          <span>{paper.publisher}</span>
                          <Link href={`/whitepapers/${paper.slug}`}>Read brief <span aria-hidden="true">→</span></Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {pagination.totalPages > 1 && (
                <nav className="catalog-pagination" aria-label="Research result pages">
                  <p className="catalog-pagination-summary">
                    Showing {pagination.startItem}–{pagination.endItem} of {pagination.totalItems} results
                  </p>
                  <div className="catalog-pagination-controls">
                    {pagination.currentPage > 1 ? (
                      <Link className="catalog-page-link catalog-page-direction" href={pageHref(query, topic, pagination.currentPage - 1)}>← <span>Previous</span></Link>
                    ) : (
                      <span className="catalog-page-link catalog-page-direction is-disabled">← <span>Previous</span></span>
                    )}
                    {pagination.pageNumbers.map((pageNumber) => (
                      <Link key={pageNumber} className={`catalog-page-link${pageNumber === pagination.currentPage ? " is-current" : ""}`} href={pageHref(query, topic, pageNumber)} aria-current={pageNumber === pagination.currentPage ? "page" : undefined}>
                        {pageNumber}
                      </Link>
                    ))}
                    {pagination.currentPage < pagination.totalPages ? (
                      <Link className="catalog-page-link catalog-page-direction" href={pageHref(query, topic, pagination.currentPage + 1)}><span>Next</span> →</Link>
                    ) : (
                      <span className="catalog-page-link catalog-page-direction is-disabled"><span>Next</span> →</span>
                    )}
                  </div>
                </nav>
              )}
            </>
          ) : (
            <div className="empty-state" role="status">
              <span className="empty-mark" aria-hidden="true">?</span>
              <h3>No matching research yet</h3>
              <p>Try another search or choose a different topic.</p>
              <Link className="text-link" href="/#library">Clear filters <span aria-hidden="true">→</span></Link>
            </div>
          )}
        </section>

        <section id="about" className="about-section">
          <div className="about-stamp" aria-hidden="true">S<br />/R</div>
          <div>
            <p className="eyebrow">A note on the library</p>
            <h2>Make room for<br /><em>considered thinking.</em></h2>
          </div>
          <div className="about-copy">
            <p>{site.description}</p>
            <a className="text-link" href="#library">Back to the reading room <span aria-hidden="true">↑</span></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>{site.name}</strong><small>Research for better decisions</small></span>
        </Link>
        <p>Prototype experience · Not a production publishing service</p>
        <a href="#main-content">Back to top ↑</a>
      </footer>
    </div>
  );
}
