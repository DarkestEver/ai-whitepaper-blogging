/**
 * Editorial Workflow
 * Handles role-based approvals, revisions, and durable publishing
 */

import { IUser, Whitepaper, EditorialReviewEvent, ContentRevision, PublishingJob, nextId } from "@/lib/models";

export interface ApprovalContext {
  user: IUser;
  siteId: number;
  note: string;
}

/**
 * Check if user has permission to perform editorial action for a site
 */
export function userCanEditorialAction(user: IUser, siteId: number, action: "submit" | "approve" | "reject"): boolean {
  const roleEntry = user.domainRoles.find(r => r.siteId === siteId);
  const role = roleEntry?.role;
  if (!role) return false;

  // admin can do anything
  if (role === "admin") return true;

  // editor can submit
  if (action === "submit" && role === "editor") return true;

  // reviewer can approve/reject
  if ((action === "approve" || action === "reject") && role === "reviewer") return true;

  return false;
}

/**
 * Submit a draft for review
 * Only editors can submit; draft must not be in review already
 */
export async function submitForReview(paperId: number, ctx: ApprovalContext): Promise<void> {
  if (!userCanEditorialAction(ctx.user, ctx.siteId, "submit")) {
    throw new Error(`User ${ctx.user.username} cannot submit content for site ${ctx.siteId}`);
  }

  const paper = await Whitepaper.findOne({ numericId: paperId, siteId: ctx.siteId });
  if (!paper) throw new Error("Content not found");

  if (paper.editorialStatus !== "draft") {
    throw new Error(`Cannot submit: content is ${paper.editorialStatus}`);
  }

  // Create revision snapshot of current state
  const revisionNum = await nextId("content_revision");
  await ContentRevision.create({
    numericId: revisionNum,
    paperId,
    siteId: ctx.siteId,
    actor: ctx.user.username,
    action: "submitted",
    snapshot: paper.toObject(),
    note: ctx.note,
    occurredAt: new Date().toISOString(),
  });

  // Update status
  paper.editorialStatus = "in_review";
  await paper.save();

  // Log review event
  const eventNum = await nextId("editorial_review_event");
  await EditorialReviewEvent.create({
    numericId: eventNum,
    paperId,
    siteId: ctx.siteId,
    action: "submitted",
    actor: ctx.user.username,
    note: ctx.note,
    occurredAt: new Date().toISOString(),
  });
}

/**
 * Approve content for publishing
 * Reviewers or admins can approve; requires editorial approval + rights clearance
 */
export async function approveForPublishing(paperId: number, ctx: ApprovalContext): Promise<void> {
  if (!userCanEditorialAction(ctx.user, ctx.siteId, "approve")) {
    throw new Error(`User ${ctx.user.username} cannot approve content for site ${ctx.siteId}`);
  }

  const paper = await Whitepaper.findOne({ numericId: paperId, siteId: ctx.siteId });
  if (!paper) throw new Error("Content not found");

  if (paper.editorialStatus !== "in_review") {
    throw new Error(`Cannot approve: content is ${paper.editorialStatus}, not in_review`);
  }

  if (paper.sourceRightsStatus !== "allowed" || !paper.sourceRightsEvidence) {
    throw new Error("Cannot approve: source rights must be cleared (allowed status + evidence)");
  }

  // Create revision snapshot
  const revisionNum = await nextId("content_revision");
  await ContentRevision.create({
    numericId: revisionNum,
    paperId,
    siteId: ctx.siteId,
    actor: ctx.user.username,
    action: "approved",
    snapshot: paper.toObject(),
    note: ctx.note,
    occurredAt: new Date().toISOString(),
  });

  // Update status
  paper.editorialStatus = "approved";
  await paper.save();

  // Log review event
  const eventNum = await nextId("editorial_review_event");
  await EditorialReviewEvent.create({
    numericId: eventNum,
    paperId,
    siteId: ctx.siteId,
    action: "approved",
    actor: ctx.user.username,
    note: ctx.note,
    occurredAt: new Date().toISOString(),
  });
}

/**
 * Request changes to content
 * Reviewers or admins can request changes; reverts to draft and requires resubmission
 */
