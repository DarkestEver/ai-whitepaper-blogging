# Template Design Guide

Rules, conventions, and architecture for building and maintaining site templates.

---

## 1. Template Architecture

### Directory Structure

```
templates/
  registry.ts              # Template definitions, config fields, data interfaces
  <template-id>/
    home.tsx               # Homepage component (required)
    detail.tsx             # Post detail component (required)
    layout-wrapper.tsx     # Shared chrome for non-content pages (required)
    <template-id>.css      # Template-specific styles (optional, import in globals.css)
```

### Registry (`templates/registry.ts`)

Every template must be registered in `templateRegistry` with:

| Field             | Type                    | Description                                      |
|-------------------|-------------------------|--------------------------------------------------|
| `id`              | `string`                | Unique slug (lowercase, no spaces). Used in DB.  |
| `name`            | `string`                | Display name shown in admin UI.                  |
| `description`     | `string`                | One-line summary for template picker.            |
| `thumbnail`       | `string`                | Path to preview image (`/templates/<id>-thumb.png`). |
| `homeComponent`   | `string`                | Matches the template `id`.                       |
| `detailComponent` | `string`                | Matches the template `id`.                       |
| `configFields`    | `TemplateConfigField[]` | Per-site settings (see Section 5).               |

### Data Interfaces

Templates receive typed data — never raw DB queries.

**`HomePageData`** (home.tsx):
```ts
{
  site: SiteRecord;
  papers: PaperRecord[];
  featuredPapers: PaperRecord[];
  categories: string[];
  query: string;
  topic: string;
  pagination: {
    items: PaperRecord[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startItem: number;
    endItem: number;
    pageNumbers: number[];
  };
}
```

**`DetailPageData`** (detail.tsx):
```ts
{
  site: SiteRecord;
  paper: PaperRecord;
  relatedPapers: PaperRecord[];
  categories: string[];
}
```

**`LayoutWrapperProps`** (layout-wrapper.tsx):
```ts
{
  site: SiteRecord;
  children: React.ReactNode;
  categories?: string[];
}
```

---

## 2. Required Pages & Navigation Consistency

Every template must render a **consistent navigation** across all page types:

| Page Type      | Route                      | Component Used       |
|----------------|----------------------------|----------------------|
| Homepage       | `/`                        | `home.tsx`           |
| Category       | `/category/[slug]`         | `home.tsx` (filtered)|
| Post detail    | `/whitepapers/[slug]`      | `detail.tsx`         |
| Legal pages    | `/legal/[document]`        | `layout-wrapper.tsx` |
| Contact        | `/contact`                 | `layout-wrapper.tsx` |

### Rule: Same header/nav/footer everywhere

- The nav bar, logo area, topbar, and footer must be identical across home, detail, category, and legal pages.
- `layout-wrapper.tsx` exists specifically to wrap non-content pages (legal, contact) with the same template chrome.
- **Never** render a different nav for different pages. All pages should show the same category links.

### Category vs Homepage

The home component handles both homepage and category pages via the `topic` prop:

```tsx
const isHomePage = topic === "All topics";
```

- **Homepage** (`isHomePage === true`): Show featured grid, trending bar, category sections, full layout.
- **Category page** (`isHomePage === false`): Show breadcrumb, filtered posts only. Hide featured grid, trending bar, category sections.

---

## 3. Component Rules

### 3.1 Shared Components

Reusable components live in `components/` and work across all templates:

| Component        | File                            | Usage                        |
|------------------|---------------------------------|------------------------------|
| `SubscribeForm`  | `components/subscribe-form.tsx` | Newsletter opt-in            |
| `DownloadForm`   | `components/download-form.tsx`  | PDF download with double opt-in |
| `FeaturedCarousel` | `components/featured-carousel.tsx` | Carousel widget          |

### 3.2 SubscribeForm Variants

The `SubscribeForm` component has three variants:

| Variant    | Use Case                  | Props                        |
|------------|---------------------------|------------------------------|
| `"box"`    | Sidebar widget            | Default. Full form with email, validation, privacy link. |
| `"inline"` | Inline embed              | Compact email + button row.  |
| `"footer"` | Footer newsletter block   | Dark-themed, fits footer columns. |

Place subscribe forms in:
- Sidebar (box variant)
- Footer columns (footer variant)
- Inline within content (inline variant)

### 3.3 DownloadForm

