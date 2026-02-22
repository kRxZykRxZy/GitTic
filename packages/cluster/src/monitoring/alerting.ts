/**
 * Alert system for cluster monitoring.
 * Defines alert rules, evaluates conditions, manages alert channels,
 * and maintains alert history.
 * @module
 */

import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

/** Alert severity levels */
export type AlertSeverity = "info" | "warning" | "critical" | "emergency";

/** Alert state */
export type AlertState = "firing" | "resolved" | "acknowledged" | "silenced";

/** Alert rule condition operator */
export type AlertOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "neq";

/** Alert rule definition */
export interface AlertRule {
  /** Rule identifier */
  id: string;
  /** Display name */
  name: string;
  /** Metric to monitor */
  metric: string;
  /** Comparison operator */
  operator: AlertOperator;
  /** Threshold value */
  threshold: number;
  /** Severity when triggered */
  severity: AlertSeverity;
  /** How many consecutive violations before firing */
  forPeriods: number;
  /** Evaluation interval in ms */
  intervalMs: number;
  /** Notification channels to use */
  channels: string[];
  /** Whether the rule is enabled */
  enabled: boolean;
  /** Description */
  description: string;
}

/** Alert channel configuration */
export interface AlertChannel {
  /** Channel identifier */
  id: string;
  /** Channel type */
  type: "log" | "webhook" | "email";
  /** Channel configuration */
  config: Record<string, unknown>;
  /** Whether the channel is enabled */
  enabled: boolean;
}

/** Active or historical alert instance */
export interface AlertInstance {
  /** Alert instance identifier */
  id: string;
  /** Rule that generated this alert */
  ruleId: string;
  /** Rule name */
  ruleName: string;
  /** Current state */
  state: AlertState;
  /** Severity */
  severity: AlertSeverity;
  /** Current metric value */
  currentValue: number;
  /** Threshold that was breached */
  threshold: number;
  /** When the alert started firing */
  firedAt: number;
  /** When the alert was resolved */
  resolvedAt: number | null;
  /** When the alert was acknowledged */
  acknowledgedAt: number | null;
  /** Who acknowledged the alert */
  acknowledgedBy: string | null;
  /** Description */
  message: string;
}

/** Internal state for evaluating a rule */
interface RuleEvaluationState {
  violationCount: number;
  lastEvaluatedAt: number;
  activeAlertId: string | null;
}

/**
 * Alert manager for cluster monitoring.
 * Evaluates alert rules against metrics and manages alert lifecycle.
 */
export class AlertManager extends EventEmitter {
  private readonly rules = new Map<string, AlertRule>();
  private readonly channels = new Map<string, AlertChannel>();
  private readonly activeAlerts = new Map<string, AlertInstance>();
  private readonly alertHistory: AlertInstance[] = [];
  private readonly evaluationState = new Map<string, RuleEvaluationState>();
  private readonly maxHistory: number;
  private evaluateTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param maxHistory - Maximum alert history entries (default: 5000)
   */
  constructor(maxHistory: number = 5000) {
    super();
    this.maxHistory = maxHistory;
  }

  /**
   * Add an alert rule.
   * @param rule - Alert rule definition
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.evaluationState.set(rule.id, {
      violationCount: 0,
      lastEvaluatedAt: 0,
      activeAlertId: null,
    });
  }

  /**
   * Remove an alert rule.
   * @param ruleId - Rule identifier
   */
  removeRule(ruleId: string): boolean {
    this.evaluationState.delete(ruleId);
    return this.rules.delete(ruleId);
  }

  /**
   * Add a notification channel.
   * @param channel - Channel configuration
   */
  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Remove a notification channel.
   * @param channelId - Channel identifier
   */
  removeChannel(channelId: string): boolean {
    return this.channels.delete(channelId);
  }