export async function requestChanges(paperId: number, ctx: ApprovalContext): Promise<void> {
  if (!userCanEditorialAction(ctx.user, ctx.siteId, "reject")) {
    throw new Error(`User ${ctx.user.username} cannot request changes for site ${ctx.siteId}`);
  }

  const paper = await Whitepaper.findOne({ numericId: paperId, siteId: ctx.siteId });
  if (!paper) throw new Error("Content not found");

  if (paper.editorialStatus !== "in_review") {
    throw new Error(`Cannot request changes: content is ${paper.editorialStatus}, not in_review`);
  }

  if (!ctx.note) {
    throw new Error("Reviewer note is required when requesting changes");
  }

  // Create revision snapshot
  const revisionNum = await nextId("content_revision");
  await ContentRevision.create({
    numericId: revisionNum,
    paperId,
    siteId: ctx.siteId,
    actor: ctx.user.username,
    action: "rejected",
    snapshot: paper.toObject(),
    note: ctx.note,
    occurredAt: new Date().toISOString(),
  });

  // Revert to draft
  paper.editorialStatus = "draft";
  await paper.save();

  // Log review event
  const eventNum = await nextId("editorial_review_event");
  await EditorialReviewEvent.create({
    numericId: eventNum,
    paperId,
    siteId: ctx.siteId,
    action: "changes_requested",
    actor: ctx.user.username,
    note: ctx.note,
    occurredAt: new Date().toISOString(),
  });
}

/**
 * Schedule approved content for publication
 * Creates a durable job queue entry for background processing
 */
export async function scheduleForPublishing(paperId: number, scheduledFor: string, siteId: number): Promise<number> {
  const paper = await Whitepaper.findOne({ numericId: paperId, siteId });
  if (!paper) throw new Error("Content not found");

  if (paper.editorialStatus !== "approved") {
    throw new Error(`Cannot schedule: content must be approved (current: ${paper.editorialStatus})`);
  }

  if (paper.sourceRightsStatus !== "allowed") {
    throw new Error("Cannot schedule: source rights not cleared");
  }

  const idempotencyKey = `${paperId}-${scheduledFor}`;
  const jobNum = await nextId("publishing_job");

  await PublishingJob.create({
    numericId: jobNum,
    paperId,
    siteId,
    status: "pending",
    scheduledFor,
    attemptCount: 0,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Update paper scheduledAt
  paper.scheduledAt = scheduledFor;
  await paper.save();

  return jobNum;
}

/**
 * Process publishing job (called by background worker)
 * Idempotent: safe to retry on failure
 */
export async function processPublishingJob(jobId: number): Promise<{ success: boolean; message: string }> {
  const job = await PublishingJob.findOne({ numericId: jobId });
  if (!job) return { success: false, message: "Job not found" };

  if (job.status === "completed") {
    return { success: true, message: "Already published" };
  }

  const now = new Date().toISOString();
  const scheduledTime = new Date(job.scheduledFor);

  if (new Date(now) < scheduledTime) {
    return { success: false, message: "Not yet scheduled time" };
  }

  try {
    job.status = "processing";
    job.updatedAt = now;
    await job.save();

    const paper = await Whitepaper.findOne({ numericId: job.paperId, siteId: job.siteId });
    if (!paper) {
      throw new Error("Content not found");
    }

    if (paper.editorialStatus !== "approved") {
      throw new Error("Content no longer approved");
    }

    // Publish the content
    paper.status = "published";
    paper.publicationDate = now;
    await paper.save();

    job.status = "completed";
    job.updatedAt = now;
    await job.save();

    return { success: true, message: "Published successfully" };
  } catch (error) {
    job.attemptCount += 1;
    job.lastError = error instanceof Error ? error.message : String(error);

    // Fail permanently after 5 attempts
    if (job.attemptCount >= 5) {
      job.status = "failed";
    } else {
      job.status = "pending";
    }

    job.updatedAt = now;
    await job.save();

    return { success: false, message: job.lastError };
  }
}

/**
 * Get pending publishing jobs due soon
 */
export async function getPendingPublishingJobs(dueSoonMs = 60_000): Promise<typeof PublishingJob[]> {
  const now = new Date();
  const soon = new Date(now.getTime() + dueSoonMs);

  return PublishingJob.find({
    status: "pending",
    scheduledFor: { $lte: soon.toISOString() },
  }).sort({ scheduledFor: 1 });
}
