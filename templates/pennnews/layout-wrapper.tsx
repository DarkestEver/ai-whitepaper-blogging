"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface PennNewsWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function PennNewsWrapper({ site, children, categories = [] }: PennNewsWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="pn">
      {/* Header */}
      <header className="pn-header">
        <div className="pn-header-top">
          <div className="pn-container">
            <div className="pn-header-inner">
              <Link href="/" className="pn-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="pn-logo-img" />
                ) : (
                  <span className="pn-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="pn-header-actions">
                <button className="pn-icon-btn" aria-label="Search">🔍</button>
                <button className="pn-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="pn-nav" aria-label="Main navigation">
          <div className="pn-container">
            <div className="pn-nav-inner">
              <Link href="/" className="pn-nav-link">Home</Link>
              {navCategories.slice(0, 7).map((cat) => (
                <Link key={cat} href={catHref(cat)} className="pn-nav-link">
                  {cat}
                </Link>
              ))}
              <Link href="#" className="pn-nav-link">More</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="pn-body">
        <div className="pn-container pn-main-wrap">
          <main className="pn-main">
            {children}
          </main>
          <aside className="pn-sidebar" />
        </div>
      </div>

      {/* Footer */}
      <footer className="pn-footer">
        <div className="pn-container">
          <div className="pn-footer-grid">
            <div className="pn-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="pn-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pn-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pn-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