Used on detail pages when `paper.downloadablePdfAsset` exists. Implements double opt-in with email verification.

### 3.4 Component Conventions

- All client components must have `"use client"` directive.
- Use `useId()` for form element IDs (SSR-safe, no collisions).
- Use `aria-*` attributes for accessibility (labels, roles, live regions).
- Use `role="alert"` for error/success messages.
- Validate on blur, clear errors on change.

---

## 4. Styling Rules

### 4.1 CSS Namespacing

Each template **must** namespace all its CSS classes to avoid conflicts:

| Template  | Prefix  | Example              |
|-----------|---------|----------------------|
| Default   | (none)  | `.site-shell`, `.hero` |
| Newsmag   | `nm-`   | `.nm-nav`, `.nm-footer` |

New templates should pick a short unique prefix (2-3 chars).

### 4.2 Shared Component Styles

Shared component styles go in `app/globals.css` with their own class namespace:
- `.subscribe-*` for subscribe form
- `.sub-w-*` for subscribe widget (box variant)
- `.sub-ok-*` for success state

### 4.3 Overflow

Always set `overflow-x: hidden` on the template root element to prevent horizontal scrollbar from full-bleed sections.

```css
.nm { overflow-x: hidden; }
```

### 4.4 Placeholder Images

When no cover image exists, templates render colored placeholder cards. Rules:

- Use `art-{accent}` class for color variants (accent comes from `paper.accent`).
- Always set `padding`, `text-align: center`, `box-sizing: border-box`, `overflow: hidden` on placeholder elements.
- Truncate text inside placeholders — never let it overflow.

### 4.5 Responsive Design & Device Compatibility

#### Breakpoint System

Templates must support three breakpoints (mobile-first or desktop-first — be consistent within a template):

| Token    | Max-width  | Target Devices                                | Layout Changes                     |
|----------|------------|-----------------------------------------------|------------------------------------|
| Desktop  | > 1024px   | Desktop monitors, laptops                     | Full layout: content + sidebar     |
| Tablet   | ≤ 1024px   | iPad, tablets, small laptops                  | Narrower sidebar or hidden sidebar |
| Mobile   | ≤ 600px    | Phones (portrait & landscape)                 | Single column, stacked everything  |

An optional mid-breakpoint at **900px** can be added for content-heavy templates (e.g., Newsmag uses 1024 → 900 → 600).

#### Desktop (> 1024px)

```css
/* Full two-column layout */
.nm-main-wrap { display: grid; grid-template-columns: 1fr 300px; gap: 32px; }
```

- Content + sidebar side by side.
- Featured grid shows full multi-column layout.
- Header ad (728x90) visible.
- Nav shows all 8 categories inline.

#### Tablet (≤ 1024px)

```css
@media (max-width: 1024px) {
  .nm-main-wrap { grid-template-columns: 1fr 280px; gap: 28px; }
  .nm-ad-728 { width: 100%; max-width: 728px; }
}
```

#### Tablet-Small (≤ 900px)

```css
@media (max-width: 900px) {
  .nm-main-wrap { grid-template-columns: 1fr; }   /* Sidebar drops below */
  .nm-sidebar { display: none; }                    /* Or hide sidebar */
  .nm-featured-grid { grid-template-columns: 1fr; } /* Stack featured cards */
  .nm-posts-grid { grid-template-columns: repeat(2, 1fr); }
  .nm-footer-top { grid-template-columns: 1fr 1fr; }
}
```

Key changes:
- Sidebar hidden or moved below content.
- Featured grid stacks vertically.
- Post grids go from 3 → 2 columns.
- Footer columns go from 5 → 2 columns.

#### Mobile (≤ 600px)

```css
@media (max-width: 600px) {
  .nm-container { padding: 0 14px; }
  .nm-nav-inner { flex-wrap: wrap; }
  .nm-nav-link { padding: 11px 12px; font-size: 11px; }
  .nm-nav-search { width: 100%; }
  .nm-posts-grid { grid-template-columns: 1fr; }
  .nm-header-ad { display: none; }
  .nm-logobar-inner { flex-direction: column; gap: 12px; }
  .nm-footer-top { grid-template-columns: 1fr; }
  .nm-article-title { font-size: 24px; }
}
```

Key changes:
- All grids become single-column.
- Nav links wrap, search goes full-width.
- Header ad hidden (no room for 728x90).
- Logo and tagline stack vertically.
- Container padding reduced (14px).
- Article title font size reduced.
- Footer columns stack to single column.

