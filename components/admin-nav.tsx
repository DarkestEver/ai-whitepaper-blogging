"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: "◉", exact: true },
  { href: "/admin/sources", label: "PDF library", icon: "⬒", exact: false },
  { href: "/admin/leads", label: "Leads & downloads", icon: "↧", exact: false },
  { href: "/admin/content", label: "Content", icon: "☰", exact: false },
  { href: "/admin/sites", label: "Sites", icon: "⚙", exact: false },
  { href: "/admin/sites/readiness", label: "Launch readiness", icon: "✓", exact: false },
  { href: "/admin/users", label: "Users", icon: "👤", exact: false },
  { href: "/admin/themes", label: "Theme catalog", icon: "◧", exact: false },
  { href: "/admin/integrations", label: "Integrations", icon: "⇄", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      {adminLinks.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
          >
            <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
