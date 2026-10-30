import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 · Not in the library</p>
      <h1>That research<br /><em>isn’t here.</em></h1>
      <p>The page may have moved, or the address may be incorrect.</p>
      <Link className="button button-dark" href="/">Return to the library <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
