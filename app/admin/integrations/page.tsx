import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Integrations", robots: { index: false, follow: false } };

const integrationStatuses = [
  { name: "Email delivery", boundary: "Transactional verification and newsletter provider", status: "not configured" },
  { name: "Object storage", boundary: "Private PDF and media assets", status: "not configured" },
  { name: "WordPress", boundary: "Staging publisher and migration adapter", status: "not configured" },
  { name: "Analytics", boundary: "Per-site privacy-approved reporting", status: "not configured" },
  { name: "Billing", boundary: "Out of selected scope; no payment provider", status: "disabled" },
];

export default async function IntegrationsPage() {
  await requireAdmin();
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const providerKey = process.env.AI_API_KEY
    || (provider === "openai" ? process.env.OPENAI_API_KEY : undefined)
    || (provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : undefined)
    || (provider === "google" ? process.env.GOOGLE_AI_API_KEY : undefined);
  const aiConfigured = !!(provider && providerKey);
  const integrationItems = [
    {
      name: "AI generation",
      boundary: aiConfigured ? `Server-configured provider adapter: ${provider}` : "OpenAI, Anthropic, or Google Gemini adapter; credentials are server-side environment variables",
      status: aiConfigured ? "configured" : "not configured",
      note: aiConfigured ? `Provider "${provider}" is active. API key set via environment variable.` : "Set AI_PROVIDER and AI_API_KEY environment variables to enable.",
    },
    ...integrationStatuses.map((item) => ({ ...item, note: "Not connected in this prototype." })),
  ];
  return (
    <AdminShell>
      <div className="admin-page-heading"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><span>Integrations</span></nav><h1>Connections,<br /><em>not assumptions.</em></h1><p>{aiConfigured ? "AI generation is configured. Other providers remain disconnected." : "No external provider is connected from this prototype."}</p></div><span className="prototype-badge">{aiConfigured ? "1 active" : "All side effects off"}</span></div>
      <div className="integration-list">
        {integrationItems.map((integration) => (
          <article className="integration-card" key={integration.name}>
            <span className="integration-symbol" aria-hidden="true">↗</span>
            <div><h2>{integration.name}</h2><p>{integration.boundary}</p></div>
            <StatusPill status={integration.status} />
            <span className="admin-inline-note">{integration.note}</span>
          </article>
        ))}
      </div>
      <div className="prototype-callout"><strong>AI data handling</strong><span>When enabled, extracted text from uploaded PDFs is sent to the selected AI provider. Configure only a provider whose data-processing terms are approved for those documents. API keys stay in server environment variables; OCR, malware scanning, production secret management, and independent fact verification are not implemented.</span></div>
    </AdminShell>
  );
}
