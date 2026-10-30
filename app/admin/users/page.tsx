import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { isAdminAuthenticated } from "@/lib/auth";
import { listSites } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";

export const metadata = { title: "User management", robots: { index: false, follow: false } };

export default async function UsersPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  await connectDatabase();
  const users = await User.find().sort({ username: 1 });
  const sites = await listSites();

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div>
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Link href="/admin">Control room</Link>
            <span aria-hidden="true">/</span>
            <span>Users</span>
          </nav>
          <h1>
            User <em>management.</em>
          </h1>
          <p>Create users and assign them to domains with specific roles (admin/editor/reviewer).</p>
        </div>
        <Link className="button button-dark" href="/admin/users/new">
          Create user <span aria-hidden="true">+</span>
        </Link>
      </div>

      <section className="admin-panel admin-recent">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Platform users</p>
            <h2>Active accounts</h2>
          </div>
          <span>{users.length} users</span>
        </div>
        <div className="source-record-list">
          {users.length === 0 ? (
            <p className="admin-inline-note">No users created yet. Create the first user to begin.</p>
          ) : (
            users.map((user) => (
              <article className="site-registry-item" key={user._id}>
                <div>
                  <strong>{user.username}</strong>
                  <p>
                    {user.domainRoles.length === 0
                      ? "No domain assignments"
                      : `${user.domainRoles.length} domain${user.domainRoles.length === 1 ? "" : "s"}`}
                    {!user.isActive && <span> · <em>Inactive</em></span>}
                  </p>
                  {user.domainRoles.length > 0 && (
                    <div className="admin-inline-note">
                      {user.domainRoles.map((dr: any) => {
                        const site = sites.find((s) => s.id === dr.siteId);
                        return (
                          <span key={dr.siteId}>
                            {site?.name || `Site ${dr.siteId}`} ({dr.role})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Link className="admin-text-link" href={`/admin/users/${user.numericId}`}>
                  Edit →
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}
