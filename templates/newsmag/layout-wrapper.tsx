import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";


export function NewsmagWrapper({ site, children, categories }: { site: SiteRecord; children: React.ReactNode; categories?: string[] }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const year = now.getFullYear();
  const navCategories = (categories || []).filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="nm">
      <div className="nm-topbar">
        <div className="nm-container nm-topbar-inner">
          <span className="nm-topbar-date">{dateStr}</span>
          <div className="nm-topbar-links">
            <Link href="/contact">Contact</Link>
            {site.indexingEnabled && <Link href="/rss.xml">RSS Feed</Link>}
          </div>
        </div>
      </div>

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

      <nav className="nm-nav" aria-label="Main navigation">
        <div className="nm-container nm-nav-inner">
          <Link href="/" className="nm-nav-link nm-nav-home">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </Link>
          <Link href="/" className="nm-nav-link">Home</Link>
          {navCategories.map((cat) => (
            <Link key={cat} href={`/category/${slugify(cat)}`} className="nm-nav-link">{cat}</Link>
          ))}
        </div>
      </nav>

      <div className="nm-container">
        <main className="nm-content" style={{ maxWidth: "100%" }}>
          {children}
        </main>
      </div>

      <footer className="nm-footer">
        <div className="nm-container">
          <div className="nm-footer-top">
            <div className="nm-footer-col">
              <h4 className="nm-footer-title">{site.name}</h4>
              <p>{site.description}</p>
              {site.contactEmail && <p>Email: {site.contactEmail}</p>}
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
              {site.indexingEnabled && <Link href="/sitemap.xml">Sitemap</Link>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
