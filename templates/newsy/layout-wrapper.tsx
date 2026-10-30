"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}

const categoryEmojis: Record<string, string> = {
  "News": "📰",
  "Entertainment": "🎬",
  "Funny": "😂",
  "Cute": "🐱",
  "Animals": "🦁",
  "Quiz": "❓",
  "List": "📋",
  "Video": "🎥",
  "Tech": "💻",
  "Science": "🔬",
  "Sports": "⚽",
  "Business": "💼",
  "Health": "🏥",
  "Food": "🍔",
  "Travel": "✈️",
  "Music": "🎵",
  "Art": "🎨",
  "Fashion": "👗",
};

function getCategoryEmoji(category: string): string {
  return categoryEmojis[category] || "📌";
}

interface NewsynWrapperProps {
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}

export function NewsynWrapper({ site, children, categories = [] }: NewsynWrapperProps) {
  const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);

  return (
    <div className="nsy">
      {/* Header */}
      <header className="nsy-header">
        <div className="nsy-container nsy-header-inner">
          <Link href="/" className="nsy-logo">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.name} className="nsy-logo-img" />
            ) : (
              <span className="nsy-logo-text">{site.name}</span>
            )}
          </Link>
          <div className="nsy-search-box">
            <input type="search" placeholder="Search" className="nsy-search-input" />
            <button className="nsy-search-btn" aria-label="Search">🔍</button>
          </div>
          <button className="nsy-menu-btn" aria-label="Menu">☰</button>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="nsy-cat-nav" aria-label="Category navigation">
        <div className="nsy-container nsy-cat-nav-inner">
          <Link href="/" className="nsy-cat-tab">All</Link>
          {navCategories.slice(0, 7).map((cat) => (
            <Link key={cat} href={catHref(cat)} className="nsy-cat-tab">
              {getCategoryEmoji(cat)} {cat}
            </Link>
          ))}
        </div>
      </nav>

      <div className="nsy-body">
        <div className="nsy-container">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="nsy-footer">
        <div className="nsy-container">
          <div className="nsy-footer-grid">
            <div className="nsy-footer-col">
              <h4>About</h4>
              <p>{site.description || site.name}</p>
            </div>
            <div className="nsy-footer-col">
              <h4>Categories</h4>
              <ul>
                {navCategories.slice(0, 6).map((cat) => (
                  <li key={cat}>
                    <Link href={catHref(cat)}>{getCategoryEmoji(cat)} {cat}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nsy-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="nsy-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {site.legalName || site.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
