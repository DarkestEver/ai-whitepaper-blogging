"use client";

import { useState } from "react";

export function DownloadForm({ paperId, title }: { paperId: number; title: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="admin-form" action="/api/download-request" method="post" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/download-request", { method: "POST", body: new FormData(event.currentTarget), headers: { Accept: "application/json" } });
    const body = await response.json().catch(() => ({}));
    setMessage(body.message || body.error || "Request could not be completed."); setBusy(false);
  }}>
    <input type="hidden" name="paperId" value={paperId} />
    <p>Request the approved PDF for <strong>{title}</strong>.</p>
    <div className="form-grid"><label>First name<input name="firstName" required maxLength={80} autoComplete="given-name" /></label><label>Last name<input name="lastName" required maxLength={80} autoComplete="family-name" /></label><label className="form-wide">Work email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>Company<input name="company" maxLength={160} autoComplete="organization" /></label></div>
    <label className="checkbox-label"><input name="privacyAccepted" type="checkbox" value="yes" required /> I acknowledge the <a href="/privacy" target="_blank">privacy policy</a>.</label>
    <label className="checkbox-label"><input name="marketingAccepted" type="checkbox" value="yes" /> Send me occasional updates. This is optional.</label>
    <button className="button button-dark" disabled={busy} type="submit">{busy ? "Requesting…" : "Request PDF"}</button>
    {message && <p className="form-error" role="status">{message}</p>}
  </form>;
}
