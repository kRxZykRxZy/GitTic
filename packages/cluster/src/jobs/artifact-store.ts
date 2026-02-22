/**
 * Build artifact storage for cluster jobs.
 * Stores and retrieves artifacts by job ID with cleanup policies
 * and size limit enforcement.
 * @module
 */

import { randomUUID, createHash } from "node:crypto";

/** Metadata for a stored artifact */
export interface ArtifactMetadata {
  /** Unique artifact identifier */
  id: string;
  /** Job that produced this artifact */
  jobId: string;
  /** Artifact name/label */
  name: string;
  /** MIME type */
  contentType: string;
  /** Size in bytes */
  sizeBytes: number;
  /** When the artifact was stored */
  storedAt: number;
  /** When the artifact expires (null = never) */
  expiresAt: number | null;
  /** Checksum for integrity verification */
  checksum: string;
  /** Custom metadata */
  labels: Record<string, string>;
}

/** Stored artifact with content */
export interface StoredArtifact {
  /** Metadata */
  metadata: ArtifactMetadata;
  /** Raw content */
  content: Buffer;
}

/** Cleanup policy configuration */
export interface CleanupPolicy {
  /** Maximum age in milliseconds before expiration */
  maxAgeMs: number;
  /** Maximum total storage size in bytes */
  maxTotalSizeBytes: number;
  /** Maximum artifacts per job */
  maxPerJob: number;
  /** Maximum individual artifact size in bytes */
  maxArtifactSizeBytes: number;
}

/** Default cleanup policy */
const DEFAULT_POLICY: CleanupPolicy = {
  maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxTotalSizeBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  maxPerJob: 50,
  maxArtifactSizeBytes: 500 * 1024 * 1024, // 500 MB
};

/**
 * In-memory artifact store with cleanup policies and size limits.
 * Stores build artifacts associated with job IDs for later retrieval.
 */
export class ArtifactStore {
  private readonly artifacts = new Map<string, StoredArtifact>();
  private readonly jobIndex = new Map<string, Set<string>>();
  private readonly policy: CleanupPolicy;
  private totalSizeBytes = 0;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param policy - Partial cleanup policy (merged with defaults)
   */
  constructor(policy: Partial<CleanupPolicy> = {}) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  /**
   * Store an artifact for a job.
   * @param jobId - Associated job ID
   * @param name - Artifact name
   * @param content - Artifact content
   * @param contentType - MIME type (default: application/octet-stream)
   * @param labels - Optional custom labels
   * @returns Artifact metadata, or null if size limits exceeded
   */
  store(
    jobId: string,
    name: string,
    content: Buffer,
    contentType: string = "application/octet-stream",
    labels: Record<string, string> = {}
  ): ArtifactMetadata | null {
    if (content.length > this.policy.maxArtifactSizeBytes) {
      return null;
    }

    const jobArtifacts = this.jobIndex.get(jobId);
    if (jobArtifacts && jobArtifacts.size >= this.policy.maxPerJob) {
      return null;
    }

    // Check total size limit
    if (this.totalSizeBytes + content.length > this.policy.maxTotalSizeBytes) {
      this.evictOldest(content.length);
      if (this.totalSizeBytes + content.length > this.policy.maxTotalSizeBytes) {
        return null;
      }
    }

    const checksum = createHash("sha256").update(content).digest("hex");

    const metadata: ArtifactMetadata = {
      id: randomUUID(),
      jobId,
      name,
      contentType,
      sizeBytes: content.length,
      storedAt: Date.now(),
      expiresAt: Date.now() + this.policy.maxAgeMs,
      checksum,
      labels,
    };

    const artifact: StoredArtifact = { metadata, content };
    this.artifacts.set(metadata.id, artifact);

    let jobSet = this.jobIndex.get(jobId);
    if (!jobSet) {
      jobSet = new Set();
      this.jobIndex.set(jobId, jobSet);
    }
    jobSet.add(metadata.id);

    this.totalSizeBytes += content.length;

    return metadata;
  }

  /**
   * Retrieve an artifact by ID.
   * @param artifactId - Artifact identifier
   * @returns Stored artifact or undefined
   */
  get(artifactId: string): StoredArtifact | undefined {
    return this.artifacts.get(artifactId);
  }

  /**
   * List all artifacts for a job.
   * @param jobId - Job identifier
   * @returns Array of artifact metadata
   */
  listByJob(jobId: string): ArtifactMetadata[] {
    const ids = this.jobIndex.get(jobId);
    if (!ids) return [];

    const results: ArtifactMetadata[] = [];
    for (const id of ids) {
      const artifact = this.artifacts.get(id);
      if (artifact) {
        results.push(artifact.metadata);
      }
    }

    return results;
  }

  /**
   * Delete a specific artifact.
   * @param artifactId - Artifact identifier
   * @returns True if found and deleted
   */
  delete(artifactId: string): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    this.totalSizeBytes -= artifact.metadata.sizeBytes;
    this.artifacts.delete(artifactId);

    const jobSet = this.jobIndex.get(artifact.metadata.jobId);
    if (jobSet) {
      jobSet.delete(artifactId);
      if (jobSet.size === 0) {
        this.jobIndex.delete(artifact.metadata.jobId);
      }
    }

    return true;
  }

  /**
   * Delete all artifacts for a job.
   * @param jobId - Job identifier
   * @returns Number of artifacts deleted
   */
  deleteByJob(jobId: string): number {
    const ids = this.jobIndex.get(jobId);
    if (!ids) return 0;

    let count = 0;
    for (const id of ids) {
      const artifact = this.artifacts.get(id);
      if (artifact) {
        this.totalSizeBytes -= artifact.metadata.sizeBytes;
        this.artifacts.delete(id);
        count++;
      }
    }

    this.jobIndex.delete(jobId);
    return count;
  }

  /**
   * Remove expired artifacts.
   * @returns Number of artifacts cleaned up
   */
  cleanupExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [id, artifact] of this.artifacts) {
      if (artifact.metadata.expiresAt !== null && artifact.metadata.expiresAt <= now) {
        this.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Evict oldest artifacts to free up space.
   * @param bytesNeeded - Bytes that need to be freed
   */
  private evictOldest(bytesNeeded: number): void {
    const sorted = Array.from(this.artifacts.entries()).sort(
      (a, b) => a[1].metadata.storedAt - b[1].metadata.storedAt
    );

    let freed = 0;
    for (const [id] of sorted) {
      if (freed >= bytesNeeded) break;
      const artifact = this.artifacts.get(id);
      if (artifact) {
        freed += artifact.metadata.sizeBytes;
        this.delete(id);
      }
    }
  }

  /**
   * Start periodic cleanup of expired artifacts.
   * @param intervalMs - Cleanup interval (default: 5 minutes)
   */
  startCleanup(intervalMs: number = 300_000): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);
  }

  /**
   * Stop periodic cleanup.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get storage statistics.
   */
  getStats(): {
    totalArtifacts: number;
    totalSizeBytes: number;
    totalJobs: number;
    maxSizeBytes: number;
    usagePercent: number;
  } {
    return {
      totalArtifacts: this.artifacts.size,
      totalSizeBytes: this.totalSizeBytes,
      totalJobs: this.jobIndex.size,
      maxSizeBytes: this.policy.maxTotalSizeBytes,
      usagePercent: Math.round((this.totalSizeBytes / this.policy.maxTotalSizeBytes) * 100),
    };
  }
}
