import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/db";
import { themePresets } from "@/lib/themes";

export const metadata = { title: "Theme catalog", robots: { index: false, follow: false } };

export default async function ThemesPage() {
  await requireAdmin();
  const site = await getSite();
  const families = [...new Set(themePresets.map((preset) => preset.family))];

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><span>Theme catalog</span></nav><h1>36 directions.<br /><em>One system.</em></h1><p>Shared templates and design tokens; no theme contains executable markup or styles.</p></div><span className="prototype-badge">{themePresets.length} definitions</span></div>
      <div className="prototype-callout"><strong>Design status: draft</strong><span>These are typed catalog definitions and visual previews, not 36 production-approved designs. Production assignment remains blocked pending per-preset visual, accessibility, responsive, and SEO validation plus design owner sign-off.</span></div>
      {families.map((family) => (
        <section className="theme-family" key={family}>
          <div className="admin-panel-heading"><div><p className="eyebrow">Preset family</p><h2>{family}</h2></div><span className="admin-inline-note">6 shared compositions</span></div>
          <div className="theme-grid">
            {themePresets.filter((preset) => preset.family === family).map((preset, index) => {
              const layoutLabels: Record<string, string> = { "lead-grid": "Featured hero + 3-col grid", "classic-columns": "2-column wide cards", "topic-hub": "4-column dense grid", "feature": "Single-column editorial", "briefs": "3-column compact briefs", "stream": "Timeline feed" };
              return (
                <article className={`theme-preview theme-${preset.accent}`} data-layout={preset.layout} key={preset.id}>
                  <div className="theme-preview-bar"><span>SIGNAL / RESEARCH</span><span>{String(index + 1).padStart(2, "0")}</span></div>
                  <div className="theme-preview-content"><span className="theme-preview-label">{preset.layout.replace(/-/g, " ")}</span><strong>{preset.name}</strong><div className="theme-preview-wireframe" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div></div>
                  <div className="theme-preview-layout-hint">{layoutLabels[preset.layout] ?? preset.layout}</div>
                  <div className="theme-preview-footer"><code>{preset.id}</code><StatusPill status={preset.id === site.themeId ? "selected" : preset.status} /></div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </AdminShell>
  );
}