#### Per-Element Responsive Rules

| Element           | Desktop              | Tablet (≤900px)      | Mobile (≤600px)      |
|-------------------|----------------------|----------------------|----------------------|
| Main layout       | Content + sidebar    | Content only         | Content only         |
| Sidebar           | Visible (300px)      | Hidden               | Hidden               |
| Featured grid     | 2-column             | 1-column             | 1-column             |
| Post grid         | 3-column             | 2-column             | 1-column             |
| Related posts     | 3-column             | 2-column             | 1-column             |
| Nav categories    | Inline, 8 items      | Inline, wrapping     | Wrapped, smaller font |
| Search bar        | Inline in nav        | Inline in nav        | Full-width below nav |
| Header ad (728×90)| Visible              | Scaled down          | Hidden               |
| Sidebar ad (300×250)| Visible            | Hidden (with sidebar)| Hidden               |
| Logo bar          | Horizontal           | Horizontal           | Stacked vertical     |
| Footer columns    | 5-column grid        | 2-column grid        | 1-column stack       |
| Subscribe form    | In sidebar + footer  | Footer only          | Footer only          |
| Article title     | 32px+                | 28px                 | 24px                 |
| Container padding | 0 20px               | 0 16px               | 0 14px               |

#### Touch & Mobile Interaction

- **Tap targets:** All interactive elements (links, buttons) must be at least **44×44px** touch area (WCAG 2.5.5).
- **No hover-only states:** Every `:hover` effect must also work on `:focus` and `:active` for touch/keyboard.
- **Horizontal scroll:** Prevented via `overflow-x: hidden` on root. Never use fixed-width elements wider than viewport.
- **Font size:** Minimum **14px** for body text on mobile. Never below **11px** for any text.
- **Form inputs:** Minimum **16px** font size on iOS to prevent auto-zoom on focus.
- **Nav overflow:** Use `flex-wrap: wrap` on nav, never `overflow: scroll` for category links.

#### Device Testing Matrix

Templates should be verified on these viewport sizes:

| Device Class     | Width  | Height | Pixel Ratio | Notes                    |
|------------------|--------|--------|-------------|--------------------------|
| iPhone SE        | 375px  | 667px  | 2x          | Smallest common phone    |
| iPhone 14/15     | 393px  | 852px  | 3x          | Standard phone           |
| iPhone 14 Pro Max| 430px  | 932px  | 3x          | Large phone              |
| iPad Mini        | 768px  | 1024px | 2x          | Small tablet             |
| iPad Air/Pro     | 820px  | 1180px | 2x          | Standard tablet          |
| Laptop           | 1280px | 800px  | 1-2x        | Standard laptop          |
| Desktop HD       | 1920px | 1080px | 1x          | Full HD monitor          |
| 4K               | 2560px | 1440px | 1-2x        | Wide monitor             |

#### Content Max-Width

Prevent content from stretching too wide on large screens:

```css
.nm-container {
  max-width: 1200px;   /* Content max width */
  margin: 0 auto;      /* Center on large screens */
  padding: 0 20px;     /* Side padding */
}
```

- Main content container: **1200px** max.
- Article body text: **720px** max for optimal reading line length (45-75 characters).
- Full-bleed sections (nav, footer): Can span full width but inner content stays within max-width.

#### Image Responsiveness

```css
img {
  max-width: 100%;
  height: auto;
}
```

- All images must be responsive (`max-width: 100%; height: auto`).
- Use `object-fit: cover` for card/grid images to prevent distortion.
- Cover images in featured cards: `aspect-ratio` or fixed height with `object-fit: cover`.
- Hide large ad images on mobile — they take too much viewport space.

#### Print Styles (Optional)

```css
@media print {
  .nm-nav, .nm-sidebar, .nm-footer, .nm-topbar,
  .nm-ticker, .nm-ad-widget, .subscribe-form { display: none; }
  .nm-main-wrap { grid-template-columns: 1fr; }
  .nm-article-body { font-size: 12pt; line-height: 1.6; }
}
```

Hide nav, sidebar, ads, subscribe forms, and footer when printing. Ensure article content fills the page.

### 4.6 Color & Theme Tokens

Templates can use CSS custom properties from the site's theme. The admin token system provides:

