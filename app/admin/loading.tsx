import { AdminShell } from "@/components/admin-shell";

export default function AdminLoading() {
  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow" aria-live="polite">Loading workspace&hellip;</p>
        </div>
      </div>
    </AdminShell>
  );
}
