"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface HotNewsyWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function HotNewsyWrapper({ site, children, categories = [] }: HotNewsyWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

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
              <Link href="/" className="hn-nav-link">Home</Link>
              {navCategories.slice(0, 6).map((cat) => (
                <Link key={cat} href={catHref(cat)} className="hn-nav-link">
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <div className="hn-body">
        <div className="hn-container hn-main-wrap">
          <main className="hn-main">
            {children}
          </main>
          <aside className="hn-sidebar" />
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
