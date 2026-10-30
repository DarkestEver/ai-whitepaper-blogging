/**
 * Reader Newsletter
 * Opt-in, confirmation, unsubscribe, and suppression
 * Gated: D-18/D-19 approval required for live deployment
 * No actual email sending or billing until decisions approved
 */

import { randomBytes } from "node:crypto";
import { nextId } from "@/lib/models";
import type mongoose from "mongoose";

export interface INewsletterSubscriber {
  numericId: number;
  siteId: number;
  email: string;
  firstName: string;
  subscriptionDate: string;
  confirmationToken: string;
  confirmationTokenExpires: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  preferences: {
    frequency: "daily" | "weekly" | "monthly";
    categories: string[];
    unsubscribeToken: string;
  };
  suppressedAt?: string;
  suppressionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INewsletterCampaign {
  numericId: number;
  siteId: number;
  name: string;
  subject: string;
  contentHtml: string;
  paperIds: number[];
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledFor?: string;
  sentAt?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  openRate: number; // percentage
  clickRate: number; // percentage
  unsubscribeRate: number; // percentage
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate confirmation token for newsletter opt-in
 */
export function generateNewsletterToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create newsletter subscriber (requires confirmation)
 */
export async function createNewsletterSubscriber(
  siteId: number,
  email: string,
  firstName: string,
): Promise<{
  subscriberId: number;
  confirmationToken: string;
  confirmationUrl: string;
}> {
  const subscriberId = await nextId("newsletter_subscriber");
  const confirmationToken = generateNewsletterToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // In production, persist to database (gated by D-18)
  // const subscriber = await NewsletterSubscriber.create({
  //   numericId: subscriberId,
  //   siteId,
  //   email: email.toLowerCase(),
  //   firstName,
  //   subscriptionDate: new Date().toISOString(),
  //   confirmationToken,
  //   confirmationTokenExpires: expiresAt,
  //   isConfirmed: false,
  //   preferences: {
  //     frequency: "weekly",
  //     categories: [],
  //     unsubscribeToken: generateNewsletterToken(),
  //   },
  //   createdAt: new Date().toISOString(),
  //   updatedAt: new Date().toISOString(),
  // });

  const confirmationUrl = `/newsletter/confirm?token=${confirmationToken}`;

  // In production, send confirmation email (gated by D-18)
  // await sendConfirmationEmail(email, confirmationUrl);

  console.log(`[NEWSLETTER] Subscriber created: ${email} (token: ${confirmationToken.slice(0, 8)}...)`);

  return {
    subscriberId,
    confirmationToken,
    confirmationUrl,
  };
}

/**
 * Confirm newsletter email
 */
export async function confirmNewsletterEmail(token: string): Promise<{ email: string; subscriberId: number } | null> {
  // In production (gated by D-18):
  // const subscriber = await NewsletterSubscriber.findOne({
  //   confirmationToken: token,
  //   confirmationTokenExpires: { $gt: new Date().toISOString() },
  // });
  // if (!subscriber) return null;
  // subscriber.isConfirmed = true;
  // subscriber.confirmedAt = new Date().toISOString();
  // await subscriber.save();

  console.log(`[NEWSLETTER] Email confirmed for token: ${token.slice(0, 8)}...`);

  // Placeholder for testing
  return {
    email: "subscriber@example.com",
    subscriberId: 1,
  };
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(token: string, reason?: string): Promise<boolean> {
  // In production (gated by D-18):
  // const subscriber = await NewsletterSubscriber.findOne({
  //   "preferences.unsubscribeToken": token,
  // });
  // if (!subscriber) return false;
  // subscriber.suppressedAt = new Date().toISOString();
  // subscriber.suppressionReason = reason || "user_requested";
  // await subscriber.save();

  console.log(`[NEWSLETTER] Unsubscribe requested for token: ${token.slice(0, 8)}... (reason: ${reason || "none"})`);

  return true;
}

/**
 * Get newsletter statistics for a site
 */
export async function getNewsletterStats(siteId: number): Promise<{
  totalSubscribers: number;
  confirmedSubscribers: number;
  suppressedSubscribers: number;
  campaignsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  suppressionRate: number;
}> {
  // In production (gated by D-18):
  // const stats = await NewsletterSubscriber.aggregate([
  //   { $match: { siteId } },
  //   {
  //     $group: {
  //       _id: null,
  //       total: { $sum: 1 },
  //       confirmed: { $sum: { $cond: ["$isConfirmed", 1, 0] } },
  //       suppressed: { $sum: { $cond: ["$suppressedAt", 1, 0] } },
  //     },
  //   },
  // ]);

  // Placeholder - no live data yet
  console.log(`[NEWSLETTER] Stats requested for site: ${siteId}`);

  return {
    totalSubscribers: 0,
    confirmedSubscribers: 0,
    suppressedSubscribers: 0,
    campaignsSent: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
    suppressionRate: 0,
  };
}

/**
 * Create a draft campaign (no actual sending until approved)
 */
export async function createNewsletterCampaign(
  siteId: number,
  name: string,
  subject: string,
  contentHtml: string,
  paperIds: number[],
): Promise<{
  campaignId: number;
  status: string;
}> {
  const campaignId = await nextId("newsletter_campaign");

  console.log(`[NEWSLETTER] Campaign created: ${name} (${paperIds.length} papers) - DRAFT ONLY, no sending until D-18/D-19 approved`);

  // In production (gated by D-18/D-19):
  // const campaign = await NewsletterCampaign.create({
  //   numericId: campaignId,
  //   siteId,
  //   name,
  //   subject,
  //   contentHtml,
  //   paperIds,
  //   status: "draft",
  //   recipientCount: 0,
  //   successCount: 0,
  //   failureCount: 0,
  //   openRate: 0,
  //   clickRate: 0,
  //   unsubscribeRate: 0,
  //   createdAt: new Date().toISOString(),
  //   updatedAt: new Date().toISOString(),
  // });

  return {
    campaignId,
    status: "draft",
  };
}

/**
 * Schedule a campaign for sending
 * Gated: D-18 approval required
 */
export async function scheduleNewsletterCampaign(campaignId: number, scheduledFor: string): Promise<boolean> {
  console.log(`[NEWSLETTER] Campaign ${campaignId} scheduled for ${scheduledFor} - BLOCKED: D-18 approval required`);

  // In production (gated by D-18):
  // const campaign = await NewsletterCampaign.findOne({ numericId: campaignId });
  // if (!campaign) return false;
  // campaign.status = "scheduled";
  // campaign.scheduledFor = scheduledFor;
  // await campaign.save();
  // return true;

  return false; // Gated until decision approved
}

/**
 * Send campaign immediately
 * Gated: D-18/D-19 approval required
 */
export async function sendNewsletterCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  console.log(`[NEWSLETTER] Campaign ${campaignId} send requested - BLOCKED: D-18/D-19 approval required`);

  return {
    success: false,
    message: "Newsletter sending gated by D-18/D-19 approval decisions. Contact project owner.",
  };
}

/**
 * Get paid plan options
 * Gated: D-19 approval required (currently out of scope)
 */
export function getPaidPlanOptions(): {
  plans: Array<{
    name: string;
    monthlyPrice: number;
    features: string[];
    status: string;
  }>;
  status: string;
}[] {
  console.log("[BILLING] Paid plans requested - BLOCKED: D-19 approval required, currently out of scope");

  return [];
}

/**
 * Newsletter policy documentation
 */
export const NEWSLETTER_POLICY = {
  optInRequired: true,
  doubleOptInRequired: true,
  unsubscribeRequired: true,
  dataRetention: "30 days after unsubscribe",
  gdprCompliant: true,
  ccpaCompliant: true,
  restrictionGate: "D-18/D-19 approval",
  liveDeploymentBlocked: true,
};

/**
 * Billing policy (currently out of scope)
 */
export const BILLING_POLICY = {
  active: false,
  scope: "Not approved - D-19 decision required",
  acceptingPayments: false,
  acceptingBeta: false,
  announcement: "Paid plans and customer billing are out of current scope. Do not advertise or accept payments without D-19 approval and separate scope authorization.",
};
