import Link from "next/link";
import type { SiteRecord } from "@/lib/db";

export function DefaultWrapper({ site, children }: { site: SiteRecord; children: React.ReactNode }) {
  return (
    <div className="site-shell" data-theme={site.themeId}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <span className="brand-mark" aria-hidden="true">{site.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{site.name}</strong><small>{site.tagline || site.description}</small></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="/#library">Explore research</a>
          <a href="/#about">About the library</a>
        </nav>
      </header>

      <main id="main-content">
        {children}
      </main>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>{site.name}</strong><small>Research for better decisions</small></span>
        </Link>
        <div>
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/contact">Contact</Link>
          {site.indexingEnabled && <> · <Link href="/rss.xml">RSS</Link> · <Link href="/sitemap.xml">Sitemap</Link></>}
        </div>
        <p>Prototype experience · Not a production publishing service</p>
        <a href="#main-content">Back to top ↑</a>
      </footer>
    </div>
  );
}
