/**
 * Telemetry collector for cluster observability.
 * Collects structured telemetry events, buffers them,
 * and provides batch sending with retry logic.
 * @module
 */

import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

/** Telemetry event severity */
export type TelemetrySeverity = "debug" | "info" | "warn" | "error";

/** Structured telemetry event */
export interface TelemetryEvent {
  /** Event identifier */
  id: string;
  /** Event type/name */
  type: string;
  /** Severity level */
  severity: TelemetrySeverity;
  /** Source component */
  source: string;
  /** Node identifier */
  nodeId: string;
  /** Event payload data */
  data: Record<string, unknown>;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Trace ID for correlation */
  traceId: string | null;
  /** Span ID for correlation */
  spanId: string | null;
  /** Tags for filtering */
  tags: Record<string, string>;
}

/** Telemetry collector configuration */
export interface TelemetryConfig {
  /** Node identifier */
  nodeId: string;
  /** Maximum events to buffer before flushing */
  maxBufferSize: number;
  /** Flush interval in milliseconds */
  flushIntervalMs: number;
  /** Endpoint URL for sending telemetry */
  endpointUrl: string | null;
  /** Maximum retry attempts for failed sends */
  maxRetries: number;
  /** Minimum severity to collect */
  minSeverity: TelemetrySeverity;
  /** Whether collection is enabled */
  enabled: boolean;
}

/** Batch of events ready for sending */
export interface TelemetryBatch {
  /** Batch identifier */
  batchId: string;
  /** Events in this batch */
  events: TelemetryEvent[];
  /** When the batch was created */
  createdAt: number;
  /** Number of send attempts */
  attempts: number;
}

/** Severity order for filtering */
const SEVERITY_ORDER: Record<TelemetrySeverity, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Default configuration */
const DEFAULT_CONFIG: Omit<TelemetryConfig, "nodeId"> = {
  maxBufferSize: 1000,
  flushIntervalMs: 30_000,
  endpointUrl: null,
  maxRetries: 3,
  minSeverity: "info",
  enabled: true,
};

/**
 * Collects and buffers telemetry events for cluster observability.
 * Provides periodic flushing with retry logic and configurable filtering.
 */
export class TelemetryCollector extends EventEmitter {
  private readonly config: TelemetryConfig;
  private buffer: TelemetryEvent[] = [];
  private readonly pendingBatches: TelemetryBatch[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private totalEventsCollected = 0;
  private totalEventsSent = 0;
  private totalEventsDropped = 0;

  /**
   * @param nodeId - Node identifier
   * @param config - Partial configuration (merged with defaults)
   */
  constructor(nodeId: string, config: Partial<Omit<TelemetryConfig, "nodeId">> = {}) {
    super();
    this.config = {
      nodeId,
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Record a telemetry event.
   * Events below the minimum severity are dropped.
   * @param type - Event type/name
   * @param severity - Event severity
   * @param source - Source component
   * @param data - Event data
   * @param options - Additional options (traceId, spanId, tags)
   */
  record(
    type: string,
    severity: TelemetrySeverity,
    source: string,
    data: Record<string, unknown> = {},
    options: {
      traceId?: string;
      spanId?: string;
      tags?: Record<string, string>;
    } = {}
  ): TelemetryEvent | null {
    if (!this.config.enabled) return null;

    if (SEVERITY_ORDER[severity] < SEVERITY_ORDER[this.config.minSeverity]) {
      return null;
    }

    const event: TelemetryEvent = {
      id: randomUUID(),
      type,
      severity,
      source,
      nodeId: this.config.nodeId,
      data,
      timestamp: new Date().toISOString(),
      traceId: options.traceId ?? null,
      spanId: options.spanId ?? null,
      tags: options.tags ?? {},
    };

    this.buffer.push(event);
    this.totalEventsCollected++;

    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }

    this.emit("event:recorded", event);
    return event;
  }

  /**
   * Convenience method for recording info events.
   */
  info(type: string, source: string, data: Record<string, unknown> = {}): TelemetryEvent | null {
    return this.record(type, "info", source, data);
  }

  /**
   * Convenience method for recording warning events.
   */
  warn(type: string, source: string, data: Record<string, unknown> = {}): TelemetryEvent | null {
    return this.record(type, "warn", source, data);
  }

  /**
   * Convenience method for recording error events.
   */
  error(type: string, source: string, data: Record<string, unknown> = {}): TelemetryEvent | null {
    return this.record(type, "error", source, data);
  }

  /**
   * Flush the buffer, creating a batch for sending.
   * @returns The created batch, or null if buffer was empty
   */
  flush(): TelemetryBatch | null {
    if (this.buffer.length === 0) return null;

    const batch: TelemetryBatch = {
      batchId: randomUUID(),
      events: [...this.buffer],
      createdAt: Date.now(),
      attempts: 0,
    };

    this.buffer = [];
    this.pendingBatches.push(batch);
    this.emit("batch:created", batch);

    this.processPendingBatches();
    return batch;
  }

  /**
   * Process pending batches by attempting to send them.
   * Uses the configured endpoint URL if available.
   */
  private async processPendingBatches(): Promise<void> {
    if (!this.config.endpointUrl) {
      // No endpoint configured; just track locally
      for (const batch of this.pendingBatches) {
        this.totalEventsSent += batch.events.length;
      }
      this.pendingBatches.length = 0;
      return;
    }

    const toProcess = [...this.pendingBatches];

    for (const batch of toProcess) {
      batch.attempts++;

      try {
        await fetch(this.config.endpointUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: batch.batchId,
            events: batch.events,
            nodeId: this.config.nodeId,
          }),
        });

        this.totalEventsSent += batch.events.length;
        const idx = this.pendingBatches.indexOf(batch);
        if (idx !== -1) this.pendingBatches.splice(idx, 1);
        this.emit("batch:sent", batch);
      } catch (err) {
        if (batch.attempts >= this.config.maxRetries) {
          this.totalEventsDropped += batch.events.length;
          const idx = this.pendingBatches.indexOf(batch);
          if (idx !== -1) this.pendingBatches.splice(idx, 1);
          this.emit("batch:dropped", batch);
        }
      }
    }
  }

  /**
   * Start periodic flushing.
   */
  start(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);
  }

  /**
   * Stop periodic flushing and flush remaining events.
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  /**
   * Get collector statistics.
   */
  getStats(): {
    totalCollected: number;
    totalSent: number;
    totalDropped: number;
    bufferSize: number;
    pendingBatches: number;
    enabled: boolean;
  } {
    return {
      totalCollected: this.totalEventsCollected,
      totalSent: this.totalEventsSent,
      totalDropped: this.totalEventsDropped,
      bufferSize: this.buffer.length,
      pendingBatches: this.pendingBatches.length,
      enabled: this.config.enabled,
    };
  }

  /**
   * Enable or disable collection.
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Update the minimum severity level.
   */
  setMinSeverity(severity: TelemetrySeverity): void {
    this.config.minSeverity = severity;
  }

  /**
   * Get buffered events (without flushing).
   */
  getBuffer(): TelemetryEvent[] {
    return [...this.buffer];
  }

  /**
   * Get pending batches awaiting send.
   */
  getPendingBatches(): TelemetryBatch[] {
    return [...this.pendingBatches];
  }

  /**
   * Clear all buffered and pending events.
   */
  clear(): void {
    this.buffer = [];
    this.pendingBatches.length = 0;
  }
}
