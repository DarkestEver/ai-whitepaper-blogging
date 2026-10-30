import "server-only";

/**
 * Automatic publishing for scheduled papers.
 * Runs periodically to publish papers when their scheduled time arrives.
 * Integrates with image generation to avoid waste on drafts.
 */

import { Whitepaper } from "@/lib/models";
import { generateCover } from "@/lib/ai-drafts";
import { readSourcePdf } from "@/lib/media";

export interface ScheduledPublishingConfig {
  checkIntervalMs: number; // How often to check for scheduled papers (default: 60s)
  enableAutoPublish: boolean; // Enable automatic publishing (default: true)
  generateCoverOnPublish: boolean; // Generate cover image when publishing (default: true)
}

const DEFAULT_CONFIG: ScheduledPublishingConfig = {
  checkIntervalMs: 60_000, // Check every 60 seconds
  enableAutoPublish: true,
  generateCoverOnPublish: true,
};

let schedulingInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the scheduled publishing service.
 * Runs in background, publishes papers when their scheduled time arrives.
 */
export async function startScheduledPublishingService(
  config: Partial<ScheduledPublishingConfig> = {},
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enableAutoPublish) {
    console.log("[Scheduled Publishing] Service disabled");
    return;
  }

  if (schedulingInterval) {
    console.log("[Scheduled Publishing] Already running");
    return;
  }

  console.log(
    `[Scheduled Publishing] Starting service (check interval: ${finalConfig.checkIntervalMs}ms)`,
  );

  // Initial run
  await processScheduledPapers(finalConfig);

  // Run periodically
  schedulingInterval = setInterval(
    () => {
      processScheduledPapers(finalConfig).catch((error) => {
        console.error("[Scheduled Publishing] Error:", error);
      });
    },
    finalConfig.checkIntervalMs,
  );
}

/**
 * Stop the scheduled publishing service.
 */
export function stopScheduledPublishingService(): void {
  if (schedulingInterval) {
    clearInterval(schedulingInterval);
    schedulingInterval = null;
    console.log("[Scheduled Publishing] Service stopped");
  }
}

/**
 * Process papers that are due to be published.
 */
export async function processScheduledPapers(
  config: ScheduledPublishingConfig = DEFAULT_CONFIG,
): Promise<number> {
  if (isRunning) {
    console.warn("[Scheduled Publishing] Already processing, skipping");
    return 0;
  }

  isRunning = true;

  try {
    // Find papers with scheduledAt in the past and status = "draft"
    const now = new Date();
    const scheduledPapers = await Whitepaper.find({
      scheduledAt: { $exists: true, $ne: "", $lte: now.toISOString() },
      status: "draft",
      editorialStatus: "approved", // Only publish if approved
    });

    console.log(
      `[Scheduled Publishing] Found ${scheduledPapers.length} papers ready to publish`,
    );

    let published = 0;
    for (const paper of scheduledPapers) {
      try {
        await publishScheduledPaper(paper, config);
        published++;
      } catch (error) {
        console.error(
          `[Scheduled Publishing] Failed to publish paper ${paper.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    if (published > 0) {
      console.log(`[Scheduled Publishing] Published ${published} papers`);
    }

    return published;
  } finally {
    isRunning = false;
  }
}

/**
 * Publish a single scheduled paper.
 */
async function publishScheduledPaper(
  paper: any,
  config: ScheduledPublishingConfig,
): Promise<void> {
  console.log(`[Scheduled Publishing] Publishing: ${paper.title}`);

  // Update status to published
  paper.status = "published";
  paper.updatedAt = new Date().toISOString();

  // Generate cover image if not already present
  if (config.generateCoverOnPublish && !paper.coverImageUrl) {
    try {
      console.log(`[Scheduled Publishing] Generating cover for: ${paper.title}`);

      // Note: This is a simplified version
      // In production, you'd need to reconstruct the content object
      // and have access to the source PDF bytes

      // For now, just log that we would generate
      console.log(
        `[Scheduled Publishing] Cover generation skipped (would need source PDF bytes)`,
      );

      // TODO: Implement cover generation at publish time
      // This would require storing source PDF reference or bytes with paper
    } catch (error) {
      console.warn(
        `[Scheduled Publishing] Cover generation failed:`,
        error instanceof Error ? error.message : String(error),
      );
      // Don't fail publish if cover fails
    }
  }

  // Save to database
  await paper.save();

  console.log(`[Scheduled Publishing] Published: ${paper.title}`);
}

/**
 * Manually trigger publishing of a specific paper.
 */
export async function publishPaperNow(paperId: string): Promise<void> {
  const paper = await Whitepaper.findById(paperId);

  if (!paper) {
    throw new Error(`Paper ${paperId} not found`);
  }

  if (paper.status === "published") {
    throw new Error(`Paper ${paperId} is already published`);
  }

  if (paper.editorialStatus !== "approved") {
    throw new Error(`Paper must be approved before publishing (status: ${paper.editorialStatus})`);
  }

  await publishScheduledPaper(paper, DEFAULT_CONFIG);
}

/**
 * Get status of scheduled publishing service.
 */
export function getScheduledPublishingStatus(): {
  running: boolean;
  isProcessing: boolean;
  interval: number;
} {
  return {
    running: schedulingInterval !== null,
    isProcessing: isRunning,
    interval: DEFAULT_CONFIG.checkIntervalMs,
  };
}

/**
 * Get count of papers waiting to be published.
 */
export async function getScheduledPapersCount(): Promise<number> {
  const now = new Date();
  const count = await Whitepaper.countDocuments({
    scheduledAt: { $exists: true, $ne: "", $lte: now.toISOString() },
    status: "draft",
    editorialStatus: "approved",
  });

  return count;
}

/**
 * Get list of papers ready to publish.
 */
export async function getScheduledPapersReady(): Promise<any[]> {
  const now = new Date();
  const papers = await Whitepaper.find({
    scheduledAt: { $exists: true, $ne: "", $lte: now.toISOString() },
    status: "draft",
    editorialStatus: "approved",
  }).sort({ scheduledAt: 1 });

  return papers;
}

/**
 * Get list of papers waiting to be published (future scheduled).
 */
export async function getScheduledPapersUpcoming(
  days: number = 7,
): Promise<any[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const papers = await Whitepaper.find({
    scheduledAt: {
      $exists: true,
      $ne: "",
      $gte: now.toISOString(),
      $lte: futureDate.toISOString(),
    },
    status: "draft",
    editorialStatus: "approved",
  }).sort({ scheduledAt: 1 });

  return papers;
}
