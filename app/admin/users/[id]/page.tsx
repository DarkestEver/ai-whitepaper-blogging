import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { isAdminAuthenticated } from "@/lib/auth";
import { listSites } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

type EditUserProps = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };
export const metadata = { title: "Edit user", robots: { index: false, follow: false } };

export default async function EditUserPage({ params, searchParams }: EditUserProps) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  await connectDatabase();
  const { id: rawId } = await params;
  const userId = Number(rawId);
  if (!Number.isSafeInteger(userId) || userId < 1) notFound();

  const user = await User.findOne({ numericId: userId });
  if (!user) notFound();

  const sites = await listSites();
  const query = await searchParams;

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div>
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Link href="/admin">Control room</Link>
            <span aria-hidden="true">/</span>
            <Link href="/admin/users">Users</Link>
            <span aria-hidden="true">/</span>
            <span>Edit</span>
          </nav>
          <h1>
            Edit <em>user account.</em>
          </h1>
          <p>Manage username, password, and domain role assignments.</p>
        </div>
      </div>
      {query.saved === "1" && <p className="form-success" role="status">User updated.</p>}

      <form action={`/api/admin/users/${user.numericId}`} method="post" className="admin-form admin-editor-form">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">Account</p>
              <h2>Username and credentials</h2>
            </div>
          </div>

          <label>
            Username
            <input type="text" name="username" value={user.username} disabled />
          </label>

          <label>
            New password (leave blank to keep current)
            <input
              type="password"
              name="password"
              placeholder="Leave blank to keep unchanged"
              autoComplete="new-password"
              minLength={8}
              maxLength={1024}
            />
          </label>

          <label>
            <input type="checkbox" name="isActive" defaultChecked={user.isActive} />
            <span>Account active</span>
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
              {sites.map((site) => {
                const existingRole = user.domainRoles.find((dr: any) => dr.siteId === site.id);
                return (
                  <div key={site.id} className="admin-role-row">
                    <strong>{site.name}</strong>
                    <div className="admin-role-options">
                      <label>
                        <input
                          type="radio"
                          name={`role-${site.id}`}
                          value="none"
                          defaultChecked={!existingRole}
                        />
                        <span>No access</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`role-${site.id}`}
                          value="reviewer"
                          defaultChecked={existingRole?.role === "reviewer"}
                        />
                        <span>Reviewer</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`role-${site.id}`}
                          value="editor"
                          defaultChecked={existingRole?.role === "editor"}
                        />
                        <span>Editor</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`role-${site.id}`}
                          value="admin"
                          defaultChecked={existingRole?.role === "admin"}
                        />
                        <span>Admin</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </fieldset>
          )}

          <div className="form-actions">
            <button className="button button-dark" type="submit">
              Save user <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
      </form>

      <details className="admin-danger-zone">
        <summary>Delete this user</summary>
        <p>This permanently removes the user account and all domain assignments.</p>
        <form action={`/api/admin/users/${user.numericId}/delete`} method="post">
          <button className="button button-danger" type="submit">
            Confirm permanent deletion
          </button>
        </form>
      </details>
    </AdminShell>
  );
}
