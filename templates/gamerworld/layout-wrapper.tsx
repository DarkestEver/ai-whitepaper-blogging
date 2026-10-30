"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface GamerWorldWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function GamerWorldWrapper({ site, children, categories = [] }: GamerWorldWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="gw">
      {/* Header */}
      <header className="gw-header">
        <div className="gw-header-top">
          <div className="gw-container">
            <div className="gw-header-inner">
              <Link href="/" className="gw-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="gw-logo-img" />
                ) : (
                  <span className="gw-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="gw-header-actions">
                <button className="gw-icon-btn" aria-label="Search">🔍</button>
                <button className="gw-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="gw-nav" aria-label="Main navigation">
          <div className="gw-container">
            <div className="gw-nav-inner">
              <Link href="/" className="gw-nav-link">Home</Link>
              {navCategories.slice(0, 7).map((cat) => (
                <Link key={cat} href={catHref(cat)} className="gw-nav-link">
                  {cat}
                </Link>
              ))}
              <Link href="#" className="gw-nav-link">More</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="gw-body">
        <div className="gw-container gw-main-wrap">
          <main className="gw-main">
            {children}
          </main>
          <aside className="gw-sidebar" />
        </div>
      </div>

      {/* Footer */}
      <footer className="gw-footer">
        <div className="gw-container">
          <div className="gw-footer-grid">
            <div className="gw-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="gw-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="gw-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="gw-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