```css
--ink          /* Primary text */
--muted        /* Secondary text */
--border       /* Border color */
--accent       /* Brand/accent color */
--paper        /* Background */
--paper-secondary /* Alt background */
```

Templates may also define their own variables for template-specific styling (e.g., nav color from config).

---

## 5. Template Configuration

### 5.1 Config Fields

Each template declares `configFields` in the registry. These render automatically in the admin site settings UI.

**Field types:**

| Type       | Renders As          | Notes                                    |
|------------|---------------------|------------------------------------------|
| `text`     | Text input          | Single-line string                       |
| `textarea` | Textarea            | Multi-line text                          |
| `url`      | URL input           | Validated URL format                     |
| `color`    | Color picker        | Hex color value                          |
| `select`   | Dropdown            | Requires `options` array                 |
| `image`    | File upload + URL   | Uploads via `/api/admin/media/upload`    |

**Field definition:**
```ts
interface TemplateConfigField {
  key: string;           // Storage key (e.g., "navColor")
  label: string;         // Admin UI label
  type: "text" | "textarea" | "url" | "color" | "select" | "image";
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[]; // For select type
  help?: string;         // Help text shown below field
}
```

### 5.2 Config Storage

- Stored as `templateConfig: Record<string, string>` on the site model.
- Form fields use `tc_` prefix: field key `navColor` becomes form field `tc_navColor`.
- API route strips the prefix and saves to `site.templateConfig`.

### 5.3 Using Config in Templates

Access config values via `site.templateConfig`:

```tsx
const navColor = site.templateConfig?.navColor || "#dd3333";
const showTrending = site.templateConfig?.showTrendingBar !== "no";
```

Always provide fallback defaults — config values may be empty strings or undefined.

### 5.4 Current Config Fields

**Default template:**
- `heroTitle` — Hero section heading
- `heroSubtitle` — Hero section subheading
- `ctaText` — CTA button text

**Newsmag template:**
- `adHeaderImage` — 728x90 header banner image
- `adSidebarImage` — 300x250 sidebar ad image
- `adHeaderLink` — Header ad click-through URL
- `adSidebarLink` — Sidebar ad click-through URL
- `showTrendingBar` — Toggle trending ticker (yes/no)
- `featuredCount` — Number of featured posts (3/5/7)
- `navColor` — Navigation bar background color
- `footerAbout` — Footer about text

---

## 6. Creating a New Template

### Step-by-step

1. **Create directory:** `templates/<id>/`

2. **Create `home.tsx`:**
   - Export a named function component (e.g., `export function MyTemplateHome(props: HomePageData)`)
   - Accept `HomePageData` props
   - Handle both homepage (`topic === "All topics"`) and category views
   - Include full nav with all categories
   - Include pagination
   - Include subscribe form(s)

3. **Create `detail.tsx`:**
   - Export a named function component (e.g., `export function MyTemplateDetail(props: DetailPageData)`)
   - Accept `DetailPageData` props
   - Render the same nav as home.tsx (use `categories` prop)
   - Render article content (handle both `htmlContent` and structured fields)
   - Include download form when `paper.downloadablePdfAsset` exists
   - Include related posts
   - Include sidebar (optional)

4. **Create `layout-wrapper.tsx`:**
   - Export a named function component (e.g., `export function MyTemplateWrapper(props)`)
   - Accept `{ site: SiteRecord; children: React.ReactNode; categories?: string[] }`
   - Wrap children with the same header/nav/footer as home and detail pages

5. **Create CSS file** (if needed):
   - Namespace all classes with your prefix
   - Import in `app/globals.css`

6. **Register in `templates/registry.ts`:**
   - Add entry to `templateRegistry` array
   - Define config fields

7. **Wire into page routes:**
   - Update `app/page.tsx` to import and render your home component
   - Update `app/whitepapers/[slug]/page.tsx` to render your detail component
   - Update `app/legal/[document]/page.tsx` and `app/contact/page.tsx` to use your wrapper

### Template rendering switch pattern

```tsx
// In page routes:
if (site.templateId === "newsmag") {
  return <NewsmagHome {...data} />;
}
return <DefaultHome {...data} />;
```

---

## 7. Menus & Navigation

### 7.1 Primary Navigation

The main nav renders categories dynamically from the `categories` prop (derived from published posts).

**Rules:**
- Filter out `"All topics"` — it's an internal value, not a visible category.
- Limit to 8 categories max in the nav bar: `.slice(0, 8)`.
- Always include a Home link (icon or text).
- Highlight the active category with an `active` class or `aria-current="page"`.

