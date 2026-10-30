# Audit implementation plan

## Delivered in this slice

- Extend each site with branding, publisher identity, contact details, social-ready configuration, legal policy text, and an explicit indexing flag.
- Add site-scoped public contact and legal pages.
- Add site-scoped sitemap, RSS feed, and `llms.txt` endpoints.
- Keep unknown hosts fail-closed and keep prototype robots/indexing safety unchanged.
- Add a domain management hub and separate downloadable-PDF asset path; private source PDFs remain admin-only.
- Add public lead form and protected verification/download routes that refuse to create leads or claim success without an approved email adapter.

## Download workflow contract

- `downloadablePdfAsset` is separate from `sourceDocumentAsset`; source PDFs are never reader downloads.
- Admins upload the reader PDF from the content editor; local prototype files remain private.
- Published articles render a lead form only when an approved reader PDF exists.
- Requests require privacy acknowledgement; marketing consent is optional and stored separately.
- Verification tokens are random, hashed at rest, expiry-bound, site/article-bound through the lead record, and invalidated when a new request is made.
- Email delivery is configured per domain: provider, API URL, sender identity, reply-to, and a secret reference. The secret reference resolves to a server-side environment/secret-manager value; raw tokens are not stored in the site document. Missing or failing delivery returns an explicit error and does not claim success.
- Domain launch settings now include explicit email/privacy/terms approvals, download enablement, retention, verification expiry, rate-limit, and per-lead download limits. The admin launch-readiness page blocks until external production infrastructure is configured.
- The final PDF route requires the same site, published article, verified lead, accepted download consent, and private asset.

## Remaining phases

1. Secure foundation: production identity provider, MFA enforcement, site authorization, trusted proxy policy, secret management, distributed rate limits, durable audit, backups, and restore drills.
2. Editorial platform: authors, navigation, rich content blocks, media processing, redirects, revisions/diffs, staged preview, and accessibility validation.
3. AI safety: approved provider/data terms, prompt versions, budgets, durable jobs, prompt-injection controls, independent citation/fact checks, evaluation corpus, monitoring, and role-separated review.
4. Publishing operations: durable queue, retries, reconciliation, rollback, destination adapters, cache invalidation, per-site locks, and incident alerts.
5. SEO/GEO/AEO: organization/person schema, breadcrumbs, hreflang, structured-data validation, SEO linting, entity/source mapping, answer evaluations, freshness, analytics, and search-console integrations.
6. Launch readiness: legal approval, domain/TLS verification, privacy/consent review, load testing, disaster recovery, migration rehearsal, security review, and release authorization.

The prototype must remain noindex and draft-only until the applicable owner approvals and production gates are evidenced.
