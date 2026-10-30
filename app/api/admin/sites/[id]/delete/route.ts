import { isAdminAuthenticated } from "@/lib/auth";
import { deleteSite } from "@/lib/db";
import { redirect } from "next/navigation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = await params;
  const siteId = Number(id);

  if (!Number.isSafeInteger(siteId) || siteId <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid site ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const deleted = await deleteSite(siteId);
    if (!deleted) {
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete site error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete site" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
