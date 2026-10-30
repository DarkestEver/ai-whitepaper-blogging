"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface LifestyleWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function LifestyleWrapper({ site, children, categories = [] }: LifestyleWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="ls">
      {/* Header */}
      <header className="ls-header">
        <div className="ls-header-top">
          <div className="ls-container">
            <div className="ls-header-inner">
              <Link href="/" className="ls-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="ls-logo-img" />
                ) : (
                  <span className="ls-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="ls-header-actions">
                <button className="ls-search-btn" aria-label="Search">🔍</button>
                <button className="ls-menu-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ls-nav" aria-label="Main navigation">
          <div className="ls-container">
            <div className="ls-nav-inner">
              <Link href="/" className="ls-nav-link">Home</Link>
              {navCategories.slice(0, 6).map((cat) => (
                <Link key={cat} href={catHref(cat)} className="ls-nav-link">
                  {cat}
                </Link>
              ))}
              <Link href="#" className="ls-nav-link">More</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="ls-body">
        <div className="ls-container ls-main-wrap">
          <main className="ls-main">
            {children}
          </main>
          <aside className="ls-sidebar" />
        </div>
      </div>

      {/* Footer */}
      <footer className="ls-footer">
        <div className="ls-container">
          <div className="ls-footer-grid">
            <div className="ls-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="ls-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ls-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="ls-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
