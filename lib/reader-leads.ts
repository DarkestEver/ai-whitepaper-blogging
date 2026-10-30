/**
 * Reader Leads
 * Manages consent, verification, and protected download access
 */

import { createHash, randomBytes } from "node:crypto";
import { ReaderLead, ConsentLog, nextId } from "@/lib/models";

const VERIFICATION_TOKEN_LENGTH = 32;
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LeadRequestParams {
  siteId: number;
  paperId: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  userAgent: string;
  ipAddress: string;
  marketingConsent?: boolean;
}

/**
 * Generate a secure random verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(VERIFICATION_TOKEN_LENGTH).toString("hex");
}

function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Register a new reader lead
 * Creates a lead with unverified status, sends verification email (caller's responsibility)
 */
export async function registerReaderLead(params: LeadRequestParams): Promise<{ leadId: number; token: string }> {
  // Check for existing lead (dedup by site+paper+email)
  const existing = await ReaderLead.findOne({
    siteId: params.siteId,
    paperId: params.paperId,
    email: params.email,
  });

  if (existing) {
    if (params.marketingConsent && !existing.marketingConsent) {
      existing.marketingConsent = true;
      await existing.save();
    }
    if (existing.isVerified || new Date(existing.verificationTokenExpires) < new Date()) {
      const newToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS).toISOString();
      existing.verificationToken = hashVerificationToken(newToken);
      existing.verificationTokenExpires = expiresAt;
      existing.isVerified = false;
      existing.consentStatus = "pending";
      await existing.save();

      // Log new verification request
      const logNum = await nextId("consent_log");
      await ConsentLog.create({
        numericId: logNum,
        leadId: existing.numericId,
        siteId: params.siteId,
        action: "requested",
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        occurredAt: new Date().toISOString(),
      });

      return { leadId: existing.numericId, token: newToken };
    }
    const newToken = generateVerificationToken();
    existing.verificationToken = hashVerificationToken(newToken);
    existing.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS).toISOString();
    await existing.save();
    return { leadId: existing.numericId, token: newToken };
  }

  // Create new lead
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS).toISOString();
  const leadNum = await nextId("reader_lead");
  const now = new Date().toISOString();

  const lead = await ReaderLead.create({
    numericId: leadNum,
    siteId: params.siteId,
    paperId: params.paperId,
    email: params.email.toLowerCase(),
    firstName: params.firstName,
    lastName: params.lastName,
    company: params.company || "",
    verificationToken: hashVerificationToken(token),
    verificationTokenExpires: expiresAt,
    isVerified: false,
    consentStatus: "pending",
    marketingConsent: Boolean(params.marketingConsent),
    downloadCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Log lead creation
  const logNum = await nextId("consent_log");
  await ConsentLog.create({
    numericId: logNum,
    leadId: lead.numericId,
    siteId: params.siteId,
    action: "requested",
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
    occurredAt: now,
  });

  return { leadId: lead.numericId, token };
}

/**
 * Verify lead email via token
 */
export async function verifyLeadEmail(token: string): Promise<{ leadId: number; email: string } | null> {
  const lead = await ReaderLead.findOne({ verificationToken: hashVerificationToken(token) });
  if (!lead) return null;

  // Token expired
  if (new Date(lead.verificationTokenExpires) < new Date()) {
    return null;
  }

  lead.isVerified = true;
  lead.verificationToken = "";
  await lead.save();

  // Log verification
  const logNum = await nextId("consent_log");
  await ConsentLog.create({
    numericId: logNum,
    leadId: lead.numericId,
    siteId: lead.siteId,
    action: "verified",
    userAgent: "",
    ipAddress: "",
    occurredAt: new Date().toISOString(),
  });

  return { leadId: lead.numericId, email: lead.email };
}

/**
 * Accept consent for a verified lead
 */
export async function acceptConsent(leadId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId });
  if (!lead || !lead.isVerified) return false;

  lead.consentStatus = "accepted";
  lead.consentAcceptedAt = new Date().toISOString();
  await lead.save();

  // Log consent acceptance
  const logNum = await nextId("consent_log");
  await ConsentLog.create({
    numericId: logNum,
    leadId,
    siteId: lead.siteId,
    action: "accepted",
    userAgent: "",
    ipAddress: "",
    occurredAt: new Date().toISOString(),
  });

  return true;
}

/**
 * Decline consent for a verified lead
 */
export async function declineConsent(leadId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId });
  if (!lead || !lead.isVerified) return false;

  lead.consentStatus = "declined";
  await lead.save();

  // Log consent decline
  const logNum = await nextId("consent_log");
  await ConsentLog.create({
    numericId: logNum,
    leadId,
    siteId: lead.siteId,
    action: "declined",
    userAgent: "",
    ipAddress: "",
    occurredAt: new Date().toISOString(),
  });

  return true;
}

/**
 * Check if lead can download content
 * Must be: verified AND consent accepted
 */
export async function canDownloadContent(leadId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId });
  if (!lead) return false;

  return lead.isVerified && lead.consentStatus === "accepted";
}

export async function canDownloadPaper(leadId: number, siteId: number, paperId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId, siteId, paperId }).lean();
  return Boolean(lead?.isVerified && lead.consentStatus === "accepted");
}

/**
 * Record a download for a lead
 */
export async function recordLeadDownload(leadId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId });
  if (!lead || !lead.isVerified || lead.consentStatus !== "accepted") {
    return false;
  }

  lead.downloadCount += 1;
  lead.lastDownloadAt = new Date().toISOString();
  await lead.save();

  return true;
}

export async function recordPaperDownload(leadId: number, siteId: number, paperId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId, siteId, paperId });
  if (!lead || !lead.isVerified || lead.consentStatus !== "accepted") return false;
  lead.downloadCount += 1;
  lead.lastDownloadAt = new Date().toISOString();
  await lead.save();
  return true;
}

/**
 * Withdraw consent and delete lead data
 * GDPR-compliant data removal
 */
export async function withdrawConsent(leadId: number): Promise<boolean> {
  const lead = await ReaderLead.findOne({ numericId: leadId });
  if (!lead) return false;

  const siteId = lead.siteId;

  // Log withdrawal
  const logNum = await nextId("consent_log");
  await ConsentLog.create({
    numericId: logNum,
    leadId,
    siteId,
    action: "withdrawn",
    userAgent: "",
    ipAddress: "",
    occurredAt: new Date().toISOString(),
  });

  // Delete lead record
  await ReaderLead.deleteOne({ numericId: leadId });

  return true;
}

/**
 * Get lead details (for verification confirmation page)
 */
export async function getLeadDetails(leadId: number): Promise<{
  leadId: number;
  email: string;
  firstName: string;
  paperId: number;
  isVerified: boolean;
  consentStatus: string;
} | null> {
  const lead = await ReaderLead.findOne({ numericId: leadId });
  if (!lead) return null;

  return {
    leadId: lead.numericId,
    email: lead.email,
    firstName: lead.firstName,
    paperId: lead.paperId,
    isVerified: lead.isVerified,
    consentStatus: lead.consentStatus,
  };
}

/**
 * Get verified, consented leads for a paper (for newsletter/marketing)
 */
export async function getVerifiedLeadsForPaper(siteId: number, paperId: number): Promise<Array<{ email: string; firstName: string; lastName: string; company?: string }>> {
  const leads = await ReaderLead.find({
    siteId,
    paperId,
    isVerified: true,
    consentStatus: "accepted",
  });

  return leads.map(lead => ({
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    company: lead.company,
  }));
}
