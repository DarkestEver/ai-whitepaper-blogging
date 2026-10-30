"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface MagazineWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function MagazineWrapper({ site, children, categories = [] }: MagazineWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="mag">
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
            {navCategories.slice(0, 5).map((cat) => (
              <Link key={cat} href={catHref(cat)}>
                {cat}
              </Link>
            ))}
            <Link href="/pages">Pages</Link>
          </nav>
          <div className="mag-header-icons">
            <button className="mag-icon-btn" aria-label="Social">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9h-4v4h4v-4z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mag-body">
        <main id="main-content" className="mag-container">
          {children}
        </main>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
