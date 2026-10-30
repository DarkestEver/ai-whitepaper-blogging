"use client";

import Link from "next/link";
import { useRef } from "react";

type CarouselPaper = {
  slug: string;
  coverImageUrl?: string;
  issue: string;
  accent: string;
  category: string;
  readingMinutes: number;
  title: string;
  summary: string;
};

export function FeaturedCarousel({ items }: { items: CarouselPaper[] }) {
  if (items.length < 2) return null;
  const trackRef = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    trackRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    }
  };

  return (
    <section className="featured-carousel" aria-labelledby="featured-carousel-title">
      <div className="carousel-heading">
        <div>
          <p className="eyebrow">Editor&apos;s picks</p>
          <h2 id="featured-carousel-title">Read what&apos;s moving the conversation.</h2>
        </div>
        <div className="carousel-controls">
          <span className="carousel-hint">Swipe or use arrow keys to explore</span>
          <button type="button" aria-label="View previous featured items" onClick={() => move(-1)} className="carousel-button">←</button>
          <button type="button" aria-label="View next featured items" onClick={() => move(1)} className="carousel-button">→</button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="carousel-track"
        tabIndex={0}
        role="region"
        aria-label="Featured research carousel"
        onKeyDown={handleKeyDown}
      >
        {items.slice(0, 6).map((paper, index) => {
          const colors = ['navy', 'purple', 'sage', 'gold', 'mint', 'cream'];
          const colorClass = colors[index % colors.length];
          return (
            <article className={`carousel-card carousel-item carousel-item-${colorClass}`} key={paper.slug}>
              <Link href={`/whitepapers/${paper.slug}`} className={`carousel-art art-${colorClass}`}>
                {paper.coverImageUrl ? (
                  <img src={paper.coverImageUrl} alt={paper.title} />
                ) : (
                  <span aria-hidden="true" className="carousel-issue-number">{paper.issue}</span>
                )}
              </Link>
              <div className="carousel-card-copy">
                <span className="paper-meta">{paper.category} · {paper.readingMinutes} min read</span>
                <h3><Link href={`/whitepapers/${paper.slug}`}>{paper.title}</Link></h3>
                <p>{paper.summary}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
