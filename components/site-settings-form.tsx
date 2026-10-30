"use client";

import { type SiteRecord } from "@/lib/db";
import { themePresets } from "@/lib/themes";
import { showToast } from "@/lib/toast-utils";
import { FormEvent, useState } from "react";

interface SiteSettingsFormProps {
  site: SiteRecord;
  onSuccess?: () => void;
}

export function SiteSettingsForm({ site, onSuccess }: SiteSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/api/admin/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast.saveFailed(error.message);
        return;
      }

      showToast.siteSaved();
      onSuccess?.();
    } catch (error) {
      showToast.saveFailed(error instanceof Error ? error.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form admin-editor-form admin-site-settings-form">
      <input name="siteId" type="hidden" value={site.id} />
      <div className="form-grid">
        <label>
          Site name
          <input defaultValue={site.name} maxLength={80} name="name" required />
        </label>
        <label>
          Site slug
          <input defaultValue={site.slug} disabled />
        </label>
        <input name="slug" type="hidden" value={site.slug} />
        <label className="form-wide">
          Public base URL
          <input
            autoComplete="url"
            defaultValue={site.publicUrl}
            inputMode="url"
            maxLength={2048}
            name="publicUrl"
            placeholder="https://www.example.com"
            type="url"
          />
          <small>Use the HTTPS origin only. DNS mapping is handled by the domain owner.</small>
        </label>
        <label className="form-wide">
          Description
          <textarea
            defaultValue={site.description}
            maxLength={300}
            name="description"
            required
            rows={3}
          />
        </label>

        <div className="settings-section-heading form-wide">
          <span>01</span>
          <div>
            <strong>Identity &amp; contact</strong>
            <small>How this site is presented to readers and publishers.</small>
          </div>
        </div>
        <label>
          Tagline
          <input defaultValue={site.tagline} maxLength={160} name="tagline" />
        </label>
        <label>
          Legal / publisher name
          <input defaultValue={site.legalName} maxLength={160} name="legalName" />
        </label>
        <label>
          Contact email
          <input defaultValue={site.contactEmail} name="contactEmail" type="email" />
        </label>
        <label>
          Contact phone
          <input defaultValue={site.contactPhone} maxLength={40} name="contactPhone" />
        </label>
        <label className="form-wide">
          Contact address
          <textarea defaultValue={site.contactAddress} maxLength={500} name="contactAddress" rows={2} />
        </label>
        <label>
          Logo URL
          <input defaultValue={site.logoUrl} maxLength={2048} name="logoUrl" type="url" />
        </label>
        <label>
          Favicon URL
          <input defaultValue={site.faviconUrl} maxLength={2048} name="faviconUrl" type="url" />
        </label>
        <label>
          Brand color
          <input defaultValue={site.brandColor} name="brandColor" pattern="#[0-9a-fA-F]{6}" />
        </label>
        <label>
          Accent color
          <input defaultValue={site.accentColor} name="accentColor" pattern="#[0-9a-fA-F]{6}" />
        </label>
        <label className="checkbox-label">
          <input defaultChecked={site.indexingEnabled} name="indexingEnabled" type="checkbox" /> Enable
          indexing, sitemap, RSS, and llms.txt (prototype remains noindex)
        </label>

        <div className="settings-section-heading form-wide">
          <span>02</span>
          <div>
            <strong>Email &amp; reader workflows</strong>
            <small>Configuration is disabled until provider and privacy approvals are recorded.</small>
          </div>
        </div>
        <label className="checkbox-label">
          <input defaultChecked={site.emailEnabled} name="emailEnabled" type="checkbox" /> Enable this
          domain's email delivery
        </label>
        <label>
          Email provider
          <input
            defaultValue={site.emailProvider}
            maxLength={60}
            name="emailProvider"
            placeholder="sendgrid, ses, mailgun"
          />
        </label>
        <label>
          Email API URL
          <input
            defaultValue={site.emailApiUrl}
            maxLength={2048}
            name="emailApiUrl"
            type="url"
          />
        </label>
        <label>
          Email secret reference
          <input
            defaultValue={site.emailSecretRef}
            maxLength={100}
            name="emailSecretRef"
            placeholder="SITE_ALPHA_EMAIL_TOKEN"
          />
        </label>
        <label>
          From email
          <input defaultValue={site.emailFromEmail} name="emailFromEmail" type="email" />
        </label>
        <label>
          From name
          <input defaultValue={site.emailFromName} maxLength={120} name="emailFromName" />
        </label>
        <label>
          Reply-to email
          <input defaultValue={site.emailReplyTo} name="emailReplyTo" type="email" />
        </label>
        <label className="checkbox-label">
          <input defaultChecked={site.emailApproved} name="emailApproved" type="checkbox" /> Email
          provider contract approved
        </label>
        <label className="checkbox-label">
          <input defaultChecked={site.privacyApproved} name="privacyApproved" type="checkbox" /> Privacy
          notice approved
        </label>
        <label className="checkbox-label">
          <input defaultChecked={site.termsApproved} name="termsApproved" type="checkbox" /> Terms
          approved
        </label>
        <label className="checkbox-label">
          <input defaultChecked={site.downloadEnabled} name="downloadEnabled" type="checkbox" /> Enable
          public lead downloads
        </label>
        <label>
          Lead retention days
          <input
            defaultValue={site.leadRetentionDays}
            min={1}
            max={3650}
            name="leadRetentionDays"
            type="number"
          />
        </label>
        <label>
          Verification expiry minutes
          <input
            defaultValue={site.verificationTokenMinutes}
            min={5}
            max={1440}
            name="verificationTokenMinutes"
            type="number"
          />
        </label>
        <label>
          Requests per IP/hour
          <input
            defaultValue={site.downloadRateLimitPerHour}
            min={1}
            max={10000}
            name="downloadRateLimitPerHour"
            type="number"
          />
        </label>
        <label>
          Max downloads per lead
          <input
            defaultValue={site.maxDownloadsPerLead}
            min={1}
            max={100}
            name="maxDownloadsPerLead"
            type="number"
          />
        </label>

        <div className="settings-section-heading form-wide">
          <span>03</span>
          <div>
            <strong>Legal &amp; trust content</strong>
            <small>These documents appear on the public site when configured.</small>
          </div>
        </div>
        <label className="form-wide">
          Privacy policy
          <textarea
            defaultValue={site.privacyPolicy}
            maxLength={20000}
            name="privacyPolicy"
            rows={5}
          />
        </label>
        <label className="form-wide">
          Terms of use
          <textarea
            defaultValue={site.termsOfUse}
            maxLength={20000}
            name="termsOfUse"
            rows={5}
          />
        </label>
        <label className="form-wide">
          Cookie policy
          <textarea
            defaultValue={site.cookiePolicy}
            maxLength={20000}
            name="cookiePolicy"
            rows={5}
          />
        </label>
        <label className="form-wide">
          Disclaimer
          <textarea
            defaultValue={site.disclaimer}
            maxLength={20000}
            name="disclaimer"
            rows={4}
          />
        </label>
        <label className="form-wide">
          Editorial policy
          <textarea
            defaultValue={site.editorialPolicy}
            maxLength={20000}
            name="editorialPolicy"
            rows={4}
          />
        </label>
        <label className="form-wide">
          Accessibility statement
          <textarea
            defaultValue={site.accessibilityStatement}
            maxLength={20000}
            name="accessibilityStatement"
            rows={4}
          />
        </label>
        <label className="form-wide">
          Site design preset
          <select defaultValue={site.themeId} name="themeId" required>
            {themePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.family} — {preset.name} ({preset.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="prototype-callout">
        <strong>Host-based site resolution</strong>
        <span>
          Requests are matched against registered hostnames; unregistered hosts fail closed. The domain
          owner maps DNS to this app. This prototype does not perform DNS/TLS configuration or production
          site isolation approval.
        </span>
      </div>

      <div className="form-actions">
        <span className="admin-inline-note">Local prototype site configuration.</span>
        <button className="button button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save site settings"} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}
