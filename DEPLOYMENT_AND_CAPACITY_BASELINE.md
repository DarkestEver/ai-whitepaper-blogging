# Deployment and Capacity Baseline

## 1. Status and intent

**Status:** Proposed deployment baseline based on the user-provided host size; provider, region, data residency, storage, workload, and production acceptance remain pending.

This document records the currently known constraint:

- Dedicated VPS application host
- 8 vCPU cores
- 8 GB RAM

This hardware constraint is not a capacity guarantee, high-availability design, or production approval. Actual capacity depends on provider CPU performance, disk I/O, network, content workload, PDF characteristics, Next.js rendering load, worker concurrency, integrations, and required service levels.

## 2. Recommended topology

### 2.1 Use the VPS as an application node

Run only application and edge components on the 8-vCPU/8-GB host:

```text
Internet
   |
DNS -> VPS public IP
   |
Firewall + TLS reverse proxy (Caddy or Nginx)
   |
Docker Compose application services
   +-- Next.js app: public renderer and admin UI
   +-- TypeScript API: modular application API
   +-- Worker: bounded queue jobs
   +-- PDF worker: isolated container, concurrency 1 initially
   +-- Metrics/log shipper (lightweight)
   |
   +--> External/private MongoDB service
   +--> External/private Redis service
   +--> S3-compatible private object storage
   +--> AI provider API (only after approval)
   +--> Transactional email provider (only after approval)
```

The Next.js app can serve both the admin interface and public multi-domain renderer, with explicit route and hostname boundaries. Keep the API as the application modular monolith unless repository discovery shows an existing, well-supported API topology that should be preserved.

### 2.2 Keep durable state off the application VPS

Recommended enterprise baseline:

- MongoDB: managed or separately hosted, private-network access only, automated backups.
- Redis: managed or separately hosted; durable job/business state must also be recorded in MongoDB.
- Object storage: private S3-compatible service with versioning or recovery controls and lifecycle policies.
- Backups: independent account or provider boundary from primary services.
- Secrets: VPS secret injection or a secret manager; never bake secret values into images or Git.

Do not place production MongoDB, Redis, original PDFs, extracted text, and application workloads on this single VPS by default. Co-locating all of them creates resource contention and makes a VPS failure a combined application, database, queue, and data outage.

If the business explicitly requires an all-in-one VPS, treat it as a lower-resilience deployment profile requiring a documented risk acceptance, external off-host backups, strict storage sizing, tested restore, and a clear migration plan. It is not the recommended enterprise profile.

## 3. Resilience classification

An application on one VPS is a **single-node deployment and a single point of failure**, regardless of whether MongoDB, Redis, and object storage are external.

It does not provide:

- application-node high availability
- uninterrupted service during host maintenance or failure
- regional failover
- guaranteed recovery time
- a specific availability percentage

Before production, the service owner must accept this risk or fund a higher-resilience topology, such as a second application node with load balancing/failover plus independently resilient data services. A second node alone is insufficient if the database, queue, DNS, or storage remains a single point of failure.

## 4. Provisional memory budget

Use this only as an initial container-budget worksheet. Validate with load tests and observed RSS under the actual workload.

| VPS memory allocation | Initial budget | Controls |
|---|---:|---|
| Linux, Docker engine, system services | 1.50 GB | Keep host monitoring and security updates enabled |
| Reverse proxy and TLS | 0.25 GB | Bounded connections and request body limits |
| Next.js admin + public SSR application | 1.25 GB | Node heap cap; observe SSR/cache behavior |
| TypeScript API | 1.00 GB | Node heap cap; bounded request/response sizes |
| Queue worker pool, including PDF job slot | 1.25 GB | Initial global concurrency 1; PDF parser separately restricted |
| Log/metrics agents | 0.50 GB | Ship logs off-host; cap buffers |
| Unallocated safety headroom | 2.25 GB | Do not assign to normal steady-state containers |
| **Total** | **8.00 GB** | Recalculate using measured peak RSS before launch |

These are planning budgets, not Docker configuration values to copy blindly. The engineering team must measure idle, average, and peak memory for:

- public SSR under realistic concurrency
- admin API operations
- one maximum-allowed PDF extraction
- one AI job plus provider response parsing
- concurrent queue retries and logging
- operating-system and container update operations

If the system cannot maintain headroom during the agreed peak scenario, reduce concurrency, move work off-host, increase VPS capacity, or change topology. Do not solve memory pressure by disabling monitoring or removing isolation.

## 5. CPU and worker concurrency

- Start with PDF extraction concurrency of 1 on this VPS.
- Start with AI-generation worker concurrency no greater than 1 until CPU, memory, queue latency, and provider rate limits are measured.
- Keep publishing/reconciliation concurrency bounded and configurable.
- Apply container CPU/memory limits to the PDF parser.
- Ensure PDF parsing has wall-clock, page, byte, decompression, and memory limits.
- Do not run OCR, bulk migration imports, search indexing, or load tests concurrently with normal traffic on the initial production node.
- Queue backpressure must hold jobs instead of allowing application memory or Redis usage to grow without bound.

Increase concurrency only with recorded load-test evidence and SRE approval.

## 6. Storage, bandwidth, and workload sizing

The user-provided host specification does not define storage capacity or workload. Do not infer a disk size, PDF limit, traffic capacity, or number of supported domains from 8 cores and 8 GB RAM.

