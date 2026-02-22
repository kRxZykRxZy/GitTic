/**
 * Cost tracking utility module.
 *
 * Tracks AI API usage per user, estimates costs based on
 * token consumption, and enforces budget limits.
 *
 * @module utils/cost-tracker
 */

/**
 * A single API usage record.
 */
export interface UsageRecord {
  /** User identifier. */
  readonly userId: string;
  /** Model used for this request. */
  readonly model: string;
  /** Number of input/prompt tokens. */
  readonly inputTokens: number;
  /** Number of output/completion tokens. */
  readonly outputTokens: number;
  /** Estimated cost in USD. */
  readonly estimatedCost: number;
  /** Timestamp of the usage (ms since epoch). */
  readonly timestamp: number;
  /** Task type that generated this usage. */
  readonly taskType: string;
}

/**
 * Per-user usage summary.
 */
export interface UserUsageSummary {
  /** User identifier. */
  readonly userId: string;
  /** Total number of requests. */
  readonly totalRequests: number;
  /** Total input tokens consumed. */
  readonly totalInputTokens: number;
  /** Total output tokens consumed. */
  readonly totalOutputTokens: number;
  /** Total estimated cost in USD. */
  readonly totalCost: number;
  /** Average cost per request. */
  readonly avgCostPerRequest: number;
  /** Most used model. */
  readonly topModel: string;
  /** Most common task type. */
  readonly topTaskType: string;
  /** First usage timestamp. */
  readonly firstUsage: number;
  /** Most recent usage timestamp. */
  readonly lastUsage: number;
}

/**
 * Budget configuration per user or global.
 */
export interface BudgetConfig {
  /** Maximum cost per day in USD. */
  readonly dailyLimitUsd: number;
  /** Maximum cost per month in USD. */
  readonly monthlyLimitUsd: number;
  /** Maximum requests per day. */
  readonly dailyRequestLimit: number;
  /** Whether to hard-block when budget is exceeded. */
  readonly hardLimit: boolean;
  /** Warning threshold as a percentage (0-1). */
  readonly warningThreshold: number;
}

/**
 * Budget check result.
 */
export interface BudgetCheck {
  /** Whether the operation is allowed. */
  readonly allowed: boolean;
  /** Current daily spend in USD. */
  readonly dailySpend: number;
  /** Current monthly spend in USD. */
  readonly monthlySpend: number;
  /** Daily requests count. */
  readonly dailyRequests: number;
  /** Whether a warning threshold has been reached. */
  readonly warning: boolean;
  /** Warning message if applicable. */
  readonly warningMessage?: string;
  /** Reason for denial if not allowed. */
  readonly denyReason?: string;
}

/**
 * Model pricing per 1000 tokens (in USD).
 */
export interface ModelPricing {
  /** Cost per 1000 input tokens. */
  readonly inputPer1k: number;
  /** Cost per 1000 output tokens. */
  readonly outputPer1k: number;
}

/**
 * Default model pricing table.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "openai": { inputPer1k: 0.005, outputPer1k: 0.015 },
  "openai-large": { inputPer1k: 0.005, outputPer1k: 0.015 },
  "mistral": { inputPer1k: 0.003, outputPer1k: 0.009 },
  "mistral-small": { inputPer1k: 0.001, outputPer1k: 0.003 },
  "llama": { inputPer1k: 0.0, outputPer1k: 0.0 },
  "deepseek": { inputPer1k: 0.001, outputPer1k: 0.002 },
} as const;

/**
 * Default budget configuration.
 */
export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  dailyLimitUsd: 10.0,
  monthlyLimitUsd: 100.0,
  dailyRequestLimit: 500,
  hardLimit: true,
  warningThreshold: 0.8,
} as const;

/**
 * Estimates the cost of an API call based on token counts and model.
 *
 * @param model - Model identifier.
 * @param inputTokens - Number of input tokens.
 * @param outputTokens - Number of output tokens.
 * @returns Estimated cost in USD.
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] ?? { inputPer1k: 0.005, outputPer1k: 0.015 };
  const inputCost = (inputTokens / 1000) * pricing.inputPer1k;
  const outputCost = (outputTokens / 1000) * pricing.outputPer1k;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

/**
 * Tracks AI API usage per user with budget enforcement.
 */
export class CostTracker {
  private readonly records: UsageRecord[] = [];
  private readonly budgetConfig: BudgetConfig;
  private readonly userBudgets: Map<string, Partial<BudgetConfig>> = new Map();

  /**
   * Creates a new CostTracker.
   *
   * @param budgetConfig - Optional global budget configuration.
   */
  constructor(budgetConfig: Partial<BudgetConfig> = {}) {
    this.budgetConfig = { ...DEFAULT_BUDGET_CONFIG, ...budgetConfig };
  }

  /**
   * Records a new API usage event.
   *
   * @param userId - User identifier.
   * @param model - Model used.
   * @param inputTokens - Input token count.
   * @param outputTokens - Output token count.
   * @param taskType - Type of task performed.
   * @returns The created usage record.
   */
  recordUsage(
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    taskType: string
  ): UsageRecord {
    const cost = estimateCost(model, inputTokens, outputTokens);

    const record: UsageRecord = {
      userId,
      model,
      inputTokens,
      outputTokens,
      estimatedCost: cost,
      timestamp: Date.now(),
      taskType,
    };

    this.records.push(record);
    return record;
  }

