import "server-only";

/**
 * Deferred Processing Queue
 *
 * PDFs are NOT processed immediately when uploaded.
 * Instead, they are queued for processing at their scheduled publish date.
 *
 * This saves massive costs:
 * - No processing for papers that never get published
 * - Only process what will actually be used
 * - Process at exact time needed (no early waste)
 */

import { ISourceDocument, IWhitepaper } from "@/lib/models";
import { generateDraftsForSource } from "@/lib/ai-drafts";

export interface QueuedPDF {
  sourceDocumentId: string;
  scheduledAt: Date;
  siteIds: number[];
  priority: "high" | "normal" | "low";
  createdAt: Date;
  processedAt?: Date;
  status: "queued" | "processing" | "completed" | "failed";
  error?: string;
}

// In-memory queue (in production, use Redis/Bull)
const processingQueue: Map<string, QueuedPDF> = new Map();
let processingInterval: NodeJS.Timeout | null = null;

/**
 * Queue a PDF for deferred processing.
 * Called when admin uploads PDF with scheduled date.
 */
export async function queuePDFForProcessing(
  sourceDocument: ISourceDocument,
  siteIds: number[],
  scheduledDate: Date,
  priority: "high" | "normal" | "low" = "normal",
): Promise<void> {
  const queuedPdf: QueuedPDF = {
    sourceDocumentId: sourceDocument.id,
    scheduledAt: scheduledDate,
    siteIds,
    priority,
    createdAt: new Date(),
    status: "queued",
  };

  const queueKey = sourceDocument.id;
  processingQueue.set(queueKey, queuedPdf);

  console.log(
    `[Deferred Processing] Queued PDF: ${sourceDocument.title}`,
    `scheduled for ${scheduledDate.toISOString()}`,
  );
}

/**
 * Start the deferred processing service.
 * Processes queued PDFs at their scheduled times.
 */
export async function startDeferredProcessingService(
  checkIntervalMs: number = 60_000,
): Promise<void> {
  if (processingInterval) {
    console.log("[Deferred Processing] Service already running");
    return;
  }

  console.log(
    `[Deferred Processing] Service started (check interval: ${checkIntervalMs}ms)`,
  );

  // Initial run
  await processQueuedPDFs();

  // Run periodically
  processingInterval = setInterval(() => {
    processQueuedPDFs().catch((error) => {
      console.error("[Deferred Processing] Error:", error);
    });
  }, checkIntervalMs);
}

/**
 * Stop the deferred processing service.
 */
export function stopDeferredProcessingService(): void {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
    console.log("[Deferred Processing] Service stopped");
  }
}

/**
 * Process PDFs that are due.
 */
async function processQueuedPDFs(): Promise<void> {
  const now = new Date();
  const itemsToProcess: QueuedPDF[] = [];

  // Find items scheduled for now or past
  for (const [key, item] of processingQueue.entries()) {
    if (item.status === "queued" && item.scheduledAt <= now) {
      itemsToProcess.push(item);
    }
  }

  if (itemsToProcess.length === 0) {
    return;
  }

  console.log(
    `[Deferred Processing] Found ${itemsToProcess.length} PDFs ready for processing`,
  );

  // Sort by priority
  itemsToProcess.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Process in order
  for (const item of itemsToProcess) {
    try {
      await processPDF(item);
    } catch (error) {
      console.error(
        `[Deferred Processing] Failed to process ${item.sourceDocumentId}:`,
        error instanceof Error ? error.message : String(error),
      );

      const queueKey = item.sourceDocumentId;
      const queuedItem = processingQueue.get(queueKey);
      if (queuedItem) {
        queuedItem.status = "failed";
        queuedItem.error = error instanceof Error ? error.message : String(error);
      }
    }
  }
}

/**
 * Process a single queued PDF.
 * This is where all the expensive operations happen:
 * - Extract PDF text
 * - Call AI API
 * - Generate cover images
 * - Create records in database
 */
async function processPDF(queuedPdf: QueuedPDF): Promise<void> {
  const queueKey = queuedPdf.sourceDocumentId;
  const item = processingQueue.get(queueKey);

  if (!item) {
    throw new Error(`Queue item not found: ${queueKey}`);
  }

  // Mark as processing
  item.status = "processing";

  console.log(
    `[Deferred Processing] Processing PDF: ${queuedPdf.sourceDocumentId}`,
  );

  try {
    // TODO: Implement actual PDF processing:
    // 1. Load SourceDocument from DB
    // 2. Call generateDraftsForSource() with only siteIds that need it
    // 3. Set status to "published" (not "draft")
    // 4. Generate cover images at this time
    // 5. Make immediately visible

    // For now, just mark as completed
    item.status = "completed";
    item.processedAt = new Date();

    console.log(
      `[Deferred Processing] Completed: ${queuedPdf.sourceDocumentId}`,
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Get queue status
 */
export function getQueueStatus(): {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
} {
  const stats = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: processingQueue.size,
  };

  for (const item of processingQueue.values()) {
    stats[item.status]++;
  }

  return stats;
}

/**
 * Get upcoming processing jobs
 */
export function getUpcomingJobs(days: number = 7): QueuedPDF[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcoming: QueuedPDF[] = [];

  for (const item of processingQueue.values()) {
    if (
      item.status === "queued" &&
      item.scheduledAt >= now &&
      item.scheduledAt <= futureDate
    ) {
      upcoming.push(item);
    }
  }

  return upcoming.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

/**
 * Get jobs that failed
 */
export function getFailedJobs(): QueuedPDF[] {
  const failed: QueuedPDF[] = [];

  for (const item of processingQueue.values()) {
    if (item.status === "failed") {
      failed.push(item);
    }
  }

  return failed;
}

/**
 * Retry a failed job
 */
export async function retryFailedJob(sourceDocumentId: string): Promise<void> {
  const item = processingQueue.get(sourceDocumentId);

  if (!item) {
    throw new Error(`Job not found: ${sourceDocumentId}`);
  }

  if (item.status !== "failed") {
    throw new Error(`Job is not failed (status: ${item.status})`);
  }

  // Reset and requeue
  item.status = "queued";
  item.error = undefined;
  item.scheduledAt = new Date(); // Process immediately

  console.log(`[Deferred Processing] Retrying failed job: ${sourceDocumentId}`);

  // Process immediately
  await processPDF(item);
}

/**
 * Clear completed jobs from queue
 */
export function clearCompletedJobs(): number {
  let cleared = 0;

  for (const [key, item] of processingQueue.entries()) {
    if (item.status === "completed") {
      processingQueue.delete(key);
      cleared++;
    }
  }

  console.log(
    `[Deferred Processing] Cleared ${cleared} completed jobs from queue`,
  );
  return cleared;
}
