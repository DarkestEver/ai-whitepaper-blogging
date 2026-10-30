"use client";

import { useState, useId } from "react";

interface SubscribeFormProps {
  variant?: "inline" | "box" | "footer";
  siteName?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function SubscribeForm({ variant = "box", siteName }: SubscribeFormProps) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState("");
  const emailId = useId();

  function validateEmail(value: string) {
    if (!value) { setEmailError(""); return; }
    setEmailError(isValidEmail(value) ? "" : "Enter a valid email address");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;
    if (!isValidEmail(email)) { setEmailError("Enter a valid email address"); return; }
    setBusy(true);
    setMessage("");
    setEmailError("");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setSuccess(true); setMessage(data.message || "Check your inbox to confirm your subscription."); }
      else { setMessage(data.error || "Something went wrong. Please try again."); }
    } catch { setMessage("Network error. Please try again."); }
    finally { setBusy(false); }
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className={`subscribe-form subscribe-${variant} sub-ok`} role="status">
        <svg className="sub-ok-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>
        <p className="sub-ok-title">You&apos;re subscribed!</p>
        <p className="sub-ok-text">{message}</p>
      </div>
    );
  }

  /* ── Inline ── */
  if (variant === "inline") {
    return (
      <form className="subscribe-form subscribe-inline" onSubmit={handleSubmit}>
        <label htmlFor={`${emailId}-i`} className="sr-only">Email</label>
        <input id={`${emailId}-i`} name="email" type="email" required maxLength={254} placeholder="Your email" autoComplete="email" />
        <button type="submit" disabled={busy}>{busy ? "..." : "Subscribe"}</button>
        {message && <p className="sub-msg" role="alert">{message}</p>}
      </form>
    );
  }

  /* ── Footer ── */
  if (variant === "footer") {
    return (
      <form className="subscribe-form subscribe-footer" onSubmit={handleSubmit}>
        <p className="subscribe-title">Stay updated</p>
        <div className="subscribe-row">
          <label htmlFor={`${emailId}-f`} className="sr-only">Email</label>
          <input id={`${emailId}-f`} name="email" type="email" required maxLength={254} placeholder="Your email" autoComplete="email" />
          <button type="submit" disabled={busy}>{busy ? "..." : "Subscribe"}</button>
        </div>
        {message && <p className="sub-msg" role="alert">{message}</p>}
      </form>
    );
  }

  /* ── Box (sidebar widget) ── */
  return (
    <form className="subscribe-form sub-widget" onSubmit={handleSubmit} noValidate>
      <h4 className="nm-widget-title">Newsletter</h4>

      <p className="sub-w-text">
        Get our best research and analysis delivered to your inbox every week.
      </p>

      <label htmlFor={emailId} className="sr-only">Email address</label>
      <input
        id={emailId}
        className={`sub-w-input${emailError ? " sub-w-input--err" : ""}`}
        name="email"
        type="email"
        required
        maxLength={254}
        placeholder="Your email address"
        autoComplete="email"
        aria-required="true"
        aria-invalid={emailError ? "true" : undefined}
        onBlur={(e) => validateEmail(e.target.value)}
        onChange={() => emailError && setEmailError("")}
      />
      {emailError && <p className="sub-w-err" role="alert">{emailError}</p>}

      <button type="submit" disabled={busy} className="sub-w-btn">
        {busy ? <><span className="sub-w-spin" aria-hidden="true" />Subscribing...</> : "Subscribe"}
      </button>

      <p className="sub-w-fine">
        No spam, ever. <a href="/privacy">Privacy&nbsp;policy</a>
      </p>

      {message && <p className="sub-w-alert" role="alert">{message}</p>}
    </form>
  );
}