  /**
   * Evaluate a metric value against all applicable rules.
   * @param metric - Metric name
   * @param value - Current metric value
   * @returns Array of alert instances that were created or resolved
   */
  evaluate(metric: string, value: number): AlertInstance[] {
    const results: AlertInstance[] = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled || rule.metric !== metric) continue;

      const state = this.evaluationState.get(ruleId);
      if (!state) continue;

      const violated = this.checkCondition(value, rule.operator, rule.threshold);

      if (violated) {
        state.violationCount++;
        state.lastEvaluatedAt = Date.now();

        if (state.violationCount >= rule.forPeriods && !state.activeAlertId) {
          const alert = this.createAlert(rule, value);
          state.activeAlertId = alert.id;
          results.push(alert);
        }
      } else {
        state.violationCount = 0;

        if (state.activeAlertId) {
          const resolved = this.resolveAlert(state.activeAlertId);
          if (resolved) {
            state.activeAlertId = null;
            results.push(resolved);
          }
        }
      }
    }

    return results;
  }

  /**
   * Check if a value violates a condition.
   */
  private checkCondition(value: number, operator: AlertOperator, threshold: number): boolean {
    switch (operator) {
      case "gt": return value > threshold;
      case "gte": return value >= threshold;
      case "lt": return value < threshold;
      case "lte": return value <= threshold;
      case "eq": return value === threshold;
      case "neq": return value !== threshold;
      default: return false;
    }
  }

  /**
   * Create a new alert instance.
   */
  private createAlert(rule: AlertRule, value: number): AlertInstance {
    const alert: AlertInstance = {
      id: randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      state: "firing",
      severity: rule.severity,
      currentValue: value,
      threshold: rule.threshold,
      firedAt: Date.now(),
      resolvedAt: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      message: `${rule.name}: ${rule.metric} ${rule.operator} ${rule.threshold} (current: ${value})`,
    };

    this.activeAlerts.set(alert.id, alert);
    this.emit("alert:firing", alert);
    this.notifyChannels(rule.channels, alert);

    return alert;
  }

  /**
   * Resolve an active alert.
   */
  private resolveAlert(alertId: string): AlertInstance | null {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return null;

    alert.state = "resolved";
    alert.resolvedAt = Date.now();

    this.activeAlerts.delete(alertId);
    this.archiveAlert(alert);
    this.emit("alert:resolved", alert);

    return alert;
  }

  /**
   * Acknowledge an active alert.
   * @param alertId - Alert instance ID
   * @param acknowledgedBy - Who acknowledged it
   */
  acknowledge(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.state = "acknowledged";
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;

    this.emit("alert:acknowledged", alert);
    return true;
  }

  /**
   * Silence an active alert.
   * @param alertId - Alert instance ID
   */
  silence(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.state = "silenced";
    this.emit("alert:silenced", alert);
    return true;
  }

  /**
   * Notify configured channels about an alert.
   */
  private notifyChannels(channelIds: string[], alert: AlertInstance): void {
    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (channel?.enabled) {
        this.emit("notify", { channel, alert });
      }
    }
  }

  /**
   * Archive an alert to history.
   */
  private archiveAlert(alert: AlertInstance): void {
    this.alertHistory.push({ ...alert });
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory.splice(0, this.alertHistory.length - this.maxHistory);
    }
  }

  /**
   * Get all currently active alerts.
   */
  getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history.
   * @param limit - Maximum entries to return
   */
  getHistory(limit?: number): AlertInstance[] {
    if (limit && limit < this.alertHistory.length) {
      return this.alertHistory.slice(-limit);
    }
    return [...this.alertHistory];
  }

  /**
   * Get all alert rules.
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get all channels.
   */
  getChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get active alert count by severity.
   */
  getAlertCounts(): Record<AlertSeverity, number> {
    const counts: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
      emergency: 0,
    };

    for (const alert of this.activeAlerts.values()) {
      counts[alert.severity]++;
    }

    return counts;
  }
}
