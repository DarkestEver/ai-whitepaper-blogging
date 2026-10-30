"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface ClassicMagazineWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function ClassicMagazineWrapper({ site, children, categories = [] }: ClassicMagazineWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

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
              <Link href="/" className="cm-nav-link">Home</Link>
              {navCategories.slice(0, 7).map((cat) => (
                <Link key={cat} href={catHref(cat)} className="cm-nav-link">
                  {cat.toUpperCase()}
                </Link>
              ))}
              <Link href="#" className="cm-nav-link">MORE</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="cm-body">
        <div className="cm-container cm-main-wrap">
          <main className="cm-main">
            {children}
          </main>
          <aside className="cm-sidebar" />
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
