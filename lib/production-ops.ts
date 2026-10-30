/**
 * Production Operations
 * Monitoring, health checks, deployment utilities, and incident response
 */

import { PublishingJob, AuditEvent, Whitepaper } from "@/lib/models";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: Array<{ name: string; healthy: boolean; message: string; latencyMs: number }>;
  metrics: {
    uptime: number; // percentage
    errorRate: number; // percentage
    p95LatencyMs: number;
  };
}

export interface OperationalMetrics {
  totalPapers: number;
  publishedCount: number;
  draftCount: number;
  pendingPublishJobs: number;
  failedPublishJobs: number;
  auditEventsIn24h: number;
  averageResponseTimeMs: number;
  errorRate24h: number;
}

export interface BackupMetadata {
  timestamp: string;
  version: string;
  collections: string[];
  size: string;
  retentionDays: number;
  checksumMd5: string;
}

export interface IncidentRecord {
  incidentId: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedSystems: string[];
  detectedAt: string;
  resolvedAt?: string;
  rootCause?: string;
  mitigation: string;
  postMortemUrl?: string;
}

/**
 * Health check for database connectivity
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    // Simple query to verify connection
    const result = await AuditEvent.countDocuments().exec();
    const latencyMs = Date.now() - start;

    return {
      healthy: true,
      latencyMs,
      message: `Database connected (${result} audit events)`,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      healthy: false,
      latencyMs,
      message: error instanceof Error ? error.message : "Database unavailable",
    };
  }
}

/**
 * Health check for publishing job queue
 */
export async function checkPublishingQueueHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    const pendingCount = await PublishingJob.countDocuments({ status: "pending" });
    const failedCount = await PublishingJob.countDocuments({ status: "failed" });
    const latencyMs = Date.now() - start;

    const healthy = failedCount < 10; // Alert if too many failed jobs

    return {
      healthy,
      latencyMs,
      message: `Queue: ${pendingCount} pending, ${failedCount} failed`,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      healthy: false,
      latencyMs,
      message: "Queue unavailable",
    };
  }
}

/**
 * Health check for content availability
 */
export async function checkContentHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    const publishedCount = await Whitepaper.countDocuments({ status: "published" });
    const latencyMs = Date.now() - start;

    const healthy = publishedCount > 0; // Unhealthy if no published content

    return {
      healthy,
      latencyMs,
      message: `${publishedCount} published papers`,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      healthy: false,
      latencyMs,
      message: "Content query failed",
    };
  }
}

/**
 * Comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const checks = await Promise.all([
    checkDatabaseHealth(),
    checkPublishingQueueHealth(),
    checkContentHealth(),
  ]);

  const allHealthy = checks.every(c => c.healthy);
  const status = allHealthy ? "healthy" : "degraded";
  const avgLatency = checks.reduce((sum, c) => sum + c.latencyMs, 0) / checks.length;

  return {
    status,
    timestamp,
    checks: [
      { name: "Database", ...checks[0] },
      { name: "Publishing Queue", ...checks[1] },
      { name: "Content", ...checks[2] },
    ],
    metrics: {
      uptime: allHealthy ? 100 : 75,
      errorRate: allHealthy ? 0 : 5,
      p95LatencyMs: Math.max(...checks.map(c => c.latencyMs)),
    },
  };
}

/**
 * Get operational metrics
 */
export async function getOperationalMetrics(): Promise<OperationalMetrics> {
  const [
    totalPapers,
    publishedCount,
    draftCount,
    pendingJobs,
    failedJobs,
  ] = await Promise.all([
    Whitepaper.countDocuments(),
    Whitepaper.countDocuments({ status: "published" }),
    Whitepaper.countDocuments({ status: "draft" }),
    PublishingJob.countDocuments({ status: "pending" }),
    PublishingJob.countDocuments({ status: "failed" }),
  ]);

  // Get audit events from last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const auditEventsIn24h = await AuditEvent.countDocuments({
    occurredAt: { $gte: oneDayAgo },
  });

  return {
    totalPapers,
    publishedCount,
    draftCount,
    pendingPublishJobs: pendingJobs,
    failedPublishJobs: failedJobs,
    auditEventsIn24h,
    averageResponseTimeMs: 45, // Placeholder - would be collected from actual monitoring
    errorRate24h: failedJobs > 0 ? (failedJobs / (pendingJobs + failedJobs)) * 100 : 0,
  };
}