Before sizing, gather at least:

- average and maximum daily public requests and peak requests/second
- SSR/cache hit ratio and freshness target
- number of domains and expected simultaneous traffic
- PDFs/day, maximum file bytes/pages, OCR percentage, and retention
- article generation volume, context size, provider latency/rate limits, and cost ceiling
- source/object retention and backup copies
- log volume, retention, and outbound bandwidth

Use object storage for PDFs and extracted large text. Keep VPS disk for OS, containers, bounded temporary processing space, and capped logs. Define disk alert thresholds and ensure temporary files are removed after successful or failed jobs.

## 7. Network and host security

- Use a supported Linux LTS distribution and a documented patch/update owner.
- Expose only required public ports: HTTP for redirect/acme challenge as needed and HTTPS. Restrict SSH to an approved access path (VPN/bastion/allowlist) and key-based authentication.
- Do not expose MongoDB, Redis, Docker API, or internal service ports publicly.
- Bind internal containers to a private Docker network; publish only the reverse proxy.
- Enforce HTTPS, modern TLS configuration, request size/time limits, and appropriate security headers at the proxy/application layer.
- Use a trusted-proxy allowlist; do not trust arbitrary forwarded host or client-IP headers.
- Apply outbound network controls to PDF fetching and parser workers. DNS/IP validation in application code does not replace network egress restrictions.
- Separate staging and production credentials, data, hostnames, and provider projects.
- Enable host and container security updates with a maintenance and rollback procedure.
- Keep an inventory of exposed services, firewall rules, images, ports, and owner.

## 8. Deployment and release pattern

### 8.1 Packaging

- Build immutable, versioned container images in CI.
- Pin dependencies and base images; scan images and dependencies.
- Do not build production assets on the VPS.
- Use non-root container users, read-only filesystems where practical, dropped capabilities, and resource limits.
- Store application configuration separately from image artifacts.

### 8.2 Compose and process boundaries

Docker Compose may orchestrate application containers on the single VPS, but it is not an HA mechanism. Keep service health checks, restart policies, resource controls, persistent temporary paths, and log limits explicit. Do not place secret values directly in the committed Compose file.

### 8.3 Release

1. Build and scan image in CI.
2. Run unit, integration, contract, and Playwright suites in CI.
3. Deploy the immutable build to staging.
4. Run staging black-box acceptance and rollback checks.
5. Obtain the environment/domain-specific release approvals.
6. Back up/verify required state and apply backward-compatible migrations.
7. Deploy production only under an approved change record.
8. Verify health, error rates, queues, public HTML/SEO output, and publisher state.
9. Roll back or activate a kill switch if release criteria fail.

The assistant or developer documentation does not authorize production changes.

## 9. Backup, restore, and recovery

- Database backups must be automated, encrypted, access-controlled, and stored independently of the VPS.
- Object storage must have an approved versioning/retention/recovery approach.
- Back up deployment configuration and migration metadata without committing secrets.
- Redis may be rebuilt only if all business-critical queued/job state can be recovered or reconciled from durable records.
- Document restore order, verification queries, DNS/app recovery, secret recovery, and post-restore reconciliation.
- Run and record restore drills before production and at the operations-approved cadence.
- Set RPO/RTO only after the business owner approves them; the VPS size does not imply either value.
- Document how deletions, legal holds, and backup expiry interact.

## 10. Monitoring and alerting

Host alerts:

- CPU saturation and load average
- memory pressure, OOM kills, and container restarts
- disk capacity, inode pressure, and temporary-file growth
- network and TLS/certificate expiry
- host availability and failed updates

Application alerts:

- API/public error and latency rates
- Next.js render failures and cache behavior
- queue depth, oldest age, retries, and dead-letter jobs
- PDF fetch/extraction failures and resource-limit rejections
- provider latency/failures/cost
- publication verification/reconciliation failures
- download abuse and email delivery failures

Monitoring and logs must be sent off-host where feasible so a VPS outage does not erase evidence of the outage.

## 11. Capacity test and go/no-go criteria

Before production, QA/SRE must agree the workload profile and measurable thresholds. Test:

1. baseline idle and normal workload
2. agreed peak public requests with cache behavior
3. bounded concurrent admin/API work
4. one maximum-approved PDF extraction and OCR case
5. AI provider latency/failure and retry behavior
6. queue backlog, worker restart, and recovery
7. disk pressure and log rotation
8. VPS restart/redeploy and external dependency interruption

Go only if:

- agreed workload passes without OOM, data loss, unbounded queues, or cross-site leakage
- resource headroom remains within SRE-approved limits
- configured process/container limits behave as expected
- alerts fire and the operator can pause ingestion, AI, or publishing independently
- recovery and rollback steps have been rehearsed

If the measured profile exceeds the single VPS budget, the decision is scale out/up or move work to separate workers—not to weaken isolation or safety checks.

## 12. Decision-register update

Update the project decision register as follows:

- Record the user-provided **8 vCPU / 8 GB RAM dedicated VPS** as a fixed application-host constraint for initial design.
- Keep hosting provider, region, data residency, external MongoDB/Redis/object-storage selection, disk capacity, workload, SLO, RPO/RTO, and single-node risk acceptance open until approved.
- Add a deployment-topology decision approving or rejecting the recommended external-state/single-application-node profile.
- Do not mark the VPS choice as enterprise-approved production capacity without a representative load test and operations sign-off.