```tsx
const navCategories = categories.filter((c) => c !== "All topics").slice(0, 8);
```

**Navigation must include:**

| Element         | Required | Notes                                      |
|-----------------|----------|--------------------------------------------|
| Home link       | Yes      | Links to `/`                               |
| Category links  | Yes      | Links to `/category/{slugify(cat)}`        |
| Search form     | Yes      | `action="/"` with `name="q"` input         |
| Contact link    | Optional | In topbar or footer                        |
| RSS link        | Conditional | Only when `site.indexingEnabled === true` |

### 7.2 Category System

Categories are derived from published posts — there is no standalone category management. Each post has a `category` field.

**Category page routing:** `/category/[slug]`
- The slug is generated via `slugify(category)` from `lib/slugify.ts`.
- Category pages reuse `home.tsx` with `topic` set to the category name.
- The home component filters content and hides homepage-only sections.

**Category links pattern:**
```tsx
import { slugify } from "@/lib/slugify";

function catHref(category: string): string {
  return `/category/${slugify(category)}`;
}
```

**Category display locations:**
- Primary nav bar (top 8 categories)
- Sidebar widget (all categories with post counts)
- Footer columns (top 6 categories)
- Breadcrumbs on detail and category pages
- Category badges on post cards

**Post count in sidebar:**
```tsx
const count = papers.filter((p) => p.category === cat).length;
// Render: {cat} ({count})
```

### 7.3 Breadcrumbs

Required on detail pages and category pages. Not shown on homepage.

**Detail page:**
```
Home / {category} / {title}
```

**Category page:**
```
Home / {category}
```

**Pattern:**
```tsx
<nav className="nm-breadcrumb" aria-label="Breadcrumb">
  <Link href="/">Home</Link>
  <span>/</span>
  <Link href={catHref(paper.category)}>{paper.category}</Link>
  <span>/</span>
  <span>{paper.title}</span>
</nav>
```

### 7.4 Search

Every template must include a search form in the nav or a prominent location.

- Form `action="/"` with `method="get"` and `role="search"`.
- Input `name="q"` with `type="search"` and `defaultValue={query}`.
- Search works across all pages — results render on the homepage.
- Category context is preserved via the topic parameter.

---

## 8. RSS Feed, Sitemap & SEO Assets

All site-wide feeds and SEO assets are **global routes** (not template-specific). Templates only need to **link to them** conditionally.

### 8.1 Available Routes

| Route            | Format   | Description                          | Condition              |
|------------------|----------|--------------------------------------|------------------------|
| `/rss.xml`       | XML      | RSS 2.0 feed of published posts     | `site.indexingEnabled` |
| `/sitemap.xml`   | XML      | Sitemap for search engines           | `site.indexingEnabled` |
| `/llms.txt`      | Text     | LLM-readable site summary           | `site.indexingEnabled` |
| `/robots.txt`    | Text     | Crawl directives                     | Always available       |

### 8.2 Linking Rules

**Only show RSS/Sitemap links when `site.indexingEnabled === true`:**

```tsx
{site.indexingEnabled && <Link href="/rss.xml">RSS Feed</Link>}
{site.indexingEnabled && <Link href="/sitemap.xml">Sitemap</Link>}
{site.indexingEnabled && <Link href="/llms.txt">llms.txt</Link>}
```

**Where to place links:**

| Location          | Links to show                          |
|-------------------|----------------------------------------|
| Topbar            | RSS Feed                               |
| Footer (Resources column) | Sitemap, RSS Feed, llms.txt   |
| Footer bottom bar | RSS (compact)                          |
| `<head>` meta     | RSS autodiscovery (handled by layout)  |

**Never link to RSS/Sitemap when indexing is disabled** — the routes return 404 for non-indexed sites.

### 8.3 SEO Metadata

Templates do not generate `<head>` metadata directly — that's handled by Next.js `generateMetadata()` in the page routes. However, templates should include:

- **Canonical URLs** — handled at the route level.
- **Structured data** — JSON-LD (`ScholarlyArticle`, `FAQPage`, `BreadcrumbList`) generated by `lib/schema-generator.ts`.
- **Open Graph tags** — generated at the route level.

---

## 9. Footer Requirements

Every template footer must include these sections:

### 9.1 Footer Columns

