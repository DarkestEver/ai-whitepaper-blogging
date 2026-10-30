import type { SiteRecord, PaperRecord } from "@/lib/db";

export interface HomePageData {
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

export interface DetailPageData {
  site: SiteRecord;
  paper: PaperRecord;
  relatedPapers: PaperRecord[];
  categories: string[];
}

export interface TemplateConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "color" | "select" | "image";
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  homeComponent: string;
  detailComponent: string;
  configFields: TemplateConfigField[];
}

export const templateRegistry: TemplateDefinition[] = [
  {
    id: "default",
    name: "Signal Library",
    description: "Clean, minimalist research library with Swiss design aesthetics",
    thumbnail: "/templates/default-thumb.png",
    homeComponent: "default",
    detailComponent: "default",
    configFields: [
      { key: "heroTitle", label: "Hero Title", type: "text", placeholder: "Ideas worth thinking through.", defaultValue: "" },
      { key: "heroSubtitle", label: "Hero Subtitle", type: "text", placeholder: "Independent research library", defaultValue: "" },
      { key: "ctaText", label: "CTA Button Text", type: "text", placeholder: "Browse the library", defaultValue: "" },
    ],
  },
  {
    id: "newsmag",
    name: "Newsmag",
    description: "Bold magazine-style layout with featured grid, category sections, and sidebar widgets",
    thumbnail: "/templates/newsmag-thumb.png",
    homeComponent: "newsmag",
    detailComponent: "newsmag",
    configFields: [
      { key: "adHeaderImage", label: "Header Ad Image (728x90)", type: "image", placeholder: "Upload 728x90 banner image", defaultValue: "", help: "Image for the 728x90 header banner ad slot" },
      { key: "adSidebarImage", label: "Sidebar Ad Image (300x250)", type: "image", placeholder: "Upload 300x250 sidebar image", defaultValue: "", help: "Image for the 300x250 sidebar ad slot" },
      { key: "adHeaderLink", label: "Header Ad Link URL", type: "url", placeholder: "https://example.com", defaultValue: "", help: "Click-through URL for header ad" },
      { key: "adSidebarLink", label: "Sidebar Ad Link URL", type: "url", placeholder: "https://example.com", defaultValue: "", help: "Click-through URL for sidebar ad" },
      { key: "showTrendingBar", label: "Show Trending Bar", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "featuredCount", label: "Featured Posts Count", type: "select", defaultValue: "5", options: [{ value: "3", label: "3" }, { value: "5", label: "5" }, { value: "7", label: "7" }] },
      { key: "navColor", label: "Navigation Bar Color", type: "color", defaultValue: "#dd3333" },
      { key: "footerAbout", label: "Footer About Text", type: "textarea", placeholder: "Short description for footer", defaultValue: "" },
    ],
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "Modern magazine design with breaking news banner, featured grid, and category sections",
    thumbnail: "/templates/magazine-thumb.png",
    homeComponent: "magazine",
    detailComponent: "magazine",
    configFields: [
      { key: "breakingNewsText", label: "Breaking News Text", type: "text", placeholder: "Latest breaking story", defaultValue: "" },
      { key: "headerAccentColor", label: "Header Accent Color", type: "color", defaultValue: "#dd3333" },
      { key: "showFeaturedSection", label: "Show Featured Grid", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "featuredCount", label: "Featured Posts Count", type: "select", defaultValue: "3", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }] },
    ],
  },
  {
    id: "newsy",
    name: "Newsy",
    description: "Playful news template with emoji-based categories, featured cards, and card grid layouts",
    thumbnail: "/templates/newsy-thumb.png",
    homeComponent: "newsy",
    detailComponent: "newsy",
    configFields: [
      { key: "primaryColor", label: "Primary Accent Color", type: "color", defaultValue: "#4a90e2" },
      { key: "secondaryColor", label: "Secondary Accent Color", type: "color", defaultValue: "#ff6b6b" },
      { key: "showFeaturedGrid", label: "Show Featured Grid", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "categorySections", label: "Category Sections to Show", type: "select", defaultValue: "3", options: [{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }] },
    ],
  },
  {
    id: "hotnewsy",
    name: "Hot Newsy",
    description: "Traditional news site with bold red header, featured grid, and sidebar layout",
    thumbnail: "/templates/hotnewsy-thumb.png",
    homeComponent: "hotnewsy",
    detailComponent: "hotnewsy",
    configFields: [
      { key: "headerColor", label: "Header Accent Color", type: "color", defaultValue: "#e63946" },
      { key: "tagColor", label: "Category Tag Color", type: "color", defaultValue: "#4caf50" },
      { key: "showFeaturedGrid", label: "Show Featured Grid", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "sidebarEnabled", label: "Enable Sidebar", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  },
  {
    id: "hotmagazine",
    name: "Hot Magazine",
    description: "Hot pink magazine design with 4-card featured grid, trending section, and sidebar",
    thumbnail: "/templates/hotmagazine-thumb.png",
    homeComponent: "hotmagazine",
    detailComponent: "hotmagazine",
    configFields: [
      { key: "accentColor", label: "Primary Accent Color", type: "color", defaultValue: "#e63946" },
      { key: "showFeaturedGrid", label: "Show Featured Grid", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "showTrending", label: "Show Trending Section", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "sidebarEnabled", label: "Enable Sidebar", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  },
  {
    id: "classicmagazine",
    name: "Classic Magazine",
    description: "Clean, minimalist magazine design with dark navigation and featured grid",
    thumbnail: "/templates/classicmagazine-thumb.png",
    homeComponent: "classicmagazine",
    detailComponent: "classicmagazine",
    configFields: [
      { key: "accentColor", label: "Accent Link Color", type: "color", defaultValue: "#0066cc" },
      { key: "showFeaturedGrid", label: "Show Featured Grid", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "showTopStories", label: "Show Top Stories Section", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "sidebarEnabled", label: "Enable Sidebar", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  },
  {
    id: "gamerworld",
    name: "Gamer World",
    description: "Dark gaming aesthetic with red and gold accents, featured cards with glow effects, and gaming-styled typography",
    thumbnail: "/templates/gamerworld-thumb.png",
    homeComponent: "gamerworld",
    detailComponent: "gamerworld",
    configFields: [
      { key: "primaryColor", label: "Primary Accent Color", type: "color", defaultValue: "#c41e3a" },
      { key: "secondaryColor", label: "Secondary Accent Color", type: "color", defaultValue: "#d4af37" },
      { key: "showFeaturedGrid", label: "Show Featured Grid", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "showTrending", label: "Show Trending Sidebar", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  },
  {
    id: "pennnews",
    name: "Penn News",
    description: "Professional news portal with blue header, colorful category buttons, featured hero, and 3-column news grid",
    thumbnail: "/templates/pennnews-thumb.png",
    homeComponent: "pennnews",
    detailComponent: "pennnews",
    configFields: [
      { key: "headerColor", label: "Header Color", type: "color", defaultValue: "#1a3a8f" },
      { key: "accentColor", label: "Accent Color", type: "color", defaultValue: "#4a90e2" },
      { key: "showFeaturedHero", label: "Show Featured Hero", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "showCategoryButtons", label: "Show Category Buttons", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    description: "Modern lifestyle blog with hero section, masonry grid, featured cards, and clean minimal design",
    thumbnail: "/templates/lifestyle-thumb.png",
    homeComponent: "lifestyle",
    detailComponent: "lifestyle",
    configFields: [
      { key: "accentColor", label: "Accent Color", type: "color", defaultValue: "#0066cc" },
      { key: "showHeroSection", label: "Show Hero Section", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "showFeaturedSmall", label: "Show Featured Small Cards", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "showPopular", label: "Show Popular Widget", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
  },
];

export function getTemplate(templateId: string): TemplateDefinition {
  return templateRegistry.find((t) => t.id === templateId) || templateRegistry[0];
}
