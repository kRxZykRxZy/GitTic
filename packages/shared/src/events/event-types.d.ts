/**
 * Base event types and infrastructure for the platform event system.
 * @module events/event-types
 */
/**
 * Severity level of an event.
 */
export type EventSeverity = "info" | "warning" | "error" | "critical";
/**
 * Source system that generated the event.
 */
export type EventSource = "api" | "worker" | "scheduler" | "webhook" | "system" | "user_action" | "integration";
/**
 * Base interface for all platform events.
 * @template TPayload - The type of the event-specific payload.
 */
export interface BaseEvent<TPayload = unknown> {
    /** Unique identifier for this event instance. */
    id: string;
    /** Fully qualified event type (e.g., "pipeline.run.completed"). */
    type: string;
    /** Version of the event schema. */
    version: number;
    /** Source system that generated the event. */
    source: EventSource;
    /** Severity level. */
    severity: EventSeverity;
    /** ID of the organization this event belongs to. */
    organizationId: string;
    /** ID of the user who triggered the event (null for system events). */
    actorId: string | null;
    /** Event-specific payload data. */
    payload: TPayload;
    /** Arbitrary metadata attached to the event. */
    metadata: EventMetadata;
    /** ISO-8601 timestamp of when the event occurred. */
    timestamp: string;
}
/**
 * Metadata attached to every event.
 */
export interface EventMetadata {
    /** Correlation ID for tracing related events. */
    correlationId: string;
    /** ID of the event that caused this event (for event chains). */
    causationId?: string;
    /** IP address of the client that initiated the action. */
    clientIp?: string;
    /** User agent of the client. */
    userAgent?: string;
    /** Additional key-value metadata. */
    extra?: Record<string, unknown>;
}
/**
 * Subscription to a specific event type or pattern.
 */
export interface EventSubscription {
    /** Unique identifier for the subscription. */
    id: string;
    /** Event type pattern to match (supports wildcards, e.g., "pipeline.*"). */
    eventPattern: string;
    /** Destination for matched events. */
    destination: EventDestination;
    /** Optional filter to narrow matched events. */
    filter?: EventFilter;
    /** Whether the subscription is active. */
    active: boolean;
    /** ISO-8601 creation timestamp. */
    createdAt: string;
}
/**
 * Destination where matched events are delivered.
 */
export interface EventDestination {
    /** Type of destination. */
    type: EventDestinationType;
    /** Configuration specific to the destination type. */
    config: Record<string, unknown>;
}
/**
 * Types of event delivery destinations.
 */
export type EventDestinationType = "webhook" | "queue" | "email" | "in_app" | "function";
/**
 * Filter criteria for narrowing event subscriptions.
 */
export interface EventFilter {
    /** Only match events from these sources. */
    sources?: EventSource[];
    /** Only match events with these severity levels. */
    severities?: EventSeverity[];
    /** Only match events in these organizations. */
    organizationIds?: string[];
    /** Only match events in these projects. */
    projectIds?: string[];
}
//# sourceMappingURL=event-types.d.ts.map