| Column       | Content                                           |
|--------------|---------------------------------------------------|
| About        | `site.name`, `site.description`, `site.contactEmail` |
| Categories   | Top 6 categories with links to `/category/{slug}` |
| Legal        | Privacy, Terms, Cookies, Disclaimer, Editorial Policy, Accessibility |
| Resources    | Contact, Sitemap*, RSS*, llms.txt* (*if indexing enabled) |
| Newsletter   | `<SubscribeForm variant="footer" />`              |

### 9.2 Footer Bottom Bar

```tsx
<div className="nm-footer-bottom">
  <p>&copy; {year} {site.legalName || site.name}. All rights reserved.</p>
  <div className="nm-footer-bottom-links">
    <Link href="/privacy">Privacy</Link>
    <Link href="/terms">Terms</Link>
    <Link href="/contact">Contact</Link>
    {site.indexingEnabled && <Link href="/rss.xml">RSS</Link>}
  </div>
</div>
```

### 9.3 Legal Pages

Legal pages are handled by `/legal/[document]/page.tsx`. Supported documents:

| Slug               | Title              |
|---------------------|--------------------|
| `privacy`           | Privacy Policy     |
| `terms`             | Terms of Use       |
| `cookies`           | Cookie Policy      |
| `disclaimer`        | Disclaimer         |
| `editorial-policy`  | Editorial Policy   |
| `accessibility`     | Accessibility      |

All legal pages render inside `layout-wrapper.tsx` with the same nav/footer as the rest of the site.

---

## 10. Pagination

### Rules

- Default page size: configured per template (typically 12 items).
- Pagination data comes via `pagination` prop in `HomePageData`.
- Works on both homepage and category pages.

### URL Pattern

```tsx
function pageHref(query: string, topic: string, page: number): string {
  const base = topic !== "All topics" ? catHref(topic) : "/";
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}
```

- Page 1 has no `?page=` param (clean URL).
- Search query `q` is preserved across pages.
- Category context is preserved via the base path.

### Required UI Elements

```
← Prev  1  2  3  4  5  Next →
```

- Show previous/next links (hide when at first/last page).
- Highlight current page with `active` class.
- Use `pagination.pageNumbers` array for page links.

---

## 11. Accessibility Requirements

All templates must meet these baseline accessibility standards:

- **Skip link:** `<a className="skip-link" href="#main-content">Skip to content</a>` as first child.
- **Landmarks:** Use `<header>`, `<main id="main-content">`, `<nav aria-label="...">`, `<footer>`, `<aside>`.
- **Form labels:** Every input needs a `<label>` (visible or `.sr-only`).
- **ARIA live regions:** Use `role="alert"` on error messages, `role="status"` on success states.
- **Image alts:** Provide `alt` text for content images. Use `alt=""` for decorative images.
- **Current page:** Use `aria-current="page"` on active nav links.
- **Breadcrumbs:** Use `<nav aria-label="Breadcrumb">` for breadcrumb navigation.
- **Color contrast:** Text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

---

## 12. Content Rendering

### Structured vs HTML Content

Posts can have either:
- **`htmlContent`** — Pre-rendered HTML from the editor. Render with `dangerouslySetInnerHTML`.
- **Structured fields** — `abstract`, `takeaways`, `keyFacts`, `faqItems`, `geoSummary`, `keyEntities`. Render each section individually.

Always check `htmlContent` first:

```tsx
{paper.htmlContent ? (
  <div className="html-content" dangerouslySetInnerHTML={{ __html: paper.htmlContent }} />
) : (
  <>
    {/* Render structured sections */}
  </>
)}
```

### Required Detail Sections

1. Article header (title, subtitle, category badge, author, date, reading time)
2. Cover image or placeholder
3. Summary
4. Tags/taxonomy (industry, geographic target, tags)
5. Body content (HTML or structured)
6. Download box (if PDF available)
7. Source attribution (if source exists)
8. Related posts

---

## 13. SEO & AEO (Answer Engine Optimization)

### 13.1 SEO Architecture

SEO is split between **route-level metadata** and **template-level markup**:

