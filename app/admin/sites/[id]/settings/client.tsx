"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/lib/toast-utils";
import { HtmlEditor } from "@/components/html-editor";

function FormHtmlEditor({ name, defaultValue, placeholder, minHeight = 280 }: { name: string; defaultValue: string; placeholder?: string; minHeight?: number }) {
  const [val, setVal] = useState(defaultValue || "");
  return (
    <>
      <input type="hidden" name={name} value={val} />
      <HtmlEditor value={val} onChange={setVal} minHeight={minHeight} placeholder={placeholder} />
    </>
  );
}

interface SiteSettingsPageClientProps {
  site: SiteRecord;
  activeTab: string;
}

const TABS = [
  { id: "basic", label: "Basic Info", icon: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
  { id: "identity", label: "Identity", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
  { id: "email", label: "Email", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" },
  { id: "legal", label: "Legal", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { id: "theme", label: "Theme", icon: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" },
];

export function SiteSettingsPageClient({ site, activeTab }: SiteSettingsPageClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/site", { method: "POST", body: fd, redirect: "manual" });
      if (res.ok || res.status === 0 || res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
        showToast.siteSaved();
        router.refresh();
      } else {
        showToast.saveFailed();
      }
    } catch {
      showToast.saveFailed();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin">Control room</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/sites">Site registry</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/admin/sites/${site.id}`}>{site.name}</Link>
        <span aria-hidden="true">/</span>
        <span>Settings</span>
      </nav>

      <div className="detail-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Settings</h1>
          <p className="text-muted" style={{ margin: "4px 0 0" }}>Configure {site.name}</p>
        </div>
        <Link href={`/admin/sites/${site.id}`} className="btn">Back to detail</Link>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(`/admin/sites/${site.id}/settings?tab=${tab.id}`)}
            className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="settings-panel">
        <form onSubmit={handleSubmit} className="settings-form">
          <input name="siteId" type="hidden" value={site.id} />
          <input name="slug" type="hidden" value={site.slug} />
          {/* Always submit all fields so partial-tab saves don't send nulls */}
          {activeTab !== "basic" && (
            <>
              <input type="hidden" name="name" value={site.name} />
              <input type="hidden" name="description" value={site.description} />
              <input type="hidden" name="publicUrl" value={site.publicUrl} />
            </>
          )}
          {activeTab !== "identity" && (
            <>
              <input type="hidden" name="tagline" value={site.tagline} />
              <input type="hidden" name="legalName" value={site.legalName} />
              <input type="hidden" name="contactEmail" value={site.contactEmail} />
              <input type="hidden" name="contactPhone" value={site.contactPhone} />
              <input type="hidden" name="contactAddress" value={site.contactAddress} />
              <input type="hidden" name="logoUrl" value={site.logoUrl} />
              <input type="hidden" name="faviconUrl" value={site.faviconUrl} />
              <input type="hidden" name="brandColor" value={site.brandColor || "#0066cc"} />
              <input type="hidden" name="accentColor" value={site.accentColor || "#0066cc"} />
              {site.indexingEnabled && <input type="hidden" name="indexingEnabled" value="on" />}
            </>
          )}
          {activeTab !== "email" && (
            <>
              {site.emailEnabled && <input type="hidden" name="emailEnabled" value="on" />}
              <input type="hidden" name="emailProvider" value={site.emailProvider} />
              <input type="hidden" name="emailApiUrl" value={site.emailApiUrl} />
              <input type="hidden" name="emailSecretRef" value={site.emailSecretRef} />
              <input type="hidden" name="emailFromEmail" value={site.emailFromEmail} />
              <input type="hidden" name="emailFromName" value={site.emailFromName} />
              <input type="hidden" name="emailReplyTo" value={site.emailReplyTo} />
              {site.emailApproved && <input type="hidden" name="emailApproved" value="on" />}
              {site.privacyApproved && <input type="hidden" name="privacyApproved" value="on" />}
              {site.termsApproved && <input type="hidden" name="termsApproved" value="on" />}
              {site.downloadEnabled && <input type="hidden" name="downloadEnabled" value="on" />}
              <input type="hidden" name="leadRetentionDays" value={site.leadRetentionDays} />
              <input type="hidden" name="verificationTokenMinutes" value={site.verificationTokenMinutes} />
              <input type="hidden" name="downloadRateLimitPerHour" value={site.downloadRateLimitPerHour} />
              <input type="hidden" name="maxDownloadsPerLead" value={site.maxDownloadsPerLead} />
            </>
          )}
          {activeTab !== "legal" && (
            <>
              <input type="hidden" name="privacyPolicy" value={site.privacyPolicy} />
              <input type="hidden" name="termsOfUse" value={site.termsOfUse} />
              <input type="hidden" name="cookiePolicy" value={site.cookiePolicy} />
              <input type="hidden" name="disclaimer" value={site.disclaimer} />
              <input type="hidden" name="editorialPolicy" value={site.editorialPolicy} />
              <input type="hidden" name="accessibilityStatement" value={site.accessibilityStatement} />
            </>
          )}
          {activeTab !== "theme" && (
            <>
              <input type="hidden" name="themeId" value={site.themeId} />
              <input type="hidden" name="templateId" value={site.templateId || "default"} />
              <TemplateConfigHiddenInputs config={site.templateConfig || {}} />
            </>
          )}

          {activeTab === "basic" && (
            <>
              <div className="form-section-title">
                <h2>Basic Information</h2>
                <p>Core details about your site.</p>
              </div>
              <div className="form-grid-modern">
                <div className="form-field">
                  <label htmlFor="name">Site name</label>
                  <input id="name" defaultValue={site.name} maxLength={80} name="name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="slug-display">Slug</label>
                  <input id="slug-display" defaultValue={site.slug} disabled className="input-disabled" />
                  <span className="form-hint">Cannot be changed after creation</span>
                </div>
                <div className="form-field span-2">
                  <label htmlFor="publicUrl">Public base URL</label>
                  <input id="publicUrl" defaultValue={site.publicUrl} maxLength={2048} name="publicUrl" placeholder="https://www.example.com" type="url" />
                  <span className="form-hint">HTTPS origin only. DNS mapping handled by domain owner.</span>
                </div>
                <div className="form-field span-2">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" defaultValue={site.description} maxLength={300} name="description" required rows={3} />
                </div>
              </div>
            </>
          )}

          {activeTab === "identity" && (
            <>
              <div className="form-section-title">
                <h2>Identity & Contact</h2>
                <p>How your site is presented to readers and publishers.</p>
              </div>
              <div className="form-grid-modern">
                <div className="form-field span-2">
                  <label htmlFor="tagline">Tagline</label>
                  <input id="tagline" defaultValue={site.tagline} maxLength={160} name="tagline" />
                </div>
                <div className="form-field">
                  <label htmlFor="legalName">Legal / publisher name</label>
                  <input id="legalName" defaultValue={site.legalName} maxLength={160} name="legalName" />
                </div>
                <div className="form-field">
                  <label htmlFor="contactEmail">Contact email</label>
                  <input id="contactEmail" defaultValue={site.contactEmail} name="contactEmail" type="email" />
                </div>
                <div className="form-field">
                  <label htmlFor="contactPhone">Contact phone</label>
                  <input id="contactPhone" defaultValue={site.contactPhone} maxLength={40} name="contactPhone" />
                </div>
                <div className="form-field">
                  <label htmlFor="contactAddress">Contact address</label>
                  <textarea id="contactAddress" defaultValue={site.contactAddress} maxLength={500} name="contactAddress" rows={2} />
                </div>

                <div className="form-divider span-2" />

                <div className="form-field">
                  <label htmlFor="logoUrl">Logo URL</label>
                  <input id="logoUrl" defaultValue={site.logoUrl} maxLength={2048} name="logoUrl" type="url" />
                </div>
                <div className="form-field">
                  <label htmlFor="faviconUrl">Favicon URL</label>
                  <input id="faviconUrl" defaultValue={site.faviconUrl} maxLength={2048} name="faviconUrl" type="url" />
                </div>
                <div className="form-field">
                  <label htmlFor="brandColor">Brand color</label>
                  <div className="color-input-wrap">
                    <input id="brandColor" defaultValue={site.brandColor || "#0066cc"} name="brandColor" type="color" className="color-picker" />
                    <input defaultValue={site.brandColor} name="brandColorHex" pattern="#[0-9a-fA-F]{6}" placeholder="#0066cc" className="color-text" />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="accentColor">Accent color</label>
                  <div className="color-input-wrap">
                    <input id="accentColor" defaultValue={site.accentColor || "#0066cc"} name="accentColor" type="color" className="color-picker" />
                    <input defaultValue={site.accentColor} name="accentColorHex" pattern="#[0-9a-fA-F]{6}" placeholder="#0066cc" className="color-text" />
                  </div>
                </div>

                <div className="form-field span-2">
                  <label className="toggle-label">
                    <input defaultChecked={site.indexingEnabled} name="indexingEnabled" type="checkbox" className="toggle-input" />
                    <span className="toggle-switch" />
                    <span>Enable indexing, sitemap, RSS, and llms.txt</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === "email" && (
            <>
              <div className="form-section-title">
                <h2>Email & Reader Workflows</h2>
                <p>Email provider configuration and reader download settings.</p>
              </div>
              <div className="form-grid-modern">
                <div className="form-field span-2">
                  <label className="toggle-label">
                    <input defaultChecked={site.emailEnabled} name="emailEnabled" type="checkbox" className="toggle-input" />
                    <span className="toggle-switch" />
                    <span>Enable email delivery for this domain</span>
                  </label>
                </div>
                <div className="form-field">
                  <label htmlFor="emailProvider">Email provider</label>
                  <input id="emailProvider" defaultValue={site.emailProvider} maxLength={60} name="emailProvider" placeholder="sendgrid, ses, mailgun" />
                </div>
                <div className="form-field">
                  <label htmlFor="emailApiUrl">Email API URL</label>
                  <input id="emailApiUrl" defaultValue={site.emailApiUrl} maxLength={2048} name="emailApiUrl" type="url" />
                </div>
                <div className="form-field">
                  <label htmlFor="emailSecretRef">Email secret reference</label>
                  <input id="emailSecretRef" defaultValue={site.emailSecretRef} maxLength={100} name="emailSecretRef" placeholder="SITE_ALPHA_EMAIL_TOKEN" />
                </div>
                <div className="form-field">
                  <label htmlFor="emailFromEmail">From email</label>
                  <input id="emailFromEmail" defaultValue={site.emailFromEmail} name="emailFromEmail" type="email" />
                </div>
                <div className="form-field">
                  <label htmlFor="emailFromName">From name</label>
                  <input id="emailFromName" defaultValue={site.emailFromName} maxLength={120} name="emailFromName" />
                </div>
                <div className="form-field">
                  <label htmlFor="emailReplyTo">Reply-to email</label>
                  <input id="emailReplyTo" defaultValue={site.emailReplyTo} name="emailReplyTo" type="email" />
                </div>

                <div className="form-divider span-2" />

                <div className="form-field span-2" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label className="toggle-label">
                    <input defaultChecked={site.emailApproved} name="emailApproved" type="checkbox" className="toggle-input" />
                    <span className="toggle-switch" />
                    <span>Email provider contract approved</span>
                  </label>
                  <label className="toggle-label">
                    <input defaultChecked={site.privacyApproved} name="privacyApproved" type="checkbox" className="toggle-input" />
                    <span className="toggle-switch" />
                    <span>Privacy notice approved</span>
                  </label>
                  <label className="toggle-label">
                    <input defaultChecked={site.termsApproved} name="termsApproved" type="checkbox" className="toggle-input" />
                    <span className="toggle-switch" />
                    <span>Terms approved</span>
                  </label>
                  <label className="toggle-label">
                    <input defaultChecked={site.downloadEnabled} name="downloadEnabled" type="checkbox" className="toggle-input" />
                    <span className="toggle-switch" />
                    <span>Enable public lead downloads</span>
                  </label>
                </div>

                <div className="form-divider span-2" />

                <div className="form-field">
                  <label htmlFor="leadRetentionDays">Lead retention (days)</label>
                  <input id="leadRetentionDays" defaultValue={site.leadRetentionDays} min={1} max={3650} name="leadRetentionDays" type="number" />
                </div>
                <div className="form-field">
                  <label htmlFor="verificationTokenMinutes">Verification expiry (min)</label>
                  <input id="verificationTokenMinutes" defaultValue={site.verificationTokenMinutes} min={5} max={1440} name="verificationTokenMinutes" type="number" />
                </div>
                <div className="form-field">
                  <label htmlFor="downloadRateLimitPerHour">Requests per IP/hour</label>
                  <input id="downloadRateLimitPerHour" defaultValue={site.downloadRateLimitPerHour} min={1} max={10000} name="downloadRateLimitPerHour" type="number" />
                </div>
                <div className="form-field">
                  <label htmlFor="maxDownloadsPerLead">Max downloads per lead</label>
                  <input id="maxDownloadsPerLead" defaultValue={site.maxDownloadsPerLead} min={1} max={100} name="maxDownloadsPerLead" type="number" />
                </div>
              </div>
            </>
          )}

          {activeTab === "legal" && (
            <>
              <div className="form-section-title">
                <h2>Legal Documents</h2>
                <p>Privacy policy, terms, and other legal documents. All fields support HTML.</p>
              </div>
              <div className="form-grid-modern">
                <div className="form-field span-2">
                  <label>Privacy policy</label>
                  <FormHtmlEditor name="privacyPolicy" defaultValue={site.privacyPolicy} placeholder="Enter your privacy policy..." />
                </div>
                <div className="form-field span-2">
                  <label>Terms of use</label>
                  <FormHtmlEditor name="termsOfUse" defaultValue={site.termsOfUse} placeholder="Enter your terms of use..." />
                </div>
                <div className="form-field span-2">
                  <label>Cookie policy</label>
                  <FormHtmlEditor name="cookiePolicy" defaultValue={site.cookiePolicy} placeholder="Enter your cookie policy..." />
                </div>
                <div className="form-field span-2">
                  <label>Disclaimer</label>
                  <FormHtmlEditor name="disclaimer" defaultValue={site.disclaimer} placeholder="Enter any disclaimer text..." />
                </div>
                <div className="form-field span-2">
                  <label>Editorial policy</label>
                  <FormHtmlEditor name="editorialPolicy" defaultValue={site.editorialPolicy} placeholder="Enter your editorial policy..." />
                </div>
                <div className="form-field span-2">
                  <label>Accessibility statement</label>
                  <FormHtmlEditor name="accessibilityStatement" defaultValue={site.accessibilityStatement} placeholder="Enter your accessibility statement..." />
                </div>
              </div>
            </>
          )}

          {activeTab === "theme" && (
            <>
              <div className="form-section-title">
                <h2>Theme & Appearance</h2>
                <p>Design preset and template for this site.</p>
              </div>
              <div className="form-grid-modern">
                <div className="form-field span-2">
                  <label htmlFor="templateId">Template</label>
                  <TemplateSelect defaultValue={site.templateId || "default"} />
                  <span className="form-hint">Controls the overall layout structure of your public site (like WordPress themes).</span>
                </div>
                <div className="form-field span-2">
                  <label htmlFor="themeId">Design preset</label>
                  <ThemeSelect defaultValue={site.themeId} />
                  <span className="form-hint">Controls the color scheme and typography style.</span>
                </div>
              </div>

              <TemplateConfigFields templateId={site.templateId || "default"} config={site.templateConfig || {}} />
            </>
          )}

          <div className="form-actions-bar">
            <Link href={`/admin/sites/${site.id}`} className="btn">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ThemeSelect({ defaultValue }: { defaultValue: string }) {
  const { themePresets } = require("@/lib/themes");
  return (
    <select defaultValue={defaultValue} name="themeId" required>
      {themePresets.map((preset: any) => (
        <option key={preset.id} value={preset.id}>
          {preset.family} — {preset.name} ({preset.status})
        </option>
      ))}
    </select>
  );
}

function TemplateSelect({ defaultValue }: { defaultValue: string }) {
  const { templateRegistry } = require("@/templates/registry");
  return (
    <select defaultValue={defaultValue} name="templateId" required>
      {templateRegistry.map((tpl: any) => (
        <option key={tpl.id} value={tpl.id}>
          {tpl.name} — {tpl.description}
        </option>
      ))}
    </select>
  );
}

function TemplateConfigFields({ templateId, config }: { templateId: string; config: Record<string, string> }) {
  const { getTemplate } = require("@/templates/registry");
  const template = getTemplate(templateId);
  if (!template.configFields || template.configFields.length === 0) return null;
  return (
    <>
      <div className="form-section-title" style={{ marginTop: "24px" }}>
        <h2>{template.name} Settings</h2>
        <p>Configure template-specific options for {template.name}.</p>
      </div>
      <div className="form-grid-modern">
        {template.configFields.map((field: any) => (
          <div className="form-field span-2" key={field.key}>
            <label htmlFor={`tc_${field.key}`}>{field.label}</label>
            {field.type === "image" ? (
              <TemplateImageUpload fieldKey={field.key} currentValue={config[field.key] || ""} placeholder={field.placeholder} />
            ) : field.type === "textarea" ? (
              <textarea id={`tc_${field.key}`} name={`tc_${field.key}`} defaultValue={config[field.key] || field.defaultValue || ""} placeholder={field.placeholder} rows={3} />
            ) : field.type === "select" ? (
              <select id={`tc_${field.key}`} name={`tc_${field.key}`} defaultValue={config[field.key] || field.defaultValue || ""}>
                {field.options?.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input id={`tc_${field.key}`} name={`tc_${field.key}`} type={field.type} defaultValue={config[field.key] || field.defaultValue || ""} placeholder={field.placeholder} />
            )}
            {field.help && <span className="form-hint">{field.help}</span>}
          </div>
        ))}
      </div>
    </>
  );
}

function TemplateImageUpload({ fieldKey, currentValue, placeholder }: { fieldKey: string; currentValue: string; placeholder?: string }) {
  const [url, setUrl] = useState(currentValue);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={`tc_${fieldKey}`} value={url} />
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ flex: 1 }} />
        {uploading && <span style={{ fontSize: "13px", color: "#666" }}>Uploading...</span>}
      </div>
      {url && (
        <div style={{ marginTop: "8px" }}>
          <img src={url} alt="Preview" style={{ maxWidth: "300px", maxHeight: "120px", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
          <button type="button" onClick={() => setUrl("")} style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "#e12727", background: "none", border: "none", cursor: "pointer" }}>Remove image</button>
        </div>
      )}
      {!url && <input type="text" placeholder={placeholder || "Or paste image URL"} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginTop: "4px" }} />}
    </div>
  );
}

function TemplateConfigHiddenInputs({ config }: { config: Record<string, string> }) {
  return (
    <>
      {Object.entries(config).map(([key, value]) => (
        <input key={key} type="hidden" name={`tc_${key}`} value={value} />
      ))}
    </>
  );
}