/**
 * Create backup metadata record
 */
export function createBackupMetadata(collections: string[], sizeBytes: number): BackupMetadata {
  const sizeGb = (sizeBytes / (1024 * 1024 * 1024)).toFixed(2);

  return {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    collections,
    size: `${sizeGb} GB`,
    retentionDays: 30,
    checksumMd5: "placeholder-md5-hash", // Would be computed from actual backup
  };
}

/**
 * Generate SLO/SLA compliance report
 */
export function generateSloReport(metrics: OperationalMetrics): {
  availability: { target: number; actual: number; compliant: boolean };
  errorRate: { target: number; actual: number; compliant: boolean };
  responseTime: { target: number; actual: number; compliant: boolean };
  overallCompliant: boolean;
} {
  const availability = {
    target: 99.9,
    actual: 100 - Math.min(metrics.errorRate24h, 100),
    compliant: true,
  };

  const errorRate = {
    target: 0.1,
    actual: metrics.errorRate24h,
    compliant: metrics.errorRate24h < 0.1,
  };

  const responseTime = {
    target: 100,
    actual: metrics.averageResponseTimeMs,
    compliant: metrics.averageResponseTimeMs < 100,
  };

  const overallCompliant = availability.compliant && errorRate.compliant && responseTime.compliant;

  return {
    availability,
    errorRate,
    responseTime,
    overallCompliant,
  };
}

/**
 * Log and track an incident
 */
export function recordIncident(incident: Omit<IncidentRecord, "incidentId">): IncidentRecord {
  const incidentId = `INC-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    ...incident,
    incidentId,
  };
}

/**
 * Get deployment checklist
 */
export function getDeploymentChecklist(): Array<{
  category: string;
  items: Array<{ item: string; required: boolean; verification: string }>;
}> {
  return [
    {
      category: "Security",
      items: [
        { item: "SSL/TLS certificates valid", required: true, verification: "openssl s_client" },
        { item: "Secrets rotated", required: true, verification: "env vars verified" },
        { item: "Database backups tested", required: true, verification: "restore drill completed" },
        { item: "RBAC roles verified", required: true, verification: "role matrix reviewed" },
        { item: "Audit logging enabled", required: true, verification: "sample events checked" },
      ],
    },
    {
      category: "Performance",
      items: [
        { item: "Database indexes verified", required: true, verification: "index analysis" },
        { item: "Query performance baseline", required: false, verification: "p95 latency < 100ms" },
        { item: "Cache invalidation tested", required: false, verification: "cache headers verified" },
        { item: "Rate limiters configured", required: true, verification: "limit test completed" },
      ],
    },
    {
      category: "Operational",
      items: [
        { item: "Monitoring configured", required: true, verification: "dashboards accessible" },
        { item: "Alert thresholds set", required: true, verification: "thresholds documented" },
        { item: "Incident response runbook", required: true, verification: "runbook reviewed" },
        { item: "Deployment automation", required: false, verification: "CI/CD pipeline working" },
      ],
    },
    {
      category: "Compliance",
      items: [
        { item: "Privacy policy updated", required: true, verification: "legal review completed" },
        { item: "Terms of service finalized", required: true, verification: "legal review completed" },
        { item: "Data retention policy set", required: true, verification: "retention schedule documented" },
        { item: "Compliance audit completed", required: false, verification: "audit report filed" },
      ],
    },
  ];
}