| Responsibility          | Owner                        | Location                        |
|-------------------------|------------------------------|---------------------------------|
| `<title>`, `<meta>`    | Page route `generateMetadata()` | `app/page.tsx`, `app/whitepapers/[slug]/page.tsx` |
| Canonical URL           | Page route                   | `generateMetadata()` → `alternates.canonical` |
| Open Graph tags         | Page route                   | `generateMetadata()` → `openGraph` |
| JSON-LD structured data | `lib/schema-generator.ts`    | Injected as `<script type="application/ld+json">` |
| Heading hierarchy       | Template                     | Must follow H1 → H2 → H3 order |
| Internal linking        | Template                     | Category links, related posts, breadcrumbs |
| Image alt text          | Template                     | Every `<img>` needs descriptive alt |
| RSS autodiscovery       | Root layout                  | `<link rel="alternate" type="application/rss+xml">` |

### 13.2 Metadata Pattern (Route Level)

```tsx
// app/whitepapers/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `${paper.title} | ${site.name}`,
    description: paper.summary.slice(0, 160),
    alternates: { canonical: `https://${site.customDomain}/whitepapers/${paper.slug}` },
    openGraph: {
      title: paper.title,
      description: paper.summary,
      type: "article",
      images: paper.coverImageUrl ? [paper.coverImageUrl] : [],
      publishedTime: paper.publicationDate,
      authors: [paper.authorName],
    },
  };
}
```

### 13.3 Structured Data (JSON-LD)

Generated by `lib/schema-generator.ts`. Templates render it as a script tag.

**Supported schema types:**

| Schema Type        | Used When                              |
|--------------------|----------------------------------------|
| `ScholarlyArticle` | Whitepapers, research reports          |
| `Article`          | General posts, guides                  |
| `NewsArticle`      | News-style briefings                   |
| `FAQPage`          | Posts with `faqItems`                  |
| `BreadcrumbList`   | All detail and category pages          |

**Template rule:** Include the JSON-LD script in the detail page `<head>` or body:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>
```

### 13.4 Heading Hierarchy

Every page must follow a strict heading order:

| Page Type  | H1                       | H2                                  | H3                    |
|------------|--------------------------|-------------------------------------|-----------------------|
| Homepage   | Site name or hero title  | Section titles ("Latest Posts", category names) | Post titles in grids |
| Category   | Category name            | "Latest Posts"                      | Post titles           |
| Detail     | Post title               | Content sections (Overview, Key Takeaways, FAQ) | FAQ questions        |
| Legal      | Page title               | Section headings                    | —                     |

**Rule:** Only one `<h1>` per page. Never skip heading levels (no H1 → H3).

### 13.5 Internal Linking

Templates must create a strong internal link structure:

- **Category links** in nav, sidebar, footer → `/category/{slug}`
- **Related posts** on detail pages → `/whitepapers/{slug}`
- **Breadcrumbs** → link back to home and category
- **Post cards** → link to detail pages
- **"Back to" links** → link back to the listing

### 13.6 Image SEO

- All content images need descriptive `alt` text: `alt={paper.title}` or `alt={paper.coverImageAlt}`.
- Decorative images use `alt=""` with `aria-hidden="true"`.
- Logo images use `alt={site.name}`.
- Placeholder images (no cover) don't need alt — they're decorative divs.

### 13.7 AEO (Answer Engine Optimization)

AEO optimizes content for AI-powered search engines (Google AI Overview, Bing Chat, Perplexity, ChatGPT search).

**AI draft fields for AEO** (generated by `lib/ai-drafts.ts`):

| Field                   | Purpose                                    |
|-------------------------|--------------------------------------------|
| `answerEngineKeywords`  | Keywords targeting answer engine queries    |
| `featuredSnippet`       | Concise 40-60 word answer for position zero |
| `voiceSearchOptimized`  | Whether content is structured for voice queries |
| `geoSummary`            | Direct answer to the post's core question  |

**Template rendering for AEO:**

1. **Featured snippet box** — Render `paper.geoSummary` or `paper.featuredSnippet` as a prominent answer block near the top of detail pages:

```tsx
{paper.geoSummary && (
  <section className="nm-answer-box">
    <h2>Key Answer</h2>
    <blockquote>{paper.geoSummary}</blockquote>
  </section>
)}
```

2. **FAQ schema** — When `paper.faqItems` exists, render as structured Q&A with `FAQPage` schema:

```tsx
{paper.faqItems.length > 0 && (
  <section className="nm-faq">
    <h2>Frequently Asked Questions</h2>
    {paper.faqItems.map((item) => (
      <div key={item.question} className="nm-faq-item">
        <h3>{item.question}</h3>
        <p>{item.answer}</p>
      </div>
    ))}
  </section>
)}
```

