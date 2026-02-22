/**
 * Webhook configuration and delivery types.
 * @module models/webhook
 */
/**
 * HTTP methods supported for webhook delivery.
 */
export type WebhookHttpMethod = "POST" | "PUT" | "PATCH";
/**
 * Status of a webhook configuration.
 */
export type WebhookStatus = "active" | "inactive" | "failing" | "suspended";
/**
 * Content types supported for webhook payloads.
 */
export type WebhookContentType = "application/json" | "application/x-www-form-urlencoded";
/**
 * A webhook configuration belonging to a project or organization.
 */
export interface Webhook {
    /** Unique identifier for the webhook. */
    id: string;
    /** Human-readable name for the webhook. */
    name: string;
    /** Destination URL that receives the webhook payload. */
    url: string;
    /** HTTP method used for delivery. */
    method: WebhookHttpMethod;
    /** Content type of the payload. */
    contentType: WebhookContentType;
    /** Secret used to sign the payload for verification. */
    secret?: string;
    /** Events that trigger this webhook. */
    events: string[];
    /** Current status of the webhook. */
    status: WebhookStatus;
    /** Whether SSL verification is enabled. */
    sslVerification: boolean;
    /** Custom headers included with each delivery. */
    headers?: Record<string, string>;
    /** ID of the project this webhook belongs to. */
    projectId?: string;
    /** ID of the organization this webhook belongs to. */
    organizationId?: string;
    /** ISO-8601 creation timestamp. */
    createdAt: string;
    /** ISO-8601 last-updated timestamp. */
    updatedAt: string;
    /** Number of consecutive failures. */
    failureCount: number;
    /** ISO-8601 timestamp of the last successful delivery. */
    lastDeliveryAt?: string;
}
/**
 * Record of an individual webhook delivery attempt.
 */
export interface WebhookDelivery {
    /** Unique identifier for this delivery. */
    id: string;
    /** ID of the webhook configuration. */
    webhookId: string;
    /** Event type that triggered this delivery. */
    event: string;
    /** Outcome of the delivery attempt. */
    status: WebhookDeliveryStatus;
    /** HTTP status code returned by the receiver. */
    responseCode?: number;
    /** Response body returned by the receiver (truncated). */
    responseBody?: string;
    /** Duration of the request in milliseconds. */
    duration: number;
    /** ISO-8601 timestamp of the delivery attempt. */
    deliveredAt: string;
    /** Number of retry attempts made. */
    retryCount: number;
    /** Error message if the delivery failed. */
    error?: string;
}
/**
 * Delivery outcome statuses.
 */
export type WebhookDeliveryStatus = "success" | "failure" | "pending" | "timeout";
/**
 * Configuration for webhook retry behaviour.
 */
export interface WebhookRetryPolicy {
    /** Maximum number of retry attempts. */
    maxRetries: number;
    /** Initial delay in seconds before the first retry. */
    initialDelay: number;
    /** Multiplier applied to the delay on each subsequent retry. */
    backoffMultiplier: number;
    /** Maximum delay in seconds between retries. */
    maxDelay: number;
}
//# sourceMappingURL=webhook.d.ts.map