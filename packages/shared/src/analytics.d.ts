/** Metrics record for analytics */
export interface Metric {
    id: string;
    name: string;
    value: number;
    tags: Record<string, string>;
    clusterId?: string;
    timestamp: string;
}
/** Audit log entry */
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: string;
    ipAddress?: string;
    timestamp: string;
}
/** Page view tracking */
export interface PageView {
    id: string;
    path: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    timestamp: string;
}
/** Moderation report */
export interface ModerationReport {
    id: string;
    reporterId: string;
    targetType: "user" | "project" | "comment" | "review";
    targetId: string;
    reason: string;
    details?: string;
    status: "open" | "reviewed" | "resolved" | "dismissed";
    moderatorId?: string;
    resolution?: string;
    createdAt: string;
    resolvedAt?: string;
}
/** Feature flag */
export interface FeatureFlag {
    id: string;
    name: string;
    enabled: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
}
/** Global announcement */
export interface Announcement {
    id: string;
    title: string;
    body: string;
    type: "info" | "warning" | "critical";
    active: boolean;
    createdBy: string;
    createdAt: string;
    expiresAt?: string;
}
/** Search index entry */
export interface SearchEntry {
    id: string;
    type: "repo" | "code" | "user";
    entityId: string;
    title: string;
    content: string;
    score: number;
    updatedAt: string;
}
//# sourceMappingURL=analytics.d.ts.map