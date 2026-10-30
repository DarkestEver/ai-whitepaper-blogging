import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";

type LoginPageProps = { searchParams: Promise<{ error?: string }> };

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const params = await searchParams;
  const error = params.error === "configuration"
    ? "Admin authentication is not configured. Follow the setup instructions in the README."
    : params.error === "denied"
      ? "Sign-in failed. Check the password and try again."
      : null;

  return (
    <main className="login-page">
      <a className="skip-link" href="#login-form">Skip to sign in</a>
      <section className="login-card">
        <a className="brand" href="/">
          <span className="brand-mark">S</span>
          <span><strong>Signal Library</strong><small>Admin workspace</small></span>
        </a>
        <p className="eyebrow">Restricted workspace</p>
        <h1>Welcome <em>back.</em></h1>
        <p className="login-copy">Sign in to manage the local demonstration catalog and site configuration.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form id="login-form" className="admin-form" action="/api/admin/login" method="post">
          <label htmlFor="username">Username</label>
          <input autoComplete="username" id="username" name="username" required type="text" placeholder="Enter your username" />
          <label htmlFor="admin-password">Password (14+ characters)</label>
          <input autoComplete="current-password" id="admin-password" name="password" required type="password" placeholder="Enter your password" minLength={14} />
          <button className="button button-dark" type="submit">Sign in <span aria-hidden="true">↗</span></button>
        </form>
        <p className="prototype-notice">Admin access requires an explicitly configured password hash and session secret. There is no default login.</p>
        <a className="text-link" href="/">Return to public prototype <span aria-hidden="true">←</span></a>
      </section>
    </main>
  );
}