The corresponding `FAQPage` JSON-LD is generated automatically by `lib/schema-generator.ts`.

3. **Key takeaways** — Render as a bulleted list (AI engines prefer scannable lists):

```tsx
<section>
  <h2>Key Takeaways</h2>
  <ul>
    {paper.takeaways.map((t) => <li key={t}>{t}</li>)}
  </ul>
</section>
```

4. **Key facts** — Render as a scannable list for data-rich answers:

```tsx
<section>
  <h2>Key Facts</h2>
  <ul>
    {paper.keyFacts.map((f) => <li key={f}>{f}</li>)}
  </ul>
</section>
```

### 13.8 AEO Content Principles

| Principle                  | Implementation                                       |
|----------------------------|------------------------------------------------------|
| Answer first               | Put `geoSummary`/`featuredSnippet` above the fold    |
| Use question headings      | FAQ items use questions as H3 headings               |
| Structured lists           | Takeaways and facts as `<ul>/<li>`, not paragraphs   |
| Concise paragraphs         | Keep paragraphs under 3 sentences for snippet extraction |
| Entity-rich content        | Render `keyEntities` as tags for entity recognition  |
| Schema markup              | FAQPage, ScholarlyArticle, BreadcrumbList always present |
| Topical authority          | Category pages + internal links signal topic depth   |

### 13.9 SEO Checklist for Templates

- [ ] `generateMetadata()` returns title, description, canonical, Open Graph
- [ ] JSON-LD structured data renders on detail pages
- [ ] FAQPage schema generated when post has FAQ items
- [ ] BreadcrumbList schema on detail and category pages
- [ ] Single H1 per page, heading hierarchy H1→H2→H3
- [ ] All `<img>` tags have appropriate alt text
- [ ] Internal links: categories, related posts, breadcrumbs
- [ ] RSS autodiscovery link in `<head>` (when indexing enabled)
- [ ] Featured snippet / answer box renders prominently
- [ ] FAQ renders as structured Q&A (question as heading, answer as paragraph)
- [ ] Takeaways and facts render as `<ul>` lists
- [ ] Key entities render as visible tags
- [ ] `robots.txt` and `sitemap.xml` linked in footer

---

## 14. Checklist for New Templates

- [ ] `home.tsx` renders homepage and category pages correctly
- [ ] `detail.tsx` renders all content sections
- [ ] `layout-wrapper.tsx` wraps legal/contact pages
- [ ] Nav is identical across all page types
- [ ] Category pages show filtered content only (no featured grid)
- [ ] CSS classes are namespaced with unique prefix
- [ ] `overflow-x: hidden` on root element
- [ ] Placeholder images have padding and don't clip text
- [ ] Subscribe form included (sidebar and/or footer)
- [ ] Download form included on detail page
- [ ] Template registered in `registry.ts` with config fields
- [ ] All routes updated with new template branch
- [ ] Responsive at 3 breakpoints (1024px, 900px, 600px)
- [ ] Sidebar hidden on tablet/mobile
- [ ] Post grids: 3-col → 2-col → 1-col
- [ ] Nav wraps on mobile, search goes full-width
- [ ] Header ad hidden on mobile
- [ ] Touch targets 44×44px minimum
- [ ] Form inputs 16px+ font (prevents iOS zoom)
- [ ] Images responsive (max-width: 100%, object-fit: cover)
- [ ] Content max-width 1200px, article body max-width 720px
- [ ] No horizontal scroll at any viewport
- [ ] Tested on iPhone SE (375px) through Desktop HD (1920px)
- [ ] Skip link and ARIA landmarks present
- [ ] Form inputs have labels
- [ ] Pagination works on homepage and category pages
- [ ] Categories render in nav, sidebar, footer, breadcrumbs
- [ ] Search form present with `name="q"` and `role="search"`
- [ ] RSS/Sitemap links gated behind `site.indexingEnabled`
- [ ] Footer has all required columns (about, categories, legal, resources, newsletter)
- [ ] Legal pages render inside layout-wrapper
- [ ] Breadcrumbs on detail and category pages
- [ ] SEO structured data (JSON-LD) renders on detail pages
- [ ] Open Graph and meta description set via `generateMetadata()`
- [ ] FAQ schema markup for posts with FAQ content
- [ ] Featured snippet / AEO answer box in detail template
