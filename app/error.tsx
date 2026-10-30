"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="not-found">
      <p className="eyebrow">Something went wrong</p>
      <h1>Unexpected<br /><em>error.</em></h1>
      <p>An error occurred while loading this page. Please try again.</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="button button-dark" onClick={reset} type="button">
          Try again <span aria-hidden="true">↻</span>
        </button>
        <Link className="button button-dark" href="/">
          Return to library <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
