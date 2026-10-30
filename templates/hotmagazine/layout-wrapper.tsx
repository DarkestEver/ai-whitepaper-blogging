"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

interface HotMagazineWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function HotMagazineWrapper({ site, children, categories = [] }: HotMagazineWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="hm">
      {/* Header */}
      <header className="hm-header">
        <div className="hm-header-top">
          <div className="hm-container">
            <div className="hm-header-inner">
              <Link href="/" className="hm-logo">
                {site.logoUrl ? (
                  <img src={site.logoUrl} alt={site.name} className="hm-logo-img" />
                ) : (
                  <span className="hm-logo-text">{site.name}</span>
                )}
              </Link>
              <div className="hm-header-ad">
                <div className="hm-ad-space">ad</div>
              </div>
              <div className="hm-header-icons">
                <button className="hm-icon-btn" aria-label="Search">🔍</button>
                <button className="hm-icon-btn" aria-label="Menu">☰</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hm-nav" aria-label="Main navigation">
          <div className="hm-container">
            <div className="hm-nav-inner">
              <Link href="/" className="hm-nav-link">Home</Link>
              {navCategories.slice(0, 8).map((cat) => (
                <Link key={cat} href={catHref(cat)} className="hm-nav-link">
                  {cat.toUpperCase()}
                </Link>
              ))}
              <Link href="#" className="hm-nav-link">MORE</Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="hm-body">
        <div className="hm-container hm-main-wrap">
          <main className="hm-main">
            {children}
          </main>
          <aside className="hm-sidebar" />
        </div>
      </div>

      {/* Footer */}
      <footer className="hm-footer">
        <div className="hm-container">
          <div className="hm-footer-grid">
            <div className="hm-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="hm-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hm-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="hm-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
