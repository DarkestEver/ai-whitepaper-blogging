import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { isAdminAuthenticated } from "@/lib/auth";
import { listSites } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Create user", robots: { index: false, follow: false } };

export default async function NewUserPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const sites = await listSites();

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div>
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Link href="/admin">Control room</Link>
            <span aria-hidden="true">/</span>
            <Link href="/admin/users">Users</Link>
            <span aria-hidden="true">/</span>
            <span>New</span>
          </nav>
          <h1>
            Create <em>user account.</em>
          </h1>
          <p>Set username, password, and initial domain role assignments.</p>
        </div>
        <Link className="admin-text-link" href="/admin/users">
          ← Back to users
        </Link>
      </div>

      <form action="/api/admin/users" method="post" className="admin-form admin-editor-form user-create-form">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">Account</p>
              <h2>Username and credentials</h2>
            </div>
          </div>

          <label>
            Username (unique)
            <input type="text" name="username" required minLength={3} maxLength={255} />
          </label>

          <label>
            Password (min 8 characters)
            <input type="password" name="password" required minLength={8} maxLength={1024} autoComplete="new-password" />
          </label>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">Permissions</p>
              <h2>Domain role assignments</h2>
            </div>
          </div>

          <p className="admin-body-copy">Assign this user to one or more domains with a specific role.</p>

          {sites.length === 0 ? (
            <p className="admin-inline-note">No sites available. Create a site first.</p>
          ) : (
            <fieldset className="admin-role-matrix">
              <legend>Domain access matrix</legend>
              <div className="admin-role-header"><span>Domain</span><span>Access level</span></div>
              {sites.map((site) => (
                <div key={site.id} className="admin-role-row">
                  <div className="admin-role-domain"><strong>{site.name}</strong><small>{site.publicUrl || "No public URL configured"}</small></div>
                  <div className="admin-role-options">
                    {[["none", "No access"], ["reviewer", "Reviewer"], ["editor", "Editor"], ["admin", "Admin"]].map(([value, label]) => <label key={value}><input type="radio" name={`role-${site.id}`} value={value} defaultChecked={value === "none"} /><span>{label}</span></label>)}
                  </div>
                </div>
              ))}
            </fieldset>
          )}

          <div className="form-actions">
            <button className="button button-dark" type="submit">
              Create user <span aria-hidden="true">+</span>
            </button>
          </div>
        </section>
      </form>
    </AdminShell>
  );
}
