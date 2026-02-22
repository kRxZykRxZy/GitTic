import { randomUUID } from "node:crypto";
import type { Webhook } from "@platform/shared/types/repository";
import { getDb } from "../connection.js";

/** Row shape for webhooks from SQLite. */
interface WebhookRow {
  id: string;
  repository_id: string;
  name: string;
  url: string;
  events: string;
  active: number;
  secret: string | null;
  content_type: string;
  insecure_ssl: number;
  created_at: string;
  updated_at: string;
}

/** Row shape for webhook deliveries. */
interface DeliveryRow {
  id: string;
  webhook_id: string;
  event: string;
  payload: string;
  request_headers: string;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  delivered_at: string;
  created_at: string;
}

/** Webhook delivery log. */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  requestHeaders: Record<string, string>;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  deliveredAt: string;
  createdAt: string;
}

/** Map database row to Webhook type. */
function toWebhook(row: WebhookRow): Webhook {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    events: JSON.parse(row.events) as string[],
    active: row.active === 1,
    secret: row.secret ?? undefined,
    contentType: row.content_type as 'json' | 'form',
    insecureSSL: row.insecure_ssl === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map database row to WebhookDelivery type. */
function toDelivery(row: DeliveryRow): WebhookDelivery {
  return {
    id: row.id,
    webhookId: row.webhook_id,
    event: row.event,
    payload: row.payload,
    requestHeaders: JSON.parse(row.request_headers) as Record<string, string>,
    responseStatus: row.response_status ?? undefined,
    responseBody: row.response_body ?? undefined,
    error: row.error ?? undefined,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

/** Fields for creating a webhook. */
export interface CreateWebhookInput {
  repositoryId: string;
  name: string;
  url: string;
  events: string[];
  active?: boolean;
  secret?: string;
  contentType?: 'json' | 'form';
  insecureSSL?: boolean;
}

/** Fields for updating a webhook. */
export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: string[];
  active?: boolean;
  secret?: string;
  contentType?: 'json' | 'form';
  insecureSSL?: boolean;
}

/**
 * Create a new webhook.
 */
export function createWebhook(input: CreateWebhookInput): Webhook {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO webhooks (
      id, repository_id, name, url, events, active, secret, 
      content_type, insecure_ssl, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.repositoryId,
    input.name,
    input.url,
    JSON.stringify(input.events),
    input.active !== false ? 1 : 0,
    input.secret || null,
    input.contentType || 'json',
    input.insecureSSL ? 1 : 0,
    now,
    now,
  );

  return getWebhook(id)!;
}

/**
 * Get a webhook by ID.
 */
export function getWebhook(id: string): Webhook | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM webhooks WHERE id = ?")
    .get(id) as WebhookRow | undefined;
  return row ? toWebhook(row) : null;
}

/**
 * List all webhooks for a repository.
 */
export function listWebhooks(repositoryId: string): Webhook[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM webhooks WHERE repository_id = ? ORDER BY created_at DESC")
    .all(repositoryId) as WebhookRow[];
  return rows.map(toWebhook);
}

/**
 * Update webhook fields.
 */
export function updateWebhook(id: string, input: UpdateWebhookInput): Webhook | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
  if (input.url !== undefined) { sets.push("url = ?"); values.push(input.url); }
  if (input.events !== undefined) { sets.push("events = ?"); values.push(JSON.stringify(input.events)); }
  if (input.active !== undefined) { sets.push("active = ?"); values.push(input.active ? 1 : 0); }
  if (input.secret !== undefined) { sets.push("secret = ?"); values.push(input.secret); }
  if (input.contentType !== undefined) { sets.push("content_type = ?"); values.push(input.contentType); }
  if (input.insecureSSL !== undefined) { sets.push("insecure_ssl = ?"); values.push(input.insecureSSL ? 1 : 0); }

  if (sets.length === 0) return getWebhook(id);

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE webhooks SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getWebhook(id);
}

/**
 * Delete a webhook by ID.
 */
export function deleteWebhook(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM webhooks WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Activate a webhook.
 */
export function activateWebhook(id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE webhooks SET active = 1, updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Deactivate a webhook.
 */
export function deactivateWebhook(id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE webhooks SET active = 0, updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Log a webhook delivery.
 */
export function logDelivery(
  webhookId: string,
  event: string,
  payload: unknown,
  requestHeaders: Record<string, string>,
  responseStatus?: number,
  responseBody?: string,
  error?: string,
): WebhookDelivery {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO webhook_deliveries (
      id, webhook_id, event, payload, request_headers, 
      response_status, response_body, error, delivered_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    webhookId,
    event,
    JSON.stringify(payload),
    JSON.stringify(requestHeaders),
    responseStatus ?? null,
    responseBody ?? null,
    error ?? null,
    now,
    now,
  );

  return getDelivery(id)!;
}

/**
 * Get a webhook delivery by ID.
 */
export function getDelivery(id: string): WebhookDelivery | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM webhook_deliveries WHERE id = ?")
    .get(id) as DeliveryRow | undefined;
  return row ? toDelivery(row) : null;
}

/**
 * List webhook deliveries.
 */
export function listDeliveries(webhookId: string, limit = 50): WebhookDelivery[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM webhook_deliveries 
       WHERE webhook_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
    )
    .all(webhookId, limit) as DeliveryRow[];
  return rows.map(toDelivery);
}

/**
 * Delete old webhook deliveries.
 */
export function cleanupDeliveries(daysOld = 30): number {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = db
    .prepare("DELETE FROM webhook_deliveries WHERE created_at < ?")
    .run(cutoffDate.toISOString());
  
  return result.changes;
}

/**
 * Get webhook delivery statistics.
 */
export function getDeliveryStats(webhookId: string): {
  total: number;
  successful: number;
  failed: number;
  lastDelivery?: string;
} {
  const db = getDb();
  
  const stats = db
    .prepare(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful,
        COUNT(CASE WHEN response_status >= 400 OR error IS NOT NULL THEN 1 END) as failed,
        MAX(delivered_at) as last_delivery
       FROM webhook_deliveries
       WHERE webhook_id = ?`,
    )
    .get(webhookId) as {
      total: number;
      successful: number;
      failed: number;
      last_delivery: string | null;
    };

  return {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    lastDelivery: stats.last_delivery ?? undefined,
  };
}