  /**
   * Checks whether a user is within their budget limits.
   *
   * @param userId - User identifier.
   * @returns Budget check result.
   */
  checkBudget(userId: string): BudgetCheck {
    const config = this.getUserBudget(userId);
    const now = Date.now();
    const dayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const userRecords = this.records.filter((r) => r.userId === userId);
    const dailyRecords = userRecords.filter((r) => r.timestamp >= dayStart);
    const monthlyRecords = userRecords.filter((r) => r.timestamp >= monthStart);

    const dailySpend = dailyRecords.reduce((s, r) => s + r.estimatedCost, 0);
    const monthlySpend = monthlyRecords.reduce((s, r) => s + r.estimatedCost, 0);
    const dailyRequests = dailyRecords.length;

    let allowed = true;
    let denyReason: string | undefined;
    let warning = false;
    let warningMessage: string | undefined;

    if (dailySpend >= config.dailyLimitUsd) {
      if (config.hardLimit) {
        allowed = false;
        denyReason = `Daily spending limit of $${config.dailyLimitUsd} exceeded`;
      }
    } else if (dailySpend >= config.dailyLimitUsd * config.warningThreshold) {
      warning = true;
      warningMessage = `Approaching daily limit: $${dailySpend.toFixed(4)} / $${config.dailyLimitUsd}`;
    }

    if (monthlySpend >= config.monthlyLimitUsd) {
      if (config.hardLimit) {
        allowed = false;
        denyReason = `Monthly spending limit of $${config.monthlyLimitUsd} exceeded`;
      }
    } else if (monthlySpend >= config.monthlyLimitUsd * config.warningThreshold) {
      warning = true;
      warningMessage = `Approaching monthly limit: $${monthlySpend.toFixed(4)} / $${config.monthlyLimitUsd}`;
    }

    if (dailyRequests >= config.dailyRequestLimit) {
      if (config.hardLimit) {
        allowed = false;
        denyReason = `Daily request limit of ${config.dailyRequestLimit} exceeded`;
      }
    }

    return {
      allowed,
      dailySpend,
      monthlySpend,
      dailyRequests,
      warning,
      warningMessage,
      denyReason,
    };
  }

  /**
   * Sets a custom budget for a specific user.
   *
   * @param userId - User identifier.
   * @param budget - Budget overrides for this user.
   */
  setUserBudget(userId: string, budget: Partial<BudgetConfig>): void {
    this.userBudgets.set(userId, budget);
  }

  /**
   * Returns a usage summary for a specific user.
   *
   * @param userId - User identifier.
   * @returns Usage summary for the user.
   */
  getUserSummary(userId: string): UserUsageSummary {
    const userRecords = this.records.filter((r) => r.userId === userId);

    if (userRecords.length === 0) {
      return {
        userId,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        avgCostPerRequest: 0,
        topModel: "none",
        topTaskType: "none",
        firstUsage: 0,
        lastUsage: 0,
      };
    }

    const totalInputTokens = userRecords.reduce((s, r) => s + r.inputTokens, 0);
    const totalOutputTokens = userRecords.reduce((s, r) => s + r.outputTokens, 0);
    const totalCost = userRecords.reduce((s, r) => s + r.estimatedCost, 0);

    const modelCounts = new Map<string, number>();
    const taskCounts = new Map<string, number>();

    for (const record of userRecords) {
      modelCounts.set(record.model, (modelCounts.get(record.model) ?? 0) + 1);
      taskCounts.set(record.taskType, (taskCounts.get(record.taskType) ?? 0) + 1);
    }

    const topModel = findTopKey(modelCounts);
    const topTaskType = findTopKey(taskCounts);

    return {
      userId,
      totalRequests: userRecords.length,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      avgCostPerRequest: totalCost / userRecords.length,
      topModel,
      topTaskType,
      firstUsage: userRecords[0]!.timestamp,
      lastUsage: userRecords[userRecords.length - 1]!.timestamp,
    };
  }

  /**
   * Returns the total records count.
   */
  get totalRecords(): number {
    return this.records.length;
  }

  /**
   * Returns all records for a user within a time range.
   *
   * @param userId - User identifier.
   * @param since - Start timestamp (inclusive).
   * @param until - End timestamp (inclusive).
   * @returns Array of matching usage records.
   */
  getRecords(
    userId: string,
    since?: number,
    until?: number
  ): readonly UsageRecord[] {
    return this.records.filter((r) => {
      if (r.userId !== userId) return false;
      if (since !== undefined && r.timestamp < since) return false;
      if (until !== undefined && r.timestamp > until) return false;
      return true;
    });
  }

  /**
   * Clears all records for a user.
   *
   * @param userId - User identifier.
   * @returns Number of records removed.
   */
  clearUserRecords(userId: string): number {
    const initialLength = this.records.length;
    const remaining = this.records.filter((r) => r.userId !== userId);
    this.records.length = 0;
    this.records.push(...remaining);
    return initialLength - remaining.length;
  }

  /**
   * Gets the effective budget config for a user.
   */
  private getUserBudget(userId: string): BudgetConfig {
    const userOverrides = this.userBudgets.get(userId);
    if (!userOverrides) return this.budgetConfig;
    return { ...this.budgetConfig, ...userOverrides };
  }
}

/**
 * Returns the start of day timestamp (UTC).
 *
 * @param timestamp - Current timestamp.
 * @returns Start of day timestamp.
 */
function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Returns the start of month timestamp (UTC).
 *
 * @param timestamp - Current timestamp.
 * @returns Start of month timestamp.
 */
function startOfMonth(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Finds the key with the highest count in a map.
 *
 * @param counts - Map of key to count.
 * @returns The key with the highest count.
 */
function findTopKey(counts: Map<string, number>): string {
  let topKey = "unknown";
  let topCount = 0;

  for (const [key, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topKey = key;
    }
  }

  return topKey;
}
