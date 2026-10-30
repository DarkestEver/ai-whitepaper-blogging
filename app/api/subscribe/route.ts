import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSite } from "@/lib/request-site";
import { createNewsletterSubscriber } from "@/lib/reader-newsletter";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().max(80).default(""),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
});

export async function POST(request: NextRequest) {
  const site = await getRequestSite();
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

  const form = await request.formData();
  const parsed = subscribeSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await createNewsletterSubscriber({
      siteId: site.id,
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      frequency: parsed.data.frequency,
    });
    return NextResponse.json({ message: "Thanks for subscribing! Check your email to confirm your subscription." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Subscription failed.";
    if (msg.includes("BLOCKED")) {
      return NextResponse.json({ message: "Subscription registered. Email confirmation will be available once the newsletter service is fully configured." });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
