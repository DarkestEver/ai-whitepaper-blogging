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

export function NewsmagHome({ site, papers, featuredPapers, categories, query, topic, pagination }: HomePageData) {
  const isHomePage = topic === "All topics";
  const navCategories = categories;

  // Build hierarchical menu
  const categoryHierarchy = buildHierarchicalMenu(
    papers.map((p) => ({ category: p.category, parentCategory: p.category })),
    "technology"
  );
  const navParents = Object.keys(categoryHierarchy).slice(0, 7);

  const featured = featuredPapers.slice(0, 5);
  const mainFeatured = featured[0];
  const sideFeatured = featured.slice(1, 3);
  const bottomFeatured = featured.slice(3, 5);

  const categorySections: { category: string; items: typeof papers }[] = [];
  const seen = new Set<number>();
  if (isHomePage) {
    for (const cat of navCategories.slice(0, 4)) {
      const items = papers.filter((p) => p.category === cat && !seen.has(p.id)).slice(0, 5);
      items.forEach((p) => seen.add(p.id));
      if (items.length > 0) categorySections.push({ category: cat, items });
    }
  }

  const sidebarPosts = papers.filter((p) => !seen.has(p.id)).slice(0, 5);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const year = now.getFullYear();

  return (
    <div className="nm">
      {/* Top Bar */}
      <div className="nm-topbar">
        <div className="nm-container nm-topbar-inner">
          <span className="nm-topbar-date">{dateStr}</span>
          <div className="nm-topbar-links">
            <Link href="/contact">Contact</Link>
            {site.indexingEnabled && <Link href="/rss.xml">RSS Feed</Link>}
          </div>
        </div>
      </div>

      {/* Logo Bar */}
      <div className="nm-logobar">
        <div className="nm-container nm-logobar-inner">
          <Link href="/" className="nm-logo">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.name} className="nm-logo-img" />
            ) : (
              <div>
                <span className="nm-logo-text">{site.name}</span>
                {site.tagline && <span className="nm-logo-tagline">{site.tagline}</span>}
              </div>
            )}
          </Link>
          <div className="nm-header-ad">
            <div className="nm-ad-placeholder nm-ad-728">728 x 90 Ad</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="nm-nav" aria-label="Main navigation">
        <div className="nm-container nm-nav-inner">
          <Link href="/" className={`nm-nav-link nm-nav-home${topic === "All topics" ? " active" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </Link>
          {navParents.map((parent) => (
            <details key={parent} className="nm-nav-category">
              <summary className="nm-nav-link">{parent}</summary>
              <div className="nm-nav-submenu">
                {categoryHierarchy[parent].map((child) => (
                  <Link
                    key={child}
                    href={catHref(child)}
                    className={`nm-nav-link${topic === child ? " active" : ""}`}
                  >
                    {child}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <form className="nm-nav-search" action="/" method="get" role="search">
            <input name="q" type="search" placeholder="Search..." defaultValue={query} className="nm-nav-search-input" />
            <button type="submit" className="nm-nav-search-btn" aria-label="Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          </form>
        </div>
      </nav>

      {/* Trending Now */}
      {isHomePage && papers.length > 0 && (
        <div className="nm-ticker">
          <div className="nm-container nm-ticker-inner">
            <span className="nm-ticker-label">Trending Now</span>
            <div className="nm-ticker-items">
              {papers.slice(0, 5).map((p) => (
                <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-ticker-item">{p.title}</Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="nm-container nm-main-wrap">
        <main className="nm-content">
          {/* Category Breadcrumb */}
          {!isHomePage && (
            <nav className="nm-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "1.5rem" }}>
              <Link href="/">Home</Link>
              <span>/</span>
              <span>{topic}</span>
            </nav>
          )}

          {/* Featured Grid */}
          {isHomePage && mainFeatured && (
            <section className="nm-featured-grid">
              <div className="nm-featured-main">
                <Link href={`/whitepapers/${mainFeatured.slug}`} className="nm-featured-card nm-featured-large">
                  <div className="nm-featured-img">
                    {mainFeatured.coverImageUrl ? (
                      <img src={mainFeatured.coverImageUrl} alt={mainFeatured.title} />
                    ) : (
                      <div className={`nm-placeholder-img art-${mainFeatured.accent}`}>{mainFeatured.category}</div>
                    )}
                  </div>
                  <div className="nm-featured-overlay">
                    <span className="nm-cat-badge">{mainFeatured.category}</span>
                    <h2 className="nm-featured-title">{mainFeatured.title}</h2>
                    <span className="nm-featured-meta">{mainFeatured.authorName} · {mainFeatured.publicationDate || mainFeatured.publishedLabel}</span>
                  </div>
                </Link>
              </div>
              <div className="nm-featured-side">
                {sideFeatured.map((p) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-featured-card nm-featured-small">
                    <div className="nm-featured-img">
                      {p.coverImageUrl ? (
                        <img src={p.coverImageUrl} alt={p.title} />
                      ) : (
                        <div className={`nm-placeholder-img art-${p.accent}`}>{p.category}</div>
                      )}
                    </div>
                    <div className="nm-featured-overlay">
                      <span className="nm-cat-badge">{p.category}</span>
                      <h3 className="nm-featured-title-sm">{p.title}</h3>
                      <span className="nm-featured-meta">{p.authorName} · {p.publicationDate || p.publishedLabel}</span>
                    </div>
                  </Link>
                ))}
                {bottomFeatured.length > 0 && (
                  <div className="nm-featured-bottom-row">
                    {bottomFeatured.map((p) => (
                      <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-featured-card nm-featured-bottom">
                        <div className="nm-featured-img">
                          {p.coverImageUrl ? (
                            <img src={p.coverImageUrl} alt={p.title} />
                          ) : (
                            <div className={`nm-placeholder-img art-${p.accent}`}>{p.category}</div>
                          )}
                        </div>
                        <div className="nm-featured-overlay">
                          <span className="nm-cat-badge">{p.category}</span>
                          <h3 className="nm-featured-title-sm">{p.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Category Sections (homepage only) */}
          {isHomePage && categorySections.map(({ category, items }) => {
            const main = items[0];
            const side = items.slice(1);
            return (
              <section key={category} className="nm-category-section">
                <div className="nm-section-header">
                  <h2 className="nm-section-title">{category}</h2>
                  <Link href={catHref(category)} className="nm-section-all">All</Link>
                </div>
                <div className="nm-section-grid">
                  <div className="nm-section-main">
                    <Link href={`/whitepapers/${main.slug}`} className="nm-post-card nm-post-large">
                      <div className="nm-post-img">
                        {main.coverImageUrl ? (
                          <img src={main.coverImageUrl} alt={main.title} />
                        ) : (
                          <div className={`nm-placeholder-img art-${main.accent}`}>{main.category}</div>
                        )}
                      </div>
                      <h3 className="nm-post-title">{main.title}</h3>
                      <p className="nm-post-meta">{main.authorName} · {main.publicationDate || main.publishedLabel}</p>
                      <p className="nm-post-excerpt">{main.summary.length > 140 ? main.summary.slice(0, 140) + "..." : main.summary}</p>
                    </Link>
                  </div>
                  <div className="nm-section-side">
                    {side.map((p) => (
                      <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-post-card nm-post-small">
                        <div className="nm-post-img-sm">
                          {p.coverImageUrl ? (
                            <img src={p.coverImageUrl} alt={p.title} />
                          ) : (
                            <div className={`nm-placeholder-img-sm art-${p.accent}`}>{p.category}</div>
                          )}
                        </div>
                        <div className="nm-post-info">
                          <h4 className="nm-post-title-sm">{p.title}</h4>
                          <p className="nm-post-meta">{p.publicationDate || p.publishedLabel}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {/* All Posts Grid */}
          {pagination.items.length > 0 && (
            <section className="nm-all-posts">
              <div className="nm-section-header">
                <h2 className="nm-section-title">{topic === "All topics" ? "Latest Posts" : topic}</h2>
              </div>
              <div className="nm-posts-grid">
                {pagination.items.map((p) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-grid-card">
                    <div className="nm-grid-img">
                      {p.coverImageUrl ? (
                        <img src={p.coverImageUrl} alt={p.title} />
                      ) : (
                        <div className={`nm-placeholder-img art-${p.accent}`}>{p.category}</div>
                      )}
                    </div>
                    <div className="nm-grid-info">
                      <span className="nm-cat-badge small">{p.category}</span>
                      <h3 className="nm-grid-title">{p.title}</h3>
                      <p className="nm-post-meta">{p.authorName} · {p.publicationDate || p.publishedLabel}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <nav className="nm-pagination">
                  {pagination.currentPage > 1 && (
                    <Link href={pageHref(query, topic, pagination.currentPage - 1)} className="nm-page-link">&larr; Prev</Link>
                  )}
                  {pagination.pageNumbers.map((n) => (
                    <Link key={n} href={pageHref(query, topic, n)} className={`nm-page-link${n === pagination.currentPage ? " active" : ""}`}>{n}</Link>
                  ))}
                  {pagination.currentPage < pagination.totalPages && (
                    <Link href={pageHref(query, topic, pagination.currentPage + 1)} className="nm-page-link">Next &rarr;</Link>
                  )}
                </nav>
              )}
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="nm-sidebar">
          <div className="nm-widget nm-ad-widget">
            <div className="nm-ad-placeholder nm-ad-300">300 x 250 Ad</div>
          </div>

          {sidebarPosts.length > 0 && (
            <div className="nm-widget">
              <h3 className="nm-widget-title">Popular Posts</h3>
              <div className="nm-popular-list">
                {sidebarPosts.map((p, i) => (
                  <Link key={p.slug} href={`/whitepapers/${p.slug}`} className="nm-popular-item">
                    <span className="nm-popular-num">{i + 1}</span>
                    <div className="nm-popular-img">
                      {p.coverImageUrl ? (
                        <img src={p.coverImageUrl} alt={p.title} />
                      ) : (
                        <div className={`nm-placeholder-img-sm art-${p.accent}`}>{p.category?.charAt(0)}</div>
                      )}
                    </div>
                    <div className="nm-popular-info">
                      <h4>{p.title}</h4>
                      <span className="nm-post-meta">{p.publicationDate || p.publishedLabel}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="nm-widget">
            <h3 className="nm-widget-title">Categories</h3>
            <ul className="nm-cat-list">
              {navCategories.map((cat) => {
                const count = papers.filter((p) => p.category === cat).length;
                return (
                  <li key={cat}>
                    <Link href={catHref(cat)}>
                      {cat} <span>({count})</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

        </aside>
      </div>

      {/* Footer */}
      <footer className="nm-footer">
        <div className="nm-container">
          <div className="nm-footer-top">
            <div className="nm-footer-col">
              <h4 className="nm-footer-title">{site.name}</h4>
              <p>{site.description}</p>
              {site.contactEmail && <p>Email: {site.contactEmail}</p>}
            </div>
            <div className="nm-footer-col">
              <h4 className="nm-footer-title">Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}><Link href={catHref(cat)}>{cat}</Link></li>
                ))}
              </ul>
            </div>
            <div className="nm-footer-col">
              <h4 className="nm-footer-title">Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Use</Link></li>
                <li><Link href="/cookies">Cookie Policy</Link></li>
                <li><Link href="/disclaimer">Disclaimer</Link></li>
                <li><Link href="/editorial-policy">Editorial Policy</Link></li>
                <li><Link href="/accessibility">Accessibility</Link></li>
              </ul>
            </div>
            <div className="nm-footer-col">
              <h4 className="nm-footer-title">Resources</h4>
              <ul>
                <li><Link href="/contact">Contact Us</Link></li>
                {site.indexingEnabled && (
                  <>
                    <li><Link href="/sitemap.xml">Sitemap</Link></li>
                    <li><Link href="/rss.xml">RSS Feed</Link></li>
                    <li><Link href="/llms.txt">llms.txt</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="nm-footer-bottom">
            <p>&copy; {year} {site.legalName || site.name}. All rights reserved.</p>
            <div className="nm-footer-bottom-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
              {site.indexingEnabled && <Link href="/rss.xml">RSS</Link>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
